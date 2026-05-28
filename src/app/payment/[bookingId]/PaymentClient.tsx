"use client";

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses, cn } from "@/lib/ui";
import { formatCurrency, formatDate } from "@/lib/booking-utils";
import { requestChatOpen } from "@/lib/chat/chat-storage";
import type { BookingDetail } from "@/lib/booking/booking-service";

type View = "pay" | "paid" | "cancelled" | "invalid" | "success";

export function PaymentClient({
  booking,
  hotelName,
}: {
  booking: BookingDetail | null;
  hotelName: string;
}) {
  const initial: View = !booking
    ? "invalid"
    : booking.status === "CANCELLED"
      ? "cancelled"
      : booking.paymentStatus === "paid"
        ? "paid"
        : "pay";

  const [view, setView] = useState<View>(initial);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openChat() {
    requestChatOpen();
    window.location.href = "/";
  }

  async function payNow() {
    if (!booking) return;
    setProcessing(true);
    setError(null);
    try {
      const res = await fetch("/api/payment/mock-confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: booking.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(String(data.reason ?? "failed"));
      setView("success");
    } catch {
      setError("We couldn't process the payment. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="bg-stone-50 py-10 sm:py-16">
      <Container>
        <div className="mx-auto max-w-lg">
          <Brand hotelName={hotelName} />

          {view === "invalid" ? (
            <InvalidCard onOpenChat={openChat} />
          ) : view === "cancelled" && booking ? (
            <CancelledCard booking={booking} onOpenChat={openChat} />
          ) : view === "paid" && booking ? (
            <ConfirmedCard
              booking={booking}
              title="This booking has already been paid and confirmed."
              onOpenChat={openChat}
            />
          ) : view === "success" && booking ? (
            <ConfirmedCard
              booking={booking}
              title="Payment confirmed."
              subtitle="Your booking confirmation and invoice were sent to your email."
              onOpenChat={openChat}
            />
          ) : booking ? (
            <PayCard
              booking={booking}
              processing={processing}
              error={error}
              onPay={payNow}
              onOpenChat={openChat}
            />
          ) : null}

          <TrustNote />
        </div>
      </Container>
    </div>
  );
}

function Brand({ hotelName }: { hotelName: string }) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <Link href="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-600 text-sm font-bold text-white">
          AH
        </span>
        <span className="text-lg font-semibold tracking-tight text-stone-900">{hotelName}</span>
      </Link>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
        <LockIcon /> Secure payment
      </span>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">{children}</div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-1 text-sm">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-800">{value}</span>
    </div>
  );
}

function BookingSummary({ booking }: { booking: BookingDetail }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/80 p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-stone-900">Booking {booking.reference}</p>
        <span className="text-base font-semibold text-amber-700">
          {formatCurrency(booking.totalPrice, booking.currency)}
        </span>
      </div>
      <div className="mt-2 divide-y divide-stone-100">
        <Row label="Room" value={booking.roomName} />
        <Row label="Check-in" value={formatDate(booking.checkIn)} />
        <Row label="Check-out" value={formatDate(booking.checkOut)} />
        <Row label="Nights" value={booking.nights} />
        <Row label="Guests" value={booking.guests} />
        <Row label="Guest" value={booking.guestName} />
        <Row label="Email" value={booking.guestEmail} />
      </div>
    </div>
  );
}

function PayCard({
  booking,
  processing,
  error,
  onPay,
  onOpenChat,
}: {
  booking: BookingDetail;
  processing: boolean;
  error: string | null;
  onPay: () => void;
  onOpenChat: () => void;
}) {
  return (
    <Card>
      <h1 className="text-xl font-semibold text-stone-900">Complete your payment</h1>
      <p className="mt-1 text-sm text-stone-500">
        Review your stay and pay securely to confirm your booking.
      </p>

      <div className="mt-5">
        <BookingSummary booking={booking} />
      </div>

      <div className="mt-4 rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Cancellation policy
        </p>
        <p className="mt-1 text-sm text-stone-600">{booking.cancellationPolicy}</p>
      </div>

      <div className="mt-4 rounded-xl border border-stone-200 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
          Payment method
        </p>
        <div className="mt-2 flex items-center justify-between rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5">
          <span className="flex items-center gap-2 text-sm text-stone-700">
            <CardIcon /> Card ending •••• 4242
          </span>
          <span className="text-[11px] text-stone-400">Demo</span>
        </div>
        <p className="mt-2 text-[11px] text-stone-400">
          This is a mock checkout — no real card is charged.
        </p>
      </div>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <button
        type="button"
        onClick={onPay}
        disabled={processing}
        className={cn(buttonClasses("primary", "lg"), "mt-5 w-full")}
      >
        {processing ? "Processing…" : `Pay securely ${formatCurrency(booking.totalPrice, booking.currency)}`}
      </button>
      <button
        type="button"
        onClick={onOpenChat}
        className={cn(buttonClasses("ghost", "md"), "mt-2 w-full")}
      >
        Back to chat
      </button>
    </Card>
  );
}

function ConfirmedCard({
  booking,
  title,
  subtitle,
  onOpenChat,
}: {
  booking: BookingDetail;
  title: string;
  subtitle?: string;
  onOpenChat: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
          <CheckIcon />
        </span>
        <h1 className="mt-3 text-xl font-semibold text-stone-900">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-stone-500">{subtitle}</p> : null}
      </div>

      <div className="mt-5">
        <BookingSummary booking={booking} />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl border border-stone-200 px-4 py-3 text-sm">
        <span className="text-stone-500">Invoice</span>
        {booking.invoiceUrl ? (
          <a
            href={booking.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-amber-700 hover:underline"
          >
            View invoice
          </a>
        ) : (
          <span className="font-medium text-stone-700">Sent to your email</span>
        )}
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className={cn(buttonClasses("secondary", "md"), "flex-1")}>
          Back to hotel
        </Link>
        <button type="button" onClick={onOpenChat} className={cn(buttonClasses("primary", "md"), "flex-1")}>
          Open chat
        </button>
      </div>
    </Card>
  );
}

function CancelledCard({
  booking,
  onOpenChat,
}: {
  booking: BookingDetail;
  onOpenChat: () => void;
}) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <XIcon />
        </span>
        <h1 className="mt-3 text-xl font-semibold text-stone-900">
          This booking has been cancelled.
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          Please contact the AI assistant for help rebooking.
        </p>
      </div>
      <div className="mt-5">
        <BookingSummary booking={booking} />
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className={cn(buttonClasses("secondary", "md"), "flex-1")}>
          Return to hotel
        </Link>
        <button type="button" onClick={onOpenChat} className={cn(buttonClasses("primary", "md"), "flex-1")}>
          Open AI assistant
        </button>
      </div>
    </Card>
  );
}

function InvalidCard({ onOpenChat }: { onOpenChat: () => void }) {
  return (
    <Card>
      <div className="flex flex-col items-center text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-100 text-stone-500">
          <SearchIcon />
        </span>
        <h1 className="mt-3 text-xl font-semibold text-stone-900">
          We couldn&apos;t find this booking.
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          The payment link may be incorrect or expired.
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className={cn(buttonClasses("secondary", "md"), "flex-1")}>
          Return to hotel
        </Link>
        <button type="button" onClick={onOpenChat} className={cn(buttonClasses("primary", "md"), "flex-1")}>
          Open AI assistant
        </button>
      </div>
    </Card>
  );
}

function TrustNote() {
  return (
    <p className="mt-5 flex items-center justify-center gap-1.5 text-center text-xs text-stone-400">
      <LockIcon /> Payments are encrypted and processed securely. We never store your card details.
    </p>
  );
}

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
