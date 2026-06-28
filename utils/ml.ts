import type { WearableMetrica, AvaliacaoCorporal } from "@/types";

/**
 * Motor preditivo do NutriPlay (modelos heurísticos, explicáveis).
 * NÃO é machine learning treinado — são regras determinísticas sobre os
 * dados de wearables + avaliações, pensadas para serem substituídas por
 * modelos reais quando houver histórico suficiente. Cada predição devolve
 * os fatores que a influenciaram (transparência).
 */

export type Nivel = "baixo" | "moderado" | "alto";
export type Impacto = "positivo" | "negativo" | "neutro";

export interface Fator {
  label: string;
  impacto: Impacto;
  detalhe: string;
}

export interface Predicao {
  tipo: "prontidao" | "risco_lesao" | "performance";
  score: number; // 0-100
  nivel: Nivel;
  resumo: string;
  fatores: Fator[];
}

// ---------- helpers ----------
function media(ns: (number | null | undefined)[]): number | null {
  const v = ns.filter((n): n is number => typeof n === "number" && !Number.isNaN(n));
  if (v.length === 0) return null;
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function clamp(n: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, n));
}

function nivelDe(score: number, invertido = false): Nivel {
  // invertido=true → score alto = risco alto
  const s = invertido ? score : 100 - score;
  if (s >= 66) return "alto";
  if (s >= 33) return "moderado";
  return "baixo";
}

/** Baseline = média dos registros antigos (exceto os 3 mais recentes). */
function baselineRecente<T>(arr: T[], get: (x: T) => number | null | undefined) {
  if (arr.length === 0) return { base: null as number | null, recente: null as number | null };
  const recentes = arr.slice(-3);
  const antigos = arr.slice(0, Math.max(0, arr.length - 3));
  const base = media((antigos.length ? antigos : arr).map(get));
  const recente = media(recentes.map(get));
  return { base, recente };
}

// =====================================================================
// PRONTIDÃO / RECOVERY
// =====================================================================
export function preverProntidao(metricas: WearableMetrica[]): Predicao {
  const fatores: Fator[] = [];
  if (metricas.length === 0) {
    return {
      tipo: "prontidao",
      score: 0,
      nivel: "baixo",
      resumo: "Sem dados de wearables para estimar a prontidão.",
      fatores: [{ label: "Dados insuficientes", impacto: "neutro", detalhe: "Registre métricas de sono/HRV/FC." }],
    };
  }

  const ultima = metricas[metricas.length - 1];
  let score = 60;

  if (ultima.prontidao != null) {
    score = ultima.prontidao;
    fatores.push({ label: "Prontidão do dispositivo", impacto: ultima.prontidao >= 66 ? "positivo" : ultima.prontidao >= 40 ? "neutro" : "negativo", detalhe: `${ultima.prontidao}/100 reportado.` });
  }

  if (ultima.sono_score != null) {
    const ajuste = (ultima.sono_score - 70) * 0.25;
    score += ajuste;
    fatores.push({ label: "Qualidade do sono", impacto: ultima.sono_score >= 75 ? "positivo" : ultima.sono_score >= 55 ? "neutro" : "negativo", detalhe: `Score de sono ${ultima.sono_score}/100.` });
  } else if (ultima.sono_min != null) {
    const h = ultima.sono_min / 60;
    const ajuste = (h - 7) * 5;
    score += ajuste;
    fatores.push({ label: "Duração do sono", impacto: h >= 7 ? "positivo" : "negativo", detalhe: `${h.toFixed(1)} h de sono.` });
  }

  const hrv = baselineRecente(metricas, (m) => m.hrv_ms);
  if (hrv.base && hrv.recente) {
    const delta = (hrv.recente - hrv.base) / hrv.base;
    score += delta * 40;
    fatores.push({ label: "HRV vs baseline", impacto: delta >= 0 ? "positivo" : "negativo", detalhe: `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}% (${Math.round(hrv.recente)} ms).` });
  }

  const fc = baselineRecente(metricas, (m) => m.fc_repouso);
  if (fc.base && fc.recente) {
    const delta = (fc.recente - fc.base) / fc.base;
    score -= delta * 50; // FC repouso subindo = pior
    fatores.push({ label: "FC repouso vs baseline", impacto: delta <= 0 ? "positivo" : "negativo", detalhe: `${delta >= 0 ? "+" : ""}${Math.round(delta * 100)}% (${Math.round(fc.recente)} bpm).` });
  }

  score = clamp(Math.round(score));
  const nivel = nivelDe(score); // score alto = prontidão alta = nível baixo de preocupação
  const resumo =
    score >= 66 ? "Atleta recuperado e pronto para treino intenso."
    : score >= 40 ? "Recuperação parcial — ajustar carga conforme resposta."
    : "Recuperação baixa — priorizar descanso e recovery.";

  return { tipo: "prontidao", score, nivel, resumo, fatores };
}

// =====================================================================
// RISCO DE LESÃO
// =====================================================================
export function preverRiscoLesao(
  metricas: WearableMetrica[],
  avaliacoes: AvaliacaoCorporal[],
): Predicao {
  const fatores: Fator[] = [];
  let risco = 10; // base

  const hrv = baselineRecente(metricas, (m) => m.hrv_ms);
  if (hrv.base && hrv.recente && hrv.recente < hrv.base * 0.85) {
    risco += 25;
    fatores.push({ label: "Queda de HRV", impacto: "negativo", detalhe: `HRV ${Math.round((1 - hrv.recente / hrv.base) * 100)}% abaixo do baseline (estresse fisiológico).` });
  }

  const fc = baselineRecente(metricas, (m) => m.fc_repouso);
  if (fc.base && fc.recente && fc.recente > fc.base * 1.08) {
    risco += 20;
    fatores.push({ label: "FC de repouso elevada", impacto: "negativo", detalhe: `+${Math.round((fc.recente / fc.base - 1) * 100)}% vs baseline (fadiga/estresse).` });
  }

  const sono = media(metricas.slice(-3).map((m) => m.sono_min));
  if (sono != null && sono < 360) {
    risco += 20;
    fatores.push({ label: "Sono insuficiente", impacto: "negativo", detalhe: `Média de ${(sono / 60).toFixed(1)} h nos últimos dias (< 6 h).` });
  }

  const carga = baselineRecente(metricas, (m) => m.calorias ?? m.passos);
  if (carga.base && carga.recente && carga.recente > carga.base * 1.4) {
    risco += 20;
    fatores.push({ label: "Pico de carga", impacto: "negativo", detalhe: `Aumento abrupto de carga (+${Math.round((carga.recente / carga.base - 1) * 100)}%).` });
  }

  if (avaliacoes.length >= 2) {
    const g0 = avaliacoes[0].percentual_gordura;
    const g1 = avaliacoes[avaliacoes.length - 1].percentual_gordura;
    if (g0 != null && g1 != null && g1 - g0 > 2) {
      risco += 10;
      fatores.push({ label: "Aumento de % gordura", impacto: "negativo", detalhe: `+${(g1 - g0).toFixed(1)} p.p. desde a 1ª avaliação.` });
    }
  }

  if (fatores.length === 0)
    fatores.push({ label: "Indicadores estáveis", impacto: "positivo", detalhe: "Sem sinais de sobrecarga nos dados disponíveis." });

  const score = clamp(Math.round(risco));
  const nivel = nivelDe(score, true); // score alto = risco alto
  const resumo =
    nivel === "alto" ? "Risco elevado — recomenda-se reduzir carga e avaliar com a comissão técnica."
    : nivel === "moderado" ? "Risco moderado — monitorar de perto nos próximos dias."
    : "Risco baixo — seguir planejamento normal.";

  return { tipo: "risco_lesao", score, nivel, resumo, fatores };
}

// =====================================================================
// TENDÊNCIA DE PERFORMANCE
// =====================================================================
export function preverPerformance(
  avaliacoes: AvaliacaoCorporal[],
  prontidaoScore: number | null,
): Predicao {
  const fatores: Fator[] = [];
  let score = 50;

  if (avaliacoes.length >= 2) {
    const p = avaliacoes[0];
    const u = avaliacoes[avaliacoes.length - 1];
    if (p.massa_magra != null && u.massa_magra != null) {
      const d = u.massa_magra - p.massa_magra;
      score += d * 6;
      fatores.push({ label: "Massa magra", impacto: d >= 0 ? "positivo" : "negativo", detalhe: `${d >= 0 ? "+" : ""}${d.toFixed(1)} kg ao longo das avaliações.` });
    }
    if (p.percentual_gordura != null && u.percentual_gordura != null) {
      const d = u.percentual_gordura - p.percentual_gordura;
      score -= d * 4;
      fatores.push({ label: "% de gordura", impacto: d <= 0 ? "positivo" : "negativo", detalhe: `${d >= 0 ? "+" : ""}${d.toFixed(1)} p.p.` });
    }
  } else {
    fatores.push({ label: "Histórico curto", impacto: "neutro", detalhe: "Poucas avaliações para uma tendência confiável." });
  }

  if (prontidaoScore != null) {
    score += (prontidaoScore - 60) * 0.2;
    fatores.push({ label: "Recuperação recente", impacto: prontidaoScore >= 60 ? "positivo" : "negativo", detalhe: `Prontidão média ${prontidaoScore}/100.` });
  }

  score = clamp(Math.round(score));
  const nivel = nivelDe(score);
  const resumo =
    score >= 66 ? "Tendência de evolução positiva."
    : score >= 40 ? "Desempenho estável."
    : "Sinais de queda — revisar plano nutricional e carga.";

  return { tipo: "performance", score, nivel, resumo, fatores };
}
