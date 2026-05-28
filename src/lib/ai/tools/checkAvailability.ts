import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  calculateNights,
  calculateTotalPrice,
  formatCurrency,
  hasBookingConflict,
  parseAmenities,
  validateDateRange,
} from "@/lib/booking-utils";
import {
  toolError,
  toolOk,
  type RoomOption,
  type RoomResultsCard,
  type ToolDefinition,
} from "@/lib/ai/types";

const DEFAULT_CANCELLATION =
  "Free cancellation up to 48 hours before check-in.";

const schema = z.object({
  checkIn: z.string().describe("Check-in date, ISO yyyy-mm-dd."),
  checkOut: z.string().describe("Check-out date, ISO yyyy-mm-dd."),
  guests: z.number().int().positive().optional().describe("Number of guests."),
  maxPrice: z
    .number()
    .positive()
    .optional()
    .describe("Optional maximum price per night."),
});

export type CheckAvailabilityInput = z.infer<typeof schema>;

export const checkAvailabilityTool: ToolDefinition<
  CheckAvailabilityInput,
  RoomResultsCard
> = {
  name: "checkAvailability",
  description:
    "Find rooms available for a date range and guest count, with nightly and total prices. Use when a guest asks what's available or wants to compare rooms.",
  parameters: schema,
  async execute(input) {
    const range = validateDateRange(input.checkIn, input.checkOut);
    if (!range.valid) return toolError(range.error);

    const guests = input.guests ?? 1;
    const nights = calculateNights(input.checkIn, input.checkOut);

    const rooms = await prisma.room.findMany({
      where: { isActive: true, capacity: { gte: guests } },
      orderBy: { pricePerNight: "asc" },
    });

    const options: RoomOption[] = [];
    for (const room of rooms) {
      if (input.maxPrice && room.pricePerNight > input.maxPrice) continue;

      const existing = await prisma.booking.findMany({
        where: { roomId: room.id, status: { not: "CANCELLED" } },
        select: { checkIn: true, checkOut: true },
      });
      if (hasBookingConflict(existing, input.checkIn, input.checkOut)) continue;

      options.push({
        roomId: room.id,
        name: room.name,
        slug: room.slug,
        pricePerNight: room.pricePerNight,
        capacity: room.capacity,
        amenities: parseAmenities(room.amenities),
        nights,
        totalPrice: calculateTotalPrice(room.pricePerNight, input.checkIn, input.checkOut),
        currency: "EUR",
      });
    }

    const hotel = await prisma.hotel.findFirst({ select: { cancellationPolicy: true } });

    const card: RoomResultsCard = {
      type: "room_results",
      checkIn: new Date(input.checkIn).toISOString(),
      checkOut: new Date(input.checkOut).toISOString(),
      guests,
      nights,
      cancellationPolicy: hotel?.cancellationPolicy ?? DEFAULT_CANCELLATION,
      rooms: options,
    };

    if (options.length === 0) {
      return toolOk(
        `No rooms for ${guests} guest(s) are available for those dates.`,
        card,
        card,
      );
    }

    const cheapest = options[0];
    return toolOk(
      `${options.length} room(s) available for ${nights} night(s), from ${formatCurrency(
        cheapest.pricePerNight,
      )}/night (${cheapest.name}).`,
      card,
      card,
    );
  },
};
