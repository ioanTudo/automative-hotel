"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelBookingAction } from "@/lib/actions/bookings";
import { buttonClasses } from "@/lib/ui";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancel() {
    if (!window.confirm("Cancel this booking? This cannot be undone.")) return;
    setPending(true);
    setError(null);
    const res = await cancelBookingAction({ bookingId });
    setPending(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={cancel}
        disabled={pending}
        className={buttonClasses("danger", "sm")}
      >
        {pending ? "Cancelling…" : "Cancel booking"}
      </button>
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </div>
  );
}
