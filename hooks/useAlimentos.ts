"use client";

import { useCallback, useEffect, useState } from "react";
import type { Alimento } from "@/types";
import { alimentosService } from "@/services/alimentos";

/** Lista alimentos do clube + catálogos globais. */
export function useAlimentos(clubeId?: string | null) {
  const [alimentos, setAlimentos] = useState<Alimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAlimentos(await alimentosService.listarClubeEGlobais(clubeId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar alimentos");
    } finally {
      setLoading(false);
    }
  }, [clubeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { alimentos, loading, error, recarregar: carregar };
}
