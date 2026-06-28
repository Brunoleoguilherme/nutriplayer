import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

const variants: Record<Variant, string> = {
  primary: "brand-gradient text-white shadow-[var(--shadow-card)] hover:opacity-90",
  secondary:
    "bg-[var(--color-surface)] text-[var(--color-brand-dark)] border border-[var(--color-brand)] hover:bg-[var(--color-surface-2)]",
  ghost:
    "bg-transparent text-[var(--color-fg)] border border-[var(--color-border)] hover:bg-[var(--color-surface-2)]",
  danger: "bg-[var(--color-danger)] text-white hover:opacity-90",
};

/** Botão padrão (Design System: radius 18, microinteração ~200ms). */
export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
