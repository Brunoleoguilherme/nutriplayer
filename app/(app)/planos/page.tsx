"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Plus, Trash2, User, Printer } from "lucide-react";
import toast from "react-hot-toast";
import type { PlanoAlimentar } from "@/types";
import { planosService } from "@/services/planos";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { fmtData } from "@/utils/format";

type PlanoComAtleta = PlanoAlimentar & {
  atleta?: { id: string; nome: string } | null;
};

const statusTone = (s: string) =>
  s === "Ativo" ? "success" : s === "Encerrado" ? "neutral" : "warning";

export default function PlanosPage() {
  const clubeId = getClubeAtivo();
  const [planos, setPlanos] = useState<PlanoComAtleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPlanos(await planosService.listarComAtleta(clubeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function excluir(p: PlanoComAtleta) {
    if (!confirm(`Excluir o plano "${p.nome}"?`)) return;
    try {
      await planosService.softDelete(p.id);
      toast.success("Plano removido");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <>
      <PageHeader
        title="Planos Alimentares"
        subtitle="Planos por atleta compostos de refeições reutilizáveis."
        icon={<ClipboardList className="h-6 w-6" />}
        actions={
          <Link href="/planos/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo plano
            </Button>
          </Link>
        }
      />

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : planos.length === 0 ? (
        <EmptyState
          title="Nenhum plano criado"
          description="Crie o primeiro plano alimentar combinando refeições já cadastradas."
          icon={<ClipboardList className="h-7 w-7" />}
          action={
            <Link href="/planos/novo">
              <Button>
                <Plus className="h-4 w-4" /> Criar plano
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {planos.map((p) => (
            <div key={p.id} className="card group p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-semibold">{p.nome}</div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <User className="h-3 w-3" />
                    {p.atleta?.nome ?? "Modelo (sem atleta)"}
                  </div>
                </div>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-[var(--color-muted)]">
                  {p.objetivo || fmtData(p.created_at)}
                </span>
                <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Link
                    href={`/imprimir/plano/${p.id}`}
                    target="_blank"
                    className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                    aria-label="Imprimir / PDF"
                  >
                    <Printer className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => excluir(p)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                    aria-label="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
