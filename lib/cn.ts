import { clsx, type ClassValue } from "clsx";

/** Concatena classes condicionalmente (padrão do projeto). */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
