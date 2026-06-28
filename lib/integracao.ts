/**
 * Helpers da camada de INTEGRAÇÃO (BH Wolves Manager ↔ NutriPlay).
 * O NutriPlay expõe dados de leitura; o BH Wolves consome via API (chave)
 * ou embute o widget (token). Nada de escrita por aqui.
 */
import { NextResponse } from "next/server";

const ALLOW_ORIGIN = process.env.INTEGRACAO_ORIGIN ?? "*";

export function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOW_ORIGIN,
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "x-api-key, content-type",
    "Cache-Control": "no-store",
  };
}

/** Resposta JSON já com cabeçalhos CORS. */
export function jsonCors(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders() });
}

/** Pré-flight CORS. */
export function preflight() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

/**
 * Valida a API key da integração (header x-api-key ou ?key=).
 * Se NUTRIPLAY_API_KEY não estiver configurada, a API fica desabilitada.
 */
export function checarApiKey(request: Request): { ok: boolean; erro?: string } {
  const esperada = process.env.NUTRIPLAY_API_KEY;
  if (!esperada)
    return { ok: false, erro: "Integração desabilitada: defina NUTRIPLAY_API_KEY." };

  const url = new URL(request.url);
  const fornecida = request.headers.get("x-api-key") ?? url.searchParams.get("key");
  if (fornecida !== esperada) return { ok: false, erro: "API key inválida." };
  return { ok: true };
}

/** Valida o token do widget embutível (?token=). */
export function checarEmbedToken(token: string | undefined | null): boolean {
  const esperado = process.env.NUTRIPLAY_EMBED_TOKEN;
  if (!esperado) return false;
  return token === esperado;
}
