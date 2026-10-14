import { apiRequest } from '../../lib/api';

export type PlanExercise = {
  id: string;
  exercise_id: string;
  position: number;
  sets: number;
  reps_min: number;
  reps_max: number;
  rest_seconds: number;
  notes: string | null;
  exercises?: { name: string; slug: string; primary_muscle: string } | null;
};

export type PlanDay = {
  id: string;
  day_index: number;
  name: string;
  muscle_focus: string;
  workout_plan_exercises: PlanExercise[];
};

export type WorkoutPlan = {
  id: string;
  name: string;
  goal: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  workout_plan_days: PlanDay[];
};

export function estimateDayMinutes(day: Pick<PlanDay, 'workout_plan_exercises'>): number {
  return Math.round(day.workout_plan_exercises.reduce((total, item) => total + item.sets * (40 + item.rest_seconds), 0) / 60);
}

export function getCurrentPlan() {
  return apiRequest<WorkoutPlan | null>('/workout-plans/current');
}

export function generatePlan() {
  return apiRequest<WorkoutPlan>('/ai/workout/generate', { method: 'POST' });
}

export function activatePlan(id: string) {
  return apiRequest<WorkoutPlan>(`/workout-plans/${id}/activate`, { method: 'POST' });
}

export function getPlanDay(id: string) {
  return apiRequest<PlanDay>(`/workout-plans/days/${id}`);
}
