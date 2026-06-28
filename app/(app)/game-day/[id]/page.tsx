"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin, Printer, Clock } from "lucide-react";
import type { GameDay, GameDayItem } from "@/types";
import { gameDayService } from "@/services/gameday";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton, ErrorState } from "@/components/ui/States";
import { fmtData } from "@/utils/format";

const tipoTone = (t: string) =>
  t === "Hidratação" ? "info" : t === "Recovery" ? "success" : t === "Suplemento" ? "warning" : "brand";

export default function GameDayDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<GameDay | null>(null);
  const [itens, setItens] = useState<GameDayItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    gameDayService
      .getComItens(id)
      .then((res) => {
        if (!res) {
          setError("Evento não encontrado");
          return;
        }
        setEvento(res.evento);
        setItens(res.itens);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error || !evento) return <ErrorState message={error ?? "Não encontrado"} />;

  return (
    <div>
      <Link href="/game-day" className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="h-4 w-4" /> Game Day
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{evento.titulo}</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            {fmtData(evento.data_evento)}
            {evento.horario_evento ? ` · ${evento.horario_evento.slice(0, 5)}` : ""}
            {evento.adversario ? ` · vs ${evento.adversario}` : ""}
          </p>
          {evento.local_evento && (
            <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <MapPin className="h-3 w-3" /> {evento.local_evento}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={evento.status === "Concluído" ? "neutral" : "info"}>{evento.status}</Badge>
          <Link href={`/imprimir/game-day/${evento.id}`} target="_blank">
            <Button variant="ghost">
              <Printer className="h-4 w-4" /> Imprimir / PDF
            </Button>
          </Link>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">Cronograma</h3>
        {itens.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--color-muted)]">Sem itens no cronograma.</p>
        ) : (
          <div className="space-y-3">
            {itens.map((it) => (
              <div key={it.id} className="flex gap-4">
                <div className="flex w-16 shrink-0 items-start justify-end pt-0.5 text-sm font-semibold tabular-nums">
                  {it.horario ? (
                    it.horario.slice(0, 5)
                  ) : (
                    <Clock className="h-4 w-4 text-[var(--color-muted)]" />
                  )}
                </div>
                <div className="flex-1 border-l border-[var(--color-border)] pb-3 pl-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{it.titulo}</span>
                    <Badge tone={tipoTone(it.tipo)}>{it.tipo}</Badge>
                  </div>
                  {(it.refeicao?.nome || it.suplemento?.nome || it.descricao) && (
                    <p className="mt-1 text-sm text-[var(--color-muted)]">
                      {[it.refeicao?.nome, it.suplemento?.nome, it.descricao].filter(Boolean).join(" · ")}
                    </p>
                  )}
                  {it.responsavel && (
                    <p className="mt-0.5 text-xs text-[var(--color-muted)]">Responsável: {it.responsavel}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
