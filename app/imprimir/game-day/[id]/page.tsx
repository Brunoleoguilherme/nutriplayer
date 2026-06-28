"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { GameDay, GameDayItem } from "@/types";
import { gameDayService } from "@/services/gameday";
import { PrintButton } from "@/components/print/PrintButton";
import { fmtData } from "@/utils/format";

export default function ImprimirGameDay() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<GameDay | null>(null);
  const [itens, setItens] = useState<GameDayItem[]>([]);

  useEffect(() => {
    gameDayService.getComItens(id).then((res) => {
      if (res) {
        setEvento(res.evento);
        setItens(res.itens);
      }
    });
  }, [id]);

  return (
    <div style={{ background: "#fff", color: "#111", minHeight: "100vh" }}>
      <PrintButton />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: "#666" }}>NUTRIPLAY · BH WOLVES — GAME DAY</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 0" }}>
            {evento?.titulo ?? "Carregando..."}
          </h1>
          {evento && (
            <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
              {fmtData(evento.data_evento)}
              {evento.horario_evento ? ` · ${evento.horario_evento.slice(0, 5)}` : ""}
              {evento.adversario ? ` · vs ${evento.adversario}` : ""}
              {evento.local_evento ? ` · ${evento.local_evento}` : ""}
            </div>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th style={{ padding: "8px 6px", width: 70 }}>Horário</th>
              <th style={{ padding: "8px 6px" }}>Item</th>
              <th style={{ padding: "8px 6px", width: 110 }}>Tipo</th>
              <th style={{ padding: "8px 6px", width: 120 }}>Responsável</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((it) => (
              <tr key={it.id} style={{ borderBottom: "1px solid #eee", verticalAlign: "top" }}>
                <td style={{ padding: "8px 6px", fontWeight: 600 }}>
                  {it.horario ? it.horario.slice(0, 5) : "—"}
                </td>
                <td style={{ padding: "8px 6px" }}>
                  <div style={{ fontWeight: 600 }}>{it.titulo}</div>
                  {(it.refeicao?.nome || it.suplemento?.nome || it.descricao) && (
                    <div style={{ color: "#555" }}>
                      {[it.refeicao?.nome, it.suplemento?.nome, it.descricao].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </td>
                <td style={{ padding: "8px 6px" }}>{it.tipo}</td>
                <td style={{ padding: "8px 6px" }}>{it.responsavel ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {evento?.observacoes && (
          <div style={{ marginTop: 20, fontSize: 13 }}>
            <strong>Observações:</strong> {evento.observacoes}
          </div>
        )}
        <div style={{ marginTop: 32, fontSize: 11, color: "#999" }}>
          Gerado por NutryPlayer · {fmtData(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}
