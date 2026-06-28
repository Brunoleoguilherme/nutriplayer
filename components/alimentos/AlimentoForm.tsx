"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { Alimento } from "@/types";
import {
  alimentoSchema,
  type AlimentoFormData,
  type AlimentoFormInput,
} from "@/schemas/alimento";
import { alimentosService } from "@/services/alimentos";
import { getClubeAtivo } from "@/lib/club";
import { FONTES_ALIMENTO } from "@/lib/constants";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";

export function AlimentoForm({
  alimento,
  onSaved,
  onCancel,
}: {
  alimento?: Alimento;
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AlimentoFormInput, unknown, AlimentoFormData>({
    resolver: zodResolver(alimentoSchema),
    defaultValues: {
      nome: alimento?.nome ?? "",
      categoria: alimento?.categoria ?? "",
      grupo: alimento?.grupo ?? "",
      fonte: alimento?.fonte ?? "Própria",
      codigo: alimento?.codigo ?? "",
      porcao_padrao_g: alimento?.porcao_padrao_g ?? 100,
      medida_caseira: alimento?.medida_caseira ?? "",
      calorias: alimento?.calorias ?? 0,
      proteinas: alimento?.proteinas ?? 0,
      carboidratos: alimento?.carboidratos ?? 0,
      gorduras: alimento?.gorduras ?? 0,
      fibras: alimento?.fibras ?? 0,
      sodio: alimento?.sodio ?? 0,
      observacoes: alimento?.observacoes ?? "",
    },
  });

  async function onSubmit(data: AlimentoFormData) {
    try {
      const payload = { ...data, clube_id: getClubeAtivo() };
      if (alimento) {
        await alimentosService.update(alimento.id, payload as Partial<Alimento>);
        toast.success("Alimento atualizado");
      } else {
        await alimentosService.create(payload as Partial<Alimento>);
        toast.success("Alimento cadastrado");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  const numField = (name: keyof AlimentoFormInput) =>
    register(name, { valueAsNumber: true });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome *" error={errors.nome?.message} className="sm:col-span-2">
          <Input {...register("nome")} placeholder="Ex.: Arroz branco cozido" />
        </FormField>
        <FormField label="Categoria">
          <Input {...register("categoria")} placeholder="Cereais, Carnes..." />
        </FormField>
        <FormField label="Fonte">
          <Select {...register("fonte")}>
            {FONTES_ALIMENTO.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Porção padrão (g)">
          <Input type="number" step="0.1" {...numField("porcao_padrao_g")} />
        </FormField>
        <FormField label="Medida caseira">
          <Input {...register("medida_caseira")} placeholder="4 colheres de sopa" />
        </FormField>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">
          Macronutrientes (por porção padrão)
        </h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <FormField label="Calorias (kcal)">
            <Input type="number" step="0.1" {...numField("calorias")} />
          </FormField>
          <FormField label="Proteínas (g)">
            <Input type="number" step="0.1" {...numField("proteinas")} />
          </FormField>
          <FormField label="Carboidratos (g)">
            <Input type="number" step="0.1" {...numField("carboidratos")} />
          </FormField>
          <FormField label="Gorduras (g)">
            <Input type="number" step="0.1" {...numField("gorduras")} />
          </FormField>
          <FormField label="Fibras (g)">
            <Input type="number" step="0.1" {...numField("fibras")} />
          </FormField>
          <FormField label="Sódio (mg)">
            <Input type="number" step="0.1" {...numField("sodio")} />
          </FormField>
        </div>
      </div>

      <FormField label="Observações">
        <Textarea {...register("observacoes")} />
      </FormField>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : alimento ? "Salvar" : "Cadastrar alimento"}
        </Button>
      </div>
    </form>
  );
}
