import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import {
  exerciseDifficulties,
  exerciseEquipment,
  exerciseMovementPatterns,
  exerciseMuscles,
} from '../src/lib/constants/exercise.js';
import { seedExercises, type SeedExercise } from '../src/lib/constants/exercises.data.js';

const statuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
type ExerciseStatus = typeof statuses[number];

const requiredStringFields = [
  'name',
  'slug',
  'description',
  'primary_muscle',
  'equipment',
  'difficulty',
  'movement_pattern',
  'safety_notes',
  'status',
] as const;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateExercises(rows: readonly SeedExercise[]): void {
  const errors: string[] = [];
  const slugs = new Set<string>();
  const muscles = new Set<string>(exerciseMuscles);
  const equipment = new Set<string>(exerciseEquipment);
  const difficulties = new Set<string>(exerciseDifficulties);
  const movementPatterns = new Set<string>(exerciseMovementPatterns);
  const validStatuses = new Set<string>(statuses);

  rows.forEach((row, index) => {
    const slug = typeof row?.slug === 'string' && row.slug.trim() ? row.slug : `<row ${index + 1}>`;
    for (const field of requiredStringFields) {
      if (!isNonEmptyString(row[field])) errors.push(`${slug}: ${field} must be a non-empty string`);
    }
    if (slugs.has(row.slug)) errors.push(`${slug}: slug must be unique`);
    slugs.add(row.slug);
    if (!Array.isArray(row.instructions) || row.instructions.length === 0 || row.instructions.some((item) => !isNonEmptyString(item))) {
      errors.push(`${slug}: instructions must be a non-empty array of non-empty strings`);
    }
    if (!Array.isArray(row.secondary_muscles) || row.secondary_muscles.some((item) => !isNonEmptyString(item))) {
      errors.push(`${slug}: secondary_muscles must be an array with no empty strings`);
    } else if (row.secondary_muscles.some((item) => !muscles.has(item))) {
      errors.push(`${slug}: secondary_muscles contains an invalid muscle`);
    }
    if (!muscles.has(row.primary_muscle)) errors.push(`${slug}: primary_muscle is invalid`);
    if (!equipment.has(row.equipment)) errors.push(`${slug}: equipment is invalid`);
    if (!difficulties.has(row.difficulty)) errors.push(`${slug}: difficulty is invalid`);
    if (!movementPatterns.has(row.movement_pattern)) errors.push(`${slug}: movement_pattern is invalid`);
    if (!validStatuses.has(row.status)) errors.push(`${slug}: status is invalid`);
    if (row.image_url !== null && !isNonEmptyString(row.image_url)) errors.push(`${slug}: image_url must be null or a non-empty string`);
    if (row.video_url !== null && !isNonEmptyString(row.video_url)) errors.push(`${slug}: video_url must be null or a non-empty string`);
  });

  if (errors.length > 0) {
    throw new Error(`Exercise validation failed:\n${errors.join('\n')}`);
  }
}

function countStatuses(rows: Array<{ status: string }>): Record<ExerciseStatus, number> {
  return statuses.reduce((counts, status) => {
    counts[status] = rows.filter((row) => row.status === status).length;
    return counts;
  }, {} as Record<ExerciseStatus, number>);
}

async function main(): Promise<void> {
  console.warn('WARNING: seed:exercises updates non-media fields only; admin media edits are preserved.');
  validateExercises(seedExercises);

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isNonEmptyString(url) || !isNonEmptyString(serviceRoleKey)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  }

  const supabase = createClient(url, serviceRoleKey);
  const seedRows = seedExercises.map(({ image_url: _imageUrl, video_url: _videoUrl, ...exercise }) => exercise);
  const { error: upsertError } = await supabase.from('exercises').upsert(seedRows, { onConflict: 'slug' });
  if (upsertError) throw new Error(`Exercise upsert failed: ${upsertError.message}`);

  const { data, error: countError } = await supabase
    .from('exercises')
    .select('status')
    .in('slug', seedExercises.map((exercise) => exercise.slug));
  if (countError) throw new Error(`Exercise count failed: ${countError.message}`);

  const counts = countStatuses(data ?? []);
  console.log(`PUBLISHED: ${counts.PUBLISHED}`);
  console.log(`DRAFT: ${counts.DRAFT}`);
  console.log(`ARCHIVED: ${counts.ARCHIVED}`);

  const expected = { PUBLISHED: 58, DRAFT: 1, ARCHIVED: 1 };
  if (counts.PUBLISHED !== expected.PUBLISHED || counts.DRAFT !== expected.DRAFT || counts.ARCHIVED !== expected.ARCHIVED) {
    throw new Error('Seed status counts do not match the expected 58 PUBLISHED, 1 DRAFT, 1 ARCHIVED rows.');
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Exercise seed failed.');
  process.exitCode = 1;
});
