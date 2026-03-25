import { z } from 'zod';

export const createCongregacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
});

export const updateCongregacaoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
});
