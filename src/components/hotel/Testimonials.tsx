type Testimonial = {
  quote: string;
  name: string;
  detail: string;
  rating: number;
};

const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "Spotless room, comfortable bed and the friendliest reception team. The breakfast at the restaurant was a lovely start to each day.",
    name: "Elena M.",
    detail: "Stayed in a Double Room",
    rating: 5,
  },
  {
    quote:
      "Great value for the location. We booked a Family Room and there was plenty of space for the kids. We'll definitely be back.",
    name: "Andrei & Sofia",
    detail: "Stayed in a Family Room",
    rating: 5,
  },
  {
    quote:
      "Easy booking, smooth check-in and a quiet night's sleep. Exactly what I needed for a short business trip.",
    name: "Daniel P.",
    detail: "Stayed in a Deluxe Room",
    rating: 4,
  },
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 text-amber-500" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className={i < rating ? "text-amber-500" : "text-stone-300"}>
          ★
        </span>
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {TESTIMONIALS.map((t) => (
        <figure
          key={t.name}
          className="flex flex-col rounded-2xl border border-stone-200 bg-white p-6"
        >
          <Stars rating={t.rating} />
          <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-stone-700">
            “{t.quote}”
          </blockquote>
          <figcaption className="mt-5 border-t border-stone-100 pt-4">
            <p className="text-sm font-semibold text-stone-900">{t.name}</p>
            <p className="text-xs text-stone-500">{t.detail}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
