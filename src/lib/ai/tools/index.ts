// Tool registry. Collects every AI tool so the orchestrator (and, later, a real
// LLM) can discover and execute them by name. Adding a tool here makes it
// available to the agent.

import type { ToolDefinition, ToolResult } from "@/lib/ai/types";
import { checkAvailabilityTool } from "@/lib/ai/tools/checkAvailability";
import { createBookingTool } from "@/lib/ai/tools/createBooking";
import { createPaymentLinkTool } from "@/lib/ai/tools/createPaymentLink";
import { generateInvoiceTool } from "@/lib/ai/tools/generateInvoice";
import {
  sendBookingConfirmationEmailTool,
  sendInvoiceEmailTool,
} from "@/lib/ai/tools/sendEmail";
import { createSupportTicketTool } from "@/lib/ai/tools/createSupportTicket";
import { findBookingTool } from "@/lib/ai/tools/findBooking";
import { modifyBookingTool } from "@/lib/ai/tools/modifyBooking";
import { cancelBookingTool } from "@/lib/ai/tools/cancelBooking";
import { escalateToHumanTool } from "@/lib/ai/tools/escalateToHuman";
import { createRestaurantReservationTool } from "@/lib/ai/tools/createRestaurantReservation";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TOOLS: ToolDefinition<any, any>[] = [
  checkAvailabilityTool,
  createBookingTool,
  createPaymentLinkTool,
  sendBookingConfirmationEmailTool,
  generateInvoiceTool,
  sendInvoiceEmailTool,
  createSupportTicketTool,
  findBookingTool,
  modifyBookingTool,
  cancelBookingTool,
  escalateToHumanTool,
  createRestaurantReservationTool,
];

const BY_NAME = new Map(TOOLS.map((t) => [t.name, t]));

export function getTool(name: string) {
  return BY_NAME.get(name);
}

/** Validate args against the tool's schema and run it. Safe to call by name. */
export async function runTool(
  name: string,
  args: unknown,
): Promise<ToolResult> {
  const tool = BY_NAME.get(name);
  if (!tool) return { ok: false, error: `Unknown tool: ${name}` };

  const parsed = tool.parameters.safeParse(args);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Invalid tool arguments.";
    return { ok: false, error: msg };
  }
  return tool.execute(parsed.data);
}
