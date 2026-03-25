import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createElementoSchema, updateElementoSchema } from '../schemas/elemento.schema';

export const elementosRouter = Router();
elementosRouter.use(authMiddleware);

// Listar tipos de elemento (tabela mestre)
elementosRouter.get('/tipos', async (_req: AuthRequest, res: Response) => {
  try {
    const tipos = await prisma.elementoTipo.findMany({ orderBy: { nome: 'asc' } });
    res.json(tipos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar tipos' });
  }
});

// Listar elementos de um salão
elementosRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId } = req.query;
    if (!salaoId) return res.status(400).json({ error: 'salaoId é obrigatório' });

    const elementos = await prisma.elemento.findMany({
      where: { salaoId: String(salaoId) },
      include: { elementoTipo: true, equipamentos: true },
      orderBy: { elementoTipo: { nome: 'asc' } },
    });
    res.json(elementos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar elementos' });
  }
});

elementosRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const elemento = await prisma.elemento.findUnique({
      where: { id: req.params.id },
      include: { elementoTipo: true, equipamentos: true, pendencias: { orderBy: { criadoEm: 'desc' }, take: 10 } },
    });
    if (!elemento) return res.status(404).json({ error: 'Elemento não encontrado' });
    res.json(elemento);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar elemento' });
  }
});

elementosRouter.post('/', validate(createElementoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { salaoId, elementoTipoId, nomeCustomizado, dataInstalacao, condicaoAtual, vidaUtilAnos, proximaManutencao, observacoes } = req.body;

    const elemento = await prisma.elemento.create({
      data: {
        salaoId, elementoTipoId, nomeCustomizado,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
        condicaoAtual: condicaoAtual || 'BOM',
        vidaUtilAnos: vidaUtilAnos ? Number(vidaUtilAnos) : null,
        proximaManutencao: proximaManutencao ? new Date(proximaManutencao) : null,
        observacoes,
      },
      include: { elementoTipo: true },
    });
    res.status(201).json(elemento);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar elemento' });
  }
});

elementosRouter.put('/:id', validate(updateElementoSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { nomeCustomizado, dataInstalacao, condicaoAtual, vidaUtilAnos, proximaManutencao, observacoes } = req.body;
    const data: Prisma.ElementoUpdateInput = {};
    if (nomeCustomizado !== undefined) data.nomeCustomizado = nomeCustomizado;
    if (dataInstalacao !== undefined) data.dataInstalacao = dataInstalacao ? new Date(dataInstalacao) : null;
    if (condicaoAtual !== undefined) data.condicaoAtual = condicaoAtual;
    if (vidaUtilAnos !== undefined) data.vidaUtilAnos = vidaUtilAnos ? Number(vidaUtilAnos) : null;
    if (proximaManutencao !== undefined) data.proximaManutencao = proximaManutencao ? new Date(proximaManutencao) : null;
    if (observacoes !== undefined) data.observacoes = observacoes;

    const elemento = await prisma.elemento.update({ where: { id: req.params.id }, data, include: { elementoTipo: true } });
    res.json(elemento);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Elemento não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar elemento' });
  }
});

elementosRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.elemento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Elemento não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir elemento' });
  }
});
