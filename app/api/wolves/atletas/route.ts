import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getTeam, type Team } from "@/lib/teams";

/**
 * Lista os atletas AO VIVO do time selecionado, filtrando para apenas os que
 * tiveram >= 1 PRESENÇA nos últimos 2 meses. Indica quais já têm
 * acompanhamento no NutriPlayer (nutri_id). Service role.
 *
 * Multi-time: o time é resolvido pelo registro (lib/teams). Cada time pode
 * apontar para um Supabase próprio (env vars) — hoje todos usam o padrão.
 */
export const dynamic = "force-dynamic";

/** Resolve a URL/chave do Supabase do time (com fallback para o padrão). */
function resolveCreds(team: Team) {
  const url =
    (team.source.urlEnv && process.env[team.source.urlEnv]) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    (team.source.serviceKeyEnv && process.env[team.source.serviceKeyEnv]) ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { url, key };
}

function adminClient(team: Team, schema: string) {
  const { url, key } = resolveCreds(team);
  return createServerClient(url, key, {
    db: { schema },
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

export async function GET(req: Request) {
  try {
    const teamId = new URL(req.url).searchParams.get("team");
    const team = getTeam(teamId);
    const teamSchema = team.source.schema ?? "public";

    const pub = adminClient(team, teamSchema);

    // Atletas do time
    const { data: wolves, error } = await pub.from("atletas").select("*");
    if (error) throw error;

    // --- Presença nos últimos 2 meses ---
    const corte = new Date();
    corte.setMonth(corte.getMonth() - 2);
    const corteStr = corte.toISOString().slice(0, 10);

    const { data: treinos, error: et } = await pub
      .from("treinos")
      .select("id")
      .gte("data_treino", corteStr);
    if (et) throw et;
    const treinoIds = (treinos ?? []).map((t) => t.id);

    const comPresenca = new Set<string>();
    if (treinoIds.length > 0) {
      const { data: presencas, error: ep } = await pub
        .from("treino_presencas")
        .select("atleta_id")
        .eq("status", "Presente")
        .in("treino_id", treinoIds);
      if (ep) throw ep;
      for (const p of presencas ?? []) {
        if (p.atleta_id) comPresenca.add(p.atleta_id as string);
      }
    }

    // Mapa de quem já tem perfil no NutriPlayer (best-effort).
    // O acompanhamento vive sempre no Supabase do NutriPlayer (envs padrão),
    // independente de qual time forneceu o atleta, e é segmentado por team_id.
    const nutriPorWolves = new Map<string, string>();
    try {
      const nutriDb = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { db: { schema: "nutriplay" }, cookies: { getAll: () => [], setAll: () => {} } },
      );
      const { data: nutri } = await nutriDb
        .from("atletas")
        .select("id, wolves_id, team_id")
        .eq("team_id", team.id)
        .not("wolves_id", "is", null)
        .is("deleted_at", null);
      for (const n of nutri ?? []) {
        if (n.wolves_id) nutriPorWolves.set(n.wolves_id as string, n.id as string);
      }
    } catch {
      /* schema nutriplay ainda não exposto */
    }

    const atletas = (wolves ?? [])
      .filter((a) => a.nome_completo)
      .filter((a) => comPresenca.has(a.id as string))
      .map((a) => ({
        wolves_id: a.id as string,
        nome: a.nome_completo as string,
        posicao: a.posicao ?? null,
        categoria: a.categoria ?? null,
        status: a.status ?? "Ativo",
        foto_url: a.foto_url ?? null,
        data_nascimento: a.data_nascimento ?? null,
        nutri_id: nutriPorWolves.get(a.id as string) ?? null,
      }))
      .sort((x, y) => x.nome.localeCompare(y.nome));

    return NextResponse.json({
      ok: true,
      team: { id: team.id, nome: team.nome },
      atletas,
      total: atletas.length,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erro" },
      { status: 500 },
    );
  }
}
