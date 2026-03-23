import { Router, Response } from 'express';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';

export const saloesRouter = Router();
saloesRouter.use(authMiddleware);

// Listar salões
saloesRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { busca } = req.query;
    const pagination = parsePagination(req.query);
    const sort = parseSort(req.query, ['congregacao', 'codigoBRA', 'bairro', 'criadoEm', 'atualizadoEm'] as const, 'congregacao');
    const where: any = {};
    if (busca) {
      where.OR = [
        { congregacao: { contains: String(busca) } },
        { codigoBRA: { contains: String(busca) } },
      ];
    }
    const [total, saloes] = await Promise.all([
      prisma.salao.count({ where }),
      prisma.salao.findMany({
        where,
        include: {
          congregacoes: true,
          _count: { select: { pendencias: true, elementos: true, visitas: true } },
        },
        orderBy: { [sort.sortBy]: sort.sortOrder },
        skip: pagination.skip,
        take: pagination.take,
      }),
    ]);

    applyListHeaders(res, { ...pagination, ...sort, total });
    res.json(saloes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao listar salões' });
  }
});

// Buscar salão por ID
saloesRouter.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const salao = await prisma.salao.findUnique({
      where: { id: req.params.id },
      include: {
        congregacoes: true,
        responsaveis: { include: { pessoa: { include: { funcoes: true } } } },
        elementos: { include: { elementoTipo: true, equipamentos: true } },
        _count: { select: { pendencias: true, visitas: true, incidentes: true } },
      },
    });
    if (!salao) return res.status(404).json({ error: 'Salão não encontrado' });
    res.json(salao);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar salão' });
  }
});

// Criar salão
saloesRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { congregacao, codigoBRA, endereco, dataConstrucao, dataUltimaReforma, observacoes } = req.body;
    if (!congregacao || !codigoBRA) return res.status(400).json({ error: 'Congregação e código BRA são obrigatórios' });

    const salao = await prisma.salao.create({
      data: {
        congregacao,
        codigoBRA,
        endereco,
        dataConstrucao: dataConstrucao ? new Date(dataConstrucao) : null,
        dataUltimaReforma: dataUltimaReforma ? new Date(dataUltimaReforma) : null,
        observacoes,
      },
    });
    res.status(201).json(salao);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Código BRA já existe' });
    console.error(e);
    res.status(500).json({ error: 'Erro ao criar salão' });
  }
});

// Atualizar salão
saloesRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { congregacao, codigoBRA, endereco, dataConstrucao, dataUltimaReforma, observacoes } = req.body;
    const data: any = {};
    if (congregacao !== undefined) data.congregacao = congregacao;
    if (codigoBRA !== undefined) data.codigoBRA = codigoBRA;
    if (endereco !== undefined) data.endereco = endereco;
    if (dataConstrucao !== undefined) data.dataConstrucao = dataConstrucao ? new Date(dataConstrucao) : null;
    if (dataUltimaReforma !== undefined) data.dataUltimaReforma = dataUltimaReforma ? new Date(dataUltimaReforma) : null;
    if (observacoes !== undefined) data.observacoes = observacoes;

    const salao = await prisma.salao.update({ where: { id: req.params.id }, data });
    res.json(salao);
  } catch (e: any) {
    if (e.code === 'P2002') return res.status(400).json({ error: 'Código BRA já existe' });
    if (e.code === 'P2025') return res.status(404).json({ error: 'Salão não encontrado' });
    console.error(e);
    res.status(500).json({ error: 'Erro ao atualizar salão' });
  }
});

// Excluir salão
saloesRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.salao.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Salão não encontrado' });
    console.error(e);
    res.status(500).json({ error: 'Erro ao excluir salão' });
  }
});

// Timeline / histórico do salão
saloesRouter.get('/:id/historico', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const [visitas, avaliacoes, pendencias, incidentes] = await Promise.all([
      prisma.visita.findMany({
        where: { salaoId: id },
        select: { id: true, tipo: true, data: true, visitanteNome: true, relatorio: true },
        orderBy: { data: 'desc' },
      }),
      prisma.avaliacao.findMany({
        where: { salaoId: id },
        select: { id: true, tipo: true, data: true, avaliador: true },
        orderBy: { data: 'desc' },
      }),
      prisma.pendencia.findMany({
        where: { salaoId: id, status: 'CONCLUIDO' },
        select: { id: true, descricao: true, concluidoEm: true, prioridade: true },
        orderBy: { concluidoEm: 'desc' },
      }),
      prisma.incidente.findMany({
        where: { salaoId: id },
        select: { id: true, tipo: true, data: true, gravidade: true, descricao: true },
        orderBy: { data: 'desc' },
      }),
    ]);

    const eventos = [
      ...visitas.map((v) => ({ tipo: 'VISITA', subtipo: v.tipo, data: v.data, id: v.id, descricao: v.visitanteNome || '', detalhe: v.relatorio })),
      ...avaliacoes.map((a) => ({ tipo: 'AVALIACAO', subtipo: a.tipo, data: a.data, id: a.id, descricao: a.avaliador, detalhe: null })),
      ...pendencias.map((p) => ({ tipo: 'PENDENCIA_CONCLUIDA', subtipo: p.prioridade, data: p.concluidoEm!, id: p.id, descricao: p.descricao, detalhe: null })),
      ...incidentes.map((i) => ({ tipo: 'INCIDENTE', subtipo: i.tipo, data: i.data, id: i.id, descricao: i.descricao, detalhe: null })),
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());

    res.json(eventos);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});
