import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';
import { validate } from '../middlewares/validate';
import { createVisitaSchema, updateVisitaSchema } from '../schemas/visita.schema';

export const visitasRouter = Router();
visitasRouter.use(authMiddleware);

visitasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, tipo } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['data', 'tipo', 'criadoEm'] as const, 'data', 'desc');
    const where: Prisma.VisitaWhereInput = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (tipo) where.tipo = String(tipo);

    const [total, visitas] = await Promise.all([
      prisma.visita.count({ where }),
      prisma.visita.findMany({
        where,
        include: {
          congregacao: true,
          visitante: { select: { id: true, nome: true } },
          _count: { select: { pendencias: true } },
        },
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
    res.json(visitas);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar visitas' });
  }
});

visitasRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const visita = await prisma.visita.findUnique({
      where: { id: req.params.id },
      include: {
        congregacao: true,
        visitante: true,
        pendencias: { include: { elemento: { include: { elementoTipo: true } } } },
        servicos: { include: { epis: { include: { epi: true } }, analiseRisco: true } },
        incidentes: true,
      },
    });
    if (!visita) return res.status(404).json({ error: 'Visita não encontrada' });
    res.json(visita);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar visita' });
  }
});

visitasRouter.post('/', validate(createVisitaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, tipo, data, visitanteId, visitanteNome, congregacaoId, relatorio } = req.body;

    const visita = await prisma.visita.create({
      data: {
        salaoId, tipo,
        data: new Date(data),
        visitanteId: visitanteId || null,
        visitanteNome: visitanteNome || null,
        congregacaoId: congregacaoId || null,
        relatorio,
      },
    });
    res.status(201).json(visita);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar visita' });
  }
});

visitasRouter.put('/:id', validate(updateVisitaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, data, visitanteId, visitanteNome, congregacaoId, relatorio } = req.body;
    const update: Prisma.VisitaUncheckedUpdateInput = {};
    if (tipo !== undefined) update.tipo = tipo;
    if (data !== undefined) update.data = new Date(data);
    if (visitanteId !== undefined) update.visitanteId = visitanteId || null;
    if (visitanteNome !== undefined) update.visitanteNome = visitanteNome || null;
    if (congregacaoId !== undefined) update.congregacaoId = congregacaoId || null;
    if (relatorio !== undefined) update.relatorio = relatorio;

    const visita = await prisma.visita.update({ where: { id: req.params.id }, data: update });
    res.json(visita);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Visita não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar visita' });
  }
});

visitasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.visita.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Visita não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir visita' });
  }
});
