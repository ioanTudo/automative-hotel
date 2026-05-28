import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  toolError,
  toolOk,
  type RestaurantReservationCard,
  type ToolDefinition,
} from "@/lib/ai/types";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  date: z.string().describe("Reservation date, ISO yyyy-mm-dd."),
  time: z.string().describe("Reservation time, e.g. 19:30."),
  guests: z.number().int().positive(),
  message: z.string().optional(),
});

export type CreateRestaurantReservationInput = z.infer<typeof schema>;

export const createRestaurantReservationTool: ToolDefinition<
  CreateRestaurantReservationInput,
  RestaurantReservationCard
> = {
  name: "createRestaurantReservation",
  description:
    "Create a restaurant table reservation for the hotel restaurant. Collect name, email, phone, date, time and party size first.",
  parameters: schema,
  async execute(input) {
    const when = new Date(input.date);
    if (Number.isNaN(when.getTime())) return toolError("Please provide a valid reservation date.");

    const reservation = await prisma.restaurantReservation.create({
      data: {
        name: input.name,
        email: input.email.toLowerCase(),
        phone: input.phone,
        date: when,
        time: input.time,
        guests: input.guests,
        message: input.message?.trim() || null,
        status: "PENDING",
      },
    });

    const card: RestaurantReservationCard = {
      type: "restaurant_reservation",
      reservationId: reservation.id,
      name: reservation.name,
      date: reservation.date.toISOString(),
      time: reservation.time,
      guests: reservation.guests,
      status: reservation.status,
    };

    return toolOk(
      `Restaurant reservation requested for ${input.guests} on ${input.date} at ${input.time}.`,
      card,
      card,
    );
  },
};
