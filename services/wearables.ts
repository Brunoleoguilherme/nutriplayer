import type {
  WearableConexao,
  WearableMetrica,
  ProvedorWearable,
} from "@/types";
import { createClient } from "@/lib/supabase/client";

export const PROVEDORES: { id: ProvedorWearable; label: string }[] = [
  { id: "garmin", label: "Garmin" },
  { id: "polar", label: "Polar" },
  { id: "apple", label: "Apple Health" },
  { id: "google", label: "Google Fit" },
  { id: "manual", label: "Manual" },
];

export const wearablesService = {
  // ---------- Conexões ----------
  async conexoes(atletaId: string): Promise<WearableConexao[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("wearable_conexoes")
      .select("*")
      .eq("atleta_id", atletaId)
      .is("deleted_at", null);
    if (error) throw error;
    return (data ?? []) as WearableConexao[];
  },

  /** Conecta/atualiza (upsert) uma conexão de provedor para o atleta. */
  async definirConexao(
    atletaId: string,
    clubeId: string,
    provedor: ProvedorWearable,
    status: WearableConexao["status"],
  ): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("wearable_conexoes")
      .upsert(
        {
          atleta_id: atletaId,
          clube_id: clubeId,
          provedor,
          status,
          ultimo_sync: status === "conectado" ? new Date().toISOString() : null,
        },
        { onConflict: "atleta_id,provedor" },
      );
    if (error) throw error;
  },

  // ---------- Métricas ----------
  async metricas(atletaId: string, limite = 30): Promise<WearableMetrica[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("wearable_metricas")
      .select("*")
      .eq("atleta_id", atletaId)
      .order("data", { ascending: true })
      .limit(limite);
    if (error) throw error;
    return (data ?? []) as WearableMetrica[];
  },

  /** Upsert de uma métrica diária (por atleta+data+origem). */
  async registrarMetrica(metrica: Partial<WearableMetrica>): Promise<void> {
    const supabase = createClient();
    const { error } = await supabase
      .from("wearable_metricas")
      .upsert(metrica, { onConflict: "atleta_id,data,origem" });
    if (error) throw error;
  },
};
