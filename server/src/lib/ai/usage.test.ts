import { describe, expect, it } from 'vitest';
import { countsTowardDailyLimit, utcDayStart } from './usage.js';

describe('AI usage limits', () => {
  it('counts successful user requests but not provider attempts or rejected requests', () => {
    expect(countsTowardDailyLimit('SUCCEEDED')).toBe(true);
    expect(countsTowardDailyLimit('FAILED')).toBe(false);
    expect(countsTowardDailyLimit('VALIDATION_FAILED')).toBe(false);
    expect(countsTowardDailyLimit('RATE_LIMITED')).toBe(false);
  });

  it('defines today as the UTC calendar day', () => {
    expect(utcDayStart(new Date('2026-10-14T00:30:00+07:00'))).toBe('2026-10-13T00:00:00.000Z');
    expect(utcDayStart(new Date('2026-10-14T23:59:59Z'))).toBe('2026-10-14T00:00:00.000Z');
  });
});
