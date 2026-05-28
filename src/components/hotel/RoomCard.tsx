import Link from "next/link";
import { RoomImage } from "@/components/hotel/RoomImage";
import { buttonClasses } from "@/lib/ui";
import { formatCurrency } from "@/lib/booking-utils";
import type { RoomView } from "@/lib/queries";

export function RoomCard({ room, query }: { room: RoomView; query?: string }) {
  const suffix = query ? `&${query}` : "";
  const bookHref = `/booking?roomId=${room.id}${suffix}`;
  const detailHref = `/rooms/${room.slug}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={detailHref} className="block">
        <RoomImage name={room.name} seedKey={room.slug} className="h-48 w-full" />
      </Link>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-stone-900">
            <Link href={detailHref} className="hover:text-amber-700">
              {room.name}
            </Link>
          </h3>
          <div className="text-right">
            <p className="text-lg font-semibold text-amber-700">
              {formatCurrency(room.pricePerNight)}
            </p>
            <p className="text-xs text-stone-500">per night</p>
          </div>
        </div>

        <p className="mt-1 text-sm text-stone-500">
          Sleeps up to {room.capacity} {room.capacity === 1 ? "guest" : "guests"}
        </p>

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-600">
          {room.description}
        </p>

        {room.amenities.length > 0 ? (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {room.amenities.slice(0, 3).map((a) => (
              <li
                key={a}
                className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600"
              >
                {a}
              </li>
            ))}
            {room.amenities.length > 3 ? (
              <li className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                +{room.amenities.length - 3} more
              </li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-5 flex items-center gap-2 pt-1">
          <Link href={detailHref} className={buttonClasses("secondary", "sm", "flex-1")}>
            View details
          </Link>
          <Link href={bookHref} className={buttonClasses("primary", "sm", "flex-1")}>
            Book now
          </Link>
        </div>
      </div>
    </article>
  );
}
