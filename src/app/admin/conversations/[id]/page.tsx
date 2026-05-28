import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { ConversationStatusControl } from "@/components/admin/ConversationStatusControl";
import { requireAdmin } from "@/lib/auth";
import { getConversationById } from "@/lib/queries";
import { formatDate } from "@/lib/booking-utils";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Conversation" };

type Params = Promise<{ id: string }>;

export default async function ConversationDetailPage({ params }: { params: Params }) {
  await requireAdmin();
  const { id } = await params;
  const conversation = await getConversationById(id);
  if (!conversation) notFound();

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <Link href="/admin/conversations" className="text-sm text-stone-500 hover:text-stone-800">
          ← All conversations
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
              {conversation.guestEmail ?? "Anonymous guest"}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {conversation.channel} · started {formatDate(conversation.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-stone-500">Status</span>
            <ConversationStatusControl conversationId={conversation.id} status={conversation.status} />
          </div>
        </div>

        <div className="mt-8 space-y-3 rounded-2xl border border-stone-200 bg-stone-50 p-4">
          {conversation.messages.length === 0 ? (
            <p className="text-center text-stone-500">No messages.</p>
          ) : (
            conversation.messages.map((m) => (
              <div
                key={m.id}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                    m.role === "user"
                      ? "rounded-br-sm bg-amber-600 text-white"
                      : "rounded-bl-sm border border-stone-200 bg-white text-stone-700",
                  )}
                >
                  <p className="mb-0.5 text-[10px] uppercase tracking-wide opacity-60">
                    {m.role === "user" ? "Guest" : m.role === "assistant" ? "AI" : m.role}
                  </p>
                  {m.content}
                </div>
              </div>
            ))
          )}
        </div>
      </Container>
    </div>
  );
}
