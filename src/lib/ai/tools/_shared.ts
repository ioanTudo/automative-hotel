// Helpers shared by AI tools: human-friendly booking references, invoice
// numbers, and a builder for the booking summary card.

import { calculateNights } from "@/lib/booking-utils";
import type { BookingSummaryCard } from "@/lib/ai/types";

/** Short, guest-facing reference derived from the booking id. */
export function bookingReference(id: string): string {
  return id.slice(-8).toUpperCase();
}

export function invoiceNumber(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${year}-${rand}`;
}

export type BookingLike = {
  id: string;
  guestName: string;
  guestEmail: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalPrice: number;
  currency: string;
  status: string;
  paymentStatus: string;
  specialRequests?: string | null;
};

export function toBookingSummaryCard(
  booking: BookingLike,
  roomName: string,
  note?: string,
): BookingSummaryCard {
  return {
    type: "booking_summary",
    bookingId: booking.id,
    reference: bookingReference(booking.id),
    roomName,
    guestName: booking.guestName,
    guestEmail: booking.guestEmail,
    checkIn: booking.checkIn.toISOString(),
    checkOut: booking.checkOut.toISOString(),
    nights: calculateNights(booking.checkIn, booking.checkOut),
    guests: booking.guests,
    totalPrice: booking.totalPrice,
    currency: booking.currency,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    specialRequests: booking.specialRequests ?? null,
    note,
  };
}
