"use client";

import { useCallback, useEffect, useState } from "react";
import { Watch, Plus, Heart, Moon, Activity, Footprints, Zap } from "lucide-react";
import toast from "react-hot-toast";
import type { Atleta, WearableConexao, WearableMetrica, ProvedorWearable } from "@/types";
import { atletasService } from "@/services/atletas";
import { wearablesService, PROVEDORES } from "@/services/wearables";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Field";
import { EmptyState, Skeleton } from "@/components/ui/States";
import { MetricaForm } from "@/components/wearables/MetricaForm";
import { WearableChart } from "@/components/wearables/WearableChart";

const statusCor: Record<string, string> = {
  conectado: "var(--color-success)",
  pendente: "var(--color-warning)",
  desconectado: "var(--color-muted)",
};

function Kpi({ icon: Icon, label, valor, cor }: { icon: typeof Heart; label: string; valor: string; cor: string }) {
  return (
    <div className="card p-4">
      <Icon className="mb-2 h-5 w-5" style={{ color: cor }} />
      <div className="text-2xl font-bold">{valor}</div>
      <div className="text-xs text-[var(--color-muted)]">{label}</div>
    </div>
  );
}

export default function WearablesPage() {
  const clubeId = getClubeAtivo();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletaId, setAtletaId] = useState("");
  const [conexoes, setConexoes] = useState<WearableConexao[]>([]);
  const [metricas, setMetricas] = useState<WearableMetrica[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    atletasService.list({ clubeId, orderBy: "nome", ascending: true }).then((as) => {
      setAtletas(as);
      if (as.length > 0) setAtletaId(as[0].id);
    }).catch(() => {});
  }, [clubeId]);

  const carregar = useCallback(async () => {
    if (!atletaId) return;
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        wearablesService.conexoes(atletaId),
        wearablesService.metricas(atletaId),
      ]);
      setConexoes(c);
      setMetricas(m);
    } finally {
      setLoading(false);
    }
  }, [atletaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarConexao(provedor: ProvedorWearable, atual?: string) {
    const novo = atual === "conectado" ? "desconectado" : "conectado";
    try {
      await wearablesService.definirConexao(atletaId, clubeId, provedor, novo);
      toast.success(novo === "conectado" ? "Conexão marcada como ativa" : "Conexão desativada");
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    }
  }

  const ultima = metricas[metricas.length - 1];
  const statusDe = (p: string) => conexoes.find((c) => c.provedor === p)?.status;

  return (
    <>
      <PageHeader
        title="Wearables"
        subtitle="Sono, recuperação e atividade — Garmin, Polar, Apple Health, Google Fit."
        icon={<Watch className="h-6 w-6" />}
        actions={
          <Button onClick={() => setModalAberto(true)} disabled={!atletaId}>
            <Plus className="h-4 w-4" /> Lançar métrica
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
        <EmptyState title="Selecione um atleta" description="Escolha um atleta para ver as métricas dos dispositivos." />
      ) : (
        <div className="flex flex-col gap-6">
          {/* Conexões */}
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">Dispositivos</h3>
            <div className="flex flex-wrap gap-2">
              {PROVEDORES.filter((p) => p.id !== "manual").map((p) => {
                const st = statusDe(p.id) ?? "pendente";
                return (
                  <button
                    key={p.id}
                    onClick={() => alternarConexao(p.id, st)}
                    className="flex items-center gap-2 rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <span className="h-2 w-2 rounded-full" style={{ background: statusCor[st] }} />
                    {p.label}
                    <span className="text-xs text-[var(--color-muted)]">{st}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[var(--color-muted)]">
              A sincronização automática de cada provedor depende de OAuth/credenciais de parceiro
              (backend). Os dados podem chegar pelo endpoint de ingestão ou serem lançados manualmente.
            </p>
          </div>

          {loading ? (
            <Skeleton className="h-40 w-full" />
          ) : metricas.length === 0 ? (
            <EmptyState
              title="Sem métricas"
              description="Lance uma métrica manualmente ou conecte um dispositivo."
              icon={<Watch className="h-7 w-7" />}
              action={
                <Button onClick={() => setModalAberto(true)}>
                  <Plus className="h-4 w-4" /> Lançar métrica
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                <Kpi icon={Zap} label="Prontidão" valor={ultima?.prontidao != null ? `${ultima.prontidao}` : "—"} cor="var(--color-success)" />
                <Kpi icon={Moon} label="Sono" valor={ultima?.sono_min != null ? `${Math.floor(ultima.sono_min / 60)}h${ultima.sono_min % 60}` : "—"} cor="var(--color-brand-purple)" />
                <Kpi icon={Heart} label="FC repouso" valor={ultima?.fc_repouso != null ? `${ultima.fc_repouso}` : "—"} cor="var(--color-danger)" />
                <Kpi icon={Activity} label="HRV (ms)" valor={ultima?.hrv_ms != null ? `${ultima.hrv_ms}` : "—"} cor="var(--color-info)" />
                <Kpi icon={Footprints} label="Passos" valor={ultima?.passos != null ? ultima.passos.toLocaleString("pt-BR") : "—"} cor="var(--color-warning)" />
              </div>

              <WearableChart metricas={metricas} />
            </>
          )}
        </div>
      )}

      <Modal open={modalAberto} onClose={() => setModalAberto(false)} title="Lançar métrica" size="lg">
        {atletaId && (
          <MetricaForm
            atletaId={atletaId}
            onSaved={() => {
              setModalAberto(false);
              carregar();
            }}
            onCancel={() => setModalAberto(false)}
          />
        )}
      </Modal>
    </>
  );
}
