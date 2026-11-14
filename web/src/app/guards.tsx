import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button, Card, ErrorState, Spinner } from '../components/ui';
import { t } from '../i18n/en';
import { useAuth } from '../features/auth/useAuth';
import { getProfile, type Profile } from '../features/profile/profile';

export function ProtectedRoute() {
  const { user, loading, signOut } = useAuth();
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
    setProfileError(false);
    setProfileLoading(true);
    void getProfile(user.id).then(setProfile).catch(() => setProfileError(true)).finally(() => setProfileLoading(false));
  }, [user]);
  if (loading || (user && profileLoading)) return <div className="center-page"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (profileError || !profile) return <div className="center-page"><Card><ErrorState message={t('profile.recoveryError')} onRetry={() => window.location.reload()} /><Button variant="secondary" onClick={() => void signOut()}>{t('navigation.logout')}</Button></Card></div>;
  if (!profile.onboarding_completed && location.pathname !== '/onboarding' && location.pathname !== '/analyzing') return <Navigate to="/onboarding" replace />;
  if (profile.onboarding_completed && location.pathname === '/onboarding') return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><Spinner /></div>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
