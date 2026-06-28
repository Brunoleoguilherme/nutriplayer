"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Droplets, Plus } from "lucide-react";
import toast from "react-hot-toast";
import type { HidratacaoRegistro } from "@/types";
import { hidratacaoService } from "@/services/hidratacao";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton } from "@/components/ui/States";

const META_ML = 3000;
const ATALHOS = [200, 250, 500];

export default function AtletaAgua() {
  const { id } = useParams<{ id: string }>();
  const [registros, setRegistros] = useState<HidratacaoRegistro[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setRegistros(await hidratacaoService.registrosDoDia(id));
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const total = registros.reduce((acc, r) => acc + r.quantidade_ml, 0);
  const pct = Math.min(100, Math.round((total / META_ML) * 100));

  async function adicionar(ml: number) {
    setSalvando(true);
    try {
      await hidratacaoService.registrar(id, getClubeAtivo(), ml);
      toast.success(`+${ml} ml`);
      carregar();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex-1 px-5 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Droplets className="h-5 w-5 text-[var(--color-info)]" /> Hidratação
      </h1>

      {loading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <>
          <div className="card mb-5 flex flex-col items-center p-6">
            <div className="relative flex h-40 w-40 items-center justify-center">
              <svg className="h-40 w-40 -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-surface-2)" strokeWidth="12" />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="var(--color-info)"
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 52}
                  strokeDashoffset={2 * Math.PI * 52 * (1 - pct / 100)}
                  style={{ transition: "stroke-dashoffset .4s" }}
                />
              </svg>
              <div className="absolute text-center">
                <div className="text-3xl font-bold">{pct}%</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {total} / {META_ML} ml
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-3 gap-3">
            {ATALHOS.map((ml) => (
              <button
                key={ml}
                onClick={() => adicionar(ml)}
                disabled={salvando}
                className="card flex flex-col items-center gap-1 py-4 transition-colors hover:bg-[var(--color-surface-2)] disabled:opacity-50"
              >
                <Plus className="h-4 w-4 text-[var(--color-info)]" />
                <span className="text-sm font-semibold">{ml} ml</span>
              </button>
            ))}
          </div>

          <h2 className="mb-2 text-sm font-semibold text-[var(--color-muted)]">Hoje</h2>
          {registros.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              Nenhum registro ainda. Toque em um atalho acima.
            </p>
          ) : (
            <div className="space-y-2">
              {registros.map((r) => (
                <div key={r.id} className="flex items-center justify-between rounded-[10px] bg-[var(--color-surface)] px-4 py-2 text-sm">
                  <span className="flex items-center gap-2">
                    <Droplets className="h-4 w-4 text-[var(--color-info)]" /> {r.quantidade_ml} ml
                  </span>
                  <span className="text-xs text-[var(--color-muted)]">
                    {new Date(r.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
