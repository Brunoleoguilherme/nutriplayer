"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Droplets, ClipboardList, CalendarDays, ChevronRight } from "lucide-react";
import type { Atleta, GameDay } from "@/types";
import { atletasService } from "@/services/atletas";
import { planosService } from "@/services/planos";
import { gameDayService } from "@/services/gameday";
import { hidratacaoService } from "@/services/hidratacao";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton } from "@/components/ui/States";
import { PushOptIn } from "@/components/atleta/PushOptIn";
import { fmtData } from "@/utils/format";

const META_AGUA_ML = 3000;

export default function AtletaHome() {
  const { id } = useParams<{ id: string }>();
  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [agua, setAgua] = useState(0);
  const [planosAtivos, setPlanosAtivos] = useState(0);
  const [proximoJogo, setProximoJogo] = useState<GameDay | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, total, planos, jogos] = await Promise.all([
          atletasService.getById(id),
          hidratacaoService.totalDoDia(id),
          planosService.list({ clubeId: getClubeAtivo() }),
          gameDayService.listar(getClubeAtivo()),
        ]);
        setAtleta(a);
        setAgua(total);
        setPlanosAtivos(planos.filter((p) => p.atleta_id === id && p.status === "Ativo").length);
        const hoje = new Date().toISOString().slice(0, 10);
        const futuros = jogos
          .filter((j) => j.data_evento >= hoje)
          .sort((x, y) => x.data_evento.localeCompare(y.data_evento));
        setProximoJogo(futuros[0] ?? null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const pct = Math.min(100, Math.round((agua / META_AGUA_ML) * 100));

  if (loading) {
    return (
      <div className="space-y-3 px-5 py-8">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="flex-1 px-5 py-8">
      <div className="mb-6">
        <p className="text-sm text-[var(--color-muted)]">Olá,</p>
        <h1 className="text-2xl font-bold">{atleta?.nome ?? "Atleta"}</h1>
      </div>

      {/* Hidratação do dia */}
      <Link href={`/atleta/${id}/agua`} className="card mb-4 block p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-medium">
            <Droplets className="h-4 w-4 text-[var(--color-info)]" /> Hidratação de hoje
          </span>
          <span className="text-sm text-[var(--color-muted)]">
            {agua} / {META_AGUA_ML} ml
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div className="h-full bg-[var(--color-info)] transition-all" style={{ width: `${pct}%` }} />
        </div>
      </Link>

      {/* Atalhos */}
      <Link href={`/atleta/${id}/plano`} className="card mb-3 flex items-center gap-3 p-4">
        <ClipboardList className="h-5 w-5 text-[var(--color-brand-green)]" />
        <div className="flex-1">
          <div className="text-sm font-medium">Meu plano alimentar</div>
          <div className="text-xs text-[var(--color-muted)]">
            {planosAtivos > 0 ? `${planosAtivos} plano(s) ativo(s)` : "Nenhum plano ativo"}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--color-muted)]" />
      </Link>

      <Link href={`/atleta/${id}/game-day`} className="card flex items-center gap-3 p-4">
        <CalendarDays className="h-5 w-5 text-[var(--color-brand-blue)]" />
        <div className="flex-1">
          <div className="text-sm font-medium">Próximo Game Day</div>
          <div className="text-xs text-[var(--color-muted)]">
            {proximoJogo
              ? `${proximoJogo.titulo} · ${fmtData(proximoJogo.data_evento)}`
              : "Nenhum evento agendado"}
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--color-muted)]" />
      </Link>

      <div className="mt-3">
        <PushOptIn atletaId={id} />
      </div>
    </div>
  );
}
