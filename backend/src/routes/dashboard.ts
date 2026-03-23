import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const dashboardRouter = Router();
dashboardRouter.use(authMiddleware);

dashboardRouter.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const hoje = new Date();
    const em30dias = new Date(hoje);
    em30dias.setDate(hoje.getDate() + 30);
    const em60dias = new Date(hoje);
    em60dias.setDate(hoje.getDate() + 60);
    const anoAtual = hoje.getFullYear();

    const [
      totalSaloes,
      totalPendencias,
      pendenciasAtrasadas,
      pendenciasAltas,
      incidentesAbertos,
      elementosCriticos,
      garantiasVencendo,
      avaliacoesRecentes,
    ] = await Promise.all([
      prisma.salao.count(),
      prisma.pendencia.count({ where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
      prisma.pendencia.findMany({
        where: { status: { in: ['PENDENTE', 'EM_ANDAMENTO'] }, dataLimite: { lt: hoje } },
        include: { salao: { select: { id: true, congregacao: true, codigoBRA: true } }, elemento: { include: { elementoTipo: true } } },
        orderBy: { dataLimite: 'asc' },
        take: 10,
      }),
      prisma.pendencia.count({ where: { prioridade: 'ALTA', status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } } }),
      prisma.incidente.count({ where: { status: 'ABERTO' } }),
      prisma.elemento.findMany({
        where: { condicaoAtual: { in: ['RUIM', 'CRITICO'] } },
        include: { salao: { select: { id: true, congregacao: true, codigoBRA: true } }, elementoTipo: true },
        take: 10,
      }),
      prisma.equipamento.findMany({
        where: { garantiaAte: { lte: em30dias, gte: hoje } },
        include: { elemento: { include: { salao: { select: { id: true, congregacao: true } }, elementoTipo: true } } },
        take: 10,
      }),
      prisma.avaliacao.findMany({
        orderBy: { data: 'desc' },
        take: 5,
        include: { salao: { select: { id: true, congregacao: true, codigoBRA: true } } },
      }),
    ]);

    // Salões sem avaliação nos últimos 12 meses
    const umAnoAtras = new Date(hoje);
    umAnoAtras.setFullYear(hoje.getFullYear() - 1);
    const saloesSemAvaliacao = await prisma.salao.findMany({
      where: {
        avaliacoes: { none: { data: { gte: umAnoAtras } } },
      },
      select: { id: true, congregacao: true, codigoBRA: true },
      take: 10,
    });

    // Períodos de manutenção ativos
    const mesAtual = hoje.getMonth() + 1;
    const periodosAtivos = await prisma.periodoManutencao.findMany({
      where: { mesInicio: { lte: mesAtual }, mesFim: { gte: mesAtual } },
    });

    // Cronograma: gerar automaticamente se necessário (on-demand)
    if (periodosAtivos.length > 0) {
      const saloes = await prisma.salao.findMany({ select: { id: true } });
      for (const salao of saloes) {
        for (const periodo of periodosAtivos) {
          await prisma.cronogramaAnual.upsert({
            where: { salaoId_periodoId_ano: { salaoId: salao.id, periodoId: periodo.id, ano: anoAtual } },
            update: {},
            create: { salaoId: salao.id, periodoId: periodo.id, ano: anoAtual, status: 'AGUARDANDO' },
          });
        }
      }
    }

    res.json({
      totalSaloes,
      totalPendencias,
      pendenciasAltas,
      incidentesAbertos,
      alertas: {
        pendenciasAtrasadas,
        elementosCriticos,
        garantiasVencendo,
        saloesSemAvaliacao,
        periodosAtivos,
      },
      avaliacoesRecentes,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao carregar dashboard' });
  }
});
