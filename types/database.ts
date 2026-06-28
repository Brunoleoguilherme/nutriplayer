/**
 * Tipos de domínio do NutriPlay — espelham o schema Supabase (supabase/schema.sql).
 * Cobre FASE 1–4. Mantenha sincronizado com o schema.
 */

export interface AuditFields {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  ativo: boolean;
  created_by?: string | null;
  updated_by?: string | null;
}

export type PlanoClube = "Starter" | "Club" | "Elite" | "Federacao" | "Enterprise";

export type Papel =
  | "administrador"
  | "nutricionista"
  | "coach"
  | "preparador"
  | "medico"
  | "diretor"
  | "atleta";

export type FonteAlimento =
  | "TACO"
  | "TBCA"
  | "TUCUNDUVA"
  | "USDA"
  | "IBGE"
  | "Própria"
  | "CSV";

export interface Clube extends AuditFields {
  nome: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  logo_url: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  idioma: string | null;
  fuso_horario: string | null;
  site: string | null;
  redes_sociais: Record<string, string>;
  plano: PlanoClube;
  status: string;
}

export interface Usuario extends AuditFields {
  auth_user_id: string | null;
  clube_id: string | null;
  nome: string;
  email: string;
  telefone: string | null;
  avatar_url: string | null;
  status: string;
}

export interface Perfil {
  id: string;
  user_id: string;
  clube_id: string;
  papel: Papel;
  permissoes: Record<string, Record<string, boolean>>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Categoria extends AuditFields {
  clube_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
}

export interface Atleta extends AuditFields {
  clube_id: string;
  categoria_id: string | null;
  wolves_id: string | null;
  nome: string;
  foto_url: string | null;
  sexo: string | null;
  data_nascimento: string | null;
  documento: string | null;
  telefone: string | null;
  email: string | null;
  responsavel: string | null;
  contato_emergencia: string | null;
  endereco: Record<string, unknown>;
  posicao: string | null;
  numero: number | null;
  dominancia: string | null;
  tempo_pratica: string | null;
  alergias: string | null;
  lesoes: string | null;
  restricoes: string | null;
  medicamentos: string | null;
  historico_medico: string | null;
  cirurgias: string | null;
  peso_atual: number | null;
  altura_cm: number | null;
  objetivo: string | null;
  meta_calorica: number | null;
  preferencias: string | null;
  alimentos_proibidos: string | null;
  intolerancias: string | null;
  suplementacao: string | null;
  tags: string[];
  status: string;
}

export interface Alimento extends AuditFields {
  clube_id: string | null;
  nome: string;
  categoria: string | null;
  grupo: string | null;
  subgrupo: string | null;
  codigo: string | null;
  fonte: FonteAlimento;
  imagem_url: string | null;
  descricao: string | null;
  porcao_padrao_g: number;
  medida_caseira: string | null;
  peso_liquido_g: number | null;
  peso_bruto_g: number | null;
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
  acucares: number;
  sodio: number | null;
  potassio: number | null;
  magnesio: number | null;
  ferro: number | null;
  zinco: number | null;
  vitamina_a: number | null;
  vitamina_c: number | null;
  vitamina_d: number | null;
  vitamina_e: number | null;
  vitamina_k: number | null;
  complexo_b: number | null;
  colesterol: number | null;
  omega_3: number | null;
  omega_6: number | null;
  indice_glicemico: number | null;
  carga_glicemica: number | null;
  micronutrientes: Record<string, number>;
  observacoes: string | null;
  tags: string[];
}

export interface Suplemento extends AuditFields {
  clube_id: string | null;
  nome: string;
  marca: string | null;
  categoria: string | null;
  dose: string | null;
  horario: string | null;
  objetivo: string | null;
  contraindicacoes: string | null;
  imagem_url: string | null;
  observacoes: string | null;
  tags: string[];
}

export interface Protocolo extends AuditFields {
  clube_id: string | null;
  nome: string;
  categoria: string | null;
  objetivo: string | null;
  descricao: string | null;
  observacoes: string | null;
  tags: string[];
}

export interface Refeicao extends AuditFields {
  clube_id: string | null;
  nome: string;
  categoria: string | null;
  objetivo: string | null;
  descricao: string | null;
  imagem_url: string | null;
  tempo_preparo_min: number | null;
  observacoes: string | null;
  tags: string[];
}

export interface RefeicaoAlimento {
  id: string;
  refeicao_id: string;
  alimento_id: string;
  quantidade_g: number;
  medida_caseira: string | null;
  ordem: number;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  alimento?: Alimento;
}

export type StatusPlano = "Rascunho" | "Ativo" | "Encerrado";

export interface PlanoAlimentar extends AuditFields {
  clube_id: string;
  atleta_id: string | null;
  nome: string;
  objetivo: string | null;
  observacoes: string | null;
  meta_calorica: number | null;
  data_inicio: string;
  data_fim: string | null;
  status: StatusPlano;
  tags: string[];
}

export interface PlanoRefeicao {
  id: string;
  plano_id: string;
  refeicao_id: string;
  horario: string | null;
  periodo: string | null;
  ordem: number;
  observacao: string | null;
  created_at: string;
  updated_at: string;
  refeicao?: Refeicao;
}

export interface AvaliacaoCorporal extends AuditFields {
  clube_id: string;
  atleta_id: string;
  data_avaliacao: string;
  peso: number | null;
  altura_cm: number | null;
  percentual_gordura: number | null;
  massa_magra: number | null;
  massa_gorda: number | null;
  imc: number | null;
  circunferencias: Record<string, number>;
  dobras: Record<string, number>;
  fotos: string[];
  observacoes: string | null;
}

export type StatusGameDay = "Planejado" | "Concluído";

export interface GameDay extends AuditFields {
  clube_id: string;
  categoria_id: string | null;
  titulo: string;
  data_evento: string;
  horario_evento: string | null;
  adversario: string | null;
  local_evento: string | null;
  objetivo: string | null;
  observacoes: string | null;
  status: StatusGameDay;
  tags: string[];
}

export type TipoGameDayItem =
  | "Refeição"
  | "Hidratação"
  | "Suplemento"
  | "Recovery"
  | "Outro";

export interface GameDayItem {
  id: string;
  game_day_id: string;
  horario: string | null;
  titulo: string;
  tipo: TipoGameDayItem;
  refeicao_id: string | null;
  suplemento_id: string | null;
  descricao: string | null;
  responsavel: string | null;
  ordem: number;
  created_at: string;
  updated_at: string;
  refeicao?: Refeicao;
  suplemento?: Suplemento;
}

export interface HidratacaoRegistro {
  id: string;
  clube_id: string;
  atleta_id: string;
  data: string;
  quantidade_ml: number;
  origem: string;
  created_at: string;
}

export type TipoFoto = "Frente" | "Lado" | "Costas" | "Outro";

export interface FotoAtleta {
  id: string;
  clube_id: string;
  atleta_id: string;
  url: string;
  storage_path: string | null;
  data: string;
  tipo: TipoFoto;
  observacao: string | null;
  ativo: boolean;
  created_at: string;
  deleted_at: string | null;
}

export interface ResumoMacros {
  calorias: number;
  proteinas: number;
  carboidratos: number;
  gorduras: number;
  fibras: number;
}

// ---------- FASE 5: Marketplace / Compras ----------
export interface Fornecedor extends AuditFields {
  clube_id: string;
  nome: string;
  cnpj: string | null;
  contato_nome: string | null;
  email: string | null;
  telefone: string | null;
  site: string | null;
  observacoes: string | null;
}

export interface Produto extends AuditFields {
  clube_id: string;
  fornecedor_id: string | null;
  suplemento_id: string | null;
  nome: string;
  categoria: string | null;
  marca: string | null;
  descricao: string | null;
  imagem_url: string | null;
  unidade: string;
  preco: number;
  fornecedor?: { id: string; nome: string } | null;
}

export type StatusPedido = "Rascunho" | "Enviado" | "Recebido" | "Cancelado";

export interface Pedido extends AuditFields {
  clube_id: string;
  fornecedor_id: string | null;
  codigo: string | null;
  status: StatusPedido;
  data_pedido: string;
  total: number;
  observacoes: string | null;
  fornecedor?: { id: string; nome: string } | null;
}

export interface PedidoItem {
  id: string;
  pedido_id: string;
  produto_id: string | null;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  ordem: number;
  created_at: string;
  updated_at: string;
}

// ---------- FASE 6: Wearables ----------
export type ProvedorWearable = "garmin" | "polar" | "apple" | "google" | "manual";
export type StatusConexao = "conectado" | "desconectado" | "pendente";

export interface WearableConexao {
  id: string;
  clube_id: string;
  atleta_id: string;
  provedor: ProvedorWearable;
  status: StatusConexao;
  external_user_id: string | null;
  ultimo_sync: string | null;
  meta: Record<string, unknown>;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WearableMetrica {
  id: string;
  clube_id: string;
  atleta_id: string;
  data: string;
  origem: ProvedorWearable;
  passos: number | null;
  calorias: number | null;
  distancia_km: number | null;
  fc_repouso: number | null;
  fc_max: number | null;
  hrv_ms: number | null;
  sono_min: number | null;
  sono_score: number | null;
  prontidao: number | null;
  meta: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// ---------- FASE 7: Predições (ML) ----------
export type TipoPredicao = "prontidao" | "risco_lesao" | "performance";

export interface MlPredicao {
  id: string;
  clube_id: string;
  atleta_id: string;
  data: string;
  tipo: TipoPredicao;
  score: number;
  nivel: string | null;
  resumo: string | null;
  fatores: { label: string; impacto: string; detalhe: string }[];
  modelo: string;
  created_at: string;
}
