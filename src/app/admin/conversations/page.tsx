import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { requireAdmin } from "@/lib/auth";
import { getAllConversations } from "@/lib/queries";
import { formatDate } from "@/lib/booking-utils";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "AI conversations" };

function statusClasses(status: string): string {
  if (status === "escalated") return "bg-red-100 text-red-700";
  if (status === "resolved") return "bg-green-100 text-green-700";
  return "bg-amber-100 text-amber-800";
}

export default async function AdminConversationsPage() {
  await requireAdmin();
  const conversations = await getAllConversations();

  const escalated = conversations.filter((c) => c.status === "escalated").length;
  const open = conversations.filter((c) => c.status === "open").length;

  const stats = [
    { label: "Conversations", value: String(conversations.length) },
    { label: "Open", value: String(open) },
    { label: "Escalated", value: String(escalated) },
  ];

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">AI conversations</h1>
        <p className="mt-1 text-stone-600">
          Every chat handled by the AI front desk, including escalations.
        </p>

        <AdminSubnav active="conversations" />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm text-stone-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {conversations.length === 0 ? (
            <p className="rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-500">
              No conversations yet.
            </p>
          ) : (
            conversations.map((c) => {
              const lastMessage = c.messages[0];
              return (
                <Link
                  key={c.id}
                  href={`/admin/conversations/${c.id}`}
                  className="block rounded-2xl border border-stone-200 bg-white p-4 transition-colors hover:border-amber-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-stone-900">
                        {c.guestEmail ?? "Anonymous guest"}
                      </p>
                      {lastMessage ? (
                        <p className="mt-1 truncate text-sm text-stone-500">
                          <span className="font-medium text-stone-600">
                            {lastMessage.role === "assistant" ? "AI" : "Guest"}:
                          </span>{" "}
                          {lastMessage.content}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          statusClasses(c.status),
                        )}
                      >
                        {c.status}
                      </span>
                      <span className="text-xs text-stone-400">
                        {c._count.messages} msg · {formatDate(c.updatedAt)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </Container>
    </div>
  );
}
