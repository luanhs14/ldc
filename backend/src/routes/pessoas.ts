import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';

export const pessoasRouter = Router();
pessoasRouter.use(authMiddleware);

pessoasRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { busca, funcao } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['nome', 'criadoEm'] as const, 'nome');
    const where: Prisma.PessoaWhereInput = {};
    if (busca) where.nome = { contains: String(busca) };
    if (funcao) where.funcoes = { some: { funcao: String(funcao) } };

    const [total, pessoas] = await Promise.all([
      prisma.pessoa.count({ where }),
      prisma.pessoa.findMany({
        where,
        include: { funcoes: true, congregacao: true, saloes: { include: { salao: true } } },
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
    res.json(pessoas);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao listar pessoas' });
  }
});

pessoasRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const pessoa = await prisma.pessoa.findUnique({
      where: { id: req.params.id },
      include: { funcoes: true, congregacao: true, saloes: { include: { salao: true } } },
    });
    if (!pessoa) return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.json(pessoa);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao buscar pessoa' });
  }
});

pessoasRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, congregacaoId, autorizadoAltoRisco, observacoesAutorizacao, funcoes, salaoIds, especialidades } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

    const pessoa = await prisma.pessoa.create({
      data: {
        nome, telefone, email, congregacaoId,
        autorizadoAltoRisco: autorizadoAltoRisco || false,
        observacoesAutorizacao,
        especialidades: especialidades?.length ? especialidades.join(',') : null,
        funcoes: funcoes?.length ? { create: funcoes.map((f: string) => ({ funcao: f })) } : undefined,
        saloes: salaoIds?.length ? { create: salaoIds.map((id: string) => ({ salaoId: id })) } : undefined,
      },
      include: { funcoes: true, saloes: { include: { salao: true } } },
    });
    res.status(201).json(pessoa);
  } catch (e) {
    res.status(500).json({ error: 'Erro ao criar pessoa' });
  }
});

pessoasRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { nome, telefone, email, congregacaoId, autorizadoAltoRisco, observacoesAutorizacao, funcoes, salaoIds, especialidades } = req.body;
    const data: Prisma.PessoaUncheckedUpdateInput = {};
    if (nome !== undefined) data.nome = nome;
    if (telefone !== undefined) data.telefone = telefone;
    if (email !== undefined) data.email = email;
    if (congregacaoId !== undefined) data.congregacaoId = congregacaoId;
    if (autorizadoAltoRisco !== undefined) data.autorizadoAltoRisco = autorizadoAltoRisco;
    if (observacoesAutorizacao !== undefined) data.observacoesAutorizacao = observacoesAutorizacao;
    if (especialidades !== undefined) data.especialidades = especialidades?.length ? especialidades.join(',') : null;

    if (funcoes !== undefined) {
      data.funcoes = {
        deleteMany: {},
        ...(funcoes.length ? { create: funcoes.map((f: string) => ({ funcao: f })) } : {}),
      };
    }

    if (salaoIds !== undefined) {
      data.saloes = {
        deleteMany: {},
        ...(salaoIds.length ? { create: salaoIds.map((id: string) => ({ salaoId: id })) } : {}),
      };
    }

    const pessoa = await prisma.pessoa.update({ where: { id: req.params.id }, data, include: { funcoes: true, saloes: { include: { salao: true } } } });
    res.json(pessoa);
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.status(500).json({ error: 'Erro ao atualizar pessoa' });
  }
});

pessoasRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.pessoa.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Pessoa não encontrada' });
    res.status(500).json({ error: 'Erro ao excluir pessoa' });
  }
});
