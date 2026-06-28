"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/* ─── Remove o fundo branco/off-white da logo via canvas ─── */
function LogoTransparente({ className }: { className?: string }) {
  const [src, setSrc] = useState("/logo.png");

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imageData.data;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Pixels muito claros (fundo branco/quase-branco) → transparente
        if (r > 235 && g > 235 && b > 235) {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(imageData, 0, 0);
      setSrc(canvas.toDataURL("image/png"));
    };
    img.src = "/logo.png";
  }, []);

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="NutriPlayer" className={className} />;
}

/* ─── Página de login ─── */
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
    <main
      className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12 overflow-hidden"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Orbs decorativos */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,138,30,0.18) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute -bottom-40 -left-32 h-[480px] w-[480px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(22,226,138,0.14) 0%, transparent 70%)" }} />
      <div className="pointer-events-none absolute top-1/3 right-1/4 h-64 w-64 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(255,184,110,0.10) 0%, transparent 65%)" }} />

      {/* Conteúdo */}
      <div className="relative z-10 flex w-full max-w-md flex-col items-center">

        {/* Logo com fundo transparente */}
        <LogoTransparente className="mb-1 w-52 object-contain drop-shadow-sm" />

        {/* espaço entre logo e card */}
        <div className="mb-8" />

        {/* Card formulário */}
        <div
          className="w-full rounded-[28px] bg-white/90 p-8 backdrop-blur-sm"
          style={{
            boxShadow:
              "0 24px 64px rgba(30,58,95,0.10), 0 4px 16px rgba(30,58,95,0.06), 0 0 0 1px rgba(232,237,242,0.9)",
          }}
        >
          <h1 className="text-2xl font-black text-[var(--color-fg)]">Bem-vindo de volta</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Acesse sua conta para continuar.
          </p>

          <form onSubmit={entrar} className="mt-7 flex flex-col gap-4">
            {/* E-mail */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-fg)]">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@clube.com"
                  className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[#FAFBFC] py-3 pl-10 pr-4 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-disabled)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 focus:bg-white"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-[var(--color-fg)]">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[#FAFBFC] py-3 pl-10 pr-4 text-sm text-[var(--color-fg)] placeholder:text-[var(--color-disabled)] outline-none transition-all focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15 focus:bg-white"
                />
              </div>
            </div>

            {/* Erro */}
            {erro && (
              <div className="flex items-start gap-2.5 rounded-[14px] border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/6 px-4 py-3">
                <span className="shrink-0 text-[var(--color-danger)]">⚠</span>
                <p className="text-sm text-[var(--color-danger)]">{erro}</p>
              </div>
            )}

            {/* Botão */}
            <button
              type="submit"
              disabled={carregando}
              className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[var(--radius-button)] py-3.5 text-sm font-bold text-white transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: carregando
                  ? "#94a3b8"
                  : "linear-gradient(135deg, #FF9A30 0%, #FF6B00 100%)",
                boxShadow: carregando ? "none" : "0 8px 28px rgba(255,107,0,0.38)",
              }}
            >
              {carregando ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-[var(--color-muted)]">
          Acesso restrito.{" "}
          <span className="font-medium" style={{ color: "var(--color-accent)" }}>
            Fale com o administrador
          </span>{" "}
          para criar uma conta.
        </p>

        <p className="mt-8 text-[10px] text-[var(--color-disabled)]">
          BH Wolves Manager · Módulo NutriPlayer
        </p>
      </div>
    </main>
  );
}
