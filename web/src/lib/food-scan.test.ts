import { describe, expect, it, vi } from 'vitest';
import {
  buildScannedMealItems,
  canSaveScan,
  recalculateScanItem,
  resizeFoodImage,
  type EditableScanItem,
} from './food-scan';

const item: EditableScanItem = {
  food_id: null,
  item_name: 'Chicken',
  amount: 100,
  amount_unit: 'g',
  calories: 165,
  protein: 31,
  carbs: 0,
  fat: 3.6,
  confidence: 0.4,
  source: 'SCAN_ESTIMATE',
  needs_check: true,
  checked: false,
};

describe('food scan web utilities', () => {
  it('resizes and encodes an image through canvas', async () => {
    const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:photo');
    const image = { naturalWidth: 2560, naturalHeight: 1280, onload: null as (() => void) | null, onerror: null as (() => void) | null, src: '' };
    vi.stubGlobal('Image', vi.fn(() => image));
    const toBlob = vi.fn((callback: BlobCallback) => callback(new Blob(['jpeg'], { type: 'image/jpeg' })));
    const drawImage = vi.fn();
    vi.stubGlobal('document', { createElement: vi.fn(() => ({ width: 0, height: 0, getContext: () => ({ drawImage }), toBlob })) });
    const promise = resizeFoodImage(new File(['image'], 'photo.jpg', { type: 'image/jpeg' }));
    image.onload?.();
    await expect(promise).resolves.toBeInstanceOf(Blob);
    expect(drawImage).toHaveBeenCalledWith(image, 0, 0, 1280, 640);
    expect(revoke).toHaveBeenCalledWith('blob:photo');
    vi.unstubAllGlobals();
  });

  it('recalculates all macros linearly', () => {
    expect(recalculateScanItem(item, 200)).toMatchObject({
      amount: 200, calories: 330, protein: 62, carbs: 0, fat: 7.2,
    });
  });

  it('builds a save payload without user_id and preserves estimate metadata', () => {
    expect(buildScannedMealItems('meal-1', [item])).toEqual([{
      meal_id: 'meal-1', food_id: null, item_name: 'Chicken', source: 'SCAN_ESTIMATE',
      ai_confidence: 0.4, amount: 100, amount_unit: 'g', quantity: 1,
      calories: 165, protein: 31, carbs: 0, fat: 3.6,
    }]);
  });

  it('requires explicit checks before saving', () => {
    expect(canSaveScan([item])).toBe(false);
    expect(canSaveScan([{ ...item, checked: true }])).toBe(true);
    expect(canSaveScan([{ ...item, needs_check: false }])).toBe(true);
  });
});
