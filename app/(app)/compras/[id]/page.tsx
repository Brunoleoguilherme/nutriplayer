"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Truck } from "lucide-react";
import toast from "react-hot-toast";
import type { Pedido, PedidoItem, StatusPedido } from "@/types";
import { pedidosService } from "@/services/pedidos";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Skeleton, ErrorState } from "@/components/ui/States";
import { fmtBRL, fmtData } from "@/utils/format";

const STATUS: StatusPedido[] = ["Rascunho", "Enviado", "Recebido", "Cancelado"];
const statusTone = (s: string) =>
  s === "Recebido" ? "success" : s === "Enviado" ? "info" : s === "Cancelado" ? "danger" : "warning";

export default function PedidoDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [itens, setItens] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await pedidosService.getComItens(id);
      if (!res) {
        setError("Pedido não encontrado");
        return;
      }
      setPedido(res.pedido);
      setItens(res.itens);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function mudarStatus(status: StatusPedido) {
    try {
      await pedidosService.mudarStatus(id, status);
      setPedido((p) => (p ? { ...p, status } : p));
      toast.success("Status atualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  if (loading) return <Skeleton className="h-64 w-full" />;
  if (error || !pedido) return <ErrorState message={error ?? "Não encontrado"} />;

  return (
    <div>
      <Link href="/compras" className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]">
        <ArrowLeft className="h-4 w-4" /> Compras
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{pedido.codigo ?? "Pedido"}</h1>
            <Badge tone={statusTone(pedido.status)}>{pedido.status}</Badge>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-muted)]">
            <Truck className="h-4 w-4" /> {pedido.fornecedor?.nome ?? "Vários / não definido"} · {fmtData(pedido.data_pedido)}
          </p>
        </div>
        <div className="w-44">
          <Select value={pedido.status} onChange={(e) => mudarStatus(e.target.value as StatusPedido)}>
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="card overflow-x-auto p-5">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-muted)]">
            <tr>
              <th className="px-3 py-2">Produto</th>
              <th className="px-3 py-2 text-right">Qtd</th>
              <th className="px-3 py-2 text-right">Unit.</th>
              <th className="px-3 py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} className="border-t border-[var(--color-border)]">
                <td className="px-3 py-2">{it.nome}</td>
                <td className="px-3 py-2 text-right tabular-nums">{it.quantidade}</td>
                <td className="px-3 py-2 text-right">{fmtBRL(it.preco_unitario)}</td>
                <td className="px-3 py-2 text-right">{fmtBRL(it.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[var(--color-border)] font-bold">
              <td className="px-3 py-2" colSpan={3}>
                Total
              </td>
              <td className="px-3 py-2 text-right">{fmtBRL(pedido.total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      {pedido.observacoes && (
        <div className="card mt-4 p-5 text-sm text-[var(--color-muted)]">{pedido.observacoes}</div>
      )}
    </div>
  );
}
