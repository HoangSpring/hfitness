import { z } from 'zod';
import { estimateWorkoutDayMinutes, WORKOUT_DURATION_TOLERANCE } from '../lib/constants/workout.js';
import type { GeneratedPlan } from '../lib/schemas/workout.js';

export type ValidationExercise = {
  id: string;
  primary_muscle: string;
  equipment: string;
  status: string;
};

export type WorkoutValidationInput = {
  plan: GeneratedPlan;
  exercises: ValidationExercise[];
  equipment: string[];
  daysPerWeek: number;
  sessionMinutes: number;
};

export type ValidationDiagnostic = {
  rule: string;
  code: string;
  details: Record<string, number | string>;
};

function diagnosticsFor(input: WorkoutValidationInput, includeDuration: boolean): ValidationDiagnostic[] {
  const diagnostics: ValidationDiagnostic[] = [];
  if (input.plan.days.length !== input.daysPerWeek) {
    diagnostics.push({
      rule: 'day_count',
      code: 'VALIDATION_DAY_COUNT',
      details: { actual: input.plan.days.length, expected: input.daysPerWeek },
    });
  }
  const byId = new Map(input.exercises.map((exercise) => [exercise.id, exercise]));
  const allowedEquipment = new Set(input.equipment);
  let previousFocus: string | undefined;

  for (const day of input.plan.days) {
    if (day.exercises.length < 3 || day.exercises.length > 8) {
      diagnostics.push({
        rule: 'exercise_count',
        code: 'VALIDATION_EXERCISE_COUNT',
        details: { day: day.day_index, actual: day.exercises.length, minimum: 3, maximum: 8 },
      });
    }
    if (previousFocus && previousFocus === day.muscle_focus) {
      diagnostics.push({
        rule: 'consecutive_muscle_focus',
        code: 'VALIDATION_CONSECUTIVE_MUSCLE',
        details: { day: day.day_index, muscle_focus: day.muscle_focus },
      });
    }
    previousFocus = day.muscle_focus;
    const seen = new Set<string>();
    for (const exercise of day.exercises) {
      if (seen.has(exercise.exercise_id)) {
        diagnostics.push({
          rule: 'duplicate_exercise',
          code: 'VALIDATION_DUPLICATE_EXERCISE',
          details: { day: day.day_index, exercise_id: exercise.exercise_id },
        });
      }
      seen.add(exercise.exercise_id);
      const catalog = byId.get(exercise.exercise_id);
      if (!catalog) {
        diagnostics.push({
          rule: 'published_exercise',
          code: 'VALIDATION_UNKNOWN_EXERCISE',
          details: { day: day.day_index, exercise_id: exercise.exercise_id },
        });
        continue;
      }
      if (catalog.status !== 'PUBLISHED') {
        diagnostics.push({
          rule: 'published_exercise',
          code: 'VALIDATION_EXERCISE_NOT_PUBLISHED',
          details: { day: day.day_index, exercise_id: exercise.exercise_id, status: catalog.status },
        });
      }
      if (!allowedEquipment.has(catalog.equipment) && catalog.equipment !== 'bodyweight') {
        diagnostics.push({
          rule: 'equipment_compatibility',
          code: 'VALIDATION_EQUIPMENT_MISMATCH',
          details: { day: day.day_index, exercise_id: exercise.exercise_id, equipment: catalog.equipment },
        });
      }
      if (exercise.sets < 1 || exercise.sets > 6) {
        diagnostics.push({
          rule: 'sets_range',
          code: 'VALIDATION_SETS_RANGE',
          details: { day: day.day_index, exercise_id: exercise.exercise_id, actual: exercise.sets, minimum: 1, maximum: 6 },
        });
      }
      if (exercise.reps_min < 1 || exercise.reps_max > 30 || exercise.reps_min > exercise.reps_max) {
        diagnostics.push({
          rule: 'reps_range',
          code: 'VALIDATION_REPS_RANGE',
          details: { day: day.day_index, exercise_id: exercise.exercise_id, reps_min: exercise.reps_min, reps_max: exercise.reps_max, minimum: 1, maximum: 30 },
        });
      }
      if (exercise.rest_seconds < 20 || exercise.rest_seconds > 300) {
        diagnostics.push({
          rule: 'rest_range',
          code: 'VALIDATION_REST_RANGE',
          details: { day: day.day_index, exercise_id: exercise.exercise_id, actual: exercise.rest_seconds, minimum: 20, maximum: 300 },
        });
      }
    }
    if (includeDuration) {
      const estimatedMinutes = estimateWorkoutDayMinutes(day);
      const minimumMinutes = input.sessionMinutes * (1 - WORKOUT_DURATION_TOLERANCE);
      const maximumMinutes = input.sessionMinutes * (1 + WORKOUT_DURATION_TOLERANCE);
      if (estimatedMinutes < minimumMinutes || estimatedMinutes > maximumMinutes) {
        diagnostics.push({
          rule: 'duration_range',
          code: 'VALIDATION_DURATION_RANGE',
          details: {
            day: day.day_index,
            estimated_minutes: Number(estimatedMinutes.toFixed(1)),
            requested_minutes: input.sessionMinutes,
            minimum_minutes: Number(minimumMinutes.toFixed(1)),
            maximum_minutes: Number(maximumMinutes.toFixed(1)),
          },
        });
      }
    }
  }
  return diagnostics;
}

export function getWorkoutValidationDiagnostics(input: WorkoutValidationInput): ValidationDiagnostic[] {
  return diagnosticsFor(input, true);
}

export function validateGeneratedWorkout(input: WorkoutValidationInput): string[] {
  return getWorkoutValidationDiagnostics(input).map((diagnostic) => diagnostic.code);
}

function repairDayDuration(day: GeneratedPlan['days'][number], sessionMinutes: number): boolean {
  const minimumMinutes = sessionMinutes * (1 - WORKOUT_DURATION_TOLERANCE);
  const maximumMinutes = sessionMinutes * (1 + WORKOUT_DURATION_TOLERANCE);
  let estimatedMinutes = estimateWorkoutDayMinutes(day);
  if (estimatedMinutes >= minimumMinutes && estimatedMinutes <= maximumMinutes) return false;

  if (estimatedMinutes < minimumMinutes) {
    for (const exercise of day.exercises) {
      while (exercise.rest_seconds < 300 && estimatedMinutes < minimumMinutes) {
        exercise.rest_seconds += 5;
        estimatedMinutes = estimateWorkoutDayMinutes(day);
      }
    }
    for (const exercise of day.exercises) {
      while (exercise.sets < 6 && estimatedMinutes < minimumMinutes) {
        exercise.sets += 1;
        estimatedMinutes = estimateWorkoutDayMinutes(day);
      }
    }
  } else {
    for (const exercise of day.exercises) {
      while (exercise.rest_seconds > 20 && estimatedMinutes > maximumMinutes) {
        exercise.rest_seconds -= 5;
        estimatedMinutes = estimateWorkoutDayMinutes(day);
      }
    }
    for (const exercise of day.exercises) {
      while (exercise.sets > 1 && estimatedMinutes > maximumMinutes) {
        exercise.sets -= 1;
        estimatedMinutes = estimateWorkoutDayMinutes(day);
      }
    }
  }
  return true;
}

export function repairDurationOnly(input: WorkoutValidationInput): { plan: GeneratedPlan; repairedDays: number[] } {
  const plan: GeneratedPlan = structuredClone(input.plan);
  const nonDurationDiagnostics = diagnosticsFor({ ...input, plan }, false);
  if (nonDurationDiagnostics.length > 0) return { plan, repairedDays: [] };
  const repairedDays = plan.days.filter((day) => repairDayDuration(day, input.sessionMinutes)).map((day) => day.day_index);
  return { plan, repairedDays };
}

export const generatedPlanJsonSchema = z.string().transform((value, ctx) => {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid JSON' });
    return z.NEVER;
  }
});
