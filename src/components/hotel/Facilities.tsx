import type { ReactNode } from "react";

type Facility = { title: string; description: string; icon: ReactNode };

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

const FACILITIES: Facility[] = [
  {
    title: "Free Wi-Fi",
    description: "Fast wireless internet in every room and throughout the hotel.",
    icon: (
      <svg {...iconProps}>
        <path d="M5 12.55a11 11 0 0 1 14 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
  },
  {
    title: "On-site parking",
    description: "Secure parking right at the hotel, available for all guests.",
    icon: (
      <svg {...iconProps}>
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    ),
  },
  {
    title: "Restaurant & bar",
    description: "Hearty breakfasts and à la carte dining at The Garden Table.",
    icon: (
      <svg {...iconProps}>
        <path d="M3 2v7a3 3 0 0 0 6 0V2" />
        <line x1="6" y1="9" x2="6" y2="22" />
        <path d="M16 2v20" />
        <path d="M16 8c0-3 1-6 4-6v6" />
      </svg>
    ),
  },
  {
    title: "24-hour reception",
    description: "Friendly staff on hand around the clock for anything you need.",
    icon: (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15 14" />
      </svg>
    ),
  },
  {
    title: "Daily housekeeping",
    description: "Fresh linens and a tidy room every day of your stay.",
    icon: (
      <svg {...iconProps}>
        <path d="M3 21h18" />
        <path d="M5 21V8l7-5 7 5v13" />
        <path d="M9 21v-6h6v6" />
      </svg>
    ),
  },
  {
    title: "Family friendly",
    description: "Spacious family rooms, extra bedding and a warm welcome for kids.",
    icon: (
      <svg {...iconProps}>
        <circle cx="9" cy="7" r="3" />
        <path d="M3 21v-1a6 6 0 0 1 12 0v1" />
        <circle cx="17" cy="9" r="2" />
        <path d="M21 21v-1a4 4 0 0 0-3-3.87" />
      </svg>
    ),
  },
];

export function Facilities() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {FACILITIES.map((f) => (
        <div
          key={f.title}
          className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-5"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
            {f.icon}
          </span>
          <div>
            <h3 className="font-semibold text-stone-900">{f.title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{f.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
