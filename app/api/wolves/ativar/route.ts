import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { DEV_CLUBE_ID } from "@/lib/club";
import { getTeam, type Team } from "@/lib/teams";

/**
 * Ativa um atleta do time selecionado no NutriPlayer: cria/atualiza o registro
 * em nutriplay.atletas (vínculo por team_id + wolves_id) e devolve o id.
 * Multi-time: o atleta é lido do Supabase do time; o acompanhamento vive
 * sempre no Supabase do NutriPlayer (envs padrão), segmentado por team_id.
 */
export const dynamic = "force-dynamic";

function resolveCreds(team: Team) {
  const url =
    (team.source.urlEnv && process.env[team.source.urlEnv]) ||
    process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key =
    (team.source.serviceKeyEnv && process.env[team.source.serviceKeyEnv]) ||
    process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return { url, key };
}

/** Cliente do Supabase do TIME (fonte dos atletas). */
function teamClient(team: Team) {
  const { url, key } = resolveCreds(team);
  return createServerClient(url, key, {
    db: { schema: team.source.schema ?? "public" },
    cookies: { getAll: () => [], setAll: () => {} },
  });
}

/** Cliente do Supabase do NutriPlayer (onde mora o acompanhamento). */
function nutriClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "nutriplay" }, cookies: { getAll: () => [], setAll: () => {} } },
  );
}

const num = (v: unknown) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isNaN(n) ? null : n;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const wolves_id = body.wolves_id;
    const team = getTeam(body.team_id);
    if (!wolves_id) {
      return NextResponse.json({ ok: false, error: "wolves_id é obrigatório" }, { status: 400 });
    }

    const { data: a, error: e1 } = await teamClient(team)
      .from("atletas")
      .select("*")
      .eq("id", wolves_id)
      .maybeSingle();
    if (e1) throw e1;
    if (!a) return NextResponse.json({ ok: false, error: "Atleta não encontrado no time" }, { status: 404 });

    const nutri = nutriClient();

    const row = {
      wolves_id: a.id,
      team_id: team.id,
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
    };

    // Já existe? (vínculo por time + wolves_id)
    const { data: existente, error: e2 } = await nutri
      .from("atletas")
      .select("id")
      .eq("team_id", team.id)
      .eq("wolves_id", wolves_id)
      .maybeSingle();
    if (e2) throw e2;

    let nutriId: string;
    if (existente) {
      const { error: eUp } = await nutri.from("atletas").update(row).eq("id", existente.id);
      if (eUp) throw eUp;
      nutriId = existente.id as string;
    } else {
      const { data: inserido, error: eIns } = await nutri
        .from("atletas")
        .insert(row)
        .select("id")
        .single();
      if (eIns) throw eIns;
      nutriId = inserido.id as string;
    }

    return NextResponse.json({ ok: true, nutri_id: nutriId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    const dica =
      /schema|relation|does not exist|not.*expose|PGRST|team_id/i.test(msg)
        ? " — verifique se rodou o schema.sql + migrations (incl. 0008) e se expôs o schema 'nutriplay' em Supabase → Settings → API → Exposed schemas."
        : "";
    return NextResponse.json({ ok: false, error: msg + dica }, { status: 500 });
  }
}
