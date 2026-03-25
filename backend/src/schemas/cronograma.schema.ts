import { z } from 'zod';

const statusEnum = z.enum(['AGUARDANDO', 'EM_ANDAMENTO', 'CONCLUIDO']);

export const updateCronogramaSchema = z.object({
  status: statusEnum.optional(),
  observacoes: z.string().nullish(),
});
