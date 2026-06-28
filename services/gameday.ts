import type { GameDay, GameDayItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<GameDay>("game_days");

export interface ItemGameDayInput {
  horario?: string | null;
  titulo: string;
  tipo: string;
  refeicao_id?: string | null;
  suplemento_id?: string | null;
  descricao?: string | null;
  responsavel?: string | null;
  ordem?: number;
}

export const gameDayService = {
  ...base,

  async listar(clubeId?: string | null): Promise<GameDay[]> {
    return base.list({ clubeId, orderBy: "data_evento", ascending: false });
  },

  async criarComItens(
    evento: Partial<GameDay>,
    itens: ItemGameDayInput[],
  ): Promise<GameDay> {
    const supabase = createClient();
    const { data: novo, error } = await supabase
      .from("game_days")
      .insert(evento)
      .select()
      .single();
    if (error) throw error;

    if (itens.length > 0) {
      const rows = itens.map((it, i) => ({
        game_day_id: novo.id,
        horario: it.horario ?? null,
        titulo: it.titulo,
        tipo: it.tipo,
        refeicao_id: it.refeicao_id ?? null,
        suplemento_id: it.suplemento_id ?? null,
        descricao: it.descricao ?? null,
        responsavel: it.responsavel ?? null,
        ordem: it.ordem ?? i,
      }));
      const { error: e2 } = await supabase.from("game_day_itens").insert(rows);
      if (e2) throw e2;
    }
    return novo as GameDay;
  },

  async getComItens(
    id: string,
  ): Promise<{ evento: GameDay; itens: GameDayItem[] } | null> {
    const supabase = createClient();
    const { data: evento, error } = await supabase
      .from("game_days")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!evento) return null;

    const { data: itens, error: e2 } = await supabase
      .from("game_day_itens")
      .select("*, refeicao:refeicoes(*), suplemento:suplementos(*)")
      .eq("game_day_id", id)
      .order("ordem", { ascending: true });
    if (e2) throw e2;

    return { evento: evento as GameDay, itens: (itens ?? []) as GameDayItem[] };
  },
};
