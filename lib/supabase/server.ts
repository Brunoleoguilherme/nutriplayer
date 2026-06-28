import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Gerencia a sessão via cookies (App Router).
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "nutriplay" },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component — ignorável quando há middleware
            // de refresh de sessão. Ver lib/supabase/middleware.ts (futuro).
          }
        },
      },
    },
  );
}

/**
 * Cliente administrativo (service role) — SOMENTE no servidor.
 * Ignora RLS. Use com cautela (importações em lote, jobs, etc.).
 */
export function createAdminClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "nutriplay" }, cookies: { getAll: () => [], setAll: () => {} } },
  );
}
