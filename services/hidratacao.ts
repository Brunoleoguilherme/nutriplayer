import type { HidratacaoRegistro } from "@/types";
import { createClient } from "@/lib/supabase/client";

function hoje(): string {
  return new Date().toISOString().slice(0, 10);
}

export const hidratacaoService = {
  async registrar(
    atletaId: string,
    clubeId: string,
    quantidadeMl: number,
  ): Promise<HidratacaoRegistro> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("hidratacao_registros")
      .insert({
        atleta_id: atletaId,
        clube_id: clubeId,
        quantidade_ml: quantidadeMl,
        data: hoje(),
      })
      .select()
      .single();
    if (error) throw error;
    return data as HidratacaoRegistro;
  },

  async registrosDoDia(
    atletaId: string,
    data: string = hoje(),
  ): Promise<HidratacaoRegistro[]> {
    const supabase = createClient();
    const { data: rows, error } = await supabase
      .from("hidratacao_registros")
      .select("*")
      .eq("atleta_id", atletaId)
      .eq("data", data)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (rows ?? []) as HidratacaoRegistro[];
  },

  async totalDoDia(atletaId: string, data: string = hoje()): Promise<number> {
    const rows = await this.registrosDoDia(atletaId, data);
    return rows.reduce((acc, r) => acc + r.quantidade_ml, 0);
  },
};
