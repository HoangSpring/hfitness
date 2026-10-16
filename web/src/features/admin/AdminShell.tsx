import { NavLink, Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Spinner } from '../../components/ui';
import { useAuth } from '../auth/useAuth';
import { getProfile, type Profile } from '../profile/profile';
import { t } from '../../i18n/en';
import { useEffect, useState } from 'react';

const navItems = [
  ['/admin', 'dashboard'],
  ['/admin/users', 'users'],
  ['/admin/exercises', 'exercises'],
  ['/admin/foods', 'foods'],
] as const;

export function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      return;
    }
    setProfileLoading(true);
    setProfileError(false);
    void getProfile(user.id)
      .then(setProfile)
      .catch(() => setProfileError(true))
      .finally(() => setProfileLoading(false));
  }, [user]);

  if (loading || (user && profileLoading)) return <div className="center-page"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileError || !profile) return <div className="center-page"><p role="alert">{t('admin.loadError')}</p></div>;
  if (profile.role !== 'ADMIN') return <Navigate to="/403" replace />;
  return <AdminShell profile={profile} />;
}

function AdminShell({ profile }: { profile: Profile }) {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };
  const pageTitle = location.pathname.startsWith('/admin/users')
    ? t('admin.users')
    : location.pathname.startsWith('/admin/exercises')
      ? t('admin.exercises')
      : location.pathname.startsWith('/admin/foods')
        ? t('admin.foods')
        : t('admin.dashboard');
  const displayName = profile.display_name || user?.email || t('admin.administrator');

  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <div className="brand-mark">HF<span>itness</span></div>
      <p className="admin-label">{t('admin.label')}</p>
      <nav aria-label={t('shell.menu')}>
        {navItems.map(([path, key]) => <NavLink end={path === '/admin'} key={path} to={path} className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>{t(`admin.${key}`)}</NavLink>)}
      </nav>
      <NavLink className="nav-link" to="/dashboard">{t('admin.backToApp')}</NavLink>
      <Button variant="secondary" onClick={() => void logout()}>{t('navigation.logout')}</Button>
    </aside>
    <main className="admin-main">
      <header className="admin-topbar">
        <h1>{pageTitle}</h1>
        <div className="admin-profile">
          <span>{displayName}</span>
          <strong>{t('admin.badge')}</strong>
          <Button variant="secondary" onClick={() => void logout()}>{t('navigation.logout')}</Button>
        </div>
      </header>
      <Outlet />
    </main>
  </div>;
}
