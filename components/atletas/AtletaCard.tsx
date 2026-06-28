import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import type { Atleta } from "@/types";
import { Badge } from "@/components/ui/Badge";
import { idade } from "@/utils/format";

const statusTone = (s: string) =>
  s === "Ativo" ? "success" : s === "Atenção" ? "warning" : "neutral";

export function AtletaCard({
  atleta,
  onEdit,
  onDelete,
}: {
  atleta: Atleta;
  onEdit: (a: Atleta) => void;
  onDelete: (a: Atleta) => void;
}) {
  const anos = idade(atleta.data_nascimento);
  return (
    <div className="card group p-5 transition-transform hover:-translate-y-0.5">
      <div className="flex items-start justify-between">
        <Link href={`/atletas/${atleta.id}`} className="flex items-center gap-3">
          <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white">
            {atleta.nome.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold leading-tight hover:underline">
              {atleta.nome}
            </div>
            <div className="text-xs text-[var(--color-muted)]">
              {[atleta.posicao, anos ? `${anos} anos` : null]
                .filter(Boolean)
                .join(" · ") || "—"}
            </div>
          </div>
        </Link>
        <Badge tone={statusTone(atleta.status)}>{atleta.status}</Badge>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-muted)]">
        <span>{atleta.objetivo || "Sem objetivo definido"}</span>
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => onEdit(atleta)}
            className="rounded-md p-1.5 hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
            aria-label="Editar"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(atleta)}
            className="rounded-md p-1.5 hover:bg-[var(--color-danger)]/15 hover:text-[var(--color-danger)]"
            aria-label="Excluir"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
