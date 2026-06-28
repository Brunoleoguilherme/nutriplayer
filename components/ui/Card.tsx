import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/** Card padrão do sistema (surface #151B29, borda 16px, sombra suave). */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("card p-5", className)} {...props} />;
}
