"use client";

import { useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Alimento } from "@/types";
import { alimentosService } from "@/services/alimentos";
import { getClubeAtivo } from "@/lib/club";
import { FONTES_ALIMENTO } from "@/lib/constants";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Select, Label } from "@/components/ui/Field";

// Campos do destino que podem ser mapeados a partir das colunas do CSV
const CAMPOS = [
  { key: "nome", label: "Nome *", required: true },
  { key: "categoria", label: "Categoria" },
  { key: "porcao_padrao_g", label: "Porção (g)", num: true },
  { key: "calorias", label: "Calorias", num: true },
  { key: "proteinas", label: "Proteínas", num: true },
  { key: "carboidratos", label: "Carboidratos", num: true },
  { key: "gorduras", label: "Gorduras", num: true },
  { key: "fibras", label: "Fibras", num: true },
  { key: "sodio", label: "Sódio", num: true },
] as const;

type Mapeamento = Record<string, string>;

// Tenta adivinhar a coluna pelo nome (detecção automática)
function autoMap(colunas: string[]): Mapeamento {
  const m: Mapeamento = {};
  const norm = (s: string) =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  for (const campo of CAMPOS) {
    const alvo = norm(campo.key);
    const hit = colunas.find((c) => {
      const n = norm(c);
      return (
        n === alvo ||
        n.includes(alvo) ||
        (campo.key === "calorias" && (n.includes("kcal") || n.includes("energia"))) ||
        (campo.key === "porcao_padrao_g" && n.includes("porc")) ||
        (campo.key === "carboidratos" && n.startsWith("carb")) ||
        (campo.key === "proteinas" && n.startsWith("prot")) ||
        (campo.key === "gorduras" && (n.includes("lip") || n.includes("gord")))
      );
    });
    if (hit) m[campo.key] = hit;
  }
  return m;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  const n = parseFloat(String(v ?? "").replace(",", "."));
  return Number.isNaN(n) ? 0 : n;
}

export default function ImportarAlimentosPage() {
  const [colunas, setColunas] = useState<string[]>([]);
  const [linhas, setLinhas] = useState<Record<string, unknown>[]>([]);
  const [map, setMap] = useState<Mapeamento>({});
  const [fonte, setFonte] = useState("TACO");
  const [importando, setImportando] = useState(false);
  const [concluido, setConcluido] = useState<number | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const cols = res.meta.fields ?? [];
        setColunas(cols);
        setLinhas(res.data);
        setMap(autoMap(cols));
        setConcluido(null);
        toast.success(`${res.data.length} linhas lidas`);
      },
      error: () => toast.error("Não foi possível ler o CSV"),
    });
  }

  async function importar() {
    if (!map.nome) {
      toast.error("Mapeie ao menos a coluna de Nome");
      return;
    }
    setImportando(true);
    try {
      const clube_id = getClubeAtivo();
      const rows: Partial<Alimento>[] = linhas
        .map((linha) => {
          const row: Record<string, unknown> = { clube_id, fonte };
          for (const campo of CAMPOS) {
            const col = map[campo.key];
            if (!col) continue;
            const val = linha[col];
            row[campo.key] = "num" in campo && campo.num ? toNum(val) : val ?? null;
          }
          return row as Partial<Alimento>;
        })
        .filter((r) => r.nome && String(r.nome).trim() !== "");

      const n = await alimentosService.createMany(rows);
      setConcluido(n);
      toast.success(`${n} alimentos importados`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro na importação");
    } finally {
      setImportando(false);
    }
  }

  const previa = linhas.slice(0, 5);

  return (
    <div>

      <PageHeader
        title="Importar CSV"
        subtitle="Compatível com TACO, TBCA, USDA e CSV personalizado. Detecção automática de colunas."
        icon={<Upload className="h-6 w-6" />}
      />

      {concluido !== null ? (
        <div className="card flex flex-col items-center gap-3 py-16 text-center">
          <CheckCircle2 className="h-12 w-12 text-[var(--color-success)]" />
          <h3 className="text-lg font-semibold">{concluido} alimentos importados</h3>
          <Link href="/alimentos">
            <Button>Ver banco alimentar</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="card p-6">
            <Label>Arquivo CSV</Label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={onFile}
              className="block w-full text-sm text-[var(--color-muted)] file:mr-4 file:rounded-[10px] file:border-0 file:bg-[var(--color-surface-2)] file:px-4 file:py-2 file:text-sm file:text-[var(--color-fg)] hover:file:bg-[var(--color-border)]"
            />
          </div>

          {colunas.length > 0 && (
            <>
              <div className="card p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-[var(--color-brand-purple)]">
                    Mapeamento de colunas
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[var(--color-muted)]">Fonte:</span>
                    <Select
                      value={fonte}
                      onChange={(e) => setFonte(e.target.value)}
                      className="w-36"
                    >
                      {FONTES_ALIMENTO.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {CAMPOS.map((campo) => (
                    <div key={campo.key}>
                      <Label>{campo.label}</Label>
                      <Select
                        value={map[campo.key] ?? ""}
                        onChange={(e) =>
                          setMap((m) => ({ ...m, [campo.key]: e.target.value }))
                        }
                      >
                        <option value="">— ignorar —</option>
                        {colunas.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card overflow-x-auto p-6">
                <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">
                  Pré-visualização ({linhas.length} linhas)
                </h3>
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="text-xs text-[var(--color-muted)]">
                      {CAMPOS.filter((c) => map[c.key]).map((c) => (
                        <th key={c.key} className="px-3 py-2">
                          {c.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previa.map((linha, i) => (
                      <tr key={i} className="border-t border-[var(--color-border)]">
                        {CAMPOS.filter((c) => map[c.key]).map((c) => (
                          <td key={c.key} className="px-3 py-2">
                            {String(linha[map[c.key]] ?? "—")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end">
                <Button onClick={importar} disabled={importando}>
                  {importando ? "Importando..." : `Importar ${linhas.length} alimentos`}
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
