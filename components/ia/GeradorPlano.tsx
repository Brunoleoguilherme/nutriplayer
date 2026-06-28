"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Atleta } from "@/types";
import { atletasService } from "@/services/atletas";
import { iaService, type RefeicaoComMacros } from "@/services/ia";
import { planosService, type ItemPlanoInput } from "@/services/planos";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { Select, Input, FormField } from "@/components/ui/Field";
import { MacroBar } from "@/components/ui/MacroBar";
import { somarMacros } from "@/utils/macros";
import { fmtKcal } from "@/utils/format";

export function GeradorPlano() {
  const clubeId = getClubeAtivo();
  const router = useRouter();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletaId, setAtletaId] = useState("");
  const [meta, setMeta] = useState(2500);
  const [selecao, setSelecao] = useState<RefeicaoComMacros[]>([]);
  const [gerando, setGerando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    atletasService.list({ clubeId, orderBy: "nome", ascending: true }).then(setAtletas).catch(() => {});
  }, [clubeId]);

  function selecionar(id: string) {
    setAtletaId(id);
    const a = atletas.find((x) => x.id === id);
    if (a?.meta_calorica) setMeta(a.meta_calorica);
  }

  async function gerar() {
    setGerando(true);
    try {
      const { selecao } = await iaService.gerarPlanoAutomatico(clubeId, meta);
      setSelecao(selecao);
      if (selecao.length === 0)
        toast("Sem refeições no banco. Crie refeições no Meal Builder primeiro.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao gerar");
    } finally {
      setGerando(false);
    }
  }

  async function salvar() {
    if (selecao.length === 0) return toast.error("Gere uma sugestão primeiro");
    setSalvando(true);
    try {
      const refs: ItemPlanoInput[] = selecao.map((s, i) => ({
        refeicao_id: s.refeicao.id,
        periodo: s.refeicao.categoria ?? null,
        ordem: i,
      }));
      const nome = `Plano IA ${new Date().toLocaleDateString("pt-BR")}`;
      await planosService.criarComRefeicoes(
        { nome, objetivo: "Gerado por IA", status: "Rascunho", meta_calorica: meta, atleta_id: atletaId || null, clube_id: clubeId },
        refs,
      );
      toast.success("Plano salvo como rascunho");
      router.push("/planos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  const total = somarMacros(selecao.map((s) => s.macros));

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <div className="grid items-end gap-4 sm:grid-cols-[1fr_160px_auto]">
          <FormField label="Atleta (opcional)">
            <Select value={atletaId} onChange={(e) => selecionar(e.target.value)}>
              <option value="">Modelo (sem atleta)</option>
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Meta calórica (kcal)">
            <Input type="number" value={meta} onChange={(e) => setMeta(parseInt(e.target.value) || 0)} />
          </FormField>
          <Button onClick={gerar} disabled={gerando}>
            <Sparkles className="h-4 w-4" /> {gerando ? "Gerando..." : "Gerar plano"}
          </Button>
        </div>
      </div>

      {selecao.length > 0 && (
        <div className="card p-5">
          <div className="mb-4">
            <MacroBar macros={total} />
            <p className="mt-1 text-xs text-[var(--color-muted)]">
              Meta: {fmtKcal(meta)} · Sugerido: {fmtKcal(total.calorias)}
            </p>
          </div>
          <div className="space-y-2">
            {selecao.map((s) => (
              <div key={s.refeicao.id} className="flex items-center justify-between rounded-[10px] bg-[var(--color-bg)] px-3 py-2">
                <div>
                  <div className="text-sm font-medium">{s.refeicao.nome}</div>
                  {s.refeicao.categoria && (
                    <div className="text-xs text-[var(--color-muted)]">{s.refeicao.categoria}</div>
                  )}
                </div>
                <span className="text-sm text-[var(--color-muted)]">{fmtKcal(s.macros.calorias)}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={salvar} disabled={salvando}>
              <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar como plano"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
