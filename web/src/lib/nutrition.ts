import { z } from 'zod';
import { supabase } from './supabase';

export const quantitySchema = z.coerce.number().positive().max(50);
export const mealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'] as const;
export type MealType = typeof mealTypes[number];
export type Food = { id: string; name: string; slug: string; category: string; serving_size: number; unit: string; calories: number; protein: number; carbs: number; fat: number; status: string };
export type NutritionValues = { calories: number; protein: number; carbs: number; fat: number };
export type MealItem = NutritionValues & { id: string; meal_id: string; food_id: string | null; quantity: number; foods: Food | null };
export type Meal = { id: string; user_id: string; meal_type: MealType; eaten_at: string; meal_items: MealItem[] };
export type Targets = NutritionValues;

const round = (value: number) => Math.round(value * 10) / 10;
export function calculateItemNutrition(food: Food, quantity: number): NutritionValues {
  const valid = quantitySchema.parse(quantity);
  return { calories: round(food.calories * valid), protein: round(food.protein * valid), carbs: round(food.carbs * valid), fat: round(food.fat * valid) };
}
export function sumNutrition(items: readonly NutritionValues[]): NutritionValues {
  return ['calories', 'protein', 'carbs', 'fat'].reduce((result, key) => ({ ...result, [key]: round(result[key as keyof NutritionValues] + items.reduce((sum, item) => sum + item[key as keyof NutritionValues], 0)) }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
}
export function getLocalDayRange(date: Date): { start: string; end: string } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}
export const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export async function getNutritionDay(date: Date): Promise<{ meals: Meal[]; targets: Targets | null }> {
  const range = getLocalDayRange(date);
  const [mealsResult, assessmentResult] = await Promise.all([
    supabase.from('meals').select('*').gte('eaten_at', range.start).lt('eaten_at', range.end).order('eaten_at'),
    supabase.from('fitness_assessments').select('calorie_target, protein_g, carbs_g, fat_g').order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (mealsResult.error) throw mealsResult.error;
  if (assessmentResult.error) throw assessmentResult.error;
  const meals = mealsResult.data ?? [];
  const mealIds = meals.map((meal) => meal.id);
  const itemsResult = mealIds.length ? await supabase.from('meal_items').select('*').in('meal_id', mealIds) : { data: [], error: null };
  if (itemsResult.error) throw itemsResult.error;
  const foods = [...new Set((itemsResult.data ?? []).map((item) => item.food_id).filter(Boolean))];
  const foodResult = foods.length ? await supabase.from('foods').select('*').in('id', foods) : { data: [], error: null };
  if (foodResult.error) throw foodResult.error;
  const foodMap = new Map((foodResult.data ?? []).map((food) => [food.id, food as Food]));
  return {
    meals: meals.map((meal) => ({ ...meal, meal_items: (itemsResult.data ?? []).filter((item) => item.meal_id === meal.id).map((item) => ({ ...item, foods: foodMap.get(item.food_id) ?? null })) })) as Meal[],
    targets: assessmentResult.data ? { calories: assessmentResult.data.calorie_target, protein: assessmentResult.data.protein_g, carbs: assessmentResult.data.carbs_g, fat: assessmentResult.data.fat_g } : null,
  };
}
export async function searchFoods(query: string): Promise<Food[]> {
  const escaped = query.replace(/[%_\\]/g, '\\$&');
  const result = await supabase.from('foods').select('*').eq('status', 'PUBLISHED').ilike('name', `%${escaped}%`).order('name').limit(20);
  if (result.error) throw result.error;
  return (result.data ?? []) as Food[];
}
export async function addFood(food: Food, mealType: MealType, quantity: number, date: Date): Promise<void> {
  const values = calculateItemNutrition(food, quantity);
  const range = getLocalDayRange(date);
  const existing = await supabase.from('meals').select('id').eq('meal_type', mealType).gte('eaten_at', range.start).lt('eaten_at', range.end).maybeSingle();
  if (existing.error) throw existing.error;
  let mealId = existing.data?.id;
  if (!mealId) {
    const meal = await supabase.from('meals').insert({ meal_type: mealType, eaten_at: new Date().toISOString() }).select('id').single();
    if (meal.error || !meal.data) throw meal.error ?? new Error('Meal creation failed');
    mealId = meal.data.id;
  }
  const item = await supabase.from('meal_items').insert({ meal_id: mealId, food_id: food.id, quantity, ...values }).select('id').single();
  if (item.error) throw item.error;
}
export async function updateMealItem(item: MealItem, quantity: number): Promise<void> {
  if (!item.foods) throw new Error('Food unavailable');
  const result = await supabase.from('meal_items').update({ quantity, ...calculateItemNutrition(item.foods, quantity) }).eq('id', item.id);
  if (result.error) throw result.error;
}
export async function deleteMealItem(id: string): Promise<void> {
  const result = await supabase.from('meal_items').delete().eq('id', id);
  if (result.error) throw result.error;
}
