/**
 * GET /api/embed/atleta
 *
 * Chamado pelo iframe após o login embed do atleta.
 * Busca o atleta no NutriPlayer pelo email do usuário autenticado
 * e redireciona para /atleta/[id]. Se não achar, vai para /atleta (seleção).
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "nutriplay" },
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    },
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Busca atleta pelo email (campo email na tabela atletas)
  const { data: atleta } = await supabase
    .from("atletas")
    .select("id")
    .eq("email", user.email)
    .maybeSingle();

  if (atleta?.id) {
    return NextResponse.redirect(new URL(`/atleta/${atleta.id}`, request.url));
  }

  // Fallback: lista de seleção de atletas
  return NextResponse.redirect(new URL("/atleta", request.url));
}
