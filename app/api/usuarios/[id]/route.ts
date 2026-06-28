import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEV_CLUBE_ID } from "@/lib/club";

// PATCH — atualiza papel do perfil
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { papel } = await req.json();
    if (!papel) return NextResponse.json({ ok: false, error: "papel é obrigatório" }, { status: 400 });

    const supabase = createAdminClient();
    const { error } = await supabase
      .schema("nutriplay")
      .from("perfis")
      .update({ papel })
      .eq("id", id)
      .eq("clube_id", DEV_CLUBE_ID);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// DELETE — desativa (soft delete)
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createAdminClient();
    const { error } = await supabase
      .schema("nutriplay")
      .from("perfis")
      .update({ ativo: false, deleted_at: new Date().toISOString() })
      .eq("id", id)
      .eq("clube_id", DEV_CLUBE_ID);

    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
