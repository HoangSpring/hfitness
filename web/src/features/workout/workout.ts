import { apiRequest } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import type { Locale } from '../../i18n/en';

export type PlanExercise = {
  id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string | null;
  exercises?: {
    name: string;
    slug: string;
    primary_muscle: string;
    safety_notes?: string;
    image_url?: string | null;
    image_urls?: string[];
    video_url?: string | null;
    exercise_translations?: { name?: string; safety_notes?: string; locale?: string }[] | null;
  } | null;
};

export type PlanDay = {
  id: string;
  day_index: number;
  name: string;
  muscle_focus: string;
  workout_plan_exercises: PlanExercise[];
  progress: { status: 'COMPLETED' | 'SKIPPED'; finished_at: string } | null;
};

export type WorkoutPlan = {
  id: string;
  name: string;
  goal: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  workout_plan_days: PlanDay[];
};

export type WeekdayKey = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type WeeklyScheduleEntry = {
  weekday: WeekdayKey;
  day: PlanDay | null;
};

const WEEKDAYS: WeekdayKey[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const WORKOUT_DAY_POSITIONS: Record<number, number[]> = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 3, 4],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

export function getWeeklySchedule(days: PlanDay[]): WeeklyScheduleEntry[] {
  const positions = WORKOUT_DAY_POSITIONS[days.length] ?? days.map((_, index) => index % WEEKDAYS.length);
  const dayByWeekday = new Map(positions.map((weekdayIndex, dayIndex) => [weekdayIndex, days[dayIndex] ?? null]));
  return WEEKDAYS.map((weekday, weekdayIndex) => ({ weekday, day: dayByWeekday.get(weekdayIndex) ?? null }));
}

export function getScheduledWeekday(days: PlanDay[], dayIndex: number): WeekdayKey | null {
  return getWeeklySchedule(days).find((entry) => entry.day?.id === days[dayIndex]?.id)?.weekday ?? null;
}

export function requiresPastWorkoutConfirmation(days: PlanDay[], dayIndex: number, now = new Date()): boolean {
  const scheduledWeekday = getScheduledWeekday(days, dayIndex);
  if (!scheduledWeekday) return false;
  const scheduledIndex = WEEKDAYS.indexOf(scheduledWeekday);
  const todayIndex = (now.getDay() + 6) % 7;
  return scheduledIndex < todayIndex;
}

export type WorkoutDayState = 'completed' | 'skipped' | 'up_next' | 'upcoming' | 'locked';

export function localDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function getCurrentWorkoutDayIndex(days: PlanDay[], now = new Date()): number | null {
  const firstPendingIndex = days.findIndex((day) => !day.progress);
  if (firstPendingIndex < 0) return null;
  const previous = days[firstPendingIndex - 1];
  if (previous?.progress?.status === 'COMPLETED' && localDateKey(new Date(previous.progress.finished_at)) === localDateKey(now)) return null;
  return firstPendingIndex;
}

export function getWorkoutDayState(days: PlanDay[], index: number, now = new Date()): WorkoutDayState {
  const progress = days[index].progress;
  if (progress?.status === 'COMPLETED') return 'completed';
  if (progress?.status === 'SKIPPED') return 'skipped';
  return getCurrentWorkoutDayIndex(days, now) === index ? 'up_next' : getCurrentWorkoutDayIndex(days, now) === null ? 'locked' : 'upcoming';
}

export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED' | 'SKIPPED';
export type WorkoutSet = {
  id: string;
  session_id: string;
  user_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number;
  reps: number;
  rpe: number | null;
  created_at: string;
};
export type WorkoutSession = {
  id: string;
  user_id: string;
  plan_day_id: string | null;
  status: SessionStatus;
  started_at: string;
  finished_at: string | null;
  notes: string | null;
};
export type SessionExercise = PlanExercise & {
  exercises?: {
    name: string;
    slug: string;
    primary_muscle: string;
    safety_notes?: string;
    image_url?: string | null;
    image_urls?: string[];
    video_url?: string | null;
  } | null;
};
export type SessionData = WorkoutSession & { day: PlanDay | null; sets: WorkoutSet[] };
export type HistoryItem = WorkoutSession & {
  day: Pick<PlanDay, 'name' | 'day_index'> | null;
  sets: WorkoutSet[];
};

export function localizeWorkoutExercise(exercise: NonNullable<PlanExercise['exercises']> | null | undefined, locale: Locale) {
  const translation = exercise?.exercise_translations?.[0];
  if (!exercise || locale !== 'vi' || !translation) return exercise;
  return { ...exercise, name: translation.name?.trim() || exercise.name, safety_notes: translation.safety_notes?.trim() || exercise.safety_notes };
}

export function estimateDayMinutes(day: Pick<PlanDay, 'workout_plan_exercises'>): number {
  return Math.round(day.workout_plan_exercises.reduce((total, item) => total + item.sets * (40 + item.rest_seconds), 0) / 60);
}

export function getCurrentPlan(locale: Locale = 'en') {
  return apiRequest<WorkoutPlan | null>(`/workout-plans/current?locale=${locale}`);
}

export function generatePlan(locale: 'en' | 'vi' = 'en') {
  return apiRequest<WorkoutPlan>('/ai/workout/generate', { method: 'POST', body: JSON.stringify({ locale }) });
}

export function activatePlan(id: string) {
  return apiRequest<WorkoutPlan>(`/workout-plans/${id}/activate`, { method: 'POST' });
}

export function getPlanDay(id: string, locale: Locale = 'en') {
  return apiRequest<PlanDay>(`/workout-plans/days/${id}?locale=${locale}`);
}

export async function startWorkout(planDayId: string): Promise<WorkoutSession> {
  const existing = await supabase.from('workout_sessions').select('*').eq('status', 'IN_PROGRESS').maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) return existing.data as WorkoutSession;
  const created = await supabase.rpc('start_workout_session', { p_plan_day_id: planDayId });
  if (!created.error && created.data) return created.data as WorkoutSession;
  if (created.error?.message.includes('WORKOUT_DAY_ALREADY_COMPLETED_TODAY')) {
    throw Object.assign(new Error(created.error.message), { code: 'WORKOUT_DAY_ALREADY_COMPLETED_TODAY' });
  }
  if (created.error?.message.includes('WORKOUT_SESSION_IN_PROGRESS')) {
    throw Object.assign(new Error(created.error.message), { code: 'WORKOUT_SESSION_IN_PROGRESS' });
  }
  throw created.error ?? new Error('Could not start workout.');
}

export async function getSession(id: string): Promise<SessionData> {
  const sessionResult = await supabase.from('workout_sessions').select('*').eq('id', id).maybeSingle();
  if (sessionResult.error) throw sessionResult.error;
  if (!sessionResult.data) throw Object.assign(new Error('Workout session not found.'), { code: 'SESSION_NOT_FOUND' });
  const setsResult = await supabase.from('workout_sets').select('*').eq('session_id', id).order('set_number');
  if (setsResult.error) throw setsResult.error;
  const day = sessionResult.data.plan_day_id ? await getPlanDay(sessionResult.data.plan_day_id) : null;
  return { ...(sessionResult.data as WorkoutSession), day, sets: (setsResult.data ?? []) as WorkoutSet[] };
}

export async function saveSet(input: Omit<WorkoutSet, 'id' | 'user_id' | 'created_at'> & { id?: string }): Promise<WorkoutSet> {
  const values = { session_id: input.session_id, exercise_id: input.exercise_id, set_number: input.set_number, weight_kg: input.weight_kg, reps: input.reps, rpe: input.rpe };
  const result = input.id
    ? await supabase.from('workout_sets').update(values).eq('id', input.id).select('*').single()
    : await supabase.from('workout_sets').insert(values).select('*').single();
  if (result.error || !result.data) throw result.error ?? new Error('Could not save set.');
  return result.data as WorkoutSet;
}

export async function deleteSet(id: string): Promise<void> {
  const result = await supabase.from('workout_sets').delete().eq('id', id);
  if (result.error) throw result.error;
}

export async function finishWorkout(id: string): Promise<WorkoutSession> {
  const result = await supabase.rpc('finish_workout_session', { session_id: id });
  if (result.error || !result.data) throw result.error ?? new Error('Could not finish workout.');
  return result.data as WorkoutSession;
}

export async function abandonWorkout(id: string): Promise<WorkoutSession> {
  const result = await supabase.rpc('abandon_workout_session', { session_id: id });
  if (result.error || !result.data) throw result.error ?? new Error('Could not abandon workout.');
  return result.data as WorkoutSession;
}

export async function skipWorkoutDay(planDayId: string): Promise<WorkoutSession> {
  const active = await supabase.from('workout_sessions').select('id, plan_day_id').eq('status', 'IN_PROGRESS').maybeSingle();
  if (active.error) throw active.error;
  if (active.data) {
    await abandonWorkout(active.data.id);
  }
  const result = await supabase.rpc('skip_workout_day', { p_plan_day_id: planDayId });
  if (result.error || !result.data) throw result.error ?? new Error('Could not skip workout day.');
  return result.data as WorkoutSession;
}

export async function getPreviousSets(exerciseId: string, sessionId: string): Promise<WorkoutSet[]> {
  const sessions = await supabase.from('workout_sessions').select('id').eq('status', 'COMPLETED').neq('id', sessionId).order('finished_at', { ascending: false });
  if (sessions.error) throw sessions.error;
  for (const session of sessions.data ?? []) {
    const sets = await supabase.from('workout_sets').select('*').eq('exercise_id', exerciseId).eq('session_id', session.id).order('set_number');
    if (sets.error) throw sets.error;
    if (sets.data && sets.data.length > 0) return sets.data as WorkoutSet[];
  }
  return [];
}

export async function getAllPreviousSets(exerciseId: string, sessionId: string): Promise<WorkoutSet[]> {
  const sessions = await supabase.from('workout_sessions').select('id').eq('status', 'COMPLETED').neq('id', sessionId);
  if (sessions.error) throw sessions.error;
  const ids = (sessions.data ?? []).map((session) => session.id);
  if (ids.length === 0) return [];
  const sets = await supabase.from('workout_sets').select('*').eq('exercise_id', exerciseId).in('session_id', ids);
  if (sets.error) throw sets.error;
  return (sets.data ?? []) as WorkoutSet[];
}

export async function getHistory(limit = 10, offset = 0): Promise<{ items: HistoryItem[]; total: number }> {
  const result = await supabase.from('workout_sessions').select('*, workout_plan_days(name, day_index)', { count: 'exact' }).eq('status', 'COMPLETED').order('finished_at', { ascending: false }).range(offset, offset + limit - 1);
  if (result.error) throw result.error;
  const items = await Promise.all((result.data ?? []).map(async (row) => {
    const sets = await supabase.from('workout_sets').select('*').eq('session_id', row.id).order('set_number');
    if (sets.error) throw sets.error;
    return { ...(row as WorkoutSession), day: (row.workout_plan_days as Pick<PlanDay, 'name' | 'day_index'> | null), sets: (sets.data ?? []) as WorkoutSet[] };
  }));
  return { items, total: result.count ?? 0 };
}