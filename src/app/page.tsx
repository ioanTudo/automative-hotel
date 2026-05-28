import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Hero } from "@/components/hotel/Hero";
import { RoomCard } from "@/components/hotel/RoomCard";
import { Facilities } from "@/components/hotel/Facilities";
import { Testimonials } from "@/components/hotel/Testimonials";
import { RoomImage } from "@/components/hotel/RoomImage";
import { getFeaturedRooms } from "@/lib/queries";
import { buttonClasses } from "@/lib/ui";
import { SITE } from "@/lib/site";

export default async function HomePage() {
  const featured = await getFeaturedRooms(3);

  return (
    <>
      <Hero />

      {/* Featured rooms */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <SectionHeading
              eyebrow="Where you'll stay"
              title="Featured rooms"
              description="Comfortable, well-appointed rooms for every kind of trip — from solo getaways to family holidays."
            />
            <Link href="/rooms" className={buttonClasses("secondary", "md")}>
              View all rooms
            </Link>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        </Container>
      </section>

      {/* Restaurant preview */}
      <section className="bg-stone-100 py-16 sm:py-20">
        <Container>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <RoomImage
              name={SITE.restaurant.name}
              seedKey="restaurant-preview"
              label={SITE.restaurant.name}
              className="h-72 w-full rounded-2xl"
            />
            <div>
              <SectionHeading
                eyebrow="Dine with us"
                title={SITE.restaurant.name}
                description="Our in-house restaurant serves a generous breakfast, relaxed lunches and a seasonal dinner menu made with local produce — open to guests and visitors alike."
              />
              <dl className="mt-6 space-y-2">
                {SITE.restaurant.hours.map((h) => (
                  <div
                    key={h.day}
                    className="flex justify-between border-b border-stone-200 py-2 text-sm"
                  >
                    <dt className="font-medium text-stone-700">{h.day}</dt>
                    <dd className="text-stone-600">{h.time}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-7">
                <Link href="/restaurant" className={buttonClasses("primary", "md")}>
                  Explore the restaurant
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Facilities */}
      <section className="py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Everything you need"
            title="Hotel facilities"
            description="Thoughtful touches and dependable service to make your stay easy and comfortable."
            align="center"
            className="mb-10"
          />
          <Facilities />
        </Container>
      </section>

      {/* Testimonials */}
      <section className="bg-stone-100 py-16 sm:py-20">
        <Container>
          <SectionHeading
            eyebrow="Guest stories"
            title="What our guests say"
            align="center"
            className="mb-10"
          />
          <Testimonials />
        </Container>
      </section>

      {/* Location / contact CTA */}
      <section className="py-16 sm:py-20">
        <Container>
          <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-900 text-white">
            <div className="grid gap-8 p-8 sm:p-12 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Find us &amp; say hello</h2>
                <p className="mt-3 max-w-md text-stone-300">
                  We&apos;re right in the heart of the city, close to the main attractions and
                  transport links. Have a question before you book? We&apos;re happy to help.
                </p>
                <dl className="mt-6 space-y-2 text-sm text-stone-300">
                  <div>
                    <dt className="inline font-semibold text-white">Address: </dt>
                    <dd className="inline">{SITE.address}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white">Phone: </dt>
                    <dd className="inline">{SITE.phone}</dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold text-white">Email: </dt>
                    <dd className="inline">{SITE.email}</dd>
                  </div>
                </dl>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/contact" className={buttonClasses("primary", "md")}>
                    Contact us
                  </Link>
                  <Link href="/booking" className={buttonClasses("secondary", "md")}>
                    Book a Room
                  </Link>
                </div>
              </div>
              <div className="flex h-56 items-center justify-center rounded-2xl bg-linear-to-br from-stone-700 to-stone-800 text-sm text-stone-400">
                Map placeholder
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
