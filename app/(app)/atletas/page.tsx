"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Search, ChevronRight, RefreshCcw, Sparkles, Shield } from "lucide-react";
import toast from "react-hot-toast";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { idade } from "@/utils/format";
import { listTeams, DEFAULT_TEAM_ID } from "@/lib/teams";

interface AtletaWolves {
  wolves_id: string;
  nome: string;
  posicao: string | null;
  categoria: string | null;
  status: string;
  foto_url: string | null;
  data_nascimento: string | null;
  nutri_id: string | null;
}

const TIMES = listTeams();
const LS_KEY = "nutryplayer:team";

export default function AtletasPage() {
  const router = useRouter();
  const [teamId, setTeamId] = useState<string>(DEFAULT_TEAM_ID);
  const [atletas, setAtletas] = useState<AtletaWolves[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [ativando, setAtivando] = useState<string | null>(null);

  // Recupera o time escolhido anteriormente
  useEffect(() => {
    const salvo = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (salvo && TIMES.some((t) => t.id === salvo)) setTeamId(salvo);
  }, []);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/wolves/atletas?team=${encodeURIComponent(teamId)}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Falha ao carregar");
      setAtletas(json.atletas);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar atletas");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function trocarTime(id: string) {
    setTeamId(id);
    setBusca("");
    if (typeof window !== "undefined") localStorage.setItem(LS_KEY, id);
  }

  async function abrir(a: AtletaWolves) {
    if (a.nutri_id) {
      router.push(`/atletas/${a.nutri_id}`);
      return;
    }
    setAtivando(a.wolves_id);
    try {
      const res = await fetch("/api/wolves/ativar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wolves_id: a.wolves_id, team_id: teamId }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Falha ao ativar");
      router.push(`/atletas/${json.nutri_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ativar atleta");
      setAtivando(null);
    }
  }

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    if (!t) return atletas;
    return atletas.filter(
      (a) =>
        a.nome.toLowerCase().includes(t) ||
        (a.posicao ?? "").toLowerCase().includes(t) ||
        (a.categoria ?? "").toLowerCase().includes(t),
    );
  }, [atletas, busca]);

  const novos = filtrados.filter((a) => !a.nutri_id);
  const acompanhados = filtrados.filter((a) => a.nutri_id);
  const timeAtual = TIMES.find((t) => t.id === teamId);

  function Card({ a }: { a: AtletaWolves }) {
    const anos = idade(a.data_nascimento);
    const carregandoEste = ativando === a.wolves_id;
    return (
      <button
        onClick={() => abrir(a)}
        disabled={carregandoEste}
        className="card group flex w-full items-center gap-3 p-3 text-left transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:p-4"
      >
        {a.foto_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={a.foto_url} alt={a.nome} className="h-11 w-11 shrink-0 rounded-full object-cover" />
        ) : (
          <div className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-semibold text-white">
            {a.nome.slice(0, 2).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{a.nome}</div>
          <div className="truncate text-xs text-[var(--color-muted)]">
            {[a.posicao, a.categoria, anos ? `${anos} anos` : null].filter(Boolean).join(" · ") || "—"}
          </div>
        </div>
        {carregandoEste ? (
          <span className="text-xs text-[var(--color-muted)]">Ativando...</span>
        ) : (
          <ChevronRight className="h-4 w-4 text-[var(--color-muted)]" />
        )}
      </button>
    );
  }

  return (
    <>
      <PageHeader
        title="Atletas"
        subtitle="Selecione o time para puxar os atletas. Sincronizados automaticamente."
        icon={<Users className="h-6 w-6" />}
        actions={
          <Button variant="secondary" onClick={carregar} disabled={loading}>
            <RefreshCcw className="h-4 w-4" /> Atualizar
          </Button>
        }
      />

      {/* Seletor de time (multi-clube) */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted)]">
          <Shield className="h-4 w-4 text-[var(--color-accent)]" /> Time:
        </span>
        {TIMES.map((t) => {
          const ativo = t.id === teamId;
          return (
            <button
              key={t.id}
              onClick={() => trocarTime(t.id)}
              className={
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-all " +
                (ativo
                  ? "accent-gradient text-white shadow-[0_6px_16px_rgba(255,138,30,0.35)]"
                  : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]")
              }
            >
              {t.nome}
            </button>
          );
        })}
      </div>

      {!loading && !error && atletas.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, posição ou categoria..."
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : atletas.length === 0 ? (
        <EmptyState
          title={`Nenhum atleta em ${timeAtual?.nome ?? "no time"}`}
          description="Cadastre atletas no sistema do time — eles aparecem aqui automaticamente."
          icon={<Users className="h-7 w-7" />}
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--color-accent)]" />
              <h2 className="text-sm font-semibold">Novos · sem acompanhamento</h2>
              <Badge tone="warning">{novos.length}</Badge>
            </div>
            {novos.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">Nenhum atleta novo no momento.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {novos.map((a) => (
                  <Card key={a.wolves_id} a={a} />
                ))}
              </div>
            )}
          </section>

          <section className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-[var(--color-brand-green)]" />
              <h2 className="text-sm font-semibold">Acompanhados</h2>
              <Badge tone="success">{acompanhados.length}</Badge>
            </div>
            {acompanhados.length === 0 ? (
              <p className="text-sm text-[var(--color-muted)]">
                Nenhum atleta com acompanhamento ainda. Clique num atleta novo para começar.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {acompanhados.map((a) => (
                  <Card key={a.wolves_id} a={a} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
