"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  restaurantReservationSchema,
  type RestaurantReservationInput,
} from "@/lib/validations";
import { createReservationAction } from "@/lib/actions/restaurant";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";

const TIME_SLOTS = [
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30",
];

export function ReservationForm() {
  const today = new Date().toISOString().slice(0, 10);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RestaurantReservationInput>({
    resolver: zodResolver(restaurantReservationSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      date: today,
      time: "19:00",
      guests: 2,
      message: "",
    },
  });

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = await createReservationAction(data);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "_form") continue;
          setError(key as keyof RestaurantReservationInput, { message });
        }
      }
      return;
    }
    reset();
    setDone(true);
  });

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="text-lg font-semibold text-emerald-900">Reservation requested</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Thank you! We&apos;ve received your table request and will confirm by email or phone
          shortly.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className={buttonClasses("secondary", "sm", "mt-4")}
        >
          Make another reservation
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="r-name" error={errors.name?.message}>
          <input id="r-name" {...register("name")} className={inputClasses} placeholder="Your name" />
        </Field>
        <Field label="Phone" htmlFor="r-phone" error={errors.phone?.message}>
          <input id="r-phone" {...register("phone")} className={inputClasses} placeholder="+40 720 000 000" />
        </Field>
        <Field label="Email" htmlFor="r-email" error={errors.email?.message} className="sm:col-span-2">
          <input id="r-email" type="email" {...register("email")} className={inputClasses} placeholder="you@example.com" />
        </Field>
        <Field label="Date" htmlFor="r-date" error={errors.date?.message}>
          <input id="r-date" type="date" min={today} {...register("date")} className={inputClasses} />
        </Field>
        <Field label="Time" htmlFor="r-time" error={errors.time?.message}>
          <select id="r-time" {...register("time")} className={inputClasses}>
            {TIME_SLOTS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Guests" htmlFor="r-guests" error={errors.guests?.message}>
          <input
            id="r-guests"
            type="number"
            min={1}
            max={30}
            {...register("guests", { valueAsNumber: true })}
            className={inputClasses}
          />
        </Field>
        <Field label="Message" htmlFor="r-message" error={errors.message?.message} className="sm:col-span-2">
          <textarea
            id="r-message"
            rows={3}
            {...register("message")}
            className={cn(inputClasses, "resize-none")}
            placeholder="Allergies, special occasion, seating preference…"
          />
        </Field>
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg")}>
        {isSubmitting ? "Sending…" : "Request a table"}
      </button>
    </form>
  );
}
