// Booking domain service. Centralises the read + payment-confirmation flow used
// by the payment page and payment APIs so the logic lives in one place.

import { prisma } from "@/lib/prisma";
import { calculateNights } from "@/lib/booking-utils";
import { invoiceProvider } from "@/lib/invoices/invoice-provider";
import { emailService } from "@/lib/email/email-service";
import {
  bookingReference,
  invoiceNumber,
  toBookingSummaryCard,
} from "@/lib/ai/tools/_shared";
import type { BookingSummaryCard } from "@/lib/ai/types";

const DEFAULT_CANCELLATION =
  "Free cancellation up to 48 hours before check-in.";

export type BookingDetail = {
  id: string;
  reference: string;
  roomName: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  invoiceUrl: string | null;
  cancellationPolicy: string;
};

export async function getBookingDetail(
  bookingId: string,
): Promise<BookingDetail | null> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) return null;

  const hotel = await prisma.hotel.findFirst({ select: { cancellationPolicy: true } });

  return {
    id: booking.id,
    reference: bookingReference(booking.id),
    roomName: booking.room.name,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    guestPhone: booking.guestPhone,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: calculateNights(booking.checkIn, booking.checkOut),
    guests: booking.guests,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    invoiceUrl: booking.invoiceUrl,
    cancellationPolicy: hotel?.cancellationPolicy ?? DEFAULT_CANCELLATION,
  };
}

export type ConfirmPaymentResult =
  | { ok: true; alreadyPaid: boolean; card: BookingSummaryCard; invoiceUrl: string | null }
  | { ok: false; reason: "not_found" | "cancelled" };

/**
 * Mark a booking paid + confirmed, generate and "send" the invoice and
 * confirmation email, and record a confirmation message on any linked AI
 * conversation. Idempotent: a booking that's already paid returns success.
 */
export async function confirmBookingPayment(
  bookingId: string,
): Promise<ConfirmPaymentResult> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) return { ok: false, reason: "not_found" };
  if (booking.status === "CANCELLED") return { ok: false, reason: "cancelled" };

  if (booking.paymentStatus === "paid") {
    return {
      ok: true,
      alreadyPaid: true,
      card: toBookingSummaryCard(booking, booking.room.name, "Already paid."),
      invoiceUrl: booking.invoiceUrl,
    };
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED", paymentStatus: "paid" },
    include: { room: true },
  });

  await prisma.payment.updateMany({
    where: { bookingId, status: { in: ["pending", "unpaid"] } },
    data: { status: "paid" },
  });

  // Generate + record the invoice.
  const nights = calculateNights(updated.checkIn, updated.checkOut);
  const number = invoiceNumber();
  const invoice = await invoiceProvider.generate({
    bookingId,
    invoiceNumber: number,
    recipientName: updated.guestName,
    recipientEmail: updated.guestEmail,
    currency: updated.currency,
    lineItems: [
      {
        description: `${updated.room.name} — ${nights} night(s)`,
        quantity: nights,
        unitPrice: updated.room.pricePerNight,
      },
    ],
  });
  await prisma.invoice.create({
    data: {
      bookingId,
      invoiceNumber: number,
      invoiceUrl: invoice.url,
      status: "sent",
      recipientName: updated.guestName,
      recipientEmail: updated.guestEmail,
    },
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { invoiceUrl: invoice.url },
  });

  // "Send" the confirmation + invoice emails (mocked).
  await emailService.send({
    to: updated.guestEmail,
    subject: `Booking confirmed — ${bookingReference(bookingId)}`,
    html: `<p>Dear ${updated.guestName},</p><p>Your booking at the ${updated.room.name} is confirmed. Total paid: ${updated.totalPrice} ${updated.currency}.</p>`,
  });
  await emailService.send({
    to: updated.guestEmail,
    subject: `Invoice ${number}`,
    html: `<p>Your invoice ${number} is attached: <a href="${invoice.url}">${invoice.url}</a>.</p>`,
  });

  // Reflect the confirmation in any linked AI conversation transcript.
  const conversations = await prisma.aIConversation.findMany({
    where: { bookingId },
    select: { id: true },
  });
  for (const c of conversations) {
    await prisma.aIMessage.create({
      data: {
        conversationId: c.id,
        role: "assistant",
        content:
          "Payment confirmed. Your booking is now confirmed. I also sent the confirmation and invoice to your email.",
      },
    });
  }

  return {
    ok: true,
    alreadyPaid: false,
    card: toBookingSummaryCard(updated, updated.room.name, "Payment received — booking confirmed."),
    invoiceUrl: invoice.url,
  };
}
