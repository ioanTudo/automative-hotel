"use server";

import { contactSchema } from "@/lib/validations";
import {
  type ActionResult,
  actionError,
  actionOk,
  fieldErrorsFromZod,
} from "@/lib/action-result";

export async function submitContactAction(input: unknown): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return actionError("Please fix the highlighted fields.", fieldErrorsFromZod(parsed.error));
  }

  // MVP: there is no Contact model yet. Log the message server-side so the
  // wiring is real and ready to swap for email / persistence later.
  console.info("[contact] new message", {
    name: parsed.data.name,
    email: parsed.data.email,
    subject: parsed.data.subject,
  });

  return actionOk(undefined);
}
