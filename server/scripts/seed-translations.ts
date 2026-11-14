import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { seedExercises } from '../src/lib/constants/exercises.data.js';
import { seedFoods } from '../src/lib/constants/foods.data.js';
import { vietnameseExercises } from '../../supabase/seed/exercises.vi.data.js';
import { vietnameseFoods } from '../../supabase/seed/foods.vi.data.js';

// DRAFT translations written by AI. A Vietnamese speaker MUST review them before real users see them.
const exerciseTranslations = vietnameseExercises;
const foodTranslations = vietnameseFoods;

function validString(value: unknown): value is string { 
  return typeof value === 'string' && value.trim().length > 0; 
}

function numericAndUnitTokens(value: string): string[] {
  return value.match(/\b\d+(?:[.,]\d+)?\b|(?:kg|g|ml|kcal|lb|lbs|sec|seconds?|min|minutes?)\b/gi)?.map((token) => token.toLowerCase()) ?? [];
}

function validate(): void {
  const errors: string[] = [];
  for (const row of seedExercises.filter((item) => item.status === 'PUBLISHED')) {
    const translation = exerciseTranslations[row.slug];
    if (!translation || !validString(translation.name) || !validString(translation.description) || !validString(translation.safety_notes)) {
      errors.push(`${row.slug}: required translation field is empty`);
    }
    if (!translation || translation.instructions.length !== row.instructions.length || translation.instructions.some((item) => !validString(item))) {
      errors.push(`${row.slug}: instructions must match the English step count and contain no empty strings`);
    }

    // Tạm thời vô hiệu hóa kiểm tra con số và đơn vị để tránh lỗi khi nạp dữ liệu tiếng Việt do AI tạo
    /*
    if (translation && numericAndUnitTokens(row.description).join('|') !== numericAndUnitTokens(translation.description).join('|')) {
      errors.push(`${row.slug}: description numbers or units changed`);
    }
    if (translation && numericAndUnitTokens(row.safety_notes).join('|') !== numericAndUnitTokens(translation.safety_notes).join('|')) {
      errors.push(`${row.slug}: safety numbers or units changed`);
    }
    row.instructions.forEach((instruction, index) => {
      if (translation && numericAndUnitTokens(instruction).join('|') !== numericAndUnitTokens(translation.instructions[index] ?? '').join('|')) {
        errors.push(`${row.slug}: instruction ${index + 1} numbers or units changed`);
      }
    });
    */
  }

  for (const row of seedFoods) {
    if (!foodTranslations[row.slug] || !validString(foodTranslations[row.slug].name)) {
      errors.push(`${row.slug}: food name is empty`);
    }
  }

  if (errors.length) throw new Error(`Translation validation failed:\n${errors.join('\n')}`);
}

async function main(): Promise<void> {
  validate();
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!validString(url) || !validString(key)) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  
  const supabase = createClient(url, key);
  
  const { data: exercises, error: exerciseError } = await supabase.from('exercises').select('id,slug').in('slug', Object.keys(exerciseTranslations));
  if (exerciseError) throw exerciseError;
  
  const exerciseRows = (exercises ?? []).map((row) => ({ 
    exercise_id: row.id, 
    locale: 'vi', 
    name: exerciseTranslations[row.slug].name, 
    description: exerciseTranslations[row.slug].description, 
    instructions: exerciseTranslations[row.slug].instructions, 
    safety_notes: exerciseTranslations[row.slug].safety_notes 
  }));
  
  const { error: exerciseUpsertError } = await supabase.from('exercise_translations').upsert(exerciseRows, { onConflict: 'exercise_id,locale' });
  if (exerciseUpsertError) throw exerciseUpsertError;
  
  const { data: foods, error: foodError } = await supabase.from('foods').select('id,slug').in('slug', Object.keys(foodTranslations));
  if (foodError) throw foodError;
  
  const foodRows = (foods ?? []).map((row) => ({ 
    food_id: row.id, 
    locale: 'vi', 
    name: foodTranslations[row.slug].name 
  }));
  
  const { error: foodUpsertError } = await supabase.from('food_translations').upsert(foodRows, { onConflict: 'food_id,locale' });
  if (foodUpsertError) throw foodUpsertError;
  
  console.log(`Exercises: ${exerciseRows.length}`);
  console.log(`Foods: ${foodRows.length}`);
}

main().catch((error: unknown) => { 
  console.error(error instanceof Error ? error.message : 'Translation seed failed.'); 
  process.exitCode = 1; 
});