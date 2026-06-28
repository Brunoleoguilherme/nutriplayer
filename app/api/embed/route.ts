/**
 * GET /api/embed?access_token=...&refresh_token=...
 *
 * Recebe tokens do BH Wolves, valida com Supabase, seta os cookies de sessão
 * (visíveis pelo middleware SSR) e redireciona para /dashboard.
 *
 * Esta rota já está em PUBLIC_PREFIXES via /api/integracao? Não — mas o
 * middleware só bloqueia rotas sem sessão. Como estamos SETANDO a sessão aqui
 * via cookies na resposta, o redirect para /dashboard já terá os cookies.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const accessToken = searchParams.get("access_token");
  const refreshToken = searchParams.get("refresh_token");

  if (!accessToken || !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("[embed/route] setSession error:", error.message);
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Sessão setada nos cookies — middleware vai reconhecer na próxima request
  const response = NextResponse.redirect(new URL("/dashboard", request.url));

  // Copia os cookies setados pelo supabase para a resposta do redirect
  cookieStore.getAll().forEach(({ name, value }) => {
    response.cookies.set(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // necessário para iframe cross-origin
      path: "/",
    });
  });

  return response;
}
