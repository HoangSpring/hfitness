import { describe, expect, it } from 'vitest';
import { calculateBmr, calculateTargets } from './fitness.service.js';
import { fitnessInputSchema } from '../lib/schemas/fitness.js';

const base = {
  goal: 'maintain' as const,
  experience: 'beginner' as const,
  days_per_week: 3,
};

describe('fitness calculations', () => {
  it('matches the male hand-checked BMR fixture', () => {
    expect(calculateBmr({ age: 25, gender: 'male', height_cm: 180, weight_kg: 80 })).toBe(1805);
  });

  it('matches the female hand-checked BMR fixture', () => {
    expect(calculateBmr({ age: 25, gender: 'female', height_cm: 165, weight_kg: 60 })).toBe(1345.25);
  });

  it('calculates the requested decimal BMR fixture', () => {
    expect(calculateBmr({ age: 20, gender: 'male', height_cm: 170, weight_kg: 70 })).toBe(1667.5);
  });

  it.each(['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain'] as const)('calculates %s targets', (goal) => {
    const targets = calculateTargets({ ...base, goal, age: 25, gender: 'male', height_cm: 180, weight_kg: 80 });
    expect(targets.calorie_target).toBeGreaterThanOrEqual(1500);
    expect(targets.protein_g).toBeGreaterThan(0);
    expect(targets.carbs_g * 4 + targets.protein_g * 4 + targets.fat_g * 9).toBeCloseTo(targets.calorie_target, 0);
  });

  it('enforces the gender calorie floor', () => {
    const targets = calculateTargets({ ...base, age: 90, gender: 'female', height_cm: 120, weight_kg: 30 });
    expect(targets.calorie_target).toBe(1200);
  });

  it('rejects invalid fitness inputs', () => {
    expect(fitnessInputSchema.safeParse({ ...base, age: 13, gender: 'other', height_cm: 100, weight_kg: 10 }).success).toBe(false);
  });
});
