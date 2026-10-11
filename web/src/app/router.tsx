import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from '../features/auth/AuthPage';
import { AppShell } from './AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './guards';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { t } from '../i18n/en';

export function AppRouter() {
  return <BrowserRouter><Routes><Route element={<PublicOnlyRoute />}><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /></Route><Route element={<ProtectedRoute />}><Route element={<AppShell />}><Route path="/dashboard" element={<PlaceholderPage title={t('navigation.dashboard')} />} /><Route path="/workout/*" element={<PlaceholderPage title={t('navigation.workout')} />} /><Route path="/exercises/*" element={<PlaceholderPage title={t('navigation.exercises')} />} /><Route path="/nutrition" element={<PlaceholderPage title={t('navigation.nutrition')} />} /><Route path="/progress" element={<PlaceholderPage title={t('navigation.progress')} />} /><Route path="/ai-coach" element={<PlaceholderPage title={t('navigation.coach')} />} /><Route path="/profile" element={<PlaceholderPage title={t('navigation.profile')} />} /></Route></Route><Route path="/" element={<Navigate to="/dashboard" replace />} /><Route path="/404" element={<PlaceholderPage title={t('shell.notFound')} />} /><Route path="*" element={<Navigate to="/404" replace />} /></Routes></BrowserRouter>;
}

