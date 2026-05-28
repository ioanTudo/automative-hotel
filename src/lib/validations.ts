import { z } from "zod";
import { BOOKING_STATUSES } from "@/lib/types";

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export const registerSchema = z
  .object({
    name: z.string().min(2, "Please enter your full name."),
    email: z.email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

// ---------------------------------------------------------------------------
// Booking
// Dates are kept as yyyy-MM-dd strings (HTML date inputs); the server action
// converts and validates them with date-fns helpers.
// ---------------------------------------------------------------------------

export const bookingSchema = z
  .object({
    roomId: z.string().min(1, "Please select a room."),
    guestName: z.string().min(2, "Please enter your full name."),
    guestEmail: z.email("Enter a valid email address."),
    guestPhone: z.string().min(5, "Enter a valid phone number."),
    checkIn: z.string().min(1, "Select a check-in date."),
    checkOut: z.string().min(1, "Select a check-out date."),
    guests: z
      .number()
      .int("Guests must be a whole number.")
      .min(1, "At least one guest is required.")
      .max(20, "That is too many guests for a single room."),
    specialRequests: z.string().max(1000).optional(),
  })
  .refine((d) => new Date(d.checkOut) > new Date(d.checkIn), {
    message: "Check-out must be after check-in.",
    path: ["checkOut"],
  });
export type BookingInput = z.infer<typeof bookingSchema>;

export const bookingStatusSchema = z.object({
  bookingId: z.string().min(1),
  status: z.enum(BOOKING_STATUSES),
});
export type BookingStatusInput = z.infer<typeof bookingStatusSchema>;

export const cancelBookingSchema = z.object({
  bookingId: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Rooms (admin)
// ---------------------------------------------------------------------------

export const roomSchema = z.object({
  name: z.string().min(2, "Room name is required."),
  slug: z
    .string()
    .min(2, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only."),
  description: z.string().min(10, "Please add a longer description."),
  pricePerNight: z.number().positive("Price must be greater than zero."),
  capacity: z
    .number()
    .int("Capacity must be a whole number.")
    .min(1, "Capacity must be at least 1.")
    .max(20, "Capacity is too high."),
  amenities: z.string(), // comma-separated in the form (may be empty)
  imageUrl: z.string().min(1, "Image URL or path is required."),
  isActive: z.boolean(),
});
export type RoomInput = z.infer<typeof roomSchema>;

// ---------------------------------------------------------------------------
// Restaurant reservation
// ---------------------------------------------------------------------------

export const restaurantReservationSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address."),
  phone: z.string().min(5, "Enter a valid phone number."),
  date: z.string().min(1, "Select a date."),
  time: z.string().min(1, "Select a time."),
  guests: z
    .number()
    .int("Guests must be a whole number.")
    .min(1, "At least one guest is required.")
    .max(30, "For larger parties please call us directly."),
  message: z.string().max(1000).optional(),
});
export type RestaurantReservationInput = z.infer<typeof restaurantReservationSchema>;

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

export const contactSchema = z.object({
  name: z.string().min(2, "Please enter your name."),
  email: z.email("Enter a valid email address."),
  subject: z.string().min(2, "Please add a subject."),
  message: z.string().min(5, "Please add a message."),
});
export type ContactInput = z.infer<typeof contactSchema>;
