import { z } from 'zod';
import { supabase } from '../../lib/supabase';

export const goals = ['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain'] as const;
export const experiences = ['beginner', 'intermediate', 'advanced'] as const;
export const genders = ['male', 'female'] as const;
export const equipmentOptions = ['bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'kettlebell', 'band'] as const;

export const onboardingSchema = z.object({
  display_name: z.string().max(80).default(''),
  goal: z.enum(goals),
  age: z.coerce.number().int().min(14).max(90),
  gender: z.enum(genders),
  height_cm: z.coerce.number().min(120).max(230),
  weight_kg: z.coerce.number().min(30).max(250),
  experience: z.enum(experiences),
  days_per_week: z.coerce.number().int().min(1).max(7),
  session_minutes: z.coerce.number().int().min(15).max(180),
  equipment: z.array(z.string()).min(1),
  allergies: z.string().max(500).default(''),
  disliked_foods: z.string().max(500).default(''),
  meals_per_day: z.coerce.number().int().min(1).max(8),
});

export type OnboardingValues = z.infer<typeof onboardingSchema>;
export type Profile = Omit<OnboardingValues, 'allergies' | 'disliked_foods'> & {
  id: string;
  role: 'USER' | 'ADMIN';
  allergies: string[] | null;
  disliked_foods: string[] | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
};

const asList = (value: string) => value.split(',').map((item) => item.trim()).filter(Boolean);
const asText = (value: string[] | null | undefined) => value?.join(', ') ?? '';

export function profileToForm(profile: Profile): OnboardingValues {
  return {
    display_name: profile.display_name ?? '',
    goal: profile.goal,
    age: profile.age,
    gender: profile.gender,
    height_cm: profile.height_cm,
    weight_kg: profile.weight_kg,
    experience: profile.experience,
    days_per_week: profile.days_per_week,
    session_minutes: profile.session_minutes,
    equipment: profile.equipment ?? [],
    allergies: asText(profile.allergies),
    disliked_foods: asText(profile.disliked_foods),
    meals_per_day: profile.meals_per_day,
  };
}

export function formToProfile(values: OnboardingValues, completed: boolean) {
  return {
    display_name: values.display_name || null,
    goal: values.goal,
    age: values.age,
    gender: values.gender,
    height_cm: values.height_cm,
    weight_kg: values.weight_kg,
    experience: values.experience,
    days_per_week: values.days_per_week,
    session_minutes: values.session_minutes,
    equipment: values.equipment,
    allergies: asList(values.allergies),
    disliked_foods: asList(values.disliked_foods),
    meals_per_day: values.meals_per_day,
    onboarding_completed: completed,
  };
}

export async function getProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error || !data) throw new Error('PROFILE_LOAD_FAILED');
  return data as Profile;
}

export async function saveProfile(userId: string, values: OnboardingValues, completed: boolean): Promise<void> {
  const { error } = await supabase.from('profiles').update(formToProfile(values, completed)).eq('id', userId);
  if (error) throw error;
}

