import { differenceInCalendarDays, isValid, startOfDay } from "date-fns";

// ---------------------------------------------------------------------------
// Pure, dependency-free booking helpers. Safe to import from both client and
// server components (no Prisma / Node imports here).
// ---------------------------------------------------------------------------

export function parseAmenities(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function stringifyAmenities(amenities: string[]): string {
  return JSON.stringify(amenities);
}

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/** Number of nights between two dates (calendar-day based). */
export function calculateNights(
  checkIn: Date | string,
  checkOut: Date | string,
): number {
  const nights = differenceInCalendarDays(toDate(checkOut), toDate(checkIn));
  return nights > 0 ? nights : 0;
}

/** Total price = nights * pricePerNight. */
export function calculateTotalPrice(
  pricePerNight: number,
  checkIn: Date | string,
  checkOut: Date | string,
): number {
  return Math.round(calculateNights(checkIn, checkOut) * pricePerNight * 100) / 100;
}

export type DateRangeResult =
  | { valid: true }
  | { valid: false; error: string };

/**
 * Validate a check-in / check-out range:
 * - both dates are valid
 * - check-in is not in the past
 * - check-out is strictly after check-in
 */
export function validateDateRange(
  checkIn: Date | string,
  checkOut: Date | string,
): DateRangeResult {
  const start = toDate(checkIn);
  const end = toDate(checkOut);

  if (!isValid(start) || !isValid(end)) {
    return { valid: false, error: "Please provide valid check-in and check-out dates." };
  }
  if (startOfDay(start) < startOfDay(new Date())) {
    return { valid: false, error: "Check-in date cannot be in the past." };
  }
  if (calculateNights(start, end) < 1) {
    return { valid: false, error: "Check-out must be at least one night after check-in." };
  }
  return { valid: true };
}

/**
 * Two date ranges overlap when:
 *   newCheckIn < existingCheckOut AND newCheckOut > existingCheckIn
 */
export function bookingsOverlap(
  newCheckIn: Date | string,
  newCheckOut: Date | string,
  existingCheckIn: Date | string,
  existingCheckOut: Date | string,
): boolean {
  return (
    toDate(newCheckIn) < toDate(existingCheckOut) &&
    toDate(newCheckOut) > toDate(existingCheckIn)
  );
}

type DateRangeLike = { checkIn: Date | string; checkOut: Date | string };

/**
 * Returns true if the requested range conflicts with any of the supplied
 * (non-cancelled) bookings. The DB query lives in server code; this stays pure.
 */
export function hasBookingConflict(
  existing: DateRangeLike[],
  checkIn: Date | string,
  checkOut: Date | string,
): boolean {
  return existing.some((b) =>
    bookingsOverlap(checkIn, checkOut, b.checkIn, b.checkOut),
  );
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(value: Date | string): string {
  const d = toDate(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

/** yyyy-MM-dd for <input type="date"> values. */
export function toDateInputValue(value: Date | string): string {
  const d = toDate(value);
  return d.toISOString().slice(0, 10);
}
