import type { Predicao } from "@/utils/ml";
import {
  preverProntidao,
  preverRiscoLesao,
  preverPerformance,
} from "@/utils/ml";
import { wearablesService } from "./wearables";
import { avaliacoesService } from "./avaliacoes";
import { createClient } from "@/lib/supabase/client";

export const mlService = {
  /** Roda os 3 modelos para um atleta a partir dos dados disponíveis. */
  async preverAtleta(atletaId: string): Promise<{
    prontidao: Predicao;
    risco: Predicao;
    performance: Predicao;
  }> {
    const [metricas, avaliacoes] = await Promise.all([
      wearablesService.metricas(atletaId, 60),
      avaliacoesService.porAtleta(atletaId),
    ]);

    const prontidao = preverProntidao(metricas);
    const risco = preverRiscoLesao(metricas, avaliacoes);
    const performance = preverPerformance(avaliacoes, prontidao.score);

    return { prontidao, risco, performance };
  },

  /** Salva um snapshot das predições (histórico p/ ML futuro). */
  async salvarSnapshot(
    atletaId: string,
    clubeId: string,
    predicoes: Predicao[],
  ): Promise<void> {
    const supabase = createClient();
    const hoje = new Date().toISOString().slice(0, 10);
    const rows = predicoes.map((p) => ({
      atleta_id: atletaId,
      clube_id: clubeId,
      data: hoje,
      tipo: p.tipo,
      score: p.score,
      nivel: p.nivel,
      resumo: p.resumo,
      fatores: p.fatores,
      modelo: "heuristico-v1",
    }));
    const { error } = await supabase.from("ml_predicoes").insert(rows);
    if (error) throw error;
  },
};
