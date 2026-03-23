export interface Salao {
  id: string
  congregacao: string
  codigoBRA: string
  bairro?: string
  endereco?: string
  dataConstrucao?: string
  dataUltimaReforma?: string
  observacoes?: string
  criadoEm: string
  atualizadoEm: string
  congregacoes?: Congregacao[]
  responsaveis?: SalaoResponsavel[]
  elementos?: Elemento[]
  _count?: { pendencias: number; elementos: number; visitas: number; incidentes: number }
}

export interface Congregacao {
  id: string
  nome: string
  salaoId: string
}

export interface Pessoa {
  id: string
  nome: string
  telefone?: string
  email?: string
  congregacaoId?: string
  autorizadoAltoRisco: boolean
  observacoesAutorizacao?: string
  funcoes: PessoaFuncao[]
  congregacao?: Congregacao
}

export interface PessoaFuncao {
  id: string
  pessoaId: string
  funcao: string
}

export interface SalaoResponsavel {
  id: string
  salaoId: string
  pessoaId: string
  papel?: string
  pessoa: Pessoa
}

export interface ElementoTipo {
  id: string
  codigo: string
  nome: string
  vidaUtilPadraoAnos?: number
}

export interface Elemento {
  id: string
  salaoId: string
  elementoTipoId: string
  nomeCustomizado?: string
  dataInstalacao?: string
  condicaoAtual: string
  vidaUtilAnos?: number
  proximaManutencao?: string
  observacoes?: string
  elementoTipo: ElementoTipo
  equipamentos?: Equipamento[]
}

export interface Equipamento {
  id: string
  elementoId: string
  nome: string
  modelo?: string
  fabricante?: string
  dataInstalacao?: string
  garantiaAte?: string
  proximaManutencao?: string
  observacoes?: string
  elemento?: Elemento
}

export interface Pendencia {
  id: string
  salaoId: string
  avaliacaoId?: string
  visitaId?: string
  elementoId?: string
  equipamentoId?: string
  descricao: string
  prioridade: string
  risco?: string
  responsavel?: string
  dataLimite?: string
  status: string
  criadoEm: string
  concluidoEm?: string
  elemento?: Elemento
  equipamento?: Equipamento
  visita?: { id: string; tipo: string; data: string }
}

export interface Visita {
  id: string
  salaoId: string
  tipo: string
  data: string
  visitanteId?: string
  visitanteNome?: string
  congregacaoId?: string
  relatorio?: string
  criadoEm: string
  congregacao?: Congregacao
  visitante?: { id: string; nome: string }
  pendencias?: Pendencia[]
  _count?: { pendencias: number }
}

export interface Avaliacao {
  id: string
  salaoId: string
  tipo: string
  data: string
  avaliador: string
  observacoes?: string
  criadoEm: string
  _count?: { pendencias: number; elementos: number }
}

export interface Incidente {
  id: string
  salaoId: string
  visitaId?: string
  servicoId?: string
  data: string
  local: string
  tipo: string
  descricao: string
  gravidade: string
  acaoCorretiva?: string
  status: string
  criadoEm: string
}

export interface Epi {
  id: string
  codigo: string
  nome: string
}

export interface CronogramaAnual {
  id: string
  salaoId: string
  periodoId: string
  ano: number
  status: string
  observacoes?: string
  periodo: { id: string; codigo: string; nome: string; mesInicio: number; mesFim: number }
}

// ─── Labels e cores ───────────────────────────────────────────────────────

export const CONDICAO_LABELS: Record<string, string> = {
  OTIMO: 'Ótimo', BOM: 'Bom', REGULAR: 'Regular', RUIM: 'Ruim', CRITICO: 'Crítico',
}
export const CONDICAO_COLORS: Record<string, string> = {
  OTIMO: 'bg-green-100 text-green-700', BOM: 'bg-blue-100 text-blue-700',
  REGULAR: 'bg-amber-100 text-amber-700', RUIM: 'bg-orange-100 text-orange-700',
  CRITICO: 'bg-red-100 text-red-700',
}
export const PRIORIDADE_COLORS: Record<string, string> = {
  BAIXA: 'bg-green-100 text-green-700', MEDIA: 'bg-amber-100 text-amber-700', ALTA: 'bg-red-100 text-red-700',
}
export const STATUS_PENDENCIA_COLORS: Record<string, string> = {
  PENDENTE: 'bg-gray-100 text-gray-700', EM_ANDAMENTO: 'bg-blue-100 text-blue-700',
  CONCLUIDO: 'bg-green-100 text-green-700', CANCELADO: 'bg-gray-100 text-gray-400',
}
export const VISITA_TIPO_LABELS: Record<string, string> = {
  MANUTENCAO: 'Manutenção', VISITA_TM: 'Visita TM', AVALIACAO_LDC: 'Avaliação LDC', INSPECAO_TECNICA: 'Inspeção Técnica',
}
export const FUNCAO_LABELS: Record<string, string> = {
  TM: 'TM', ANCIAO: 'Ancião',
  RESPONSAVEL_MANUTENCAO: 'Coord. Manutenção', VOLUNTARIO: 'Voluntário', OUTRO: 'Outros',
}
