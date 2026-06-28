"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Activity, ClipboardList, Smartphone, Plus } from "lucide-react";
import type { Atleta } from "@/types";
import { atletasService } from "@/services/atletas";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton, ErrorState } from "@/components/ui/States";
import { fmtData, idade } from "@/utils/format";

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="flex justify-between gap-4 border-b border-[var(--color-border)] py-2 text-sm last:border-0">
      <span className="text-[var(--color-muted)]">{label}</span>
      <span className="text-right font-medium">{value || "—"}</span>
    </div>
  );
}

function Bloco({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default function AtletaDetalhePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [atleta, setAtleta] = useState<Atleta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    atletasService
      .getById(id)
      .then((a) => {
        setAtleta(a);
        if (!a) setError("Atleta não encontrado");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (error || !atleta) {
    return <ErrorState message={error ?? "Atleta não encontrado"} onRetry={() => router.refresh()} />;
  }

  const anos = idade(atleta.data_nascimento);
  // Altura: Wolves pode guardar em metros (1.75) ou cm (175)
  const alturaCm =
    atleta.altura_cm != null
      ? atleta.altura_cm < 3
        ? Math.round(atleta.altura_cm * 100)
        : Math.round(atleta.altura_cm)
      : null;

  return (
    <div>
      <Link
        href="/atletas"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)]"
      >
        <ArrowLeft className="h-4 w-4" /> Atletas
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {atleta.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={atleta.foto_url}
              alt={atleta.nome}
              className="h-24 w-24 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="brand-gradient flex h-24 w-24 shrink-0 items-center justify-center rounded-full text-xl font-bold text-white">
              {atleta.nome.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{atleta.nome}</h1>
            <p className="text-sm text-[var(--color-muted)]">
              {[atleta.posicao, anos ? `${anos} anos` : null, atleta.objetivo]
                .filter(Boolean)
                .join(" · ") || "—"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href={`/planos/novo?atleta=${atleta.id}`}>
            <Button>
              <Plus className="h-4 w-4" /> Criar plano alimentar
            </Button>
          </Link>
          <Badge tone={atleta.status === "Ativo" ? "success" : "warning"}>
            {atleta.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Bloco title="Dados pessoais">
          <InfoRow label="E-mail" value={atleta.email} />
          <InfoRow label="Telefone" value={atleta.telefone} />
          <InfoRow label="Nascimento" value={fmtData(atleta.data_nascimento)} />
          <InfoRow label="Sexo" value={atleta.sexo} />
          <InfoRow label="Documento" value={atleta.documento} />
        </Bloco>

        <Bloco title="Esportivo">
          <InfoRow label="Posição" value={atleta.posicao} />
          <InfoRow label="Número" value={atleta.numero} />
          <InfoRow label="Dominância" value={atleta.dominancia} />
        </Bloco>

        <Bloco title="Nutricional">
          <InfoRow label="Peso atual" value={atleta.peso_atual != null ? `${atleta.peso_atual} kg` : null} />
          <InfoRow label="Altura" value={alturaCm ? `${alturaCm} cm` : null} />
          <InfoRow label="Objetivo" value={atleta.objetivo} />
          <InfoRow label="Meta calórica" value={atleta.meta_calorica ? `${atleta.meta_calorica} kcal` : null} />
          <InfoRow label="Intolerâncias" value={atleta.intolerancias} />
        </Bloco>

        <Bloco title="Médico">
          <InfoRow label="Alergias" value={atleta.alergias} />
          <InfoRow label="Lesões" value={atleta.lesoes} />
          <InfoRow label="Restrições" value={atleta.restricoes} />
          <InfoRow label="Medicamentos" value={atleta.medicamentos} />
        </Bloco>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/avaliacoes?atleta=${atleta.id}`} className="card flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]">
          <Activity className="h-5 w-5 text-[var(--color-brand-blue)]" />
          <span className="text-sm font-medium">Ver avaliações</span>
        </Link>
        <Link href={`/planos?atleta=${atleta.id}`} className="card flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]">
          <ClipboardList className="h-5 w-5 text-[var(--color-brand-green)]" />
          <span className="text-sm font-medium">Ver planos</span>
        </Link>
        <Link href={`/atleta/${atleta.id}`} target="_blank" className="card flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[var(--color-surface-2)]">
          <Smartphone className="h-5 w-5 text-[var(--color-brand-purple)]" />
          <span className="text-sm font-medium">Ver app do atleta</span>
        </Link>
      </div>
    </div>
  );
}
