import { cn } from "@/lib/cn";

/**
 * Logo oficial do NutryPlayer (fiel à marca):
 *   • Badge "N" com gradiente laranja → verde (ícone + folha).
 *   • Wordmark "Nutry" (marinho) + "Player" (laranja).
 *   • Tagline "SPORTS NUTRITION".
 */
export function Logo({
  showBadge = true,
  showTagline = false,
  size = "md",
  className,
}: {
  showBadge?: boolean;
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const word =
    size === "lg" ? "text-3xl" : size === "sm" ? "text-base" : "text-lg";
  const badge =
    size === "lg" ? "h-12 w-12" : size === "sm" ? "h-8 w-8" : "h-10 w-10";
  const tag =
    size === "lg" ? "text-[11px]" : "text-[9px]";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      {showBadge && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src="/logo-icon.svg" alt="NutryPlayer" className={cn("shrink-0", badge)} />
      )}
      <span className="leading-tight">
        <span className={cn("font-extrabold tracking-tight", word)}>
          <span style={{ color: "var(--color-navy)" }}>Nutry</span>
          <span style={{ color: "var(--color-accent)" }}>Player</span>
        </span>
        {showTagline && (
          <span className={cn("block font-semibold uppercase tracking-[0.28em] text-[var(--color-muted)]", tag)}>
            Sports Nutrition
          </span>
        )}
      </span>
    </span>
  );
}
