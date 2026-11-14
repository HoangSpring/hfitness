import { createContext, useContext } from 'react';
import type { Locale } from './en';

export const LocaleContext = createContext<{ locale: Locale; changeLocale: (locale: Locale) => void } | null>(null);

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error('useLocale must be used inside LocaleProvider');
  return value;
}
