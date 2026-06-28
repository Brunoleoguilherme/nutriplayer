"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { WearableMetrica } from "@/types";
import { wearablesService } from "@/services/wearables";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input } from "@/components/ui/Field";

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

export function MetricaForm({
  atletaId,
  onSaved,
  onCancel,
}: {
  atletaId: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    data: new Date().toISOString().slice(0, 10),
    passos: "",
    calorias: "",
    fc_repouso: "",
    hrv_ms: "",
    sono_min: "",
    sono_score: "",
    prontidao: "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload: Partial<WearableMetrica> = {
        atleta_id: atletaId,
        clube_id: getClubeAtivo(),
        data: form.data,
        origem: "manual",
        passos: num(form.passos),
        calorias: num(form.calorias),
        fc_repouso: num(form.fc_repouso),
        hrv_ms: num(form.hrv_ms),
        sono_min: num(form.sono_min),
        sono_score: num(form.sono_score),
        prontidao: num(form.prontidao),
      };
      await wearablesService.registrarMetrica(payload);
      toast.success("Métrica registrada");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Data *" className="sm:col-span-2">
          <Input type="date" value={form.data} onChange={set("data")} />
        </FormField>
        <FormField label="Passos">
          <Input type="number" value={form.passos} onChange={set("passos")} />
        </FormField>
        <FormField label="Calorias">
          <Input type="number" value={form.calorias} onChange={set("calorias")} />
        </FormField>
        <FormField label="FC repouso (bpm)">
          <Input type="number" value={form.fc_repouso} onChange={set("fc_repouso")} />
        </FormField>
        <FormField label="HRV (ms)">
          <Input type="number" value={form.hrv_ms} onChange={set("hrv_ms")} />
        </FormField>
        <FormField label="Sono (min)">
          <Input type="number" value={form.sono_min} onChange={set("sono_min")} />
        </FormField>
        <FormField label="Score de sono (0-100)">
          <Input type="number" value={form.sono_score} onChange={set("sono_score")} />
        </FormField>
        <FormField label="Prontidão (0-100)" className="sm:col-span-2">
          <Input type="number" value={form.prontidao} onChange={set("prontidao")} />
        </FormField>
      </div>
      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Registrar métrica"}
        </Button>
      </div>
    </form>
  );
}
