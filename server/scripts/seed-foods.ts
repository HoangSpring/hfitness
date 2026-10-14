import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { seedFoods, type SeedFood } from '../src/lib/constants/foods.data.js';

function validateFoods(rows: readonly SeedFood[]): void {
  const slugs = new Set<string>();
  const errors: string[] = [];
  rows.forEach((row, index) => {
    if (!row.name.trim() || !row.slug.trim()) errors.push(`row ${index + 1}: name and slug are required`);
    if (slugs.has(row.slug)) errors.push(`${row.slug}: duplicate slug`);
    slugs.add(row.slug);
    if (row.serving_size <= 0 || [row.calories, row.protein, row.carbs, row.fat].some((value) => value < 0)) errors.push(`${row.slug}: nutrition values must be non-negative`);
    if (Math.abs(row.calories - (row.protein * 4 + row.carbs * 4 + row.fat * 9)) > 20) console.warn(`${row.slug}: approximate calories differ from macros by more than 20 kcal`);
  });
  if (rows.length < 200) errors.push(`expected at least 200 foods, received ${rows.length}`);
  if (errors.length) throw new Error(`Food validation failed:\n${errors.join('\n')}`);
}

async function main(): Promise<void> {
  validateFoods(seedFoods);
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  const supabase = createClient(url, key);
  const { error } = await supabase.from('foods').upsert(seedFoods, { onConflict: 'slug' });
  if (error) throw new Error(`Food upsert failed: ${error.message}`);
  console.log(`Upserted ${seedFoods.length} approximate food rows.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Food seed failed.');
  process.exitCode = 1;
});
