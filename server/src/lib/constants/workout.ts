export const WORKOUT_PROMPT_VERSION = 'WORKOUT_GENERATOR_V1';
export const MAX_AI_ATTEMPTS = 2;
export const WORKOUT_DURATION_TOLERANCE = 0.25;
export const WORKING_SECONDS_PER_SET = 40;
export const DEFAULT_AI_TIMEOUT_MS = 75_000;

export function estimateWorkoutDayMinutes(day: { exercises: Array<{ sets: number; rest_seconds: number }> }): number {
  const seconds = day.exercises.reduce(
    (exerciseTotal, exercise) => exerciseTotal + exercise.sets * (WORKING_SECONDS_PER_SET + exercise.rest_seconds),
    0,
  );
  return seconds / 60;
}

export function estimateWorkoutMinutes(days: Array<{ exercises: Array<{ sets: number; rest_seconds: number }> }>): number {
  return days.reduce((total, day) => total + estimateWorkoutDayMinutes(day), 0);
}
