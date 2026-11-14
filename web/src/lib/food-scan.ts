import { apiRequest } from './api';
import { supabase } from './supabase';
import type { MealType, NutritionValues } from './nutrition';

export type ScanUnit = 'g' | 'ml' | 'piece';
export type ScanItem = NutritionValues & {
  food_id: string | null;
  item_name: string;
  amount: number;
  amount_unit: ScanUnit;
  confidence: number;
  source: 'SCAN_DB' | 'SCAN_ESTIMATE';
  servings?: number;
  needs_check: boolean;
};

export type FoodScanResponse = {
  items: ScanItem[];
  totals: NutritionValues;
};

export type EditableScanItem = ScanItem & { checked: boolean };

export async function scanFoodPhoto(
  image: string,
  mimeType: string,
  locale: 'en' | 'vi',
  signal?: AbortSignal,
): Promise<FoodScanResponse> {
  return apiRequest<FoodScanResponse>('/ai/food-scans', {
    method: 'POST',
    body: JSON.stringify({ image, mime_type: mimeType, locale }),
    signal,
  });
}

export function resizeFoodImage(file: File, maxSide = 1280, quality = 0.8): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('Canvas is not available.'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error('Could not encode the image.'));
        else resolve(blob);
      }, 'image/jpeg', quality);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Unsupported image.'));
    };
    image.src = url;
  });
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  let binary = '';
  new Uint8Array(buffer).forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

export function recalculateScanItem(item: EditableScanItem, amount: number): EditableScanItem {
  const baseAmount = item.amount || 1;
  const factor = amount / baseAmount;
  return {
    ...item,
    amount,
    calories: Math.round(item.calories * factor * 10) / 10,
    protein: Math.round(item.protein * factor * 10) / 10,
    carbs: Math.round(item.carbs * factor * 10) / 10,
    fat: Math.round(item.fat * factor * 10) / 10,
  };
}

export function canSaveScan(items: readonly EditableScanItem[]): boolean {
  return items.length > 0 && items.every((item) => !item.needs_check || item.checked);
}

export function buildScannedMealItems(mealId: string, items: readonly EditableScanItem[]) {
  return items.map((item) => ({
    meal_id: mealId,
    food_id: item.food_id,
    item_name: item.source === 'SCAN_ESTIMATE' ? item.item_name : null,
    source: item.source,
    ai_confidence: item.confidence,
    amount: item.amount,
    amount_unit: item.amount_unit,
    quantity: item.servings ?? 1,
    calories: item.calories,
    protein: item.protein,
    carbs: item.carbs,
    fat: item.fat,
  }));
}

export async function saveScannedMeal(
  mealType: MealType,
  items: readonly EditableScanItem[],
  date: Date,
): Promise<void> {
  const range = {
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString(),
  };
  const existing = await supabase.from('meals').select('id').eq('meal_type', mealType).gte('eaten_at', range.start).lt('eaten_at', range.end).maybeSingle();
  if (existing.error) throw existing.error;
  let mealId = existing.data?.id;
  if (!mealId) {
    const meal = await supabase.from('meals').insert({ meal_type: mealType, eaten_at: new Date().toISOString() }).select('id').single();
    if (meal.error || !meal.data) throw meal.error ?? new Error('Meal creation failed');
    mealId = meal.data.id;
  }
  const result = await supabase.from('meal_items').insert(buildScannedMealItems(mealId, items));
  if (result.error) throw result.error;
}
