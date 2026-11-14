import { Router } from 'express';
import { AppError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { ensureCurrentWeeklyPlan, generateWorkoutPlan, readPlan, readPlanDay } from '../services/workout.service.js';
import { z } from 'zod';

export const workoutGenerateRequestSchema = z.object({ locale: z.enum(['en', 'vi']).default('en') });

export const workoutRouter = Router();

workoutRouter.get('/workout-plans/current', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const locale = req.query.locale === 'vi' ? 'vi' : 'en';
    res.json({ data: await ensureCurrentWeeklyPlan(req.supabase, req.user.id, locale) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.post('/ai/workout/generate', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const parsed = workoutGenerateRequestSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError(422, 'AI_INVALID_REQUEST', 'Invalid workout generation request.');
    res.status(201).json({ data: await generateWorkoutPlan(req.supabase, req.user.id, undefined, parsed.data.locale) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.get('/workout-plans/days/:id', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const locale = typeof req.query.locale === 'string' ? req.query.locale : 'en';
    res.json({ data: await readPlanDay(req.supabase, String(req.params.id), locale) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.get('/workout-plans/:id', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const planId = String(req.params.id);
    res.json({ data: await readPlan(req.supabase, planId) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.post('/workout-plans/:id/activate', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    const planId = String(req.params.id);
    const { data, error } = await req.supabase.rpc('activate_workout_plan', { plan_id: planId });
    if (error || !data) throw new AppError(422, 'WORKOUT_PLAN_NOT_ACTIVATABLE', 'Only a draft workout plan can be activated.');
    res.json({ data: await readPlan(req.supabase, planId) });
  } catch (error) {
    next(error);
  }
});