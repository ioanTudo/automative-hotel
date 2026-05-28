import { cn } from "@/lib/ui";

// Decorative gradient placeholder used in place of real photography for the
// MVP. The Room model still carries `imageUrl` for when real images are added.

const GRADIENTS = [
  "from-amber-200 via-orange-200 to-rose-200",
  "from-stone-200 via-stone-300 to-stone-400",
  "from-rose-200 via-amber-100 to-amber-200",
  "from-emerald-200 via-teal-200 to-cyan-200",
  "from-sky-200 via-indigo-200 to-violet-200",
  "from-amber-100 via-yellow-100 to-lime-200",
];

function pickGradient(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return GRADIENTS[hash % GRADIENTS.length];
}

export function RoomImage({
  name,
  seedKey,
  label,
  className,
}: {
  name: string;
  seedKey?: string;
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-linear-to-br",
        pickGradient(seedKey ?? name),
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="absolute -bottom-3 -right-2 h-28 w-28 text-white/40"
      >
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2" />
      </svg>
      <span className="relative z-10 px-4 text-center text-sm font-semibold uppercase tracking-wide text-stone-700/80">
        {label ?? name}
      </span>
    </div>
  );
}
