import { cn } from "@/lib/ui";

const STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 ring-amber-200",
  CONFIRMED: "bg-emerald-100 text-emerald-800 ring-emerald-200",
  CANCELLED: "bg-stone-200 text-stone-600 ring-stone-300",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ring-1 ring-inset",
        STYLES[status] ?? "bg-stone-100 text-stone-700 ring-stone-200",
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
