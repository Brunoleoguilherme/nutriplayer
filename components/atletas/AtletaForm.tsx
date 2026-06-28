"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import type { Atleta, Categoria } from "@/types";
import {
  atletaSchema,
  type AtletaFormData,
  type AtletaFormInput,
} from "@/schemas/atleta";
import { atletasService } from "@/services/atletas";
import { getClubeAtivo } from "@/lib/club";
import { Button } from "@/components/ui/Button";
import { FormField, Input, Select, Textarea } from "@/components/ui/Field";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-brand-purple)]">
        {title}
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

export function AtletaForm({
  atleta,
  categorias = [],
  onSaved,
  onCancel,
}: {
  atleta?: Atleta;
  categorias?: Categoria[];
  onSaved: () => void;
  onCancel?: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AtletaFormInput, unknown, AtletaFormData>({
    resolver: zodResolver(atletaSchema),
    defaultValues: {
      nome: atleta?.nome ?? "",
      sexo: atleta?.sexo ?? "",
      data_nascimento: atleta?.data_nascimento ?? "",
      email: atleta?.email ?? "",
      telefone: atleta?.telefone ?? "",
      documento: atleta?.documento ?? "",
      categoria_id: atleta?.categoria_id ?? "",
      posicao: atleta?.posicao ?? "",
      numero: atleta?.numero ?? undefined,
      dominancia: atleta?.dominancia ?? "",
      status: atleta?.status ?? "Ativo",
      alergias: atleta?.alergias ?? "",
      lesoes: atleta?.lesoes ?? "",
      restricoes: atleta?.restricoes ?? "",
      medicamentos: atleta?.medicamentos ?? "",
      peso_atual: atleta?.peso_atual ?? undefined,
      altura_cm: atleta?.altura_cm ?? undefined,
      objetivo: atleta?.objetivo ?? "",
      meta_calorica: atleta?.meta_calorica ?? undefined,
      intolerancias: atleta?.intolerancias ?? "",
      alimentos_proibidos: atleta?.alimentos_proibidos ?? "",
    },
  });

  async function onSubmit(data: AtletaFormData) {
    try {
      const payload = {
        ...data,
        categoria_id: data.categoria_id || null,
        clube_id: getClubeAtivo(),
      };
      if (atleta) {
        await atletasService.update(atleta.id, payload as Partial<Atleta>);
        toast.success("Atleta atualizado");
      } else {
        await atletasService.create(payload as Partial<Atleta>);
        toast.success("Atleta cadastrado");
      }
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao salvar");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Section title="Cadastro básico">
        <FormField label="Nome *" error={errors.nome?.message} className="sm:col-span-2">
          <Input {...register("nome")} placeholder="Nome completo" />
        </FormField>
        <FormField label="Sexo">
          <Select {...register("sexo")}>
            <option value="">—</option>
            <option value="Masculino">Masculino</option>
            <option value="Feminino">Feminino</option>
          </Select>
        </FormField>
        <FormField label="Data de nascimento">
          <Input type="date" {...register("data_nascimento")} />
        </FormField>
        <FormField label="E-mail" error={errors.email?.message}>
          <Input type="email" {...register("email")} placeholder="atleta@email.com" />
        </FormField>
        <FormField label="Telefone">
          <Input {...register("telefone")} placeholder="(31) 99999-9999" />
        </FormField>
        <FormField label="Documento">
          <Input {...register("documento")} placeholder="CPF / RG" />
        </FormField>
      </Section>

      <Section title="Informações esportivas">
        <FormField label="Categoria">
          <Select {...register("categoria_id")}>
            <option value="">—</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Posição">
          <Input {...register("posicao")} placeholder="QB, WR, RB..." />
        </FormField>
        <FormField label="Número">
          <Input type="number" {...register("numero", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Dominância">
          <Select {...register("dominancia")}>
            <option value="">—</option>
            <option value="Destro">Destro</option>
            <option value="Canhoto">Canhoto</option>
            <option value="Ambidestro">Ambidestro</option>
          </Select>
        </FormField>
        <FormField label="Status">
          <Select {...register("status")}>
            <option value="Ativo">Ativo</option>
            <option value="Atenção">Atenção</option>
            <option value="Inativo">Inativo</option>
          </Select>
        </FormField>
      </Section>

      <Section title="Informações médicas">
        <FormField label="Alergias">
          <Input {...register("alergias")} />
        </FormField>
        <FormField label="Lesões">
          <Input {...register("lesoes")} />
        </FormField>
        <FormField label="Restrições">
          <Input {...register("restricoes")} />
        </FormField>
        <FormField label="Medicamentos">
          <Input {...register("medicamentos")} />
        </FormField>
      </Section>

      <Section title="Informações nutricionais">
        <FormField label="Peso atual (kg)">
          <Input type="number" step="0.1" {...register("peso_atual", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Altura (cm)">
          <Input type="number" step="0.1" {...register("altura_cm", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Objetivo">
          <Input {...register("objetivo")} placeholder="Performance, ganho de massa..." />
        </FormField>
        <FormField label="Meta calórica (kcal)">
          <Input type="number" {...register("meta_calorica", { valueAsNumber: true })} />
        </FormField>
        <FormField label="Intolerâncias" className="sm:col-span-2">
          <Input {...register("intolerancias")} />
        </FormField>
        <FormField label="Alimentos proibidos" className="sm:col-span-2">
          <Textarea {...register("alimentos_proibidos")} />
        </FormField>
      </Section>

      <div className="flex justify-end gap-2 border-t border-[var(--color-border)] pt-4">
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : atleta ? "Salvar alterações" : "Cadastrar atleta"}
        </Button>
      </div>
    </form>
  );
}
