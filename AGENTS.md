<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# NutriPlay — convenções do projeto

NutriPlay é o módulo de nutrição esportiva do ecossistema **BH Wolves Manager**.
Documento de referência oficial: o `MANUAL OFICIAL DE DESENVOLVIMENTO`. Siga-o.

## Filosofia (não-negociável)

- **Objetos reutilizáveis**: um alimento/refeição/suplemento/protocolo existe uma
  única vez e é referenciado em muitos planos. Nunca duplicar dados.
- **3FN**: composição via tabelas de junção (`refeicao_alimentos`, `plano_refeicoes`...).
- **Multi-clube**: toda tabela operacional tem `clube_id`. Catálogos (alimentos,
  refeições, suplementos, protocolos) podem ter `clube_id = null` (global).
- **Soft delete**: nunca `DELETE`. Use `deleted_at` + `ativo = false`.

## Padrão de código

- A camada que fala com o Supabase é **`services/`**. Páginas e componentes usam
  **`hooks/`** → services. Nunca chamar o Supabase direto numa página.
- Cliente Supabase: `lib/supabase/client.ts` (browser) e `lib/supabase/server.ts`
  (server/route handlers/actions). `createAdminClient()` (service role) só no servidor.
- Tipos de domínio em `types/` espelham o `supabase/schema.sql` — mantenha em sincronia.
- Cálculos puros (macros, formatação) em `utils/`. Sem efeitos colaterais.
- Toda tela deve ter: Loading, Error, Empty State, Success e responsividade.

## Design

- Tema **Dark Premium**. Tokens em `app/globals.css` (`@theme`): `--color-bg #090d18`,
  `--color-surface #151b29`, gradiente marca roxo→azul→verde, raio de card 16px.
- Use as utilities `card`, `brand-gradient`, `brand-text` e os componentes `components/ui/*`.
- Ícones: `lucide-react`.

## Banco

- Schema em `supabase/schema.sql` (rodar no SQL Editor). RLS habilitado em tudo.
- MVP usa política aberta para autenticados; produção usa `user_clube_ids()`
  (política multi-clube comentada no fim do schema). Não publicar com a política MVP.
