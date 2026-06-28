"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Users, Database, ArrowRight, Plus, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { TEAMS } from "@/lib/teams";

const LS_KEY = "nutryplayer:team";

export default function TimesPage() {
  const router = useRouter();
  const [ativo, setAtivo] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number | null>>({});

  useEffect(() => {
    setAtivo(localStorage.getItem(LS_KEY) ?? TEAMS[0]?.id ?? null);
    // Conta atletas (com presença) por time
    TEAMS.forEach((t) => {
      fetch(`/api/wolves/atletas?team=${encodeURIComponent(t.id)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => setCounts((c) => ({ ...c, [t.id]: j.ok ? j.total : null })))
        .catch(() => setCounts((c) => ({ ...c, [t.id]: null })));
    });
  }, []);

  function selecionar(id: string) {
    localStorage.setItem(LS_KEY, id);
    setAtivo(id);
    router.push("/atletas");
  }

  return (
    <>
      <PageHeader
        title="Times / Projetos"
        subtitle="Cada time é uma fonte de dados própria. Escolha de qual time puxar os atletas."
        icon={<Shield className="h-6 w-6" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TEAMS.map((t) => {
          const proprio = Boolean(t.source.urlEnv);
          const selecionado = ativo === t.id;
          const n = counts[t.id];
          return (
            <button
              key={t.id}
              onClick={() => selecionar(t.id)}
              className="card card-hover group flex flex-col p-5 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="accent-gradient flex h-12 w-12 items-center justify-center rounded-[14px] text-sm font-bold text-white">
                  {t.sigla ?? t.nome.slice(0, 3).toUpperCase()}
                </div>
                {selecionado ? (
                  <Badge tone="success">
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> Ativo
                  </Badge>
                ) : (
                  <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
                )}
              </div>

              <div className="mt-4 text-lg font-bold">{t.nome}</div>

              <div className="mt-1 flex items-center gap-1.5 text-xs text-[var(--color-muted)]">
                <Database className="h-3.5 w-3.5" />
                {proprio ? "Banco próprio" : "Banco compartilhado"} · schema{" "}
                <code className="text-[var(--color-fg)]">{t.source.schema ?? "public"}</code>
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-[var(--color-accent)]" />
                <span className="font-semibold">
                  {n === undefined ? "…" : n === null ? "—" : n}
                </span>
                <span className="text-[var(--color-muted)]">atletas ativos</span>
              </div>
            </button>
          );
        })}

        {/* Card: adicionar time (futuro) */}
        <div className="card flex flex-col items-center justify-center gap-2 border-dashed p-5 text-center text-[var(--color-muted)]">
          <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-[var(--color-surface-2)]">
            <Plus className="h-5 w-5" />
          </div>
          <div className="mt-1 text-sm font-semibold text-[var(--color-fg)]">Adicionar time</div>
          <p className="text-xs">
            Novos times entram no registro <code>lib/teams.ts</code>. Quando o time tiver
            Supabase próprio, basta apontar as credenciais — o resto do app não muda.
          </p>
        </div>
      </div>
    </>
  );
}
