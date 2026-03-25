import { z } from 'zod';

export const createEquipamentoSchema = z.object({
  elementoId: z.string().min(1, 'elementoId é obrigatório'),
  nome: z.string().min(1, 'Nome é obrigatório'),
  modelo: z.string().nullish(),
  fabricante: z.string().nullish(),
  dataInstalacao: z.string().nullish(),
  garantiaAte: z.string().nullish(),
  proximaManutencao: z.string().nullish(),
  observacoes: z.string().nullish(),
});

export const updateEquipamentoSchema = createEquipamentoSchema.omit({ elementoId: true }).partial();
