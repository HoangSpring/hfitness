import { z } from 'zod';

export const generatedExerciseSchema = z.object({
  exercise_id: z.string().uuid(),
  position: z.number().int(),
  sets: z.number().int(),
  reps_min: z.number().int(),
  reps_max: z.number().int(),
  rest_seconds: z.number().int(),
  notes: z.string().max(500).optional(),
});

export const generatedDaySchema = z.object({
  day_index: z.number().int(),
  name: z.string().min(1).max(100),
  muscle_focus: z.string().min(1).max(50),
  exercises: z.array(generatedExerciseSchema),
});

export const generatedPlanSchema = z.object({
  name: z.string().min(1).max(120),
  days: z.array(generatedDaySchema),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;
export type EligibleExercise = { id: string; name: string; primary_muscle: string; equipment: string; status: string };
