import { describe, expect, it } from 'vitest';
import { calculateItemNutrition, getLocalDayRange, getMealItemAmount, getMealItemName, sumNutrition } from './nutrition';

const food = { id: '1', name: 'Rice', slug: 'rice', category: 'Staples', serving_size: 100, unit: 'g', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, status: 'PUBLISHED' };
describe('nutrition utilities', () => {
  it('calculates rounded item snapshots', () => expect(calculateItemNutrition(food, 1.25)).toEqual({ calories: 162.5, protein: 3.4, carbs: 35, fat: 0.4 }));
  it('rejects zero and excessive quantities', () => { expect(() => calculateItemNutrition(food, 0)).toThrow(); expect(() => calculateItemNutrition(food, 51)).toThrow(); });
  it('sums values and handles empty input', () => { expect(sumNutrition([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 }); expect(sumNutrition([{ calories: 1, protein: 2, carbs: 3, fat: 4 }, { calories: 2, protein: 1, carbs: 2, fat: 1 }])).toEqual({ calories: 3, protein: 3, carbs: 5, fat: 5 }); });
  it('uses the browser local day boundaries', () => { const range = getLocalDayRange(new Date(2026, 0, 2, 23, 30)); expect(new Date(range.start).getDate()).toBe(2); expect(new Date(range.end).getDate()).toBe(3); });
  it('displays scanned estimate names and amounts', () => {
    const item = { foods: null, item_name: 'Chicken', quantity: 1, amount: 150, amount_unit: 'g' } as const;
    expect(getMealItemName(item)).toBe('Chicken');
    expect(getMealItemAmount(item)).toBe('150 g');
  });
});
