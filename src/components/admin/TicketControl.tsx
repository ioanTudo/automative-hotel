"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTicketAction } from "@/lib/actions/admin";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type TicketPriority,
  type TicketStatus,
} from "@/lib/types";
import { inputClasses } from "@/components/ui/Field";
import { cn } from "@/lib/ui";

export function TicketControl({
  ticketId,
  status,
  priority,
}: {
  ticketId: string;
  status: string;
  priority: string;
}) {
  const router = useRouter();
  const [statusValue, setStatusValue] = useState(status);
  const [priorityValue, setPriorityValue] = useState(priority);
  const [saving, setSaving] = useState(false);

  async function update(next: { status?: TicketStatus; priority?: TicketPriority }) {
    setSaving(true);
    const res = await updateTicketAction({ ticketId, ...next });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={statusValue}
        disabled={saving}
        onChange={(e) => {
          const v = e.target.value as TicketStatus;
          setStatusValue(v);
          update({ status: v });
        }}
        className={cn(inputClasses, "w-auto py-1.5 text-xs")}
        aria-label="Ticket status"
      >
        {TICKET_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <select
        value={priorityValue}
        disabled={saving}
        onChange={(e) => {
          const v = e.target.value as TicketPriority;
          setPriorityValue(v);
          update({ priority: v });
        }}
        className={cn(inputClasses, "w-auto py-1.5 text-xs")}
        aria-label="Ticket priority"
      >
        {TICKET_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
    </div>
  );
}
