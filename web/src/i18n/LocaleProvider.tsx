import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { setLocale, type Locale } from './en';
import { LocaleContext } from './LocaleContext';
import { vi } from './vi';

const storageKey = 'hfitness-locale';

function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'vi';
  return window.localStorage.getItem(storageKey) === 'en' ? 'en' : 'vi';
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrentLocale] = useState<Locale>(() => {
    const stored = readStoredLocale();
    setLocale(stored, stored === 'vi' ? vi : undefined);
    return stored;
  });
  useEffect(() => {
    document.documentElement.dataset.locale = locale;
  }, [locale]);
  const value = useMemo(() => ({
    locale,
    changeLocale: (next: Locale) => {
      window.localStorage.setItem(storageKey, next);
      setLocale(next, next === 'vi' ? vi : undefined);
      setCurrentLocale(next);
    },
  }), [locale]);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.title = document.title.replace(/^(.*?) \| HFitness$/, (_, name: string) => `${name} | HFitness`);
  }, [locale]);
  return <LocaleContext.Provider value={value}><div key={locale}>{children}</div></LocaleContext.Provider>;
}
