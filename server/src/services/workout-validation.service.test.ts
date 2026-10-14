import { describe, expect, it } from 'vitest';
import { generatedPlanSchema } from '../lib/schemas/workout.js';
import { getWorkoutValidationDiagnostics, repairDurationOnly, validateGeneratedWorkout } from './workout-validation.service.js';
import { hasAiAttemptsRemaining, isAiRateLimited } from './workout.service.js';

const exercise = (id: string, equipment = 'dumbbell', status = 'PUBLISHED') => ({ id, primary_muscle: 'chest', equipment, status });
const validPlan = {
  name: 'Strength plan',
  days: [{
    day_index: 1, name: 'Push', muscle_focus: 'chest',
    exercises: [
      { exercise_id: '00000000-0000-0000-0000-000000000001', position: 1, sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90 },
      { exercise_id: '00000000-0000-0000-0000-000000000002', position: 2, sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90 },
      { exercise_id: '00000000-0000-0000-0000-000000000003', position: 3, sets: 3, reps_min: 8, reps_max: 10, rest_seconds: 90 },
    ],
  }],
};
const input = (plan = validPlan) => ({
  plan, exercises: [
    exercise('00000000-0000-0000-0000-000000000001'),
    exercise('00000000-0000-0000-0000-000000000002'),
    exercise('00000000-0000-0000-0000-000000000003'),
  ], equipment: ['dumbbell'], daysPerWeek: 1, sessionMinutes: 10,
});

describe('validateGeneratedWorkout', () => {
  it('rejects unknown, unpublished, and incompatible exercises', () => {
    const result = validateGeneratedWorkout(input({
      ...validPlan,
      days: [{ ...validPlan.days[0], exercises: [
        { ...validPlan.days[0].exercises[0], exercise_id: '00000000-0000-0000-0000-000000000099' },
        { ...validPlan.days[0].exercises[1], exercise_id: '00000000-0000-0000-0000-000000000001' },
        { ...validPlan.days[0].exercises[2], exercise_id: '00000000-0000-0000-0000-000000000002' },
      ] }],
    }));
    expect(result).toContain('VALIDATION_UNKNOWN_EXERCISE');
  });

  it('rejects unpublished and mismatched equipment exercises', () => {
    const result = validateGeneratedWorkout({
      ...input(),
      exercises: [exercise('00000000-0000-0000-0000-000000000001', 'barbell', 'DRAFT'), exercise('00000000-0000-0000-0000-000000000002'), exercise('00000000-0000-0000-0000-000000000003')],
    });
    expect(result).toEqual(expect.arrayContaining(['VALIDATION_EXERCISE_NOT_PUBLISHED', 'VALIDATION_EQUIPMENT_MISMATCH']));
  });

  it('rejects day count, bad ranges, duplicate exercises, and repeated focus', () => {
    const plan = {
      ...validPlan,
      days: [
        { ...validPlan.days[0], exercises: validPlan.days[0].exercises.map((item) => ({ ...item, sets: 7, reps_min: 31, reps_max: 30, rest_seconds: 301 })) },
        { ...validPlan.days[0], day_index: 2 },
      ],
    };
    const result = validateGeneratedWorkout({ ...input(plan), daysPerWeek: 3 });
    expect(result).toEqual(expect.arrayContaining(['VALIDATION_DAY_COUNT', 'VALIDATION_SETS_RANGE', 'VALIDATION_REPS_RANGE', 'VALIDATION_REST_RANGE', 'VALIDATION_CONSECUTIVE_MUSCLE']));
  });

  it('rejects invalid AI JSON through the structured schema', () => {
    expect(() => generatedPlanSchema.parse(JSON.parse('{bad json'))).toThrow();
  });

  it('allows exactly two AI attempts and enforces the daily limit boundary', () => {
    expect(hasAiAttemptsRemaining(0)).toBe(true);
    expect(hasAiAttemptsRemaining(1)).toBe(true);
    expect(hasAiAttemptsRemaining(2)).toBe(false);
    expect(isAiRateLimited(9, 10)).toBe(false);
    expect(isAiRateLimited(10, 10)).toBe(true);
  });

  it('reports exercise count and duplicate exercise diagnostics with numbers', () => {
    const plan = {
      ...validPlan,
      days: [{ ...validPlan.days[0], exercises: [validPlan.days[0].exercises[0], validPlan.days[0].exercises[0]] }],
    };
    const diagnostics = getWorkoutValidationDiagnostics(input(plan));
    expect(diagnostics.map((item) => item.code)).toEqual(expect.arrayContaining(['VALIDATION_EXERCISE_COUNT', 'VALIDATION_DUPLICATE_EXERCISE']));
    expect(diagnostics.find((item) => item.rule === 'exercise_count')?.details.actual).toBe(2);
  });

  it('repairs duration only and leaves other invalid rules untouched', () => {
    const plan = {
      ...validPlan,
      days: [{ ...validPlan.days[0], exercises: validPlan.days[0].exercises.map((item) => ({ ...item, rest_seconds: 300 })) }],
    };
    const repaired = repairDurationOnly(input(plan));
    expect(repaired.repairedDays).toEqual([1]);
    expect(validateGeneratedWorkout({ ...input(repaired.plan), sessionMinutes: 10 })).not.toContain('VALIDATION_DURATION_RANGE');
  });

  it('accepts a plan shaped like the prompt example after deterministic duration repair', () => {
    const example = {
      name: 'Strength Plan',
      days: [{
        day_index: 1,
        name: 'Full Body',
        muscle_focus: 'chest',
        exercises: [
          { exercise_id: '00000000-0000-0000-0000-000000000001', position: 1, sets: 4, reps_min: 8, reps_max: 10, rest_seconds: 75 },
          { exercise_id: '00000000-0000-0000-0000-000000000002', position: 2, sets: 4, reps_min: 8, reps_max: 10, rest_seconds: 75 },
          { exercise_id: '00000000-0000-0000-0000-000000000003', position: 3, sets: 4, reps_min: 8, reps_max: 10, rest_seconds: 75 },
        ],
      }],
    };
    const repaired = repairDurationOnly({ ...input(example), sessionMinutes: 30 });
    expect(validateGeneratedWorkout({ ...input(repaired.plan), sessionMinutes: 30 })).toEqual([]);
  });
});
