"use client";

import { useCallback, useEffect, useState } from "react";
import type { Atleta } from "@/types";
import { atletasService } from "@/services/atletas";

/** Hook de listagem de atletas com estados de loading/erro (padrão do manual). */
export function useAtletas(clubeId?: string | null) {
  const [atletas, setAtletas] = useState<Atleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await atletasService.list({
        clubeId,
        orderBy: "nome",
        ascending: true,
      });
      setAtletas(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar atletas");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { atletas, loading, error, recarregar: carregar };
}
