/** Formatações pt-BR reutilizáveis. */

export function fmtNumero(v: number | null | undefined, casas = 0): string {
  if (v == null) return "—";
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

export function fmtKcal(v: number | null | undefined): string {
  return `${fmtNumero(v, 0)} kcal`;
}

export function fmtGramas(v: number | null | undefined, casas = 1): string {
  return `${fmtNumero(v, casas)} g`;
}

export function fmtBRL(v: number | null | undefined): string {
  return (v ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function fmtData(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}

export function idade(dataNascimento: string | null | undefined): number | null {
  if (!dataNascimento) return null;
  const nasc = new Date(dataNascimento);
  const hoje = new Date();
  let i = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) i--;
  return i;
}
