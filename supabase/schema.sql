-- =====================================================================
-- NUTRIPLAY SPORTS NUTRITION — SCHEMA OFICIAL (FASE 1 / MVP)
-- Módulo de Nutrição Esportiva do BH Wolves Manager
-- ---------------------------------------------------------------------
-- Princípios (Manual Vol. 2A/2B/2C):
--   • Objetos reutilizáveis, 3FN, jamais duplicar informação.
--   • Multi-clube: toda tabela operacional possui clube_id.
--   • UUID em todas as PKs. Soft delete (deleted_at) + flag ativo.
--   • Auditoria: created_at, updated_at, created_by, updated_by.
--   • RLS habilitado em todas as tabelas operacionais.
-- Como usar: rode este arquivo no SQL Editor do Supabase (uma vez).
--
-- COMPARTILHAMENTO DE PROJETO (NutriPlay no mesmo Supabase do BH Wolves):
--   Todas as tabelas ficam no schema "nutriplay" (isolado do "public"), então
--   NÃO colidem com atletas/clubes do BH Wolves. Depois de rodar este arquivo,
--   exponha o schema na API: Dashboard → Project Settings → API →
--   "Exposed schemas" → adicione "nutriplay" (e em Extra search path também).
--   O cliente do app já aponta para o schema (lib/supabase/*).
-- =====================================================================

create extension if not exists "pgcrypto";   -- gen_random_uuid()

-- Schema isolado do NutriPlay
create schema if not exists nutriplay;
set search_path = nutriplay, public;

-- ---------------------------------------------------------------------
-- Trigger utilitário: mantém updated_at sempre atualizado
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =====================================================================
-- DOMÍNIO 1 — INSTITUCIONAL (clubes, usuários, perfis, categorias)
-- =====================================================================

-- CLUBES — cada organização que usa a plataforma (multi-tenant raiz)
create table if not exists clubes (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  nome_fantasia text,
  cnpj         text,
  logo_url     text,
  cidade       text,
  estado       text,
  pais         text default 'Brasil',
  idioma       text default 'pt-BR',
  fuso_horario text default 'America/Sao_Paulo',
  site         text,
  redes_sociais jsonb default '{}'::jsonb,
  plano        text default 'Starter',   -- Starter | Club | Elite | Federacao | Enterprise
  status       text default 'Ativo',
  ativo        boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  deleted_at   timestamptz
);

-- USUÁRIOS — pessoa que faz login (1:1 com auth.users do Supabase)
create table if not exists usuarios (
  id            uuid primary key default gen_random_uuid(),
  auth_user_id  uuid unique references auth.users(id) on delete cascade,
  clube_id      uuid references clubes(id) on delete set null,
  nome          text not null,
  email         text unique not null,
  telefone      text,
  avatar_url    text,
  status        text default 'Ativo',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz
);

-- PERFIS — vínculo usuário↔clube↔papel (um usuário pode ter vários perfis)
-- Papéis: administrador, nutricionista, coach, preparador, medico, diretor, atleta
create table if not exists perfis (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  clube_id    uuid not null references clubes(id) on delete cascade,
  papel       text not null default 'nutricionista',
  permissoes  jsonb default '{}'::jsonb,  -- granular por módulo: {dashboard:{ver:true,...}}
  ativo       boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz,
  unique (user_id, clube_id, papel)
);

-- CATEGORIAS — separação de atletas (Sub-15, Adulto, Flag Fem., etc.)
create table if not exists categorias (
  id          uuid primary key default gen_random_uuid(),
  clube_id    uuid not null references clubes(id) on delete cascade,
  nome        text not null,
  descricao   text,
  ordem       int default 0,
  ativo       boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz,
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id)
);

-- =====================================================================
-- DOMÍNIO 2 — ATLETAS
-- =====================================================================
create table if not exists atletas (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  categoria_id  uuid references categorias(id) on delete set null,
  wolves_id     uuid unique, -- id do atleta no BH Wolves (integração/sync)
  team_id       text not null default 'bhwolves', -- time de origem (multi-clube / futura separação de bancos)
  -- Cadastro básico
  nome          text not null,
  foto_url      text,
  sexo          text,
  data_nascimento date,
  documento     text,
  telefone      text,
  email         text,
  responsavel   text,
  contato_emergencia text,
  endereco      jsonb default '{}'::jsonb,
  -- Informações esportivas
  posicao       text,
  numero        int,
  dominancia    text,
  tempo_pratica text,
  -- Informações médicas
  alergias      text,
  lesoes        text,
  restricoes    text,
  medicamentos  text,
  historico_medico text,
  cirurgias     text,
  -- Informações nutricionais
  peso_atual    numeric(6,2),
  altura_cm     numeric(6,2),
  objetivo      text,
  meta_calorica numeric(8,2),
  preferencias  text,
  alimentos_proibidos text,
  intolerancias text,
  suplementacao text,
  tags          text[] default '{}',
  status        text default 'Ativo',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- =====================================================================
-- DOMÍNIO 3 — NUTRIÇÃO (alimentos, refeições, suplementos, protocolos, planos)
-- =====================================================================

-- ALIMENTOS — base mestre reutilizável (TACO, TBCA, Tucunduva, USDA, própria)
create table if not exists alimentos (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid references clubes(id) on delete cascade, -- null = global/compartilhado
  nome          text not null,
  categoria     text,
  grupo         text,
  subgrupo      text,
  codigo        text,
  fonte         text default 'Própria', -- TACO | TBCA | TUCUNDUVA | USDA | IBGE | Própria | CSV
  imagem_url    text,
  descricao     text,
  -- Porção / medidas (valores nutricionais referenciados a porcao_padrao_g)
  porcao_padrao_g numeric(8,2) default 100,
  medida_caseira text,
  peso_liquido_g numeric(8,2),
  peso_bruto_g   numeric(8,2),
  -- Macronutrientes (por porção padrão)
  calorias      numeric(8,2) default 0,
  proteinas     numeric(8,2) default 0,
  carboidratos  numeric(8,2) default 0,
  gorduras      numeric(8,2) default 0,
  fibras        numeric(8,2) default 0,
  acucares      numeric(8,2) default 0,
  -- Minerais
  sodio         numeric(8,2),
  potassio      numeric(8,2),
  magnesio      numeric(8,2),
  ferro         numeric(8,2),
  zinco         numeric(8,2),
  -- Vitaminas
  vitamina_a    numeric(8,2),
  vitamina_c    numeric(8,2),
  vitamina_d    numeric(8,2),
  vitamina_e    numeric(8,2),
  vitamina_k    numeric(8,2),
  complexo_b    numeric(8,2),
  -- Outros
  colesterol    numeric(8,2),
  omega_3       numeric(8,2),
  omega_6       numeric(8,2),
  indice_glicemico numeric(6,2),
  carga_glicemica  numeric(6,2),
  micronutrientes jsonb default '{}'::jsonb, -- extensível p/ nutrientes adicionais
  observacoes   text,
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- SUPLEMENTOS — catálogo reutilizável
create table if not exists suplementos (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid references clubes(id) on delete cascade,
  nome          text not null,
  marca         text,
  categoria     text,
  dose          text,
  horario       text,
  objetivo      text,
  contraindicacoes text,
  imagem_url    text,
  observacoes   text,
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- PROTOCOLOS — objetos reutilizáveis (recovery, hidratação, etc.)
create table if not exists protocolos (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid references clubes(id) on delete cascade,
  nome          text not null,
  categoria     text,
  objetivo      text,
  descricao     text,
  observacoes   text,
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- REFEIÇÕES — objeto reutilizável (macros calculados a partir dos itens)
create table if not exists refeicoes (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid references clubes(id) on delete cascade,
  nome          text not null,
  categoria     text,
  objetivo      text,
  descricao     text,
  imagem_url    text,
  tempo_preparo_min int,
  observacoes   text,
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- REFEIÇÃO × ALIMENTOS — composição (1 registro = 1 alimento + quantidade)
create table if not exists refeicao_alimentos (
  id           uuid primary key default gen_random_uuid(),
  refeicao_id  uuid not null references refeicoes(id) on delete cascade,
  alimento_id  uuid not null references alimentos(id) on delete restrict,
  quantidade_g numeric(8,2) not null default 0,
  medida_caseira text,
  ordem        int default 0,
  observacao   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- PLANOS ALIMENTARES — aplicados ao atleta, compõem refeições/suplementos
create table if not exists planos_alimentares (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  atleta_id     uuid references atletas(id) on delete cascade,
  nome          text not null,
  objetivo      text,
  observacoes   text,
  meta_calorica numeric(8,2),
  data_inicio   date default current_date,
  data_fim      date,
  status        text default 'Ativo', -- Rascunho | Ativo | Encerrado
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

-- PLANO × REFEIÇÕES — qual refeição em qual horário dentro do plano
create table if not exists plano_refeicoes (
  id           uuid primary key default gen_random_uuid(),
  plano_id     uuid not null references planos_alimentares(id) on delete cascade,
  refeicao_id  uuid not null references refeicoes(id) on delete restrict,
  horario      time,
  periodo      text,        -- Café, Pré-treino, Almoço, etc.
  ordem        int default 0,
  observacao   text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- PLANO × SUPLEMENTOS
create table if not exists plano_suplementos (
  id            uuid primary key default gen_random_uuid(),
  plano_id      uuid not null references planos_alimentares(id) on delete cascade,
  suplemento_id uuid not null references suplementos(id) on delete restrict,
  dose          text,
  horario       text,
  ordem         int default 0,
  observacao    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- PLANO × PROTOCOLOS
create table if not exists plano_protocolos (
  id            uuid primary key default gen_random_uuid(),
  plano_id      uuid not null references planos_alimentares(id) on delete cascade,
  protocolo_id  uuid not null references protocolos(id) on delete restrict,
  ordem         int default 0,
  observacao    text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =====================================================================
-- DOMÍNIO 4 — AVALIAÇÕES
-- =====================================================================
create table if not exists avaliacoes_corporais (
  id                uuid primary key default gen_random_uuid(),
  clube_id          uuid not null references clubes(id) on delete cascade,
  atleta_id         uuid not null references atletas(id) on delete cascade,
  data_avaliacao    date not null default current_date,
  peso              numeric(6,2),
  altura_cm         numeric(6,2),
  percentual_gordura numeric(5,2),
  massa_magra       numeric(6,2),
  massa_gorda       numeric(6,2),
  imc               numeric(5,2),
  circunferencias   jsonb default '{}'::jsonb, -- {braco, cintura, quadril, coxa, ...}
  dobras            jsonb default '{}'::jsonb, -- {triceps, subescapular, ...}
  fotos             text[] default '{}',
  observacoes       text,
  ativo             boolean default true,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now(),
  deleted_at        timestamptz,
  created_by        uuid references auth.users(id),
  updated_by        uuid references auth.users(id)
);

-- =====================================================================
-- DOMÍNIO 5 — PERFORMANCE (Game Day) — FASE 2
-- =====================================================================
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
  status        text default 'Planejado',
  tags          text[] default '{}',
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table if not exists game_day_itens (
  id            uuid primary key default gen_random_uuid(),
  game_day_id   uuid not null references game_days(id) on delete cascade,
  horario       time,
  titulo        text not null,
  tipo          text default 'Refeição',
  refeicao_id   uuid references refeicoes(id) on delete set null,
  suplemento_id uuid references suplementos(id) on delete set null,
  descricao     text,
  responsavel   text,
  ordem         int default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- =====================================================================
-- DOMÍNIO 5 — PERFORMANCE / APP DO ATLETA (hidratação + fotos) — FASE 3
-- =====================================================================
create table if not exists hidratacao_registros (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  atleta_id     uuid not null references atletas(id) on delete cascade,
  data          date not null default current_date,
  quantidade_ml int not null default 0,
  origem        text default 'app',
  created_at    timestamptz default now()
);

create table if not exists fotos_atleta (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  url          text not null,
  storage_path text,
  data         date not null default current_date,
  tipo         text default 'Frente',
  observacao   text,
  ativo        boolean default true,
  created_at   timestamptz default now(),
  deleted_at   timestamptz
);

-- RLS própria (estas tabelas não possuem updated_at, ficam fora do array geral)
alter table hidratacao_registros enable row level security;
alter table fotos_atleta enable row level security;
do $$ begin
  create policy "mvp_authenticated_all" on hidratacao_registros
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "mvp_authenticated_all" on fotos_atleta
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- =====================================================================
-- DOMÍNIO 6 — MARKETPLACE / COMPRAS — FASE 5
-- =====================================================================
create table if not exists fornecedores (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  nome         text not null,
  cnpj         text,
  contato_nome text,
  email        text,
  telefone     text,
  site         text,
  observacoes  text,
  ativo        boolean default true,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  deleted_at   timestamptz,
  created_by   uuid references auth.users(id),
  updated_by   uuid references auth.users(id)
);

create table if not exists produtos (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  suplemento_id uuid references suplementos(id) on delete set null,
  nome          text not null,
  categoria     text,
  marca         text,
  descricao     text,
  imagem_url    text,
  unidade       text default 'un',
  preco         numeric(12,2) default 0,
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table if not exists pedidos (
  id            uuid primary key default gen_random_uuid(),
  clube_id      uuid not null references clubes(id) on delete cascade,
  fornecedor_id uuid references fornecedores(id) on delete set null,
  codigo        text,
  status        text default 'Rascunho',
  data_pedido   date default current_date,
  total         numeric(12,2) default 0,
  observacoes   text,
  ativo         boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  deleted_at    timestamptz,
  created_by    uuid references auth.users(id),
  updated_by    uuid references auth.users(id)
);

create table if not exists pedido_itens (
  id              uuid primary key default gen_random_uuid(),
  pedido_id       uuid not null references pedidos(id) on delete cascade,
  produto_id      uuid references produtos(id) on delete set null,
  nome            text not null,
  quantidade      numeric(12,2) not null default 1,
  preco_unitario  numeric(12,2) not null default 0,
  subtotal        numeric(12,2) not null default 0,
  ordem           int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- =====================================================================
-- DOMÍNIO 7 — WEARABLES — FASE 6
-- =====================================================================
create table if not exists wearable_conexoes (
  id           uuid primary key default gen_random_uuid(),
  clube_id     uuid not null references clubes(id) on delete cascade,
  atleta_id    uuid not null references atletas(id) on delete cascade,
  provedor     text not null,
  status       text default 'pendente',
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
  origem       text default 'manual',
  passos       int,
  calorias     int,
  distancia_km numeric(8,2),
  fc_repouso   int,
  fc_max       int,
  hrv_ms       int,
  sono_min     int,
  sono_score   int,
  prontidao    int,
  meta         jsonb default '{}'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (atleta_id, data, origem)
);

-- =====================================================================
-- DOMÍNIO 8 — PREDIÇÕES / ML — FASE 7
-- =====================================================================
create table if not exists ml_predicoes (
  id         uuid primary key default gen_random_uuid(),
  clube_id   uuid not null references clubes(id) on delete cascade,
  atleta_id  uuid not null references atletas(id) on delete cascade,
  data       date not null default current_date,
  tipo       text not null,
  score      int not null default 0,
  nivel      text,
  resumo     text,
  fatores    jsonb default '[]'::jsonb,
  modelo     text default 'heuristico-v1',
  created_at timestamptz default now()
);

alter table ml_predicoes enable row level security;
do $$ begin
  create policy "mvp_authenticated_all" on ml_predicoes
    for all to authenticated using (true) with check (true);
exception when duplicate_object then null; end $$;

-- =====================================================================
-- ÍNDICES (Manual Vol. 2C cap. 7)
-- =====================================================================
create index if not exists idx_atletas_clube      on atletas(clube_id) where deleted_at is null;
create index if not exists idx_atletas_categoria   on atletas(categoria_id);
create index if not exists idx_atletas_nome        on atletas(nome);
create index if not exists idx_alimentos_clube     on alimentos(clube_id);
create index if not exists idx_alimentos_nome      on alimentos(nome);
create index if not exists idx_alimentos_fonte     on alimentos(fonte);
create index if not exists idx_alimentos_codigo    on alimentos(codigo);
create index if not exists idx_refeicoes_clube     on refeicoes(clube_id);
create index if not exists idx_refalim_refeicao    on refeicao_alimentos(refeicao_id);
create index if not exists idx_refalim_alimento    on refeicao_alimentos(alimento_id);
create index if not exists idx_planos_clube        on planos_alimentares(clube_id);
create index if not exists idx_planos_atleta       on planos_alimentares(atleta_id);
create index if not exists idx_avaliacoes_atleta   on avaliacoes_corporais(atleta_id);
create index if not exists idx_avaliacoes_data     on avaliacoes_corporais(data_avaliacao);
create index if not exists idx_perfis_user         on perfis(user_id);
create index if not exists idx_perfis_clube        on perfis(clube_id);
create index if not exists idx_gamedays_clube      on game_days(clube_id) where deleted_at is null;
create index if not exists idx_gamedays_data       on game_days(data_evento);
create index if not exists idx_gameitens_gameday   on game_day_itens(game_day_id);
create index if not exists idx_hidratacao_atleta   on hidratacao_registros(atleta_id, data);
create index if not exists idx_fotos_atleta        on fotos_atleta(atleta_id) where deleted_at is null;
create index if not exists idx_fornecedores_clube  on fornecedores(clube_id) where deleted_at is null;
create index if not exists idx_produtos_clube      on produtos(clube_id) where deleted_at is null;
create index if not exists idx_produtos_fornecedor on produtos(fornecedor_id);
create index if not exists idx_pedidos_clube       on pedidos(clube_id) where deleted_at is null;
create index if not exists idx_pedidoitens_pedido  on pedido_itens(pedido_id);
create index if not exists idx_wear_conexoes_atleta on wearable_conexoes(atleta_id);
create index if not exists idx_wear_metricas_atleta on wearable_metricas(atleta_id, data);
create index if not exists idx_ml_predicoes_atleta on ml_predicoes(atleta_id, data);

-- =====================================================================
-- TRIGGERS updated_at
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'clubes','usuarios','perfis','categorias','atletas','alimentos','suplementos',
    'protocolos','refeicoes','refeicao_alimentos','planos_alimentares','plano_refeicoes',
    'plano_suplementos','plano_protocolos','avaliacoes_corporais',
    'game_days','game_day_itens',
    'fornecedores','produtos','pedidos','pedido_itens',
    'wearable_conexoes','wearable_metricas'
  ] loop
    execute format('drop trigger if exists trg_%s_updated on %I;', t, t);
    execute format('create trigger trg_%s_updated before update on %I
                    for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- =====================================================================
-- ROW LEVEL SECURITY
-- =====================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'clubes','usuarios','perfis','categorias','atletas','alimentos','suplementos',
    'protocolos','refeicoes','refeicao_alimentos','planos_alimentares','plano_refeicoes',
    'plano_suplementos','plano_protocolos','avaliacoes_corporais',
    'game_days','game_day_itens',
    'fornecedores','produtos','pedidos','pedido_itens',
    'wearable_conexoes','wearable_metricas'
  ] loop
    execute format('alter table %I enable row level security;', t);
  end loop;
end $$;

-- Helper: retorna os clube_id que o usuário logado pode acessar
create or replace function user_clube_ids()
returns setof uuid
language sql stable security definer set search_path = nutriplay, public as $$
  select clube_id from perfis where user_id = auth.uid() and ativo = true;
$$;

-- ---------------------------------------------------------------------
-- POLÍTICA MVP (Manual Vol. 2C §4): aberta para autenticados.
-- TROCAR pela política multi-clube (§5, abaixo) antes de produção.
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'clubes','usuarios','perfis','categorias','atletas','alimentos','suplementos',
    'protocolos','refeicoes','refeicao_alimentos','planos_alimentares','plano_refeicoes',
    'plano_suplementos','plano_protocolos','avaliacoes_corporais',
    'game_days','game_day_itens',
    'fornecedores','produtos','pedidos','pedido_itens',
    'wearable_conexoes','wearable_metricas'
  ] loop
    execute format('drop policy if exists "mvp_authenticated_all" on %I;', t);
    execute format('create policy "mvp_authenticated_all" on %I
                    for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- POLÍTICA FINAL MULTI-CLUBE (Manual Vol. 2C §5) — ATIVAR EM PRODUÇÃO
-- Exemplo para a tabela atletas; replicar para cada tabela com clube_id:
--
--   drop policy if exists "mvp_authenticated_all" on atletas;
--   create policy "clube_isolation" on atletas for all to authenticated
--     using (clube_id in (select user_clube_ids()))
--     with check (clube_id in (select user_clube_ids()));
--
-- Para alimentos/refeicoes/suplementos/protocolos (que aceitam itens globais):
--   using (clube_id is null or clube_id in (select user_clube_ids()))
-- ---------------------------------------------------------------------

-- =====================================================================
-- STORAGE — bucket de fotos de evolução (FASE 3)
-- (Storage fica no schema 'storage', independente do search_path.)
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('evolucao', 'evolucao', true)
on conflict (id) do nothing;

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

-- =====================================================================
-- GRANTS + POLÍTICAS MVP PARA anon/authenticated (schema customizado)
-- Necessário ao expor o schema "nutriplay" na Data API do Supabase.
-- Sem isto, as chamadas dão 401/permission denied.
-- =====================================================================
set search_path = nutriplay, public;

grant usage on schema nutriplay to anon, authenticated, service_role;
grant all on all tables    in schema nutriplay to anon, authenticated, service_role;
grant all on all sequences in schema nutriplay to anon, authenticated, service_role;
grant all on all routines  in schema nutriplay to anon, authenticated, service_role;
alter default privileges in schema nutriplay grant all on tables    to anon, authenticated, service_role;
alter default privileges in schema nutriplay grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema nutriplay grant all on routines  to anon, authenticated, service_role;

do $$
declare t text;
begin
  foreach t in array array[
    'clubes','usuarios','perfis','categorias','atletas','alimentos','suplementos',
    'protocolos','refeicoes','refeicao_alimentos','planos_alimentares','plano_refeicoes',
    'plano_suplementos','plano_protocolos','avaliacoes_corporais',
    'game_days','game_day_itens','fornecedores','produtos','pedidos','pedido_itens',
    'wearable_conexoes','wearable_metricas','hidratacao_registros','fotos_atleta','ml_predicoes'
  ] loop
    begin
      execute format('drop policy if exists "mvp_authenticated_all" on %I;', t);
      execute format('drop policy if exists "mvp_public_all" on %I;', t);
      execute format('create policy "mvp_public_all" on %I for all to anon, authenticated using (true) with check (true);', t);
    exception when undefined_table then null;
    end;
  end loop;
end $$;
