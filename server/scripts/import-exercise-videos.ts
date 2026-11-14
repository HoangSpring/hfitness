import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { normalizeExerciseVideoUrl } from '../../shared/youtube.js';

type VideoRow = { slug: string; youtube_url: string };

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseCsv(contents: string): VideoRow[] {
  const lines = contents.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0 || lines[0].trim() !== 'slug,youtube_url') {
    throw new Error('exercise-videos.csv must start with the header slug,youtube_url.');
  }
  return lines.slice(1).map((line, index) => {
    const comma = line.indexOf(',');
    if (comma < 1) return { slug: `row-${index + 2}`, youtube_url: '' };
    return { slug: line.slice(0, comma).trim(), youtube_url: line.slice(comma + 1).trim() };
  });
}

async function main(): Promise<void> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!isNonEmptyString(url) || !isNonEmptyString(serviceRoleKey)) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in server/.env');
  }

  const csvPath = path.resolve(process.cwd(), '..', 'supabase', 'seed', 'exercise-videos.csv');
  const rows = parseCsv(await readFile(csvPath, 'utf8'));
  const supabase = createClient(url, serviceRoleKey);
  let updated = 0;
  let skippedInvalid = 0;
  let skippedMissing = 0;

  for (const row of rows) {
    const normalizedUrl = normalizeExerciseVideoUrl(row.youtube_url);
    if (!isNonEmptyString(row.slug) || !normalizedUrl) {
      skippedInvalid += 1;
      console.log(`Skipped invalid row: ${row.slug || '<missing slug>'}`);
      continue;
    }

    const { data: exercise, error: lookupError } = await supabase
      .from('exercises')
      .select('id')
      .eq('slug', row.slug)
      .maybeSingle();
    if (lookupError) throw new Error(`Exercise lookup failed: ${lookupError.message}`);
    if (!exercise) {
      skippedMissing += 1;
      console.log(`Skipped missing exercise: ${row.slug}`);
      continue;
    }

    const { error: updateError } = await supabase
      .from('exercises')
      .update({ video_url: normalizedUrl })
      .eq('id', exercise.id);
    if (updateError) throw new Error(`Video update failed: ${updateError.message}`);
    updated += 1;
  }

  console.log(`Updated: ${updated}`);
  console.log(`Skipped invalid: ${skippedInvalid}`);
  console.log(`Skipped missing: ${skippedMissing}`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Exercise video import failed.');
  process.exitCode = 1;
});
