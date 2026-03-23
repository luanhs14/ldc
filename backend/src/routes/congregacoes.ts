import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const congregacoesRouter = Router();
congregacoesRouter.use(authMiddleware);

congregacoesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId } = req.query;
    const where: any = salaoId ? { salaoId: String(salaoId) } : {};
    const congregacoes = await prisma.congregacao.findMany({ where, orderBy: { nome: 'asc' } });
    res.json(congregacoes);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar congregações' });
  }
});

congregacoesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, salaoId } = req.body;
    if (!nome || !salaoId) return res.status(400).json({ error: 'Nome e salaoId são obrigatórios' });
    const congregacao = await prisma.congregacao.create({ data: { nome, salaoId } });
    res.status(201).json(congregacao);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar congregação' });
  }
});

congregacoesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome } = req.body;
    const congregacao = await prisma.congregacao.update({ where: { id: req.params.id }, data: { nome } });
    res.json(congregacao);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Congregação não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar congregação' });
  }
});

congregacoesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.congregacao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Congregação não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir congregação' });
  }
});
