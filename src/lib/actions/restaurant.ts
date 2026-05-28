"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { restaurantReservationSchema } from "@/lib/validations";
import {
  type ActionResult,
  actionError,
  actionOk,
  fieldErrorsFromZod,
} from "@/lib/action-result";

export async function createReservationAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = restaurantReservationSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }
  const data = parsed.data;

  if (new Date(data.date) < new Date(new Date().toDateString())) {
    return actionError("Please choose a date in the future.", {
      date: "Date cannot be in the past.",
    });
  }

  const session = await getSessionUser();
  await prisma.restaurantReservation.create({
    data: {
      userId: session?.id ?? null,
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      date: new Date(data.date),
      time: data.time,
      guests: data.guests,
      message: data.message?.trim() || null,
      status: "PENDING",
    },
  });

  revalidatePath("/admin");
  return actionOk(undefined);
}
