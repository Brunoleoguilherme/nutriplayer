"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import type { PlanoAlimentar, ResumoMacros } from "@/types";
import { planosService } from "@/services/planos";
import { atletasService } from "@/services/atletas";
import { iaService } from "@/services/ia";
import { getClubeAtivo } from "@/lib/club";
import type { Alerta } from "@/utils/nutricao";
import { Button } from "@/components/ui/Button";
import { Select, FormField } from "@/components/ui/Field";
import { MacroBar } from "@/components/ui/MacroBar";
import { Skeleton } from "@/components/ui/States";

type PlanoComAtleta = PlanoAlimentar & { atleta?: { id: string; nome: string } | null };

const icone = (n: string) =>
  n === "danger" ? AlertTriangle : n === "warning" ? ShieldAlert : n === "info" ? Info : CheckCircle2;
const cor = (n: string) =>
  n === "danger" ? "var(--color-danger)" : n === "warning" ? "var(--color-warning)" : "var(--color-info)";

export function AnaliseAlertas() {
  const clubeId = getClubeAtivo();
  const [planos, setPlanos] = useState<PlanoComAtleta[]>([]);
  const [planoId, setPlanoId] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [resultado, setResultado] = useState<{ total: ResumoMacros; sodio: number; alertas: Alerta[] } | null>(null);

  useEffect(() => {
    planosService.listarComAtleta(clubeId).then(setPlanos).catch(() => {});
  }, [clubeId]);

  async function analisar() {
    if (!planoId) return toast.error("Selecione um plano");
    setAnalisando(true);
    setResultado(null);
    try {
      const plano = planos.find((p) => p.id === planoId);
      let pesoKg: number | null = null;
      if (plano?.atleta_id) {
        const at = await atletasService.getById(plano.atleta_id);
        pesoKg = at?.peso_atual ?? null;
      }
      setResultado(await iaService.analisarPlano(planoId, pesoKg));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setAnalisando(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto]">
          <FormField label="Plano alimentar">
            <Select value={planoId} onChange={(e) => setPlanoId(e.target.value)}>
              <option value="">Selecione...</option>
              {planos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.atleta?.nome ? `— ${p.atleta.nome}` : ""}
                </option>
              ))}
            </Select>
          </FormField>
          <Button onClick={analisar} disabled={analisando || !planoId}>
            <ShieldAlert className="h-4 w-4" /> {analisando ? "Analisando..." : "Analisar"}
          </Button>
        </div>
      </div>

      {analisando && <Skeleton className="h-40 w-full" />}

      {resultado && (
        <>
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">Totais do plano</h3>
            <MacroBar macros={resultado.total} />
            <p className="mt-2 text-xs text-[var(--color-muted)]">Sódio estimado: {Math.round(resultado.sodio)} mg</p>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">Alertas</h3>
            <div className="space-y-2">
              {resultado.alertas.map((a, i) => {
                const Icone = icone(a.nivel);
                return (
                  <div key={i} className="flex gap-3 rounded-[10px] bg-[var(--color-bg)] p-3">
                    <Icone className="mt-0.5 h-5 w-5 shrink-0" style={{ color: cor(a.nivel) }} />
                    <div>
                      <div className="text-sm font-medium">{a.titulo}</div>
                      <div className="text-xs text-[var(--color-muted)]">{a.detalhe}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
