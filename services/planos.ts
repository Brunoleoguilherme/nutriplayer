import type { PlanoAlimentar, PlanoRefeicao } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<PlanoAlimentar>("planos_alimentares");

export interface ItemPlanoInput {
  refeicao_id: string;
  horario?: string | null;
  periodo?: string | null;
  ordem?: number;
}

export const planosService = {
  ...base,

  async criarComRefeicoes(
    plano: Partial<PlanoAlimentar>,
    refeicoes: ItemPlanoInput[],
  ): Promise<PlanoAlimentar> {
    const supabase = createClient();
    const { data: novo, error } = await supabase
      .from("planos_alimentares")
      .insert(plano)
      .select()
      .single();
    if (error) throw error;

    if (refeicoes.length > 0) {
      const rows = refeicoes.map((r, i) => ({
        plano_id: novo.id,
        refeicao_id: r.refeicao_id,
        horario: r.horario ?? null,
        periodo: r.periodo ?? null,
        ordem: r.ordem ?? i,
      }));
      const { error: e2 } = await supabase.from("plano_refeicoes").insert(rows);
      if (e2) throw e2;
    }
    return novo as PlanoAlimentar;
  },

  /** Lista planos do clube com o nome do atleta. */
  async listarComAtleta(clubeId?: string | null) {
    const supabase = createClient();
    let q = supabase
      .from("planos_alimentares")
      .select("*, atleta:atletas(id, nome)")
      .is("deleted_at", null)
      .eq("ativo", true)
      .order("created_at", { ascending: false });
    if (clubeId) q = q.eq("clube_id", clubeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as (PlanoAlimentar & {
      atleta?: { id: string; nome: string } | null;
    })[];
  },

  async getComRefeicoes(id: string) {
    const supabase = createClient();
    const { data: plano, error } = await supabase
      .from("planos_alimentares")
      .select("*, atleta:atletas(id, nome)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!plano) return null;

    const { data: refeicoes, error: e2 } = await supabase
      .from("plano_refeicoes")
      .select("*, refeicao:refeicoes(*)")
      .eq("plano_id", id)
      .order("ordem", { ascending: true });
    if (e2) throw e2;

    return {
      plano: plano as PlanoAlimentar & { atleta?: { id: string; nome: string } | null },
      refeicoes: (refeicoes ?? []) as PlanoRefeicao[],
    };
  },
};
