import Link from "next/link";
import { Apple, Dumbbell, ClipboardList, Users, Utensils, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";

const modulosFase1 = [
  { nome: "Banco Alimentar", icon: Apple, desc: "Alimentos TACO/TBCA/USDA, busca e importação CSV." },
  { nome: "Meal Builder", icon: Utensils, desc: "Refeições reutilizáveis com macros automáticos." },
  { nome: "Atletas", icon: Users, desc: "Cadastro completo: básico, esportivo, médico, nutricional." },
  { nome: "Planos Alimentares", icon: ClipboardList, desc: "Planos por atleta com refeições e suplementos." },
  { nome: "Avaliações", icon: Dumbbell, desc: "Antropometria, dobras, circunferências e evolução." },
];

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-16">
      <span className="text-sm font-medium text-[var(--color-muted)]">
        BH Wolves Manager · Módulo
      </span>
      <div className="mt-3">
        <Logo size="lg" showTagline />
      </div>
      <p className="mt-4 max-w-2xl text-lg text-[var(--color-muted)]">
        Plataforma completa de nutrição esportiva para clubes, nutricionistas e
        atletas que buscam performance, saúde e evolução constante.
      </p>

      <Link href="/dashboard" className="mt-6 inline-block">
        <Button>
          Entrar no sistema <ArrowRight className="h-4 w-4" />
        </Button>
      </Link>

      <h2 className="mt-12 text-xl font-semibold">FASE 1 — MVP</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulosFase1.map(({ nome, icon: Icon, desc }) => (
          <div key={nome} className="card p-5">
            <div className="brand-gradient mb-4 inline-flex h-11 w-11 items-center justify-center rounded-[12px]">
              <Icon className="h-5 w-5 text-white" />
            </div>
            <h3 className="font-semibold">{nome}</h3>
            <p className="mt-1 text-sm text-[var(--color-muted)]">{desc}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
