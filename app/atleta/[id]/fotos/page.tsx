"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Camera, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { FotoAtleta, TipoFoto } from "@/types";
import { fotosService } from "@/services/fotos";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton, EmptyState } from "@/components/ui/States";
import { Select } from "@/components/ui/Field";
import { fmtData } from "@/utils/format";

const TIPOS: TipoFoto[] = ["Frente", "Lado", "Costas", "Outro"];

export default function AtletaFotos() {
  const { id } = useParams<{ id: string }>();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<FotoAtleta[]>([]);
  const [tipo, setTipo] = useState<TipoFoto>("Frente");
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setFotos(await fotosService.listar(id));
    } catch {
      /* bucket pode não existir ainda */
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setEnviando(true);
    try {
      await fotosService.upload(file, id, getClubeAtivo(), tipo);
      toast.success("Foto enviada");
      carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro no upload");
    } finally {
      setEnviando(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remover(foto: FotoAtleta) {
    if (!confirm("Remover esta foto?")) return;
    try {
      await fotosService.remover(foto);
      toast.success("Foto removida");
      carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro");
    }
  }

  return (
    <div className="flex-1 px-5 py-8">
      <h1 className="mb-6 flex items-center gap-2 text-xl font-bold">
        <Camera className="h-5 w-5 text-[var(--color-brand-purple)]" /> Evolução
      </h1>

      <div className="card mb-6 flex items-center gap-2 p-4">
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFoto)} className="flex-1">
          {TIPOS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className="brand-gradient inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          <Plus className="h-4 w-4" /> {enviando ? "Enviando..." : "Foto"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={onFile}
          className="hidden"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full" />
          ))}
        </div>
      ) : fotos.length === 0 ? (
        <EmptyState
          title="Sem fotos ainda"
          description="Registre fotos de frente, lado e costas para acompanhar a evolução."
          icon={<Camera className="h-7 w-7" />}
        />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {fotos.map((f) => (
            <div key={f.id} className="card group relative overflow-hidden p-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt={f.tipo} className="aspect-square w-full object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 text-xs text-white">
                <span>
                  {f.tipo} · {fmtData(f.data)}
                </span>
                <button onClick={() => remover(f)} aria-label="Remover">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
