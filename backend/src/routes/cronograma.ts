import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

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
    const where: any = {};
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
cronogramaRouter.post('/gerar', async (req: AuthRequest, res: Response) => {
  try {
    const ano = new Date().getFullYear();
    const [saloes, periodos] = await Promise.all([
      prisma.salao.findMany({ select: { id: true } }),
      prisma.periodoManutencao.findMany(),
    ]);

    let criados = 0;
    for (const salao of saloes) {
      for (const periodo of periodos) {
        const existe = await prisma.cronogramaAnual.findUnique({
          where: { salaoId_periodoId_ano: { salaoId: salao.id, periodoId: periodo.id, ano } },
        });
        if (!existe) {
          await prisma.cronogramaAnual.create({
            data: { salaoId: salao.id, periodoId: periodo.id, ano, status: 'AGUARDANDO' },
          });
          criados++;
        }
      }
    }
    res.json({ criados, ano });
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
