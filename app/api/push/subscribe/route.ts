import { NextResponse } from "next/server";

/**
 * Recebe a push subscription do atleta.
 *
 * TODO (backend completo de push):
 *   1. Criar tabela `push_subscriptions` (atleta_id, endpoint, keys jsonb).
 *   2. Persistir a subscription aqui (usar createAdminClient de lib/supabase/server).
 *   3. Disparar notificações de um serviço servidor com `web-push` + VAPID privada
 *      (ex.: scheduled task: lembrete de hidratação às 10h/15h).
 *
 * Por enquanto, apenas valida o payload e responde OK.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body?.subscription?.endpoint) {
      return NextResponse.json({ error: "subscription inválida" }, { status: 400 });
    }
    // Persistência pendente — ver TODO acima.
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }
}
