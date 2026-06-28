import type { Pedido, PedidoItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { createCrudService } from "./base";

const base = createCrudService<Pedido>("pedidos");

export interface ItemPedidoInput {
  produto_id: string | null;
  nome: string;
  quantidade: number;
  preco_unitario: number;
}

export const pedidosService = {
  ...base,

  async criarComItens(
    pedido: Partial<Pedido>,
    itens: ItemPedidoInput[],
  ): Promise<Pedido> {
    const supabase = createClient();
    const total = itens.reduce((acc, it) => acc + it.quantidade * it.preco_unitario, 0);
    const codigo = `PC-${Date.now().toString().slice(-6)}`;

    const { data: novo, error } = await supabase
      .from("pedidos")
      .insert({ ...pedido, codigo, total })
      .select()
      .single();
    if (error) throw error;

    if (itens.length > 0) {
      const rows = itens.map((it, i) => ({
        pedido_id: novo.id,
        produto_id: it.produto_id,
        nome: it.nome,
        quantidade: it.quantidade,
        preco_unitario: it.preco_unitario,
        subtotal: it.quantidade * it.preco_unitario,
        ordem: i,
      }));
      const { error: e2 } = await supabase.from("pedido_itens").insert(rows);
      if (e2) throw e2;
    }
    return novo as Pedido;
  },

  async listarComFornecedor(clubeId?: string | null): Promise<Pedido[]> {
    const supabase = createClient();
    let q = supabase
      .from("pedidos")
      .select("*, fornecedor:fornecedores(id, nome)")
      .is("deleted_at", null)
      .eq("ativo", true)
      .order("created_at", { ascending: false });
    if (clubeId) q = q.eq("clube_id", clubeId);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []) as Pedido[];
  },

  async getComItens(id: string) {
    const supabase = createClient();
    const { data: pedido, error } = await supabase
      .from("pedidos")
      .select("*, fornecedor:fornecedores(id, nome)")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();
    if (error) throw error;
    if (!pedido) return null;

    const { data: itens, error: e2 } = await supabase
      .from("pedido_itens")
      .select("*")
      .eq("pedido_id", id)
      .order("ordem", { ascending: true });
    if (e2) throw e2;

    return { pedido: pedido as Pedido, itens: (itens ?? []) as PedidoItem[] };
  },

  async mudarStatus(id: string, status: Pedido["status"]): Promise<void> {
    const { error } = await createClient().from("pedidos").update({ status }).eq("id", id);
    if (error) throw error;
  },
};
