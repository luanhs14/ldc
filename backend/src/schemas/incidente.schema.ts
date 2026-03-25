import { z } from 'zod';

const tipoIncidenteEnum = z.enum(['LESAO', 'QUASE_ACIDENTE', 'SITUACAO_PERIGOSA']);
const gravidadeEnum = z.enum(['BAIXA', 'MEDIA', 'ALTA']);
const statusEnum = z.enum(['ABERTO', 'RESOLVIDO']);

export const createIncidenteSchema = z.object({
  salaoId: z.string().min(1, 'salaoId é obrigatório'),
  data: z.string().min(1, 'Data é obrigatória'),
  local: z.string().min(1, 'Local é obrigatório'),
  tipo: tipoIncidenteEnum,
  descricao: z.string().min(1, 'Descrição é obrigatória'),
  gravidade: gravidadeEnum,
  visitaId: z.string().nullish(),
  servicoId: z.string().nullish(),
  acaoCorretiva: z.string().nullish(),
});

export const updateIncidenteSchema = createIncidenteSchema
  .omit({ salaoId: true, visitaId: true, servicoId: true })
  .extend({ status: statusEnum.optional() })
  .partial();
