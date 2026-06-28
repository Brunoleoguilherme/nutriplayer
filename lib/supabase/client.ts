import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para componentes do lado do navegador ("use client").
 * Usa apenas chaves públicas (NEXT_PUBLIC_*).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Tabelas do NutriPlay ficam no schema "nutriplay" (isolado do BH Wolves).
    { db: { schema: "nutriplay" } },
  );
}
