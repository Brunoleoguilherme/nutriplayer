-- 0008: segmenta atletas por time (multi-clube / futura separação de bancos)
-- Cada atleta acompanhado guarda de qual time veio. Default 'bhwolves' para
-- os registros já existentes.
alter table nutriplay.atletas
  add column if not exists team_id text not null default 'bhwolves';

create index if not exists idx_atletas_team_wolves
  on nutriplay.atletas (team_id, wolves_id);
