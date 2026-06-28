"use client";

import { useEffect, useMemo, useState } from "react";
import { Calculator, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Atleta } from "@/types";
import { atletasService } from "@/services/atletas";
import { getClubeAtivo } from "@/lib/club";
import {
  calcularNecessidades,
  FATORES,
  OBJETIVOS,
  type FatorAtividade,
  type Objetivo,
} from "@/utils/nutricao";
import { idade } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Select, FormField, Input } from "@/components/ui/Field";

export function Calculadora() {
  const clubeId = getClubeAtivo();
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [atletaId, setAtletaId] = useState("");
  const [peso, setPeso] = useState(0);
  const [altura, setAltura] = useState(0);
  const [anos, setAnos] = useState(0);
  const [sexo, setSexo] = useState("Masculino");
  const [fator, setFator] = useState<FatorAtividade>("intenso");
  const [objetivo, setObjetivo] = useState<Objetivo>("manter");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    atletasService.list({ clubeId, orderBy: "nome", ascending: true }).then(setAtletas).catch(() => {});
  }, [clubeId]);

  function selecionar(id: string) {
    setAtletaId(id);
    const a = atletas.find((x) => x.id === id);
    if (a) {
      setPeso(a.peso_atual ?? 0);
      setAltura(a.altura_cm ?? 0);
      setAnos(idade(a.data_nascimento) ?? 0);
      if (a.sexo) setSexo(a.sexo);
    }
  }

  const res = useMemo(() => {
    if (!peso || !altura || !anos) return null;
    return calcularNecessidades({ pesoKg: peso, alturaCm: altura, idadeAnos: anos, sexo, fator, objetivo });
  }, [peso, altura, anos, sexo, fator, objetivo]);

  async function salvarMeta() {
    if (!atletaId || !res) return toast.error("Selecione um atleta e preencha os dados");
    setSalvando(true);
    try {
      await atletasService.update(atletaId, { meta_calorica: res.meta });
      toast.success("Meta calórica salva no atleta");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="card p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-purple)]">
          <Calculator className="h-4 w-4" /> Dados
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Atleta (opcional)" className="sm:col-span-2">
            <Select value={atletaId} onChange={(e) => selecionar(e.target.value)}>
              <option value="">Preencher manualmente</option>
              {atletas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Peso (kg)">
            <Input type="number" value={peso || ""} onChange={(e) => setPeso(parseFloat(e.target.value) || 0)} />
          </FormField>
          <FormField label="Altura (cm)">
            <Input type="number" value={altura || ""} onChange={(e) => setAltura(parseFloat(e.target.value) || 0)} />
          </FormField>
          <FormField label="Idade">
            <Input type="number" value={anos || ""} onChange={(e) => setAnos(parseInt(e.target.value) || 0)} />
          </FormField>
          <FormField label="Sexo">
            <Select value={sexo} onChange={(e) => setSexo(e.target.value)}>
              <option value="Masculino">Masculino</option>
              <option value="Feminino">Feminino</option>
            </Select>
          </FormField>
          <FormField label="Atividade">
            <Select value={fator} onChange={(e) => setFator(e.target.value as FatorAtividade)}>
              {Object.entries(FATORES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Objetivo">
            <Select value={objetivo} onChange={(e) => setObjetivo(e.target.value as Objetivo)}>
              {Object.entries(OBJETIVOS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>
      </div>

      <div className="card flex flex-col p-5">
        <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">Necessidades estimadas</h3>
        {!res ? (
          <p className="flex flex-1 items-center justify-center text-center text-sm text-[var(--color-muted)]">
            Preencha peso, altura e idade para calcular.
          </p>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="mb-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-[10px] bg-[var(--color-bg)] p-3">
                <div className="text-xs text-[var(--color-muted)]">TMB</div>
                <div className="text-lg font-bold">{res.tmb}</div>
              </div>
              <div className="rounded-[10px] bg-[var(--color-bg)] p-3">
                <div className="text-xs text-[var(--color-muted)]">Gasto total</div>
                <div className="text-lg font-bold">{res.get}</div>
              </div>
              <div className="brand-gradient rounded-[10px] p-3 text-white">
                <div className="text-xs opacity-90">Meta</div>
                <div className="text-lg font-bold">{res.meta}</div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="font-bold text-[var(--color-protein)]">{res.proteinas_g} g</div>
                <div className="text-xs text-[var(--color-muted)]">Proteínas</div>
              </div>
              <div>
                <div className="font-bold text-[var(--color-carb)]">{res.carboidratos_g} g</div>
                <div className="text-xs text-[var(--color-muted)]">Carboidratos</div>
              </div>
              <div>
                <div className="font-bold text-[var(--color-fat)]">{res.gorduras_g} g</div>
                <div className="text-xs text-[var(--color-muted)]">Gorduras</div>
              </div>
            </div>
            <div className="mt-auto pt-4">
              <Button onClick={salvarMeta} disabled={!atletaId || salvando} className="w-full">
                <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar meta no atleta"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
