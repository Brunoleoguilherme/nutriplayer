"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Dumbbell } from "lucide-react";
import type { Atleta } from "@/types";
import { atletasService } from "@/services/atletas";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton } from "@/components/ui/States";
import { Logo } from "@/components/ui/Logo";

export default function SelecionarAtletaPage() {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    atletasService
      .list({ clubeId: getClubeAtivo(), orderBy: "nome", ascending: true })
      .then(setAtletas)
      .catch(() => setAtletas([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex-1 px-5 py-10">
      <div className="mb-8">
        <Logo size="md" showTagline />
        <div className="mt-1 pl-11 text-xs text-[var(--color-muted)]">
          Athlete · selecione seu perfil
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : atletas.length === 0 ? (
        <div className="card flex flex-col items-center gap-2 py-12 text-center">
          <Dumbbell className="h-8 w-8 text-[var(--color-muted)]" />
          <p className="text-sm text-[var(--color-muted)]">
            Nenhum atleta cadastrado ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {atletas.map((a) => (
            <Link
              key={a.id}
              href={`/atleta/${a.id}`}
              className="card flex items-center gap-3 p-4 transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-full font-semibold text-white">
                {a.nome.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{a.nome}</div>
                <div className="text-xs text-[var(--color-muted)]">
                  {a.posicao || "Atleta"}
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-[var(--color-muted)]" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
