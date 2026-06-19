import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Zod validation xatosi
  if (err.name === 'ZodError') {
    res.status(400).json({
      success: false,
      message: 'Validatsiya xatosi',
      errors: JSON.parse(err.message),
    });
    return;
  }

  // PostgreSQL unique constraint
  if ((err as any).code === '23505') {
    res.status(409).json({
      success: false,
      message: 'Bu ma\'lumot allaqachon mavjud',
    });
    return;
  }

  console.error('❌ Server xatosi:', err);
  res.status(500).json({
    success: false,
    message: 'Server xatosi yuz berdi',
  });
};
