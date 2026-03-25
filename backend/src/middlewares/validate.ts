import { ZodSchema } from 'zod';
import { Request, Response, NextFunction } from 'express';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors[0]?.message ?? 'Dados inválidos';
      return res.status(400).json({ error: message });
    }
    req.body = result.data;
    next();
  };
}
