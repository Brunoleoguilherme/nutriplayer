"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ClipboardList, CalendarDays, ChevronRight, Droplets, Bell, Camera } from "lucide-react";
import type { Atleta, GameDay } from "@/types";
import { atletasService } from "@/services/atletas";
import { planosService } from "@/services/planos";
import { gameDayService } from "@/services/gameday";
import { hidratacaoService } from "@/services/hidratacao";
import { getClubeAtivo } from "@/lib/club";
import { PushOptIn } from "@/components/atleta/PushOptIn";
import { fmtData } from "@/utils/format";

const META_AGUA_ML = 3000;

/** Anel de progresso SVG */
function HydrationRing({ pct, agua, meta }: { pct: number; agua: number; meta: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  const cor = pct >= 80 ? "#16E28A" : pct >= 50 ? "#FF8A1E" : "#2563eb";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-90">
        {/* Trilha */}
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="10" />
        {/* Progresso */}
        <circle
          cx="70" cy="70" r={r} fill="none"
          stroke={cor} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.8s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <Droplets className="h-5 w-5 mb-1" style={{ color: cor }} />
        <span className="text-2xl font-black text-white">{(agua / 1000).toFixed(1)}L</span>
        <span className="text-xs text-white/60">de {(meta / 1000).toFixed(1)}L</span>
      </div>
    </div>
  );
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-white/10 ${className ?? ""}`} />;
}

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
  const hora = new Date().getHours();
  const saudacao = hora < 12 ? "Bom dia" : hora < 18 ? "Boa tarde" : "Boa noite";
  const primeiroNome = atleta?.nome?.split(" ")[0] ?? "Atleta";

  return (
    <div className="flex flex-col min-h-[calc(100dvh-64px)]">

      {/* ── Header com gradiente ── */}
      <div
        className="relative overflow-hidden px-5 pt-8 pb-10"
        style={{ background: "linear-gradient(135deg, #0f1f3d 0%, #1a3a5c 50%, #0d2e1a 100%)" }}
      >
        {/* Orbs decorativos */}
        <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, #FF8A1E, transparent 70%)" }} />
        <div className="pointer-events-none absolute -bottom-6 -left-6 h-32 w-32 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #16E28A, transparent 70%)" }} />

        {/* Topo */}
        <div className="relative z-10 flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-white/50 font-medium uppercase tracking-widest">{saudacao}</p>
            {loading
              ? <Skeleton className="mt-1 h-7 w-36" />
              : <h1 className="text-xl font-black text-white">{primeiroNome}</h1>}
          </div>
          {atleta?.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={atleta.foto_url} alt={atleta.nome}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-white/20" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full text-lg font-black text-white ring-2 ring-white/20"
              style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)" }}>
              {primeiroNome.charAt(0)}
            </div>
          )}
        </div>

        {/* Anel de hidratação */}
        <div className="relative z-10 flex flex-col items-center">
          {loading
            ? <Skeleton className="h-[140px] w-[140px] rounded-full" />
            : <HydrationRing pct={pct} agua={agua} meta={META_AGUA_ML} />}
          <p className="mt-2 text-xs text-white/50">Hidratação de hoje</p>
          <Link href={`/atleta/${id}/agua`}
            className="mt-3 rounded-full px-5 py-1.5 text-xs font-bold text-white"
            style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            + Registrar água
          </Link>
        </div>
      </div>

      {/* ── Cards de acesso rápido ── */}
      <div className="flex-1 bg-[var(--color-bg)] px-4 pt-5 pb-4 space-y-3">

        {/* Plano alimentar */}
        <Link href={`/atleta/${id}/plano`}
          className="flex items-center gap-4 rounded-[20px] bg-white p-4"
          style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.08)" }}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "#16E28A1a" }}>
            <ClipboardList className="h-5 w-5" style={{ color: "#0BCF74" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-fg)]">Meu plano alimentar</p>
            <p className="text-xs text-[var(--color-muted)]">
              {loading ? "Carregando…" : planosAtivos > 0 ? `${planosAtivos} plano(s) ativo(s)` : "Nenhum plano ativo"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
        </Link>

        {/* Game Day */}
        <Link href={`/atleta/${id}/game-day`}
          className="flex items-center gap-4 rounded-[20px] bg-white p-4"
          style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.08)" }}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "#FF8A1E1a" }}>
            <CalendarDays className="h-5 w-5" style={{ color: "#FF6B00" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[var(--color-fg)]">Próximo Game Day</p>
            <p className="text-xs text-[var(--color-muted)] truncate">
              {loading ? "Carregando…" : proximoJogo
                ? `${proximoJogo.titulo} · ${fmtData(proximoJogo.data_evento)}`
                : "Nenhum evento agendado"}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
        </Link>

        {/* Fotos */}
        <Link href={`/atleta/${id}/fotos`}
          className="flex items-center gap-4 rounded-[20px] bg-white p-4"
          style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.08)" }}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
            style={{ background: "#7c3aed1a" }}>
            <Camera className="h-5 w-5" style={{ color: "#7c3aed" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--color-fg)]">Fotos de evolução</p>
            <p className="text-xs text-[var(--color-muted)]">Registre seu progresso visual</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--color-muted)]" />
        </Link>

        {/* Notificações */}
        <div className="rounded-[20px] bg-white p-4"
          style={{ boxShadow: "0 4px 16px rgba(30,58,95,0.08)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px]"
              style={{ background: "#2563eb1a" }}>
              <Bell className="h-5 w-5" style={{ color: "#2563eb" }} />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--color-fg)]">Notificações</p>
              <p className="text-xs text-[var(--color-muted)]">Lembretes de hidratação e refeições</p>
            </div>
          </div>
          <PushOptIn atletaId={id} />
        </div>
      </div>
    </div>
  );
}
