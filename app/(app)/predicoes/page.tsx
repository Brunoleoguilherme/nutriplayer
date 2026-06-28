"use client";

import { useCallback, useEffect, useState } from "react";
import { Brain, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Atleta } from "@/types";
import type { Predicao } from "@/utils/ml";
import { atletasService } from "@/services/atletas";
import { mlService } from "@/services/ml";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { PredicaoCard } from "@/components/ml/PredicaoCard";

interface Resultado {
  prontidao: Predicao;
  risco: Predicao;
  performance: Predicao;
}

export default function PredicoesPage() {
  const clubeId = getClubeAtivo();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletaId, setAtletaId] = useState("");
  const [res, setRes] = useState<Resultado | null>(null);
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    atletasService.list({ clubeId, orderBy: "nome", ascending: true }).then((as) => {
      setAtletas(as);
      if (as.length > 0) setAtletaId(as[0].id);
    }).catch(() => {});
  }, [clubeId]);

  const carregar = useCallback(async () => {
    if (!atletaId) return;
    setLoading(true);
    setRes(null);
    try {
      setRes(await mlService.preverAtleta(atletaId));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao prever");
    } finally {
      setLoading(false);
    }
  }, [atletaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvar() {
    if (!res) return;
    setSalvando(true);
    try {
      await mlService.salvarSnapshot(atletaId, clubeId, [res.prontidao, res.risco, res.performance]);
      toast.success("Snapshot salvo no histórico");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Predições"
        subtitle="Prontidão, risco de lesão e tendência de performance por atleta."
        icon={<Brain className="h-6 w-6" />}
        actions={
          <Button onClick={salvar} disabled={!res || salvando}>
            <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar snapshot"}
          </Button>
        }
      />

      <div className="mb-4 max-w-sm">
        <Select value={atletaId} onChange={(e) => setAtletaId(e.target.value)}>
          <option value="">Selecione um atleta...</option>
          {atletas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </Select>
      </div>

      <p className="mb-6 text-xs text-[var(--color-muted)]">
        Modelos heurísticos explicáveis (v1) sobre wearables + avaliações. Quanto mais
        histórico, mais confiáveis — e prontos para evoluir para modelos treinados.
      </p>

      {!atletaId ? (
        <EmptyState title="Selecione um atleta" description="Escolha um atleta para gerar as predições." />
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full" />
          ))}
        </div>
      ) : res ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <PredicaoCard titulo="Prontidão / Recovery" predicao={res.prontidao} />
          <PredicaoCard titulo="Risco de lesão" predicao={res.risco} invertido />
          <PredicaoCard titulo="Tendência de performance" predicao={res.performance} />
        </div>
      ) : null}
    </>
  );
}
