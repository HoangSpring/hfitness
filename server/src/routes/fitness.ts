import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../lib/errors.js';
import { FORMULA_VERSION } from '../lib/constants/fitness.js';
import { fitnessInputSchema } from '../lib/schemas/fitness.js';
import { requireAuth } from '../middleware/auth.js';
import { calculateTargets } from '../services/fitness.service.js';
import { logFitnessFailure, logSupabaseFailure } from '../lib/supabase-error.js';

const profileSchema = fitnessInputSchema.extend({
  session_minutes: z.number().int().min(15).max(180),
  equipment: z.array(z.string()).default([]),
  allergies: z.array(z.string()).default([]),
  disliked_foods: z.array(z.string()).default([]),
  meals_per_day: z.number().int().min(1).max(8),
});

export const fitnessRouter = Router();

fitnessRouter.post('/fitness/assessment', requireAuth, async (req, res, next) => {
  let step = 'setup';
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    step = 'read profile';
    const { data: profile, error: profileError } = await req.supabase
      .from('profiles')
      .select('age, gender, height_cm, weight_kg, goal, experience, days_per_week, session_minutes, equipment, allergies, disliked_foods, meals_per_day')
      .eq('id', req.user.id)
      .single();
    if (profileError) {
      logSupabaseFailure(step, profileError);
      throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete your profile before calculating targets.');
    }
    if (!profile) {
      logFitnessFailure(step, 'Profile was not found.');
      throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete your profile before calculating targets.');
    }

    step = 'validate profile';
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      logFitnessFailure(step, 'Profile validation failed.');
      throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete your profile before calculating targets.');
    }

    step = 'calculate targets';
    let targets;
    try {
      targets = calculateTargets(parsed.data);
    } catch (error) {
      logFitnessFailure(step, error);
      throw new AppError(422, 'ASSESSMENT_CALCULATION_FAILED', 'Could not calculate your assessment.');
    }

    const assessmentInput = {
      age: parsed.data.age,
      gender: parsed.data.gender,
      height_cm: parsed.data.height_cm,
      weight_kg: parsed.data.weight_kg,
      goal: parsed.data.goal,
      experience: parsed.data.experience,
      days_per_week: parsed.data.days_per_week,
    };

    step = 'insert assessment';
    const { data: assessment, error } = await req.supabase
      .from('fitness_assessments')
      .insert({ user_id: req.user.id, ...assessmentInput, ...targets, formula_version: FORMULA_VERSION })
      .select()
      .single();
    if (error) {
      logSupabaseFailure(step, error);
      throw new AppError(500, 'ASSESSMENT_SAVE_FAILED', 'Could not save your assessment.');
    }
    if (!assessment) {
      logFitnessFailure(step, 'Assessment insert returned no row.');
      throw new AppError(500, 'ASSESSMENT_SAVE_FAILED', 'Could not save your assessment.');
    }
    res.status(201).json({ data: assessment });
  } catch (error) {
    if (!(error instanceof AppError)) logFitnessFailure(step, error);
    next(error);
  }
});

fitnessRouter.get('/fitness/assessment', requireAuth, async (req, res, next) => {
  let step = 'setup';
  try {
    if (!req.supabase || !req.user) throw new AppError(401, 'UNAUTHORIZED', 'Authentication is required.');
    step = 'read latest assessment';
    const { data, error } = await req.supabase
      .from('fitness_assessments')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) {
      logSupabaseFailure(step, error);
      throw new AppError(500, 'ASSESSMENT_READ_FAILED', 'Could not load your assessment.');
    }
    if (!data) {
      logFitnessFailure(step, 'No assessment row was found.');
      throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found.');
    }
    res.json({ data });
  } catch (error) {
    if (!(error instanceof AppError)) logFitnessFailure(step, error);
    next(error);
  }
});
