import { supabase } from '../../lib/supabase';
import { dateKey } from '../../lib/nutrition';
import type { DailyNutrition, ProgressSession, ProgressSet, WeightEntry } from '../../lib/progress-metrics';

export type WeightLog = WeightEntry & { id: string; created_at: string };
export type ProgressProfile = { display_name: string | null; goal: string; days_per_week: number };
export type AssessmentTargets = { calories: number; protein: number; carbs: number; fat: number };

type SessionRow = ProgressSession & { workout_plan_days: Array<{ day_index: number; name: string }> | null };
type MealRow = { id: string; eaten_at: string; meal_items: Array<{ calories: number; protein: number; carbs: number; fat: number }> };

export type ProgressData = {
  weights: WeightLog[];
  sessions: ProgressSession[];
  sets: ProgressSet[];
  nutrition: DailyNutrition[];
  targets: AssessmentTargets | null;
  profile: ProgressProfile;
};

const assessmentSelect = 'calorie_target, protein_g, carbs_g, fat_g';

function toNutritionDays(meals: MealRow[]): DailyNutrition[] {
  const grouped = new Map<string, DailyNutrition>();
  meals.forEach((meal) => {
    const key = dateKey(new Date(meal.eaten_at));
    const current = grouped.get(key) ?? { date: key, calories: 0, protein: 0, carbs: 0, fat: 0 };
    meal.meal_items.forEach((item) => {
      current.calories += Number(item.calories);
      current.protein += Number(item.protein);
      current.carbs = (current.carbs ?? 0) + Number(item.carbs);
      current.fat = (current.fat ?? 0) + Number(item.fat);
    });
    grouped.set(key, current);
  });
  return [...grouped.values()];
}

async function getSessionsAndSets(limitDays = 90): Promise<{ sessions: ProgressSession[]; sets: ProgressSet[] }> {
  const since = new Date();
  since.setDate(since.getDate() - limitDays);
  const sessionsResult = await supabase.from('workout_sessions').select('id,status,started_at,finished_at,workout_plan_days(day_index,name)').gte('started_at', since.toISOString()).order('started_at', { ascending: false });
  if (sessionsResult.error) throw sessionsResult.error;
  const rows = (sessionsResult.data ?? []) as SessionRow[];
  const ids = rows.map((row) => row.id);
  if (!ids.length) return { sessions: rows.map((row) => ({ ...row, day_index: row.workout_plan_days?.[0]?.day_index ?? null })), sets: [] };
  const setsResult = await supabase.from('workout_sets').select('session_id,weight_kg,reps,created_at').in('session_id', ids);
  if (setsResult.error) throw setsResult.error;
  return {
    sessions: rows.map((row) => ({ id: row.id, status: row.status, started_at: row.started_at, finished_at: row.finished_at, day_index: row.workout_plan_days?.[0]?.day_index ?? null })),
    sets: (setsResult.data ?? []) as ProgressSet[],
  };
}

export async function getProgressData(): Promise<ProgressData> {
  const since = new Date();
  since.setDate(since.getDate() - 90);
  const nutritionSince = new Date();
  nutritionSince.setDate(nutritionSince.getDate() - 6);
  const [weightsResult, sessionsAndSets, mealsResult, assessmentResult, profileResult] = await Promise.all([
    supabase.from('weight_logs').select('id,weight_kg,logged_on,created_at').order('logged_on', { ascending: false }).limit(90),
    getSessionsAndSets(),
    supabase.from('meals').select('id,eaten_at,meal_items(calories,protein,carbs,fat)').gte('eaten_at', nutritionSince.toISOString()).order('eaten_at', { ascending: false }),
    supabase.from('fitness_assessments').select(assessmentSelect).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('profiles').select('display_name,goal,days_per_week').single(),
  ]);
  if (weightsResult.error) throw weightsResult.error;
  if (mealsResult.error) throw mealsResult.error;
  if (assessmentResult.error) throw assessmentResult.error;
  if (profileResult.error) throw profileResult.error;
  return {
    weights: (weightsResult.data ?? []).map((row) => ({ ...row, weight_kg: Number(row.weight_kg) })) as WeightLog[],
    sessions: sessionsAndSets.sessions,
    sets: sessionsAndSets.sets.map((set) => ({ ...set, weight_kg: Number(set.weight_kg), reps: Number(set.reps) })),
    nutrition: toNutritionDays((mealsResult.data ?? []) as MealRow[]),
    targets: assessmentResult.data ? { calories: Number(assessmentResult.data.calorie_target), protein: Number(assessmentResult.data.protein_g), carbs: Number(assessmentResult.data.carbs_g), fat: Number(assessmentResult.data.fat_g) } : null,
    profile: profileResult.data as ProgressProfile,
  };
}

export async function saveWeight(loggedOn: string, weightKg: number): Promise<void> {
  const result = await supabase.from('weight_logs').upsert({ logged_on: loggedOn, weight_kg: weightKg }, { onConflict: 'user_id,logged_on' });
  if (result.error) throw result.error;
}

export async function deleteWeight(id: string): Promise<void> {
  const result = await supabase.from('weight_logs').delete().eq('id', id);
  if (result.error) throw result.error;
}

export async function getDashboardProfile(): Promise<ProgressProfile> {
  const result = await supabase.from('profiles').select('display_name,goal,days_per_week').single();
  if (result.error || !result.data) throw result.error ?? new Error('Profile unavailable');
  return result.data as ProgressProfile;
}

export async function getDashboardNutrition(): Promise<{ nutrition: DailyNutrition[]; targets: AssessmentTargets | null }> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const [mealsResult, assessmentResult] = await Promise.all([
    supabase.from('meals').select('id,eaten_at,meal_items(calories,protein,carbs,fat)').gte('eaten_at', since.toISOString()).order('eaten_at'),
    supabase.from('fitness_assessments').select(assessmentSelect).order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (mealsResult.error) throw mealsResult.error;
  if (assessmentResult.error) throw assessmentResult.error;
  return {
    nutrition: toNutritionDays((mealsResult.data ?? []) as MealRow[]),
    targets: assessmentResult.data ? { calories: Number(assessmentResult.data.calorie_target), protein: Number(assessmentResult.data.protein_g), carbs: Number(assessmentResult.data.carbs_g), fat: Number(assessmentResult.data.fat_g) } : null,
  };
}

export async function getDashboardActivity(): Promise<{ sessions: ProgressSession[]; sets: ProgressSet[] }> {
  return getSessionsAndSets(90);
}

export async function getDashboardWeight(): Promise<WeightLog[]> {
  const result = await supabase.from('weight_logs').select('id,weight_kg,logged_on,created_at').order('logged_on', { ascending: false }).limit(30);
  if (result.error) throw result.error;
  return (result.data ?? []).map((row) => ({ ...row, weight_kg: Number(row.weight_kg) })) as WeightLog[];
}
