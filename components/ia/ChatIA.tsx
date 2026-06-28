"use client";

import { useRef, useState } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const SUGESTOES = [
  "Quanto de proteína para um atleta de 80kg em ganho de massa?",
  "Sugira uma refeição pré-treino de 400 kcal.",
  "Como montar a hidratação para um jogo no calor?",
];

export function ChatIA() {
  const [mensagens, setMensagens] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [carregando, setCarregando] = useState(false);
  const fimRef = useRef<HTMLDivElement>(null);

  async function enviar(texto: string) {
    const pergunta = texto.trim();
    if (!pergunta || carregando) return;
    const novas: Msg[] = [...mensagens, { role: "user", content: pergunta }];
    setMensagens(novas);
    setInput("");
    setCarregando(true);
    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagens: novas }),
      });
      const data = await res.json();
      const resposta = data?.resposta ?? data?.error ?? "Erro ao responder.";
      setMensagens((m) => [...m, { role: "assistant", content: resposta }]);
    } catch {
      setMensagens((m) => [...m, { role: "assistant", content: "Falha de conexão com a IA." }]);
    } finally {
      setCarregando(false);
      setTimeout(() => fimRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }

  return (
    <div className="card flex h-[60vh] flex-col p-0">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {mensagens.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <div className="brand-gradient flex h-12 w-12 items-center justify-center rounded-[14px] text-white">
              <Bot className="h-6 w-6" />
            </div>
            <p className="text-sm text-[var(--color-muted)]">
              Tire dúvidas de nutrição esportiva. Experimente:
            </p>
            <div className="flex flex-col gap-2">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  onClick={() => enviar(s)}
                  className="rounded-[10px] border border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-fg)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          mensagens.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === "user" ? "bg-[var(--color-surface-2)]" : "brand-gradient text-white"
                }`}
              >
                {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div
                className={`max-w-[80%] whitespace-pre-wrap rounded-[12px] px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "bg-[var(--color-surface-2)]"
                    : "bg-[var(--color-bg)]"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}
        {carregando && (
          <div className="flex gap-3">
            <div className="brand-gradient flex h-8 w-8 items-center justify-center rounded-full text-white">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-[12px] bg-[var(--color-bg)] px-4 py-2 text-sm text-[var(--color-muted)]">
              Pensando...
            </div>
          </div>
        )}
        <div ref={fimRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(input);
        }}
        className="flex gap-2 border-t border-[var(--color-border)] p-4"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte algo sobre nutrição esportiva..."
        />
        <Button type="submit" disabled={carregando || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
