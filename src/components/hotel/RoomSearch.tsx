"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";

function toInput(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(value: string, days: number): string {
  const d = new Date(value);
  d.setDate(d.getDate() + days);
  return toInput(d);
}

export function RoomSearch({
  className,
  destination = "/rooms",
  defaultCheckIn,
  defaultCheckOut,
  defaultGuests = 2,
}: {
  className?: string;
  destination?: string;
  defaultCheckIn?: string;
  defaultCheckOut?: string;
  defaultGuests?: number;
}) {
  const router = useRouter();
  const today = toInput(new Date());
  const [checkIn, setCheckIn] = useState(defaultCheckIn ?? today);
  const [checkOut, setCheckOut] = useState(defaultCheckOut ?? addDays(today, 1));
  const [guests, setGuests] = useState(defaultGuests);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let outDate = checkOut;
    if (new Date(outDate) <= new Date(checkIn)) {
      outDate = addDays(checkIn, 1);
      setCheckOut(outDate);
    }
    const params = new URLSearchParams({
      checkIn,
      checkOut: outDate,
      guests: String(guests),
    });
    router.push(`${destination}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 shadow-lg sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end",
        className,
      )}
    >
      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Check-in
        </span>
        <input
          type="date"
          value={checkIn}
          min={today}
          onChange={(e) => setCheckIn(e.target.value)}
          className={inputClasses}
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Check-out
        </span>
        <input
          type="date"
          value={checkOut}
          min={addDays(checkIn, 1)}
          onChange={(e) => setCheckOut(e.target.value)}
          className={inputClasses}
        />
      </label>

      <label className="space-y-1.5">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
          Guests
        </span>
        <select
          value={guests}
          onChange={(e) => setGuests(Number(e.target.value))}
          className={cn(inputClasses, "lg:w-28")}
        >
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <option key={n} value={n}>
              {n} {n === 1 ? "guest" : "guests"}
            </option>
          ))}
        </select>
      </label>

      <button type="submit" className={buttonClasses("primary", "md", "h-[42px]")}>
        Search rooms
      </button>
    </form>
  );
}
