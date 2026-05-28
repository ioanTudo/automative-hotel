import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  calculateTotalPrice,
  hasBookingConflict,
  validateDateRange,
} from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type BookingSummaryCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { toBookingSummaryCard } from "@/lib/ai/tools/_shared";

const schema = z.object({
  roomId: z.string().min(1),
  guestName: z.string().min(2),
  guestEmail: z.string().email(),
  guestPhone: z.string().min(5),
  checkIn: z.string(),
  checkOut: z.string(),
  guests: z.number().int().positive(),
  specialRequests: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof schema>;

export const createBookingTool: ToolDefinition<
  CreateBookingInput,
  BookingSummaryCard
> = {
  name: "createBooking",
  description:
    "Create a booking once all guest and stay details are collected. Booking is created with status pending_payment (unpaid) and a summary is returned for confirmation.",
  parameters: schema,
  async execute(input) {
    const room = await prisma.room.findUnique({ where: { id: input.roomId } });
    if (!room || !room.isActive) {
      return toolError("That room is not available for booking.");
    }

    const range = validateDateRange(input.checkIn, input.checkOut);
    if (!range.valid) return toolError(range.error);

    if (input.guests > room.capacity) {
      return toolError(`The ${room.name} holds up to ${room.capacity} guest(s).`);
    }

    const existing = await prisma.booking.findMany({
      where: { roomId: room.id, status: { not: "CANCELLED" } },
      select: { checkIn: true, checkOut: true },
    });
    if (hasBookingConflict(existing, input.checkIn, input.checkOut)) {
      return toolError("Those dates have just been booked. Please pick different dates.");
    }

    const booking = await prisma.booking.create({
      data: {
        roomId: room.id,
        guestName: input.guestName,
        guestEmail: input.guestEmail.toLowerCase(),
        guestPhone: input.guestPhone,
        checkIn: new Date(input.checkIn),
        checkOut: new Date(input.checkOut),
        guests: input.guests,
        totalPrice: calculateTotalPrice(room.pricePerNight, input.checkIn, input.checkOut),
        currency: "EUR",
        status: "PENDING",
        paymentStatus: "unpaid",
        specialRequests: input.specialRequests?.trim() || null,
      },
    });

    const card = toBookingSummaryCard(booking, room.name);
    return toolOk(
      `Booking created for ${room.name}, ref ${card.reference}, total ${booking.totalPrice} ${booking.currency}. Status pending_payment.`,
      card,
      card,
    );
  },
};
