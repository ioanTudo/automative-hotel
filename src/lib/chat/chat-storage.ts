// Client-side persistence for the AI chat. The whole session (conversationId,
// messages with rich cards, the in-flight booking flow context, and timing
// metadata) is stored in localStorage so the chat survives page navigation and
// refresh. The conversation is also persisted server-side in the database via
// /api/ai/chat; localStorage is the source of truth for what the UI renders.

import type { AgentContext, Card } from "@/lib/ai/types";

export type StoredRole = "user" | "assistant" | "system";

export type StoredMessage = {
  id: number;
  role: StoredRole;
  text: string;
  cards?: Card[];
};

export type ChatSession = {
  conversationId?: string;
  /** The booking this conversation is tied to, once one is created. */
  bookingId?: string;
  messages: StoredMessage[];
  quickReplies: string[];
  context: AgentContext;
  /** bookingId for which a payment confirmation has already been shown. */
  paymentConfirmedFor?: string;
  lastAssistantMessageAt?: number;
  lastUserMessageAt?: number;
  nextId: number;
  updatedAt: number;
};

const KEY = "ah_chat_session_v1";
const OPEN_FLAG = "ah_chat_open";

export const CHAT_GREETING =
  "Hi! I'm the Automative Hotel front desk assistant. I can check availability, take a booking and payment, send invoices, reserve a restaurant table, and handle any request during your stay. How can I help?";

export const CHAT_MAIN_ACTIONS = [
  "Book a room",
  "Ask about rooms",
  "Restaurant",
  "Payment & invoice",
  "Modify booking",
  "Guest request",
];

export function createInitialSession(): ChatSession {
  return {
    messages: [{ id: 0, role: "assistant", text: CHAT_GREETING }],
    quickReplies: CHAT_MAIN_ACTIONS,
    context: {},
    nextId: 1,
    updatedAt: Date.now(),
  };
}

export function loadSession(): ChatSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChatSession;
    if (!parsed || !Array.isArray(parsed.messages)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveSession(session: ChatSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      KEY,
      JSON.stringify({ ...session, updatedAt: Date.now() }),
    );
  } catch {
    // Ignore quota / serialization errors — chat continues in memory.
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

/** Append a message immutably, allocating a stable id. */
export function appendMessage(
  session: ChatSession,
  message: Omit<StoredMessage, "id">,
): ChatSession {
  const id = session.nextId;
  const stamp =
    message.role === "user"
      ? { lastUserMessageAt: Date.now() }
      : message.role === "assistant"
        ? { lastAssistantMessageAt: Date.now() }
        : {};
  return {
    ...session,
    messages: [...session.messages, { ...message, id }],
    nextId: id + 1,
    ...stamp,
  };
}

/** Tie the conversation to a booking so payment status can sync back. */
export function linkConversationToBooking(
  session: ChatSession,
  bookingId: string,
): ChatSession {
  if (session.bookingId === bookingId) return session;
  return { ...session, bookingId };
}

// --- Cross-route "open the chat when you land" flag (e.g. from payment page). ---

export function requestChatOpen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(OPEN_FLAG, "1");
  } catch {
    // ignore
  }
}

export function consumeChatOpenRequest(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const v = window.localStorage.getItem(OPEN_FLAG);
    if (v) window.localStorage.removeItem(OPEN_FLAG);
    return v === "1";
  } catch {
    return false;
  }
}
