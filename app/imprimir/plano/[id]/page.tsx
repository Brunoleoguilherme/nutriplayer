"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import type { PlanoAlimentar, ResumoMacros } from "@/types";
import { planosService } from "@/services/planos";
import { refeicoesService } from "@/services/refeicoes";
import { macrosDaRefeicao, somarMacros } from "@/utils/macros";
import { fmtData, fmtKcal, fmtGramas } from "@/utils/format";
import { PrintButton } from "@/components/print/PrintButton";

interface LinhaPlano {
  horario: string | null;
  periodo: string | null;
  nome: string;
  macros: ResumoMacros;
}

type PlanoComAtleta = PlanoAlimentar & { atleta?: { id: string; nome: string } | null };

export default function ImprimirPlano() {
  const { id } = useParams<{ id: string }>();
  const [plano, setPlano] = useState<PlanoComAtleta | null>(null);
  const [linhas, setLinhas] = useState<LinhaPlano[]>([]);
  const [total, setTotal] = useState<ResumoMacros | null>(null);

  useEffect(() => {
    (async () => {
      const res = await planosService.getComRefeicoes(id);
      if (!res) return;
      setPlano(res.plano);

      const linhasResolvidas = await Promise.all(
        res.refeicoes.map(async (pr) => {
          let macros: ResumoMacros = {
            calorias: 0,
            proteinas: 0,
            carboidratos: 0,
            gorduras: 0,
            fibras: 0,
          };
          const det = await refeicoesService.getComItens(pr.refeicao_id);
          if (det) macros = macrosDaRefeicao(det.itens);
          return {
            horario: pr.horario,
            periodo: pr.periodo,
            nome: pr.refeicao?.nome ?? det?.refeicao.nome ?? "Refeição",
            macros,
          };
        }),
      );
      setLinhas(linhasResolvidas);
      setTotal(somarMacros(linhasResolvidas.map((l) => l.macros)));
    })();
  }, [id]);

  return (
    <div style={{ background: "#fff", color: "#111", minHeight: "100vh" }}>
      <PrintButton />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ borderBottom: "2px solid #111", paddingBottom: 12, marginBottom: 20 }}>
          <div style={{ fontSize: 12, letterSpacing: 1, color: "#666" }}>NUTRIPLAY · PLANO ALIMENTAR</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "6px 0 0" }}>{plano?.nome ?? "Carregando..."}</h1>
          {plano && (
            <div style={{ fontSize: 13, color: "#444", marginTop: 4 }}>
              {plano.atleta?.nome ? `Atleta: ${plano.atleta.nome}` : "Modelo"}
              {plano.objetivo ? ` · ${plano.objetivo}` : ""}
            </div>
          )}
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>
              <th style={{ padding: "8px 6px", width: 70 }}>Horário</th>
              <th style={{ padding: "8px 6px" }}>Refeição</th>
              <th style={{ padding: "8px 6px", width: 70 }}>kcal</th>
              <th style={{ padding: "8px 6px", width: 130 }}>P / C / G</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: "8px 6px", fontWeight: 600 }}>
                  {l.horario ? l.horario.slice(0, 5) : "—"}
                </td>
                <td style={{ padding: "8px 6px" }}>
                  <div style={{ fontWeight: 600 }}>{l.nome}</div>
                  {l.periodo && <div style={{ color: "#666" }}>{l.periodo}</div>}
                </td>
                <td style={{ padding: "8px 6px" }}>{fmtKcal(l.macros.calorias)}</td>
                <td style={{ padding: "8px 6px" }}>
                  {fmtGramas(l.macros.proteinas)} / {fmtGramas(l.macros.carboidratos)} /{" "}
                  {fmtGramas(l.macros.gorduras)}
                </td>
              </tr>
            ))}
          </tbody>
          {total && (
            <tfoot>
              <tr style={{ borderTop: "2px solid #111", fontWeight: 700 }}>
                <td style={{ padding: "8px 6px" }} colSpan={2}>
                  Total diário
                </td>
                <td style={{ padding: "8px 6px" }}>{fmtKcal(total.calorias)}</td>
                <td style={{ padding: "8px 6px" }}>
                  {fmtGramas(total.proteinas)} / {fmtGramas(total.carboidratos)} /{" "}
                  {fmtGramas(total.gorduras)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {plano?.observacoes && (
          <div style={{ marginTop: 20, fontSize: 13 }}>
            <strong>Orientações:</strong> {plano.observacoes}
          </div>
        )}
        <div style={{ marginTop: 32, fontSize: 11, color: "#999" }}>
          Gerado por NutryPlayer · {fmtData(new Date().toISOString())}
        </div>
      </div>
    </div>
  );
}
