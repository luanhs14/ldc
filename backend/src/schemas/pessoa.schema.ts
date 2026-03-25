import { z } from 'zod';

const funcaoEnum = z.enum(['LDC', 'REC', 'TM', 'ANCIAO', 'RESPONSAVEL_MANUTENCAO', 'VOLUNTARIO', 'OUTRO']);

export const createPessoaSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  telefone: z.string().nullish(),
  email: z.string().email('Email inválido').nullish(),
  congregacaoId: z.string().nullish(),
  autorizadoAltoRisco: z.boolean().optional(),
  observacoesAutorizacao: z.string().nullish(),
  funcoes: z.array(funcaoEnum).optional(),
  salaoIds: z.array(z.string()).optional(),
  especialidades: z.array(z.string()).optional(),
});

export const updatePessoaSchema = createPessoaSchema.partial();
