import { Outlet } from 'react-router-dom';
import { LandingHeader } from '../features/landing/LandingHeader';

export function PublicRouteLayout() {
  return <PublicLayout />;
}

export function PublicLayout() {
  return <div className="public-layout">
    <LandingHeader />
    <Outlet />
  </div>;
}
