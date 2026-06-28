"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CalendarDays, MapPin, Clock } from "lucide-react";
import type { GameDay, GameDayItem } from "@/types";
import { gameDayService } from "@/services/gameday";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton, EmptyState } from "@/components/ui/States";
import { Badge } from "@/components/ui/Badge";
import { fmtData } from "@/utils/format";

const tipoTone = (t: string) =>
  t === "Hidratação" ? "info" : t === "Recovery" ? "success" : t === "Suplemento" ? "warning" : "brand";

export default function AtletaGameDay() {
  useParams<{ id: string }>();
  const [evento, setEvento] = useState<GameDay | null>(null);
  const [itens, setItens] = useState<GameDayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const jogos = await gameDayService.listar(getClubeAtivo());
        const hoje = new Date().toISOString().slice(0, 10);
        const prox = jogos
          .filter((j) => j.data_evento >= hoje)
          .sort((a, b) => a.data_evento.localeCompare(b.data_evento))[0];
        if (prox) {
          const det = await gameDayService.getComItens(prox.id);
          if (det) {
            setEvento(det.evento);
            setItens(det.itens);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="flex-1 px-5 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <CalendarDays className="h-5 w-5 text-[var(--color-brand-blue)]" /> Game Day
      </h1>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : !evento ? (
        <EmptyState title="Nenhum jogo agendado" description="Quando houver um próximo jogo, o cronograma aparece aqui." />
      ) : (
        <>
          <div className="card mb-4 p-5">
            <div className="font-semibold">{evento.titulo}</div>
            <div className="mt-1 text-sm text-[var(--color-muted)]">
              {fmtData(evento.data_evento)}
              {evento.horario_evento ? ` · ${evento.horario_evento.slice(0, 5)}` : ""}
            </div>
            {evento.local_evento && (
              <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <MapPin className="h-3 w-3" /> {evento.local_evento}
              </div>
            )}
          </div>

          {itens.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">Sem cronograma.</p>
          ) : (
            <div className="space-y-3">
              {itens.map((it) => (
                <div key={it.id} className="flex items-start gap-3">
                  <div className="flex w-12 shrink-0 justify-end pt-0.5 text-sm font-semibold tabular-nums">
                    {it.horario ? it.horario.slice(0, 5) : <Clock className="h-4 w-4 text-[var(--color-muted)]" />}
                  </div>
                  <div className="flex-1 border-l border-[var(--color-border)] pb-2 pl-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{it.titulo}</span>
                      <Badge tone={tipoTone(it.tipo)}>{it.tipo}</Badge>
                    </div>
                    {(it.refeicao?.nome || it.descricao) && (
                      <p className="text-xs text-[var(--color-muted)]">
                        {[it.refeicao?.nome, it.descricao].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
