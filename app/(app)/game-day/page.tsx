"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Plus, MapPin, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { GameDay } from "@/types";
import { gameDayService } from "@/services/gameday";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { fmtData } from "@/utils/format";

export default function GameDayPage() {
  const clubeId = getClubeAtivo();
  const [eventos, setEventos] = useState<GameDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEventos(await gameDayService.listar(clubeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function excluir(ev: GameDay) {
    if (!confirm(`Excluir "${ev.titulo}"?`)) return;
    try {
      await gameDayService.softDelete(ev.id);
      toast.success("Evento removido");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }

  return (
    <>
      <PageHeader
        title="Game Day"
        subtitle="Cronograma nutricional dos dias de jogo."
        icon={<CalendarDays className="h-6 w-6" />}
        actions={
          <Link href="/game-day/novo">
            <Button>
              <Plus className="h-4 w-4" /> Novo Game Day
            </Button>
          </Link>
        }
      />

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : eventos.length === 0 ? (
        <EmptyState
          title="Nenhum Game Day"
          description="Planeje o cronograma nutricional do próximo jogo."
          icon={<CalendarDays className="h-7 w-7" />}
          action={
            <Link href="/game-day/novo">
              <Button>
                <Plus className="h-4 w-4" /> Criar Game Day
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventos.map((ev) => (
            <div key={ev.id} className="card group p-5">
              <Link href={`/game-day/${ev.id}`} className="block">
                <div className="flex items-start justify-between">
                  <div className="font-semibold hover:underline">{ev.titulo}</div>
                  <Badge tone={ev.status === "Concluído" ? "neutral" : "info"}>
                    {ev.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-[var(--color-muted)]">
                  {fmtData(ev.data_evento)}
                  {ev.horario_evento ? ` · ${ev.horario_evento.slice(0, 5)}` : ""}
                </div>
                {ev.local_evento && (
                  <div className="mt-1 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                    <MapPin className="h-3 w-3" /> {ev.local_evento}
                  </div>
                )}
              </Link>
              <div className="mt-4 flex justify-end opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => excluir(ev)}
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
