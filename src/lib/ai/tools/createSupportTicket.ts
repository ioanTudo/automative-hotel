import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { TICKET_PRIORITIES, TICKET_TYPES } from "@/lib/types";
import {
  toolError,
  toolOk,
  type TicketCard,
  type ToolDefinition,
} from "@/lib/ai/types";

const schema = z.object({
  type: z.enum(TICKET_TYPES),
  message: z.string().min(2),
  roomNumber: z.string().optional(),
  guestName: z.string().optional(),
  priority: z.enum(TICKET_PRIORITIES).optional(),
  conversationId: z.string().optional(),
});

export type CreateSupportTicketInput = z.infer<typeof schema>;

export const createSupportTicketTool: ToolDefinition<CreateSupportTicketInput, TicketCard> = {
  name: "createSupportTicket",
  description:
    "Create an internal support ticket for a guest request or problem (housekeeping, maintenance, restaurant, billing, complaint, general). Staff handle these from the admin dashboard.",
  parameters: schema,
  async execute(input) {
    const hotel = await prisma.hotel.findFirst({ select: { id: true } });

    const ticket = await prisma.supportTicket.create({
      data: {
        hotelId: hotel?.id ?? null,
        conversationId: input.conversationId ?? null,
        type: input.type,
        priority: input.priority ?? "medium",
        status: "open",
        roomNumber: input.roomNumber ?? null,
        guestName: input.guestName ?? null,
        message: input.message,
      },
    });

    const card: TicketCard = {
      type: "ticket",
      ticketId: ticket.id,
      ticketType: ticket.type,
      priority: ticket.priority,
      status: ticket.status,
      roomNumber: ticket.roomNumber,
      message: ticket.message,
    };

    return toolOk(
      `${ticket.type} ticket created (priority ${ticket.priority}).`,
      card,
      card,
    );
  },
};
