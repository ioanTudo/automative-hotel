"use client";

import { useEffect, useRef, useState } from "react";
import { AI_GREETING, AI_SUGGESTIONS, getMockReply } from "@/lib/ai-mock";
import { inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";

type Message = { id: number; role: "bot" | "user"; text: string };

let nextId = 1;

export function AiChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: "bot", text: AI_GREETING },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { id: nextId++, role: "user", text: trimmed }]);
    setInput("");
    setTyping(true);

    // Mocked latency. Replace this block with a fetch to a real AI endpoint.
    window.setTimeout(() => {
      setMessages((prev) => [...prev, { id: nextId++, role: "bot", text: getMockReply(trimmed) }]);
      setTyping(false);
    }, 550);
  }

  return (
    <div className="flex h-[30rem] max-h-[70vh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 bg-amber-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">
            AI
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Hotel Assistant</p>
            <p className="text-[11px] text-amber-100">Typically replies instantly</p>
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
        {messages.map((m) => (
          <div
            key={m.id}
            className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
          >
            <p
              className={cn(
                "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                m.role === "user"
                  ? "rounded-br-sm bg-amber-600 text-white"
                  : "rounded-bl-sm border border-stone-200 bg-white text-stone-700",
              )}
            >
              {m.text}
            </p>
          </div>
        ))}

        {typing ? (
          <div className="flex justify-start">
            <p className="rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-3.5 py-2 text-sm text-stone-400">
              typing…
            </p>
          </div>
        ) : null}

        {messages.length === 1 ? (
          <div className="flex flex-wrap gap-2 pt-1">
            {AI_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => send(s)}
                className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800 hover:bg-amber-100"
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-stone-200 bg-white p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about rooms, dining, check-in…"
          className={cn(inputClasses, "py-2")}
          aria-label="Message"
        />
        <button type="submit" className={buttonClasses("primary", "md", "shrink-0")} disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
