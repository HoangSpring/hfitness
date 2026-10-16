import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { t } from '../../i18n/en';

export function ForbiddenPage() {
  return <div className="center-page"><Card className="forbidden-page"><p className="eyebrow">{t('admin.forbiddenCode')}</p><h1>{t('admin.forbiddenTitle')}</h1><p>{t('admin.forbiddenDescription')}</p><Link className="button button-primary" to="/dashboard">{t('shell.backDashboard')}</Link></Card></div>;
}
