import { z } from 'zod';

const tipoServicoEnum = z.enum(['ALTURA', 'ESCAVACAO', 'DEMOLICAO', 'ELETRICA', 'EQUIPAMENTO_PESADO', 'OUTRO']);
const statusServicoEnum = z.enum(['PLANEJADO', 'EM_ANDAMENTO', 'CONCLUIDO']);

const analiseRiscoSchema = z.object({
  riscosIdentificados: z.string().min(1),
  medidasControle: z.string().min(1),
  responsavel: z.string().min(1),
  data: z.string().min(1),
});

export const createServicoSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  tipo: tipoServicoEnum,
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  data: z.string().min(1, 'Data é obrigatória'),
  visitaId: z.string().nullish(),
  pendenciaId: z.string().nullish(),
  autorizadoPor: z.string().nullish(),
  treinamentosNecessarios: z.string().nullish(),
  status: statusServicoEnum.optional(),
  epiIds: z.array(z.string()).optional(),
  analiseRisco: analiseRiscoSchema.optional(),
});

export const updateServicoSchema = createServicoSchema
  .omit({ salaoId: true, visitaId: true, pendenciaId: true, analiseRisco: true })
  .partial();
