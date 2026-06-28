import type { Produto } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<Produto>("produtos");

export const produtosService = {
  ...base,

  /** Lista produtos do clube com o nome do fornecedor. */
  async listarComFornecedor(clubeId?: string | null): Promise<Produto[]> {
    const supabase = createClient();
    let q = supabase
      .from("produtos")
      .select("*, fornecedor:fornecedores(id, nome)")
      .is("deleted_at", null)
      .eq("ativo", true)
      .order("nome", { ascending: true });
    if (clubeId) q = q.eq("clube_id", clubeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Produto[];
  },
};
