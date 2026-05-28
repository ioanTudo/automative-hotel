import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { BookingForm } from "@/components/booking/BookingForm";
import { getActiveRooms } from "@/lib/queries";
import { buttonClasses } from "@/lib/ui";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Book a Room",
  description: "Reserve your room at Automative Hotel in just a minute.",
};

type SearchParams = Promise<{
  roomId?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}>;

export default async function BookingPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rooms = await getActiveRooms();
  const guests = sp.guests ? Number.parseInt(sp.guests, 10) : undefined;

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <div className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Book your stay
          </h1>
          <p className="mt-2 text-stone-600">
            Choose your room and dates, review the summary, and confirm. No payment is taken
            online — you settle the bill at the hotel.
          </p>
        </div>

        {rooms.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-10 text-center">
            <p className="text-stone-600">
              No rooms are available to book right now. Please check back soon or{" "}
              <Link href="/contact" className="font-medium text-amber-700">
                contact us
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <BookingForm
                rooms={rooms.map((r) => ({
                  id: r.id,
                  name: r.name,
                  pricePerNight: r.pricePerNight,
                  capacity: r.capacity,
                }))}
                defaults={{
                  roomId: sp.roomId,
                  checkIn: sp.checkIn,
                  checkOut: sp.checkOut,
                  guests: guests && Number.isFinite(guests) ? guests : undefined,
                }}
              />
            </div>

            <aside className="space-y-6">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 p-6">
                <h2 className="text-base font-semibold text-stone-900">Good to know</h2>
                <ul className="mt-4 space-y-3 text-sm text-stone-600">
                  <li>Check-in from {SITE.checkInTime}, check-out until {SITE.checkOutTime}.</li>
                  <li>Free cancellation while your booking is pending or confirmed.</li>
                  <li>Free Wi-Fi and on-site parking included with every stay.</li>
                  <li>Breakfast available each morning at {SITE.restaurant.name}.</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-stone-200 bg-stone-900 p-6 text-stone-200">
                <h2 className="text-base font-semibold text-white">Need a hand?</h2>
                <p className="mt-2 text-sm text-stone-300">
                  Our reception team is available 24 hours a day.
                </p>
                <p className="mt-3 text-sm">
                  <span className="text-stone-400">Call </span>
                  <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="font-medium text-white">
                    {SITE.phone}
                  </a>
                </p>
                <Link href="/rooms" className={buttonClasses("secondary", "sm", "mt-4")}>
                  Compare rooms
                </Link>
              </div>
            </aside>
          </div>
        )}
      </Container>
    </div>
  );
}
