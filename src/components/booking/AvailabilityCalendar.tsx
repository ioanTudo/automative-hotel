"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { cn } from "@/lib/ui";

type Range = { checkIn: string; checkOut: string };

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function AvailabilityCalendar({ bookedRanges }: { bookedRanges: Range[] }) {
  const [offset, setOffset] = useState(0);
  const today = startOfDay(new Date());

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    for (const r of bookedRanges) {
      const start = startOfDay(new Date(r.checkIn));
      const end = startOfDay(new Date(r.checkOut)); // checkout day stays available
      for (let d = start; isBefore(d, end); d = addDays(d, 1)) {
        set.add(format(d, "yyyy-MM-dd"));
      }
    }
    return set;
  }, [bookedRanges]);

  const baseMonth = startOfMonth(addMonths(today, offset));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOffset((o) => Math.max(0, o - 1))}
          disabled={offset === 0}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 disabled:opacity-40"
        >
          ← Earlier
        </button>
        <span className="text-sm font-medium text-stone-700">
          {format(baseMonth, "MMMM yyyy")}
        </span>
        <button
          type="button"
          onClick={() => setOffset((o) => Math.min(11, o + 1))}
          disabled={offset === 11}
          className="rounded-md px-2 py-1 text-sm text-stone-600 hover:bg-stone-100 disabled:opacity-40"
        >
          Later →
        </button>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Month month={baseMonth} today={today} bookedSet={bookedSet} />
        <Month month={addMonths(baseMonth, 1)} today={today} bookedSet={bookedSet} />
      </div>

      <div className="mt-5 flex flex-wrap gap-4 text-xs text-stone-500">
        <Legend className="bg-white ring-1 ring-stone-200" label="Available" />
        <Legend className="bg-red-100 text-red-700 ring-1 ring-red-200" label="Booked" />
        <Legend className="bg-stone-100 text-stone-400" label="Past" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={cn("inline-block h-4 w-4 rounded", className)} />
      {label}
    </span>
  );
}

function Month({
  month,
  today,
  bookedSet,
}: {
  month: Date;
  today: Date;
  bookedSet: Set<string>;
}) {
  const days = eachDayOfInterval({ start: month, end: endOfMonth(month) });
  const leadingBlanks = getDay(month); // 0 = Sunday

  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-stone-700 sm:hidden">
        {format(month, "MMMM yyyy")}
      </p>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-stone-400">
        {WEEKDAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <span key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const isPast = isBefore(day, today);
          const isBooked = bookedSet.has(key);
          return (
            <span
              key={key}
              className={cn(
                "flex h-9 items-center justify-center rounded-md text-sm",
                isPast
                  ? "text-stone-300"
                  : isBooked
                    ? "bg-red-100 font-medium text-red-700 ring-1 ring-red-200"
                    : "bg-white text-stone-700 ring-1 ring-stone-200",
              )}
            >
              {format(day, "d")}
            </span>
          );
        })}
      </div>
    </div>
  );
}
