import { prisma } from '../models/prisma';

/**
 * Garante que todos os registros CronogramaAnual existam para um salão/ano.
 * Idempotente — não sobrescreve registros existentes.
 */
export async function gerarCronogramasParaSalao(salaoId: string, ano: number): Promise<void> {
  const periodos = await prisma.periodoManutencao.findMany();
  for (const periodo of periodos) {
    await prisma.cronogramaAnual.upsert({
      where: { salaoId_periodoId_ano: { salaoId, periodoId: periodo.id, ano } },
      update: {},
      create: { salaoId, periodoId: periodo.id, ano, status: 'AGUARDANDO' },
    });
  }
}
