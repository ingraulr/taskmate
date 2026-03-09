import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (
  req: Request, res: Response, next: NextFunction
) => {
  const token =
    req.headers.authorization?.split(' ')[1];
  if (!token)
    return res.status(401).json({ error: 'Sin token' });
  try {
    const decoded = jwt.verify(
      token, process.env.JWT_SECRET!) as any;
    (req as any).userId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
};