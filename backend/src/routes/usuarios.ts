import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../models/prisma';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middlewares/auth';
import { applyListHeaders, parsePagination, parseSort } from '../utils/listing';

export const usuariosRouter = Router();

usuariosRouter.use(authMiddleware, adminMiddleware);

// Listar todos
usuariosRouter.get('/', async (req, res: Response) => {
  const pagination = parsePagination(req.query);
  const sort = parseSort(req.query, ['nome', 'usuario', 'role', 'criadoEm'] as const, 'nome');

  const [total, usuarios] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: { id: true, nome: true, usuario: true, role: true, criadoEm: true },
      orderBy: { [sort.sortBy]: sort.sortOrder },
      skip: pagination.skip,
      take: pagination.take,
    }),
  ]);

  applyListHeaders(res, { ...pagination, ...sort, total });
  res.json(usuarios);
});

// Criar
usuariosRouter.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, usuario, senha, role } = req.body;
  if (!nome || !usuario || !senha || !role) {
    return res.status(400).json({ error: 'Campos obrigatórios: nome, usuario, senha, role' });
  }
  if (!['ADMIN', 'OPERADOR'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida. Use ADMIN ou OPERADOR' });
  }
  const existe = await prisma.user.findUnique({ where: { usuario } });
  if (existe) {
    return res.status(409).json({ error: 'Usuário já existe' });
  }
  const senhaHash = await bcrypt.hash(senha, 10);
  const novo = await prisma.user.create({
    data: { nome, usuario, senhaHash, role },
    select: { id: true, nome: true, usuario: true, role: true, criadoEm: true },
  });
  res.status(201).json(novo);
});

// Atualizar
usuariosRouter.put('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { nome, usuario, senha, role } = req.body;
  if (role && !['ADMIN', 'OPERADOR'].includes(role)) {
    return res.status(400).json({ error: 'Role inválida. Use ADMIN ou OPERADOR' });
  }
  if (usuario) {
    const existe = await prisma.user.findFirst({ where: { usuario, NOT: { id } } });
    if (existe) return res.status(409).json({ error: 'Usuário já existe' });
  }
  const data: Record<string, unknown> = {};
  if (nome) data.nome = nome;
  if (usuario) data.usuario = usuario;
  if (role) data.role = role;
  if (senha) data.senhaHash = await bcrypt.hash(senha, 10);

  const atualizado = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, nome: true, usuario: true, role: true, criadoEm: true },
  });
  res.json(atualizado);
});

// Excluir
usuariosRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  if (id === req.userId) {
    return res.status(400).json({ error: 'Você não pode excluir seu próprio usuário' });
  }
  await prisma.user.delete({ where: { id } });
  res.status(204).send();
});
