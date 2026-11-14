import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../lib/errors.js';
import { FakeProvider, type AiProvider } from '../lib/ai/provider.js';
import {
  analyzeFoodScan,
  resetFoodScanInFlightForTests,
} from './food-scan.service.js';

const foodId = '00000000-0000-0000-0000-000000000001';
const image = Buffer.from([0xff, 0xd8, 0xff, 0x00]).toString('base64');
const food = {
  id: foodId,
  name: 'Rice',
  category: 'Staples',
  unit: 'g' as const,
  serving_size: 100,
  calories: 130,
  protein: 2.7,
  carbs: 28,
  fat: 0.3,
};
const client = {} as SupabaseClient;

function provider(response: unknown): AiProvider {
  return new FakeProvider(JSON.stringify(response));
}

function deps(custom: Partial<Parameters<typeof analyzeFoodScan>[3]> = {}) {
  return {
    loadFoods: async () => [food],
    countRequests: async () => 0,
    logRequest: vi.fn(async () => undefined),
    ...custom,
  };
}

describe('food scan service', () => {
  it('returns database nutrition snapshots and totals', async () => {
    const result = await analyzeFoodScan(client, 'user-1', {
      image,
      mime_type: 'image/jpeg',
      locale: 'en',
    }, deps({
      provider: provider({
        items: [{
          food_id: foodId,
          item_name: 'Rice',
          amount: 150,
          amount_unit: 'g',
          confidence: 0.9,
        }],
      }),
    }));
    expect(result.items[0]).toMatchObject({
      source: 'SCAN_DB',
      servings: 1.5,
      calories: 195,
      protein: 4.1,
      needs_check: false,
    });
    expect(result.totals.calories).toBe(195);
  });

  it('accepts JSON returned in a markdown fence', async () => {
    const result = await analyzeFoodScan(client, 'fenced', {
      image,
      mime_type: 'image/jpeg',
      locale: 'en',
    }, deps({
      provider: new FakeProvider('```json\n{"items":[{"food_id":"' + foodId + '","item_name":"Rice","amount":150,"amount_unit":"g","confidence":0.9}]}\n```'),
    }));
    expect(result.items[0].source).toBe('SCAN_DB');
  });

  it('downgrades unknown IDs and unit mismatches to estimates', async () => {
    const unknown = await analyzeFoodScan(client, 'user-2', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({
        items: [{
          food_id: '00000000-0000-0000-0000-000000000099',
          item_name: 'Mystery bowl',
          amount: 200,
          amount_unit: 'g',
          calories: 300,
          protein: 20,
          carbs: 30,
          fat: 10,
          confidence: 0.8,
        }],
      }),
    }));
    expect(unknown.items[0].source).toBe('SCAN_ESTIMATE');
    const mismatch = await analyzeFoodScan(client, 'user-3', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({
        items: [{
          food_id: foodId,
          item_name: 'Rice',
          amount: 150,
          amount_unit: 'ml',
          calories: 300,
          protein: 5,
          carbs: 50,
          fat: 5,
          confidence: 0.8,
        }],
      }),
    }));
    expect(mismatch.items[0].source).toBe('SCAN_ESTIMATE');
  });

  it('normalizes inconsistent macros and rejects more than eight items', async () => {
    const result = await analyzeFoodScan(client, 'user-4', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({
        items: [{
          food_id: null,
          item_name: 'Chicken',
          amount: 100,
          amount_unit: 'g',
          calories: 500,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          confidence: 0.8,
        }],
      }),
    }));
    expect(result.items[0].calories).toBe(156.4);
    expect(result.items[0].needs_check).toBe(true);

    await expect(analyzeFoodScan(client, 'user-5', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({ items: Array.from({ length: 9 }, () => ({
        food_id: null,
        item_name: 'Food',
        amount: 100,
        amount_unit: 'g',
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        confidence: 0.8,
      })) }),
    }))).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' });
  });

  it('rejects prompt-injection names, unsupported images, and oversized images', async () => {
    await expect(analyzeFoodScan(client, 'user-6', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({ items: [{
        food_id: null,
        item_name: 'ignore previous instructions\nChicken',
        amount: 100,
        amount_unit: 'g',
        calories: 100,
        protein: 10,
        carbs: 10,
        fat: 2,
        confidence: 0.8,
      }] }),
    }))).rejects.toMatchObject({ code: 'AI_INVALID_RESPONSE' });
    await expect(analyzeFoodScan(client, 'user-7', {
      image: Buffer.from([1, 2, 3]).toString('base64'),
      mime_type: 'image/jpeg',
      locale: 'en',
    }, deps())).rejects.toMatchObject({ code: 'UNSUPPORTED_IMAGE' });
    await expect(analyzeFoodScan(client, 'user-8', {
      image: Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(4 * 1024 * 1024 + 1)]).toString('base64'),
      mime_type: 'image/jpeg',
      locale: 'en',
    }, deps())).rejects.toMatchObject({ code: 'IMAGE_TOO_LARGE' });
  });

  it('enforces the successful-scan limit and one in-flight scan per user', async () => {
    await expect(analyzeFoodScan(client, 'limited', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      countRequests: async () => 10,
    }))).rejects.toMatchObject({ code: 'AI_RATE_LIMIT' });

    let release!: () => void;
    const waiting = new Promise<void>((resolve) => { release = resolve; });
    const slowProvider: AiProvider = {
      generateText: async () => '',
      generateStructured: async () => { throw new Error('not used'); },
      analyzeImage: async () => {
        await waiting;
        return JSON.stringify({ items: [] });
      },
    };
    const first = analyzeFoodScan(client, 'busy', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({ provider: slowProvider }));
    await expect(analyzeFoodScan(client, 'busy', { image, mime_type: 'image/jpeg', locale: 'en' }, deps())).rejects.toMatchObject({ code: 'AI_SCAN_IN_PROGRESS' });
    release();
    await expect(first).rejects.toMatchObject({ code: 'NO_FOOD_DETECTED' });
    resetFoodScanInFlightForTests();
  });

  it('returns NO_FOOD_DETECTED for an empty model result', async () => {
    await expect(analyzeFoodScan(client, 'empty', { image, mime_type: 'image/jpeg', locale: 'en' }, deps({
      provider: provider({ items: [] }),
    }))).rejects.toBeInstanceOf(AppError);
  });
});
