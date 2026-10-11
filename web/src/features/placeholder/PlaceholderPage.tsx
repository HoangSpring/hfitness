import { EmptyState } from '../../components/ui';
import { t } from '../../i18n/en';
export function PlaceholderPage({ title }: { title: string }) { return <div className="page-content"><h1>{title}</h1><EmptyState title={t('shell.comingSoon')} description={t('shell.placeholder')} /></div>; }

