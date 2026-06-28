"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ShieldPlus, Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Protocolo } from "@/types";
import { protocolosService } from "@/services/protocolos";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { ProtocoloForm } from "@/components/protocolos/ProtocoloForm";

export default function ProtocolosPage() {
  const clubeId = getClubeAtivo();
  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState("Todos");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Protocolo | undefined>();

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setProtocolos(
        await protocolosService.list({ clubeId, orderBy: "nome", ascending: true }),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const categorias = useMemo(
    () => ["Todos", ...Array.from(new Set(protocolos.map((p) => p.categoria).filter(Boolean) as string[]))],
    [protocolos],
  );
  const filtrados = useMemo(
    () => (filtro === "Todos" ? protocolos : protocolos.filter((p) => p.categoria === filtro)),
    [protocolos, filtro],
  );

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }
  function abrirEdicao(p: Protocolo) {
    setEditando(p);
    setModalAberto(true);
  }
  async function excluir(p: Protocolo) {
    if (!confirm(`Excluir "${p.nome}"?`)) return;
    try {
      await protocolosService.softDelete(p.id);
      toast.success("Protocolo removido");
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
        title="Protocolos"
        subtitle="Objetos reutilizáveis: Recovery, hidratação, pré/pós-jogo."
        icon={<ShieldPlus className="h-6 w-6" />}
        actions={
          <Button onClick={abrirNovo}>
            <Plus className="h-4 w-4" /> Novo protocolo
          </Button>
        }
      />

      {!loading && !error && protocolos.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categorias.map((c) => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filtro === c
                  ? "brand-gradient text-white"
                  : "bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-fg)]"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={carregar} />
      ) : protocolos.length === 0 ? (
        <EmptyState
          title="Nenhum protocolo"
          description="Crie protocolos de Recovery, hidratação e estratégias de jogo."
          icon={<ShieldPlus className="h-7 w-7" />}
          action={
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4" /> Criar protocolo
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtrados.map((p) => (
            <div key={p.id} className="card group p-5">
              <div className="flex items-start justify-between">
                <div className="font-semibold">{p.nome}</div>
                {p.categoria && <Badge tone="brand">{p.categoria}</Badge>}
              </div>
              {p.objetivo && (
                <p className="mt-1 text-xs text-[var(--color-muted)]">{p.objetivo}</p>
              )}
              {p.descricao && (
                <p className="mt-3 line-clamp-3 text-sm text-[var(--color-muted)]">
                  {p.descricao}
                </p>
              )}
              <div className="mt-4 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => abrirEdicao(p)}
                  className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                  aria-label="Editar"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => excluir(p)}
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
        title={editando ? "Editar protocolo" : "Novo protocolo"}
        size="lg"
      >
        <ProtocoloForm protocolo={editando} onSaved={aposSalvar} onCancel={() => setModalAberto(false)} />
      </Modal>
    </>
  );
}
