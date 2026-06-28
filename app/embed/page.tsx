"use client";

/**
 * /embed — entry point quando NutriPlayer é carregado em iframe pelo BH Wolves.
 *
 * Recebe access_token + refresh_token via query string (mesma instância Supabase),
 * seta a sessão e redireciona para /dashboard.
 *
 * Nunca expõe esta rota como link público — ela exige token válido.
 */

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { createBrowserClient } from "@supabase/ssr";

function EmbedConteudo() {
  const router = useRouter();
  const params = useSearchParams();
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    async function autenticar() {
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken || !refreshToken) {
        // Sem tokens — vai para login normal
        router.replace("/login");
        return;
      }

      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      );

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setErro("Sessão inválida ou expirada. Faça login no BH Wolves novamente.");
        return;
      }

      // Sessão setada — redireciona para o dashboard do NutriPlayer
      router.replace("/dashboard");
    }

    autenticar();
  }, [params, router]);

  if (erro) {
    return (
      <div style={{
        minHeight: "100vh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        background: "#0f1117", color: "#fca5a5", gap: 12, padding: 32, textAlign: "center",
      }}>
        <span style={{ fontSize: 32 }}>⚠️</span>
        <strong style={{ fontSize: 16 }}>{erro}</strong>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      background: "#faf9f6", gap: 16,
    }}>
      {/* Spinner simples enquanto autentica */}
      <div style={{
        width: 40, height: 40, borderRadius: "50%",
        border: "3px solid #FF6B00", borderTopColor: "transparent",
        animation: "spin 0.8s linear infinite",
      }} />
      <p style={{ color: "#6b7280", fontSize: 14 }}>Conectando ao NutriPlayer...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedConteudo />
    </Suspense>
  );
}
