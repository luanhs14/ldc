import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const financeiroRouter = Router();
financeiroRouter.use(authMiddleware);

financeiroRouter.get('/orcamentos', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, ano } = req.query;
    const where: any = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (ano) where.ano = Number(ano);

    const orcamentos = await prisma.orcamentoAnual.findMany({
      where,
      include: { _count: { select: { lancamentos: true } } },
      orderBy: [{ ano: 'desc' }],
    });
    res.json(orcamentos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar orçamentos' });
  }
});

financeiroRouter.post('/orcamentos', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, ano, orcamentoPrevisto, saldoReserva, observacoes } = req.body;
    if (!salaoId || !ano || orcamentoPrevisto === undefined) {
      return res.status(400).json({ error: 'salaoId, ano e orcamentoPrevisto são obrigatórios' });
    }
    const orcamento = await prisma.orcamentoAnual.create({
      data: { salaoId, ano: Number(ano), orcamentoPrevisto: Number(orcamentoPrevisto), saldoReserva: Number(saldoReserva || 0), observacoes },
    });
    res.status(201).json(orcamento);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Orçamento já existe para esse salão e ano' });
    res.status(500).json({ error: 'Erro ao criar orçamento' });
  }
});

financeiroRouter.get('/lancamentos', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, ano, categoria, orcamentoAnualId } = req.query;
    const where: any = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (orcamentoAnualId) where.orcamentoAnualId = String(orcamentoAnualId);
    if (categoria) where.categoria = String(categoria);
    if (ano) where.data = { gte: new Date(`${ano}-01-01`), lte: new Date(`${ano}-12-31`) };

    const lancamentos = await prisma.lancamentoCusto.findMany({
      where,
      include: {
        elemento: { include: { elementoTipo: true } },
        pendencia: { select: { id: true, descricao: true } },
      },
      orderBy: { data: 'desc' },
    });

    const total = lancamentos.reduce((sum, l) => sum + l.valor, 0);
    res.json({ lancamentos, total });
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar lançamentos' });
  }
});

financeiroRouter.post('/lancamentos', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, orcamentoAnualId, pendenciaId, elementoId, descricao, valor, data, categoria } = req.body;
    if (!salaoId || !descricao || valor === undefined || !data || !categoria) {
      return res.status(400).json({ error: 'salaoId, descrição, valor, data e categoria são obrigatórios' });
    }
    const lancamento = await prisma.lancamentoCusto.create({
      data: {
        salaoId, orcamentoAnualId: orcamentoAnualId || null,
        pendenciaId: pendenciaId || null, elementoId: elementoId || null,
        descricao, valor: Number(valor), data: new Date(data), categoria,
      },
    });
    res.status(201).json(lancamento);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar lançamento' });
  }
});

financeiroRouter.delete('/lancamentos/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.lancamentoCusto.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Lançamento não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir lançamento' });
  }
});
