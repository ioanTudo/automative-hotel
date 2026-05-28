"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { loginAction } from "@/lib/actions/auth";
import { Field, inputClasses } from "@/components/ui/Field";
import { buttonClasses } from "@/lib/ui";

export function LoginForm({ callbackUrl = "/account" }: { callbackUrl?: string }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    const res = await loginAction(data);
    if (!res.ok) {
      setServerError(res.error);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {serverError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {serverError}
        </p>
      ) : null}

      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <input id="email" type="email" autoComplete="email" {...register("email")} className={inputClasses} placeholder="you@example.com" />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <input id="password" type="password" autoComplete="current-password" {...register("password")} className={inputClasses} placeholder="••••••••" />
      </Field>

      <button type="submit" disabled={isSubmitting} className={buttonClasses("primary", "lg", "w-full")}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>

      <p className="text-center text-sm text-stone-600">
        New here?{" "}
        <Link href="/register" className="font-medium text-amber-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
