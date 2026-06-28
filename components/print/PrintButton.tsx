"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="no-print fixed right-6 top-6 inline-flex items-center gap-2 rounded-[10px] bg-black px-4 py-2 text-sm font-medium text-white shadow-lg transition-opacity hover:opacity-90"
    >
      <Printer className="h-4 w-4" /> Imprimir / Salvar PDF
    </button>
  );
}
