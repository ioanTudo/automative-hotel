import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { requireAdmin } from "@/lib/auth";
import { getAllKnowledgeBase } from "@/lib/queries";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Knowledge base" };

export default async function AdminKnowledgeBasePage() {
  await requireAdmin();
  const items = await getAllKnowledgeBase();

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Knowledge base</h1>
        <p className="mt-1 text-stone-600">
          The information the AI front desk uses to answer guest questions.
        </p>

        <AdminSubnav active="knowledge-base" />

        <p className="mt-8 text-sm text-stone-500">
          {items.length} item(s) across {categories.length} categor
          {categories.length === 1 ? "y" : "ies"}.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-stone-200 bg-white p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-stone-900">{item.title}</h2>
                <span className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-[11px] font-medium capitalize text-stone-600">
                  {item.category}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-stone-600">{item.content}</p>
              <p
                className={cn(
                  "mt-3 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium",
                  item.isActive ? "bg-green-100 text-green-700" : "bg-stone-100 text-stone-500",
                )}
              >
                {item.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
