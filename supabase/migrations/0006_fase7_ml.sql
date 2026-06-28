-- =====================================================================
-- NUTRIPLAY — MIGRATION FASE 7: PREDIÇÕES (ML)
-- Armazena snapshots das predições (prontidão, risco de lesão, performance).
-- Os modelos atuais são heurísticos (utils/ml.ts); esta tabela também serve
-- de base de histórico para treinar modelos reais no futuro.
-- =====================================================================

create table if not exists ml_predicoes (
  id         uuid primary key default gen_random_uuid(),
  clube_id   uuid not null references clubes(id) on delete cascade,
  atleta_id  uuid not null references atletas(id) on delete cascade,
  data       date not null default current_date,
  tipo       text not null,            -- prontidao | risco_lesao | performance
  score      int not null default 0,   -- 0-100
  nivel      text,                      -- baixo | moderado | alto
  resumo     text,
  fatores    jsonb default '[]'::jsonb,
  modelo     text default 'heuristico-v1',
  created_at timestamptz default now()
);

create index if not exists idx_ml_predicoes_atleta on ml_predicoes(atleta_id, data);

alter table ml_predicoes enable row level security;
do $$ begin
  create policy "mvp_authenticated_all" on ml_predicoes
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
