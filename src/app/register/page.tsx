import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSessionUser } from "@/lib/auth";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage() {
  const user = await getSessionUser();
  if (user) redirect("/account");

  return (
    <div className="py-16 sm:py-24">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-stone-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Book faster and keep track of your stays.
          </p>
          <div className="mt-6">
            <RegisterForm />
          </div>
        </div>
      </Container>
    </div>
  );
}
