"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, LogOut, Search } from "lucide-react";
import { MobileNav } from "./MobileNav";
import { createClient } from "@/lib/supabase/client";

export function Topbar() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [nome, setNome] = useState<string | null>(null);
  const [aberto, setAberto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        const user = data.user;
        setEmail(user?.email ?? null);
        setNome(user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? null);
      })
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

  const iniciais = email ? email.slice(0, 2).toUpperCase() : "BR";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 px-4 backdrop-blur sm:px-6">
      {/* Mobile: hambúrguer */}
      <div className="flex items-center gap-2 md:hidden">
        <MobileNav />
      </div>

      {/* Search bar — cresce no centro */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
        <input
          type="text"
          placeholder="Buscar atleta, refeição, alimento..."
          className="w-full rounded-[20px] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-disabled)] outline-none transition-all focus:border-[var(--color-accent)]/60 focus:ring-2 focus:ring-[var(--color-accent)]/10"
        />
      </div>

      {/* Ações direita */}
      <div className="ml-auto flex items-center gap-3">
        {/* Notificações */}
        <button className="relative rounded-full p-2 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--color-accent)]" />
        </button>

        {/* Avatar + dropdown */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setAberto((v) => !v)}
            className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 transition-colors hover:bg-[var(--color-surface-2)]"
            aria-label="Conta"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)" }}
            >
              {iniciais}
            </div>
            {nome && (
              <span className="hidden text-sm font-medium sm:block">{nome}</span>
            )}
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
