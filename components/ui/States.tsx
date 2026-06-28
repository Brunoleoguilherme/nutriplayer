import type { ReactNode } from "react";
import { Inbox, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

/** Estado vazio padrão (Manual: todo CRUD tem Empty State). */
export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-muted)]">
        {icon ?? <Inbox className="h-7 w-7" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[var(--color-muted)]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Estado de erro padrão. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="card flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-danger)]/15 text-[var(--color-danger)]">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h3 className="text-lg font-semibold">Algo deu errado</h3>
      <p className="max-w-sm text-sm text-[var(--color-muted)]">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 rounded-[10px] border border-[var(--color-border)] px-4 py-2 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}

/** Skeleton de carregamento (Manual: todo carregamento tem Skeleton). */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-[var(--color-surface-2)]",
        className,
      )}
    />
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5">
          <Skeleton className="mb-4 h-11 w-11 rounded-[12px]" />
          <Skeleton className="mb-2 h-4 w-2/3" />
          <Skeleton className="h-3 w-full" />
        </div>
      ))}
    </div>
  );
}
