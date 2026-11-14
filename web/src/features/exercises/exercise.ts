import { supabase } from '../../lib/supabase';
import { localizeExercise, type ExerciseTranslation } from '../../lib/content-localization';
import type { Locale } from '../../i18n/en';

export type Exercise = {
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
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  exercise_translations?: ExerciseTranslation[] | ExerciseTranslation | null;
};

export const exercisePageSize = 12;

export async function getExercises(filters: { search: string; muscle: string; equipment: string; difficulty: string; page: number }, locale: Locale = 'en') {
  let query = supabase.from('exercises').select('*, exercise_translations(name,description,instructions,safety_notes,locale)', { count: 'exact' }).eq('status', 'PUBLISHED').order('name');
  if (filters.search) {
    const escaped = filters.search.replace(/[%_\\]/g, '\\$&').replace(/[,()]/g, '');
    const englishMatches = await supabase.from('exercises').select('id').eq('status', 'PUBLISHED').ilike('name', `%${escaped}%`);
    if (englishMatches.error) throw englishMatches.error;
    const vietnameseMatches = locale === 'vi'
      ? await supabase.from('exercise_translations').select('exercise_id').eq('locale', 'vi').ilike('name', `%${escaped}%`)
      : { data: [], error: null };
    if (vietnameseMatches.error) throw vietnameseMatches.error;
    const matchingIds = [...new Set([
      ...(englishMatches.data ?? []).map((exercise) => exercise.id),
      ...(vietnameseMatches.data ?? []).map((translation) => translation.exercise_id),
    ])];
    if (matchingIds.length === 0) return { exercises: [], count: 0 };
    query = query.in('id', matchingIds);
  }
  if (filters.muscle) query = query.eq('primary_muscle', filters.muscle);
  if (filters.equipment) query = query.eq('equipment', filters.equipment);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  const from = filters.page * exercisePageSize;
  const { data, count, error } = await query.range(from, from + exercisePageSize - 1);
  if (error) throw error;
  return { exercises: (data ?? []).map((exercise) => localizeExercise(exercise as Exercise, Array.isArray(exercise.exercise_translations) ? exercise.exercise_translations[0] : exercise.exercise_translations, locale)), count: count ?? 0 };
}

export async function getExercise(slug: string, locale: Locale = 'en') {
  const { data, error } = await supabase.from('exercises').select('*, exercise_translations(name,description,instructions,safety_notes,locale)').eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return localizeExercise(data as Exercise, Array.isArray(data.exercise_translations) ? data.exercise_translations[0] : data.exercise_translations, locale);
}
