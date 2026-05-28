import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ContactForm } from "@/components/contact/ContactForm";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${SITE.name}.`,
};

export default function ContactPage() {
  return (
    <div className="py-12 sm:py-16">
      <Container>
        <SectionHeading
          eyebrow="Get in touch"
          title="Contact us"
          description="Questions about a booking, the restaurant or anything else? We're here to help, 24 hours a day."
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_1.2fr]">
          {/* Details */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-base font-semibold text-stone-900">Hotel details</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div>
                  <dt className="font-medium text-stone-500">Address</dt>
                  <dd className="mt-0.5 text-stone-800">{SITE.address}</dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-500">Phone</dt>
                  <dd className="mt-0.5">
                    <a href={`tel:${SITE.phone.replace(/\s/g, "")}`} className="text-amber-700 hover:underline">
                      {SITE.phone}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="font-medium text-stone-500">Email</dt>
                  <dd className="mt-0.5">
                    <a href={`mailto:${SITE.email}`} className="text-amber-700 hover:underline">
                      {SITE.email}
                    </a>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-6">
              <h2 className="text-base font-semibold text-stone-900">Opening hours</h2>
              <dl className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between border-b border-stone-100 pb-3">
                  <dt className="font-medium text-stone-700">Reception</dt>
                  <dd className="text-stone-600">24 hours</dd>
                </div>
                {SITE.restaurant.hours.map((h) => (
                  <div key={h.day} className="flex justify-between border-b border-stone-100 pb-3">
                    <dt className="font-medium text-stone-700">Restaurant · {h.day}</dt>
                    <dd className="text-stone-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="flex h-52 items-center justify-center rounded-2xl border border-stone-200 bg-linear-to-br from-stone-200 to-stone-300 text-sm font-medium text-stone-500">
              Map placeholder
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-stone-200 bg-white p-6 sm:p-8">
            <h2 className="text-lg font-semibold text-stone-900">Send us a message</h2>
            <p className="mt-1 text-sm text-stone-500">
              We typically reply within one business day.
            </p>
            <div className="mt-6">
              <ContactForm />
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
