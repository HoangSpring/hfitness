import { t, translatedError } from '../i18n/en';

export function isNetworkError(error: unknown) {
  if (!error) return false;
  const message = error instanceof Error ? error.message : String(error);
  return /failed to fetch|network|offline|connection|fetch failed/i.test(message);
}

export function friendlyError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'code' in error && typeof error.code === 'string') {
    return translatedError(error.code, fallback);
  }
  return isNetworkError(error) ? t('common.networkError') : fallback;
}
