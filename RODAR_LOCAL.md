# Rodar NutriPlay localmente (com o Supabase do BH Wolves)

O `.env.local` já foi preenchido com as credenciais do Supabase do BH Wolves e uma
chave de integração (a mesma já foi colocada no BH Wolves). Falta só o banco e instalar.

## 1. Banco de dados (uma vez)

No **SQL Editor** do Supabase do BH Wolves:

1. Rode `supabase/schema.sql` → cria o schema isolado **`nutriplay`** com tudo.
2. Rode `supabase/seed.sql` → clube BH Wolves + dados de exemplo.
3. **Exponha o schema:** Project Settings → API → *Exposed schemas* → adicione
   `nutriplay` (e em *Extra search path* também) → **Save**.
   *(Sem este passo o app não enxerga as tabelas — erro tipo "schema must be one of...").*

## 2. Instalar e rodar o NutriPlay

```bash
cd nutriplay        # a pasta do projeto TypeScript
npm install         # instala as dependências novas (supabase/ssr, lucide, etc.)
npm run dev         # sobe em http://localhost:3001
```

Abra **http://localhost:3001** → "Entrar no sistema". Cadastre um atleta, crie uma
refeição, etc. Se os dados salvarem e recarregarem, a conexão está OK.

## 3. Testar a integração no BH Wolves

Em **outro terminal**:

```bash
cd "..\bhwolves-chamada - Copia"   # ou o caminho do BH Wolves
npm install
npm run dev                          # http://localhost:3000
```

No BH Wolves: **Saúde → Nutrição**. O card deve puxar os KPIs do NutriPlay
(`http://localhost:3001/api/integracao/resumo`).

## Dicas de problema comum

- **"schema must be one of..."** → faltou expor o schema `nutriplay` (passo 1.3).
- **Card no BH Wolves vazio / erro** → confira se o NutriPlay está rodando na 3001
  e se `NUTRIPLAY_API_KEY` é igual nos dois `.env.local`.
- **Erro de tipo no `npm run dev`** → me mande a mensagem que eu ajusto.
- O clube de desenvolvimento é `00000000-0000-0000-0000-000000000001` (lib/club.ts).
