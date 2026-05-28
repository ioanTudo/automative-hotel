import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { runAgent } from "@/lib/ai/agent";
import type { AgentContext, ChatMessage } from "@/lib/ai/types";

// POST /api/ai/chat
// Body: { conversationId?, message, context? }
// Runs the AI Front Desk agent, persists the turn, and returns the reply,
// structured cards, quick replies and the updated context to round-trip.

const bodySchema = z.object({
  conversationId: z.string().optional(),
  message: z.string().min(1).max(2000),
  // Context is round-tripped opaquely; validated loosely.
  context: z.record(z.string(), z.unknown()).optional(),
});

const MAX_HISTORY = 20;

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A message is required." },
      { status: 400 },
    );
  }
  const { conversationId, message } = parsed.data;
  const context = (parsed.data.context ?? {}) as AgentContext;

  const hotel = await prisma.hotel.findFirst({ select: { id: true } });

  // Resolve or create the conversation.
  let conversation = conversationId
    ? await prisma.aIConversation.findUnique({ where: { id: conversationId } })
    : null;
  if (!conversation) {
    conversation = await prisma.aIConversation.create({
      data: {
        hotelId: hotel?.id ?? null,
        status: "open",
        channel: "website_chat",
      },
    });
  }

  // Persist the inbound user message.
  await prisma.aIMessage.create({
    data: { conversationId: conversation.id, role: "user", content: message },
  });

  // Build the chat history (user/assistant only — tool turns are transient).
  const stored = await prisma.aIMessage.findMany({
    where: {
      conversationId: conversation.id,
      role: { in: ["user", "assistant"] },
    },
    orderBy: { createdAt: "asc" },
    take: MAX_HISTORY,
  });
  const history: ChatMessage[] = stored.map((m) => ({
    role: m.role as ChatMessage["role"],
    content: m.content,
  }));

  context.lastConversationId = conversation.id;

  let response;
  try {
    response = await runAgent({ messages: history, context });
  } catch (err) {
    console.error("[ai/chat] agent error", err);
    return NextResponse.json(
      { error: "The assistant hit a snag. Please try again." },
      { status: 500 },
    );
  }

  // Persist the assistant reply and touch the conversation.
  await prisma.aIMessage.create({
    data: {
      conversationId: conversation.id,
      role: "assistant",
      content: response.reply,
    },
  });
  await prisma.aIConversation.update({
    where: { id: conversation.id },
    data: {
      updatedAt: new Date(),
      ...(response.context.draft?.guestEmail
        ? { guestEmail: response.context.draft.guestEmail }
        : {}),
      // Link the conversation to the booking so payment status can sync back.
      ...(response.context.lastBookingId
        ? { bookingId: response.context.lastBookingId }
        : {}),
    },
  });

  return NextResponse.json({
    conversationId: conversation.id,
    reply: response.reply,
    cards: response.cards,
    quickReplies: response.quickReplies,
    context: response.context,
  });
}
