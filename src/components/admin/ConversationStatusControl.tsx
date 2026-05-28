"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateConversationStatusAction } from "@/lib/actions/admin";
import { CONVERSATION_STATUSES, type ConversationStatus } from "@/lib/types";
import { inputClasses } from "@/components/ui/Field";
import { cn } from "@/lib/ui";

export function ConversationStatusControl({
  conversationId,
  status,
}: {
  conversationId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: ConversationStatus) {
    const previous = value;
    setValue(next);
    setSaving(true);
    const res = await updateConversationStatusAction({ conversationId, status: next });
    setSaving(false);
    if (res.ok) router.refresh();
    else setValue(previous);
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => change(e.target.value as ConversationStatus)}
      className={cn(inputClasses, "w-auto py-1.5 text-xs")}
      aria-label="Conversation status"
    >
      {CONVERSATION_STATUSES.map((s) => (
        <option key={s} value={s}>
          {s}
        </option>
      ))}
    </select>
  );
}
