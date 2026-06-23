import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET)) {
  throw new Error('JWT_SECRET va JWT_REFRESH_SECRET production muhitida .env da albatta belgilanishi kerak');
}

const ACCESS_SECRET = process.env.JWT_SECRET || 'changeme_access';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'changeme_refresh';

export const signAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

export const signRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): JwtPayload => {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
};
