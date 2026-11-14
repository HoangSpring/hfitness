import { dateKey } from './nutrition';

export type ProgressSession = {
  id: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  started_at: string;
  finished_at: string | null;
  day_index?: number | null;
};

export type ProgressSet = {
  session_id: string;
  weight_kg: number;
  reps: number;
  created_at?: string;
};

export type DailyNutrition = {
  date: string;
  calories: number;
  protein: number;
  carbs?: number;
  fat?: number;
};

export type WeightEntry = { logged_on: string; weight_kg: number };

export function getMonday(date: Date): Date {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));
  return monday;
}

export function getWeekDateKeys(date: Date): string[] {
  const monday = getMonday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setDate(monday.getDate() + index);
    return dateKey(day);
  });
}

export function weeklySessionCounts(sessions: ProgressSession[], date = new Date()): number[] {
  const keys = getWeekDateKeys(date);
  return keys.map((key) => sessions.filter((session) => session.status === 'COMPLETED' && dateKey(new Date(session.finished_at ?? session.started_at)) === key).length);
}

export function completionRate(sessions: ProgressSession[], daysPerWeek: number, date = new Date()): number {
  if (daysPerWeek <= 0) return 0;
  const completed = weeklySessionCounts(sessions, date).reduce((sum, count) => sum + count, 0);
  return Math.min(100, Math.round((completed / daysPerWeek) * 100));
}

export function weeklyVolumeOrReps(sessions: ProgressSession[], sets: ProgressSet[], date = new Date()): { value: number; unit: 'kg' | 'reps' } {
  const weekKeys = new Set(getWeekDateKeys(date));
  const sessionIds = new Set(sessions.filter((session) => session.status === 'COMPLETED' && weekKeys.has(dateKey(new Date(session.finished_at ?? session.started_at)))).map((session) => session.id));
  const weekSets = sets.filter((set) => sessionIds.has(set.session_id));
  const allBodyweight = weekSets.length === 0 || weekSets.every((set) => Number(set.weight_kg) === 0);
  return allBodyweight
    ? { value: weekSets.reduce((sum, set) => sum + Number(set.reps), 0), unit: 'reps' }
    : { value: weekSets.reduce((sum, set) => sum + Number(set.weight_kg) * Number(set.reps), 0), unit: 'kg' };
}

export function sevenDayNutritionAverage(entries: DailyNutrition[], date = new Date()): { calories: number; protein: number; carbs: number; fat: number; daysLogged: number } {
  const keys = new Set(Array.from({ length: 7 }, (_, index) => {
    const day = new Date(date.getFullYear(), date.getMonth(), date.getDate() - index);
    return dateKey(day);
  }));
  const logged = entries.filter((entry) => keys.has(entry.date));
  if (!logged.length) return { calories: 0, protein: 0, carbs: 0, fat: 0, daysLogged: 0 };
  const total = logged.reduce((sum, entry) => ({
    calories: sum.calories + entry.calories,
    protein: sum.protein + entry.protein,
    carbs: sum.carbs + (entry.carbs ?? 0),
    fat: sum.fat + (entry.fat ?? 0),
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  return { calories: total.calories / logged.length, protein: total.protein / logged.length, carbs: total.carbs / logged.length, fat: total.fat / logged.length, daysLogged: logged.length };
}

export function sevenDayWeightChange(entries: WeightEntry[]): number | null {
  if (!entries.length) return null;
  const sorted = [...entries].sort((a, b) => a.logged_on.localeCompare(b.logged_on));
  const latest = sorted[sorted.length - 1];
  const latestTime = new Date(`${latest.logged_on}T00:00:00`).getTime();
  const older = sorted.filter((entry) => latestTime - new Date(`${entry.logged_on}T00:00:00`).getTime() >= 7 * 86400000).at(-1);
  return older ? latest.weight_kg - older.weight_kg : null;
}

export type TodayWorkout = { kind: 'resume'; session: ProgressSession } | { kind: 'start' | 'view'; dayIndex: number } | { kind: 'no-plan' };

export function selectTodaysWorkout(planDays: { day_index: number }[] | null, sessions: ProgressSession[], now = new Date()): TodayWorkout {
  if (!planDays?.length) return { kind: 'no-plan' };
  const inProgress = sessions.find((session) => session.status === 'IN_PROGRESS');
  if (inProgress) return { kind: 'resume', session: inProgress };
  const completed = sessions.filter((session) => session.status === 'COMPLETED' && session.day_index != null).sort((a, b) => new Date(b.finished_at ?? b.started_at).getTime() - new Date(a.finished_at ?? a.started_at).getTime());
  if (!completed.length) return { kind: 'start', dayIndex: 1 };
  const currentPosition = planDays.findIndex((day) => day.day_index === completed[0].day_index);
  const nextPosition = currentPosition < 0 ? 0 : (currentPosition + 1) % planDays.length;
  const latestCompletion = completed[0].finished_at ?? completed[0].started_at;
  const today = dateKey(now);
  return { kind: dateKey(new Date(latestCompletion)) === today ? 'view' : 'start', dayIndex: planDays[nextPosition].day_index };
}
