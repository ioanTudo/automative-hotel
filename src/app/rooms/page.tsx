import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { RoomCard } from "@/components/hotel/RoomCard";
import { RoomSearch } from "@/components/hotel/RoomSearch";
import { getActiveRooms } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Rooms",
  description: "Browse our single, double, twin, family and deluxe rooms.",
};

type SearchParams = Promise<{
  checkIn?: string;
  checkOut?: string;
  guests?: string;
}>;

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const rooms = await getActiveRooms();

  const guests = sp.guests ? Number.parseInt(sp.guests, 10) : undefined;
  const filtered =
    guests && Number.isFinite(guests)
      ? rooms.filter((r) => r.capacity >= guests)
      : rooms;

  const params = new URLSearchParams();
  if (sp.checkIn) params.set("checkIn", sp.checkIn);
  if (sp.checkOut) params.set("checkOut", sp.checkOut);
  if (sp.guests) params.set("guests", sp.guests);
  const query = params.toString();

  return (
    <>
      <section className="border-b border-stone-200 bg-stone-100 py-12">
        <Container>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
            Our rooms
          </h1>
          <p className="mt-2 max-w-2xl text-stone-600">
            From cosy singles to spacious family rooms — find the right fit for your stay and
            check live availability.
          </p>
          <div className="mt-6">
            <RoomSearch
              defaultCheckIn={sp.checkIn}
              defaultCheckOut={sp.checkOut}
              defaultGuests={guests}
            />
          </div>
        </Container>
      </section>

      <section className="py-12 sm:py-16">
        <Container>
          {guests ? (
            <p className="mb-6 text-sm text-stone-600">
              Showing rooms that sleep at least{" "}
              <span className="font-semibold">{guests}</span>{" "}
              {guests === 1 ? "guest" : "guests"}.
            </p>
          ) : null}

          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white p-10 text-center">
              <p className="text-stone-600">
                No rooms match that party size. Try reducing the number of guests.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((room) => (
                <RoomCard key={room.id} room={room} query={query} />
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
