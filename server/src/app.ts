import cors from 'cors';
import express from 'express';
import { config } from './config.js';
import { errorHandler } from './middleware/error-handler.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';
import { fitnessRouter } from './routes/fitness.js';

export const app = express();
app.use(cors({ origin: config.CORS_ORIGIN }));
app.use(express.json());
app.use('/api/v1', healthRouter);
app.use('/api/v1', meRouter);
app.use('/api/v1', fitnessRouter);
app.use(errorHandler);
