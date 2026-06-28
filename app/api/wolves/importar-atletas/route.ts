import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEV_CLUBE_ID } from "@/lib/club";

/**
 * Importa/sincroniza os atletas do BH Wolves (public.atletas) para o NutriPlay
 * (nutriplay.atletas). Mesmo projeto Supabase → leitura direta no banco.
 * Usa service role (ignora RLS). Idempotente: upsert por wolves_id.
 */
function adminClient(schema: "public" | "nutriplay") {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema }, cookies: { getAll: () => [], setAll: () => {} } },
  );
}

export async function POST() {
  try {
    const wolves = adminClient("public");
    const nutri = adminClient("nutriplay");

    // 1) Lê os atletas do BH Wolves (select * para não quebrar se faltar coluna)
    const { data: atletasWolves, error: e1 } = await wolves
      .from("atletas")
      .select("*");
    if (e1) throw e1;
    if (!atletasWolves || atletasWolves.length === 0) {
      return NextResponse.json({ ok: true, importados: 0, mensagem: "Nenhum atleta no BH Wolves." });
    }

    // 2) Mapeia para o formato do NutriPlay
    const num = (v: unknown) => {
      const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
      return Number.isNaN(n) ? null : n;
    };
    const rows = atletasWolves
      .filter((a) => a.nome_completo)
      .map((a) => ({
        wolves_id: a.id,
        clube_id: DEV_CLUBE_ID,
        nome: a.nome_completo,
        posicao: a.posicao ?? null,
        data_nascimento: a.data_nascimento ?? null,
        sexo: a.genero ?? null,
        status: a.status ?? "Ativo",
        email: a.email ?? null,
        telefone: a.telefone ?? null,
        foto_url: a.foto_url ?? null,
        peso_atual: num(a.peso),
        altura_cm: num(a.altura),
        numero: a.numero ?? null,
      }));

    // 3) Upsert por wolves_id (não duplica; atualiza dados básicos)
    const { data: upserted, error: e2 } = await nutri
      .from("atletas")
      .upsert(rows, { onConflict: "wolves_id" })
      .select("id");
    if (e2) throw e2;

    return NextResponse.json({ ok: true, importados: upserted?.length ?? 0 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Erro ao importar" },
      { status: 500 },
    );
  }
}
