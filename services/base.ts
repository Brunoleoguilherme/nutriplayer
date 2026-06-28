import { createClient } from "@/lib/supabase/client";

/**
 * Fábrica de serviço CRUD genérico com soft delete (Manual: padrão de dev).
 * Páginas/hooks nunca chamam o Supabase direto.
 */
export interface ListOptions {
  clubeId?: string | null;
  search?: string;
  searchColumn?: string;
  orderBy?: string;
  ascending?: boolean;
  limit?: number;
  includeInactive?: boolean;
}

export function createCrudService<T extends { id: string }>(
  table: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getClient: () => any = createClient,
) {
  return {
    async list(opts: ListOptions = {}): Promise<T[]> {
      const supabase = getClient();
      let q = supabase.from(table).select("*").is("deleted_at", null);
      if (opts.clubeId) q = q.eq("clube_id", opts.clubeId);
      if (!opts.includeInactive) q = q.eq("ativo", true);
      if (opts.search && opts.searchColumn)
        q = q.ilike(opts.searchColumn, "%" + opts.search + "%");
      q = q.order(opts.orderBy ?? "created_at", { ascending: opts.ascending ?? false });
      if (opts.limit) q = q.limit(opts.limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as T[];
    },

    async getById(id: string): Promise<T | null> {
      const { data, error } = await getClient()
        .from(table)
        .select("*")
        .eq("id", id)
        .is("deleted_at", null)
        .maybeSingle();
      if (error) throw error;
      return (data as T) ?? null;
    },

    async create(payload: Partial<T>): Promise<T> {
      const { data, error } = await getClient().from(table).insert(payload).select().single();
      if (error) throw error;
      return data as T;
    },

    async createMany(rows: Partial<T>[]): Promise<number> {
      if (rows.length === 0) return 0;
      const { data, error } = await getClient().from(table).insert(rows).select("id");
      if (error) throw error;
      return data?.length ?? 0;
    },

    async update(id: string, payload: Partial<T>): Promise<T> {
      const { data, error } = await getClient()
        .from(table)
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as T;
    },

    async softDelete(id: string): Promise<void> {
      const { error } = await getClient()
        .from(table)
        .update({ deleted_at: new Date().toISOString(), ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
  };
}
