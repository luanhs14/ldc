import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';
import { validate } from '../middlewares/validate';
import { createPendenciaSchema, updatePendenciaSchema } from '../schemas/pendencia.schema';

export const pendenciasRouter = Router();
pendenciasRouter.use(authMiddleware);

pendenciasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, status, prioridade, elementoId } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['criadoEm', 'dataLimite', 'prioridade', 'status', 'concluidoEm'] as const, 'criadoEm', 'desc');
    const where: Prisma.PendenciaWhereInput = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (status) where.status = String(status);
    if (prioridade) where.prioridade = String(prioridade);
    if (elementoId) where.elementoId = String(elementoId);

    const [total, pendencias] = await Promise.all([
      prisma.pendencia.count({ where }),
      prisma.pendencia.findMany({
        where,
        include: {
          elemento: { include: { elementoTipo: true } },
          equipamento: true,
          visita: { select: { id: true, tipo: true, data: true } },
          avaliacao: { select: { id: true, tipo: true, data: true } },
        },
        orderBy: sort.sortBy === 'prioridade'
          ? [{ prioridade: sort.sortOrder }, { criadoEm: 'desc' }]
          : { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
    res.json(pendencias);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar pendências' });
  }
});

pendenciasRouter.post('/', validate(createPendenciaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, avaliacaoId, visitaId, elementoId, equipamentoId, descricao, prioridade, risco, responsavel, dataLimite } = req.body;

    const pendencia = await prisma.pendencia.create({
      data: {
        salaoId, avaliacaoId, visitaId, elementoId, equipamentoId, descricao,
        prioridade: prioridade || 'MEDIA',
        risco: risco || null,
        responsavel,
        dataLimite: dataLimite ? new Date(dataLimite) : null,
        status: 'PENDENTE',
      },
      include: { elemento: { include: { elementoTipo: true } } },
    });
    res.status(201).json(pendencia);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar pendência' });
  }
});

pendenciasRouter.put('/:id', validate(updatePendenciaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { descricao, prioridade, risco, responsavel, dataLimite, status, elementoId, equipamentoId } = req.body;
    const data: Prisma.PendenciaUncheckedUpdateInput = {};
    if (descricao !== undefined) data.descricao = descricao;
    if (prioridade !== undefined) data.prioridade = prioridade;
    if (risco !== undefined) data.risco = risco || null;
    if (responsavel !== undefined) data.responsavel = responsavel;
    if (dataLimite !== undefined) data.dataLimite = dataLimite ? new Date(dataLimite) : null;
    if (elementoId !== undefined) data.elementoId = elementoId;
    if (equipamentoId !== undefined) data.equipamentoId = equipamentoId;
    if (status !== undefined) {
      data.status = status;
      if (status === 'CONCLUIDO') data.concluidoEm = new Date();
      else data.concluidoEm = null;
    }

    const pendencia = await prisma.pendencia.update({
      where: { id: req.params.id },
      data,
      include: { elemento: { include: { elementoTipo: true } } },
    });
    res.json(pendencia);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pendência não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar pendência' });
  }
});

pendenciasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.pendencia.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pendência não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir pendência' });
  }
});
