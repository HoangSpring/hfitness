import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { fitnessRouter } from './routes/fitness.js';
import { workoutRouter } from './routes/workout.js';
import { coachRouter } from './routes/coach.js';
import { foodScanRouter } from './routes/food-scan.js';

export const app = express();
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use('/api/v1/ai/food-scans', express.json({ limit: '4mb' }));
app.use(express.json());
app.use('/api/v1', healthRouter);
app.use('/api/v1', meRouter);
app.use('/api/v1', fitnessRouter);
app.use('/api/v1', workoutRouter);
app.use('/api/v1', coachRouter);
app.use('/api/v1', foodScanRouter);
app.use(errorHandler);

export default app;
