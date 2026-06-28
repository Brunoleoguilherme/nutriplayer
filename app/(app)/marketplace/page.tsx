"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Plus, Search, ShoppingCart, Trash2, Minus } from "lucide-react";
import toast from "react-hot-toast";
import type { Produto } from "@/types";
import { produtosService } from "@/services/produtos";
import { pedidosService, type ItemPedidoInput } from "@/services/pedidos";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { ProdutoForm } from "@/components/marketplace/ProdutoForm";
import { fmtBRL } from "@/utils/format";

interface ItemCarrinho {
  produto: Produto;
  qtd: number;
}

export default function MarketplacePage() {
  const clubeId = getClubeAtivo();
  const router = useRouter();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProdutos(await produtosService.listarComFornecedor(clubeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return produtos.filter((p) => !t || p.nome.toLowerCase().includes(t));
  }, [produtos, busca]);

  function adicionar(p: Produto) {
    setCarrinho((c) => {
      const ex = c.find((i) => i.produto.id === p.id);
      if (ex) return c.map((i) => (i.produto.id === p.id ? { ...i, qtd: i.qtd + 1 } : i));
      return [...c, { produto: p, qtd: 1 }];
    });
  }
  function mudarQtd(id: string, delta: number) {
    setCarrinho((c) =>
      c
        .map((i) => (i.produto.id === id ? { ...i, qtd: Math.max(0, i.qtd + delta) } : i))
        .filter((i) => i.qtd > 0),
    );
  }

  const total = carrinho.reduce((acc, i) => acc + i.qtd * i.produto.preco, 0);

  async function finalizar() {
    if (carrinho.length === 0) return;
    setSalvando(true);
    try {
      const fornIds = new Set(carrinho.map((i) => i.produto.fornecedor_id).filter(Boolean));
      const fornecedor_id = fornIds.size === 1 ? [...fornIds][0]! : null;
      const itens: ItemPedidoInput[] = carrinho.map((i) => ({
        produto_id: i.produto.id,
        nome: i.produto.nome,
        quantidade: i.qtd,
        preco_unitario: i.produto.preco,
      }));
      await pedidosService.criarComItens(
        { clube_id: clubeId, fornecedor_id, status: "Rascunho" },
        itens,
      );
      toast.success("Pedido criado (rascunho)");
      setCarrinho([]);
      router.push("/compras");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao criar pedido");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Marketplace"
        subtitle="Catálogo de produtos dos fornecedores do clube."
        icon={<Store className="h-6 w-6" />}
        actions={
          <Button onClick={() => setModalAberto(true)}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          {!loading && !error && produtos.length > 0 && (
            <div className="relative mb-6 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
              <Input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar produto..." className="pl-9" />
            </div>
          )}

          {loading ? (
            <SkeletonCards />
          ) : error ? (
            <ErrorState message={error} onRetry={carregar} />
          ) : produtos.length === 0 ? (
            <EmptyState
              title="Catálogo vazio"
              description="Cadastre produtos dos seus fornecedores para montar pedidos."
              icon={<Store className="h-7 w-7" />}
              action={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus className="h-4 w-4" /> Cadastrar produto
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filtrados.map((p) => (
                <div key={p.id} className="card flex flex-col p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold leading-tight">{p.nome}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {p.marca || p.categoria || "—"}
                      </div>
                    </div>
                    {p.fornecedor?.nome && <Badge tone="info">{p.fornecedor.nome}</Badge>}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="font-bold">{fmtBRL(p.preco)}</span>
                    <span className="text-xs text-[var(--color-muted)]">/{p.unidade}</span>
                  </div>
                  <Button onClick={() => adicionar(p)} variant="ghost" className="mt-3">
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Carrinho */}
        <div className="card sticky top-6 flex h-fit flex-col p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <ShoppingCart className="h-4 w-4 text-[var(--color-brand-green)]" /> Carrinho
          </h3>
          {carrinho.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--color-muted)]">
              Adicione produtos para montar um pedido.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {carrinho.map((i) => (
                  <div key={i.produto.id} className="rounded-[10px] bg-[var(--color-bg)] p-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-xs font-medium">{i.produto.nome}</span>
                      <button onClick={() => mudarQtd(i.produto.id, -i.qtd)} aria-label="Remover">
                        <Trash2 className="h-3.5 w-3.5 text-[var(--color-muted)] hover:text-[var(--color-danger)]" />
                      </button>
                    </div>
                    <div className="mt-1 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button onClick={() => mudarQtd(i.produto.id, -1)} className="rounded bg-[var(--color-surface-2)] p-1">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs tabular-nums">{i.qtd}</span>
                        <button onClick={() => mudarQtd(i.produto.id, 1)} className="rounded bg-[var(--color-surface-2)] p-1">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-xs">{fmtBRL(i.qtd * i.produto.preco)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-[var(--color-border)] pt-3">
                <span className="text-sm text-[var(--color-muted)]">Total</span>
                <span className="font-bold">{fmtBRL(total)}</span>
              </div>
              <Button onClick={finalizar} disabled={salvando} className="mt-3 w-full">
                {salvando ? "Criando..." : "Gerar pedido"}
              </Button>
            </>
          )}
        </div>
      </div>

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Novo produto" size="lg">
        <ProdutoForm
          onSaved={() => {
            setModalAberto(false);
            carregar();
          }}
          onCancel={() => setModalAberto(false)}
        />
      </Modal>
    </>
  );
}
