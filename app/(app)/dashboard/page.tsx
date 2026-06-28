"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
} from "recharts";
import {
  Users, Utensils, ClipboardList, Target, Bell,
  ArrowRight, Droplets, AlertTriangle,
} from "lucide-react";
import type { Alimento, Refeicao, PlanoAlimentar } from "@/types";
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

const MACRO_COLORS = ["#FF8A1E", "#16E28A", "#2563eb"];
const DIST_PALETTE = ["#FF8A1E", "#16E28A", "#2563eb", "#7c3aed", "#f59e0b", "#ef4444"];

function saudacao() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const dataHoje = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long", day: "2-digit", month: "long",
}).format(new Date());

export default function DashboardPage() {
  const clubeId = getClubeAtivo();
  const [alimentos, setAlimentos] = useState<Alimento[] | null>(null);
  const [refeicoes, setRefeicoes] = useState<Refeicao[]>([]);
  const [planos, setPlanos] = useState<PlanoAlimentar[]>([]);
  const [atletas, setAtletas] = useState<WolvesAtleta[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([
      alimentosService.listarClubeEGlobais(clubeId).then(setAlimentos).catch(() => setAlimentos([])),
      refeicoesService.list({ clubeId }).then(setRefeicoes).catch(() => {}),
      planosService.list({ clubeId }).then(setPlanos).catch(() => {}),
      fetch("/api/wolves/atletas", { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => j.ok && setAtletas(j.atletas))
        .catch(() => {}),
    ]).finally(() => setCarregando(false));
  }, [clubeId]);

  const kpis = !carregando
    ? { atletas: atletas.length, refeicoes: refeicoes.length, planos: planos.length, alimentos: alimentos?.length ?? 0 }
    : null;

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
      { name: "Carboidrato", value: pct(c), color: MACRO_COLORS[0] },
      { name: "Proteína", value: pct(p), color: MACRO_COLORS[1] },
      { name: "Gordura", value: pct(f), color: MACRO_COLORS[2] },
    ];
  }, [alimentos]);

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

  // Refeições agrupadas por categoria para "Próximas Refeições"
  const proximasRefeicoes = useMemo(() => {
    const cores = ["#FF8A1E", "#16E28A", "#2563eb", "#7c3aed"];
    return refeicoes.slice(0, 4).map((r, i) => ({
      nome: r.nome,
      categoria: r.categoria ?? "Refeição",
      cor: cores[i % cores.length],
    }));
  }, [refeicoes]);

  const statCards = [
    { label: "ATLETAS ATIVOS", icon: Users, href: "/atletas", value: kpis?.atletas ?? null, hint: "Do BH Wolves", color: "#FF8A1E", bg: "#FF8A1E1a" },
    { label: "REFEIÇÕES", icon: Utensils, href: "/refeicoes", value: kpis?.refeicoes ?? null, hint: "Cadastradas", color: "#16E28A", bg: "#16E28A1a" },
    { label: "PLANOS ATIVOS", icon: ClipboardList, href: "/planos", value: kpis?.planos ?? null, hint: "Criados", color: "#2563eb", bg: "#2563eb1a" },
    { label: "ALIMENTOS", icon: Target, href: "/alimentos", value: kpis?.alimentos ?? null, hint: "No banco", color: "#7c3aed", bg: "#7c3aed1a" },
  ] as const;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
            {saudacao()}, Bruno! <span className="align-middle">👋</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Aqui está o panorama nutricional da sua equipe.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium capitalize text-[var(--color-muted)]">
          📅 {dataHoje}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, icon: Icon, href, value, hint, color, bg }) => (
          <Link key={label} href={href}
            className="group rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-0.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-[12px]" style={{ backgroundColor: bg, color }}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="mt-4 text-3xl font-black text-[var(--color-fg)]">
              {value !== null ? value : <Skeleton className="h-8 w-14" />}
            </div>
            <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-muted)]">{label}</div>
            <div className="mt-0.5 text-xs text-[var(--color-muted)]">{hint}</div>
          </Link>
        ))}
      </div>

      {/* Macros + Água */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Macros donut */}
        <div className="lg:col-span-2 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="text-base font-bold">Adequação de Macronutrientes</div>
          <div className="mt-0.5 mb-4 text-xs text-[var(--color-muted)]">Distribuição calórica média do banco de alimentos</div>
          {!macros ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Target className="h-8 w-8 text-[var(--color-muted)] mb-2 opacity-40" />
              <p className="text-sm text-[var(--color-muted)]">Cadastre alimentos para ver a distribuição de macros.</p>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative h-40 w-40 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={macros} dataKey="value" innerRadius={52} outerRadius={72} paddingAngle={3} stroke="none">
                      {macros.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [`${v}%`, String(n)]}
                      contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-black">100%</span>
                  <span className="text-[10px] text-[var(--color-muted)]">Banco</span>
                </div>
              </div>
              <ul className="flex-1 space-y-3">
                {macros.map((d) => (
                  <li key={d.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        {d.name}
                      </span>
                      <span className="font-bold">{d.value}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-[var(--color-border)]">
                      <div className="h-1.5 rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Consumo de água — sem dados reais ainda */}
        <div className="lg:col-span-3 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-base font-bold">Consumo de Água</div>
              <div className="mt-0.5 text-xs text-[var(--color-muted)]">Registros de hidratação da equipe</div>
            </div>
            <div className="flex items-center gap-1.5 rounded-[12px] bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-600">
              <Droplets className="h-4 w-4" /> — L
            </div>
          </div>
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Droplets className="h-8 w-8 text-blue-200 mb-2" />
            <p className="text-sm text-[var(--color-muted)]">Sem registros de hidratação ainda.</p>
            <Link href="/atleta" className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline">
              Registrar via app do atleta →
            </Link>
          </div>
        </div>
      </div>

      {/* Próximas Refeições + Alertas + Distribuição */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Próximas refeições — reais do banco */}
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-base font-bold">Refeições Cadastradas</div>
            <Link href="/refeicoes" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">Ver todas</Link>
          </div>
          {proximasRefeicoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Utensils className="h-7 w-7 text-[var(--color-muted)] mb-2 opacity-40" />
              <p className="text-sm text-[var(--color-muted)]">Nenhuma refeição cadastrada.</p>
              <Link href="/refeicoes/nova" className="mt-2 text-xs font-semibold text-[var(--color-accent)] hover:underline">
                Criar no Meal Builder →
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {proximasRefeicoes.map((r, i) => (
                <li key={i} className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px]"
                    style={{ backgroundColor: `${r.cor}1a` }}>
                    <Utensils className="h-4 w-4" style={{ color: r.cor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{r.nome}</div>
                    <div className="text-xs text-[var(--color-muted)]">{r.categoria}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Alertas nutricionais — sem dados reais ainda */}
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-base font-bold">Alertas Nutricionais</div>
            <Link href="/ia" className="text-xs font-semibold text-[var(--color-accent)] hover:underline">IA Nutricional</Link>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-7 w-7 text-amber-300 mb-2" />
            <p className="text-sm text-[var(--color-muted)]">Sem alertas ativos.</p>
            <p className="mt-1 text-xs text-[var(--color-muted)]">Alertas gerados a partir dos planos alimentares dos atletas.</p>
          </div>
        </div>

        {/* Distribuição de refeições */}
        <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <div className="mb-4 text-base font-bold">Distribuição de Refeições</div>
          {distRefeicoes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="h-7 w-7 text-[var(--color-muted)] mb-2 opacity-40 text-2xl">🍽</div>
              <p className="text-sm text-[var(--color-muted)]">Crie refeições no Meal Builder.</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className="relative h-36 w-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distRefeicoes} dataKey="value" innerRadius={46} outerRadius={66} paddingAngle={3} stroke="none">
                      {distRefeicoes.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--color-border)", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-black">{refeicoes.length}</span>
                  <span className="text-[10px] text-[var(--color-muted)]">Total</span>
                </div>
              </div>
              <ul className="w-full space-y-2">
                {distRefeicoes.slice(0, 4).map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">{d.value}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Atletas em Destaque */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-base font-bold">Atletas em Destaque</div>
          <Link href="/atletas" className="flex items-center gap-1 text-xs font-semibold text-[var(--color-accent)] hover:underline">
            Ver todos <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {atletas.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--color-muted)]">
            {carregando ? "Carregando atletas…" : "Nenhum atleta encontrado."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {atletas.slice(0, 5).map((a) => (
              <Link
                key={a.wolves_id}
                href={a.nutri_id ? `/atletas/${a.nutri_id}` : "/atletas"}
                className="group flex flex-col items-center rounded-[16px] border border-[var(--color-border)] bg-[var(--color-bg)] p-4 text-center transition-all hover:border-[var(--color-accent)]/30 hover:shadow-md"
              >
                {a.foto_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.foto_url} alt={a.nome} className="h-16 w-16 rounded-full object-cover ring-2 ring-[var(--color-border)]" />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-xl font-black text-white ring-2 ring-[var(--color-border)]"
                    style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)" }}>
                    {a.nome.charAt(0)}
                  </div>
                )}
                <div className="mt-2.5 text-sm font-bold truncate w-full">{a.nome.split(" ")[0]}</div>
                <div className="text-[11px] text-[var(--color-muted)] truncate w-full">{a.posicao || "Atleta"}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
