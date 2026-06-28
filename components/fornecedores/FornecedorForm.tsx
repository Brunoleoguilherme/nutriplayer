"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import type { Fornecedor } from "@/types";
import { fornecedoresService } from "@/services/fornecedores";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Textarea } from "@/components/ui/Field";

export function FornecedorForm({
  fornecedor,
  onSaved,
  onCancel,
}: {
  fornecedor?: Fornecedor;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const [form, setForm] = useState({
    nome: fornecedor?.nome ?? "",
    cnpj: fornecedor?.cnpj ?? "",
    contato_nome: fornecedor?.contato_nome ?? "",
    email: fornecedor?.email ?? "",
    telefone: fornecedor?.telefone ?? "",
    site: fornecedor?.site ?? "",
    observacoes: fornecedor?.observacoes ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  const set = (k: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.nome.trim().length < 2) return toast.error("Informe o nome");
    setSalvando(true);
    try {
      const payload: Partial<Fornecedor> = { ...form, clube_id: getClubeAtivo() };
      if (fornecedor) {
        await fornecedoresService.update(fornecedor.id, payload);
        toast.success("Fornecedor atualizado");
      } else {
        await fornecedoresService.create(payload);
        toast.success("Fornecedor cadastrado");
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
          <Input value={form.nome} onChange={set("nome")} placeholder="Ex.: Growth Supplements" />
        </FormField>
        <FormField label="CNPJ">
          <Input value={form.cnpj} onChange={set("cnpj")} />
        </FormField>
        <FormField label="Contato">
          <Input value={form.contato_nome} onChange={set("contato_nome")} />
        </FormField>
        <FormField label="E-mail">
          <Input type="email" value={form.email} onChange={set("email")} />
        </FormField>
        <FormField label="Telefone">
          <Input value={form.telefone} onChange={set("telefone")} />
        </FormField>
        <FormField label="Site" className="sm:col-span-2">
          <Input value={form.site} onChange={set("site")} placeholder="https://" />
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
          {salvando ? "Salvando..." : fornecedor ? "Salvar" : "Cadastrar"}
        </Button>
      </div>
    </form>
  );
}
