import type {
  InputHTMLAttributes,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
} from "react";
import { cn } from "@/lib/cn";

const baseField =
  "w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-fg)] outline-none transition-colors placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20";

export function Label({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-medium text-[var(--color-muted)]"
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p className="mt-1 text-xs text-[var(--color-danger)]">{children}</p>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(baseField, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea className={cn(baseField, "min-h-20", className)} {...props} />
  );
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(baseField, className)} {...props}>
      {children}
    </select>
  );
}

/** Agrupa label + campo + erro. */
export function FormField({
  label,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      <FieldError>{error}</FieldError>
    </div>
  );
}
