import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  toolError,
  toolOk,
  type BookingSummaryCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { bookingReference, toBookingSummaryCard } from "@/lib/ai/tools/_shared";

const schema = z
  .object({
    reference: z.string().optional().describe("Booking reference or id."),
    email: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((v) => v.reference || v.email || v.phone, {
    message: "Provide a reference, email or phone to find a booking.",
  });

export type FindBookingInput = z.infer<typeof schema>;

export const findBookingTool: ToolDefinition<FindBookingInput, BookingSummaryCard> = {
  name: "findBooking",
  description:
    "Look up an existing booking by its reference, the guest's email, or phone number. Use before modifying or cancelling a booking.",
  parameters: schema,
  async execute(input) {
    // Try exact id, then reference suffix, then email/phone (most recent).
    let booking = null;

    if (input.reference) {
      booking = await prisma.booking.findUnique({
        where: { id: input.reference },
        include: { room: true },
      });
      if (!booking) {
        const ref = input.reference.toUpperCase();
        const candidates = await prisma.booking.findMany({
          include: { room: true },
          orderBy: { createdAt: "desc" },
          take: 200,
        });
        booking = candidates.find((b) => bookingReference(b.id) === ref) ?? null;
      }
    }

    if (!booking && (input.email || input.phone)) {
      booking = await prisma.booking.findFirst({
        where: {
          ...(input.email ? { guestEmail: input.email.toLowerCase() } : {}),
          ...(input.phone ? { guestPhone: input.phone } : {}),
        },
        include: { room: true },
        orderBy: { createdAt: "desc" },
      });
    }

    if (!booking) return toolError("No booking matched those details.");

    const card = toBookingSummaryCard(booking, booking.room.name);
    return toolOk(
      `Found booking ${card.reference} for ${booking.guestName} (${booking.status}).`,
      card,
      card,
    );
  },
};
