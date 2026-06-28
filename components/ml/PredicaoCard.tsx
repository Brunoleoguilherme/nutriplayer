"use client";

import { TrendingUp, ArrowDown, Minus } from "lucide-react";
import type { Predicao } from "@/utils/ml";

const corNivel = (nivel: string, invertido: boolean) => {
  // invertido (risco): alto = vermelho. normal: alto = verde
  if (nivel === "moderado") return "var(--color-warning)";
  if (invertido) return nivel === "alto" ? "var(--color-danger)" : "var(--color-success)";
  return nivel === "alto" ? "var(--color-success)" : "var(--color-danger)";
};

const impactoCor = (i: string) =>
  i === "positivo" ? "var(--color-success)" : i === "negativo" ? "var(--color-danger)" : "var(--color-muted)";

const impactoIcon = (i: string) =>
  i === "positivo" ? TrendingUp : i === "negativo" ? ArrowDown : Minus;

export function PredicaoCard({
  titulo,
  predicao,
  invertido = false,
}: {
  titulo: string;
  predicao: Predicao;
  invertido?: boolean;
}) {
  const cor = corNivel(predicao.nivel, invertido);
  const r = 46;
  const circ = 2 * Math.PI * r;

  return (
    <div className="card flex flex-col p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">{titulo}</h3>

      <div className="mb-4 flex items-center gap-4">
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 110 110">
            <circle cx="55" cy="55" r={r} fill="none" stroke="var(--color-surface-2)" strokeWidth="10" />
            <circle
              cx="55"
              cy="55"
              r={r}
              fill="none"
              stroke={cor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circ}
              strokeDashoffset={circ * (1 - predicao.score / 100)}
              style={{ transition: "stroke-dashoffset .5s" }}
            />
          </svg>
          <div className="absolute text-center">
            <div className="text-2xl font-bold">{predicao.score}</div>
            <div className="text-[10px] uppercase tracking-wide" style={{ color: cor }}>
              {predicao.nivel}
            </div>
          </div>
        </div>
        <p className="text-sm text-[var(--color-muted)]">{predicao.resumo}</p>
      </div>

      <div className="mt-auto space-y-2 border-t border-[var(--color-border)] pt-3">
        {predicao.fatores.map((f, i) => {
          const Icone = impactoIcon(f.impacto);
          return (
            <div key={i} className="flex items-start gap-2 text-xs">
              <Icone className="mt-0.5 h-3.5 w-3.5 shrink-0" style={{ color: impactoCor(f.impacto) }} />
              <div>
                <span className="font-medium">{f.label}: </span>
                <span className="text-[var(--color-muted)]">{f.detalhe}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
