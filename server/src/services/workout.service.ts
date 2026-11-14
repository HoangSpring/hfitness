import type { SupabaseClient } from '@supabase/supabase-js';
import { AppError } from '../lib/errors.js';
import { config } from '../config.js';
import { serviceSupabaseClient } from '../lib/supabase.js';
import { MAX_AI_ATTEMPTS, WORKOUT_PROMPT_VERSION } from '../lib/constants/workout.js';
import { WORKOUT_GENERATOR_V1 } from '../lib/ai/prompts.js';
import { AiProviderError, AiResponseError, createAiProvider, type AiProvider } from '../lib/ai/provider.js';
import { generatedPlanSchema, type EligibleExercise, type GeneratedPlan } from '../lib/schemas/workout.js';
import { getWorkoutValidationDiagnostics, repairDurationOnly, validateGeneratedWorkout } from './workout-validation.service.js';
import { utcDayStart } from '../lib/ai/usage.js';

type UserClient = SupabaseClient;

function currentWeekStart(now = new Date()): string {
  const date = new Date(now);
  const day = date.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  date.setUTCDate(date.getUTCDate() - daysSinceMonday);
  return date.toISOString().slice(0, 10);
}

export function isAiRateLimited(requestCount: number, dailyLimit: number): boolean {
  return requestCount >= dailyLimit;
}

export function hasAiAttemptsRemaining(attempt: number): boolean {
  return attempt < MAX_AI_ATTEMPTS;
}

async function countRequests(userId: string): Promise<number> {
  const { count, error } = await serviceSupabaseClient
    .from('ai_requests')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('type', 'WORKOUT_GENERATION')
    .eq('status', 'SUCCEEDED')
    .gte('created_at', utcDayStart());
  if (error) throw new AppError(500, 'AI_USAGE_READ_FAILED', 'Could not check AI usage.');
  return count ?? 0;
}

async function logRequest(
  userId: string,
  status: string,
  latencyMs: number,
  errorCode?: string,
  diagnostics?: Array<{ rule: string; details: Record<string, number | string> }>,
): Promise<void> {
  const { error } = await serviceSupabaseClient.from('ai_requests').insert({
    user_id: userId,
    type: 'WORKOUT_GENERATION',
    prompt_version: WORKOUT_PROMPT_VERSION,
    status,
    latency_ms: latencyMs,
    error_code: errorCode ?? null,
  });
  if (error) console.error('[ai] request log failure', { code: error.code, message: error.message });
  if (diagnostics && diagnostics.length > 0) {
    console.warn('[ai] workout validation diagnostics', diagnostics);
  }
}

async function localizePlanExercises(client: UserClient, plan: any, locale: string) {
  if (!plan || !plan.workout_plan_days || locale !== 'vi') return plan;

  // Thu thập tất cả các exercise_id có trong kế hoạch
  const exerciseIds = new Set<string>();
  for (const day of plan.workout_plan_days) {
    for (const item of (day.workout_plan_exercises || [])) {
      if (item.exercise_id) exerciseIds.add(item.exercise_id);
    }
  }

  if (exerciseIds.size === 0) return plan;

  // Lấy bản dịch tiếng Việt cho các bài tập này
  const { data: translations } = await client
    .from('exercise_translations')
    .select('exercise_id, name, description, instructions, safety_notes')
    .eq('locale', 'vi')
    .in('exercise_id', Array.from(exerciseIds));

  const translationMap = new Map((translations || []).map((t: any) => [t.exercise_id, t]));

  // Gắn bản dịch vào từng bài tập
  for (const day of plan.workout_plan_days) {
    for (const item of (day.workout_plan_exercises || [])) {
      if (item.exercises && translationMap.has(item.exercise_id)) {
        const trans: any = translationMap.get(item.exercise_id);
        item.exercises = {
          ...item.exercises,
          name: trans.name?.trim() || item.exercises.name,
          description: trans.description?.trim() || item.exercises.description,
          instructions: Array.isArray(trans.instructions) && trans.instructions.length > 0
            ? trans.instructions
            : item.exercises.instructions,
          safety_notes: trans.safety_notes?.trim() || item.exercises.safety_notes,
        };
      }
    }
  }

  return plan;
}

async function attachWorkoutProgress(client: UserClient, plan: any) {
  const days = plan.workout_plan_days as Array<{ id: string }>;
  const dayIds = days.map((day) => day.id);
  if (dayIds.length === 0) return plan;

  const { data: sessions, error } = await client
    .from('workout_sessions')
    .select('plan_day_id, status, finished_at')
    .in('plan_day_id', dayIds)
    .in('status', ['COMPLETED', 'SKIPPED'])
    .order('finished_at', { ascending: false });
  if (error) throw new AppError(500, 'WORKOUT_PROGRESS_READ_FAILED', 'Could not load workout progress.');

  const progressByDay = new Map<string, { status: 'COMPLETED' | 'SKIPPED'; finished_at: string }>();
  for (const session of sessions ?? []) {
    if (session.plan_day_id && !progressByDay.has(session.plan_day_id)) {
      progressByDay.set(session.plan_day_id, {
        status: session.status as 'COMPLETED' | 'SKIPPED',
        finished_at: session.finished_at,
      });
    }
  }

  return {
    ...plan,
    workout_plan_days: days.map((day) => ({
      ...day,
      progress: progressByDay.get(day.id) ?? null,
    })),
  };
}

async function readPlan(client: UserClient, planId: string, locale: string = 'en'): Promise<unknown> {
  const { data, error } = await client
    .from('workout_plans')
    .select('*, workout_plan_days(*, workout_plan_exercises(*, exercises(id, name, slug, primary_muscle, safety_notes, image_url, image_urls, video_url)))')
    .eq('id', planId)
    .maybeSingle();
  if (error) throw new AppError(500, 'WORKOUT_PLAN_READ_FAILED', 'Could not load your workout plan.');
  if (!data) throw new AppError(404, 'WORKOUT_PLAN_NOT_FOUND', 'Workout plan not found.');
  return localizePlanExercises(client, await attachWorkoutProgress(client, data), locale);
}

export async function readPlanDay(client: UserClient, dayId: string, locale: string = 'en'): Promise<unknown> {
  const { data, error } = await client
    .from('workout_plan_days')
    .select('id, plan_id, day_index, name, muscle_focus, workout_plans!inner(id), workout_plan_exercises(id, exercise_id, position, sets, reps_min, reps_max, rest_seconds, notes, exercises(id, name, slug, primary_muscle, safety_notes, image_url, image_urls, video_url))')
    .eq('id', dayId)
    .maybeSingle();
  if (error) throw new AppError(500, 'WORKOUT_DAY_READ_FAILED', 'Could not load this workout day.');
  if (!data) throw new AppError(404, 'WORKOUT_DAY_NOT_FOUND', 'Workout day not found.');

  // Đóng gói thành cấu trúc dạng plan giả lập để dùng chung hàm localizePlanExercises
  const pseudoPlan = { workout_plan_days: [data] };
  await localizePlanExercises(client, pseudoPlan, locale);
  return data;
}

export async function generateWorkoutPlan(
  client: UserClient,
  userId: string,
  provider: AiProvider = createAiProvider(),
  locale: 'en' | 'vi' = 'en',
): Promise<unknown> {
  if (isAiRateLimited(await countRequests(userId), config.AI_DAILY_LIMIT)) {
    throw new AppError(429, 'AI_RATE_LIMIT', 'You have reached your daily AI limit. Try again tomorrow.');
  }

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('goal, experience, days_per_week, session_minutes, equipment')
    .eq('id', userId)
    .maybeSingle();
  if (profileError || !profile?.goal || !profile.experience || !profile.days_per_week || !profile.session_minutes) {
    throw new AppError(422, 'PROFILE_INCOMPLETE', 'Complete your profile before generating a workout plan.');
  }

  const { data: assessment, error: assessmentError } = await client
    .from('fitness_assessments')
    .select('calorie_target, protein_g')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (assessmentError) throw new AppError(500, 'ASSESSMENT_READ_FAILED', 'Could not load your assessment.');
  if (!assessment) throw new AppError(404, 'ASSESSMENT_NOT_FOUND', 'Assessment not found.');

  const { data: exercises, error: exerciseError } = await client
    .from('exercises')
    .select('id, name, primary_muscle, equipment, status')
    .eq('status', 'PUBLISHED');
  if (exerciseError) throw new AppError(500, 'EXERCISE_READ_FAILED', 'Could not load eligible exercises.');
  const equipment = Array.isArray(profile.equipment) ? profile.equipment : [];
  const eligible = (exercises ?? []).filter((exercise) => exercise.equipment === 'bodyweight' || equipment.includes(exercise.equipment)) as EligibleExercise[];
  if (eligible.length < 3) throw new AppError(422, 'WORKOUT_GENERATION_FAILED', 'There are not enough eligible exercises for a plan.');

  const prompt = WORKOUT_GENERATOR_V1({
    goal: profile.goal,
    experience: profile.experience,
    daysPerWeek: profile.days_per_week,
    sessionMinutes: profile.session_minutes,
    equipment,
    assessment,
    exercises: eligible.map(({ id, name, primary_muscle }) => ({ id, name, primary_muscle })),
    locale,
  });
  console.info('[ai] workout generation started', { timeout_ms: config.AI_TIMEOUT_MS, max_attempts: MAX_AI_ATTEMPTS });
  let lastError = 'WORKOUT_GENERATION_FAILED';
  for (let attempt = 0; hasAiAttemptsRemaining(attempt); attempt += 1) {
    const started = Date.now();
    console.info('[ai] workout generation attempt', { attempt: attempt + 1 });
    try {
      const plan = await provider.generateStructured(prompt, generatedPlanSchema);
      const repaired = repairDurationOnly({
        plan,
        exercises: eligible,
        equipment,
        daysPerWeek: profile.days_per_week,
        sessionMinutes: profile.session_minutes,
      });
      const validationInput = {
        plan: repaired.plan,
        exercises: eligible,
        equipment,
        daysPerWeek: profile.days_per_week,
        sessionMinutes: profile.session_minutes,
      };
      const validationDiagnostics = getWorkoutValidationDiagnostics(validationInput);
      const validationErrors = validateGeneratedWorkout(validationInput);
      if (validationErrors.length > 0) {
        const firstDiagnostic = validationDiagnostics[0];
        lastError = firstDiagnostic?.code ?? 'WORKOUT_VALIDATION_FAILED';
        await logRequest(userId, 'VALIDATION_FAILED', Date.now() - started, lastError, validationDiagnostics);
        continue;
      }
      if (repaired.repairedDays.length > 0) {
        console.info('[ai] repaired duration-only rules', { days: repaired.repairedDays });
      }
      await logRequest(userId, 'SUCCEEDED', Date.now() - started);
      console.info('[ai] workout generation succeeded', { attempt: attempt + 1, latency_ms: Date.now() - started });
      const { data: savedPlan, error: planError } = await client
        .from('workout_plans')
        .insert({ user_id: userId, name: plan.name, goal: profile.goal, source: 'AI', status: 'DRAFT', week_start: currentWeekStart() })
        .select('id')
        .single();
      if (planError || !savedPlan) throw new AppError(500, 'WORKOUT_PLAN_SAVE_FAILED', 'Could not save your workout plan.');
      const { error: archiveError } = await client
        .from('workout_plans')
        .update({ status: 'ARCHIVED' })
        .eq('user_id', userId)
        .eq('status', 'DRAFT')
        .neq('id', savedPlan.id);
      if (archiveError) throw new AppError(500, 'WORKOUT_PLAN_SAVE_FAILED', 'Could not save your workout plan.');
      for (const day of repaired.plan.days) {
        const { data: savedDay, error: dayError } = await client
          .from('workout_plan_days')
          .insert({ plan_id: savedPlan.id, day_index: day.day_index, name: day.name, muscle_focus: day.muscle_focus })
          .select('id')
          .single();
        if (dayError || !savedDay) throw new AppError(500, 'WORKOUT_PLAN_SAVE_FAILED', 'Could not save your workout plan.');
        const { error: exerciseSaveError } = await client.from('workout_plan_exercises').insert(
          day.exercises.map((exercise) => ({ ...exercise, plan_day_id: savedDay.id })),
        );
        if (exerciseSaveError) throw new AppError(500, 'WORKOUT_PLAN_SAVE_FAILED', 'Could not save your workout plan.');
      }
      return readPlan(client, savedPlan.id, locale);
    } catch (error) {
      if (error instanceof AppError) throw error;
      lastError = error instanceof AiProviderError
        ? error.code
        : error instanceof AiResponseError
          ? 'AI_INVALID_RESPONSE'
          : 'WORKOUT_GENERATION_FAILED';
      await logRequest(userId, error instanceof AiResponseError ? 'VALIDATION_FAILED' : 'FAILED', Date.now() - started, lastError);
    }
  }
  if (lastError.startsWith('AI_PROVIDER_')) {
    throw new AppError(502, lastError, 'The AI provider is temporarily unavailable.');
  }
  throw new AppError(422, 'WORKOUT_GENERATION_FAILED', 'We could not create a valid workout plan. Please try again.');
}

export { readPlan };

export async function readCurrentPlan(client: UserClient, userId: string, locale: string = 'en'): Promise<unknown | null> {
  const { data, error } = await client
    .from('workout_plans')
    .select('id')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'DRAFT'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AppError(500, 'WORKOUT_PLAN_READ_FAILED', 'Could not load your workout plan.');
  return data ? readPlan(client, data.id, locale) : null;
}

export async function ensureCurrentWeeklyPlan(client: UserClient, userId: string, locale: 'en' | 'vi' = 'en'): Promise<unknown | null> {
  const { data, error } = await client
    .from('workout_plans')
    .select('id, week_start')
    .eq('user_id', userId)
    .in('status', ['ACTIVE', 'DRAFT'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new AppError(500, 'WORKOUT_PLAN_READ_FAILED', 'Could not load your workout plan.');
  if (!data) return null;
  if (data.week_start >= currentWeekStart()) return readPlan(client, data.id, locale);
  return generateWorkoutPlan(client, userId, undefined, locale);
}