import { z } from 'zod';

const condicaoEnum = z.enum(['OTIMO', 'BOM', 'REGULAR', 'RUIM', 'CRITICO']);

export const createElementoSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  elementoTipoId: z.string().min(1, 'elementoTipoId é obrigatório'),
  nomeCustomizado: z.string().nullish(),
  dataInstalacao: z.string().nullish(),
  condicaoAtual: condicaoEnum.optional(),
  vidaUtilAnos: z.coerce.number().int().positive().nullish(),
  proximaManutencao: z.string().nullish(),
  observacoes: z.string().nullish(),
});

export const updateElementoSchema = createElementoSchema.omit({ salaoId: true, elementoTipoId: true }).partial();
