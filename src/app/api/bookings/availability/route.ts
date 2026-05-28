import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasBookingConflict, validateDateRange } from "@/lib/booking-utils";

// GET /api/bookings/availability?roomId=...&checkIn=YYYY-MM-DD&checkOut=YYYY-MM-DD
// Returns the room's upcoming booked ranges and, when dates are supplied,
// whether the requested range is available.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const roomId = searchParams.get("roomId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");

  if (!roomId) {
    return NextResponse.json({ error: "roomId is required." }, { status: 400 });
  }

  const existing = await prisma.booking.findMany({
    where: {
      roomId,
      status: { not: "CANCELLED" },
      checkOut: { gte: new Date() },
    },
    select: { checkIn: true, checkOut: true },
    orderBy: { checkIn: "asc" },
  });

  const bookedRanges = existing.map((b) => ({
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
  }));

  if (checkIn && checkOut) {
    const range = validateDateRange(checkIn, checkOut);
    if (!range.valid) {
      return NextResponse.json({ available: false, reason: range.error, bookedRanges });
    }
    const available = !hasBookingConflict(existing, checkIn, checkOut);
    return NextResponse.json({ available, bookedRanges });
  }

  return NextResponse.json({ bookedRanges });
}
