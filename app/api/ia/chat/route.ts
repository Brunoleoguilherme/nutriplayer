import { NextResponse } from "next/server";

/**
 * Chat da IA Nutricional.
 * Usa a API da Anthropic via fetch (sem SDK) se ANTHROPIC_API_KEY estiver
 * configurada. Caso contrário, responde com um aviso amigável.
 *
 * Env necessária para ativar:
 *   ANTHROPIC_API_KEY=...
 *   (opcional) ANTHROPIC_MODEL=claude-sonnet-4-6
 */

const SYSTEM = `Você é a IA Nutricional do NutryPlayer, assistente de nutricionistas esportivos.
Responda em português do Brasil, de forma objetiva e tecnicamente correta.
Foque em nutrição esportiva, planejamento alimentar, hidratação, suplementação e recuperação.
Quando fizer sentido, sugira valores de macros e justifique brevemente.
Não forneça diagnósticos médicos; oriente encaminhamento quando necessário.`;

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  let mensagens: ChatMsg[] = [];
  try {
    const body = await request.json();
    mensagens = Array.isArray(body?.mensagens) ? body.mensagens : [];
  } catch {
    return NextResponse.json({ error: "payload inválido" }, { status: 400 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      resposta:
        "O chat de IA ainda não está configurado. Defina ANTHROPIC_API_KEY no .env.local " +
        "para ativar respostas inteligentes. As ferramentas de cálculo, geração de plano, " +
        "substituições e alertas já funcionam sem IA externa.",
      configurada: false,
    });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: 1024,
        system: SYSTEM,
        messages: mensagens.map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!res.ok) {
      const txt = await res.text();
      return NextResponse.json({ error: `IA indisponível: ${txt}` }, { status: 502 });
    }

    const data = await res.json();
    const resposta =
      data?.content?.map((c: { text?: string }) => c.text ?? "").join("") ??
      "Não consegui gerar uma resposta.";
    return NextResponse.json({ resposta, configurada: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro na IA" },
      { status: 500 },
    );
  }
}
