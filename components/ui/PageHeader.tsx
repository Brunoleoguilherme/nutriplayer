"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  back?: boolean;
}

/** Cabeçalho/Hero padrão de cada tela, com botão Voltar. */
export function PageHeader({ title, subtitle, icon, actions, back = true }: PageHeaderProps) {
  const router = useRouter();
  return (
    <div className="mb-8">
      {back && (
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--color-muted)] transition-colors hover:text-[var(--color-fg)]"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar
        </button>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {icon && (
            <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-[14px] text-white">
              {icon}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {subtitle && (
              <p className="mt-1 text-sm text-[var(--color-muted)]">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
