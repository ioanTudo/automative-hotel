import Link from "next/link";
import { cn } from "@/lib/ui";

const LINKS = [
  { href: "/admin", label: "Dashboard", key: "dashboard" },
  { href: "/admin/conversations", label: "AI conversations", key: "conversations" },
  { href: "/admin/tickets", label: "Support tickets", key: "tickets" },
  { href: "/admin/knowledge-base", label: "Knowledge base", key: "knowledge-base" },
] as const;

export type AdminSection = (typeof LINKS)[number]["key"];

export function AdminSubnav({ active }: { active: AdminSection }) {
  return (
    <nav className="mt-6 flex flex-wrap gap-1 border-b border-stone-200">
      {LINKS.map((l) => (
        <Link
          key={l.key}
          href={l.href}
          className={cn(
            "border-b-2 px-4 py-2.5 text-sm font-medium",
            active === l.key
              ? "border-amber-600 text-amber-700"
              : "border-transparent text-stone-500 hover:text-stone-800",
          )}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
