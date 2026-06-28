import type { FotoAtleta, TipoFoto } from "@/types";
import { createClient } from "@/lib/supabase/client";

const BUCKET = "evolucao";

export const fotosService = {
  async listar(atletaId: string): Promise<FotoAtleta[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("fotos_atleta")
      .select("*")
      .eq("atleta_id", atletaId)
      .is("deleted_at", null)
      .eq("ativo", true)
      .order("data", { ascending: false });
    if (error) throw error;
    return (data ?? []) as FotoAtleta[];
  },

  async upload(
    file: File,
    atletaId: string,
    clubeId: string,
    tipo: TipoFoto,
  ): Promise<FotoAtleta> {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${clubeId}/${atletaId}/${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: false });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);

    const { data, error } = await supabase
      .from("fotos_atleta")
      .insert({
        atleta_id: atletaId,
        clube_id: clubeId,
        url: pub.publicUrl,
        storage_path: path,
        tipo,
        data: new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();
    if (error) throw error;
    return data as FotoAtleta;
  },

  async remover(foto: FotoAtleta): Promise<void> {
    const supabase = createClient();
    if (foto.storage_path) {
      await supabase.storage.from(BUCKET).remove([foto.storage_path]);
    }
    const { error } = await supabase
      .from("fotos_atleta")
      .update({ deleted_at: new Date().toISOString(), ativo: false })
      .eq("id", foto.id);
    if (error) throw error;
  },
};
