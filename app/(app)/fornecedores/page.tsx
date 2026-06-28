"use client";

import { useCallback, useEffect, useState } from "react";
import { Truck, Plus, Pencil, Trash2, Mail, Phone } from "lucide-react";
import toast from "react-hot-toast";
import type { Fornecedor } from "@/types";
import { fornecedoresService } from "@/services/fornecedores";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { FornecedorForm } from "@/components/fornecedores/FornecedorForm";

export default function FornecedoresPage() {
  const clubeId = getClubeAtivo();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Fornecedor | undefined>();

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setFornecedores(await fornecedoresService.list({ clubeId, orderBy: "nome", ascending: true }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }
  function abrirEdicao(f: Fornecedor) {
    setEditando(f);
    setModalAberto(true);
  }
  async function excluir(f: Fornecedor) {
    if (!confirm(`Excluir "${f.nome}"?`)) return;
    try {
      await fornecedoresService.softDelete(f.id);
      toast.success("Fornecedor removido");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }
  function aposSalvar() {
    setModalAberto(false);
    carregar();
  }

  return (
    <>
      <PageHeader
        title="Fornecedores"
        subtitle="Parceiros de suplementos e produtos do clube."
        icon={<Truck className="h-6 w-6" />}
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo fornecedor
          </Button>
        }
      />

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : fornecedores.length === 0 ? (
        <EmptyState
          title="Nenhum fornecedor"
          description="Cadastre fornecedores para montar o marketplace e os pedidos."
          icon={<Truck className="h-7 w-7" />}
          action={
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4" /> Cadastrar
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {fornecedores.map((f) => (
            <div key={f.id} className="card group p-5">
              <div className="font-semibold">{f.nome}</div>
              {f.contato_nome && (
                <div className="text-xs text-[var(--color-muted)]">{f.contato_nome}</div>
              )}
              <div className="mt-3 space-y-1 text-xs text-[var(--color-muted)]">
                {f.email && (
                  <div className="flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {f.email}
                  </div>
                )}
                {f.telefone && (
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {f.telefone}
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => abrirEdicao(f)}
                  className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => excluir(f)}
                  className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                  aria-label="Excluir"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? "Editar fornecedor" : "Novo fornecedor"}
        size="lg"
      >
        <FornecedorForm fornecedor={editando} onSaved={aposSalvar} onCancel={() => setModalAberto(false)} />
      </Modal>
    </>
  );
}
