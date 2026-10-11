import { describe, expect, it } from 'vitest';
import { t } from './en';

describe('translations', () => {
  it('resolves nested English keys', () => {
    expect(t('auth.login.submit')).toBe('Log in');
  });
});
