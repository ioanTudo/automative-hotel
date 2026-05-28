import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  toolError,
  toolOk,
  type TicketCard,
  type ToolDefinition,
} from "@/lib/ai/types";

const schema = z.object({
  ticketId: z.string().min(1),
  conversationId: z.string().optional(),
});

export type EscalateToHumanInput = z.infer<typeof schema>;

export const escalateToHumanTool: ToolDefinition<EscalateToHumanInput, TicketCard> = {
  name: "escalateToHuman",
  description:
    "Escalate a ticket to hotel staff: raises its priority to urgent and marks the linked conversation as escalated so it surfaces in the admin dashboard.",
  parameters: schema,
  async execute(input) {
    const ticket = await prisma.supportTicket.findUnique({ where: { id: input.ticketId } });
    if (!ticket) return toolError("Ticket not found.");

    const updated = await prisma.supportTicket.update({
      where: { id: ticket.id },
      data: { priority: "urgent", status: "open" },
    });

    const conversationId = input.conversationId ?? ticket.conversationId;
    if (conversationId) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { status: "escalated" },
      }).catch(() => undefined);
    }

    const card: TicketCard = {
      type: "ticket",
      ticketId: updated.id,
      ticketType: updated.type,
      priority: updated.priority,
      status: updated.status,
      roomNumber: updated.roomNumber,
      message: updated.message,
    };

    return toolOk("Escalated to hotel staff as urgent.", card, card);
  },
};
