import { Router } from 'express';
import { AppError } from '../lib/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { generateWorkoutPlan, readCurrentPlan, readPlan, readPlanDay } from '../services/workout.service.js';

export const workoutRouter = Router();

workoutRouter.get('/workout-plans/current', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    res.json({ data: await readCurrentPlan(req.supabase, req.user.id) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.post('/ai/workout/generate', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    res.status(201).json({ data: await generateWorkoutPlan(req.supabase, req.user.id) });
  } catch (error) {
    next(error);
  }
});

workoutRouter.get('/workout-plans/days/:id', requireAuth, async (req, res, next) => {
  try {
    if (!req.supabase) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    res.json({ data: await readPlanDay(req.supabase, String(req.params.id)) });
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
