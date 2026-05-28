"use client";

import { useEffect, useRef, useState } from "react";
import { inputClasses } from "@/components/ui/Field";
import { ChatCard } from "@/components/ai/ChatCard";
import { buttonClasses, cn } from "@/lib/ui";
import type { StoredMessage } from "@/lib/chat/chat-storage";

type Props = {
  messages: StoredMessage[];
  quickReplies: string[];
  typing: boolean;
  onSend: (text: string) => void;
  onClose: () => void;
};

export function AiChatPanel({ messages, quickReplies, typing, onSend, onClose }: Props) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed || typing) return;
    onSend(trimmed);
    setInput("");
  }

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden bg-white",
        // Mobile: fullscreen drawer. Desktop: floating card.
        "fixed inset-0 z-50",
        "sm:static sm:inset-auto sm:h-[34rem] sm:max-h-[78vh] sm:w-[24rem] sm:max-w-[calc(100vw-2rem)] sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-2xl",
      )}
      role="dialog"
      aria-label="Hotel front desk assistant"
    >
      <div className="flex items-center justify-between gap-3 bg-amber-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            AI
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Front Desk Assistant</p>
            <p className="text-[11px] text-amber-100">Bookings · payments · requests</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="rounded-md p-1 text-amber-100 hover:bg-white/15 hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-stone-50 px-3 py-4">
        {messages.map((m) =>
          m.role === "system" ? (
            <p key={m.id} className="px-4 text-center text-xs italic text-stone-400">
              {m.text}
            </p>
          ) : (
            <div
              key={m.id}
              className={cn("flex flex-col gap-2", m.role === "user" ? "items-end" : "items-start")}
            >
              <p
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "rounded-br-sm bg-amber-600 text-white"
                    : "rounded-bl-sm border border-stone-200 bg-white text-stone-700",
                )}
              >
                {m.text}
              </p>
              {m.cards?.length ? (
                <div className="w-[88%] space-y-2">
                  {m.cards.map((card, i) => (
                    <ChatCard key={i} card={card} onAction={submit} />
                  ))}
                </div>
              ) : null}
            </div>
          ),
        )}

        {typing ? (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-400">
              typing…
            </p>
          </div>
        ) : null}

        {!typing && quickReplies.length > 0 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {quickReplies.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => submit(q)}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                {q}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything, or book a room…"
          className={cn(inputClasses, "py-2")}
          aria-label="Message"
        />
        <button
          type="submit"
          className={buttonClasses("primary", "md", "shrink-0")}
          disabled={!input.trim() || typing}
        >
          Send
        </button>
      </form>
    </div>
  );
}
