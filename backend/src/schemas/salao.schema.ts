import { z } from 'zod';

export const createSalaoSchema = z.object({
  congregacao: z.string().min(1, 'Congregação é obrigatória'),
  codigoBRA: z.string().min(1, 'Código BRA é obrigatório'),
  endereco: z.string().nullish(),
  dataConstrucao: z.string().nullish(),
  dataUltimaReforma: z.string().nullish(),
  observacoes: z.string().nullish(),
});

export const updateSalaoSchema = createSalaoSchema.partial();
