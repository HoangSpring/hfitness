import { useLocale } from '../i18n/LocaleContext';
import { t } from '../i18n/en';

export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale();
  return <label className="language-switcher">
    <span className="sr-only">{t('language.label')}</span>
    <select value={locale} onChange={(event) => changeLocale(event.target.value as 'en' | 'vi')} aria-label={t('language.label')}>
      <option value="vi">{t('language.vietnamese')}</option>
      <option value="en">{t('language.english')}</option>
    </select>
  </label>;
}
