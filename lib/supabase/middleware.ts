import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh de sessão + portão de acesso.
 * Tudo é protegido, EXCETO as rotas públicas abaixo. Sem sessão → /login.
 */
const PUBLIC_PREFIXES = ["/login", "/embed", "/imprimir"];

function isPublic(path: string): boolean {
  if (path.startsWith("/api/integracao")) return true; // consumido por token (BH Wolves)
  return PUBLIC_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));
}

export async function updateSession(request: NextRequest) {
  let res = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          res = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Sem sessão e rota protegida → manda pro login (guardando o destino)
  if (!user && !isPublic(path)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", path);
    return NextResponse.redirect(url);
  }

  // Já logado tentando ver /login → vai pro dashboard
  if (user && path === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}
