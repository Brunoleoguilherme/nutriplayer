import { createAdminClient } from "@/lib/supabase/server";
import { checarApiKey, jsonCors, preflight } from "@/lib/integracao";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/integracao/resumo?clube_id=...&key=...
 * Resumo do clube para exibição no BH Wolves Manager.
 */
export async function GET(request: Request) {
  const auth = checarApiKey(request);
  if (!auth.ok) return jsonCors({ error: auth.erro }, 401);

  const clubeId = new URL(request.url).searchParams.get("clube_id");
  if (!clubeId) return jsonCors({ error: "clube_id é obrigatório" }, 400);

  try {
    const supabase = createAdminClient();
    const hoje = new Date().toISOString().slice(0, 10);

    const [clube, atletas, planos, avaliacoes, gameday] = await Promise.all([
      supabase.from("clubes").select("id, nome").eq("id", clubeId).maybeSingle(),
      supabase
        .from("atletas")
        .select("id", { count: "exact", head: true })
        .eq("clube_id", clubeId)
        .is("deleted_at", null)
        .eq("ativo", true),
      supabase
        .from("planos_alimentares")
        .select("id", { count: "exact", head: true })
        .eq("clube_id", clubeId)
        .eq("status", "Ativo")
        .is("deleted_at", null),
      supabase
        .from("avaliacoes_corporais")
        .select("id", { count: "exact", head: true })
        .eq("clube_id", clubeId)
        .is("deleted_at", null),
      supabase
        .from("game_days")
        .select("titulo, data_evento")
        .eq("clube_id", clubeId)
        .is("deleted_at", null)
        .gte("data_evento", hoje)
        .order("data_evento", { ascending: true })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!clube.data) return jsonCors({ error: "Clube não encontrado" }, 404);

    return jsonCors({
      produto: "NutryPlayer",
      clube: clube.data,
      kpis: {
        atletas: atletas.count ?? 0,
        planos_ativos: planos.count ?? 0,
        avaliacoes: avaliacoes.count ?? 0,
      },
      proximo_game_day: gameday.data
        ? { titulo: gameday.data.titulo, data: gameday.data.data_evento }
        : null,
      atualizado_em: new Date().toISOString(),
    });
  } catch (e) {
    return jsonCors({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
}
