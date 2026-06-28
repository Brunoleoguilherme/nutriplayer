import type { Refeicao, RefeicaoAlimento } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<Refeicao>("refeicoes");

export interface ItemRefeicaoInput {
  alimento_id: string;
  quantidade_g: number;
  medida_caseira?: string | null;
  ordem?: number;
}

export const refeicoesService = {
  ...base,

  /** Cria a refeição e seus itens (composição). */
  async criarComItens(
    refeicao: Partial<Refeicao>,
    itens: ItemRefeicaoInput[],
  ): Promise<Refeicao> {
    const supabase = createClient();
    const { data: nova, error } = await supabase
      .from("refeicoes")
      .insert(refeicao)
      .select()
      .single();
    if (error) throw error;

    if (itens.length > 0) {
      const rows = itens.map((it, i) => ({
        refeicao_id: nova.id,
        alimento_id: it.alimento_id,
        quantidade_g: it.quantidade_g,
        medida_caseira: it.medida_caseira ?? null,
        ordem: it.ordem ?? i,
      }));
      const { error: e2 } = await supabase.from("refeicao_alimentos").insert(rows);
      if (e2) throw e2;
    }
    return nova as Refeicao;
  },

  /** Busca uma refeição com os itens e o alimento de cada item. */
  async getComItens(
    id: string,
  ): Promise<{ refeicao: Refeicao; itens: RefeicaoAlimento[] } | null> {
    const supabase = createClient();
    const { data: refeicao, error } = await supabase
      .from("refeicoes")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!refeicao) return null;

    const { data: itens, error: e2 } = await supabase
      .from("refeicao_alimentos")
      .select("*, alimento:alimentos(*)")
      .eq("refeicao_id", id)
      .order("ordem", { ascending: true });
    if (e2) throw e2;

    return {
      refeicao: refeicao as Refeicao,
      itens: (itens ?? []) as RefeicaoAlimento[],
    };
  },
};
