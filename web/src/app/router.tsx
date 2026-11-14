import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
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
import { NutritionPage } from '../features/nutrition/NutritionPage';
import { ProgressPage } from '../features/progress/ProgressPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { CoachPage } from '../features/coach/CoachPage';
import { AdminRoute } from '../features/admin/AdminShell';
import { AdminDashboardPage, AdminExerciseEditorPage, AdminExercisesPage, AdminFoodEditorPage, AdminFoodsPage, AdminUserDetailPage, AdminUsersPage } from '../features/admin/AdminPages';
import { ForbiddenPage } from '../features/admin/ForbiddenPage';
import { useLocale } from '../i18n/LocaleContext';

export function AppRouter() {
  return <BrowserRouter><DocumentTitle /><Routes>
    <Route element={<PublicOnlyRoute />}><Route path="/login" element={<AuthPage mode="login" />} /><Route path="/register" element={<AuthPage mode="register" />} /></Route>
    <Route element={<PublicRouteLayout />}><Route path="/" element={<LandingPage />} /><Route path="/exercises" element={<ExerciseLibraryPage />} /><Route path="/exercises/:slug" element={<ExerciseDetailPage />} /></Route>
    <Route element={<ProtectedRoute />}><Route path="/onboarding" element={<OnboardingPage />} /><Route path="/analyzing" element={<AnalyzingPage />} /><Route element={<AppShell />}><Route path="/dashboard" element={<DashboardPage />} /><Route path="/workout" element={<WorkoutPage />} /><Route path="/workout/day/:dayId" element={<WorkoutDayPage />} /><Route path="/workout/session/:sessionId" element={<WorkoutSessionPage />} /><Route path="/workout/history" element={<WorkoutHistoryPage />} /><Route path="/nutrition" element={<NutritionPage />} /><Route path="/progress" element={<ProgressPage />} /><Route path="/ai-coach" element={<CoachPage />} /><Route path="/profile" element={<ProfilePage />} /></Route></Route>
    <Route element={<AdminRoute />}><Route path="/admin" element={<AdminDashboardPage />} /><Route path="/admin/users" element={<AdminUsersPage />} /><Route path="/admin/users/:id" element={<AdminUserDetailPage />} /><Route path="/admin/exercises" element={<AdminExercisesPage />} /><Route path="/admin/exercises/new" element={<AdminExerciseEditorPage />} /><Route path="/admin/exercises/:id/edit" element={<AdminExerciseEditorPage />} /><Route path="/admin/foods" element={<AdminFoodsPage />} /><Route path="/admin/foods/new" element={<AdminFoodEditorPage />} /><Route path="/admin/foods/:id/edit" element={<AdminFoodEditorPage />} /></Route>
    <Route path="/403" element={<ForbiddenPage />} /><Route path="/404" element={<PlaceholderPage title={t('shell.notFound')} />} /><Route path="*" element={<Navigate to="/404" replace />} />
  </Routes></BrowserRouter>;
}

function DocumentTitle() {
  const location = useLocation();
  const { locale } = useLocale();
  useEffect(() => {
    const titleKey = location.pathname === '/' ? 'home' : location.pathname.startsWith('/dashboard') ? 'dashboard' : location.pathname.startsWith('/workout') ? 'workout' : location.pathname.startsWith('/nutrition') ? 'nutrition' : location.pathname.startsWith('/progress') ? 'progress' : location.pathname.startsWith('/ai-coach') ? 'coach' : location.pathname.startsWith('/profile') ? 'profile' : location.pathname.startsWith('/exercises') ? 'exercises' : location.pathname.startsWith('/admin/users') ? 'adminUsers' : location.pathname.startsWith('/admin/exercises') ? 'adminExercises' : location.pathname.startsWith('/admin/foods') ? 'adminFoods' : location.pathname.startsWith('/admin') ? 'adminDashboard' : location.pathname.startsWith('/login') ? 'login' : location.pathname.startsWith('/register') ? 'register' : 'home';
    const title = location.pathname.startsWith('/admin') ? `${t(titleKey === 'adminUsers' ? 'adminUsers.title' : titleKey === 'adminExercises' ? 'adminExercises.title' : titleKey === 'adminFoods' ? 'adminFoods.title' : 'adminDashboard.title')} | ${t('brand')} Admin` : `${t(`titles.${titleKey}`)} | ${t('brand')}`;
    document.title = title;
    document.documentElement.lang = locale;
  }, [locale, location.pathname]);
  return null;
}
