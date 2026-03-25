import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { gerarCronogramasParaSalao } from '../utils/cronograma';

export const cronogramaRouter = Router();
cronogramaRouter.use(authMiddleware);

cronogramaRouter.get('/periodos', async (_req: AuthRequest, res: Response) => {
  try {
    const periodos = await prisma.periodoManutencao.findMany({ orderBy: { mesInicio: 'asc' } });
    res.json(periodos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar períodos' });
  }
});

cronogramaRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, ano } = req.query;
    const where: Prisma.CronogramaAnualWhereInput = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (ano) where.ano = Number(ano);

    const cronogramas = await prisma.cronogramaAnual.findMany({
      where,
      include: { periodo: true },
      orderBy: [{ ano: 'desc' }, { periodo: { mesInicio: 'asc' } }],
    });
    res.json(cronogramas);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar cronogramas' });
  }
});

// Gera cronogramas para o ano atual (idempotente)
cronogramaRouter.post('/gerar', async (_req: AuthRequest, res: Response) => {
  try {
    const ano = new Date().getFullYear();
    const saloes = await prisma.salao.findMany({ select: { id: true } });
    for (const salao of saloes) {
      await gerarCronogramasParaSalao(salao.id, ano);
    }
    res.json({ ano });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao gerar cronograma' });
  }
});

cronogramaRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { status, observacoes } = req.body;
    const cronograma = await prisma.cronogramaAnual.update({
      where: { id: req.params.id },
      data: { status, observacoes },
      include: { periodo: true },
    });
    res.json(cronograma);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Cronograma não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar cronograma' });
  }
});
