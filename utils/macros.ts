import type { Alimento, RefeicaoAlimento, ResumoMacros } from "@/types";

const VAZIO: ResumoMacros = {
  calorias: 0,
  proteinas: 0,
  carboidratos: 0,
  gorduras: 0,
  fibras: 0,
};

/**
 * Calcula os macros de um alimento para uma quantidade em gramas.
 * Os valores do alimento são referenciados a `porcao_padrao_g`.
 */
export function macrosDoItem(
  alimento: Pick<
    Alimento,
    | "porcao_padrao_g"
    | "calorias"
    | "proteinas"
    | "carboidratos"
    | "gorduras"
    | "fibras"
  >,
  quantidadeG: number,
): ResumoMacros {
  const base = alimento.porcao_padrao_g || 100;
  const f = quantidadeG / base;
  return {
    calorias: alimento.calorias * f,
    proteinas: alimento.proteinas * f,
    carboidratos: alimento.carboidratos * f,
    gorduras: alimento.gorduras * f,
    fibras: alimento.fibras * f,
  };
}

/** Soma os macros de uma lista de itens de refeição (com alimento embutido). */
export function macrosDaRefeicao(
  itens: (RefeicaoAlimento & { alimento?: Alimento })[],
): ResumoMacros {
  return itens.reduce<ResumoMacros>((acc, item) => {
    if (!item.alimento) return acc;
    const m = macrosDoItem(item.alimento, item.quantidade_g);
    return {
      calorias: acc.calorias + m.calorias,
      proteinas: acc.proteinas + m.proteinas,
      carboidratos: acc.carboidratos + m.carboidratos,
      gorduras: acc.gorduras + m.gorduras,
      fibras: acc.fibras + m.fibras,
    };
  }, { ...VAZIO });
}

/** Soma vários resumos de macros (ex.: refeições de um plano). */
export function somarMacros(resumos: ResumoMacros[]): ResumoMacros {
  return resumos.reduce<ResumoMacros>(
    (acc, m) => ({
      calorias: acc.calorias + m.calorias,
      proteinas: acc.proteinas + m.proteinas,
      carboidratos: acc.carboidratos + m.carboidratos,
      gorduras: acc.gorduras + m.gorduras,
      fibras: acc.fibras + m.fibras,
    }),
    { ...VAZIO },
  );
}

/** Distribuição percentual de calorias por macronutriente (4/4/9 kcal/g). */
export function distribuicaoCalorica(m: ResumoMacros) {
  const kcalP = m.proteinas * 4;
  const kcalC = m.carboidratos * 4;
  const kcalG = m.gorduras * 9;
  const total = kcalP + kcalC + kcalG || 1;
  return {
    proteinas: Math.round((kcalP / total) * 100),
    carboidratos: Math.round((kcalC / total) * 100),
    gorduras: Math.round((kcalG / total) * 100),
  };
}
