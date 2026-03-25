import { z } from 'zod';

const prioridadeEnum = z.enum(['BAIXA', 'MEDIA', 'ALTA']);
const riscoEnum = z.enum(['BAIXO', 'MEDIO', 'ALTO']);
const statusEnum = z.enum(['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO']);

export const createPendenciaSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  avaliacaoId: z.string().nullish(),
  visitaId: z.string().nullish(),
  elementoId: z.string().nullish(),
  equipamentoId: z.string().nullish(),
  prioridade: prioridadeEnum.optional(),
  risco: riscoEnum.nullish(),
  responsavel: z.string().nullish(),
  dataLimite: z.string().nullish(),
});

export const updatePendenciaSchema = createPendenciaSchema.omit({ salaoId: true }).extend({
  status: statusEnum.optional(),
}).partial();
