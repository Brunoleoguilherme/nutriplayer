"use client";

import { useState } from "react";
import { Sparkles, Calculator, Wand2, Repeat, ShieldAlert, MessageSquare } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { cn } from "@/lib/cn";
import { Calculadora } from "@/components/ia/Calculadora";
import { GeradorPlano } from "@/components/ia/GeradorPlano";
import { Substituicoes } from "@/components/ia/Substituicoes";
import { AnaliseAlertas } from "@/components/ia/AnaliseAlertas";
import { ChatIA } from "@/components/ia/ChatIA";

const ABAS = [
  { id: "calc", label: "Necessidades", icon: Calculator },
  { id: "plano", label: "Gerar plano", icon: Wand2 },
  { id: "subs", label: "Substituições", icon: Repeat },
  { id: "alertas", label: "Alertas", icon: ShieldAlert },
  { id: "chat", label: "Chat IA", icon: MessageSquare },
] as const;

type AbaId = (typeof ABAS)[number]["id"];

export default function IAPage() {
  const [aba, setAba] = useState<AbaId>("calc");

  return (
    <>
      <PageHeader
        title="IA Nutricional"
        subtitle="Cálculo de necessidades, geração de planos, substituições, alertas e chat."
        icon={<Sparkles className="h-6 w-6" />}
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {ABAS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors",
              aba === id
                ? "brand-gradient text-white"
                : "bg-[var(--color-surface-2)] text-[var(--color-muted)] hover:text-[var(--color-fg)]",
            )}
          >
            <Icon className="h-4 w-4" /> {label}
          </button>
        ))}
      </div>

      {aba === "calc" && <Calculadora />}
      {aba === "plano" && <GeradorPlano />}
      {aba === "subs" && <Substituicoes />}
      {aba === "alertas" && <AnaliseAlertas />}
      {aba === "chat" && <ChatIA />}
    </>
  );
}
