import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  toolError,
  toolOk,
  type BookingSummaryCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { toBookingSummaryCard } from "@/lib/ai/tools/_shared";

const schema = z.object({
  bookingId: z.string().min(1),
  reason: z.string().optional(),
});

export type CancelBookingInput = z.infer<typeof schema>;

export const cancelBookingTool: ToolDefinition<CancelBookingInput, BookingSummaryCard> = {
  name: "cancelBooking",
  description:
    "Cancel an existing booking. If it was paid, the payment is marked for refund. Apply the hotel's cancellation policy when advising the guest.",
  parameters: schema,
  async execute(input) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { room: true },
    });
    if (!booking) return toolError("Booking not found.");
    if (booking.status === "CANCELLED") return toolError("This booking is already cancelled.");

    const wasPaid = booking.paymentStatus === "paid";

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "CANCELLED",
        paymentStatus: wasPaid ? "refunded" : booking.paymentStatus,
      },
      include: { room: true },
    });

    if (wasPaid) {
      await prisma.payment.updateMany({
        where: { bookingId: booking.id, status: "paid" },
        data: { status: "refunded" },
      });
    }

    const note = wasPaid
      ? "Booking cancelled; a refund will be processed to the original payment method."
      : "Booking cancelled.";
    const card = toBookingSummaryCard(updated, updated.room.name, note);
    return toolOk(note, card, card);
  },
};
