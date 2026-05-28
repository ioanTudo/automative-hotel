// Rule-based mock LLM provider. It implements the same LLMProvider contract a
// real OpenAI/Anthropic provider would, so the agent orchestrator's tool-call
// loop is identical regardless of provider. Swap this for a real model by
// implementing `next()` with the model's function-calling API and the tool
// schemas exported from src/lib/ai/tools.

import { prisma } from "@/lib/prisma";
import { SITE } from "@/lib/site";
import {
  calculateNights,
  formatCurrency,
  formatDate,
} from "@/lib/booking-utils";
import { searchKnowledgeBase } from "@/lib/ai/knowledge";
import {
  classifyTicketType,
  isNegativeSentiment,
  parseBudget,
  parseDates,
  parseEmail,
  parseGuests,
  parsePhone,
  parsePriority,
  parseTime,
} from "@/lib/ai/parsing";
import type {
  AgentContext,
  ChatMessage,
  LLMInput,
  LLMProvider,
  LLMTurn,
  ToolResult,
} from "@/lib/ai/types";

export const MAIN_QUICK_ACTIONS = [
  "Book a room",
  "Ask about rooms",
  "Restaurant",
  "Payment & invoice",
  "Modify booking",
  "Guest request",
];

function lastUserText(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  return "";
}

function isAffirmative(t: string): boolean {
  return /\b(yes|yep|yeah|confirm|confirmed|sure|ok|okay|book it|go ahead|do it|correct|that'?s right)\b/i.test(
    t,
  );
}

function isNegative(t: string): boolean {
  return /\b(no|nope|cancel|stop|nah|never mind|nevermind|don'?t)\b/i.test(t);
}

function parseRoomNumber(t: string): string | undefined {
  const m = t.match(/room\s*#?\s*(\d{1,4})/i) ?? t.match(/\b(\d{3,4})\b/);
  return m ? m[1] : undefined;
}

async function matchRoom(text: string) {
  const t = text.toLowerCase();
  const rooms = await prisma.room.findMany({ where: { isActive: true } });
  return (
    rooms.find((r) => t.includes(r.name.split(" ")[0].toLowerCase())) ?? undefined
  );
}

function final(
  content: string,
  opts: { quickReplies?: string[]; context?: AgentContext } = {},
): LLMTurn {
  return {
    kind: "final",
    content,
    quickReplies: opts.quickReplies,
    context: opts.context,
  };
}

function bookingDraftSummary(d: NonNullable<AgentContext["draft"]>): string {
  const nights =
    d.checkIn && d.checkOut ? calculateNights(d.checkIn, d.checkOut) : 0;
  const total = nights * (d.pricePerNight ?? 0);
  return [
    `• Room: ${d.roomName}`,
    `• Dates: ${d.checkIn ? formatDate(d.checkIn) : "?"} → ${d.checkOut ? formatDate(d.checkOut) : "?"} (${nights} night${nights === 1 ? "" : "s"})`,
    `• Guests: ${d.guests}`,
    `• Name: ${d.guestName}`,
    `• Email: ${d.guestEmail}`,
    `• Phone: ${d.guestPhone}`,
    d.specialRequests ? `• Requests: ${d.specialRequests}` : null,
    `• Total: ${formatCurrency(total)}`,
  ]
    .filter(Boolean)
    .join("\n");
}

export class MockLLMProvider implements LLMProvider {
  readonly name = "mock";

  async next(input: LLMInput): Promise<LLMTurn> {
    const last = input.messages[input.messages.length - 1];
    if (last?.role === "tool") {
      return this.handleToolResult(last, input.context);
    }
    return this.handleUserMessage(lastUserText(input.messages), input.context);
  }

  // -- Step 2: after a tool runs, chain another tool or produce the reply. --
  private async handleToolResult(
    toolMsg: ChatMessage,
    context: AgentContext,
  ): Promise<LLMTurn> {
    const result = JSON.parse(toolMsg.content) as ToolResult;
    const name = toolMsg.name ?? "";

    if (!result.ok) {
      return final(`I'm sorry — ${result.error}`, {
        quickReplies: MAIN_QUICK_ACTIONS,
        context: { ...context, awaiting: null },
      });
    }

    // result.data mirrors the card for most tools.
    const data = result.data as Record<string, unknown>;

    switch (name) {
      case "checkAvailability": {
        const rooms = (data.rooms as { name: string }[]) ?? [];
        if (rooms.length === 0) {
          return final(
            "I couldn't find anything for those dates. Would you like to try different dates?",
            {
              quickReplies: ["Try other dates"],
              context: { ...context, awaiting: "availability_dates" },
            },
          );
        }
        return final(
          `Here ${rooms.length === 1 ? "is" : "are"} ${rooms.length} option${rooms.length === 1 ? "" : "s"} for your dates. Tap a room to book it.`,
          {
            quickReplies: rooms.map((r) => `Book the ${r.name}`),
            context: {
              ...context,
              awaiting: null,
              draft: {
                ...context.draft,
                checkIn: data.checkIn as string,
                checkOut: data.checkOut as string,
                guests: data.guests as number,
              },
            },
          },
        );
      }

      case "createBooking": {
        // Chain into payment link generation.
        return { kind: "tool_calls", calls: [{ tool: "createPaymentLink", args: { bookingId: data.bookingId } }] };
      }

      case "createPaymentLink": {
        return final(
          `Your booking is ready. Use the secure payment card below to complete your payment. After payment, your confirmation and invoice will be sent to your email.`,
          {
            quickReplies: ["I've paid", "Email me an invoice", "Modify booking"],
            context: {
              ...context,
              awaiting: null,
              draft: undefined,
              lastBookingId: data.bookingId as string,
            },
          },
        );
      }

      case "sendBookingConfirmationEmail": {
        // Payment confirmed → generate the invoice next.
        const bookingId = (data.bookingId as string) ?? context.lastBookingId;
        return { kind: "tool_calls", calls: [{ tool: "generateInvoice", args: { bookingId } }] };
      }

      case "generateInvoice": {
        const bookingId = context.lastBookingId;
        if (bookingId) {
          return { kind: "tool_calls", calls: [{ tool: "sendInvoiceEmail", args: { bookingId } }] };
        }
        return final(`Invoice ${data.invoiceNumber} is ready: ${data.url}`, {
          quickReplies: MAIN_QUICK_ACTIONS,
          context: { ...context, awaiting: null },
        });
      }

      case "sendInvoiceEmail": {
        return final(
          "All set! I've emailed your booking confirmation and invoice. Is there anything else I can help with?",
          {
            quickReplies: ["Guest request", "Restaurant", "No, thanks"],
            context: { ...context, awaiting: null },
          },
        );
      }

      case "findBooking": {
        const bookingId = data.bookingId as string;
        if (context.awaiting === "lookup_cancel") {
          return { kind: "tool_calls", calls: [{ tool: "cancelBooking", args: { bookingId } }] };
        }
        return final(
          `I found your booking ${data.reference} for the ${data.roomName} (${data.status}). What would you like to change — dates, number of guests, the room, or shall I cancel it?`,
          {
            quickReplies: ["Change dates", "Add a guest", "Cancel booking", "Email me an invoice"],
            context: { ...context, awaiting: "modify_change", lastBookingId: bookingId },
          },
        );
      }

      case "modifyBooking": {
        return final(`Done — your booking is updated. ${data.note ?? ""}`.trim(), {
          quickReplies: MAIN_QUICK_ACTIONS,
          context: { ...context, awaiting: null },
        });
      }

      case "cancelBooking": {
        return final(`${data.note ?? "Your booking has been cancelled."}`, {
          quickReplies: MAIN_QUICK_ACTIONS,
          context: { ...context, awaiting: null, lastBookingId: undefined },
        });
      }

      case "createSupportTicket": {
        const priority = data.priority as string;
        const ticketType = data.ticketType as string;
        if (priority === "urgent" || ticketType === "complaint") {
          return {
            kind: "tool_calls",
            calls: [
              {
                tool: "escalateToHuman",
                args: { ticketId: data.ticketId, conversationId: context.lastConversationId },
              },
            ],
          };
        }
        return final(
          "I've logged your request and our team will take care of it shortly. Anything else?",
          {
            quickReplies: ["Another request", "No, thanks"],
            context: { ...context, awaiting: null, lastTicketId: data.ticketId as string },
          },
        );
      }

      case "escalateToHuman": {
        return final(
          "I've escalated this to our team as urgent — a staff member will follow up with you very shortly. I'm sorry again for the trouble.",
          {
            quickReplies: ["No, thanks"],
            context: { ...context, awaiting: null },
          },
        );
      }

      case "createRestaurantReservation": {
        return final(
          `Your table request is in for ${formatDate(data.date as string)} at ${data.time} for ${data.guests}. The restaurant will confirm by email shortly.`,
          {
            quickReplies: MAIN_QUICK_ACTIONS,
            context: { ...context, awaiting: null, restaurant: undefined },
          },
        );
      }

      default:
        return final("Done.", { quickReplies: MAIN_QUICK_ACTIONS, context });
    }
  }

  // -- Step 1: interpret the user's message + context into tools or a reply. --
  private async handleUserMessage(
    text: string,
    context: AgentContext,
  ): Promise<LLMTurn> {
    const t = text.toLowerCase().trim();

    // Continue an in-progress multi-turn flow first.
    if (context.awaiting) {
      const handled = await this.handleAwaiting(text, context);
      if (handled) return handled;
    }

    // Greeting.
    if (/^(hi|hey|hello|good (morning|afternoon|evening)|yo)\b/.test(t) && t.length < 30) {
      return final(
        `Hello! I'm the ${SITE.name} front desk assistant. I can check availability, book and pay for a room, send invoices, take restaurant reservations and handle any request during your stay. What can I do for you?`,
        { quickReplies: MAIN_QUICK_ACTIONS },
      );
    }

    // Payment / invoice on an existing booking.
    if (context.lastBookingId) {
      if (/\bi'?ve paid\b|\bpaid\b|payment done|completed payment/.test(t)) {
        return { kind: "tool_calls", calls: [{ tool: "sendBookingConfirmationEmail", args: { bookingId: context.lastBookingId } }] };
      }
      if (/invoice|receipt/.test(t)) {
        return { kind: "tool_calls", calls: [{ tool: "generateInvoice", args: { bookingId: context.lastBookingId } }] };
      }
      if (/payment link|pay (now|again)|how (do|can) i pay/.test(t)) {
        return { kind: "tool_calls", calls: [{ tool: "createPaymentLink", args: { bookingId: context.lastBookingId } }] };
      }
    }

    // Modify / cancel an existing booking.
    if (/\bcancel\b/.test(t) && /book|reservation|stay|room/.test(t)) {
      return final("I can help with that. What's your booking reference, or the email you booked with?", {
        context: { ...context, awaiting: "lookup_cancel" },
      });
    }
    if (/\b(change|modify|reschedule|update|amend|upgrade)\b/.test(t) && /book|reservation|date|stay|room|guest/.test(t)) {
      return final("Sure. What's your booking reference, or the email you booked with?", {
        context: { ...context, awaiting: "lookup_modify" },
      });
    }

    // Restaurant reservation (distinct from restaurant info questions).
    if (/\b(table|reserve|reservation)\b/.test(t) && /restaurant|table|dinner|lunch|dine/.test(t)) {
      const restaurant = {
        guests: parseGuests(text),
        date: parseDates(text).checkIn,
        time: parseTime(text),
      };
      return final("Lovely — I'll book a table at The Garden Table. What name should it be under?", {
        context: { ...context, awaiting: "restaurant_name", restaurant },
      });
    }

    // Guest request / problem → support ticket. Checked before room search so
    // "the room is dirty" or "AC in room 204 not working" is treated as a
    // request, not an availability query.
    if (this.looksLikeRequest(t)) {
      return {
        kind: "tool_calls",
        calls: [
          {
            tool: "createSupportTicket",
            args: {
              type: classifyTicketType(text),
              message: text,
              roomNumber: parseRoomNumber(text),
              priority: parsePriority(text),
              conversationId: context.lastConversationId,
            },
          },
        ],
      };
    }

    // "Guest request" quick action or a request without details yet.
    if (/^guest request$|\b(make|have|submit|raise) a request\b|i have a request/i.test(t)) {
      return final(
        "Of course — what do you need? (e.g. extra towels for room 210, or 'the TV isn't working')",
        { context: { ...context, awaiting: "ticket_details" } },
      );
    }

    // Booking a specific named room ("book the double room").
    if (/\bbook\b|\breserve\b|\bi'?d like\b|\bi want\b/.test(t)) {
      const room = await matchRoom(text);
      if (room) {
        const parsed = parseDraftFrom(text);
        const draft = { ...context.draft };
        if (parsed.checkIn) draft.checkIn = parsed.checkIn;
        if (parsed.checkOut) draft.checkOut = parsed.checkOut;
        if (parsed.guests) draft.guests = parsed.guests;
        draft.roomId = room.id;
        draft.roomName = room.name;
        draft.pricePerNight = room.pricePerNight;
        draft.capacity = room.capacity;
        if (!draft.checkIn || !draft.checkOut) {
          return final(
            `Great choice — the ${room.name}. What are your check-in and check-out dates? (e.g. 2026-06-10 to 2026-06-12)`,
            { context: { ...context, draft, awaiting: "availability_dates" } },
          );
        }
        if (draft.guests && draft.guests > room.capacity) {
          return final(
            `The ${room.name} holds up to ${room.capacity} guest(s). Would you like a larger room instead?`,
            { quickReplies: ["Ask about rooms"], context: { ...context, draft } },
          );
        }
        return final("Perfect. What name should the booking be under?", {
          context: { ...context, draft, awaiting: "book_name" },
        });
      }
    }

    // Availability / room discovery.
    if (/\b(room|rooms|available|availability|vacancy|stay|night|book|cheapest|recommend|suite|double|single|twin|family|deluxe)\b/.test(t)) {
      const dates = parseDates(text);
      const guests = parseGuests(text);
      const maxPrice = parseBudget(text);
      if (dates.checkIn && dates.checkOut) {
        return {
          kind: "tool_calls",
          calls: [
            {
              tool: "checkAvailability",
              args: { checkIn: dates.checkIn, checkOut: dates.checkOut, guests, maxPrice },
            },
          ],
        };
      }
      return final(
        "I'd be glad to find you a room. What are your check-in and check-out dates, and how many guests? (e.g. 2026-06-10 to 2026-06-12 for 2 guests)",
        {
          context: {
            ...context,
            awaiting: "availability_dates",
            draft: { ...context.draft, guests },
          },
        },
      );
    }

    // General support → knowledge base.
    const kb = await searchKnowledgeBase(text);
    if (kb.length > 0) {
      return final(kb.map((m) => m.content).join("\n\n"), {
        quickReplies: MAIN_QUICK_ACTIONS,
      });
    }

    // Fallback.
    return final(
      "I can help with rooms and bookings, payments and invoices, restaurant reservations, and any request during your stay. What would you like to do?",
      { quickReplies: MAIN_QUICK_ACTIONS },
    );
  }

  private looksLikeRequest(t: string): boolean {
    return (
      isNegativeSentiment(t) ||
      /\b(not working|doesn'?t work|does not work|broken|leak|leaking|filthy|dirty|smell|noisy|noise|towels?|pillow|blanket|sheets?|cleaning|clean the room|clean my room|extra (?:towel|towels|pillow|blanket|bed|water)|room service|lost|iron|hair ?dryer|repair|maintenance|housekeeping)\b/.test(
        t,
      )
    );
  }

  private async handleAwaiting(
    text: string,
    context: AgentContext,
  ): Promise<LLMTurn | null> {
    const t = text.toLowerCase().trim();
    const draft = { ...(context.draft ?? {}) };
    const restaurant = { ...(context.restaurant ?? {}) };

    switch (context.awaiting) {
      case "availability_dates": {
        const dates = parseDates(text);
        const guests = parseGuests(text) ?? draft.guests;
        const maxPrice = parseBudget(text);
        if (dates.checkIn) draft.checkIn = dates.checkIn;
        if (dates.checkOut) draft.checkOut = dates.checkOut;
        if (guests) draft.guests = guests;

        if (draft.checkIn && draft.checkOut) {
          // If a room was already chosen, move to collecting guest details.
          if (draft.roomId) {
            if (!draft.guests) draft.guests = 1;
            return final("Great. What name should the booking be under?", {
              context: { ...context, draft, awaiting: "book_name" },
            });
          }
          return {
            kind: "tool_calls",
            calls: [
              {
                tool: "checkAvailability",
                args: { checkIn: draft.checkIn, checkOut: draft.checkOut, guests: draft.guests, maxPrice },
              },
            ],
          };
        }
        return final(
          "Please share both your check-in and check-out dates, e.g. 2026-06-10 to 2026-06-12.",
          { context: { ...context, draft, awaiting: "availability_dates" } },
        );
      }

      case "book_name": {
        draft.guestName = text.trim();
        return final("Thanks! What's the best email for your confirmation?", {
          context: { ...context, draft, awaiting: "book_email" },
        });
      }

      case "book_email": {
        const email = parseEmail(text);
        if (!email) {
          return final("That doesn't look like an email — could you re-enter it?", {
            context: { ...context, draft, awaiting: "book_email" },
          });
        }
        draft.guestEmail = email;
        return final("Got it. And a phone number in case we need to reach you?", {
          context: { ...context, draft, awaiting: "book_phone" },
        });
      }

      case "book_phone": {
        const phone = parsePhone(text) ?? text.trim();
        draft.guestPhone = phone;
        return final("Any special requests? (e.g. high floor, late arrival — or say 'no')", {
          context: { ...context, draft, awaiting: "book_requests" },
        });
      }

      case "book_requests": {
        draft.specialRequests = /^(no|none|nope|nothing|n\/a)\b/.test(t) ? "" : text.trim();
        return final(`Here's your booking summary:\n\n${bookingDraftSummary(draft)}\n\nShall I confirm it?`, {
          quickReplies: ["Confirm booking", "Cancel"],
          context: { ...context, draft, awaiting: "book_confirm" },
        });
      }

      case "book_confirm": {
        if (isNegative(t)) {
          return final("No problem — I won't book it. Anything else I can help with?", {
            quickReplies: MAIN_QUICK_ACTIONS,
            context: { ...context, draft: undefined, awaiting: null },
          });
        }
        if (isAffirmative(t)) {
          if (!draft.roomId || !draft.checkIn || !draft.checkOut || !draft.guestName || !draft.guestEmail || !draft.guestPhone) {
            return final("It looks like some details are missing. Let's start the booking again — which room and dates would you like?", {
              context: { ...context, draft: undefined, awaiting: null },
            });
          }
          return {
            kind: "tool_calls",
            calls: [
              {
                tool: "createBooking",
                args: {
                  roomId: draft.roomId,
                  guestName: draft.guestName,
                  guestEmail: draft.guestEmail,
                  guestPhone: draft.guestPhone,
                  checkIn: draft.checkIn,
                  checkOut: draft.checkOut,
                  guests: draft.guests ?? 1,
                  specialRequests: draft.specialRequests || undefined,
                },
              },
            ],
          };
        }
        return final("Just to confirm — shall I go ahead and book it?", {
          quickReplies: ["Confirm booking", "Cancel"],
          context: { ...context, draft, awaiting: "book_confirm" },
        });
      }

      case "lookup_modify":
      case "lookup_cancel": {
        const reference = text.match(/[A-Z0-9]{6,}/i)?.[0];
        const email = parseEmail(text);
        const phone = parsePhone(text);
        if (!reference && !email && !phone) {
          return final("I need your booking reference, email or phone to find it. Could you share one?", {
            context,
          });
        }
        return {
          kind: "tool_calls",
          calls: [{ tool: "findBooking", args: { reference, email, phone } }],
        };
      }

      case "modify_change": {
        const bookingId = context.lastBookingId;
        if (!bookingId) {
          return final("I lost track of which booking — what's your reference or email?", {
            context: { ...context, awaiting: "lookup_modify" },
          });
        }
        if (/cancel/.test(t)) {
          return { kind: "tool_calls", calls: [{ tool: "cancelBooking", args: { bookingId } }] };
        }
        if (/invoice|receipt/.test(t)) {
          return { kind: "tool_calls", calls: [{ tool: "generateInvoice", args: { bookingId } }] };
        }
        const dates = parseDates(text);
        const guests = parseGuests(text);
        if (dates.checkIn || dates.checkOut || guests) {
          return {
            kind: "tool_calls",
            calls: [
              {
                tool: "modifyBooking",
                args: {
                  bookingId,
                  checkIn: dates.checkIn,
                  checkOut: dates.checkOut,
                  guests,
                },
              },
            ],
          };
        }
        return final("What would you like to change? You can give me new dates, a new guest count, or say 'cancel'.", {
          quickReplies: ["Cancel booking", "Email me an invoice"],
          context,
        });
      }

      case "restaurant_name": {
        restaurant.name = text.trim();
        return final("Thanks. What's a good email to confirm the table?", {
          context: { ...context, restaurant, awaiting: "restaurant_email" },
        });
      }
      case "restaurant_email": {
        const email = parseEmail(text);
        if (!email) return final("Could you re-enter the email please?", { context: { ...context, restaurant, awaiting: "restaurant_email" } });
        restaurant.email = email;
        return final("And a contact phone number?", {
          context: { ...context, restaurant, awaiting: "restaurant_phone" },
        });
      }
      case "restaurant_phone": {
        restaurant.phone = parsePhone(text) ?? text.trim();
        if (restaurant.date && restaurant.time) {
          return this.maybeBookTable(restaurant, context);
        }
        return final("What date and time would you like? (e.g. 2026-06-10 at 19:30)", {
          context: { ...context, restaurant, awaiting: "restaurant_datetime" },
        });
      }
      case "restaurant_datetime": {
        const date = parseDates(text).checkIn;
        const time = parseTime(text);
        if (date) restaurant.date = date;
        if (time) restaurant.time = time;
        if (!restaurant.date || !restaurant.time) {
          return final("Please give me both a date and a time, e.g. 2026-06-10 at 19:30.", {
            context: { ...context, restaurant, awaiting: "restaurant_datetime" },
          });
        }
        if (!restaurant.guests) {
          return final("How many guests will be dining?", {
            context: { ...context, restaurant, awaiting: "restaurant_guests" },
          });
        }
        return this.maybeBookTable(restaurant, context);
      }
      case "restaurant_guests": {
        const guests = parseGuests(text) ?? Number(text.match(/\d+/)?.[0]);
        if (!guests) return final("How many guests? A number is fine.", { context: { ...context, restaurant, awaiting: "restaurant_guests" } });
        restaurant.guests = guests;
        return this.maybeBookTable(restaurant, context);
      }

      case "ticket_details": {
        return {
          kind: "tool_calls",
          calls: [
            {
              tool: "createSupportTicket",
              args: {
                type: classifyTicketType(text),
                message: text.trim(),
                roomNumber: parseRoomNumber(text),
                priority: parsePriority(text),
                conversationId: context.lastConversationId,
              },
            },
          ],
        };
      }

      default:
        return null;
    }
  }

  private maybeBookTable(
    restaurant: NonNullable<AgentContext["restaurant"]>,
    context: AgentContext,
  ): LLMTurn {
    if (restaurant.name && restaurant.email && restaurant.phone && restaurant.date && restaurant.time && restaurant.guests) {
      return {
        kind: "tool_calls",
        calls: [
          {
            tool: "createRestaurantReservation",
            args: {
              name: restaurant.name,
              email: restaurant.email,
              phone: restaurant.phone,
              date: restaurant.date,
              time: restaurant.time,
              guests: restaurant.guests,
            },
          },
        ],
      };
    }
    return final("Let me get the remaining details — what date, time and party size?", {
      context: { ...context, restaurant, awaiting: "restaurant_datetime" },
    });
  }
}

// Parse any booking slots that happen to be present in a single message.
function parseDraftFrom(text: string): {
  checkIn?: string;
  checkOut?: string;
  guests?: number;
} {
  const dates = parseDates(text);
  return {
    checkIn: dates.checkIn,
    checkOut: dates.checkOut,
    guests: parseGuests(text),
  };
}

export const mockLLM = new MockLLMProvider();
