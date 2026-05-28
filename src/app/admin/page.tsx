import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BookingStatusControl } from "@/components/admin/BookingStatusControl";
import { RoomManager } from "@/components/admin/RoomManager";
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { requireAdmin } from "@/lib/auth";
import {
  getAllBookings,
  getAllReservations,
  getAllRooms,
  getAllUsers,
} from "@/lib/queries";
import { formatCurrency, formatDate } from "@/lib/booking-utils";
import { cn } from "@/lib/ui";

export const metadata: Metadata = { title: "Admin dashboard" };

const TABS = [
  { key: "bookings", label: "Bookings" },
  { key: "rooms", label: "Rooms" },
  { key: "reservations", label: "Restaurant" },
  { key: "users", label: "Users" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

type SearchParams = Promise<{ tab?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const sp = await searchParams;
  const tab: TabKey = TABS.some((t) => t.key === sp.tab)
    ? (sp.tab as TabKey)
    : "bookings";

  const [bookings, rooms, users, reservations] = await Promise.all([
    getAllBookings(),
    getAllRooms(),
    getAllUsers(),
    getAllReservations(),
  ]);

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const revenue = bookings
    .filter((b) => b.status === "CONFIRMED")
    .reduce((sum, b) => sum + b.totalPrice, 0);

  const stats = [
    { label: "Total bookings", value: String(bookings.length) },
    { label: "Pending", value: String(pending) },
    { label: "Active rooms", value: String(rooms.filter((r) => r.isActive).length) },
    { label: "Confirmed revenue", value: formatCurrency(revenue) },
  ];

  return (
    <div className="py-12 sm:py-16">
      <Container>
        <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
          Admin dashboard
        </h1>
        <p className="mt-1 text-stone-600">
          Manage bookings, rooms, restaurant reservations and users.
        </p>

        <AdminSubnav active="dashboard" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-stone-200 bg-white p-5">
              <p className="text-sm text-stone-500">{s.label}</p>
              <p className="mt-1 text-2xl font-semibold text-stone-900">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-1 border-b border-stone-200">
          {TABS.map((t) => (
            <Link
              key={t.key}
              href={`/admin?tab=${t.key}`}
              className={cn(
                "border-b-2 px-4 py-2.5 text-sm font-medium",
                tab === t.key
                  ? "border-amber-600 text-amber-700"
                  : "border-transparent text-stone-500 hover:text-stone-800",
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>

        <div className="mt-8">
          {tab === "bookings" ? <BookingsPanel bookings={bookings} /> : null}
          {tab === "rooms" ? <RoomManager rooms={rooms} /> : null}
          {tab === "reservations" ? <ReservationsPanel reservations={reservations} /> : null}
          {tab === "users" ? <UsersPanel users={users} /> : null}
        </div>
      </Container>
    </div>
  );
}

function TableShell({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {empty ? (
            <tr>
              <td colSpan={headers.length} className="px-4 py-8 text-center text-stone-500">
                Nothing here yet.
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}

function BookingsPanel({
  bookings,
}: {
  bookings: Awaited<ReturnType<typeof getAllBookings>>;
}) {
  return (
    <TableShell
      headers={["Guest", "Room", "Dates", "Guests", "Total", "Status"]}
      empty={bookings.length === 0}
    >
      {bookings.map((b) => (
        <tr key={b.id}>
          <td className="px-4 py-3">
            <p className="font-medium text-stone-900">{b.guestName}</p>
            <p className="text-xs text-stone-400">{b.guestEmail}</p>
          </td>
          <td className="px-4 py-3 text-stone-700">{b.room.name}</td>
          <td className="px-4 py-3 text-stone-700">
            {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
          </td>
          <td className="px-4 py-3 text-stone-700">{b.guests}</td>
          <td className="px-4 py-3 text-stone-700">{formatCurrency(b.totalPrice)}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={b.status} />
              <BookingStatusControl bookingId={b.id} status={b.status} />
            </div>
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function ReservationsPanel({
  reservations,
}: {
  reservations: Awaited<ReturnType<typeof getAllReservations>>;
}) {
  return (
    <TableShell
      headers={["Name", "Date & time", "Guests", "Contact", "Status"]}
      empty={reservations.length === 0}
    >
      {reservations.map((r) => (
        <tr key={r.id}>
          <td className="px-4 py-3">
            <p className="font-medium text-stone-900">{r.name}</p>
            {r.message ? (
              <p className="max-w-xs truncate text-xs text-stone-400">{r.message}</p>
            ) : null}
          </td>
          <td className="px-4 py-3 text-stone-700">
            {formatDate(r.date)} · {r.time}
          </td>
          <td className="px-4 py-3 text-stone-700">{r.guests}</td>
          <td className="px-4 py-3 text-stone-700">
            <p>{r.email}</p>
            <p className="text-xs text-stone-400">{r.phone}</p>
          </td>
          <td className="px-4 py-3">
            <StatusBadge status={r.status} />
          </td>
        </tr>
      ))}
    </TableShell>
  );
}

function UsersPanel({
  users,
}: {
  users: Awaited<ReturnType<typeof getAllUsers>>;
}) {
  return (
    <TableShell
      headers={["Name", "Email", "Role", "Joined", "Bookings"]}
      empty={users.length === 0}
    >
      {users.map((u) => (
        <tr key={u.id}>
          <td className="px-4 py-3 font-medium text-stone-900">{u.name}</td>
          <td className="px-4 py-3 text-stone-700">{u.email}</td>
          <td className="px-4 py-3">
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-medium",
                u.role === "ADMIN"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-stone-100 text-stone-600",
              )}
            >
              {u.role === "ADMIN" ? "Admin" : "Guest"}
            </span>
          </td>
          <td className="px-4 py-3 text-stone-700">{formatDate(u.createdAt)}</td>
          <td className="px-4 py-3 text-stone-700">{u._count.bookings}</td>
        </tr>
      ))}
    </TableShell>
  );
}
