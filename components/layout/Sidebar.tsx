"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "./navItems";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]/85 p-4 backdrop-blur md:flex">
      <Link href="/dashboard" className="mb-8 block px-2 pt-1">
        <Logo showTagline />
      </Link>

      <nav className="flex flex-col gap-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-sm font-medium transition-all",
                active
                  ? "accent-gradient text-white shadow-[0_8px_20px_rgba(255,138,30,0.35)]"
                  : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
              )}
            >
              <Icon className="h-[18px] w-[18px]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-2 pt-6 text-[10px] text-[var(--color-muted)]">
        BH Wolves Manager
      </div>
    </aside>
  );
}
