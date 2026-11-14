import type { Locale } from './en';

export function activeLocale(): Locale {
  return document.documentElement.lang === 'vi' ? 'vi' : 'en';
}

export function formatDate(value: Date | string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) {
  return new Intl.DateTimeFormat(activeLocale(), options).format(typeof value === 'string' ? new Date(value) : value);
}

export function formatNumber(value: number, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(activeLocale(), options).format(value);
}
