import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const servicosRouter = Router();
servicosRouter.use(authMiddleware);

servicosRouter.get('/epis', async (_req: AuthRequest, res: Response) => {
  try {
    const epis = await prisma.epi.findMany({ orderBy: { nome: 'asc' } });
    res.json(epis);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar EPIs' });
  }
});

servicosRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, status } = req.query;
    const where: any = {};
    if (salaoId) where.salaoId = String(salaoId);
    if (status) where.status = String(status);

    const servicos = await prisma.servicoAltoRisco.findMany({
      where,
      include: {
        epis: { include: { epi: true } },
        analiseRisco: true,
        visita: { select: { id: true, tipo: true, data: true } },
      },
      orderBy: { data: 'desc' },
    });
    res.json(servicos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar serviços' });
  }
});

servicosRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, visitaId, pendenciaId, tipo, descricao, autorizadoPor, treinamentosNecessarios, data, status, epiIds, analiseRisco } = req.body;
    if (!salaoId || !tipo || !descricao || !data) {
      return res.status(400).json({ error: 'salaoId, tipo, descricao e data são obrigatórios' });
    }

    const servico = await prisma.servicoAltoRisco.create({
      data: {
        salaoId, visitaId: visitaId || null, pendenciaId: pendenciaId || null,
        tipo, descricao, autorizadoPor, treinamentosNecessarios,
        data: new Date(data),
        status: status || 'PLANEJADO',
        epis: epiIds?.length ? { create: epiIds.map((epiId: string) => ({ epiId })) } : undefined,
        analiseRisco: analiseRisco ? {
          create: {
            riscosIdentificados: analiseRisco.riscosIdentificados,
            medidasControle: analiseRisco.medidasControle,
            responsavel: analiseRisco.responsavel,
            data: new Date(analiseRisco.data),
          },
        } : undefined,
      },
      include: { epis: { include: { epi: true } }, analiseRisco: true },
    });
    res.status(201).json(servico);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar serviço' });
  }
});

servicosRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { tipo, descricao, autorizadoPor, treinamentosNecessarios, data, status, epiIds } = req.body;
    const update: any = {};
    if (tipo !== undefined) update.tipo = tipo;
    if (descricao !== undefined) update.descricao = descricao;
    if (autorizadoPor !== undefined) update.autorizadoPor = autorizadoPor;
    if (treinamentosNecessarios !== undefined) update.treinamentosNecessarios = treinamentosNecessarios;
    if (data !== undefined) update.data = new Date(data);
    if (status !== undefined) update.status = status;

    if (epiIds !== undefined) {
      update.epis = {
        deleteMany: {},
        ...(epiIds.length ? { create: epiIds.map((epiId: string) => ({ epiId })) } : {}),
      };
    }

    const servico = await prisma.servicoAltoRisco.update({
      where: { id: req.params.id },
      data: update,
      include: { epis: { include: { epi: true } }, analiseRisco: true },
    });
    res.json(servico);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Serviço não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar serviço' });
  }
});

servicosRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.servicoAltoRisco.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Serviço não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir serviço' });
  }
});
