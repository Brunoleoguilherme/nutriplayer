"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { Protocolo } from "@/types";
import { protocolosService } from "@/services/protocolos";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";

const CATEGORIAS = ["Recovery", "Hidratação", "Pré-jogo", "Pós-jogo", "Suplementação", "Geral"];

export function ProtocoloForm({
  protocolo,
  onSaved,
  onCancel,
}: {
  protocolo?: Protocolo;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    nome: protocolo?.nome ?? "",
    categoria: protocolo?.categoria ?? "Recovery",
    objetivo: protocolo?.objetivo ?? "",
    descricao: protocolo?.descricao ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.nome.trim().length < 2) return toast.error("Informe o nome");
    setSalvando(true);
    try {
      const payload: Partial<Protocolo> = { ...form, clube_id: getClubeAtivo() };
      if (protocolo) {
        await protocolosService.update(protocolo.id, payload);
        toast.success("Protocolo atualizado");
      } else {
        await protocolosService.create(payload);
        toast.success("Protocolo criado");
      }
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
        <FormField label="Nome *" className="sm:col-span-2">
          <Input value={form.nome} onChange={set("nome")} placeholder="Ex.: Recovery Pós-Jogo" />
        </FormField>
        <FormField label="Categoria">
          <Select value={form.categoria} onChange={set("categoria")}>
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Objetivo">
          <Input value={form.objetivo} onChange={set("objetivo")} />
        </FormField>
      </div>
      <FormField label="Descrição">
        <Textarea value={form.descricao} onChange={set("descricao")} placeholder="Detalhe o protocolo..." />
      </FormField>
      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : protocolo ? "Salvar" : "Criar protocolo"}
        </Button>
      </div>
    </form>
  );
}
