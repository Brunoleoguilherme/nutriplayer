-- =====================================================================
-- NUTRIPLAY — MIGRATION FASE 3: APP DO ATLETA (hidratação + fotos)
-- Rode no SQL Editor do Supabase.
-- =====================================================================

-- HIDRATAÇÃO — 1 registro por ingestão de líquido
create table if not exists hidratacao_registros (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  data         date not null default current_date,
  quantidade_ml int not null default 0,
  origem       text default 'app', -- app | manual
  created_at   timestamptz default now()
);

-- FOTOS DE EVOLUÇÃO — metadados; arquivo no Supabase Storage (bucket 'evolucao')
create table if not exists fotos_atleta (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  url          text not null,
  storage_path text,
  data         date not null default current_date,
  tipo         text default 'Frente', -- Frente | Lado | Costas | Outro
  observacao   text,
  ativo        boolean default true,
  created_at   timestamptz default now(),
  deleted_at   timestamptz
);

create index if not exists idx_hidratacao_atleta on hidratacao_registros(atleta_id, data);
create index if not exists idx_fotos_atleta on fotos_atleta(atleta_id) where deleted_at is null;

-- RLS
alter table hidratacao_registros enable row level security;
alter table fotos_atleta enable row level security;

drop policy if exists "mvp_authenticated_all" on hidratacao_registros;
create policy "mvp_authenticated_all" on hidratacao_registros
  for all to authenticated using (true) with check (true);

drop policy if exists "mvp_authenticated_all" on fotos_atleta;
create policy "mvp_authenticated_all" on fotos_atleta
  for all to authenticated using (true) with check (true);

-- =====================================================================
-- STORAGE — bucket de fotos de evolução
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('evolucao', 'evolucao', true)
on conflict (id) do nothing;

-- Política de upload/leitura para autenticados (MVP).
-- Em produção, restringir por clube/atleta.
do $$ begin
  create policy "evolucao_select" on storage.objects
    for select to authenticated using (bucket_id = 'evolucao');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "evolucao_insert" on storage.objects
    for insert to authenticated with check (bucket_id = 'evolucao');
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "evolucao_delete" on storage.objects
    for delete to authenticated using (bucket_id = 'evolucao');
exception when duplicate_object then null; end $$;
