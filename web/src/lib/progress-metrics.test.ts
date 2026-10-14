import { describe, expect, it } from 'vitest';
import { completionRate, getWeekDateKeys, selectTodaysWorkout, sevenDayNutritionAverage, sevenDayWeightChange, weeklySessionCounts, weeklyVolumeOrReps } from './progress-metrics';

const week = new Date(2026, 0, 7);
const session = (id: string, date: string, status: 'COMPLETED' | 'IN_PROGRESS' = 'COMPLETED', day_index = 1) => ({ id, status, started_at: `${date}T08:00:00Z`, finished_at: status === 'COMPLETED' ? `${date}T09:00:00Z` : null, day_index });

describe('progress metrics', () => {
  it('starts weeks on Monday and crosses month boundaries', () => expect(getWeekDateKeys(new Date(2026, 1, 1))).toEqual(['2026-01-26', '2026-01-27', '2026-01-28', '2026-01-29', '2026-01-30', '2026-01-31', '2026-02-01']));
  it('counts completed sessions and caps completion at 100%', () => {
    const sessions = [session('a', '2026-01-05'), session('b', '2026-01-07'), session('c', '2026-01-08'), session('d', '2026-01-08'), session('e', '2026-01-09')];
    expect(weeklySessionCounts(sessions, week)).toEqual([1, 0, 1, 2, 1, 0, 0]);
    expect(completionRate(sessions, 4, week)).toBe(100);
    expect(completionRate([], 4, week)).toBe(0);
  });
  it('uses volume for weighted work and reps for bodyweight work', () => {
    const sessions = [session('a', '2026-01-07')];
    expect(weeklyVolumeOrReps(sessions, [{ session_id: 'a', weight_kg: 20, reps: 5 }], week)).toEqual({ value: 100, unit: 'kg' });
    expect(weeklyVolumeOrReps(sessions, [{ session_id: 'a', weight_kg: 0, reps: 12 }], week)).toEqual({ value: 12, unit: 'reps' });
    expect(weeklyVolumeOrReps([], [], week)).toEqual({ value: 0, unit: 'reps' });
  });
  it('averages only logged nutrition days and reports the count', () => {
    expect(sevenDayNutritionAverage([], week)).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0, daysLogged: 0 });
    expect(sevenDayNutritionAverage([{ date: '2026-01-07', calories: 1800, protein: 100 }, { date: '2026-01-06', calories: 2200, protein: 140 }], week)).toMatchObject({ calories: 2000, protein: 120, daysLogged: 2 });
  });
  it('requires an entry at least seven days older for weight change', () => {
    expect(sevenDayWeightChange([{ logged_on: '2026-01-07', weight_kg: 80 }])).toBeNull();
    expect(sevenDayWeightChange([{ logged_on: '2025-12-31', weight_kg: 82 }, { logged_on: '2026-01-07', weight_kg: 80 }])).toBe(-2);
  });
  it('selects resume, next completed day, day one, and no plan', () => {
    expect(selectTodaysWorkout(null, [])).toEqual({ kind: 'no-plan' });
    expect(selectTodaysWorkout([{ day_index: 1 }, { day_index: 2 }], [session('i', '2026-01-07', 'IN_PROGRESS')])).toMatchObject({ kind: 'resume' });
    expect(selectTodaysWorkout([{ day_index: 1 }, { day_index: 2 }], [])).toEqual({ kind: 'start', dayIndex: 1 });
    expect(selectTodaysWorkout([{ day_index: 1 }, { day_index: 2 }], [session('a', '2026-01-07', 'COMPLETED', 2)])).toEqual({ kind: 'start', dayIndex: 1 });
  });
});
