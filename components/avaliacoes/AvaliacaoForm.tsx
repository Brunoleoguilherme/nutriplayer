"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { AvaliacaoCorporal } from "@/types";
import { avaliacoesService } from "@/services/avaliacoes";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";

const num = (v: string) => {
  const n = parseFloat(v);
  return Number.isNaN(n) ? null : n;
};

export function AvaliacaoForm({
  atletaId,
  onSaved,
  onCancel,
}: {
  atletaId: string;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    data_avaliacao: new Date().toISOString().slice(0, 10),
    peso: "",
    altura_cm: "",
    percentual_gordura: "",
    massa_magra: "",
    massa_gorda: "",
    observacoes: "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload: Partial<AvaliacaoCorporal> = {
        clube_id: getClubeAtivo(),
        atleta_id: atletaId,
        data_avaliacao: form.data_avaliacao,
        peso: num(form.peso),
        altura_cm: num(form.altura_cm),
        percentual_gordura: num(form.percentual_gordura),
        massa_magra: num(form.massa_magra),
        massa_gorda: num(form.massa_gorda),
        observacoes: form.observacoes || null,
      };
      await avaliacoesService.create(payload);
      toast.success("Avaliação registrada");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Data *">
          <Input type="date" value={form.data_avaliacao} onChange={set("data_avaliacao")} />
        </FormField>
        <FormField label="Peso (kg)">
          <Input type="number" step="0.1" value={form.peso} onChange={set("peso")} />
        </FormField>
        <FormField label="Altura (cm)">
          <Input type="number" step="0.1" value={form.altura_cm} onChange={set("altura_cm")} />
        </FormField>
        <FormField label="% Gordura">
          <Input type="number" step="0.1" value={form.percentual_gordura} onChange={set("percentual_gordura")} />
        </FormField>
        <FormField label="Massa magra (kg)">
          <Input type="number" step="0.1" value={form.massa_magra} onChange={set("massa_magra")} />
        </FormField>
        <FormField label="Massa gorda (kg)">
          <Input type="number" step="0.1" value={form.massa_gorda} onChange={set("massa_gorda")} />
        </FormField>
      </div>
      <FormField label="Observações">
        <Textarea value={form.observacoes} onChange={set("observacoes")} />
      </FormField>
      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Registrar avaliação"}
        </Button>
      </div>
    </form>
  );
}
