import {
  LayoutDashboard,
  Users,
  Apple,
  Utensils,
  ClipboardList,
  Activity,
  ShieldPlus,
  CalendarDays,
  Sparkles,
  Truck,
  Store,
  ShoppingBag,
  Watch,
  Brain,
  Plug,
  Shield,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Itens de navegação do painel (compartilhado entre Sidebar e MobileNav). */
export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/times", label: "Times / Projetos", icon: Shield },
  { href: "/atletas", label: "Atletas", icon: Users },
  { href: "/alimentos", label: "Banco Alimentar", icon: Apple },
  { href: "/refeicoes", label: "Refeições", icon: Utensils },
  { href: "/planos", label: "Planos", icon: ClipboardList },
  { href: "/protocolos", label: "Protocolos", icon: ShieldPlus },
  { href: "/game-day", label: "Game Day", icon: CalendarDays },
  { href: "/avaliacoes", label: "Avaliações", icon: Activity },
  { href: "/wearables", label: "Wearables", icon: Watch },
  { href: "/predicoes", label: "Predições", icon: Brain },
  { href: "/ia", label: "IA Nutricional", icon: Sparkles },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/compras", label: "Compras", icon: ShoppingBag },
  { href: "/integracao", label: "Integração", icon: Plug },
];
