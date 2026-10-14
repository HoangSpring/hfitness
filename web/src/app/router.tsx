import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthPage } from '../features/auth/AuthPage';
import { AppShell } from './AppShell';
import { ProtectedRoute, PublicOnlyRoute } from './guards';
import { PlaceholderPage } from '../features/placeholder/PlaceholderPage';
import { t } from '../i18n/en';
import { OnboardingPage } from '../features/onboarding/OnboardingPage';
import { AnalyzingPage } from '../features/onboarding/AnalyzingPage';
import { ProfilePage } from '../features/profile/ProfilePage';
import { PublicRouteLayout } from './PublicLayout';
import { LandingPage } from '../features/landing/LandingPage';
import { ExerciseLibraryPage } from '../features/exercises/ExerciseLibraryPage';
import { ExerciseDetailPage } from '../features/exercises/ExerciseDetailPage';
import { WorkoutPage } from '../features/workout/WorkoutPage';
import { WorkoutDayPage } from '../features/workout/WorkoutDayPage';
import { WorkoutSessionPage } from '../features/workout/WorkoutSessionPage';
import { WorkoutHistoryPage } from '../features/workout/WorkoutHistoryPage';

export function AppRouter() {
  return <BrowserRouter><Routes><Route element={<PublicOnlyRoute />}><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /></Route><Route element={<PublicRouteLayout />}><Route path="/" element={<LandingPage />} /><Route path="/exercises" element={<ExerciseLibraryPage />} /><Route path="/exercises/:slug" element={<ExerciseDetailPage />} /></Route><Route element={<ProtectedRoute />}><Route path="/onboarding" element={<OnboardingPage />} /><Route path="/analyzing" element={<AnalyzingPage />} /><Route element={<AppShell />}><Route path="/dashboard" element={<PlaceholderPage title={t('navigation.dashboard')} />} /><Route path="/workout" element={<WorkoutPage />} /><Route path="/workout/day/:dayId" element={<WorkoutDayPage />} /><Route path="/workout/session/:sessionId" element={<WorkoutSessionPage />} /><Route path="/workout/history" element={<WorkoutHistoryPage />} /><Route path="/nutrition" element={<PlaceholderPage title={t('navigation.nutrition')} />} /><Route path="/progress" element={<PlaceholderPage title={t('navigation.progress')} />} /><Route path="/ai-coach" element={<PlaceholderPage title={t('navigation.coach')} />} /><Route path="/profile" element={<ProfilePage />} /></Route></Route><Route path="/404" element={<PlaceholderPage title={t('shell.notFound')} />} /><Route path="*" element={<Navigate to="/404" replace />} /></Routes></BrowserRouter>;
}
