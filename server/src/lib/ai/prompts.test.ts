import { describe, expect, it } from 'vitest';
import { WORKOUT_GENERATOR_V1 } from './prompts.js';

const input = {
  goal: 'build_muscle',
  experience: 'beginner',
  daysPerWeek: 3,
  sessionMinutes: 45,
  equipment: ['bodyweight'],
  assessment: { calorie_target: 2200, protein_g: 140 },
  exercises: [{ id: 'exercise-id', name: 'Push-up', primary_muscle: 'chest' }],
};

describe('workout generation prompt locale', () => {
  it('requests English by default', () => {
    expect(WORKOUT_GENERATOR_V1(input)).toContain('in English');
  });

  it('requests Vietnamese when selected', () => {
    expect(WORKOUT_GENERATOR_V1({ ...input, locale: 'vi' })).toContain('in Vietnamese');
  });
});
