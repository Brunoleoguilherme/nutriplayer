import type { Alimento } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<Alimento>("alimentos");

/** Serviço de Alimentos (Banco Alimentar). */
export const alimentosService = {
  ...base,

  /** Lista alimentos do clube + globais (clube_id null). */
  async listarClubeEGlobais(clubeId?: string | null): Promise<Alimento[]> {
    const supabase = createClient();
    let q = supabase
      .from("alimentos")
      .select("*")
      .is("deleted_at", null)
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (clubeId) q = q.or(`clube_id.eq.${clubeId},clube_id.is.null`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Alimento[];
  },

  /** Busca alimentos do clube + globais (clube_id null), por nome. */
  async buscar(termo: string, clubeId?: string | null): Promise<Alimento[]> {
    const supabase = createClient();
    let q = supabase
      .from("alimentos")
      .select("*")
      .is("deleted_at", null)
      .eq("ativo", true)
      .ilike("nome", `%${termo}%`)
      .order("nome", { ascending: true })
      .limit(50);

    if (clubeId) q = q.or(`clube_id.eq.${clubeId},clube_id.is.null`);

    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Alimento[];
  },
};
