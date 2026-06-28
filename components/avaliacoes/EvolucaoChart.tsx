"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { AvaliacaoCorporal } from "@/types";
import { fmtData } from "@/utils/format";

export function EvolucaoChart({ avaliacoes }: { avaliacoes: AvaliacaoCorporal[] }) {
  const dados = avaliacoes.map((a) => ({
    data: fmtData(a.data_avaliacao),
    Peso: a.peso ?? null,
    "% Gordura": a.percentual_gordura ?? null,
    "Massa Magra": a.massa_magra ?? null,
  }));

  return (
    <div className="card p-5">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-brand-purple)]">
        Evolução
      </h3>
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={dados} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8edf2" />
            <XAxis dataKey="data" stroke="#475569" fontSize={12} />
            <YAxis stroke="#475569" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "#ffffff",
                border: "1px solid #e8edf2",
                borderRadius: 12,
                color: "#0f172a",
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line type="monotone" dataKey="Peso" stroke="#2563eb" strokeWidth={2} dot />
            <Line type="monotone" dataKey="% Gordura" stroke="#ff8a1e" strokeWidth={2} dot />
            <Line type="monotone" dataKey="Massa Magra" stroke="#16e28a" strokeWidth={2} dot />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
