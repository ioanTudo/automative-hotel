"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { bookingStatusSchema, roomSchema } from "@/lib/validations";
import { stringifyAmenities } from "@/lib/booking-utils";
import {
  CONVERSATION_STATUSES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from "@/lib/types";
import {
  type ActionResult,
  actionError,
  actionOk,
  fieldErrorsFromZod,
} from "@/lib/action-result";

async function ensureAdmin(): Promise<ActionResult<never> | null> {
  const user = await getSessionUser();
  if (!user) return actionError("You must be signed in.");
  if (user.role !== "ADMIN") return actionError("Administrator access required.");
  return null;
}

function amenitiesToJson(raw: string | undefined): string {
  const list = (raw ?? "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);
  return stringifyAmenities(list);
}

export async function updateBookingStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = bookingStatusSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid request.");

  await prisma.booking.update({
    where: { id: parsed.data.bookingId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin");
  revalidatePath("/account/bookings");
  return actionOk(undefined);
}

export async function createRoomAction(input: unknown): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const existing = await prisma.room.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (existing) {
    return actionError("A room with this slug already exists.", {
      slug: "This slug is already in use.",
    });
  }

  await prisma.room.create({
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      pricePerNight: parsed.data.pricePerNight,
      capacity: parsed.data.capacity,
      amenities: amenitiesToJson(parsed.data.amenities),
      imageUrl: parsed.data.imageUrl,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rooms");
  return actionOk(undefined);
}

export async function updateRoomAction(input: unknown): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const id = (input as { id?: unknown })?.id;
  if (typeof id !== "string" || !id) {
    return actionError("Missing room id.");
  }

  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const slugOwner = await prisma.room.findUnique({
    where: { slug: parsed.data.slug },
  });
  if (slugOwner && slugOwner.id !== id) {
    return actionError("Another room already uses this slug.", {
      slug: "This slug is already in use.",
    });
  }

  await prisma.room.update({
    where: { id },
    data: {
      name: parsed.data.name,
      slug: parsed.data.slug,
      description: parsed.data.description,
      pricePerNight: parsed.data.pricePerNight,
      capacity: parsed.data.capacity,
      amenities: amenitiesToJson(parsed.data.amenities),
      imageUrl: parsed.data.imageUrl,
      isActive: parsed.data.isActive,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${parsed.data.slug}`);
  return actionOk(undefined);
}

const ticketUpdateSchema = z.object({
  ticketId: z.string().min(1),
  status: z.enum(TICKET_STATUSES).optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
});

export async function updateTicketAction(input: unknown): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = ticketUpdateSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid request.");
  if (!parsed.data.status && !parsed.data.priority) {
    return actionError("Nothing to update.");
  }

  await prisma.supportTicket.update({
    where: { id: parsed.data.ticketId },
    data: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
    },
  });

  revalidatePath("/admin/tickets");
  return actionOk(undefined);
}

const conversationUpdateSchema = z.object({
  conversationId: z.string().min(1),
  status: z.enum(CONVERSATION_STATUSES),
});

export async function updateConversationStatusAction(
  input: unknown,
): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const parsed = conversationUpdateSchema.safeParse(input);
  if (!parsed.success) return actionError("Invalid request.");

  await prisma.aIConversation.update({
    where: { id: parsed.data.conversationId },
    data: { status: parsed.data.status },
  });

  revalidatePath("/admin/conversations");
  revalidatePath(`/admin/conversations/${parsed.data.conversationId}`);
  return actionOk(undefined);
}

export async function deleteRoomAction(input: unknown): Promise<ActionResult> {
  const denied = await ensureAdmin();
  if (denied) return denied;

  const id = (input as { roomId?: unknown })?.roomId;
  if (typeof id !== "string" || !id) {
    return actionError("Missing room id.");
  }

  await prisma.room.delete({ where: { id } });

  revalidatePath("/admin");
  revalidatePath("/rooms");
  return actionOk(undefined);
}
