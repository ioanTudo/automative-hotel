import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  bookingsOverlap,
  calculateTotalPrice,
  formatCurrency,
  validateDateRange,
} from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type BookingSummaryCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { toBookingSummaryCard } from "@/lib/ai/tools/_shared";

const schema = z
  .object({
    bookingId: z.string().min(1),
    checkIn: z.string().optional(),
    checkOut: z.string().optional(),
    guests: z.number().int().positive().optional(),
    roomId: z.string().optional(),
  })
  .refine((v) => v.checkIn || v.checkOut || v.guests || v.roomId, {
    message: "Provide at least one field to change.",
  });

export type ModifyBookingInput = z.infer<typeof schema>;

export const modifyBookingTool: ToolDefinition<ModifyBookingInput, BookingSummaryCard> = {
  name: "modifyBooking",
  description:
    "Change an existing booking's dates, guest count or room. Re-checks availability and recalculates the price, reporting any price difference.",
  parameters: schema,
  async execute(input) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { room: true },
    });
    if (!booking) return toolError("Booking not found.");
    if (booking.status === "CANCELLED") return toolError("This booking is cancelled and cannot be modified.");

    const checkIn = input.checkIn ?? booking.checkIn.toISOString();
    const checkOut = input.checkOut ?? booking.checkOut.toISOString();
    const guests = input.guests ?? booking.guests;
    const roomId = input.roomId ?? booking.roomId;

    const range = validateDateRange(checkIn, checkOut);
    if (!range.valid) return toolError(range.error);

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room || !room.isActive) return toolError("The requested room is not available.");
    if (guests > room.capacity) {
      return toolError(`The ${room.name} holds up to ${room.capacity} guest(s).`);
    }

    // Availability check excludes the booking being modified.
    const others = await prisma.booking.findMany({
      where: { roomId: room.id, status: { not: "CANCELLED" }, id: { not: booking.id } },
      select: { checkIn: true, checkOut: true },
    });
    const conflict = others.some((b) => bookingsOverlap(checkIn, checkOut, b.checkIn, b.checkOut));
    if (conflict) return toolError("The new dates are not available for that room.");

    const newTotal = calculateTotalPrice(room.pricePerNight, checkIn, checkOut);
    const diff = Math.round((newTotal - booking.totalPrice) * 100) / 100;

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        roomId: room.id,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        totalPrice: newTotal,
      },
      include: { room: true },
    });

    const diffNote =
      diff === 0
        ? "No change to the total."
        : diff > 0
          ? `Additional ${formatCurrency(diff, booking.currency)} due.`
          : `Refund of ${formatCurrency(Math.abs(diff), booking.currency)} owed.`;

    const card = toBookingSummaryCard(updated, updated.room.name, diffNote);
    return toolOk(`Booking updated. ${diffNote}`, card, card);
  },
};
