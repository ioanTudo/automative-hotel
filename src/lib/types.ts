// Shared domain constants and types.
// SQLite has no native enums, so we model them as string unions validated in app code.

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const RESERVATION_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED"] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// AI Front Desk enums (stored as String in SQLite, validated in app code).
export const PAYMENT_STATUSES = ["unpaid", "pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_STATUSES = ["draft", "issued", "sent", "cancelled"] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const TICKET_TYPES = [
  "housekeeping",
  "maintenance",
  "restaurant",
  "billing",
  "complaint",
  "general",
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ["open", "in_progress", "resolved", "cancelled"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const CONVERSATION_STATUSES = ["open", "resolved", "escalated"] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const AI_MESSAGE_ROLES = ["user", "assistant", "system", "tool"] as const;
export type AIMessageRole = (typeof AI_MESSAGE_ROLES)[number];

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};
