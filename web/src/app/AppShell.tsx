import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui';
import { t } from '../i18n/en';
import { useAuth } from '../features/auth/useAuth';

const navItems = [
  ['/dashboard', 'dashboard'], ['/workout', 'workout'], ['/exercises', 'exercises'], ['/nutrition', 'nutrition'], ['/progress', 'progress'], ['/ai-coach', 'coach'], ['/profile', 'profile'],
] as const;

export function AppShell() {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const logout = async () => { await signOut(); navigate('/login', { replace: true }); };
  return <div className="app-shell">
    <aside className="sidebar"><div className="brand-mark">HF<span>itness</span></div><nav aria-label={t('shell.menu')}>{navItems.map(([path, key]) => <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t(`navigation.${key}`)}</NavLink>)}</nav><Button variant="secondary" onClick={logout}>{t('navigation.logout')}</Button></aside>
    <main className="app-main"><header className="mobile-header"><div className="brand-mark">HF<span>itness</span></div></header><Outlet /></main>
    <nav className="bottom-nav" aria-label={t('shell.menu')}>{(['/dashboard', '/workout', '/nutrition', '/progress', '/profile'] as const).map((path, index) => <NavLink key={path} to={path}>{t(`navigation.${(['home', 'workout', 'nutrition', 'progress', 'more'] as const)[index]}`)}</NavLink>)}</nav>
  </div>;
}
