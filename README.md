# NutriPlay — Sports Nutrition

Plataforma de nutrição esportiva do ecossistema **BH Wolves Manager**.
Sistema multi-clube, normalizado e preparado para escalar (SaaS).

> Documento de referência: `MANUAL OFICIAL DE DESENVOLVIMENTO`.
> Toda evolução deve preservar a filosofia de **objetos reutilizáveis**,
> **multi-clube** e **experiência premium** definida no manual.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Supabase** (Postgres + Auth + RLS)
- **TailwindCSS v4** (design tokens dark premium)
- React Hook Form + Zod · Recharts · Papa Parse · Lucide React · Framer Motion · React Hot Toast

## Setup (VS Code)

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Configure o ambiente. Copie `.env.example` para `.env.local` e preencha com as
   chaves do Supabase:

   ```bash
   cp .env.example .env.local
   ```

3. Crie o banco. No **SQL Editor** do Supabase, rode em ordem:
   - `supabase/schema.sql` (cria o schema `nutriplay` com tudo: tabelas, índices,
     triggers, RLS e o bucket de storage)
   - `supabase/seed.sql` (dados de exemplo — opcional, só para dev)

4. **Exponha o schema na API**: Dashboard → Project Settings → API →
   *Exposed schemas* → adicione `nutriplay` (e em *Extra search path* também). Salve.

5. Rode o projeto:

   ```bash
   npm run dev
   ```

> **Compartilhando o Supabase do BH Wolves (1 projeto só):** como as tabelas do
> NutriPlay ficam no schema isolado `nutriplay`, é seguro usar o **mesmo** projeto
> Supabase do BH Wolves — não há colisão com o `public`. Basta usar as chaves desse
> projeto no `.env.local`, rodar `schema.sql` + `seed.sql` e expor o schema (passo 4).
> Bônus: o `auth.users` passa a ser compartilhado, o que facilita o login único no futuro.
> Para separar depois (mais clientes), migre o schema `nutriplay` para um projeto próprio.

## Estrutura de pastas (Manual: padrão de desenvolvimento)

```
app/                Rotas (App Router). Nunca colocar lógica de dados aqui.
components/         Componentes de UI reutilizáveis (components/ui/*).
hooks/              Hooks de dados/estado (ex.: useAtletas).
services/           Acesso a dados (CRUD). Única camada que fala com o Supabase.
types/              Tipos de domínio (espelham o schema).
utils/              Funções puras (cálculo de macros, formatação).
lib/                Infra (cliente Supabase, cn, constantes).
supabase/           schema.sql + seed.sql.
```

Regra de ouro: **a página não chama o Supabase direto** — usa hooks → services.

## Arquitetura do banco

- **UUID** em todas as PKs · **soft delete** (`deleted_at`) + flag `ativo`.
- Auditoria: `created_at`, `updated_at`, `created_by`, `updated_by`.
- **Multi-clube**: toda tabela operacional tem `clube_id`. Alimentos, refeições,
  suplementos e protocolos aceitam `clube_id = null` (catálogo global compartilhado).
- **3FN**: refeição → `refeicao_alimentos` → alimento (nunca "Arroz + Frango" num campo).
- **RLS** habilitado em tudo. No MVP, política aberta para autenticados; em produção,
  trocar pela política multi-clube (`user_clube_ids()`), comentada no fim do `schema.sql`.

## Integração futura — BH Wolves Manager

O NutriPlay é um **microproduto** do ecossistema (como o Google Docs no Workspace),
não um módulo acoplado. O que será compartilhado entre os produtos:
**login único, clube, atletas e permissões**. Por isso já nascemos com:

- `clube_id` em todas as tabelas operacionais;
- `usuarios`/`perfis` ligados ao `auth.users` do Supabase (base para SSO único);
- catálogos globais (`clube_id = null`) para reuso entre clubes.

Quando o BH Wolves Manager existir, `clubes`/`atletas`/`auth` podem ser promovidos
a um schema/core compartilhado sem alteração estrutural.

### Mostrar dados do NutriPlay dentro do BH Wolves

Há duas formas (tela **Integração** no painel tem os snippets prontos):

1. **API (servidor → servidor)** — defina `NUTRIPLAY_API_KEY` e chame:
   - `GET /api/integracao/resumo?clube_id=...` (KPIs do clube)
   - `GET /api/integracao/atleta/{id}` (plano ativo, última avaliação, prontidão)

   Autentique com header `x-api-key`. Configure `INTEGRACAO_ORIGIN` para CORS.

2. **Widget embutível (iframe)** — defina `NUTRIPLAY_EMBED_TOKEN` e embuta
   `/embed/clube/{clubeId}?token=...` no BH Wolves (zero código).

## Roadmap (implementado)

- **FASE 1 (MVP)** — Banco Alimentar, Meal Builder, Planos, Atletas, Avaliações ✅
- **FASE 2** — Protocolos, Game Day, Recovery, PDF ✅
- **FASE 3** — App do atleta PWA (plano, água, game day, fotos, offline, push opt-in) ✅
- **FASE 4** — IA Nutricional (necessidades, gerar plano, substituições, alertas, chat) ✅
- **FASE 5** — Marketplace, Fornecedores, Compras ✅
- **FASE 6** — Wearables (Garmin/Polar/Apple/Google Fit) — modelo, dashboard e ingestão ✅
- **FASE 7** — Predições (prontidão, risco de lesão, performance) — modelos heurísticos ✅

### Migrations Supabase (rodar em ordem no SQL Editor)

`schema.sql` é o **arquivo único e canônico** — cria o schema `nutriplay` com todas
as fases (1–7) e o storage. Para instalação nova (inclusive no Supabase compartilhado
do BH Wolves), rode apenas `schema.sql` + `seed.sql`.

> As migrations incrementais em `supabase/migrations/` (`0002`…`0006`) são legado da
> abordagem com projeto separado (schema `public`) e foram **substituídas** pelo
> `schema.sql`. Não rode-as no setup com schema `nutriplay`.

### Pendências de backend (integrações externas)

- **Push** (FASE 3): persistir subscriptions + envio com `web-push`/VAPID.
- **Sync de wearables** (FASE 6): OAuth + credenciais de parceiro de cada provedor;
  o endpoint `/api/wearables/ingest` já é o ponto de entrada.
- **Chat IA** (FASE 4): definir `ANTHROPIC_API_KEY`.
- **ML real** (FASE 7): os modelos atuais são heurísticos (`utils/ml.ts`);
  `ml_predicoes` acumula histórico para treino futuro.
- **Auth/login único**: substituir `DEV_CLUBE_ID` (`lib/club.ts`) pelo clube do perfil logado.
