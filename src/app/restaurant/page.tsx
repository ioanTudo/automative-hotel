import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RestaurantHero } from "@/components/restaurant/RestaurantHero";
import { MenuPreview } from "@/components/restaurant/MenuPreview";
import { ReservationForm } from "@/components/restaurant/ReservationForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Restaurant",
  description: `${SITE.restaurant.name} — the restaurant at ${SITE.name}.`,
};

const OFFERS = [
  {
    title: "Breakfast included",
    description: "Start every morning with our buffet breakfast, complimentary for hotel guests.",
  },
  {
    title: "Midweek set menu",
    description: "Two courses for €22, available Monday to Thursday evenings.",
  },
  {
    title: "Sunday family lunch",
    description: "Children eat for half price with every adult main course on Sundays.",
  },
];

export default function RestaurantPage() {
  return (
    <>
      <RestaurantHero />

      {/* About + opening hours */}
      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <SectionHeading eyebrow="About" title="Made with care, served with warmth" />
              <p className="mt-4 leading-relaxed text-stone-700">
                {SITE.restaurant.name} is the heart of {SITE.name}. Our kitchen focuses on
                simple, well-cooked dishes using fresh, local produce. The dining room is bright
                and unfussy — a comfortable place to eat whether you&apos;re staying with us or
                joining from the neighbourhood.
              </p>
              <p className="mt-4 leading-relaxed text-stone-700">
                We cater happily for families, dietary requirements and small celebrations. Just
                let us know what you need when you reserve.
              </p>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h3 className="text-base font-semibold text-stone-900">Opening hours</h3>
              <dl className="mt-4 space-y-3">
                {SITE.restaurant.hours.map((h) => (
                  <div key={h.day} className="flex justify-between border-b border-stone-100 pb-3 text-sm">
                    <dt className="font-medium text-stone-700">{h.day}</dt>
                    <dd className="text-stone-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-sm text-stone-500">
                Reservations: <span className="font-medium text-stone-700">{SITE.restaurant.phone}</span>
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Menu preview */}
      <section className="bg-stone-100 py-14 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="On the menu"
            title="A taste of what we serve"
            description="A small preview of our seasonal menu. The full menu changes regularly with the best produce available."
            align="center"
            className="mb-10"
          />
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
            <MenuPreview />
          </div>
        </Container>
      </section>

      {/* Special offers */}
      <section className="py-14 sm:py-20">
        <Container>
          <SectionHeading eyebrow="Special offers" title="A little extra" className="mb-8" />
          <div className="grid gap-5 md:grid-cols-3">
            {OFFERS.map((o) => (
              <div key={o.title} className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h3 className="font-semibold text-amber-900">{o.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-amber-800">{o.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Reservation */}
      <section className="bg-stone-100 py-14 sm:py-20">
        <Container>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr]">
            <SectionHeading
              eyebrow="Reserve a table"
              title="Join us for a meal"
              description="Tell us when you'd like to dine and how many will join you. We'll confirm your table by email or phone."
            />
            <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
              <ReservationForm />
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
