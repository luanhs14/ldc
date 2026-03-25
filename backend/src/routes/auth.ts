import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../models/prisma';
import { authMiddleware, AuthRequest } from '../middlewares/auth';
import { JWT_SECRET } from '../config';
import { validate } from '../middlewares/validate';
import { loginSchema, alterarSenhaSchema } from '../schemas/auth.schema';
const COOKIE_NAME = 'ldc_auth';

function getCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: isProduction,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
}

export const authRouter = Router();

authRouter.post('/login', validate(loginSchema), async (req: Request, res: Response) => {
  try {
    const { usuario, senha } = req.body;

    const user = await prisma.user.findUnique({ where: { usuario } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const senhaValida = await bcrypt.compare(senha, user.senhaHash);
    if (!senhaValida) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });

    res.cookie(COOKIE_NAME, token, getCookieOptions());
    res.json({
      user: { id: user.id, nome: user.nome, usuario: user.usuario, role: user.role },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

authRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
  res.status(204).send();
});

authRouter.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, nome: true, usuario: true, role: true },
    });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

authRouter.put('/senha', authMiddleware, validate(alterarSenhaSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { senhaAtual, novaSenha } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });

    const senhaValida = await bcrypt.compare(senhaAtual, user.senhaHash);
    if (!senhaValida) {
      return res.status(400).json({ error: 'Senha atual incorreta' });
    }

    const senhaHash = await bcrypt.hash(novaSenha, 10);
    await prisma.user.update({ where: { id: req.userId }, data: { senhaHash } });

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro interno' });
  }
});
