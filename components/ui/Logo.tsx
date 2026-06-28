import { cn } from "@/lib/cn";

/**
 * Logo oficial NutriPlayer.
 * Usa /logo.svg (imagem completa: badge + wordmark + tagline).
 * Variante "icon" usa apenas /logo-icon.svg (badge N isolado).
 */
export function Logo({
  variant = "full",
  size = "md",
  className,
}: {
  /** "full" = badge + wordmark | "icon" = só o badge N */
  variant?: "full" | "icon";
  /** @deprecated use variant="full" e size */
  showBadge?: boolean;
  /** @deprecated */
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (variant === "icon") {
    const dim = size === "lg" ? 48 : size === "sm" ? 28 : 36;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo-icon.svg"
        alt="NutriPlayer"
        width={dim}
        height={dim}
        className={cn("shrink-0", className)}
      />
    );
  }

  // Altura da imagem full em cada tamanho
  const h = size === "lg" ? "h-20" : size === "sm" ? "h-10" : "h-14";

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="NutriPlayer — Sports Nutrition Intelligence"
      className={cn(h, "w-auto object-contain", className)}
    />
  );
}
