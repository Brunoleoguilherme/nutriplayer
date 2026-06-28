/**
 * Clube ativo durante o desenvolvimento (pré-autenticação).
 * Corresponde ao BH Wolves criado em supabase/seed.sql.
 *
 * TODO (integração BH Wolves / auth): substituir por um contexto que lê o
 * clube do perfil do usuário logado (perfis.clube_id via auth.uid()).
 */
export const DEV_CLUBE_ID = "00000000-0000-0000-0000-000000000001";

export function getClubeAtivo(): string {
  return DEV_CLUBE_ID;
}
