"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { Logo } from "@/components/ui/Logo";
import { createClient } from "@/lib/supabase/client";

export function Topbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setEmail(data.user?.email ?? null))
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setAberto(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function sair() {
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const iniciais = email ? email.slice(0, 2).toUpperCase() : "··";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <span className="md:hidden">
          <Logo size="sm" showBadge={false} />
        </span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]">
          <Bell className="h-5 w-5" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setAberto((v) => !v)}
            className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
            aria-label="Conta"
          >
            {iniciais}
          </button>

          {aberto && (
            <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-hover)]">
              <div className="border-b border-[var(--color-border)] px-4 py-3">
                <div className="text-xs text-[var(--color-muted)]">Conectado como</div>
                <div className="truncate text-sm font-medium">{email ?? "—"}</div>
              </div>
              <button
                onClick={sair}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-[var(--color-danger)] hover:bg-[var(--color-surface-2)]"
              >
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
