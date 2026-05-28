import { Container } from "@/components/ui/Container";
import { RoomImage } from "@/components/hotel/RoomImage";
import { SITE } from "@/lib/site";

export function RestaurantHero() {
  return (
    <section className="border-b border-stone-200 bg-linear-to-b from-stone-100 to-[#faf8f5]">
      <Container className="py-14 sm:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-amber-700">
              Hotel restaurant
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {SITE.restaurant.name}
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
              Honest, seasonal cooking in a relaxed setting. Whether it&apos;s an early
              breakfast before exploring the city or a leisurely dinner, you&apos;re always
              welcome at our table.
            </p>
          </div>
          <RoomImage
            name={SITE.restaurant.name}
            seedKey="restaurant-hero"
            label={SITE.restaurant.name}
            className="h-72 w-full rounded-3xl sm:h-80"
          />
        </div>
      </Container>
    </section>
  );
}
