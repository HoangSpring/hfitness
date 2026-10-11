import { supabase } from '../../lib/supabase';

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
  video_url: string | null;
  safety_notes: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
};

export const exercisePageSize = 12;

export async function getExercises(filters: { search: string; muscle: string; equipment: string; difficulty: string; page: number }) {
  let query = supabase.from('exercises').select('*', { count: 'exact' }).eq('status', 'PUBLISHED').order('name');
  if (filters.search) query = query.ilike('name', `%${filters.search.replace(/[%_]/g, '')}%`);
  if (filters.muscle) query = query.eq('primary_muscle', filters.muscle);
  if (filters.equipment) query = query.eq('equipment', filters.equipment);
  if (filters.difficulty) query = query.eq('difficulty', filters.difficulty);
  const from = filters.page * exercisePageSize;
  const { data, count, error } = await query.range(from, from + exercisePageSize - 1);
  if (error) throw error;
  return { exercises: (data ?? []) as Exercise[], count: count ?? 0 };
}

export async function getExercise(slug: string) {
  const { data, error } = await supabase.from('exercises').select('*').eq('slug', slug).eq('status', 'PUBLISHED').maybeSingle();
  if (error) throw error;
  return data as Exercise | null;
}
