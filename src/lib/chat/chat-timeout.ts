"use client";

import { useEffect, useRef } from "react";

export const CHAT_INACTIVITY_MS = 6 * 60 * 1000; // 6 minutes

/**
 * Auto-minimize the chat after a period of guest inactivity.
 *
 * The timer is (re)armed whenever the assistant sends a message and is cleared
 * when the guest replies (lastUserMessageAt catches up to lastAssistantMessageAt)
 * or when the panel closes. It never fires retroactively: reopening the panel
 * after the window has already elapsed does not immediately minimize it.
 */
export function useInactivityTimeout({
  active,
  lastAssistantMessageAt,
  lastUserMessageAt,
  onTimeout,
  timeoutMs = CHAT_INACTIVITY_MS,
}: {
  active: boolean;
  lastAssistantMessageAt?: number;
  lastUserMessageAt?: number;
  onTimeout: () => void;
  timeoutMs?: number;
}) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    if (!active || !lastAssistantMessageAt) return;
    // The guest already replied after the assistant's last message.
    if (lastUserMessageAt && lastUserMessageAt >= lastAssistantMessageAt) return;

    const remaining = timeoutMs - (Date.now() - lastAssistantMessageAt);
    if (remaining <= 0) return; // window already passed; don't minimize retroactively

    const timer = window.setTimeout(() => onTimeoutRef.current(), remaining);
    return () => window.clearTimeout(timer);
  }, [active, lastAssistantMessageAt, lastUserMessageAt, timeoutMs]);
}
