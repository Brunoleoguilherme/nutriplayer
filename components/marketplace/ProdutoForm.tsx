"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import type { Produto, Fornecedor } from "@/types";
import { produtosService } from "@/services/produtos";
import { fornecedoresService } from "@/services/fornecedores";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";

const UNIDADES = ["un", "kg", "g", "l", "ml", "cx", "pote", "saco"];

export function ProdutoForm({
  produto,
  onSaved,
  onCancel,
}: {
  produto?: Produto;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const clubeId = getClubeAtivo();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [form, setForm] = useState({
    nome: produto?.nome ?? "",
    fornecedor_id: produto?.fornecedor_id ?? "",
    categoria: produto?.categoria ?? "",
    marca: produto?.marca ?? "",
    unidade: produto?.unidade ?? "un",
    preco: produto?.preco ?? 0,
    descricao: produto?.descricao ?? "",
  });
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    fornecedoresService.list({ clubeId, orderBy: "nome", ascending: true }).then(setFornecedores).catch(() => {});
  }, [clubeId]);

  const set = (k: keyof typeof form, num = false) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => setForm((f) => ({ ...f, [k]: num ? parseFloat(e.target.value) || 0 : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (form.nome.trim().length < 2) return toast.error("Informe o nome");
    setSalvando(true);
    try {
      const payload: Partial<Produto> = {
        ...form,
        fornecedor_id: form.fornecedor_id || null,
        clube_id: clubeId,
      };
      if (produto) {
        await produtosService.update(produto.id, payload);
        toast.success("Produto atualizado");
      } else {
        await produtosService.create(payload);
        toast.success("Produto cadastrado");
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
          <Input value={form.nome} onChange={set("nome")} placeholder="Ex.: Whey Protein 900g" />
        </FormField>
        <FormField label="Fornecedor">
          <Select value={form.fornecedor_id} onChange={set("fornecedor_id")}>
            <option value="">—</option>
            {fornecedores.map((f) => (
              <option key={f.id} value={f.id}>
                {f.nome}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Categoria">
          <Input value={form.categoria} onChange={set("categoria")} placeholder="Proteína, Creatina..." />
        </FormField>
        <FormField label="Marca">
          <Input value={form.marca} onChange={set("marca")} />
        </FormField>
        <FormField label="Unidade">
          <Select value={form.unidade} onChange={set("unidade")}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Preço (R$)" className="sm:col-span-2">
          <Input type="number" step="0.01" value={form.preco} onChange={set("preco", true)} />
        </FormField>
      </div>
      <FormField label="Descrição">
        <Textarea value={form.descricao} onChange={set("descricao")} />
      </FormField>
      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : produto ? "Salvar" : "Cadastrar produto"}
        </Button>
      </div>
    </form>
  );
}
