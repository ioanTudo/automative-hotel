// Mock payment gateway boundary. In production this would talk to Stripe /
// Netopia / PayU and verify a real payment before confirming the booking. For
// the MVP it simply confirms the booking via the booking service.

import { confirmBookingPayment, type ConfirmPaymentResult } from "@/lib/booking/booking-service";

export async function processMockPayment(bookingId: string): Promise<ConfirmPaymentResult> {
  // A real gateway would verify the charge here before confirming.
  return confirmBookingPayment(bookingId);
}
