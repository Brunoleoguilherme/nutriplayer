-- =====================================================================
-- NUTRIPLAY — MIGRATION FASE 5: MARKETPLACE / FORNECEDORES / COMPRAS
-- Rode no SQL Editor do Supabase. (Também consta no schema.sql.)
-- Obs.: pedidos são registros internos de organização — sem pagamento.
-- =====================================================================

create table if not exists fornecedores (
  id          uuid primary key default gen_random_uuid(),
  clube_id    uuid not null references clubes(id) on delete cascade,
  nome        text not null,
  cnpj        text,
  contato_nome text,
  email       text,
  telefone    text,
  site        text,
  observacoes text,
  ativo       boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  deleted_at  timestamptz,
  created_by  uuid references auth.users(id),
  updated_by  uuid references auth.users(id)
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
  unidade       text default 'un',     -- un | kg | cx | pote | l
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
  status        text default 'Rascunho', -- Rascunho | Enviado | Recebido | Cancelado
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
  nome            text not null,        -- snapshot do nome no momento do pedido
  quantidade      numeric(12,2) not null default 1,
  preco_unitario  numeric(12,2) not null default 0,
  subtotal        numeric(12,2) not null default 0,
  ordem           int default 0,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

create index if not exists idx_fornecedores_clube on fornecedores(clube_id) where deleted_at is null;
create index if not exists idx_produtos_clube on produtos(clube_id) where deleted_at is null;
create index if not exists idx_produtos_fornecedor on produtos(fornecedor_id);
create index if not exists idx_pedidos_clube on pedidos(clube_id) where deleted_at is null;
create index if not exists idx_pedidoitens_pedido on pedido_itens(pedido_id);

-- updated_at triggers (set_updated_at já existe no schema.sql)
do $$
declare t text;
begin
  foreach t in array array['fornecedores','produtos','pedidos','pedido_itens'] loop
    execute format('drop trigger if exists trg_%s_updated on %I;', t, t);
    execute format('create trigger trg_%s_updated before update on %I
                    for each row execute function set_updated_at();', t, t);
  end loop;
end $$;

-- RLS
do $$
declare t text;
begin
  foreach t in array array['fornecedores','produtos','pedidos','pedido_itens'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "mvp_authenticated_all" on %I;', t);
    execute format('create policy "mvp_authenticated_all" on %I
                    for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;
