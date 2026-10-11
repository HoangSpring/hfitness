import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Spinner } from '../components/ui';
import { useAuth } from '../features/auth/useAuth';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="center-page"><Spinner /></div>;
  return user ? <Outlet /> : <Navigate to="/login" replace state={{ from: location.pathname }} />;
}
export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center-page"><Spinner /></div>;
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
