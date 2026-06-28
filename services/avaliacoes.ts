import type { AvaliacaoCorporal } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<AvaliacaoCorporal>("avaliacoes_corporais");

export const avaliacoesService = {
  ...base,

  /** Avaliações de um atleta em ordem cronológica (para evolução). */
  async porAtleta(atletaId: string): Promise<AvaliacaoCorporal[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("avaliacoes_corporais")
      .select("*")
      .eq("atleta_id", atletaId)
      .is("deleted_at", null)
      .order("data_avaliacao", { ascending: true });
    if (error) throw error;
    return (data ?? []) as AvaliacaoCorporal[];
  },
};
