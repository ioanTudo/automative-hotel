import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { calculateNights } from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type PaymentLinkCard,
  type ToolDefinition,
} from "@/lib/ai/types";
import { bookingReference } from "@/lib/ai/tools/_shared";

/** Internal payment page route for a booking. Never an external URL. */
export function paymentHref(bookingId: string): string {
  return `/payment/${bookingId}`;
}

const schema = z.object({
  bookingId: z.string().min(1),
  amount: z.number().positive().optional().describe("Defaults to the booking total."),
  currency: z.string().optional(),
});

export type CreatePaymentLinkInput = z.infer<typeof schema>;

export const createPaymentLinkTool: ToolDefinition<
  CreatePaymentLinkInput,
  PaymentLinkCard
> = {
  name: "createPaymentLink",
  description:
    "Generate a secure payment link for a booking. Defaults to the booking's total amount. Records a pending payment and marks the booking payment as pending.",
  parameters: schema,
  async execute(input) {
    const booking = await prisma.booking.findUnique({
      where: { id: input.bookingId },
      include: { room: true },
    });
    if (!booking) return toolError("Booking not found.");

    const amount = input.amount ?? booking.totalPrice;
    const currency = input.currency ?? booking.currency;
    const href = paymentHref(booking.id);

    // Record a pending payment and store the internal payment route on the booking.
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: "mock",
        amount,
        currency,
        status: "pending",
        paymentLink: href,
        providerPaymentId: `pay_${booking.id.slice(-12)}`,
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: { paymentStatus: "pending", paymentLink: href },
    });

    const card: PaymentLinkCard = {
      type: "payment_link",
      bookingId: booking.id,
      reference: bookingReference(booking.id),
      href,
      roomName: booking.room.name,
      guestName: booking.guestName,
      checkIn: booking.checkIn.toISOString(),
      checkOut: booking.checkOut.toISOString(),
      nights: calculateNights(booking.checkIn, booking.checkOut),
      guests: booking.guests,
      amount,
      currency,
      status: booking.status,
      paymentStatus: "pending",
    };

    return toolOk(
      `Payment link ready for ${amount} ${currency} at ${href}`,
      card,
      card,
    );
  },
};
