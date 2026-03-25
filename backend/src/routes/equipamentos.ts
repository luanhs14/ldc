import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';

export const equipamentosRouter = Router();
equipamentosRouter.use(authMiddleware);

equipamentosRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { elementoId, salaoId } = req.query;
    const where: Prisma.EquipamentoWhereInput = {};
    if (elementoId) where.elementoId = String(elementoId);
    if (salaoId) where.elemento = { salaoId: String(salaoId) };

    const equipamentos = await prisma.equipamento.findMany({
      where,
      include: { elemento: { include: { elementoTipo: true } } },
      orderBy: { nome: 'asc' },
    });
    res.json(equipamentos);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar equipamentos' });
  }
});

equipamentosRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { elementoId, nome, modelo, fabricante, dataInstalacao, garantiaAte, proximaManutencao, observacoes } = req.body;
    if (!elementoId || !nome) return res.status(400).json({ error: 'elementoId e nome são obrigatórios' });

    const equipamento = await prisma.equipamento.create({
      data: {
        elementoId, nome, modelo, fabricante,
        dataInstalacao: dataInstalacao ? new Date(dataInstalacao) : null,
        garantiaAte: garantiaAte ? new Date(garantiaAte) : null,
        proximaManutencao: proximaManutencao ? new Date(proximaManutencao) : null,
        observacoes,
      },
    });
    res.status(201).json(equipamento);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar equipamento' });
  }
});

equipamentosRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, modelo, fabricante, dataInstalacao, garantiaAte, proximaManutencao, observacoes } = req.body;
    const data: Prisma.EquipamentoUpdateInput = {};
    if (nome !== undefined) data.nome = nome;
    if (modelo !== undefined) data.modelo = modelo;
    if (fabricante !== undefined) data.fabricante = fabricante;
    if (dataInstalacao !== undefined) data.dataInstalacao = dataInstalacao ? new Date(dataInstalacao) : null;
    if (garantiaAte !== undefined) data.garantiaAte = garantiaAte ? new Date(garantiaAte) : null;
    if (proximaManutencao !== undefined) data.proximaManutencao = proximaManutencao ? new Date(proximaManutencao) : null;
    if (observacoes !== undefined) data.observacoes = observacoes;

    const equipamento = await prisma.equipamento.update({ where: { id: req.params.id }, data });
    res.json(equipamento);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.status(500).json({ error: 'Erro ao atualizar equipamento' });
  }
});

equipamentosRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.equipamento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Equipamento não encontrado' });
    res.status(500).json({ error: 'Erro ao excluir equipamento' });
  }
});
