"use client";

import { useEffect, useState } from "react";
import { UserPlus, Mail, Shield, Trash2, Loader2, Info, X, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const PAPEIS = [
  { value: "administrador", label: "Administrador", desc: "Acesso total ao sistema" },
  { value: "nutricionista", label: "Nutricionista", desc: "Gerencia planos, refeições e avaliações" },
  { value: "coach", label: "Coach / Treinador", desc: "Visualiza atletas e avaliações" },
  { value: "medico", label: "Médico", desc: "Acesso a dados de saúde e avaliações" },
  { value: "preparador", label: "Preparador Físico", desc: "Visualiza wearables e predições" },
  { value: "diretor", label: "Diretor", desc: "Visualização geral e relatórios" },
] as const;

type Papel = typeof PAPEIS[number]["value"];

const PAPEL_COLORS: Record<Papel, { bg: string; text: string }> = {
  administrador: { bg: "#FF8A1E1a", text: "#FF6B00" },
  nutricionista: { bg: "#16E28A1a", text: "#0BCF74" },
  coach: { bg: "#2563eb1a", text: "#2563eb" },
  medico: { bg: "#7c3aed1a", text: "#7c3aed" },
  preparador: { bg: "#0ea5e91a", text: "#0ea5e9" },
  diretor: { bg: "#64748b1a", text: "#475569" },
};

interface PerfilUsuario {
  id: string;
  papel: Papel;
  ativo: boolean;
  created_at: string;
  usuarios: {
    id: string;
    nome: string;
    email: string;
    avatar_url: string | null;
    status: string;
    ativo: boolean;
  } | null;
}

function Iniciais({ nome, email }: { nome: string; email: string }) {
  const text = nome || email;
  return text.slice(0, 2).toUpperCase();
}

function PapelBadge({ papel }: { papel: Papel }) {
  const c = PAPEL_COLORS[papel] ?? { bg: "#f1f5f91a", text: "#64748b" };
  const label = PAPEIS.find((p) => p.value === papel)?.label ?? papel;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ backgroundColor: c.bg, color: c.text }}>
      <Shield className="h-3 w-3" />
      {label}
    </span>
  );
}

export default function UsuariosPage() {
  const [perfis, setPerfis] = useState<PerfilUsuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [deletando, setDeletando] = useState<string | null>(null);

  async function carregar() {
    setLoading(true);
    try {
      const r = await fetch("/api/usuarios");
      const j = await r.json();
      if (j.ok) setPerfis(j.perfis);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function desativar(perfilId: string) {
    if (!confirm("Desativar este usuário?")) return;
    setDeletando(perfilId);
    try {
      const r = await fetch(`/api/usuarios/${perfilId}`, { method: "DELETE" });
      const j = await r.json();
      if (j.ok) { toast.success("Usuário desativado."); carregar(); }
      else toast.error(j.error ?? "Erro ao desativar.");
    } finally {
      setDeletando(null);
    }
  }

  async function trocarPapel(perfilId: string, papel: string) {
    const r = await fetch(`/api/usuarios/${perfilId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ papel }),
    });
    const j = await r.json();
    if (j.ok) { toast.success("Papel atualizado."); carregar(); }
    else toast.error(j.error ?? "Erro ao atualizar.");
  }

  const ativos = perfis.filter((p) => p.ativo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Usuários do Sistema</h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Gerencie quem tem acesso ao NutriPlayer.
          </p>
        </div>
        <button
          onClick={() => setModalAberto(true)}
          className="flex items-center gap-2 rounded-[var(--radius-button)] px-5 py-2.5 text-sm font-bold text-white transition-all active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)", boxShadow: "0 8px 24px rgba(255,107,0,0.30)" }}
        >
          <UserPlus className="h-4 w-4" /> Convidar usuário
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-[16px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          <strong>Atletas</strong> sempre vêm de <strong>Times / Projetos</strong> (BH Wolves) e não são criados aqui.
          Esta área é exclusiva para usuários admin do sistema (nutricionistas, coaches, diretores etc.).
        </span>
      </div>

      {/* Tabela */}
      <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--color-accent)]" />
          </div>
        ) : ativos.length === 0 ? (
          <div className="py-16 text-center">
            <UserPlus className="mx-auto h-10 w-10 text-[var(--color-muted)]" />
            <p className="mt-3 font-semibold">Nenhum usuário cadastrado</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              Convide a equipe clicando em "Convidar usuário".
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Usuário</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] sm:table-cell">E-mail</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)]">Papel</th>
                <th className="hidden px-5 py-3 text-left text-xs font-semibold uppercase tracking-widest text-[var(--color-muted)] md:table-cell">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {ativos.map((p) => {
                const u = p.usuarios;
                const nome = u?.nome ?? "—";
                const email = u?.email ?? "—";
                return (
                  <tr key={p.id} className="group transition-colors hover:bg-[var(--color-surface-2)]">
                    {/* Avatar + nome */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)" }}>
                          <Iniciais nome={nome} email={email} />
                        </div>
                        <span className="text-sm font-semibold">{nome}</span>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="hidden px-5 py-4 sm:table-cell">
                      <span className="flex items-center gap-1.5 text-sm text-[var(--color-muted)]">
                        <Mail className="h-3.5 w-3.5 shrink-0" /> {email}
                      </span>
                    </td>
                    {/* Papel — dropdown inline */}
                    <td className="px-5 py-4">
                      <div className="relative inline-block">
                        <select
                          value={p.papel}
                          onChange={(e) => trocarPapel(p.id, e.target.value)}
                          className="cursor-pointer appearance-none rounded-full py-1 pl-2.5 pr-7 text-xs font-semibold outline-none"
                          style={{
                            backgroundColor: PAPEL_COLORS[p.papel]?.bg ?? "#f1f5f9",
                            color: PAPEL_COLORS[p.papel]?.text ?? "#475569",
                          }}
                        >
                          {PAPEIS.map((pp) => (
                            <option key={pp.value} value={pp.value}>{pp.label}</option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2"
                          style={{ color: PAPEL_COLORS[p.papel]?.text ?? "#475569" }} />
                      </div>
                    </td>
                    {/* Status */}
                    <td className="hidden px-5 py-4 md:table-cell">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${u?.status === "Ativo" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                        {u?.status ?? "Convidado"}
                      </span>
                    </td>
                    {/* Ações */}
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => desativar(p.id)}
                        disabled={deletando === p.id}
                        className="rounded-[10px] p-2 text-[var(--color-muted)] opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 disabled:opacity-40"
                        title="Desativar usuário"
                      >
                        {deletando === p.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : <Trash2 className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal de convite */}
      {modalAberto && (
        <ConvidarModal onClose={() => setModalAberto(false)} onSuccess={() => { setModalAberto(false); carregar(); }} />
      )}
    </div>
  );
}

function ConvidarModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<Papel>("nutricionista");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function convidar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setLoading(true);
    try {
      const r = await fetch("/api/usuarios/convidar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome, papel }),
      });
      const j = await r.json();
      if (j.ok) {
        toast.success(`Convite enviado para ${email}!`);
        onSuccess();
      } else {
        setErro(j.error ?? "Erro ao enviar convite.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-[24px] bg-[var(--color-surface)] p-7 shadow-[var(--shadow-hover)]">
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]">
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-black">Convidar usuário</h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Um e-mail de acesso será enviado ao endereço informado.
        </p>

        <form onSubmit={convidar} className="mt-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Nome completo</label>
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Rafael Silva"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">E-mail</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nutricionista@clube.com"
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold">Papel / Nível de acesso</label>
            <select
              value={papel}
              onChange={(e) => setPapel(e.target.value as Papel)}
              className="w-full rounded-[var(--radius-input)] border border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-3 text-sm outline-none focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/15"
            >
              {PAPEIS.map((p) => (
                <option key={p.value} value={p.value}>{p.label} — {p.desc}</option>
              ))}
            </select>
          </div>

          {erro && (
            <p className="rounded-[12px] bg-red-50 px-4 py-3 text-sm text-red-600">{erro}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-[var(--radius-button)] border border-[var(--color-border)] py-3 text-sm font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface-2)]">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] py-3 text-sm font-bold text-white disabled:opacity-60"
              style={{ background: "linear-gradient(135deg,#FF9A30,#FF6B00)", boxShadow: "0 8px 20px rgba(255,107,0,0.25)" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              {loading ? "Enviando..." : "Enviar convite"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
