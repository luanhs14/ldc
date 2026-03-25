import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';

type ElementoAvaliacaoInput = {
  elementoId: string;
  condicao: string;
  previsaoSubstituicao?: string | null;
  planejamentoReforma?: string | null;
  observacoes?: string | null;
};

export const avaliacoesRouter = Router();
avaliacoesRouter.use(authMiddleware);

avaliacoesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, tipo } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['data', 'tipo', 'criadoEm', 'avaliador'] as const, 'data', 'desc');
    const where: Prisma.AvaliacaoWhereInput = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (tipo) where.tipo = String(tipo);

    const [total, avaliacoes] = await Promise.all([
      prisma.avaliacao.count({ where }),
      prisma.avaliacao.findMany({
        where,
        include: { _count: { select: { pendencias: true, elementos: true } } },
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
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

    const avaliacao = await prisma.$transaction(async (tx) => {
      const novaAvaliacao = await tx.avaliacao.create({
        data: {
          salaoId, tipo, data: new Date(data), avaliador, observacoes,
          elementos: elementos?.length ? {
            create: elementos.map((e: ElementoAvaliacaoInput) => ({
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

      if (elementos?.length) {
        await Promise.all(
          elementos.map((e: ElementoAvaliacaoInput) =>
            tx.elemento.update({
              where: { id: e.elementoId },
              data: { condicaoAtual: e.condicao },
            })
          )
        );
      }

      return novaAvaliacao;
    });

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
