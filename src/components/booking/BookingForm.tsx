"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { bookingSchema, type BookingInput } from "@/lib/validations";
import { createBookingAction } from "@/lib/actions/bookings";
import { BookingSummary } from "@/components/booking/BookingSummary";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";
import {
  calculateNights,
  calculateTotalPrice,
  formatCurrency,
  toDateInputValue,
} from "@/lib/booking-utils";

export type BookingFormRoom = {
  id: string;
  name: string;
  pricePerNight: number;
  capacity: number;
};

type Step = "form" | "review" | "done";

function tomorrow(value: string): string {
  const d = new Date(value);
  d.setDate(d.getDate() + 1);
  return toDateInputValue(d);
}

export function BookingForm({
  rooms,
  defaults,
  lockRoom = false,
}: {
  rooms: BookingFormRoom[];
  defaults?: Partial<BookingInput>;
  lockRoom?: boolean;
}) {
  const today = toDateInputValue(new Date());
  const initialRoomId = defaults?.roomId ?? rooms[0]?.id ?? "";

  const {
    register,
    handleSubmit,
    watch,
    setError,
    getValues,
    formState: { errors },
  } = useForm<BookingInput>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      roomId: initialRoomId,
      guestName: defaults?.guestName ?? "",
      guestEmail: defaults?.guestEmail ?? "",
      guestPhone: defaults?.guestPhone ?? "",
      checkIn: defaults?.checkIn ?? today,
      checkOut: defaults?.checkOut ?? tomorrow(defaults?.checkIn ?? today),
      guests: defaults?.guests ?? 1,
      specialRequests: defaults?.specialRequests ?? "",
    },
  });

  const [step, setStep] = useState<Step>("form");
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const values = watch();
  const selectedRoom = rooms.find((r) => r.id === values.roomId) ?? rooms[0];
  const nights =
    values.checkIn && values.checkOut
      ? calculateNights(values.checkIn, values.checkOut)
      : 0;
  const liveTotal = selectedRoom
    ? calculateTotalPrice(selectedRoom.pricePerNight, values.checkIn, values.checkOut)
    : 0;

  async function confirm() {
    setSubmitting(true);
    setServerError(null);
    const res = await createBookingAction(getValues());
    setSubmitting(false);

    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "_form") continue;
          setError(key as keyof BookingInput, { message });
        }
      }
      setStep("form");
      return;
    }
    setBookingId(res.data.bookingId);
    setStep("done");
  }

  if (step === "done" && selectedRoom) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <h3 className="text-lg font-semibold text-emerald-900">Booking received!</h3>
          <p className="mt-1 text-sm text-emerald-800">
            Thanks, {values.guestName}. Your request is pending confirmation and we&apos;ve
            noted reference{" "}
            <span className="font-mono font-semibold">{bookingId?.slice(0, 8)}</span>. A
            confirmation will follow by email.
          </p>
        </div>
        <BookingSummary
          roomName={selectedRoom.name}
          pricePerNight={selectedRoom.pricePerNight}
          checkIn={values.checkIn}
          checkOut={values.checkOut}
          guests={values.guests}
          guestName={values.guestName}
          guestEmail={values.guestEmail}
          guestPhone={values.guestPhone}
          specialRequests={values.specialRequests || undefined}
        />
        <div className="flex flex-wrap gap-3">
          <Link href="/account/bookings" className={buttonClasses("primary", "md")}>
            View my bookings
          </Link>
          <Link href="/rooms" className={buttonClasses("secondary", "md")}>
            Browse more rooms
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(() => setStep("review"))} className="space-y-5">
      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      {step === "review" && selectedRoom ? (
        <>
          <BookingSummary
            roomName={selectedRoom.name}
            pricePerNight={selectedRoom.pricePerNight}
            checkIn={values.checkIn}
            checkOut={values.checkOut}
            guests={values.guests}
            guestName={values.guestName}
            guestEmail={values.guestEmail}
            guestPhone={values.guestPhone}
            specialRequests={values.specialRequests || undefined}
          />
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={confirm}
              disabled={submitting}
              className={buttonClasses("primary", "lg")}
            >
              {submitting ? "Confirming…" : "Confirm booking"}
            </button>
            <button
              type="button"
              onClick={() => setStep("form")}
              className={buttonClasses("secondary", "lg")}
            >
              Edit details
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Room" htmlFor="roomId" error={errors.roomId?.message} className="sm:col-span-2">
              {lockRoom || rooms.length === 1 ? (
                <>
                  <input type="hidden" {...register("roomId")} />
                  <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2.5 text-sm font-medium text-stone-800">
                    {selectedRoom?.name} — {formatCurrency(selectedRoom?.pricePerNight ?? 0)}/night
                  </p>
                </>
              ) : (
                <select id="roomId" {...register("roomId")} className={inputClasses}>
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} — {formatCurrency(r.pricePerNight)}/night (sleeps {r.capacity})
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label="Check-in" htmlFor="checkIn" error={errors.checkIn?.message}>
              <input
                id="checkIn"
                type="date"
                min={today}
                {...register("checkIn")}
                className={inputClasses}
              />
            </Field>

            <Field label="Check-out" htmlFor="checkOut" error={errors.checkOut?.message}>
              <input
                id="checkOut"
                type="date"
                min={tomorrow(values.checkIn || today)}
                {...register("checkOut")}
                className={inputClasses}
              />
            </Field>

            <Field
              label="Guests"
              htmlFor="guests"
              error={errors.guests?.message}
              hint={selectedRoom ? `This room sleeps up to ${selectedRoom.capacity}.` : undefined}
            >
              <input
                id="guests"
                type="number"
                min={1}
                max={selectedRoom?.capacity ?? 20}
                {...register("guests", { valueAsNumber: true })}
                className={inputClasses}
              />
            </Field>

            <Field label="Full name" htmlFor="guestName" error={errors.guestName?.message}>
              <input id="guestName" {...register("guestName")} className={inputClasses} placeholder="Jane Doe" />
            </Field>

            <Field label="Email" htmlFor="guestEmail" error={errors.guestEmail?.message}>
              <input id="guestEmail" type="email" {...register("guestEmail")} className={inputClasses} placeholder="jane@example.com" />
            </Field>

            <Field label="Phone" htmlFor="guestPhone" error={errors.guestPhone?.message}>
              <input id="guestPhone" {...register("guestPhone")} className={inputClasses} placeholder="+40 720 000 000" />
            </Field>

            <Field
              label="Special requests"
              htmlFor="specialRequests"
              error={errors.specialRequests?.message}
              className="sm:col-span-2"
            >
              <textarea
                id="specialRequests"
                rows={3}
                {...register("specialRequests")}
                className={cn(inputClasses, "resize-none")}
                placeholder="Quiet room, late arrival, anything else…"
              />
            </Field>
          </div>

          <div className="flex flex-col gap-4 border-t border-stone-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-stone-600">
              {nights > 0 && selectedRoom ? (
                <span>
                  {nights} {nights === 1 ? "night" : "nights"} ·{" "}
                  <span className="font-semibold text-amber-700">{formatCurrency(liveTotal)}</span> total
                </span>
              ) : (
                <span>Select your dates to see the total.</span>
              )}
            </div>
            <button type="submit" className={buttonClasses("primary", "lg")}>
              Review booking
            </button>
          </div>
        </>
      )}
    </form>
  );
}
