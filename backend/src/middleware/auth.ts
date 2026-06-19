import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { UserRole, JwtPayload } from '../types';

// Express Request ga userId va role qo'shish
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// Token tekshirish
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Token mavjud emas' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Token yaroqsiz yoki muddati tugagan' });
  }
};

// Rol tekshirish
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Autentifikatsiya talab etiladi' });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: 'Bu amalni bajarish uchun ruxsat yo\'q',
      });
      return;
    }

    next();
  };
};

// Qulay kombinatsiyalar
export const adminOnly = [authenticate, authorize('super_admin')];
export const adminOrContent = [authenticate, authorize('super_admin', 'content_manager')];
export const allStaff = [authenticate, authorize('super_admin', 'content_manager', 'teacher')];
