"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClipboardList, Clock, Printer } from "lucide-react";
import type { PlanoAlimentar, PlanoRefeicao } from "@/types";
import { planosService } from "@/services/planos";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton, EmptyState } from "@/components/ui/States";

export default function AtletaPlano() {
  const { id } = useParams<{ id: string }>();
  const [plano, setPlano] = useState<PlanoAlimentar | null>(null);
  const [refeicoes, setRefeicoes] = useState<PlanoRefeicao[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const lista = await planosService.list({ clubeId: getClubeAtivo() });
        const ativo = lista.find((p) => p.atleta_id === id && p.status === "Ativo")
          ?? lista.find((p) => p.atleta_id === id);
        if (ativo) {
          const det = await planosService.getComRefeicoes(ativo.id);
          if (det) {
            setPlano(det.plano);
            setRefeicoes(det.refeicoes);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <div className="flex-1 px-5 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <ClipboardList className="h-5 w-5 text-[var(--color-brand-green)]" /> Meu plano
        </h1>
        {plano && (
          <Link href={`/imprimir/plano/${plano.id}`} target="_blank" className="text-[var(--color-muted)]">
            <Printer className="h-5 w-5" />
          </Link>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !plano ? (
        <EmptyState title="Sem plano ativo" description="Seu nutricionista ainda não liberou um plano." />
      ) : (
        <>
          <div className="mb-4">
            <div className="font-semibold">{plano.nome}</div>
            {plano.objetivo && (
              <div className="text-xs text-[var(--color-muted)]">{plano.objetivo}</div>
            )}
          </div>

          {refeicoes.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Plano sem refeições cadastradas.
            </p>
          ) : (
            <div className="space-y-3">
              {refeicoes.map((pr) => (
                <div key={pr.id} className="card flex items-start gap-3 p-4">
                  <div className="flex w-14 shrink-0 items-center gap-1 pt-0.5 text-sm font-semibold tabular-nums">
                    {pr.horario ? pr.horario.slice(0, 5) : <Clock className="h-4 w-4 text-[var(--color-muted)]" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{pr.refeicao?.nome ?? "Refeição"}</div>
                    {pr.periodo && (
                      <div className="text-xs text-[var(--color-muted)]">{pr.periodo}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {plano.observacoes && (
            <div className="card mt-4 p-4 text-sm text-[var(--color-muted)]">
              <span className="font-medium text-[var(--color-fg)]">Orientações: </span>
              {plano.observacoes}
            </div>
          )}
        </>
      )}
    </div>
  );
}
