"use client";

import { useCallback, useEffect, useState } from "react";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { useChatSession } from "@/lib/chat/chat-session";
import { useInactivityTimeout } from "@/lib/chat/chat-timeout";
import { consumeChatOpenRequest } from "@/lib/chat/chat-storage";
import { cn } from "@/lib/ui";

const TIMEOUT_NOTE = "I'll keep this conversation saved. You can continue anytime.";

export function AiAgentBubble() {
  const [open, setOpen] = useState(false);
  const { session, typing, send, appendSystemNote, syncPaymentStatus } = useChatSession();

  // Open automatically when arriving from the payment page ("Open chat").
  useEffect(() => {
    if (!consumeChatOpenRequest()) return;
    const id = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Whenever the panel opens (or the tab regains focus while open), pull the
  // latest payment status so a payment made on the payment page shows up here.
  useEffect(() => {
    if (!open) return;
    void syncPaymentStatus();
    const onFocus = () => void syncPaymentStatus();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [open, syncPaymentStatus]);

  const handleTimeout = useCallback(() => {
    appendSystemNote(TIMEOUT_NOTE);
    setOpen(false);
  }, [appendSystemNote]);

  useInactivityTimeout({
    active: open,
    lastAssistantMessageAt: session.lastAssistantMessageAt,
    lastUserMessageAt: session.lastUserMessageAt,
    onTimeout: handleTimeout,
  });

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {open ? (
        <AiChatPanel
          messages={session.messages}
          quickReplies={session.quickReplies}
          typing={typing}
          onSend={send}
          onClose={() => setOpen(false)}
        />
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close hotel assistant" : "Open hotel assistant"}
        aria-expanded={open}
        className={cn(
          "h-14 w-14 items-center justify-center rounded-full bg-amber-600 text-white shadow-lg shadow-amber-600/30 transition-transform hover:scale-105 hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
          // On mobile the panel is fullscreen with its own close button.
          open ? "hidden sm:flex" : "flex",
        )}
      >
        {open ? (
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            width="26"
            height="26"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
        )}
      </button>
    </div>
  );
}
