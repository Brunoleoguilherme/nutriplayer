import type { Alimento, Refeicao, ResumoMacros } from "@/types";
import { refeicoesService } from "./refeicoes";
import { planosService } from "./planos";
import { alimentosService } from "./alimentos";
import { macrosDaRefeicao, somarMacros } from "@/utils/macros";
import { analisarAlertas, sugerirSubstituicoes, type Alerta, type Substituicao } from "@/utils/nutricao";

export interface RefeicaoComMacros {
  refeicao: Refeicao;
  macros: ResumoMacros;
  sodio: number;
}

/** Carrega refeições do clube já com macros calculados (a partir dos itens). */
async function refeicoesComMacros(clubeId: string): Promise<RefeicaoComMacros[]> {
  const lista = await refeicoesService.list({ clubeId, orderBy: "nome", ascending: true });
  const resolvidas = await Promise.all(
    lista.map(async (r) => {
      const det = await refeicoesService.getComItens(r.id);
      const itens = det?.itens ?? [];
      const macros = macrosDaRefeicao(itens);
      const sodio = itens.reduce((acc, it) => {
        if (!it.alimento) return acc;
        const f = it.quantidade_g / (it.alimento.porcao_padrao_g || 100);
        return acc + (it.alimento.sodio ?? 0) * f;
      }, 0);
      return { refeicao: r, macros, sodio };
    }),
  );
  return resolvidas.filter((r) => r.macros.calorias > 0);
}

export const iaService = {
  /**
   * Gera uma sugestão de plano: seleciona refeições do banco do clube
   * combinando-as para se aproximar da meta calórica (heurística gulosa).
   */
  async gerarPlanoAutomatico(
    clubeId: string,
    metaKcal: number,
    maxRefeicoes = 5,
  ): Promise<{ selecao: RefeicaoComMacros[]; total: ResumoMacros }> {
    const disponiveis = await refeicoesComMacros(clubeId);
    const selecao: RefeicaoComMacros[] = [];
    const usados = new Set<string>();
    let acumulado = 0;

    for (let i = 0; i < maxRefeicoes && usados.size < disponiveis.length; i++) {
      const restante = metaKcal - acumulado;
      if (restante <= 50) break;
      // escolhe a refeição cujo kcal melhor preenche o restante sem estourar muito
      let melhor: RefeicaoComMacros | null = null;
      let melhorGap = Infinity;
      for (const r of disponiveis) {
        if (usados.has(r.refeicao.id)) continue;
        const gap = Math.abs(restante / Math.max(1, maxRefeicoes - i) - r.macros.calorias);
        if (gap < melhorGap) {
          melhorGap = gap;
          melhor = r;
        }
      }
      if (!melhor) break;
      selecao.push(melhor);
      usados.add(melhor.refeicao.id);
      acumulado += melhor.macros.calorias;
    }

    return { selecao, total: somarMacros(selecao.map((s) => s.macros)) };
  },

  /** Analisa um plano existente e devolve alertas nutricionais. */
  async analisarPlano(
    planoId: string,
    pesoKg?: number | null,
  ): Promise<{ total: ResumoMacros; sodio: number; alertas: Alerta[] }> {
    const det = await planosService.getComRefeicoes(planoId);
    if (!det) return { total: { calorias: 0, proteinas: 0, carboidratos: 0, gorduras: 0, fibras: 0 }, sodio: 0, alertas: [] };

    const macrosLista: ResumoMacros[] = [];
    let sodio = 0;
    for (const pr of det.refeicoes) {
      const ref = await refeicoesService.getComItens(pr.refeicao_id);
      if (!ref) continue;
      macrosLista.push(macrosDaRefeicao(ref.itens));
      sodio += ref.itens.reduce((acc, it) => {
        if (!it.alimento) return acc;
        const f = it.quantidade_g / (it.alimento.porcao_padrao_g || 100);
        return acc + (it.alimento.sodio ?? 0) * f;
      }, 0);
    }
    const total = somarMacros(macrosLista);
    const alertas = analisarAlertas(total, {
      pesoKg,
      sodioMg: sodio,
      metaKcal: det.plano.meta_calorica,
    });
    return { total, sodio, alertas };
  },

  /** Substituições equivalentes a um alimento dentro do banco do clube. */
  async substituicoesPara(
    alimento: Alimento,
    clubeId: string,
  ): Promise<Substituicao[]> {
    const candidatos = await alimentosService.listarClubeEGlobais(clubeId);
    return sugerirSubstituicoes(alimento, candidatos, 6);
  },
};
