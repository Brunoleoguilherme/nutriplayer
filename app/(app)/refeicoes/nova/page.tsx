"use client";

import Link from "next/link";
import { ArrowLeft, Utensils } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { MealBuilder } from "@/components/refeicoes/MealBuilder";

export default function NovaRefeicaoPage() {
  return (
    <div>
      <PageHeader
        title="Meal Builder"
        subtitle="Componha uma refeição reutilizável. Macros calculados automaticamente."
        icon={<Utensils className="h-6 w-6" />}
      />
      <MealBuilder />
    </div>
  );
}
