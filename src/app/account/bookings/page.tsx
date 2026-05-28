import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CancelBookingButton } from "@/components/account/CancelBookingButton";
import { requireUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/queries";
import { formatCurrency, formatDate, calculateNights } from "@/lib/booking-utils";
import { buttonClasses } from "@/lib/ui";

export const metadata: Metadata = { title: "My bookings" };

export default async function MyBookingsPage() {
  const user = await requireUser();
  const bookings = await getUserBookings(user.id);

  return (
    <div className="py-12 sm:py-16">
      <Container className="max-w-4xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">My bookings</h1>
            <p className="mt-1 text-stone-600">Your past, current and upcoming stays.</p>
          </div>
          <Link href="/rooms" className={buttonClasses("secondary", "md")}>
            Book another room
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-stone-600">You don&apos;t have any bookings yet.</p>
            <Link href="/rooms" className={buttonClasses("primary", "md", "mt-5")}>
              Find a room
            </Link>
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {bookings.map((b) => {
              const nights = calculateNights(b.checkIn, b.checkOut);
              const canCancel = b.status !== "CANCELLED";
              return (
                <li
                  key={b.id}
                  className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-semibold text-stone-900">{b.room.name}</h2>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="mt-1 text-sm text-stone-600">
                      {formatDate(b.checkIn)} → {formatDate(b.checkOut)} · {nights}{" "}
                      {nights === 1 ? "night" : "nights"} · {b.guests}{" "}
                      {b.guests === 1 ? "guest" : "guests"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      {formatCurrency(b.totalPrice)}
                    </p>
                  </div>
                  {canCancel ? <CancelBookingButton bookingId={b.id} /> : null}
                </li>
              );
            })}
          </ul>
        )}
      </Container>
    </div>
  );
}
