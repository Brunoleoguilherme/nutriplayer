/**
 * REGISTRO DE TIMES (multi-clube)
 * ------------------------------------------------------------------
 * Cada time é uma FONTE DE DADOS independente. Hoje todos compartilham
 * o mesmo Supabase do BH Wolves (schema "public"), mas o desenho já
 * permite separar os bancos por time SEM mexer no app:
 *
 *   • Quando um time ganhar projeto Supabase próprio, basta definir as
 *     env vars dele (ex.: SPARTANS_SUPABASE_URL / SPARTANS_SERVICE_ROLE_KEY)
 *     e referenciar os NOMES dessas envs aqui em `urlEnv`/`serviceKeyEnv`.
 *   • Se `urlEnv`/`serviceKeyEnv` ficarem vazios, o time usa as envs padrão
 *     (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) — o compartilhado.
 *
 * Este arquivo é seguro para client e server: não lê process.env no topo.
 * A resolução das credenciais acontece só no servidor (resolveTeamSource).
 */

export interface TeamSource {
  /** Nome da env var com a URL do Supabase do time (opcional). */
  urlEnv?: string;
  /** Nome da env var com a service role key do time (opcional). */
  serviceKeyEnv?: string;
  /** Schema onde ficam os atletas do time. Default "public". */
  schema?: string;
}

export interface Team {
  /** Slug estável (usado em URLs/params/localStorage). */
  id: string;
  /** Nome de exibição. */
  nome: string;
  /** Sigla/abreviação curta. */
  sigla?: string;
  source: TeamSource;
}

/**
 * Lista de times disponíveis. Para adicionar um novo time:
 *   1. (Se tiver banco próprio) crie as env vars e referencie em source.
 *   2. Adicione uma entrada aqui.
 */
export const TEAMS: Team[] = [
  {
    id: "bhwolves",
    nome: "BH Wolves",
    sigla: "BHW",
    // Usa o Supabase compartilhado (envs padrão) + schema public.
    source: { schema: "public" },
  },
  // Exemplo para o futuro (deixe comentado até existir o banco):
  // {
  //   id: "spartans",
  //   nome: "Spartans",
  //   sigla: "SPA",
  //   source: {
  //     urlEnv: "SPARTANS_SUPABASE_URL",
  //     serviceKeyEnv: "SPARTANS_SERVICE_ROLE_KEY",
  //     schema: "public",
  //   },
  // },
];

export const DEFAULT_TEAM_ID = TEAMS[0].id;

/** Resolve um time por id (cai no padrão se não achar). */
export function getTeam(id?: string | null): Team {
  return TEAMS.find((t) => t.id === id) ?? TEAMS[0];
}

/** Dados leves para o seletor (sem expor credenciais). */
export function listTeams(): { id: string; nome: string; sigla?: string }[] {
  return TEAMS.map(({ id, nome, sigla }) => ({ id, nome, sigla }));
}
