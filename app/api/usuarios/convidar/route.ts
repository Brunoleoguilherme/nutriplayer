import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { DEV_CLUBE_ID } from "@/lib/club";

export async function POST(req: NextRequest) {
  try {
    const { email, nome, papel } = await req.json();
    if (!email || !nome || !papel) {
      return NextResponse.json({ ok: false, error: "email, nome e papel são obrigatórios" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // 1. Convida usuário via Supabase Auth (envia e-mail de convite)
    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      data: { full_name: nome },
    });
    if (inviteError) throw inviteError;

    const authUserId = invited.user.id;

    // 2. Upsert em nutriplay.usuarios
    const { data: usuario, error: userError } = await supabase
      .schema("nutriplay")
      .from("usuarios")
      .upsert(
        { auth_user_id: authUserId, clube_id: DEV_CLUBE_ID, nome, email, status: "Convidado", ativo: true },
        { onConflict: "email" }
      )
      .select("id")
      .single();
    if (userError) throw userError;

    // 3. Insere perfil (papel no clube)
    const { error: perfilError } = await supabase
      .schema("nutriplay")
      .from("perfis")
      .upsert(
        { user_id: authUserId, clube_id: DEV_CLUBE_ID, papel, ativo: true },
        { onConflict: "user_id,clube_id,papel" }
      );
    if (perfilError) throw perfilError;

    return NextResponse.json({ ok: true, usuario_id: usuario?.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
