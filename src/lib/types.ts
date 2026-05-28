// Shared domain constants and types.
// SQLite has no native enums, so we model them as string unions validated in app code.

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
