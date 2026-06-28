import { Pencil, Trash2 } from "lucide-react";
import type { Alimento } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { MacroBar } from "@/components/ui/MacroBar";

export function AlimentoCard({
  alimento,
  onEdit,
  onDelete,
}: {
  alimento: Alimento;
  onEdit: (a: Alimento) => void;
  onDelete: (a: Alimento) => void;
}) {
  return (
    <div className="card group p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold leading-tight">{alimento.nome}</div>
          <div className="text-xs text-[var(--color-muted)]">
            {alimento.categoria || "Sem categoria"} ·{" "}
            {alimento.porcao_padrao_g}g
            {alimento.medida_caseira ? ` · ${alimento.medida_caseira}` : ""}
          </div>
        </div>
        <Badge tone="info">{alimento.fonte}</Badge>
      </div>

      <MacroBar
        macros={{
          calorias: alimento.calorias,
          proteinas: alimento.proteinas,
          carboidratos: alimento.carboidratos,
          gorduras: alimento.gorduras,
          fibras: alimento.fibras,
        }}
      />

      <div className="mt-4 flex justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          onClick={() => onEdit(alimento)}
          className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
          aria-label="Editar"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => onDelete(alimento)}
          className="rounded-md p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
          aria-label="Excluir"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
