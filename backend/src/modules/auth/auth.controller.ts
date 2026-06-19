import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { loginService, refreshService, getMeService } from './auth.service';

const loginSchema = z.object({
  login: z.string().min(3).max(100),
  password: z.string().min(4).max(100),
});

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { login, password } = loginSchema.parse(req.body);
    const result = await loginService(login, password);

    // Refresh token → HttpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 kun
    });

    res.json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'Refresh token yo\'q' });
      return;
    }
    const result = refreshService(refreshToken);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.json({ success: true, message: 'Chiqildi' });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMeService(req.user!.userId);
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};
