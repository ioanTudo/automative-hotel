"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBookingStatusAction } from "@/lib/actions/admin";
import { BOOKING_STATUSES, type BookingStatus } from "@/lib/types";
import { inputClasses } from "@/components/ui/Field";
import { cn } from "@/lib/ui";

export function BookingStatusControl({
  bookingId,
  status,
}: {
  bookingId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState<string>(status);
  const [saving, setSaving] = useState(false);

  async function change(next: BookingStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const res = await updateBookingStatusAction({ bookingId, status: next });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    } else {
      setValue(previous);
    }
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value as BookingStatus)}
      className={cn(inputClasses, "w-auto py-1.5 text-xs")}
      aria-label="Booking status"
    >
      {BOOKING_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s.charAt(0) + s.slice(1).toLowerCase()}
        </option>
      ))}
    </select>
  );
}
