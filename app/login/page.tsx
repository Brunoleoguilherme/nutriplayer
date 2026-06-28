"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Logo } from "@/components/ui/Logo";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") || "/dashboard";
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
      if (error) throw error;
      router.push(next);
      router.refresh();
    } catch (err) {
      setErro(
        err instanceof Error && /invalid login/i.test(err.message)
          ? "E-mail ou senha incorretos."
          : err instanceof Error
          ? err.message
          : "Não foi possível entrar.",
      );
      setCarregando(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" showTagline />
        </div>

        <div className="card p-7">
          <h1 className="text-xl font-bold">Entrar</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Acesse sua conta para continuar.
          </p>

          <form onSubmit={entrar} className="mt-6 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-muted)]">E-mail</span>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@email.com"
                  className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-xs font-medium text-[var(--color-muted)]">Senha</span>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="password"
                  required
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-bg)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </label>

            {erro && (
              <p className="rounded-[12px] bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={carregando}
              className="accent-gradient flex items-center justify-center gap-2 rounded-[var(--radius-button)] py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(255,138,30,0.35)] transition-opacity disabled:opacity-60"
            >
              {carregando && <Loader2 className="h-4 w-4 animate-spin" />}
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Acesso restrito. Precisa de uma conta? Fale com o administrador.
        </p>
      </div>
    </main>
  );
}
