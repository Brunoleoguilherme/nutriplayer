"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Users,
  Apple,
  Utensils,
  ClipboardList,
  Activity,
  Plus,
  ArrowRight,
} from "lucide-react";
import type { Alimento, Refeicao, PlanoAlimentar } from "@/types";
import { atletasService } from "@/services/atletas";
import { alimentosService } from "@/services/alimentos";
import { refeicoesService } from "@/services/refeicoes";
import { planosService } from "@/services/planos";
import { getClubeAtivo } from "@/lib/club";
import { Skeleton } from "@/components/ui/States";

interface WolvesAtleta {
  wolves_id: string;
  nome: string;
  posicao: string | null;
  foto_url: string | null;
  nutri_id: string | null;
}

const MACRO_COLORS = { carb: "#ff8a1e", prot: "#16e28a", fat: "#2563eb" };
const DIST_PALETTE = ["#ff8a1e", "#16e28a", "#2563eb", "#7c3aed", "#f59e0b", "#ef4444", "#0ea5e9"];

const statCards = [
  { key: "atletas", label: "Atletas", icon: Users, href: "/atletas", tint: "#ff8a1e", hint: "Acompanhados" },
  { key: "alimentos", label: "Alimentos", icon: Apple, href: "/alimentos", tint: "#16e28a", hint: "No banco" },
  { key: "refeicoes", label: "Refeições", icon: Utensils, href: "/refeicoes", tint: "#2563eb", hint: "Reutilizáveis" },
  { key: "planos", label: "Planos", icon: ClipboardList, href: "/planos", tint: "#7c3aed", hint: "Criados" },
] as const;

const atalhos = [
  { label: "Cadastrar atleta", href: "/atletas", icon: Users },
  { label: "Novo alimento", href: "/alimentos", icon: Apple },
  { label: "Montar refeição", href: "/refeicoes/nova", icon: Utensils },
  { label: "Novo plano", href: "/planos/novo", icon: ClipboardList },
  { label: "Registrar avaliação", href: "/avaliacoes", icon: Activity },
];

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}
const dataHoje = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
}).format(new Date());

export default function DashboardPage() {
  const clubeId = getClubeAtivo();
  const [alimentos, setAlimentos] = useState<Alimento[] | null>(null);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [atletas, setAtletas] = useState<WolvesAtleta[]>([]);

  useEffect(() => {
    alimentosService.listarClubeEGlobais(clubeId).then(setAlimentos).catch(() => setAlimentos([]));
    refeicoesService.list({ clubeId }).then(setRefeicoes).catch(() => {});
    planosService.list({ clubeId }).then(setPlanos).catch(() => {});
    fetch("/api/wolves/atletas", { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => j.ok && setAtletas(j.atletas))
      .catch(() => {});
  }, [clubeId]);

  const kpis = alimentos
    ? { atletas: atletas.length, alimentos: alimentos.length, refeicoes: refeicoes.length, planos: planos.length }
    : null;

  // Macros: distribuição calórica média do banco de alimentos
  const macros = useMemo(() => {
    const al = alimentos ?? [];
    let p = 0, c = 0, f = 0;
    for (const a of al) {
      p += (a.proteinas ?? 0) * 4;
      c += (a.carboidratos ?? 0) * 4;
      f += (a.gorduras ?? 0) * 9;
    }
    const total = p + c + f;
    if (!total) return null;
    const pct = (v: number) => Math.round((v / total) * 100);
    return [
      { name: "Carboidrato", value: pct(c), color: MACRO_COLORS.carb },
      { name: "Proteína", value: pct(p), color: MACRO_COLORS.prot },
      { name: "Gordura", value: pct(f), color: MACRO_COLORS.fat },
    ];
  }, [alimentos]);

  // Distribuição de refeições por categoria
  const distRefeicoes = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of refeicoes) {
      const k = r.categoria?.trim() || "Sem categoria";
      map.set(k, (map.get(k) ?? 0) + 1);
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], i) => ({ name, value, color: DIST_PALETTE[i % DIST_PALETTE.length] }));
  }, [refeicoes]);

  return (
    <>
      {/* Saudação */}
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            {saudacao()}, Bruno! <span className="align-middle">👋</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Aqui está o panorama nutricional da sua equipe.
          </p>
        </div>
        <span className="card px-4 py-2 text-sm font-medium capitalize text-[var(--color-muted)]">
          {dataHoje}
        </span>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, href, tint, hint }) => (
          <Link key={key} href={href} className="card card-hover group p-5">
            <div className="flex items-center justify-between">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-[14px]"
                style={{ backgroundColor: `${tint}1f`, color: tint }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <ArrowRight className="h-4 w-4 text-[var(--color-muted)] opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <div className="mt-4 text-3xl font-bold">
              {kpis ? kpis[key] : <Skeleton className="h-8 w-12" />}
            </div>
            <div className="text-sm font-medium">{label}</div>
            <div className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</div>
          </Link>
        ))}
      </div>

      {/* Gráficos */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <DonutCard
          title="Adequação de Macronutrientes"
          subtitle="Distribuição calórica média do banco de alimentos"
          data={macros}
          centerTop={macros ? "100%" : "—"}
          centerBottom="Banco"
          empty="Cadastre alimentos para ver a distribuição de macros."
          showPercent
        />
        <DonutCard
          title="Distribuição de Refeições"
          subtitle="Por categoria"
          data={distRefeicoes.length ? distRefeicoes : null}
          centerTop={String(refeicoes.length)}
          centerBottom="Total"
          empty="Crie refeições no Meal Builder para ver a distribuição."
        />
      </div>

      {/* Atletas em destaque */}
      <div className="card mt-4 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Atletas em destaque</h3>
          <Link href="/atletas" className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {atletas.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            Carregando atletas do BH Wolves…
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {atletas.slice(0, 5).map((a) => (
              <Link
                key={a.wolves_id}
                href={a.nutri_id ? `/atletas/${a.nutri_id}` : "/atletas"}
                className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-center transition-colors hover:bg-[var(--color-surface-2)]"
              >
                {a.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.foto_url} alt={a.nome} className="mx-auto h-16 w-16 rounded-full object-cover" />
                ) : (
                  <div className="accent-gradient mx-auto flex h-16 w-16 items-center justify-center rounded-full text-lg font-bold text-white">
                    {a.nome.charAt(0)}
                  </div>
                )}
                <div className="mt-2 truncate text-sm font-semibold">{a.nome.split(" ")[0]}</div>
                <div className="truncate text-xs text-[var(--color-muted)]">{a.posicao || "Atleta"}</div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Atalhos */}
      <h2 className="mb-4 mt-10 text-lg font-semibold">Atalhos rápidos</h2>
      <div className="flex flex-wrap gap-3">
        {atalhos.map(({ label, href, icon: Icon }) => (
          <Link key={label} href={href} className="card card-hover flex items-center gap-3 px-5 py-4">
            <Icon className="h-5 w-5 text-[var(--color-accent)]" />
            <span className="text-sm font-medium">{label}</span>
            <Plus className="h-4 w-4 text-[var(--color-muted)]" />
          </Link>
        ))}
      </div>
    </>
  );
}

function DonutCard({
  title,
  subtitle,
  data,
  centerTop,
  centerBottom,
  empty,
  showPercent,
}: {
  title: string;
  subtitle: string;
  data: { name: string; value: number; color: string }[] | null;
  centerTop: string;
  centerBottom: string;
  empty: string;
  showPercent?: boolean;
}) {
  return (
    <div className="card p-5">
      <div className="mb-1 text-base font-semibold">{title}</div>
      <div className="mb-4 text-xs text-[var(--color-muted)]">{subtitle}</div>
      {!data ? (
        <p className="py-12 text-center text-sm text-[var(--color-muted)]">{empty}</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="relative h-44 w-44 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v, n) => [showPercent ? `${v}%` : `${v}`, String(n)]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--color-border)",
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{centerTop}</span>
              <span className="text-xs text-[var(--color-muted)]">{centerBottom}</span>
            </div>
          </div>
          <ul className="flex-1 space-y-2">
            {data.map((d) => (
              <li key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  {d.name}
                </span>
                <span className="font-semibold">{showPercent ? `${d.value}%` : d.value}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
