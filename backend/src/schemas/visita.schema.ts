import { z } from 'zod';

const tipoVisitaEnum = z.enum(['MANUTENCAO', 'VISITA_TM', 'AVALIACAO_LDC', 'INSPECAO_TECNICA']);

export const createVisitaSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  tipo: tipoVisitaEnum,
  data: z.string().min(1, 'Data é obrigatória'),
  visitanteId: z.string().nullish(),
  visitanteNome: z.string().nullish(),
  congregacaoId: z.string().nullish(),
  relatorio: z.string().nullish(),
});

export const updateVisitaSchema = createVisitaSchema.omit({ salaoId: true }).partial();
