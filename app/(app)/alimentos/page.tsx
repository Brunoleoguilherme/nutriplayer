"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Apple, Plus, Search, Upload } from "lucide-react";
import toast from "react-hot-toast";
import type { Alimento } from "@/types";
import { useAlimentos } from "@/hooks/useAlimentos";
import { alimentosService } from "@/services/alimentos";
import { getClubeAtivo } from "@/lib/club";
import { FONTES_ALIMENTO } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select } from "@/components/ui/Field";
import { EmptyState, ErrorState, SkeletonCards } from "@/components/ui/States";
import { AlimentoCard } from "@/components/alimentos/AlimentoCard";
import { AlimentoForm } from "@/components/alimentos/AlimentoForm";

export default function AlimentosPage() {
  const clubeId = getClubeAtivo();
  const { alimentos, loading, error, recarregar } = useAlimentos(clubeId);
  const [busca, setBusca] = useState("");
  const [fonte, setFonte] = useState("");
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Alimento | undefined>();

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return alimentos.filter(
      (a) =>
        (!t || a.nome.toLowerCase().includes(t)) &&
        (!fonte || a.fonte === fonte),
    );
  }, [alimentos, busca, fonte]);

  function abrirNovo() {
    setEditando(undefined);
    setModalAberto(true);
  }
  function abrirEdicao(a: Alimento) {
    setEditando(a);
    setModalAberto(true);
  }
  async function excluir(a: Alimento) {
    if (!confirm(`Excluir "${a.nome}"?`)) return;
    try {
      await alimentosService.softDelete(a.id);
      toast.success("Alimento removido");
      recarregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao excluir");
    }
  }
  function aposSalvar() {
    setModalAberto(false);
    recarregar();
  }

  return (
    <>
      <PageHeader
        title="Banco Alimentar"
        subtitle="Base mestre reutilizável (TACO, TBCA, USDA, própria)."
        icon={<Apple className="h-6 w-6" />}
        actions={
          <>
            <Link href="/alimentos/importar">
              <Button variant="ghost">
                <Upload className="h-4 w-4" /> Importar CSV
              </Button>
            </Link>
            <Button onClick={abrirNovo}>
              <Plus className="h-4 w-4" /> Novo alimento
            </Button>
          </>
        }
      />

      {!loading && !error && alimentos.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar alimento..."
              className="pl-9"
            />
          </div>
          <Select
            value={fonte}
            onChange={(e) => setFonte(e.target.value)}
            className="max-w-40"
          >
            <option value="">Todas as fontes</option>
            {FONTES_ALIMENTO.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </div>
      )}

      {loading ? (
        <SkeletonCards />
      ) : error ? (
        <ErrorState message={error} onRetry={recarregar} />
      ) : alimentos.length === 0 ? (
        <EmptyState
          title="Banco alimentar vazio"
          description="Cadastre alimentos manualmente ou importe uma base CSV (TACO/TBCA/USDA)."
          icon={<Apple className="h-7 w-7" />}
          action={
            <div className="flex gap-2">
              <Link href="/alimentos/importar">
                <Button variant="ghost">
                  <Upload className="h-4 w-4" /> Importar CSV
                </Button>
              </Link>
              <Button onClick={abrirNovo}>
                <Plus className="h-4 w-4" /> Cadastrar
              </Button>
            </div>
          }
        />
      ) : filtrados.length === 0 ? (
        <EmptyState title="Nenhum alimento encontrado" description="Ajuste a busca ou o filtro." />
      ) : (
        <>
          <p className="mb-4 text-sm text-[var(--color-muted)]">
            {filtrados.length} alimento{filtrados.length > 1 ? "s" : ""}
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtrados.map((a) => (
              <AlimentoCard
                key={a.id}
                alimento={a}
                onEdit={abrirEdicao}
                onDelete={excluir}
              />
            ))}
          </div>
        </>
      )}

      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title={editando ? "Editar alimento" : "Novo alimento"}
        size="lg"
      >
        <AlimentoForm
          alimento={editando}
          onSaved={aposSalvar}
          onCancel={() => setModalAberto(false)}
        />
      </Modal>
    </>
  );
}
