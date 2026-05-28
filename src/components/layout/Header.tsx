"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS, SITE } from "@/lib/site";
import { buttonClasses, cn } from "@/lib/ui";
import type { SessionUser } from "@/lib/types";

export function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-40 border-b border-stone-200 bg-[#faf8f5]/85 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-600 text-base font-bold text-white">
            A
          </span>
          <span className="flex flex-col leading-none">
            <span className="text-base font-semibold tracking-tight text-stone-900">
              {SITE.name}
            </span>
            <span className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-amber-700">
              {"★".repeat(SITE.rating)} Hotel &amp; Restaurant
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive(link.href)
                  ? "text-amber-700"
                  : "text-stone-600 hover:text-stone-900",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link href="/admin" className={buttonClasses("ghost", "sm")}>
                  Admin
                </Link>
              ) : null}
              <Link href="/account" className={buttonClasses("secondary", "sm")}>
                {user.name.split(" ")[0]}
              </Link>
            </>
          ) : (
            <Link href="/login" className={buttonClasses("ghost", "sm")}>
              Log in
            </Link>
          )}
          <Link href="/booking" className={buttonClasses("primary", "sm")}>
            Book a Room
          </Link>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-stone-700 hover:bg-stone-100 md:hidden"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? (
              <>
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="border-t border-stone-200 bg-[#faf8f5] md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-md px-3 py-2 text-sm font-medium",
                  isActive(link.href)
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-700 hover:bg-stone-100",
                )}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 flex flex-col gap-2 border-t border-stone-200 pt-3">
              {user ? (
                <>
                  {user.role === "ADMIN" ? (
                    <Link href="/admin" onClick={() => setOpen(false)} className={buttonClasses("secondary", "md")}>
                      Admin dashboard
                    </Link>
                  ) : null}
                  <Link href="/account" onClick={() => setOpen(false)} className={buttonClasses("secondary", "md")}>
                    My account
                  </Link>
                </>
              ) : (
                <Link href="/login" onClick={() => setOpen(false)} className={buttonClasses("secondary", "md")}>
                  Log in
                </Link>
              )}
              <Link href="/booking" onClick={() => setOpen(false)} className={buttonClasses("primary", "md")}>
                Book a Room
              </Link>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
