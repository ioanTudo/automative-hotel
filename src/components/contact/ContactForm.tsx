"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { contactSchema, type ContactInput } from "@/lib/validations";
import { submitContactAction } from "@/lib/actions/contact";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses, cn } from "@/lib/ui";

export function ContactForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: "", message: "" },
  });

  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = await submitContactAction(data);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "_form") continue;
          setError(key as keyof ContactInput, { message });
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
        <h3 className="text-lg font-semibold text-emerald-900">Message sent</h3>
        <p className="mt-1 text-sm text-emerald-800">
          Thanks for getting in touch — we&apos;ll reply as soon as we can.
        </p>
        <button
          type="button"
          onClick={() => setDone(false)}
          className={buttonClasses("secondary", "sm", "mt-4")}
        >
          Send another message
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
        <Field label="Name" htmlFor="c-name" error={errors.name?.message}>
          <input id="c-name" {...register("name")} className={inputClasses} placeholder="Your name" />
        </Field>
        <Field label="Email" htmlFor="c-email" error={errors.email?.message}>
          <input id="c-email" type="email" {...register("email")} className={inputClasses} placeholder="you@example.com" />
        </Field>
        <Field label="Subject" htmlFor="c-subject" error={errors.subject?.message} className="sm:col-span-2">
          <input id="c-subject" {...register("subject")} className={inputClasses} placeholder="How can we help?" />
        </Field>
        <Field label="Message" htmlFor="c-message" error={errors.message?.message} className="sm:col-span-2">
          <textarea
            id="c-message"
            rows={5}
            {...register("message")}
            className={cn(inputClasses, "resize-none")}
            placeholder="Your message…"
          />
        </Field>
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg")}>
        {isSubmitting ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
