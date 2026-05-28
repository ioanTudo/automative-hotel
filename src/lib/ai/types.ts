// Shared types for the AI Front Desk agent: the structured cards the chat UI
// renders, the tool contract (LLM-function-calling ready), and the orchestrator
// <-> provider seam so a real OpenAI/Anthropic provider can replace the mock.

import type { ZodType } from "zod";

// ---------------------------------------------------------------------------
// Cards — structured payloads the chat renders as rich blocks alongside text.
// ---------------------------------------------------------------------------

export type RoomOption = {
  roomId: string;
  name: string;
  slug: string;
  pricePerNight: number;
  capacity: number;
  amenities: string[];
  nights: number;
  totalPrice: number;
  currency: string;
};

export type RoomResultsCard = {
  type: "room_results";
  checkIn: string;
  checkOut: string;
  guests: number;
  nights: number;
  cancellationPolicy: string;
  rooms: RoomOption[];
};

export type BookingSummaryCard = {
  type: "booking_summary";
  bookingId: string;
  reference: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  specialRequests?: string | null;
  note?: string;
};

export type PaymentLinkCard = {
  type: "payment_link";
  bookingId: string;
  reference: string;
  /** Internal app route, e.g. /payment/<bookingId>. Never an external URL. */
  href: string;
  roomName: string;
  guestName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  amount: number;
  currency: string;
  status: string;
  paymentStatus: string;
};

export type InvoiceCard = {
  type: "invoice";
  invoiceNumber: string;
  url: string;
  total: number;
  currency: string;
  recipientName: string;
  recipientEmail: string;
};

export type TicketCard = {
  type: "ticket";
  ticketId: string;
  ticketType: string;
  priority: string;
  status: string;
  roomNumber?: string | null;
  message: string;
};

export type RestaurantReservationCard = {
  type: "restaurant_reservation";
  reservationId: string;
  name: string;
  date: string;
  time: string;
  guests: number;
  status: string;
};

export type Card =
  | RoomResultsCard
  | BookingSummaryCard
  | PaymentLinkCard
  | InvoiceCard
  | TicketCard
  | RestaurantReservationCard;

// ---------------------------------------------------------------------------
// Tool contract. Each tool validates its input with a Zod schema (which doubles
// as the JSON-schema source for real LLM function calling) and returns a
// ToolResult with a short natural-language `summary` plus an optional `card`.
// ---------------------------------------------------------------------------

export type ToolResult<TData = unknown> =
  | { ok: true; summary: string; data: TData; card?: Card }
  | { ok: false; error: string };

export interface ToolDefinition<TInput = unknown, TData = unknown> {
  name: string;
  description: string;
  parameters: ZodType<TInput>;
  execute(input: TInput): Promise<ToolResult<TData>>;
}

export function toolOk<TData>(
  summary: string,
  data: TData,
  card?: Card,
): ToolResult<TData> {
  return { ok: true, summary, data, card };
}

export function toolError(error: string): ToolResult<never> {
  return { ok: false, error };
}

// ---------------------------------------------------------------------------
// Conversation + orchestrator types.
// ---------------------------------------------------------------------------

export type ChatRole = "user" | "assistant" | "system" | "tool";

export type ChatMessage = {
  role: ChatRole;
  content: string;
  /** Tool name for role === "tool" messages. */
  name?: string;
};

/** Slots collected during a multi-turn booking flow. */
export type BookingDraft = {
  roomId?: string;
  roomName?: string;
  pricePerNight?: number;
  capacity?: number;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
};

export type RestaurantDraft = {
  name?: string;
  email?: string;
  phone?: string;
  date?: string;
  time?: string;
  guests?: number;
  message?: string;
};

export type TicketDraft = {
  type?: string;
  roomNumber?: string;
  guestName?: string;
  message?: string;
  priority?: string;
};

/**
 * The slot the agent is currently waiting for, used to drive multi-turn flows.
 * Round-tripped via context so the server stays stateless between turns.
 */
export type AwaitingSlot =
  | "availability_dates"
  | "book_name"
  | "book_email"
  | "book_phone"
  | "book_requests"
  | "book_confirm"
  | "lookup_modify"
  | "lookup_cancel"
  | "modify_change"
  | "restaurant_name"
  | "restaurant_email"
  | "restaurant_phone"
  | "restaurant_datetime"
  | "restaurant_guests"
  | "ticket_details";

/** Round-tripped between client and server to keep multi-turn flows stateless on the server. */
export type AgentContext = {
  awaiting?: AwaitingSlot | null;
  draft?: BookingDraft;
  restaurant?: RestaurantDraft;
  ticket?: TicketDraft;
  lastBookingId?: string;
  lastTicketId?: string;
  lastConversationId?: string;
};

export type AgentResponse = {
  reply: string;
  cards: Card[];
  quickReplies: string[];
  context: AgentContext;
};

// ---------------------------------------------------------------------------
// LLM provider seam. The mock implements this with rules; a real provider would
// implement it by calling OpenAI/Anthropic with the tool schemas. The agent
// orchestrator runs the same tool-call loop regardless of provider.
// ---------------------------------------------------------------------------

export type ToolCallRequest = { tool: string; args: Record<string, unknown> };

export type LLMTurn =
  | { kind: "tool_calls"; calls: ToolCallRequest[] }
  | {
      kind: "final";
      content: string;
      cards?: Card[];
      quickReplies?: string[];
      context?: AgentContext;
    };

export type LLMInput = {
  messages: ChatMessage[];
  context: AgentContext;
  tools: ToolDefinition[];
};

export interface LLMProvider {
  readonly name: string;
  next(input: LLMInput): Promise<LLMTurn>;
}
