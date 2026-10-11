import { z } from 'zod';

export const fitnessInputSchema = z.object({
  age: z.number().int().min(14).max(90),
  gender: z.enum(['male', 'female']),
  height_cm: z.number().min(120).max(230),
  weight_kg: z.number().min(30).max(250),
  goal: z.enum(['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain']),
  experience: z.enum(['beginner', 'intermediate', 'advanced']),
  days_per_week: z.number().int().min(1).max(7),
});

export type FitnessInput = z.infer<typeof fitnessInputSchema>;

