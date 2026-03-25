import { z } from 'zod';

const tipoAvaliacaoEnum = z.enum(['DC96', 'DC97', 'AMBOS']);
const condicaoEnum = z.enum(['OTIMO', 'BOM', 'REGULAR', 'RUIM', 'CRITICO']);

const elementoAvaliacaoSchema = z.object({
  elementoId: z.string().min(1),
  condicao: condicaoEnum,
  previsaoSubstituicao: z.string().nullish(),
  planejamentoReforma: z.string().nullish(),
  observacoes: z.string().nullish(),
});

export type ElementoAvaliacaoInput = z.infer<typeof elementoAvaliacaoSchema>;

export const createAvaliacaoSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  tipo: tipoAvaliacaoEnum,
  data: z.string().min(1, 'Data é obrigatória'),
  avaliador: z.string().min(1, 'Avaliador é obrigatório'),
  observacoes: z.string().nullish(),
  elementos: z.array(elementoAvaliacaoSchema).optional(),
});
