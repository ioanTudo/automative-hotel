import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toBookingSummaryCard } from "@/lib/ai/tools/_shared";

// GET /api/payment/status?bookingId=...
// Lets the chat reflect the latest payment state for a linked booking.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bookingId = searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { room: true },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found." }, { status: 404 });
  }

  const card = toBookingSummaryCard(
    booking,
    booking.room.name,
    booking.paymentStatus === "paid" ? "Payment received — booking confirmed." : undefined,
  );

  return NextResponse.json({
    status: booking.status,
    paymentStatus: booking.paymentStatus,
    invoiceUrl: booking.invoiceUrl,
    card,
  });
}
