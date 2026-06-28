import { z } from "zod";

const optionalNumber = z
  .union([z.number(), z.nan()])
  .optional()
  .transform((v) => (v == null || Number.isNaN(v) ? null : v));

export const atletaSchema = z.object({
  // Básico
  nome: z.string().min(2, "Informe o nome"),
  sexo: z.string().optional().nullable(),
  data_nascimento: z.string().optional().nullable(),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("")),
  telefone: z.string().optional().nullable(),
  documento: z.string().optional().nullable(),
  // Esportivo
  categoria_id: z.string().uuid().optional().nullable().or(z.literal("")),
  posicao: z.string().optional().nullable(),
  numero: optionalNumber,
  dominancia: z.string().optional().nullable(),
  status: z.string().default("Ativo"),
  // Médico
  alergias: z.string().optional().nullable(),
  lesoes: z.string().optional().nullable(),
  restricoes: z.string().optional().nullable(),
  medicamentos: z.string().optional().nullable(),
  // Nutricional
  peso_atual: optionalNumber,
  altura_cm: optionalNumber,
  objetivo: z.string().optional().nullable(),
  meta_calorica: optionalNumber,
  intolerancias: z.string().optional().nullable(),
  alimentos_proibidos: z.string().optional().nullable(),
});

export type AtletaFormInput = z.input<typeof atletaSchema>;
export type AtletaFormData = z.output<typeof atletaSchema>;
