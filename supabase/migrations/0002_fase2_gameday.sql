-- =====================================================================
-- NUTRIPLAY — MIGRATION FASE 2: GAME DAY
-- Rode no SQL Editor do Supabase se já tiver executado schema.sql antes.
-- (As tabelas também já constam no schema.sql para instalações novas.)
-- =====================================================================

-- GAME DAYS — eventos/jogos com cronograma nutricional
create table if not exists game_days (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  categoria_id  uuid references categorias(id) on delete set null,
  titulo        text not null,
  data_evento   date not null,
  horario_evento time,
  adversario    text,
  local_evento  text,
  objetivo      text,
  observacoes   text,
  status        text default 'Planejado', -- Planejado | Concluído
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- GAME DAY ITENS — cronograma (1 registro = 1 ação no tempo)
create table if not exists game_day_itens (
  id            uuid primary key default gen_random_uuid(),
  game_day_id   uuid not null references game_days(id) on delete cascade,
  horario       time,
  titulo        text not null,
  tipo          text default 'Refeição', -- Refeição | Hidratação | Suplemento | Recovery | Outro
  refeicao_id   uuid references refeicoes(id) on delete set null,
  suplemento_id uuid references suplementos(id) on delete set null,
  descricao     text,
  responsavel   text,
  ordem         int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_gamedays_clube  on game_days(clube_id) where deleted_at is null;
create index if not exists idx_gamedays_data    on game_days(data_evento);
create index if not exists idx_gameitens_gameday on game_day_itens(game_day_id);

-- updated_at triggers (set_updated_at já existe no schema.sql)
drop trigger if exists trg_game_days_updated on game_days;
create trigger trg_game_days_updated before update on game_days
  for each row execute function set_updated_at();
drop trigger if exists trg_game_day_itens_updated on game_day_itens;
create trigger trg_game_day_itens_updated before update on game_day_itens
  for each row execute function set_updated_at();

-- RLS
alter table game_days enable row level security;
alter table game_day_itens enable row level security;

drop policy if exists "mvp_authenticated_all" on game_days;
create policy "mvp_authenticated_all" on game_days
  for all to authenticated using (true) with check (true);

drop policy if exists "mvp_authenticated_all" on game_day_itens;
create policy "mvp_authenticated_all" on game_day_itens
  for all to authenticated using (true) with check (true);

-- Seed opcional: protocolos (incl. Recovery) + um game day exemplo
insert into protocolos (clube_id, nome, categoria, objetivo, descricao) values
('00000000-0000-0000-0000-000000000001', 'Recovery Pós-Jogo', 'Recovery', 'Recuperação muscular e reidratação', 'Janela anabólica: proteína + carboidrato + hidratação nas 2h pós-jogo.'),
('00000000-0000-0000-0000-000000000001', 'Hidratação Pré-Jogo', 'Hidratação', 'Euidratação antes do evento', '500ml de isotônico 2h antes; 250ml 30min antes.')
on conflict do nothing;
