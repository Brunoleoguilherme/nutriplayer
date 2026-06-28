import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEV_CLUBE_ID } from "@/lib/club";

export async function GET() {
  try {
    const supabase = createAdminClient();

    // Busca perfis do clube + dados do usuario
    const { data: perfis, error } = await supabase
      .schema("nutriplay")
      .from("perfis")
      .select(`
        id,
        papel,
        ativo,
        created_at,
        usuarios (
          id,
          nome,
          email,
          avatar_url,
          status,
          ativo
        )
      `)
      .eq("clube_id", DEV_CLUBE_ID)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ ok: true, perfis: perfis ?? [] });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
