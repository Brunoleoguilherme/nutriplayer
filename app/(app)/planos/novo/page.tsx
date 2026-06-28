"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ClipboardList, Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Atleta, Refeicao } from "@/types";
import { atletasService } from "@/services/atletas";
import { refeicoesService } from "@/services/refeicoes";
import { planosService, type ItemPlanoInput } from "@/services/planos";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select, FormField } from "@/components/ui/Field";

interface ItemLocal {
  refeicao: Refeicao;
  horario: string;
  periodo: string;
}

export default function NovoPlanoPage() {
  return (
    <Suspense fallback={null}>
      <NovoPlanoConteudo />
    </Suspense>
  );
}

function NovoPlanoConteudo() {
  const clubeId = getClubeAtivo();
  const router = useRouter();
  const atletaParam = useSearchParams().get("atleta") ?? "";

  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [atletaId, setAtletaId] = useState(atletaParam);
  const [nome, setNome] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [status, setStatus] = useState("Ativo");
  const [refeicaoSel, setRefeicaoSel] = useState("");
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    atletasService
      .list({ clubeId, orderBy: "nome", ascending: true })
      .then(setAtletas)
      .catch(() => {});
    refeicoesService
      .list({ clubeId, orderBy: "nome", ascending: true })
      .then(setRefeicoes)
      .catch(() => {});
  }, [clubeId]);

  const disponiveis = useMemo(
    () => refeicoes.filter((r) => !itens.some((it) => it.refeicao.id === r.id)),
    [refeicoes, itens],
  );

  function adicionar() {
    const r = refeicoes.find((x) => x.id === refeicaoSel);
    if (!r) return;
    setItens((prev) => [...prev, { refeicao: r, horario: "", periodo: r.categoria ?? "" }]);
    setRefeicaoSel("");
  }
  function atualizar(id: string, campo: "horario" | "periodo", valor: string) {
    setItens((prev) =>
      prev.map((it) => (it.refeicao.id === id ? { ...it, [campo]: valor } : it)),
    );
  }
  function remover(id: string) {
    setItens((prev) => prev.filter((it) => it.refeicao.id !== id));
  }

  async function salvar() {
    if (nome.trim().length < 2) return toast.error("Dê um nome ao plano");
    setSalvando(true);
    try {
      const refs: ItemPlanoInput[] = itens.map((it, i) => ({
        refeicao_id: it.refeicao.id,
        horario: it.horario || null,
        periodo: it.periodo || null,
        ordem: i,
      }));
      await planosService.criarComRefeicoes(
        {
          nome,
          objetivo: objetivo || null,
          status: status as PlanoStatusLiteral,
          atleta_id: atletaId || null,
          clube_id: clubeId,
        },
        refs,
      );
      toast.success("Plano criado");
      router.push("/planos");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Novo plano alimentar"
        subtitle="Monte o plano com refeições reutilizáveis, horários e períodos."
        icon={<ClipboardList className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Atleta">
              <Select value={atletaId} onChange={(e) => setAtletaId(e.target.value)}>
                <option value="">— Modelo (sem atleta) —</option>
                {atletas.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </Select>
            </FormField>
            <FormField label="Status">
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Rascunho">Rascunho</option>
                <option value="Ativo">Ativo</option>
                <option value="Encerrado">Encerrado</option>
              </Select>
            </FormField>
            <FormField label="Nome do plano *">
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Hipertrofia - Pré-temporada" />
            </FormField>
            <FormField label="Objetivo">
              <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} />
            </FormField>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">
            Refeições do plano
          </h3>
          <div className="mb-4 flex gap-2">
            <Select value={refeicaoSel} onChange={(e) => setRefeicaoSel(e.target.value)} className="flex-1">
              <option value="">Selecione uma refeição...</option>
              {disponiveis.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </Select>
            <Button type="button" variant="ghost" onClick={adicionar} disabled={!refeicaoSel}>
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
            <Link
              href="/refeicoes/nova"
              className="flex items-center gap-1.5 rounded-[var(--radius-button)] border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-[var(--color-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] whitespace-nowrap"
            >
              <Plus className="h-4 w-4" /> Criar refeição
            </Link>
          </div>

          {itens.length === 0 ? (
            <p className="py-8 text-center text-sm text-[var(--color-muted)]">
              Nenhuma refeição adicionada.{" "}
              {refeicoes.length === 0 && (
                <>Crie refeições primeiro no{" "}
                  <Link href="/refeicoes/nova" className="font-semibold text-[var(--color-accent)] hover:underline">
                    Meal Builder
                  </Link>.
                </>
              )}
            </p>
          ) : (
            <div className="space-y-2">
              {itens.map((it) => (
                <div
                  key={it.refeicao.id}
                  className="flex flex-wrap items-center gap-3 rounded-[10px] bg-[var(--color-bg)] px-3 py-2"
                >
                  <span className="min-w-40 flex-1 text-sm font-medium">{it.refeicao.nome}</span>
                  <Input
                    type="time"
                    value={it.horario}
                    onChange={(e) => atualizar(it.refeicao.id, "horario", e.target.value)}
                    className="w-32"
                  />
                  <Input
                    value={it.periodo}
                    onChange={(e) => atualizar(it.refeicao.id, "periodo", e.target.value)}
                    placeholder="Período"
                    className="w-40"
                  />
                  <button
                    onClick={() => remover(it.refeicao.id)}
                    className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar plano"}
          </Button>
        </div>
      </div>
    </div>
  );
}

type PlanoStatusLiteral = "Rascunho" | "Ativo" | "Encerrado";
