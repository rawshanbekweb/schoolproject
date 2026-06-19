import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorHandler';

// Routerlar
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import newsRouter from './modules/news/news.router';
import questionsRouter from './modules/questions/questions.router';
import analyticsRouter from './modules/analytics/analytics.router';
import scheduleRouter from './modules/schedule/schedule.router';
import achievementsRouter from './modules/achievements/achievements.router';
import controlWorksRouter from './modules/control-works/control-works.router';
import mediaRouter from './modules/media/media.router';
import subjectsRouter from './modules/subjects/subjects.router';
import testConfigsRouter from './modules/test-configs/test-configs.router';
import extraRouter from './modules/extra/extra.router';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Statik fayllar (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ===== ROUTES =====
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/news', newsRouter);
app.use('/api/questions', questionsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/achievements', achievementsRouter);
app.use('/api/control-works', controlWorksRouter);
app.use('/api/media', mediaRouter);
app.use('/api/subjects', subjectsRouter);
app.use('/api/test-configs', testConfigsRouter);
app.use('/api', extraRouter); // school-info, contacts, documents, teachers, classes

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== ERROR HANDLER =====
app.use(errorHandler);

// ===== START =====
const start = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server ishga tushdi: http://localhost:${PORT}`);
    console.log(`📚 Muhit: ${process.env.NODE_ENV || 'development'}`);
  });
};

start();

export default app;
