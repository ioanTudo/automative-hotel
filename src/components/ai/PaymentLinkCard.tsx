"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/booking-utils";
import { buttonClasses, cn } from "@/lib/ui";
import type { PaymentLinkCard as PaymentLinkCardT } from "@/lib/ai/types";

const shell =
  "rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-sm text-stone-700 shadow-sm";

export function PaymentLinkCard({ card }: { card: PaymentLinkCardT }) {
  const paid = card.paymentStatus === "paid";

  return (
    <div className={shell}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-stone-900">Booking {card.reference}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-medium",
            paid ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-800",
          )}
        >
          {paid ? "Paid" : "Pending payment"}
        </span>
      </div>

      <div className="mt-2 space-y-0.5">
        <div className="flex justify-between gap-3">
          <span className="text-stone-500">Room</span>
          <span className="font-medium text-stone-800">{card.roomName}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-stone-500">Dates</span>
          <span className="font-medium text-stone-800">
            {formatDate(card.checkIn)} – {formatDate(card.checkOut)} ({card.nights}n)
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-stone-500">Guests</span>
          <span className="font-medium text-stone-800">{card.guests}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-stone-500">Total</span>
          <span className="font-semibold text-amber-700">
            {formatCurrency(card.amount, card.currency)}
          </span>
        </div>
      </div>

      {paid ? (
        <p className="mt-2.5 rounded-md bg-green-50 px-2 py-1 text-xs text-green-700">
          Payment received — your booking is confirmed.
        </p>
      ) : (
        <Link
          href={card.href}
          className={cn(buttonClasses("primary", "sm"), "mt-2.5 w-full")}
        >
          Pay securely
        </Link>
      )}
    </div>
  );
}
