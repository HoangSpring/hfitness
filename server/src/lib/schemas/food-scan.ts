import { z } from 'zod';

export const foodScanUnitSchema = z.enum(['g', 'ml', 'piece']);

const nutritionSchema = z.object({
  calories: z.number().finite().min(0).max(3000),
  protein: z.number().finite().min(0),
  carbs: z.number().finite().min(0),
  fat: z.number().finite().min(0),
});

export const foodScanItemSchema = z.object({
  food_id: z.string().uuid().nullable(),
  item_name: z.string().min(1).max(80),
  amount: z.number().finite().positive(),
  amount_unit: foodScanUnitSchema,
  ...nutritionSchema.shape,
  confidence: z.number().finite().min(0).max(1),
});

export const foodScanResultSchema = z.object({
  items: z.array(foodScanItemSchema).max(8),
}).strict();

export const foodScanModelItemSchema = z.object({
  food_id: z.string().nullable(),
  item_name: z.string().min(1).max(80),
  amount: z.number().finite().positive(),
  amount_unit: foodScanUnitSchema,
  calories: z.number().finite().min(0).max(3000).optional(),
  protein: z.number().finite().min(0).optional(),
  carbs: z.number().finite().min(0).optional(),
  fat: z.number().finite().min(0).optional(),
  confidence: z.number().finite().min(0).max(1),
}).strict().superRefine((item, context) => {
  if (item.food_id === null && [item.calories, item.protein, item.carbs, item.fat].some((value) => value === undefined)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'Estimate nutrition is required when food_id is null.' });
  }
});

export const foodScanModelResultSchema = z.object({
  items: z.array(foodScanModelItemSchema).max(8),
}).strict();

export const foodScanConfirmItemSchema = z.object({
  food_id: z.string().uuid().nullable(),
  item_name: z.string().min(1).max(80).nullable(),
  source: z.enum(['SCAN_DB', 'SCAN_ESTIMATE']),
  ai_confidence: z.number().min(0).max(1),
  amount: z.number().positive().nullable(),
  amount_unit: foodScanUnitSchema.nullable(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
});

export const foodScanConfirmPayloadSchema = z.object({
  meal_type: z.enum(['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK']),
  items: z.array(foodScanConfirmItemSchema).min(1).max(8),
}).superRefine((payload, context) => {
  payload.items.forEach((item, index) => {
    if (item.food_id === null && (item.source !== 'SCAN_ESTIMATE' || item.item_name === null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['items', index],
        message: 'Estimate items require a name and SCAN_ESTIMATE source.',
      });
    }
  });
});

export type FoodScanItem = z.infer<typeof foodScanItemSchema>;
export type FoodScanResult = z.infer<typeof foodScanResultSchema>;
export type FoodScanConfirmPayload = z.infer<typeof foodScanConfirmPayloadSchema>;
