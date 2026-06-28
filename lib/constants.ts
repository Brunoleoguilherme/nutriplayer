import type { FonteAlimento, Papel, PlanoClube } from "@/types";

export const PAPEIS: { value: Papel; label: string }[] = [
  { value: "administrador", label: "Administrador" },
  { value: "nutricionista", label: "Nutricionista" },
  { value: "coach", label: "Coach" },
  { value: "preparador", label: "Preparador Físico" },
  { value: "medico", label: "Médico" },
  { value: "diretor", label: "Diretor" },
  { value: "atleta", label: "Atleta" },
];

export const FONTES_ALIMENTO: FonteAlimento[] = [
  "TACO",
  "TBCA",
  "TUCUNDUVA",
  "USDA",
  "IBGE",
  "Própria",
  "CSV",
];

export const PLANOS_CLUBE: { value: PlanoClube; label: string; limite: string }[] = [
  { value: "Starter", label: "Starter", limite: "Até 30 atletas" },
  { value: "Club", label: "Club", limite: "Até 200 atletas" },
  { value: "Elite", label: "Elite", limite: "Ilimitado" },
  { value: "Federacao", label: "Federação", limite: "Multi-clubes" },
  { value: "Enterprise", label: "Enterprise", limite: "Customizado" },
];

/** Módulos da plataforma (Manual: MÓDULOS). */
export const MODULOS = [
  "Dashboard",
  "Banco Alimentar",
  "Refeições",
  "Protocolos",
  "Suplementação",
  "Planos Alimentares",
  "Avaliações",
  "Questionários",
  "Game Day",
  "IA Nutricional",
  "Relatórios",
] as const;
