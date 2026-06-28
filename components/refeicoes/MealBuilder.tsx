"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Alimento } from "@/types";
import { useAlimentos } from "@/hooks/useAlimentos";
import { refeicoesService, type ItemRefeicaoInput } from "@/services/refeicoes";
import { getClubeAtivo } from "@/lib/club";
import { macrosDoItem, macrosDaRefeicao } from "@/utils/macros";
import { fmtKcal, fmtGramas } from "@/utils/format";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { MacroBar } from "@/components/ui/MacroBar";
import { Skeleton } from "@/components/ui/States";

interface ItemLocal {
  alimento: Alimento;
  quantidade_g: number;
}

export function MealBuilder() {
  const clubeId = getClubeAtivo();
  const router = useRouter();
  const { alimentos, loading } = useAlimentos(clubeId);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [busca, setBusca] = useState("");
  const [itens, setItens] = useState<ItemLocal[]>([]);
  const [salvando, setSalvando] = useState(false);

  const filtrados = useMemo(() => {
    const t = busca.trim().toLowerCase();
    return alimentos
      .filter((a) => !t || a.nome.toLowerCase().includes(t))
      .slice(0, 40);
  }, [alimentos, busca]);

  const totalMacros = useMemo(
    () =>
      macrosDaRefeicao(
        itens.map((it, i) => ({
          id: String(i),
          refeicao_id: "",
          alimento_id: it.alimento.id,
          quantidade_g: it.quantidade_g,
          medida_caseira: null,
          ordem: i,
          observacao: null,
          created_at: "",
          updated_at: "",
          alimento: it.alimento,
        })),
      ),
    [itens],
  );

  function adicionar(a: Alimento) {
    if (itens.some((it) => it.alimento.id === a.id)) {
      toast("Alimento já adicionado");
      return;
    }
    setItens((prev) => [...prev, { alimento: a, quantidade_g: a.porcao_padrao_g || 100 }]);
  }
  function atualizarQtd(id: string, q: number) {
    setItens((prev) =>
      prev.map((it) => (it.alimento.id === id ? { ...it, quantidade_g: q } : it)),
    );
  }
  function remover(id: string) {
    setItens((prev) => prev.filter((it) => it.alimento.id !== id));
  }

  async function salvar() {
    if (nome.trim().length < 2) {
      toast.error("Dê um nome à refeição");
      return;
    }
    if (itens.length === 0) {
      toast.error("Adicione ao menos um alimento");
      return;
    }
    setSalvando(true);
    try {
      const payload: ItemRefeicaoInput[] = itens.map((it, i) => ({
        alimento_id: it.alimento.id,
        quantidade_g: it.quantidade_g,
        ordem: i,
      }));
      await refeicoesService.criarComItens(
        { nome, categoria: categoria || null, objetivo: objetivo || null, clube_id: clubeId },
        payload,
      );
      toast.success("Refeição salva");
      router.push("/refeicoes");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      {/* Banco alimentar lateral */}
      <div className="card flex max-h-[70vh] flex-col p-4">
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">
          Banco Alimentar
        </h3>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar alimento..."
            className="pl-9"
          />
        </div>
        <div className="-mr-2 flex-1 space-y-1 overflow-y-auto pr-2">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))
          ) : filtrados.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              Nenhum alimento. Cadastre no Banco Alimentar.
            </p>
          ) : (
            filtrados.map((a) => (
              <button
                key={a.id}
                onClick={() => adicionar(a)}
                className="flex w-full items-center justify-between rounded-[10px] px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface-2)]"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">{a.nome}</span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {fmtKcal(a.calorias)} / {a.porcao_padrao_g}g
                  </span>
                </span>
                <Plus className="h-4 w-4 shrink-0 text-[var(--color-brand-green)]" />
              </button>
            ))
          )}
        </div>
      </div>

      {/* Composição da refeição */}
      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome da refeição *" className="sm:col-span-3" />
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Categoria (ex.: Pré-treino)" />
            <Input value={objetivo} onChange={(e) => setObjetivo(e.target.value)} placeholder="Objetivo" className="sm:col-span-2" />
          </div>
        </div>

        <div className="card p-5">
          {itens.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">
              Clique nos alimentos à esquerda para compor a refeição.
            </p>
          ) : (
            <div className="space-y-2">
              {itens.map((it) => {
                const m = macrosDoItem(it.alimento, it.quantidade_g);
                return (
                  <div
                    key={it.alimento.id}
                    className="flex items-center gap-3 rounded-[10px] bg-[var(--color-bg)] px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{it.alimento.nome}</div>
                      <div className="text-xs text-[var(--color-muted)]">
                        {fmtKcal(m.calorias)} · P {fmtGramas(m.proteinas)} · C{" "}
                        {fmtGramas(m.carboidratos)} · G {fmtGramas(m.gorduras)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        value={it.quantidade_g}
                        onChange={(e) =>
                          atualizarQtd(it.alimento.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-20 text-right"
                      />
                      <span className="text-xs text-[var(--color-muted)]">g</span>
                    </div>
                    <button
                      onClick={() => remover(it.alimento.id)}
                      className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                      aria-label="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card sticky bottom-4 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0 flex-1">
            <MacroBar macros={totalMacros} />
          </div>
          <Button onClick={salvar} disabled={salvando} className="w-full sm:w-auto">
            <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar refeição"}
          </Button>
        </div>
      </div>
    </div>
  );
}
