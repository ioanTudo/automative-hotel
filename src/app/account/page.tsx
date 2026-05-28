import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { LogoutButton } from "@/components/account/LogoutButton";
import { requireUser } from "@/lib/auth";
import { getUserBookings } from "@/lib/queries";
import { buttonClasses } from "@/lib/ui";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  const bookings = await getUserBookings(user.id);
  const upcoming = bookings.filter(
    (b) => b.status !== "CANCELLED" && b.checkOut >= new Date(),
  ).length;

  return (
    <div className="py-12 sm:py-16">
      <Container className="max-w-3xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-900">
              Hello, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-stone-600">Manage your profile and bookings.</p>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Profile
            </h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-stone-500">Name</dt>
                <dd className="font-medium text-stone-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Email</dt>
                <dd className="font-medium text-stone-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Account type</dt>
                <dd className="font-medium text-stone-900">
                  {user.role === "ADMIN" ? "Administrator" : "Guest"}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
              Your bookings
            </h2>
            <p className="mt-4 text-3xl font-semibold text-stone-900">{bookings.length}</p>
            <p className="text-sm text-stone-500">
              {upcoming} upcoming · {bookings.length - upcoming} past or cancelled
            </p>
            <Link href="/account/bookings" className={buttonClasses("primary", "md", "mt-5")}>
              View my bookings
            </Link>
          </div>
        </div>

        {user.role === "ADMIN" ? (
          <div className="mt-6 flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div>
              <h2 className="font-semibold text-amber-900">Administrator tools</h2>
              <p className="text-sm text-amber-800">Manage rooms, bookings and reservations.</p>
            </div>
            <Link href="/admin" className={buttonClasses("primary", "md")}>
              Open dashboard
            </Link>
          </div>
        ) : null}
      </Container>
    </div>
  );
}
