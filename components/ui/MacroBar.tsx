import type { ResumoMacros } from "@/types";
import { distribuicaoCalorica } from "@/utils/macros";
import { fmtGramas, fmtKcal } from "@/utils/format";

/** Resumo visual de macros (kcal + barra proteína/carbo/gordura). */
export function MacroBar({ macros }: { macros: ResumoMacros }) {
  const dist = distribuicaoCalorica(macros);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{fmtKcal(macros.calorias)}</span>
        <span className="text-[var(--color-muted)]">
          P {fmtGramas(macros.proteinas)} · C {fmtGramas(macros.carboidratos)} ·
          G {fmtGramas(macros.gorduras)}
        </span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          style={{ width: `${dist.proteinas}%` }}
          className="bg-[var(--color-protein)]"
          title={`Proteínas ${dist.proteinas}%`}
        />
        <div
          style={{ width: `${dist.carboidratos}%` }}
          className="bg-[var(--color-carb)]"
          title={`Carboidratos ${dist.carboidratos}%`}
        />
        <div
          style={{ width: `${dist.gorduras}%` }}
          className="bg-[var(--color-fat)]"
          title={`Gorduras ${dist.gorduras}%`}
        />
      </div>
    </div>
  );
}
