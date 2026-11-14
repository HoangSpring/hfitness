import { z } from 'zod';
import { supabase } from '../../lib/supabase';

export const foodCategories = ['Staples', 'Proteins', 'Vegetables', 'Fruits', 'Dairy', 'Snacks', 'Vietnamese', 'Drinks', 'Legumes', 'Prepared'] as const;
export const foodUnits = ['g', 'ml', 'piece'] as const;
export const foodStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export const adminFoodPageSize = 10;
export type FoodStatus = typeof foodStatuses[number];

export type AdminFood = {
  id: string; name: string; slug: string; category: string; serving_size: number; unit: string;
  calories: number; protein: number; carbs: number; fat: number; status: FoodStatus;
  created_at: string; updated_at: string;
};

const numberValue = (label: string, max: number) => z.coerce.number({ invalid_type_error: `${label} must be a number.` }).min(0, `${label} cannot be negative.`).max(max, `${label} is too high.`);
export const foodFormSchema = z.object({
  name: z.string().trim().min(1, 'Enter a food name.').max(120, 'Use 120 characters or fewer.'),
  slug: z.string().trim().min(1, 'Enter a slug.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens.'),
  category: z.enum(foodCategories),
  serving_size: numberValue('Serving size', 100000).refine((value) => value > 0, 'Serving size must be greater than zero.'),
  unit: z.enum(foodUnits),
  calories: numberValue('Calories', 10000),
  protein: numberValue('Protein', 1000),
  carbs: numberValue('Carbs', 1000),
  fat: numberValue('Fat', 1000),
  status: z.enum(foodStatuses),
});
export type FoodFormValues = z.input<typeof foodFormSchema>;
export const publishFoodSchema = foodFormSchema.superRefine((values, context) => {
  if (values.serving_size <= 0) context.addIssue({ code: z.ZodIssueCode.custom, path: ['serving_size'], message: 'Required for publishing.' });
});

export function emptyFoodForm(): FoodFormValues {
  return { name: '', slug: '', category: foodCategories[0], serving_size: 100, unit: 'g', calories: 0, protein: 0, carbs: 0, fat: 0, status: 'DRAFT' };
}
export function foodToForm(food: AdminFood): FoodFormValues {
  return { name: food.name, slug: food.slug, category: food.category as FoodFormValues['category'], serving_size: food.serving_size, unit: food.unit as FoodFormValues['unit'], calories: food.calories, protein: food.protein, carbs: food.carbs, fat: food.fat, status: food.status };
}
export function nutritionWarning(values: Pick<FoodFormValues, 'calories' | 'protein' | 'carbs' | 'fat'>) {
  const calories = Number(values.calories);
  const calculated = Number(values.protein) * 4 + Number(values.carbs) * 4 + Number(values.fat) * 9;
  return calculated > 0 && Math.abs(calories - calculated) / calculated > 0.2;
}
function escapeFilter(value: string) { return value.replace(/([\\%_,])/g, '\\$1'); }
export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export async function getAdminFoods(filters: { search: string; category: string; status: string; page: number }) {
  let query = supabase.from('foods').select('*', { count: 'exact' }).order('updated_at', { ascending: false });
  if (filters.search.trim()) { const search = escapeFilter(filters.search.trim()); query = query.or(`name.ilike.%${search}%,slug.ilike.%${search}%`); }
  if (filters.category) query = query.eq('category', filters.category);
  if (filters.status) query = query.eq('status', filters.status);
  const from = filters.page * adminFoodPageSize;
  const result = await query.range(from, from + adminFoodPageSize - 1);
  if (result.error) throw result.error;
  return { foods: (result.data ?? []) as AdminFood[], count: result.count ?? 0 };
}
export async function getAdminFood(id: string) {
  const result = await supabase.from('foods').select('*').eq('id', id).single();
  if (result.error || !result.data) throw result.error ?? new Error('FOOD_NOT_FOUND');
  return result.data as AdminFood;
}
export async function getFoodStatusCounts() {
  const counts = await Promise.all(foodStatuses.map(async (status) => {
    const result = await supabase.from('foods').select('id', { count: 'exact', head: true }).eq('status', status);
    if (result.error) throw result.error;
    return [status, result.count ?? 0] as const;
  }));
  return Object.fromEntries(counts) as Record<FoodStatus, number>;
}
export async function isFoodSlugAvailable(slug: string, id?: string) {
  let query = supabase.from('foods').select('id').eq('slug', slug).limit(1);
  if (id) query = query.neq('id', id);
  const result = await query.maybeSingle();
  if (result.error) throw result.error;
  return !result.data;
}
export async function saveAdminFood(values: FoodFormValues, id?: string) {
  const parsed = foodFormSchema.parse(values);
  const result = id
    ? await supabase.from('foods').update(parsed).eq('id', id).select('*').single()
    : await supabase.from('foods').insert(parsed).select('*').single();
  if (result.error || !result.data) throw result.error ?? new Error('FOOD_SAVE_FAILED');
  return result.data as AdminFood;
}
export async function setFoodStatus(id: string, status: FoodStatus) {
  const result = await supabase.from('foods').update({ status }).eq('id', id).select('*').single();
  if (result.error || !result.data) throw result.error ?? new Error('FOOD_STATUS_FAILED');
  return result.data as AdminFood;
}
export async function publishAdminFood(id: string) {
  const food = await getAdminFood(id);
  if (!publishFoodSchema.safeParse(foodToForm(food)).success) throw new Error('FOOD_PUBLISH_INVALID');
  return setFoodStatus(id, 'PUBLISHED');
}
