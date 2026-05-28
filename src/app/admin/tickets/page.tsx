import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { TicketControl } from "@/components/admin/TicketControl";
import { requireAdmin } from "@/lib/auth";
import { getAllTickets } from "@/lib/queries";
import { formatDate } from "@/lib/booking-utils";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Support tickets" };

function priorityClasses(priority: string): string {
  if (priority === "urgent") return "bg-red-100 text-red-700";
  if (priority === "high") return "bg-amber-100 text-amber-800";
  return "bg-stone-100 text-stone-600";
}

export default async function AdminTicketsPage() {
  await requireAdmin();
  const tickets = await getAllTickets();

  const open = tickets.filter((t) => t.status !== "resolved" && t.status !== "cancelled").length;
  const urgent = tickets.filter((t) => t.priority === "urgent").length;

  const stats = [
    { label: "Total tickets", value: String(tickets.length) },
    { label: "Open", value: String(open) },
    { label: "Urgent", value: String(urgent) },
  ];

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">Support tickets</h1>
        <p className="mt-1 text-stone-600">
          Guest requests and issues raised through the AI front desk.
        </p>

        <AdminSubnav active="tickets" />

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm text-stone-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
              <tr>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Request</th>
                <th className="px-4 py-3 font-medium">Room</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Status / priority</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-stone-500">
                    No tickets yet.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium capitalize text-stone-900">{t.type}</span>
                      <div className="mt-1">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            priorityClasses(t.priority),
                          )}
                        >
                          {t.priority}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-md text-stone-700">{t.message}</p>
                      {t.guestName ? (
                        <p className="mt-0.5 text-xs text-stone-400">{t.guestName}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{t.roomNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-stone-700">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3">
                      <TicketControl ticketId={t.id} status={t.status} priority={t.priority} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Container>
    </div>
  );
}
