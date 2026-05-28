import {
  calculateNights,
  calculateTotalPrice,
  formatCurrency,
  formatDate,
} from "@/lib/booking-utils";

export function BookingSummary({
  roomName,
  pricePerNight,
  checkIn,
  checkOut,
  guests,
  guestName,
  guestEmail,
  guestPhone,
  specialRequests,
}: {
  roomName: string;
  pricePerNight: number;
  checkIn: string;
  checkOut: string;
  guests: number;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  specialRequests?: string;
}) {
  const nights = calculateNights(checkIn, checkOut);
  const total = calculateTotalPrice(pricePerNight, checkIn, checkOut);

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
        Booking summary
      </h3>

      <dl className="mt-4 space-y-2.5 text-sm">
        <Row label="Room" value={roomName} />
        <Row label="Check-in" value={`${formatDate(checkIn)} · from 3:00 PM`} />
        <Row label="Check-out" value={`${formatDate(checkOut)} · until 11:00 AM`} />
        <Row label="Guests" value={`${guests} ${guests === 1 ? "guest" : "guests"}`} />
        <Row
          label="Rate"
          value={`${formatCurrency(pricePerNight)} × ${nights} ${nights === 1 ? "night" : "nights"}`}
        />
        {guestName ? <Row label="Name" value={guestName} /> : null}
        {guestEmail ? <Row label="Email" value={guestEmail} /> : null}
        {guestPhone ? <Row label="Phone" value={guestPhone} /> : null}
        {specialRequests ? <Row label="Requests" value={specialRequests} /> : null}
      </dl>

      <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
        <span className="text-sm font-medium text-stone-600">Total</span>
        <span className="text-xl font-semibold text-amber-700">
          {formatCurrency(total)}
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-400">
        Taxes included. Payment is collected at the hotel.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-800">{value}</dd>
    </div>
  );
}
