import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { answerCoach } from '../services/coach.service.js';
import { normalizeCoachLocale, validateCoachTimezone } from '../services/coachContext.service.js';

export const coachRequestSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(1000),
  timezone: z.string().default('UTC').refine(validateCoachTimezone, 'Invalid timezone.'),
  locale: z.unknown().optional().transform(normalizeCoachLocale),
});

export const coachRouter = Router();

coachRouter.post('/ai/coach', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const parsed = coachRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(422, 'AI_INVALID_REQUEST', 'Enter a message of 1 to 1000 characters and a valid timezone.');
    res.json({ data: await answerCoach(req.supabase, req.user.id, { conversationId: parsed.data.conversation_id, message: parsed.data.message, timezone: parsed.data.timezone, locale: parsed.data.locale }) });
  } catch (error) {
    next(error);
  }
});
