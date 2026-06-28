"use client";

import { useState } from "react";
import { Plug, Copy, Check, Code2, MonitorSmartphone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { getClubeAtivo } from "@/lib/club";

function Bloco({ titulo, codigo }: { titulo: string; codigo: string }) {
  const [copiado, setCopiado] = useState(false);
  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      /* clipboard indisponível */
    }
  }
  return (
    <div className="card overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
        <span className="text-xs font-semibold text-[var(--color-muted)]">{titulo}</span>
        <button onClick={copiar} className="flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-fg)]">
          {copiado ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
          {copiado ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="overflow-x-auto px-4 py-3 text-xs leading-relaxed text-[var(--color-fg)]">
        <code>{codigo}</code>
      </pre>
    </div>
  );
}

export default function IntegracaoPage() {
  const clubeId = getClubeAtivo();
  const origin = typeof window !== "undefined" ? window.location.origin : "https://SEU-NUTRIPLAY";

  const curlResumo = `curl "${origin}/api/integracao/resumo?clube_id=${clubeId}" \\
  -H "x-api-key: SUA_CHAVE"`;

  const curlAtleta = `curl "${origin}/api/integracao/atleta/ATLETA_ID" \\
  -H "x-api-key: SUA_CHAVE"`;

  const iframe = `<iframe
  src="${origin}/embed/clube/${clubeId}?token=SEU_TOKEN"
  width="360" height="220" style="border:0;border-radius:16px"
  title="NutryPlayer"></iframe>`;

  const fetchEx = `// No backend do BH Wolves Manager
const r = await fetch(
  "${origin}/api/integracao/resumo?clube_id=${clubeId}",
  { headers: { "x-api-key": process.env.NUTRIPLAY_API_KEY } }
);
const resumo = await r.json();
// { clube, kpis:{atletas,planos_ativos,avaliacoes}, proximo_game_day }`;

  return (
    <>
      <PageHeader
        title="Integração BH Wolves"
        subtitle="Exponha dados do NutryPlayer para aparecerem no BH Wolves Manager."
        icon={<Plug className="h-6 w-6" />}
      />

      <div className="mb-6 card p-5">
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-brand-purple)]">Como habilitar</h3>
        <ol className="ml-4 list-decimal space-y-1 text-sm text-[var(--color-muted)]">
          <li>No <code className="text-[var(--color-fg)]">.env.local</code>, defina <code className="text-[var(--color-fg)]">NUTRIPLAY_API_KEY</code> (API) e/ou <code className="text-[var(--color-fg)]">NUTRIPLAY_EMBED_TOKEN</code> (widget).</li>
          <li>Opcional: <code className="text-[var(--color-fg)]">INTEGRACAO_ORIGIN</code> com a URL do BH Wolves para liberar CORS.</li>
          <li>No BH Wolves, consuma a API (servidor) ou embuta o iframe abaixo.</li>
        </ol>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Code2 className="h-4 w-4 text-[var(--color-brand-blue)]" /> API (servidor → servidor)
          </h2>
          <Bloco titulo="Resumo do clube (curl)" codigo={curlResumo} />
          <Bloco titulo="Resumo de um atleta (curl)" codigo={curlAtleta} />
          <Bloco titulo="Exemplo em JavaScript" codigo={fetchEx} />
        </div>

        <div className="flex flex-col gap-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <MonitorSmartphone className="h-4 w-4 text-[var(--color-brand-green)]" /> Widget embutível (iframe)
          </h2>
          <Bloco titulo="Cole no BH Wolves" codigo={iframe} />
          <div className="card p-5 text-sm text-[var(--color-muted)]">
            <p className="mb-2 font-medium text-[var(--color-fg)]">Pré-visualização</p>
            <p>
              O widget mostra atletas ativos, planos ativos e o próximo game day do clube,
              já no tema do NutryPlayer. Requer <code className="text-[var(--color-fg)]">NUTRIPLAY_EMBED_TOKEN</code> configurado.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-6 text-xs text-[var(--color-muted)]">
        Segurança: a API só responde com a chave correta; o widget só renderiza com o token.
        Em produção, defina <code className="text-[var(--color-fg)]">INTEGRACAO_ORIGIN</code> e use HTTPS.
        Quando houver login único, o clube virá do perfil em vez do clube de desenvolvimento.
      </p>
    </>
  );
}
