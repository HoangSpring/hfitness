import {
  foodScanItemSchema,
  foodScanResultSchema,
  type FoodScanItem,
} from './schemas/food-scan.js';

export type FoodUnit = 'g' | 'ml' | 'piece';
export type ScanFood = { unit: FoodUnit; serving_size: number };

export function sanitizeItemName(value: string): string | null {
  const name = value.trim();
  if (
    !name ||
    name.length > 80 ||
    /[\r\n]/.test(name) ||
    /[<>]/.test(name) ||
    /[\u0000-\u001f\u007f]/.test(name)
  ) {
    return null;
  }
  return name;
}

export function gramsToServings(
  food: ScanFood,
  amount: number,
  unit: FoodUnit,
): number | null {
  if (food.unit !== unit || !Number.isFinite(amount) || amount <= 0 || food.serving_size <= 0) {
    return null;
  }
  return amount / food.serving_size;
}

export function validateEstimate(item: FoodScanItem): FoodScanItem | null {
  const result = foodScanItemSchema.safeParse(item);
  if (!result.success) return null;

  const value = result.data;
  const maxAmount = value.amount_unit === 'piece' ? 20 : 2000;
  const minAmount = value.amount_unit === 'piece' ? 1 : 5;
  if (value.amount < minAmount || value.amount > maxAmount) return null;

  const macroCalories = 4 * value.protein + 4 * value.carbs + 9 * value.fat;
  const difference = Math.abs(value.calories - macroCalories);
  const inconsistent = macroCalories === 0
    ? value.calories !== 0
    : difference / macroCalories > 0.25;
  if (!inconsistent) return value;

  return {
    ...value,
    calories: Math.round(macroCalories * 10) / 10,
    confidence: Math.min(value.confidence, value.confidence * 0.5),
  };
}

export function validateScanResult(result: unknown): FoodScanItem[] | null {
  const parsed = foodScanResultSchema.safeParse(result);
  if (!parsed.success) return null;
  const items = parsed.data.items.map(validateEstimate);
  return items.every((item): item is FoodScanItem => item !== null) ? items : null;
}

export function needsExplicitCheck(item: Pick<FoodScanItem, 'confidence'> & { source: string }): boolean {
  return item.confidence < 0.6 || item.source === 'SCAN_ESTIMATE';
}

export function detectImageType(bytes: Uint8Array): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}
