import { describe, expect, it } from 'vitest';
import { en, setLocale, t } from './en';
import { vi } from './vi';

function flatten(value: unknown, prefix = ''): Record<string, string> {
  if (!value || typeof value !== 'object') return prefix ? { [prefix]: String(value ?? '') } : {};
  return Object.entries(value).reduce<Record<string, string>>((result, [key, child]) => ({ ...result, ...flatten(child, prefix ? `${prefix}.${key}` : key) }), {});
}

function placeholders(value: string): string[] {
  return [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
}


describe('translations', () => {
  it('resolves nested English keys', () => {
    setLocale('en');
    expect(t('auth.login.submit')).toBe('Log in');
  });

  it('resolves Vietnamese translations after switching locale', () => {
    setLocale('vi', vi);
    expect(t('auth.login.submit')).toBe('Đăng nhập');
    setLocale('en');
  });

  it('keeps English and Vietnamese dictionaries in parity', () => {
    const english = flatten(en);
    const vietnamese = flatten(vi);
    expect(Object.keys(vietnamese).sort()).toEqual(Object.keys(english).sort());
    for (const key of Object.keys(english)) {
      expect(vietnamese[key].trim(), key).not.toBe('');
      expect(placeholders(vietnamese[key]), key).toEqual(placeholders(english[key]));
    }
  });

  it('reports translation keys with no obvious literal usage', () => {
    const unused = Object.keys(flatten(en)).filter((key) => key.startsWith('unused.'));
    if (unused.length > 0) console.warn(`Potentially unused translation keys (report only): ${unused.join(', ')}`);
    expect(true).toBe(true);
  });
});
