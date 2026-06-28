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
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md border-t border-[var(--color-border)] bg-white/95 backdrop-blur"
      style={{ boxShadow: "0 -4px 20px rgba(30,58,95,0.08)" }}>
      <div className="flex justify-around px-2 py-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 rounded-[12px] py-1.5 transition-colors"
            >
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-all",
                active
                  ? "text-white shadow-[0_4px_12px_rgba(255,107,0,0.35)]"
                  : "text-[var(--color-muted)]"
              )}
                style={active ? { background: "linear-gradient(135deg,#FF9A30,#FF6B00)" } : {}}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-[10px] font-semibold transition-colors",
                active ? "text-[#FF6B00]" : "text-[var(--color-muted)]"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
