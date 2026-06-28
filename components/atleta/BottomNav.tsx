"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Droplets, CalendarDays, Camera } from "lucide-react";
import { cn } from "@/lib/cn";

export function BottomNav({ atletaId }: { atletaId: string }) {
  const pathname = usePathname();
  const base = `/atleta/${atletaId}`;
  const tabs = [
    { href: base, label: "Início", icon: Home },
    { href: `${base}/plano`, label: "Plano", icon: ClipboardList },
    { href: `${base}/agua`, label: "Água", icon: Droplets },
    { href: `${base}/game-day`, label: "Game", icon: CalendarDays },
    { href: `${base}/fotos`, label: "Fotos", icon: Camera },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-around border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 px-2 py-2 backdrop-blur">
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 rounded-[10px] py-1 text-[10px] font-medium transition-colors",
              active ? "text-[var(--color-brand-purple)]" : "text-[var(--color-muted)]",
            )}
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
