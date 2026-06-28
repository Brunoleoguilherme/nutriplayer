-- =====================================================================
-- NUTRIPLAY — INTEGRAÇÃO: importar atletas do BH Wolves (mesmo Supabase)
-- Os atletas do BH Wolves ficam em public.atletas. O NutriPlay copia/sincroniza
-- para nutriplay.atletas, guardando wolves_id (id de origem) para não duplicar.
-- Rode no SQL Editor (depois do schema.sql).
-- =====================================================================

set search_path = nutriplay, public;

alter table nutriplay.atletas add column if not exists wolves_id uuid;

-- Unique (não-parcial): permite vários NULL, mas impede duplicar o mesmo atleta do Wolves
create unique index if not exists uq_atletas_wolves_id
  on nutriplay.atletas (wolves_id);
