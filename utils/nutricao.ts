import type { Alimento, ResumoMacros } from "@/types";

/**
 * Motor nutricional determinístico do NutriPlay (sem dependência de IA externa).
 * Base científica: Mifflin-St Jeor (TMB) + fatores de atividade + objetivo.
 */

export type FatorAtividade =
  | "sedentario"
  | "leve"
  | "moderado"
  | "intenso"
  | "atleta";

export const FATORES: Record<FatorAtividade, { label: string; valor: number }> = {
  sedentario: { label: "Sedentário", valor: 1.2 },
  leve: { label: "Leve (1-3x/sem)", valor: 1.375 },
  moderado: { label: "Moderado (3-5x/sem)", valor: 1.55 },
  intenso: { label: "Intenso (6-7x/sem)", valor: 1.725 },
  atleta: { label: "Atleta (2x/dia)", valor: 1.9 },
};

export type Objetivo = "perder" | "manter" | "ganhar";

export const OBJETIVOS: Record<Objetivo, { label: string; ajuste: number; proteinaGkg: number }> = {
  perder: { label: "Perda de gordura", ajuste: -0.2, proteinaGkg: 2.2 },
  manter: { label: "Manutenção", ajuste: 0, proteinaGkg: 1.8 },
  ganhar: { label: "Ganho de massa", ajuste: 0.12, proteinaGkg: 2.0 },
};

export interface Necessidades {
  tmb: number;
  get: number;
  meta: number;
  proteinas_g: number;
  gorduras_g: number;
  carboidratos_g: number;
}

/** TMB pela equação de Mifflin-St Jeor. */
export function calcularTMB(
  pesoKg: number,
  alturaCm: number,
  idadeAnos: number,
  sexo: string | null,
): number {
  const base = 10 * pesoKg + 6.25 * alturaCm - 5 * idadeAnos;
  const isFem = (sexo ?? "").toLowerCase().startsWith("f");
  return Math.round(base + (isFem ? -161 : 5));
}

/** Calcula necessidade calórica e distribuição de macros. */
export function calcularNecessidades(params: {
  pesoKg: number;
  alturaCm: number;
  idadeAnos: number;
  sexo: string | null;
  fator: FatorAtividade;
  objetivo: Objetivo;
}): Necessidades {
  const { pesoKg, alturaCm, idadeAnos, sexo, fator, objetivo } = params;
  const tmb = calcularTMB(pesoKg, alturaCm, idadeAnos, sexo);
  const get = Math.round(tmb * FATORES[fator].valor);
  const obj = OBJETIVOS[objetivo];
  const meta = Math.round(get * (1 + obj.ajuste));

  const proteinas_g = Math.round(pesoKg * obj.proteinaGkg);
  const gorduras_g = Math.round((meta * 0.25) / 9); // 25% das kcal
  const kcalRestante = meta - (proteinas_g * 4 + gorduras_g * 9);
  const carboidratos_g = Math.max(0, Math.round(kcalRestante / 4));

  return { tmb, get, meta, proteinas_g, gorduras_g, carboidratos_g };
}

// ---------------------------------------------------------------------
// Substituições inteligentes (equivalência de alimentos)
// ---------------------------------------------------------------------
export interface Substituicao {
  alimento: Alimento;
  similaridade: number; // 0-100
}

function porCem(a: Alimento) {
  const base = a.porcao_padrao_g || 100;
  const f = 100 / base;
  return {
    cal: a.calorias * f,
    prot: a.proteinas * f,
    carb: a.carboidratos * f,
    gord: a.gorduras * f,
  };
}

/**
 * Encontra equivalentes a um alimento, priorizando mesma categoria e
 * proximidade de macros (por 100 g). Retorna ranqueado por similaridade.
 */
export function sugerirSubstituicoes(
  alvo: Alimento,
  candidatos: Alimento[],
  limite = 5,
): Substituicao[] {
  const a = porCem(alvo);
  const ref = Math.max(a.cal, 1);

  return candidatos
    .filter((c) => c.id !== alvo.id)
    .map((c) => {
      const b = porCem(c);
      // distância euclidiana normalizada (cal pesa menos que macros)
      const d = Math.sqrt(
        Math.pow((a.cal - b.cal) / ref, 2) * 0.5 +
          Math.pow((a.prot - b.prot) / 30, 2) +
          Math.pow((a.carb - b.carb) / 50, 2) +
          Math.pow((a.gord - b.gord) / 30, 2),
      );
      let similaridade = Math.max(0, Math.round((1 - d) * 100));
      // bônus de categoria igual
      if (alvo.categoria && c.categoria === alvo.categoria)
        similaridade = Math.min(100, similaridade + 10);
      return { alimento: c, similaridade };
    })
    .sort((x, y) => y.similaridade - x.similaridade)
    .slice(0, limite);
}

// ---------------------------------------------------------------------
// Alertas nutricionais
// ---------------------------------------------------------------------
export type NivelAlerta = "info" | "warning" | "danger";

export interface Alerta {
  nivel: NivelAlerta;
  titulo: string;
  detalhe: string;
}

/**
 * Analisa um resumo de macros (diário) e gera alertas.
 * `pesoKg` opcional refina a checagem de proteína (g/kg).
 * `sodioMg` opcional para excesso de sódio.
 */
export function analisarAlertas(
  macros: ResumoMacros,
  opts: { pesoKg?: number | null; sodioMg?: number | null; metaKcal?: number | null } = {},
): Alerta[] {
  const alertas: Alerta[] = [];
  const kcal = macros.calorias || 0;

  // Proteína
  if (opts.pesoKg && opts.pesoKg > 0) {
    const gkg = macros.proteinas / opts.pesoKg;
    if (gkg < 1.4)
      alertas.push({
        nivel: "warning",
        titulo: "Baixa ingestão proteica",
        detalhe: `${gkg.toFixed(1)} g/kg — abaixo do recomendado para atletas (≥ 1,6 g/kg).`,
      });
  } else if (kcal > 0) {
    const pctP = (macros.proteinas * 4) / kcal;
    if (pctP < 0.15)
      alertas.push({
        nivel: "warning",
        titulo: "Baixa proteína",
        detalhe: `Proteína representa ${Math.round(pctP * 100)}% das calorias (ideal ≥ 15%).`,
      });
  }

  // Sódio
  if (opts.sodioMg != null && opts.sodioMg > 2300)
    alertas.push({
      nivel: "danger",
      titulo: "Excesso de sódio",
      detalhe: `${Math.round(opts.sodioMg)} mg — acima do limite diário (2.300 mg).`,
    });

  // Fibra
  if (macros.fibras < 25 && kcal > 1200)
    alertas.push({
      nivel: "info",
      titulo: "Baixa fibra",
      detalhe: `${macros.fibras.toFixed(0)} g — busque ≥ 25 g/dia (frutas, legumes, integrais).`,
    });

  // Meta calórica
  if (opts.metaKcal && opts.metaKcal > 0 && kcal > 0) {
    const dif = (kcal - opts.metaKcal) / opts.metaKcal;
    if (Math.abs(dif) > 0.15)
      alertas.push({
        nivel: dif > 0 ? "warning" : "info",
        titulo: dif > 0 ? "Acima da meta calórica" : "Abaixo da meta calórica",
        detalhe: `${Math.round(kcal)} kcal vs meta de ${Math.round(opts.metaKcal)} kcal (${dif > 0 ? "+" : ""}${Math.round(dif * 100)}%).`,
      });
  }

  if (alertas.length === 0)
    alertas.push({
      nivel: "info",
      titulo: "Sem alertas",
      detalhe: "O plano está dentro dos parâmetros analisados.",
    });

  return alertas;
}
