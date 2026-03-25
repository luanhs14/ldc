import { z } from 'zod';

const categoriaEnum = z.enum(['MATERIAL', 'MAO_DE_OBRA', 'SERVICO_TERCEIRO', 'OUTRO']);

export const createOrcamentoSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  ano: z.coerce.number().int().min(2000, 'Ano inválido'),
  orcamentoPrevisto: z.coerce.number().min(0, 'Orçamento previsto inválido'),
  saldoReserva: z.coerce.number().min(0).optional(),
  observacoes: z.string().nullish(),
});

export const createLancamentoSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  valor: z.coerce.number(),
  data: z.string().min(1, 'Data é obrigatória'),
  categoria: categoriaEnum,
  orcamentoAnualId: z.string().nullish(),
  pendenciaId: z.string().nullish(),
  elementoId: z.string().nullish(),
});
