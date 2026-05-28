import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { RoomSearch } from "@/components/hotel/RoomSearch";
import { buttonClasses } from "@/lib/ui";
import { SITE } from "@/lib/site";

export function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-stone-200 bg-linear-to-b from-amber-50 via-[#faf8f5] to-[#faf8f5]">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-40 h-64 w-64 rounded-full bg-orange-200/30 blur-3xl" />

      <Container className="relative py-16 sm:py-24">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white/70 px-3 py-1 text-xs font-semibold text-amber-800">
            <span aria-hidden>{"★".repeat(SITE.rating)}</span>
            3-Star Hotel &amp; Restaurant · Cluj-Napoca
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
            A warm welcome at {SITE.name}
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-stone-600">
            {SITE.description}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking" className={buttonClasses("primary", "lg")}>
              Book a Room
            </Link>
            <Link href="/restaurant" className={buttonClasses("secondary", "lg")}>
              View Restaurant
            </Link>
          </div>
        </div>

        <div className="mt-10 lg:mt-14">
          <p className="mb-3 text-sm font-medium text-stone-500">
            Check availability for your dates
          </p>
          <RoomSearch />
        </div>
      </Container>
    </section>
  );
}
