import { NavLink, Outlet, Link } from 'react-router-dom';
import { t } from '../i18n/en';
import { AppShell } from './AppShell';
import { Spinner } from '../components/ui';
import { useAuth } from '../features/auth/useAuth';

export function PublicRouteLayout() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><Spinner /></div>;
  return user ? <AppShell /> : <PublicLayout />;
}

export function PublicLayout() {
  return <div className="public-layout">
    <header className="public-header">
      <Link to="/" className="brand-mark" aria-label={t('brand')}>HF<span>itness</span></Link>
      <nav className="public-nav" aria-label={t('shell.menu')}>
        <a href="/#features">{t('public.features')}</a>
        <NavLink to="/exercises">{t('navigation.exercises')}</NavLink>
      </nav>
      <div className="public-actions">
        <Link className="public-login" to="/login">{t('public.login')}</Link>
        <Link className="button button-primary public-cta" to="/register">{t('public.getStarted')}</Link>
      </div>
    </header>
    <Outlet />
  </div>;
}
