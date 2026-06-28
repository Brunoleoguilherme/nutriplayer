"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Utensils, Plus, Search, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Refeicao } from "@/types";
import { refeicoesService } from "@/services/refeicoes";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";

export default function RefeicoesPage() {
  const clubeId = getClubeAtivo();
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRefeicoes(
        await refeicoesService.list({ clubeId, orderBy: "nome", ascending: true }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtradas = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return refeicoes.filter((r) => !t || r.nome.toLowerCase().includes(t));
  }, [refeicoes, busca]);

  async function excluir(r: Refeicao) {
    if (!confirm(`Excluir a refeição "${r.nome}"?`)) return;
    try {
      await refeicoesService.softDelete(r.id);
      toast.success("Refeição removida");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <>
      <PageHeader
        title="Refeições"
        subtitle="Objetos reutilizáveis. Crie uma vez, use em muitos planos."
        icon={<Utensils className="h-6 w-6" />}
        actions={
          <Link href="/refeicoes/nova">
            <Button>
              <Plus className="h-4 w-4" /> Nova refeição
            </Button>
          </Link>
        }
      />

      {!loading && !error && refeicoes.length > 0 && (
        <div className="relative mb-6 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar refeição..."
            className="pl-9"
          />
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : refeicoes.length === 0 ? (
        <EmptyState
          title="Nenhuma refeição criada"
          description="Use o Meal Builder para montar sua primeira refeição reutilizável."
          icon={<Utensils className="h-7 w-7" />}
          action={
            <Link href="/refeicoes/nova">
              <Button>
                <Plus className="h-4 w-4" /> Criar refeição
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtradas.map((r) => (
            <div key={r.id} className="card group p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{r.nome}</div>
                  {r.objetivo && (
                    <div className="text-xs text-[var(--color-muted)]">{r.objetivo}</div>
                  )}
                </div>
                {r.categoria && <Badge tone="brand">{r.categoria}</Badge>}
              </div>
              <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => excluir(r)}
                  className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
