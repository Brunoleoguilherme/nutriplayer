import { z } from "zod";

const num = (def = 0) =>
  z
    .union([z.number(), z.nan()])
    .optional()
    .transform((v) => (v == null || Number.isNaN(v) ? def : v));

export const alimentoSchema = z.object({
  nome: z.string().min(2, "Informe o nome"),
  categoria: z.string().optional().nullable(),
  grupo: z.string().optional().nullable(),
  fonte: z.string().default("Própria"),
  codigo: z.string().optional().nullable(),
  porcao_padrao_g: num(100),
  medida_caseira: z.string().optional().nullable(),
  calorias: num(0),
  proteinas: num(0),
  carboidratos: num(0),
  gorduras: num(0),
  fibras: num(0),
  sodio: num(0),
  observacoes: z.string().optional().nullable(),
});

export type AlimentoFormInput = z.input<typeof alimentoSchema>;
export type AlimentoFormData = z.output<typeof alimentoSchema>;
