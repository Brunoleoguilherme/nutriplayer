"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Activity, Plus } from "lucide-react";
import type { Atleta, AvaliacaoCorporal } from "@/types";
import { atletasService } from "@/services/atletas";
import { avaliacoesService } from "@/services/avaliacoes";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { EvolucaoChart } from "@/components/avaliacoes/EvolucaoChart";
import { AvaliacaoForm } from "@/components/avaliacoes/AvaliacaoForm";
import { fmtData } from "@/utils/format";

export default function AvaliacoesPage() {
  return (
    <Suspense fallback={null}>
      <AvaliacoesConteudo />
    </Suspense>
  );
}

function AvaliacoesConteudo() {
  const clubeId = getClubeAtivo();
  const atletaParam = useSearchParams().get("atleta") ?? "";

  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletaId, setAtletaId] = useState(atletaParam);
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoCorporal[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    atletasService
      .list({ clubeId, orderBy: "nome", ascending: true })
      .then((as) => {
        setAtletas(as);
        if (!atletaParam && as.length > 0) setAtletaId(as[0].id);
      })
      .catch(() => {});
  }, [clubeId, atletaParam]);

  const carregar = useCallback(async () => {
    if (!atletaId) return;
    setLoading(true);
    try {
      setAvaliacoes(await avaliacoesService.porAtleta(atletaId));
    } finally {
      setLoading(false);
    }
  }, [atletaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function aposSalvar() {
    setModalAberto(false);
    carregar();
  }

  return (
    <>
      <PageHeader
        title="Avaliações"
        subtitle="Antropometria e evolução corporal por atleta."
        icon={<Activity className="h-6 w-6" />}
        actions={
          <Button onClick={() => setModalAberto(true)} disabled={!atletaId}>
            <Plus className="h-4 w-4" /> Nova avaliação
          </Button>
        }
      />

      <div className="mb-6 max-w-sm">
        <Select value={atletaId} onChange={(e) => setAtletaId(e.target.value)}>
          <option value="">Selecione um atleta...</option>
          {atletas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </Select>
      </div>

      {!atletaId ? (
        <EmptyState title="Selecione um atleta" description="Escolha um atleta para ver e registrar avaliações." />
      ) : loading ? (
        <Skeleton className="h-72 w-full" />
      ) : avaliacoes.length === 0 ? (
        <EmptyState
          title="Sem avaliações"
          description="Registre a primeira avaliação para acompanhar a evolução."
          icon={<Activity className="h-7 w-7" />}
          action={
            <Button onClick={() => setModalAberto(true)}>
              <Plus className="h-4 w-4" /> Registrar
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-4">
          <EvolucaoChart avaliacoes={avaliacoes} />

          <div className="card overflow-x-auto p-5">
            <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">
              Histórico ({avaliacoes.length})
            </h3>
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-[var(--color-muted)]">
                <tr>
                  <th className="px-3 py-2">Data</th>
                  <th className="px-3 py-2">Peso</th>
                  <th className="px-3 py-2">% Gordura</th>
                  <th className="px-3 py-2">Massa magra</th>
                </tr>
              </thead>
              <tbody>
                {[...avaliacoes].reverse().map((a) => (
                  <tr key={a.id} className="border-t border-[var(--color-border)]">
                    <td className="px-3 py-2">{fmtData(a.data_avaliacao)}</td>
                    <td className="px-3 py-2">{a.peso != null ? `${a.peso} kg` : "—"}</td>
                    <td className="px-3 py-2">{a.percentual_gordura != null ? `${a.percentual_gordura}%` : "—"}</td>
                    <td className="px-3 py-2">{a.massa_magra != null ? `${a.massa_magra} kg` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Nova avaliação" size="lg">
        {atletaId && (
          <AvaliacaoForm atletaId={atletaId} onSaved={aposSalvar} onCancel={() => setModalAberto(false)} />
        )}
      </Modal>
    </>
  );
}
