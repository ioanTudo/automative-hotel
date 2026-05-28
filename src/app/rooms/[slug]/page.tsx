import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { RoomImage } from "@/components/hotel/RoomImage";
import { BookingForm } from "@/components/booking/BookingForm";
import { AvailabilityCalendar } from "@/components/booking/AvailabilityCalendar";
import { getRoomBookedRanges, getRoomBySlug } from "@/lib/queries";
import { formatCurrency } from "@/lib/booking-utils";

type Params = Promise<{ slug: string }>;
type SearchParams = Promise<{ checkIn?: string; checkOut?: string; guests?: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  return {
    title: room ? room.name : "Room not found",
    description: room?.description,
  };
}

export default async function RoomDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { slug } = await params;
  const room = await getRoomBySlug(slug);
  if (!room || !room.isActive) notFound();

  const sp = await searchParams;
  const guests = sp.guests ? Number.parseInt(sp.guests, 10) : undefined;

  const bookedRanges = (await getRoomBookedRanges(room.id)).map((b) => ({
    checkIn: b.checkIn.toISOString(),
    checkOut: b.checkOut.toISOString(),
  }));

  const galleryLabels = [room.name, "Bathroom", "Workspace", "View"];

  return (
    <div className="py-10 sm:py-14">
      <Container>
        <nav className="text-sm text-stone-500">
          <Link href="/rooms" className="hover:text-stone-800">
            Rooms
          </Link>
          <span className="px-2">/</span>
          <span className="text-stone-700">{room.name}</span>
        </nav>

        {/* Gallery */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4 sm:grid-rows-2">
          <RoomImage
            name={room.name}
            label={galleryLabels[0]}
            seedKey={`${room.slug}-1`}
            className="h-60 rounded-2xl sm:col-span-2 sm:row-span-2 sm:h-full"
          />
          {galleryLabels.slice(1).map((label, i) => (
            <RoomImage
              key={label}
              name={room.name}
              label={label}
              seedKey={`${room.slug}-${i + 2}`}
              className="hidden h-[7.4rem] rounded-2xl sm:flex"
            />
          ))}
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-[1.4fr_1fr]">
          {/* Details */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
                  {room.name}
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  Sleeps up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold text-amber-700">
                  {formatCurrency(room.pricePerNight)}
                </p>
                <p className="text-xs text-stone-500">per night</p>
              </div>
            </div>

            <p className="mt-6 leading-relaxed text-stone-700">{room.description}</p>

            {room.amenities.length > 0 ? (
              <div className="mt-8">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                  Amenities
                </h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {room.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-2 text-sm text-stone-700">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-amber-600"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-10">
              <h2 className="text-lg font-semibold text-stone-900">Availability</h2>
              <p className="mt-1 text-sm text-stone-500">
                Dates shown in red are already booked.
              </p>
              <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-5">
                <AvailabilityCalendar bookedRanges={bookedRanges} />
              </div>
            </div>
          </div>

          {/* Booking form */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-stone-900">Reserve this room</h2>
              <p className="mt-1 text-sm text-stone-500">
                No payment now — pay during your stay.
              </p>
              <div className="mt-5">
                <BookingForm
                  rooms={[
                    {
                      id: room.id,
                      name: room.name,
                      pricePerNight: room.pricePerNight,
                      capacity: room.capacity,
                    },
                  ]}
                  lockRoom
                  defaults={{
                    roomId: room.id,
                    checkIn: sp.checkIn,
                    checkOut: sp.checkOut,
                    guests: guests && Number.isFinite(guests) ? guests : undefined,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
