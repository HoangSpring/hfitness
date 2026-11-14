import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import {
  exerciseDifficulties,
  exerciseEquipment,
  exerciseMovementPatterns,
  exerciseMuscles,
} from '../../lib/constants/exercise';
import { normalizeExerciseVideoUrl } from '../../../../shared/youtube';

export const adminExercisePageSize = 10;
export const exerciseStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ExerciseStatus = typeof exerciseStatuses[number];

export type AdminExercise = {
  id: string;
  name: string;
  slug: string;
  description: string;
  instructions: string[];
  primary_muscle: string;
  secondary_muscles: string[];
  equipment: string;
  difficulty: string;
  movement_pattern: string;
  image_url: string | null;
  image_urls: string[];
  video_url: string | null;
  safety_notes: string;
  status: ExerciseStatus;
  created_at: string;
  updated_at: string;
};

const httpsUrl = z.string().refine((value) => !value || /^https:\/\//i.test(value), 'Use an HTTPS URL.');
const videoUrl = z.string().refine((value) => !value || normalizeExerciseVideoUrl(value) !== null, 'Use a YouTube URL or a direct HTTPS .mp4/.webm URL.');
export const exerciseFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter an exercise name.').max(120, 'Use 120 characters or fewer.'),
  slug: z.string().trim().min(1, 'Enter a slug.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.'),
  description: z.string().max(1000, 'Use 1,000 characters or fewer.'),
  instructions: z.array(z.string().trim()).transform((items) => items.filter(Boolean)),
  primary_muscle: z.enum(exerciseMuscles),
  secondary_muscles: z.array(z.enum(exerciseMuscles)),
  equipment: z.enum(exerciseEquipment),
  difficulty: z.enum(exerciseDifficulties),
  movement_pattern: z.enum(exerciseMovementPatterns),
  image_url: httpsUrl,
  image_urls: z.array(httpsUrl),
  video_url: videoUrl,
  safety_notes: z.string().max(1000, 'Use 1,000 characters or fewer.'),
  status: z.enum(exerciseStatuses),
});

export type ExerciseFormValues = z.input<typeof exerciseFormSchema>;

export const publishExerciseSchema = exerciseFormSchema.superRefine((values, context) => {
  if (values.instructions.filter((item) => item.trim()).length === 0) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['instructions'], message: 'Add at least one instruction before publishing.' });
  }
});

export function emptyExerciseForm(): ExerciseFormValues {
  return {
    name: '',
    slug: '',
    description: '',
    instructions: [''],
    primary_muscle: exerciseMuscles[0],
    secondary_muscles: [],
    equipment: exerciseEquipment[0],
    difficulty: exerciseDifficulties[0],
    movement_pattern: exerciseMovementPatterns[0],
    image_url: '',
    image_urls: [],
    video_url: '',
    safety_notes: '',
    status: 'DRAFT',
  };
}

export function exerciseToForm(exercise: AdminExercise): ExerciseFormValues {
  return {
    name: exercise.name,
    slug: exercise.slug,
    description: exercise.description,
    instructions: exercise.instructions.length ? exercise.instructions : [''],
    primary_muscle: exercise.primary_muscle as ExerciseFormValues['primary_muscle'],
    secondary_muscles: exercise.secondary_muscles as ExerciseFormValues['secondary_muscles'],
    equipment: exercise.equipment as ExerciseFormValues['equipment'],
    difficulty: exercise.difficulty as ExerciseFormValues['difficulty'],
    movement_pattern: exercise.movement_pattern as ExerciseFormValues['movement_pattern'],
    image_url: exercise.image_url ?? '',
    image_urls: exercise.image_urls ?? [],
    video_url: exercise.video_url ?? '',
    safety_notes: exercise.safety_notes,
    status: exercise.status,
  };
}

function escapeFilter(value: string) {
  return value.replace(/([\\%_,])/g, '\\$1');
}

export async function getAdminExercises(filters: {
  search: string;
  muscle: string;
  equipment: string;
  difficulty: string;
  status: string;
  page: number;
}) {
  let query = supabase.from('exercises').select('*', { count: 'exact' }).order('updated_at', { ascending: false });
  if (filters.search.trim()) {
    const search = escapeFilter(filters.search.trim());
    query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`);
  }
  if (filters.muscle) query = query.eq('primary_muscle', filters.muscle);
  if (filters.equipment) query = query.eq('equipment', filters.equipment);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  if (filters.status) query = query.eq('status', filters.status);
  const from = filters.page * adminExercisePageSize;
  const result = await query.range(from, from + adminExercisePageSize - 1);
  if (result.error) throw result.error;
  return { exercises: (result.data ?? []) as AdminExercise[], count: result.count ?? 0 };
}

export async function getAdminExercise(id: string) {
  const result = await supabase.from('exercises').select('*').eq('id', id).single();
  if (result.error || !result.data) throw result.error ?? new Error('EXERCISE_NOT_FOUND');
  return result.data as AdminExercise;
}

export async function getExerciseStatusCounts() {
  const counts = await Promise.all(exerciseStatuses.map(async (status) => {
    const result = await supabase.from('exercises').select('id', { count: 'exact', head: true }).eq('status', status);
    if (result.error) throw result.error;
    return [status, result.count ?? 0] as const;
  }));
  return Object.fromEntries(counts) as Record<ExerciseStatus, number>;
}

export async function isExerciseSlugAvailable(slug: string, id?: string) {
  let query = supabase.from('exercises').select('id').eq('slug', slug).limit(1);
  if (id) query = query.neq('id', id);
  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  return !result.data;
}

export async function saveAdminExercise(values: ExerciseFormValues, id?: string) {
  const parsed = exerciseFormSchema.parse(values);
  const payload = {
    ...parsed,
    description: parsed.description.trim(),
    instructions: parsed.instructions,
    image_url: parsed.image_url || null,
    image_urls: parsed.image_urls,
    video_url: parsed.video_url ? normalizeExerciseVideoUrl(parsed.video_url) : null,
    safety_notes: parsed.safety_notes.trim(),
  };
  const result = id
    ? await supabase.from('exercises').update(payload).eq('id', id).select('*').single()
    : await supabase.from('exercises').insert(payload).select('*').single();
  if (result.error || !result.data) throw result.error ?? new Error('EXERCISE_SAVE_FAILED');
  return result.data as AdminExercise;
}

export async function setExerciseStatus(id: string, status: ExerciseStatus) {
  const result = await supabase.from('exercises').update({ status }).eq('id', id).select('*').single();
  if (result.error || !result.data) throw result.error ?? new Error('EXERCISE_STATUS_FAILED');
  return result.data as AdminExercise;
}

export async function publishAdminExercise(id: string) {
  const exercise = await getAdminExercise(id);
  const parsed = publishExerciseSchema.safeParse(exerciseToForm(exercise));
  if (!parsed.success) throw new Error('EXERCISE_PUBLISH_INVALID');
  return setExerciseStatus(id, 'PUBLISHED');
}
