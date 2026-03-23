import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';

export const incidentesRouter = Router();
incidentesRouter.use(authMiddleware);

incidentesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, status, gravidade } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['data', 'gravidade', 'status', 'criadoEm'] as const, 'data', 'desc');
    const where: any = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (status) where.status = String(status);
    if (gravidade) where.gravidade = String(gravidade);

    const [total, incidentes] = await Promise.all([
      prisma.incidente.count({ where }),
      prisma.incidente.findMany({
        where,
        include: { visita: { select: { id: true, tipo: true } } },
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
    res.json(incidentes);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar incidentes' });
  }
});

incidentesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, visitaId, servicoId, data, local, tipo, descricao, gravidade, acaoCorretiva } = req.body;
    if (!salaoId || !data || !local || !tipo || !descricao || !gravidade) {
      return res.status(400).json({ error: 'salaoId, data, local, tipo, descrição e gravidade são obrigatórios' });
    }
    const incidente = await prisma.incidente.create({
      data: {
        salaoId, visitaId: visitaId || null, servicoId: servicoId || null,
        data: new Date(data), local, tipo, descricao, gravidade, acaoCorretiva,
        status: 'ABERTO',
      },
    });
    res.status(201).json(incidente);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar incidente' });
  }
});

incidentesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { local, tipo, descricao, gravidade, acaoCorretiva, status } = req.body;
    const data: any = {};
    if (local !== undefined) data.local = local;
    if (tipo !== undefined) data.tipo = tipo;
    if (descricao !== undefined) data.descricao = descricao;
    if (gravidade !== undefined) data.gravidade = gravidade;
    if (acaoCorretiva !== undefined) data.acaoCorretiva = acaoCorretiva;
    if (status !== undefined) data.status = status;

    const incidente = await prisma.incidente.update({ where: { id: req.params.id }, data });
    res.json(incidente);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Incidente não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar incidente' });
  }
});

incidentesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.incidente.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Incidente não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir incidente' });
  }
});
