import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createCongregacaoSchema, updateCongregacaoSchema } from '../schemas/congregacao.schema';

export const congregacoesRouter = Router();
congregacoesRouter.use(authMiddleware);

congregacoesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId } = req.query;
    const where: Prisma.CongregacaoWhereInput = salaoId ? { salaoId: String(salaoId) } : {};
    const congregacoes = await prisma.congregacao.findMany({ where, orderBy: { nome: 'asc' } });
    res.json(congregacoes);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar congregações' });
  }
});

congregacoesRouter.post('/', validate(createCongregacaoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { nome, salaoId } = req.body;
    const congregacao = await prisma.congregacao.create({ data: { nome, salaoId } });
    res.status(201).json(congregacao);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar congregação' });
  }
});

congregacoesRouter.put('/:id', validate(updateCongregacaoSchema), async (req: AuthRequest, res: Response) => {
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
