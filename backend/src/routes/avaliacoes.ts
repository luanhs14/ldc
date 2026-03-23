import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const avaliacoesRouter = Router();
avaliacoesRouter.use(authMiddleware);

avaliacoesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, tipo } = req.query;
    const where: any = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (tipo) where.tipo = String(tipo);

    const avaliacoes = await prisma.avaliacao.findMany({
      where,
      include: { _count: { select: { pendencias: true, elementos: true } } },
      orderBy: { data: 'desc' },
    });
    res.json(avaliacoes);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar avaliações' });
  }
});

avaliacoesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const avaliacao = await prisma.avaliacao.findUnique({
      where: { id: req.params.id },
      include: {
        elementos: { include: { elemento: { include: { elementoTipo: true } } } },
        pendencias: { include: { elemento: { include: { elementoTipo: true } } } },
      },
    });
    if (!avaliacao) return res.status(404).json({ error: 'Avaliação não encontrada' });
    res.json(avaliacao);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar avaliação' });
  }
});

avaliacoesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, tipo, data, avaliador, observacoes, elementos } = req.body;
    if (!salaoId || !tipo || !data || !avaliador) {
      return res.status(400).json({ error: 'salaoId, tipo, data e avaliador são obrigatórios' });
    }

    const avaliacao = await prisma.avaliacao.create({
      data: {
        salaoId, tipo, data: new Date(data), avaliador, observacoes,
        elementos: elementos?.length ? {
          create: elementos.map((e: any) => ({
            elementoId: e.elementoId,
            condicao: e.condicao,
            previsaoSubstituicao: e.previsaoSubstituicao ? new Date(e.previsaoSubstituicao) : null,
            planejamentoReforma: e.planejamentoReforma,
            observacoes: e.observacoes,
          })),
        } : undefined,
      },
      include: { elementos: { include: { elemento: { include: { elementoTipo: true } } } } },
    });

    // Atualiza a condição atual de cada elemento avaliado
    if (elementos?.length) {
      for (const e of elementos) {
        await prisma.elemento.update({
          where: { id: e.elementoId },
          data: { condicaoAtual: e.condicao },
        });
      }
    }

    res.status(201).json(avaliacao);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar avaliação' });
  }
});

avaliacoesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.avaliacao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Avaliação não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir avaliação' });
  }
});
