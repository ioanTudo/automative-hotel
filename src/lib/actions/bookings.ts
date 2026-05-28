"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { bookingSchema, cancelBookingSchema } from "@/lib/validations";
import {
  calculateTotalPrice,
  hasBookingConflict,
  validateDateRange,
} from "@/lib/booking-utils";
import {
  type ActionResult,
  actionError,
  actionOk,
  fieldErrorsFromZod,
} from "@/lib/action-result";

export async function createBookingAction(
  input: unknown,
): Promise<ActionResult<{ bookingId: string }>> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }
  const data = parsed.data;

  const room = await prisma.room.findUnique({ where: { id: data.roomId } });
  if (!room || !room.isActive) {
    return actionError("Sorry, that room is not available for booking.");
  }

  const range = validateDateRange(data.checkIn, data.checkOut);
  if (!range.valid) {
    return actionError(range.error, { checkOut: range.error });
  }

  if (data.guests > room.capacity) {
    return actionError(`The ${room.name} holds up to ${room.capacity} guest(s).`, {
      guests: `Maximum ${room.capacity} guests for this room.`,
    });
  }

  const existing = await prisma.booking.findMany({
    where: { roomId: room.id, status: { not: "CANCELLED" } },
    select: { checkIn: true, checkOut: true },
  });
  if (hasBookingConflict(existing, data.checkIn, data.checkOut)) {
    return actionError(
      "Those dates are already booked for this room. Please choose different dates.",
      { checkIn: "Not available for these dates.", checkOut: "Not available for these dates." },
    );
  }

  const session = await getSessionUser();
  const booking = await prisma.booking.create({
    data: {
      userId: session?.id ?? null,
      roomId: room.id,
      guestName: data.guestName,
      guestEmail: data.guestEmail.toLowerCase(),
      guestPhone: data.guestPhone,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      guests: data.guests,
      totalPrice: calculateTotalPrice(room.pricePerNight, data.checkIn, data.checkOut),
      status: "PENDING",
      specialRequests: data.specialRequests?.trim() || null,
    },
  });

  revalidatePath("/account/bookings");
  revalidatePath("/admin");
  return actionOk({ bookingId: booking.id });
}

export async function cancelBookingAction(input: unknown): Promise<ActionResult> {
  const parsed = cancelBookingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Invalid request.");
  }

  const user = await getSessionUser();
  if (!user) {
    return actionError("You must be signed in to cancel a booking.");
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
  });
  if (!booking) {
    return actionError("Booking not found.");
  }
  if (booking.userId !== user.id && user.role !== "ADMIN") {
    return actionError("You can only cancel your own bookings.");
  }
  if (booking.status === "CANCELLED") {
    return actionError("This booking is already cancelled.");
  }

  await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/account/bookings");
  revalidatePath("/admin");
  return actionOk(undefined);
}
