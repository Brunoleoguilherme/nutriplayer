import { createAdminClient } from "@/lib/supabase/server";
import { checarEmbedToken } from "@/lib/integracao";
import { fmtData } from "@/utils/format";

export const dynamic = "force-dynamic";

async function carregar(clubeId: string) {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);
  const [clube, atletas, planos, gameday] = await Promise.all([
    supabase.from("clubes").select("nome").eq("id", clubeId).maybeSingle(),
    supabase.from("atletas").select("id", { count: "exact", head: true }).eq("clube_id", clubeId).is("deleted_at", null).eq("ativo", true),
    supabase.from("planos_alimentares").select("id", { count: "exact", head: true }).eq("clube_id", clubeId).eq("status", "Ativo").is("deleted_at", null),
    supabase.from("game_days").select("titulo, data_evento").eq("clube_id", clubeId).is("deleted_at", null).gte("data_evento", hoje).order("data_evento", { ascending: true }).limit(1).maybeSingle(),
  ]);
  return {
    nome: clube.data?.nome ?? null,
    atletas: atletas.count ?? 0,
    planos: planos.count ?? 0,
    gameday: gameday.data ?? null,
  };
}

export default async function EmbedClube({
  params,
  searchParams,
}: {
  params: Promise<{ clubeId: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { clubeId } = await params;
  const { token } = await searchParams;

  if (!checarEmbedToken(token)) {
    return (
      <div style={{ padding: 16, color: "#9aa6c0", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
        Acesso não autorizado. Verifique o token do widget (NUTRIPLAY_EMBED_TOKEN).
      </div>
    );
  }

  const d = await carregar(clubeId);
  if (!d.nome) {
    return (
      <div style={{ padding: 16, color: "#9aa6c0", fontFamily: "system-ui, sans-serif", fontSize: 13 }}>
        Clube não encontrado.
      </div>
    );
  }

  const kpi = (valor: number | string, label: string) => (
    <div style={{ flex: 1, background: "#1c2438", borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{valor}</div>
      <div style={{ fontSize: 11, color: "#9aa6c0" }}>{label}</div>
    </div>
  );

  return (
    <div style={{ padding: 12, fontFamily: "system-ui, sans-serif", color: "#e8edf7" }}>
      <div style={{ background: "#151b29", border: "1px solid #232c42", borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, background: "linear-gradient(135deg,#8b5cf6,#3b82f6,#22c55e)" }}>N</div>
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>NutryPlayer</div>
            <div style={{ fontSize: 10, color: "#9aa6c0" }}>{d.nome}</div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {kpi(d.atletas, "Atletas")}
          {kpi(d.planos, "Planos ativos")}
        </div>

        <div style={{ marginTop: 10, fontSize: 12, color: "#9aa6c0" }}>
          {d.gameday
            ? `Próximo game day: ${d.gameday.titulo} · ${fmtData(d.gameday.data_evento)}`
            : "Nenhum game day agendado"}
        </div>
      </div>
    </div>
  );
}
