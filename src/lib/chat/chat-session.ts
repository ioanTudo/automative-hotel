"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentContext, Card } from "@/lib/ai/types";
import {
  appendMessage,
  CHAT_MAIN_ACTIONS,
  clearSession,
  createInitialSession,
  linkConversationToBooking,
  loadSession,
  saveSession,
  type ChatSession,
} from "@/lib/chat/chat-storage";

type ChatApiResponse = {
  conversationId: string;
  reply: string;
  cards: Card[];
  quickReplies: string[];
  context: AgentContext;
};

const PAYMENT_CONFIRM_TEXT =
  "Payment confirmed. Your booking is now confirmed. I also sent the confirmation and invoice to your email.";

/**
 * Owns the persistent chat session. Loads from localStorage on mount, persists
 * on every change, talks to /api/ai/chat, and can pull the latest payment status
 * back into the same conversation after the guest pays.
 */
export function useChatSession() {
  const [session, setSession] = useState<ChatSession>(() => createInitialSession());
  const [typing, setTyping] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const sessionRef = useRef(session);
  sessionRef.current = session;

  // Hydrate from localStorage after mount to avoid SSR/client mismatch.
  useEffect(() => {
    const stored = loadSession();
    if (stored) setSession(stored);
    setHydrated(true);
  }, []);

  // Persist after hydration so we never clobber stored state with the initial.
  useEffect(() => {
    if (hydrated) saveSession(session);
  }, [session, hydrated]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sessionRef.current == null) return;
    if (typing) return;

    const { conversationId, context } = sessionRef.current;

    setSession((prev) => ({
      ...appendMessage(prev, { role: "user", text: trimmed }),
      quickReplies: [],
    }));
    setTyping(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: trimmed, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ChatApiResponse = await res.json();

      setSession((prev) => {
        let next = appendMessage(prev, {
          role: "assistant",
          text: data.reply,
          cards: data.cards?.length ? data.cards : undefined,
        });
        next = {
          ...next,
          conversationId: data.conversationId,
          context: data.context ?? {},
          quickReplies: data.quickReplies ?? [],
        };
        const bookingId = data.context?.lastBookingId;
        if (bookingId) next = linkConversationToBooking(next, bookingId);
        return next;
      });
    } catch {
      setSession((prev) => ({
        ...appendMessage(prev, {
          role: "assistant",
          text: "Sorry, I couldn't reach the front desk just now. Please try again in a moment.",
        }),
        quickReplies: CHAT_MAIN_ACTIONS,
      }));
    } finally {
      setTyping(false);
    }
  }, [typing]);

  /** Append a soft, non-conversational note (does not re-arm the inactivity timer). */
  const appendSystemNote = useCallback((text: string) => {
    setSession((prev) => {
      const last = prev.messages[prev.messages.length - 1];
      if (last && last.role === "system" && last.text === text) return prev;
      return appendMessage(prev, { role: "system", text });
    });
  }, []);

  /** Pull payment status for the linked booking and reflect it in the chat. */
  const syncPaymentStatus = useCallback(async () => {
    const current = sessionRef.current;
    const bookingId = current.bookingId ?? current.context.lastBookingId;
    if (!bookingId || current.paymentConfirmedFor === bookingId) return;

    try {
      const res = await fetch(
        `/api/payment/status?bookingId=${encodeURIComponent(bookingId)}`,
      );
      if (!res.ok) return;
      const data: { paymentStatus: string; card?: Card } = await res.json();
      if (data.paymentStatus !== "paid") return;

      setSession((prev) => {
        if (prev.paymentConfirmedFor === bookingId) return prev;
        const next = appendMessage(prev, {
          role: "assistant",
          text: PAYMENT_CONFIRM_TEXT,
          cards: data.card ? [data.card] : undefined,
        });
        return {
          ...next,
          paymentConfirmedFor: bookingId,
          quickReplies: CHAT_MAIN_ACTIONS,
        };
      });
    } catch {
      // ignore — will retry next time the panel opens
    }
  }, []);

  const reset = useCallback(() => {
    const fresh = createInitialSession();
    clearSession();
    setSession(fresh);
  }, []);

  return {
    session,
    typing,
    hydrated,
    send,
    reset,
    appendSystemNote,
    syncPaymentStatus,
  };
}
