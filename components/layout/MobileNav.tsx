"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "./navItems";

/** Navegação mobile do painel: botão hambúrguer + drawer deslizante. */
export function MobileNav() {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // Fecha o drawer ao trocar de rota
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  // Trava o scroll do body quando aberto
  useEffect(() => {
    document.body.style.overflow = aberto ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [aberto]);

  return (
    <>
      <button
        onClick={() => setAberto(true)}
        className="text-[var(--color-fg)] md:hidden"
        aria-label="Abrir menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {aberto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setAberto(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85%] flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="mb-6 flex items-center justify-between">
              <Logo />
              <button onClick={() => setAberto(false)} aria-label="Fechar menu" className="text-[var(--color-muted)]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                const active = pathname === href || pathname.startsWith(href + "/");
                return (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--color-surface-2)] text-[var(--color-fg)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]",
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    {label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
