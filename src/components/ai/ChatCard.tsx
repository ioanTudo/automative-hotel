"use client";

import { formatCurrency, formatDate } from "@/lib/booking-utils";
import { buttonClasses, cn } from "@/lib/ui";
import { PaymentLinkCard } from "@/components/ai/PaymentLinkCard";
import type {
  Card,
  BookingSummaryCard as BookingSummaryCardT,
  InvoiceCard as InvoiceCardT,
  RestaurantReservationCard as RestaurantReservationCardT,
  RoomResultsCard as RoomResultsCardT,
  TicketCard as TicketCardT,
} from "@/lib/ai/types";

type Props = { card: Card; onAction: (text: string) => void };

export function ChatCard({ card, onAction }: Props) {
  switch (card.type) {
    case "room_results":
      return <RoomResults card={card} onAction={onAction} />;
    case "booking_summary":
      return <BookingSummary card={card} />;
    case "payment_link":
      return <PaymentLinkCard card={card} />;
    case "invoice":
      return <InvoiceBlock card={card} />;
    case "ticket":
      return <TicketBlock card={card} />;
    case "restaurant_reservation":
      return <RestaurantBlock card={card} />;
    default:
      return null;
  }
}

const cardShell =
  "rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700 shadow-sm";

function Badge({
  children,
  tone = "stone",
}: {
  children: React.ReactNode;
  tone?: string;
}) {
  const tones: Record<string, string> = {
    stone: "bg-stone-100 text-stone-700",
    amber: "bg-amber-100 text-amber-800",
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-medium",
        tones[tone] ?? tones.stone,
      )}
    >
      {children}
    </span>
  );
}

function statusTone(status: string): string {
  const s = status.toLowerCase();
  if (["confirmed", "paid", "resolved"].includes(s)) return "green";
  if (["cancelled", "failed", "refunded"].includes(s)) return "red";
  if (["pending", "unpaid", "open"].includes(s)) return "amber";
  return "stone";
}

function priorityTone(priority: string): string {
  const p = priority.toLowerCase();
  if (p === "urgent") return "red";
  if (p === "high") return "amber";
  return "stone";
}

function RoomResults({
  card,
  onAction,
}: {
  card: RoomResultsCardT;
  onAction: (t: string) => void;
}) {
  if (card.rooms.length === 0) {
    return (
      <div className={cardShell}>
        <p className="font-medium text-stone-800">No availability</p>
        <p className="mt-1 text-stone-600">
          Nothing free for {card.guests} guest(s) on {formatDate(card.checkIn)}{" "}
          – {formatDate(card.checkOut)}.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">
        {card.nights} night(s) · {card.guests} guest(s) ·{" "}
        {formatDate(card.checkIn)} – {formatDate(card.checkOut)}
      </p>
      {card.rooms.map((room) => (
        <div key={room.roomId} className={cardShell}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-stone-900">{room.name}</p>
              <p className="text-xs text-stone-500">Sleeps {room.capacity}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-amber-700">
                {formatCurrency(room.pricePerNight, room.currency)}
              </p>
              <p className="text-[11px] text-stone-500">per night</p>
            </div>
          </div>
          {room.amenities.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {room.amenities.slice(0, 3).map((a) => (
                <Badge key={a}>{a}</Badge>
              ))}
            </div>
          ) : null}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <p className="text-xs text-stone-600">
              Total{" "}
              <span className="font-semibold text-stone-800">
                {formatCurrency(room.totalPrice, room.currency)}
              </span>
            </p>
            <button
              type="button"
              onClick={() => onAction(`Book the ${room.name}`)}
              className={buttonClasses("primary", "sm")}
            >
              Book this room
            </button>
          </div>
        </div>
      ))}
      <p className="px-1 text-[11px] text-stone-400">
        {card.cancellationPolicy}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 py-0.5">
      <span className="text-stone-500">{label}</span>
      <span className="text-right font-medium text-stone-800">{value}</span>
    </div>
  );
}

function BookingSummary({ card }: { card: BookingSummaryCardT }) {
  return (
    <div className={cardShell}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-stone-900">Booking {card.reference}</p>
        <div className="flex gap-1">
          <Badge tone={statusTone(card.status)}>
            {card.status.toLowerCase()}
          </Badge>
          <Badge tone={statusTone(card.paymentStatus)}>
            {card.paymentStatus}
          </Badge>
        </div>
      </div>
      <div className="mt-2">
        <Row label="Room" value={card.roomName} />
        <Row label="Guest" value={card.guestName} />
        <Row
          label="Dates"
          value={`${formatDate(card.checkIn)} – ${formatDate(card.checkOut)}`}
        />
        <Row
          label="Nights / guests"
          value={`${card.nights} / ${card.guests}`}
        />
        <Row
          label="Total"
          value={formatCurrency(card.totalPrice, card.currency)}
        />
      </div>
      {card.note ? (
        <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-800">
          {card.note}
        </p>
      ) : null}
    </div>
  );
}

function InvoiceBlock({ card }: { card: InvoiceCardT }) {
  return (
    <div className={cardShell}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-stone-900">
          Invoice {card.invoiceNumber}
        </p>
        <span className="font-semibold text-amber-700">
          {formatCurrency(card.total, card.currency)}
        </span>
      </div>
      <p className="mt-1 text-xs text-stone-500">
        Sent to {card.recipientEmail}
      </p>
      <a
        href={card.url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(buttonClasses("secondary", "sm"), "mt-2.5")}
      >
        View / download
      </a>
    </div>
  );
}

function TicketBlock({ card }: { card: TicketCardT }) {
  return (
    <div className={cardShell}>
      <div className="flex items-center justify-between">
        <p className="font-semibold capitalize text-stone-900">
          {card.ticketType} request
        </p>
        <div className="flex gap-1">
          <Badge tone={priorityTone(card.priority)}>{card.priority}</Badge>
          <Badge tone={statusTone(card.status)}>
            {card.status.replace("_", " ")}
          </Badge>
        </div>
      </div>
      {card.roomNumber ? (
        <p className="mt-1 text-xs text-stone-500">Room {card.roomNumber}</p>
      ) : null}
      <p className="mt-1.5 text-stone-700">{card.message}</p>
    </div>
  );
}

function RestaurantBlock({ card }: { card: RestaurantReservationCardT }) {
  return (
    <div className={cardShell}>
      <div className="flex items-center justify-between">
        <p className="font-semibold text-stone-900">Table request</p>
        <Badge tone={statusTone(card.status)}>
          {card.status.toLowerCase()}
        </Badge>
      </div>
      <div className="mt-2">
        <Row label="Name" value={card.name} />
        <Row label="When" value={`${formatDate(card.date)} · ${card.time}`} />
        <Row label="Guests" value={card.guests} />
      </div>
    </div>
  );
}
