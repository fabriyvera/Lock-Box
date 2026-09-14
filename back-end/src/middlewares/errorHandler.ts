import { Request, Response, NextFunction } from 'express';

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Error no controlado:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ message: 'Ruta no encontrada' });
}