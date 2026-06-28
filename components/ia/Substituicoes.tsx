"use client";

import { useEffect, useMemo, useState } from "react";
import { Repeat } from "lucide-react";
import type { Alimento } from "@/types";
import { useAlimentos } from "@/hooks/useAlimentos";
import { sugerirSubstituicoes, type Substituicao } from "@/utils/nutricao";
import { getClubeAtivo } from "@/lib/club";
import { Select, FormField } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { MacroBar } from "@/components/ui/MacroBar";

export function Substituicoes() {
  const clubeId = getClubeAtivo();
  const { alimentos, loading } = useAlimentos(clubeId);
  const [alvoId, setAlvoId] = useState("");

  useEffect(() => {
    if (!alvoId && alimentos.length > 0) setAlvoId(alimentos[0].id);
  }, [alimentos, alvoId]);

  const alvo = alimentos.find((a) => a.id === alvoId);
  const subs: Substituicao[] = useMemo(
    () => (alvo ? sugerirSubstituicoes(alvo, alimentos, 6) : []),
    [alvo, alimentos],
  );

  function macrosDe(a: Alimento) {
    return {
      calorias: a.calorias,
      proteinas: a.proteinas,
      carboidratos: a.carboidratos,
      gorduras: a.gorduras,
      fibras: a.fibras,
    };
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-5">
        <FormField label="Alimento para substituir">
          <Select value={alvoId} onChange={(e) => setAlvoId(e.target.value)} disabled={loading}>
            {alimentos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </Select>
        </FormField>
        {alvo && (
          <div className="mt-4 rounded-[10px] bg-[var(--color-bg)] p-4">
            <div className="mb-2 text-sm font-medium">{alvo.nome} ({alvo.porcao_padrao_g}g)</div>
            <MacroBar macros={macrosDe(alvo)} />
          </div>
        )}
      </div>

      {alvo && (
        <div className="card p-5">
          <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-[var(--color-brand-purple)]">
            <Repeat className="h-4 w-4" /> Equivalentes sugeridos
          </h3>
          {subs.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--color-muted)]">
              Cadastre mais alimentos para gerar substituições.
            </p>
          ) : (
            <div className="space-y-3">
              {subs.map((s) => (
                <div key={s.alimento.id} className="rounded-[10px] bg-[var(--color-bg)] p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {s.alimento.nome} ({s.alimento.porcao_padrao_g}g)
                    </span>
                    <Badge tone={s.similaridade >= 75 ? "success" : s.similaridade >= 50 ? "warning" : "neutral"}>
                      {s.similaridade}% similar
                    </Badge>
                  </div>
                  <MacroBar macros={macrosDe(s.alimento)} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
