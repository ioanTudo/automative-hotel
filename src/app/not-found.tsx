import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { buttonClasses } from "@/lib/ui";

export default function NotFound() {
  return (
    <div className="py-24">
      <Container className="max-w-xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-stone-600">
          Sorry, we couldn&apos;t find the page you were looking for. It may have moved or no
          longer exists.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClasses("primary", "md")}>
            Back to home
          </Link>
          <Link href="/rooms" className={buttonClasses("secondary", "md")}>
            Browse rooms
          </Link>
        </div>
      </Container>
    </div>
  );
}
