import { createAdminClient } from "@/lib/supabase/server";
import { checarApiKey, jsonCors, preflight } from "@/lib/integracao";

export function OPTIONS() {
  return preflight();
}

/**
 * GET /api/integracao/atleta/{id}?key=...
 * Resumo nutricional de um atleta para o BH Wolves Manager.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = checarApiKey(request);
  if (!auth.ok) return jsonCors({ error: auth.erro }, 401);

  const { id } = await params;

  try {
    const supabase = createAdminClient();

    const [atleta, plano, avaliacao, metrica] = await Promise.all([
      supabase
        .from("atletas")
        .select("id, nome, posicao, objetivo, meta_calorica, peso_atual")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle(),
      supabase
        .from("planos_alimentares")
        .select("nome, status")
        .eq("atleta_id", id)
        .eq("status", "Ativo")
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("avaliacoes_corporais")
        .select("data_avaliacao, peso, percentual_gordura")
        .eq("atleta_id", id)
        .is("deleted_at", null)
        .order("data_avaliacao", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("wearable_metricas")
        .select("prontidao, data")
        .eq("atleta_id", id)
        .order("data", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!atleta.data) return jsonCors({ error: "Atleta não encontrado" }, 404);

    return jsonCors({
      produto: "NutryPlayer",
      atleta: atleta.data,
      plano_ativo: plano.data?.nome ?? null,
      ultima_avaliacao: avaliacao.data ?? null,
      prontidao: metrica.data?.prontidao ?? null,
      atualizado_em: new Date().toISOString(),
    });
  } catch (e) {
    return jsonCors({ error: e instanceof Error ? e.message : "Erro" }, 500);
  }
}
