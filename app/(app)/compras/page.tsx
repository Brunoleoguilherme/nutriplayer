"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ShoppingBag, Store, Truck } from "lucide-react";
import type { Pedido } from "@/types";
import { pedidosService } from "@/services/pedidos";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { fmtBRL, fmtData } from "@/utils/format";

const statusTone = (s: string) =>
  s === "Recebido" ? "success" : s === "Enviado" ? "info" : s === "Cancelado" ? "danger" : "warning";

export default function ComprasPage() {
  const clubeId = getClubeAtivo();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPedidos(await pedidosService.listarComFornecedor(clubeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <>
      <PageHeader
        title="Compras"
        subtitle="Pedidos de compra do clube."
        icon={<ShoppingBag className="h-6 w-6" />}
        actions={
          <Link href="/marketplace">
            <Button>
              <Store className="h-4 w-4" /> Ir ao marketplace
            </Button>
          </Link>
        }
      />

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : pedidos.length === 0 ? (
        <EmptyState
          title="Nenhum pedido"
          description="Monte um pedido pelo marketplace adicionando produtos ao carrinho."
          icon={<ShoppingBag className="h-7 w-7" />}
          action={
            <Link href="/marketplace">
              <Button>
                <Store className="h-4 w-4" /> Ir ao marketplace
              </Button>
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pedidos.map((p) => (
            <Link key={p.id} href={`/compras/${p.id}`} className="card p-5 transition-colors hover:bg-[var(--color-surface-2)]">
              <div className="flex items-start justify-between">
                <div className="font-semibold">{p.codigo ?? "Pedido"}</div>
                <Badge tone={statusTone(p.status)}>{p.status}</Badge>
              </div>
              <div className="mt-2 flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <Truck className="h-3 w-3" /> {p.fornecedor?.nome ?? "Vários / não definido"}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-[var(--color-muted)]">{fmtData(p.data_pedido)}</span>
                <span className="font-bold">{fmtBRL(p.total)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
