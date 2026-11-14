import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../components/ui';
import { t } from '../i18n/en';
import { useAuth } from '../features/auth/useAuth';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getProfile, type Profile } from '../features/profile/profile';
import { useEffect, useState } from 'react';
import { shouldShowAdminNav } from './adminNavigation';

const navItems = [
  ['/dashboard', 'dashboard'], ['/workout', 'workout'], ['/exercises', 'exercises'], ['/nutrition', 'nutrition'], ['/progress', 'progress'], ['/ai-coach', 'coach'], ['/profile', 'profile'],
] as const;

export function AppShell() {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileKnown, setProfileKnown] = useState(false);
  useEffect(() => {
    setProfileKnown(false);
    if (!user) { setProfile(null); setProfileKnown(true); return; }
    void getProfile(user.id).then(setProfile).catch(() => setProfile(null)).finally(() => setProfileKnown(true));
  }, [user]);
  const isAdmin = shouldShowAdminNav(profileKnown, profile?.role);
  const logout = async () => { await signOut(); navigate('/login', { replace: true }); };
  return <div className="app-shell">
    <aside className="sidebar"><Link className="brand-mark" to="/" aria-label={t('brand')}>HF<span>itness</span></Link><nav aria-label={t('shell.menu')}>{navItems.map(([path, key]) => <NavLink key={path} to={path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t(`navigation.${key}`)}</NavLink>)}{isAdmin && <NavLink to="/admin" className={({ isActive }) => isActive || location.pathname.startsWith('/admin') ? 'nav-link active' : 'nav-link'}>{t('navigation.admin')}</NavLink>}</nav><LanguageSwitcher /><Button variant="secondary" onClick={logout}>{t('navigation.logout')}</Button></aside>
    <main className="app-main"><header className="mobile-header"><Link className="brand-mark" to="/" aria-label={t('brand')}>HF<span>itness</span></Link><LanguageSwitcher /></header><Outlet /></main>
    <nav className="bottom-nav" aria-label={t('shell.menu')}>{(['/dashboard', '/workout', '/nutrition', '/progress', '/profile'] as const).map((path, index) => <NavLink key={path} to={path}>{t(`navigation.${(['home', 'workout', 'nutrition', 'progress', 'more'] as const)[index]}`)}</NavLink>)}{isAdmin && <NavLink to="/admin">{t('navigation.admin')}</NavLink>}</nav>
  </div>;
}
