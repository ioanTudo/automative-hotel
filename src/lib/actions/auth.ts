"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { loginSchema, registerSchema } from "@/lib/validations";
import {
  type ActionResult,
  actionError,
  actionOk,
  fieldErrorsFromZod,
} from "@/lib/action-result";
import type { UserRole } from "@/lib/types";

export async function registerAction(input: unknown): Promise<ActionResult> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return actionError("An account with this email already exists.", {
      email: "This email is already registered.",
    });
  }

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "USER",
    },
  });

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: "USER",
  });
  return actionOk(undefined);
}

export async function loginAction(input: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return actionError("Invalid email or password.");
  }

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as UserRole,
  });
  return actionOk(undefined);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}
