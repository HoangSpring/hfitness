import { describe, expect, it } from 'vitest';
import { coachRequestSchema } from './coach.js';

describe('coach request validation', () => {
  it('accepts a trimmed message and defaults timezone and locale', () => {
    const parsed = coachRequestSchema.parse({ message: '  What should I train?  ' });
    expect(parsed.message).toBe('What should I train?');
    expect(parsed.timezone).toBe('UTC');
    expect(parsed.locale).toBe('en');
  });
  it('rejects empty, overlong, and invalid timezone input', () => {
    expect(coachRequestSchema.safeParse({ message: '' }).success).toBe(false);
    expect(coachRequestSchema.safeParse({ message: 'x'.repeat(1001) }).success).toBe(false);
    expect(coachRequestSchema.safeParse({ message: 'hello', timezone: 'invalid/zone' }).success).toBe(false);
  });
  it('rejects malformed conversation IDs', () => {
    expect(coachRequestSchema.safeParse({ conversation_id: 'other-user-conversation', message: 'hello' }).success).toBe(false);
  });
  it('falls back to English for an unsupported locale', () => {
    expect(coachRequestSchema.parse({ message: 'hello', locale: 'fr' }).locale).toBe('en');
  });
});
