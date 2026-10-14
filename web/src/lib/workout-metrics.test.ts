import { describe, expect, it } from 'vitest';
import { calculateDuration, calculateVolume, findPersonalRecords } from './workout-metrics';

describe('workout metrics', () => {
  it('calculates volume and handles empty sets', () => {
    expect(calculateVolume([])).toBe(0);
    expect(calculateVolume([{ exercise_id: 'a', weight_kg: 20, reps: 5 }])).toBe(100);
  });

  it('finds only heavier non-zero records and excludes ties', () => {
    const current = [
      { exercise_id: 'a', weight_kg: 60, reps: 5 },
      { exercise_id: 'b', weight_kg: 0, reps: 10 },
      { exercise_id: 'c', weight_kg: 50, reps: 5 },
    ];
    const previous = [
      { exercise_id: 'a', weight_kg: 50, reps: 5 },
      { exercise_id: 'c', weight_kg: 50, reps: 5 },
    ];
    expect(findPersonalRecords(current, previous)).toEqual(['a']);
    expect(findPersonalRecords([], [])).toEqual([]);
  });

  it('calculates completed and in-progress duration', () => {
    expect(calculateDuration('2026-01-01T10:00:00Z', '2026-01-01T10:45:00Z')).toBe(45);
    expect(calculateDuration('2026-01-01T10:00:00Z', null, new Date('2026-01-01T10:12:00Z'))).toBe(12);
  });
});
