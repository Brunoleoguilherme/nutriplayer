-- =====================================================================
-- NUTRIPLAY — MIGRATION FASE 6: WEARABLES
-- Garmin, Polar, Apple Health, Google Fit (agnóstico de provedor).
-- A camada de dados/ingestão é pronta; a sincronização real de cada
-- provedor depende de OAuth + credenciais de parceiro (ver /api/wearables/ingest).
-- =====================================================================

create table if not exists wearable_conexoes (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  provedor     text not null,            -- garmin | polar | apple | google | manual
  status       text default 'pendente',  -- conectado | desconectado | pendente
  external_user_id text,
  ultimo_sync  timestamptz,
  meta         jsonb default '{}'::jsonb,
  ativo        boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  deleted_at   timestamptz,
  unique (atleta_id, provedor)
);

create table if not exists wearable_metricas (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  data         date not null default current_date,
  origem       text default 'manual',    -- garmin | polar | apple | google | manual
  passos       int,
  calorias     int,
  distancia_km numeric(8,2),
  fc_repouso   int,                       -- batimentos repouso (bpm)
  fc_max       int,
  hrv_ms       int,                       -- variabilidade (ms)
  sono_min     int,                       -- minutos de sono
  sono_score   int,                       -- 0-100
  prontidao    int,                       -- readiness/recovery 0-100
  meta         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (atleta_id, data, origem)
);

create index if not exists idx_wear_conexoes_atleta on wearable_conexoes(atleta_id);
create index if not exists idx_wear_metricas_atleta on wearable_metricas(atleta_id, data);

do $$
declare t text;
begin
  foreach t in array array['wearable_conexoes','wearable_metricas'] loop
    execute format('drop trigger if exists trg_%s_updated on %I;', t, t);
    execute format('create trigger trg_%s_updated before update on %I
                    for each row execute function set_updated_at();', t, t);
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "mvp_authenticated_all" on %I;', t);
    execute format('create policy "mvp_authenticated_all" on %I
                    for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;
