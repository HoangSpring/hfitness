import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { analyzeFoodScan } from '../services/food-scan.service.js';
import { requireAuth } from '../middleware/auth.js';

export const foodScanRequestSchema = z.object({
  image: z.string().min(1),
  mime_type: z.string().min(1),
  locale: z.enum(['en', 'vi']).default('en'),
  timezone: z.string().optional(),
}).strict();

export const foodScanRouter = Router();

foodScanRouter.post('/ai/food-scans', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const parsed = foodScanRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(400, 'AI_INVALID_REQUEST', 'Provide a base64 image and a supported locale.');
    res.json({ data: await analyzeFoodScan(req.supabase, req.user.id, parsed.data) });
  } catch (error) {
    next(error);
  }
});
