import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * Endpoint de ingestão de métricas de wearables.
 * É o ponto de entrada para sincronizações de Garmin/Polar/Apple/Google
 * (via webhooks dos provedores ou um job de sync no servidor).
 *
 * Pré-requisitos para sync REAL de cada provedor (pendente — backend):
 *   - OAuth + credenciais de parceiro (Garmin Connect, Polar AccessLink,
 *     Apple HealthKit via app nativo, Google Fit / Health Connect).
 *   - Mapear o usuário externo (external_user_id) para o atleta.
 *   - Proteger esta rota (segredo/HMAC do provedor) antes de produção.
 *
 * Payload aceito (uma métrica diária por atleta):
 * {
 *   "clube_id": "...", "atleta_id": "...", "data": "2026-06-26",
 *   "origem": "garmin", "passos": 8200, "fc_repouso": 52, "hrv_ms": 78,
 *   "sono_min": 451, "sono_score": 84, "prontidao": 76, ...
 * }
 */
const CAMPOS_NUM = [
  "passos",
  "calorias",
  "distancia_km",
  "fc_repouso",
  "fc_max",
  "hrv_ms",
  "sono_min",
  "sono_score",
  "prontidao",
] as const;

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  if (!body.atleta_id || !body.clube_id) {
    return NextResponse.json(
      { error: "atleta_id e clube_id são obrigatórios" },
      { status: 400 },
    );
  }

  const metrica: Record<string, unknown> = {
    atleta_id: body.atleta_id,
    clube_id: body.clube_id,
    data: body.data ?? new Date().toISOString().slice(0, 10),
    origem: body.origem ?? "manual",
  };
  for (const c of CAMPOS_NUM) {
    if (body[c] != null) metrica[c] = body[c];
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("wearable_metricas")
      .upsert(metrica, { onConflict: "atleta_id,data,origem" });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro ao ingerir" },
      { status: 500 },
    );
  }
}
