"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CalendarDays, Plus, Trash2, Save } from "lucide-react";
import toast from "react-hot-toast";
import type { Refeicao, Suplemento } from "@/types";
import { refeicoesService } from "@/services/refeicoes";
import { suplementosService } from "@/services/suplementos";
import { gameDayService, type ItemGameDayInput } from "@/services/gameday";
import { getClubeAtivo } from "@/lib/club";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Select, FormField } from "@/components/ui/Field";

const TIPOS = ["Refeição", "Hidratação", "Suplemento", "Recovery", "Outro"];

interface ItemLocal {
  uid: string;
  horario: string;
  titulo: string;
  tipo: string;
  refeicao_id: string;
  suplemento_id: string;
  responsavel: string;
}

function novoItem(): ItemLocal {
  return {
    uid: Math.random().toString(36).slice(2),
    horario: "",
    titulo: "",
    tipo: "Refeição",
    refeicao_id: "",
    suplemento_id: "",
    responsavel: "",
  };
}

export default function NovoGameDayPage() {
  const clubeId = getClubeAtivo();
  const router = useRouter();
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [suplementos, setSuplementos] = useState<Suplemento[]>([]);
  const [evento, setEvento] = useState({
    titulo: "",
    data_evento: new Date().toISOString().slice(0, 10),
    horario_evento: "",
    adversario: "",
    local_evento: "",
    objetivo: "",
  });
  const [itens, setItens] = useState<ItemLocal[]>([novoItem()]);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    refeicoesService.list({ clubeId, orderBy: "nome", ascending: true }).then(setRefeicoes).catch(() => {});
    suplementosService.list({ clubeId, orderBy: "nome", ascending: true }).then(setSuplementos).catch(() => {});
  }, [clubeId]);

  const setEv = (k: keyof typeof evento) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setEvento((v) => ({ ...v, [k]: e.target.value }));

  function setItem(uid: string, campo: keyof ItemLocal, valor: string) {
    setItens((prev) => prev.map((it) => (it.uid === uid ? { ...it, [campo]: valor } : it)));
  }

  async function salvar() {
    if (evento.titulo.trim().length < 2) return toast.error("Informe o título do evento");
    setSalvando(true);
    try {
      const payload: ItemGameDayInput[] = itens
        .filter((it) => it.titulo.trim() || it.refeicao_id || it.suplemento_id)
        .map((it, i) => ({
          horario: it.horario || null,
          titulo:
            it.titulo ||
            refeicoes.find((r) => r.id === it.refeicao_id)?.nome ||
            suplementos.find((s) => s.id === it.suplemento_id)?.nome ||
            "Item",
          tipo: it.tipo,
          refeicao_id: it.refeicao_id || null,
          suplemento_id: it.suplemento_id || null,
          responsavel: it.responsavel || null,
          ordem: i,
        }));
      await gameDayService.criarComItens(
        { ...evento, horario_evento: evento.horario_evento || null, clube_id: clubeId },
        payload,
      );
      toast.success("Game Day criado");
      router.push("/game-day");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Novo Game Day"
        subtitle="Cronograma nutricional do evento: horários, refeições, hidratação e recovery."
        icon={<CalendarDays className="h-6 w-6" />}
      />

      <div className="flex flex-col gap-4">
        <div className="card p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Título *" className="sm:col-span-2">
              <Input value={evento.titulo} onChange={setEv("titulo")} placeholder="Ex.: Wolves x Spartans — Rodada 5" />
            </FormField>
            <FormField label="Data">
              <Input type="date" value={evento.data_evento} onChange={setEv("data_evento")} />
            </FormField>
            <FormField label="Horário do jogo">
              <Input type="time" value={evento.horario_evento} onChange={setEv("horario_evento")} />
            </FormField>
            <FormField label="Adversário">
              <Input value={evento.adversario} onChange={setEv("adversario")} />
            </FormField>
            <FormField label="Local">
              <Input value={evento.local_evento} onChange={setEv("local_evento")} />
            </FormField>
            <FormField label="Objetivo" className="sm:col-span-2">
              <Input value={evento.objetivo} onChange={setEv("objetivo")} />
            </FormField>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--color-brand-purple)]">Cronograma</h3>
            <Button type="button" variant="ghost" onClick={() => setItens((p) => [...p, novoItem()])}>
              <Plus className="h-4 w-4" /> Item
            </Button>
          </div>

          <div className="space-y-3">
            {itens.map((it) => (
              <div key={it.uid} className="rounded-[10px] bg-[var(--color-bg)] p-3">
                <div className="grid gap-2 sm:grid-cols-[90px_1fr_140px_40px] sm:items-center">
                  <Input type="time" value={it.horario} onChange={(e) => setItem(it.uid, "horario", e.target.value)} />
                  <Input
                    value={it.titulo}
                    onChange={(e) => setItem(it.uid, "titulo", e.target.value)}
                    placeholder="Descrição (ex.: Refeição pré-jogo)"
                  />
                  <Select value={it.tipo} onChange={(e) => setItem(it.uid, "tipo", e.target.value)}>
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </Select>
                  <button
                    onClick={() => setItens((p) => p.filter((x) => x.uid !== it.uid))}
                    className="flex justify-center rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  <Select value={it.refeicao_id} onChange={(e) => setItem(it.uid, "refeicao_id", e.target.value)}>
                    <option value="">— refeição (opcional) —</option>
                    {refeicoes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nome}
                      </option>
                    ))}
                  </Select>
                  <Select value={it.suplemento_id} onChange={(e) => setItem(it.uid, "suplemento_id", e.target.value)}>
                    <option value="">— suplemento (opcional) —</option>
                    {suplementos.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </Select>
                  <Input
                    value={it.responsavel}
                    onChange={(e) => setItem(it.uid, "responsavel", e.target.value)}
                    placeholder="Responsável"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={salvar} disabled={salvando}>
            <Save className="h-4 w-4" /> {salvando ? "Salvando..." : "Salvar Game Day"}
          </Button>
        </div>
      </div>
    </div>
  );
}
