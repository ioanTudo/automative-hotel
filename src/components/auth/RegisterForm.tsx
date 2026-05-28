"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterInput } from "@/lib/validations";
import { registerAction } from "@/lib/actions/auth";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses } from "@/lib/ui";

export function RegisterForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = await registerAction(data);
    if (!res.ok) {
      setServerError(res.error);
      if (res.fieldErrors) {
        for (const [key, message] of Object.entries(res.fieldErrors)) {
          if (key === "_form") continue;
          setError(key as keyof RegisterInput, { message });
        }
      }
      return;
    }
    router.push("/account");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <Field label="Full name" htmlFor="name" error={errors.name?.message}>
        <input id="name" autoComplete="name" {...register("name")} className={inputClasses} placeholder="Jane Doe" />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" {...register("email")} className={inputClasses} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} hint="At least 8 characters.">
        <input id="password" type="password" autoComplete="new-password" {...register("password")} className={inputClasses} placeholder="••••••••" />
      </Field>
      <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
        <input id="confirmPassword" type="password" autoComplete="new-password" {...register("confirmPassword")} className={inputClasses} placeholder="••••••••" />
      </Field>

      <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg", "w-full")}>
        {isSubmitting ? "Creating account…" : "Create account"}
      </button>

      <p className="text-center text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-amber-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
