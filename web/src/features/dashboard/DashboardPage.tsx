import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { dateKey } from '../../lib/nutrition';
import { completionRate, selectTodaysWorkout, sevenDayWeightChange, weeklySessionCounts } from '../../lib/progress-metrics';
import { t } from '../../i18n/en';
import { getCurrentPlan, startWorkout, type WorkoutPlan } from '../workout/workout';
import { getDashboardActivity, getDashboardNutrition, getDashboardProfile, getDashboardWeight, type AssessmentTargets, type ProgressProfile, type WeightLog } from '../progress/progress';

const ActivityChart = lazy(() => import('../progress/ProgressChart').then((module) => ({ default: module.ActivityChart })));
type Widget<T> = { loading: boolean; error: boolean; data: T | null };

export function DashboardPage() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Widget<ProgressProfile>>({ loading: true, error: false, data: null });
  const [plan, setPlan] = useState<Widget<WorkoutPlan | null>>({ loading: true, error: false, data: null });
  const [nutrition, setNutrition] = useState<Widget<{ nutrition: Awaited<ReturnType<typeof getDashboardNutrition>>['nutrition']; targets: AssessmentTargets | null }>>({ loading: true, error: false, data: null });
  const [activity, setActivity] = useState<Widget<Awaited<ReturnType<typeof getDashboardActivity>>>>({ loading: true, error: false, data: null });
  const [weights, setWeights] = useState<Widget<WeightLog[]>>({ loading: true, error: false, data: null });
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setProfile((current) => ({ ...current, loading: true })); setPlan((current) => ({ ...current, loading: true })); setNutrition((current) => ({ ...current, loading: true })); setActivity((current) => ({ ...current, loading: true })); setWeights((current) => ({ ...current, loading: true }));
    void Promise.allSettled([getDashboardProfile(), getCurrentPlan(), getDashboardNutrition(), getDashboardActivity(), getDashboardWeight()]).then((results) => {
      const [profileResult, planResult, nutritionResult, activityResult, weightsResult] = results;
      setProfile({ loading: false, error: profileResult.status === 'rejected', data: profileResult.status === 'fulfilled' ? profileResult.value : null });
      setPlan({ loading: false, error: planResult.status === 'rejected', data: planResult.status === 'fulfilled' ? planResult.value : null });
      setNutrition({ loading: false, error: nutritionResult.status === 'rejected', data: nutritionResult.status === 'fulfilled' ? nutritionResult.value : null });
      setActivity({ loading: false, error: activityResult.status === 'rejected', data: activityResult.status === 'fulfilled' ? activityResult.value : null });
      setWeights({ loading: false, error: weightsResult.status === 'rejected', data: weightsResult.status === 'fulfilled' ? weightsResult.value : null });
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async (dayId: string) => { setBusy(true); try { const session = await startWorkout(dayId); navigate(`/workout/session/${session.id}`); } finally { setBusy(false); } };
  const workout = plan.data ? selectTodaysWorkout(plan.data.workout_plan_days, activity.data?.sessions ?? []) : { kind: 'no-plan' as const };
  const selectedDay = plan.data && workout.kind === 'start' ? plan.data.workout_plan_days.find((day) => day.day_index === workout.dayIndex) : null;
  const todayNutrition = nutrition.data?.nutrition.find((entry) => entry.date === dateKey(new Date()));
  const counts = activity.data ? weeklySessionCounts(activity.data.sessions) : [];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const goal = profile.data?.goal ? t(`onboarding.${profile.data.goal}`) : '';

  return <main className="page-content dashboard-page">
    <header className="dashboard-heading"><div><p className="eyebrow">{t('navigation.dashboard')}</p><h1>{profile.loading ? t('dashboard.greetingFallback') : t('dashboard.greeting', { name: profile.data?.display_name || t('dashboard.friend') })}</h1>{profile.data && <p className="muted">{t('dashboard.goal', { goal })}</p>}</div></header>
    <div className="dashboard-grid">
      <DashboardWidget state={plan} title={t('dashboard.workoutTitle')} onRetry={load}>
        {workout.kind === 'resume' ? <><p className="eyebrow">{t('dashboard.resumeLabel')}</p><h2>{t('dashboard.resumeTitle')}</h2><Button onClick={() => navigate(`/workout/session/${workout.session.id}`)} disabled={busy}>{t('dashboard.resume')}</Button></> : workout.kind === 'no-plan' ? <EmptyState title={t('dashboard.noPlanTitle')} description={t('dashboard.noPlanDescription')}><Link className="button button-secondary" to="/workout">{t('dashboard.goWorkout')}</Link></EmptyState> : selectedDay ? <><p className="eyebrow">{t('dashboard.todayLabel')}</p><h2>{selectedDay.name}</h2><p className="muted">{t('workout.exercises', { count: selectedDay.workout_plan_exercises.length })} · {t('workout.minutes', { minutes: Math.round(selectedDay.workout_plan_exercises.reduce((total, item) => total + item.sets * (40 + item.rest_seconds), 0) / 60) })}</p><Button onClick={() => void start(selectedDay.id)} disabled={busy}>{busy && <Spinner />}{t('dashboard.start')}</Button></> : null}
      </DashboardWidget>
      <DashboardWidget state={nutrition} title={t('dashboard.nutritionTitle')} onRetry={load}>
        {nutrition.data?.targets ? <div className="nutrition-rings">{(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => { const value = Number(todayNutrition?.[key] ?? 0); const target = nutrition.data?.targets?.[key] ?? 0; const percent = target ? Math.min(100, Math.round((value / target) * 100)) : 0; return <div className="nutrition-ring" key={key} style={{ '--ring-progress': `${percent}%` } as CSSProperties}><strong>{Math.round(value)}</strong><span>{t(`nutrition.${key}`)}</span><small>{Math.round(target)} {key === 'calories' ? 'kcal' : 'g'}</small></div>; })}</div> : <EmptyState title={t('dashboard.noTargetsTitle')} description={t('dashboard.noTargetsDescription')}><Link className="button button-secondary" to="/profile">{t('dashboard.goProfile')}</Link></EmptyState>}
      </DashboardWidget>
      <DashboardWidget state={activity} title={t('dashboard.activityTitle')} onRetry={load}>
        {counts.every((count) => count === 0) ? <EmptyState title={t('dashboard.noActivityTitle')} description={t('dashboard.noActivityDescription')} /> : <Suspense fallback={<Skeleton className="chart-skeleton" />}><ActivityChart counts={counts} labels={labels} /></Suspense>}
        <p className="muted">{activity.data ? t('dashboard.completion', { percent: completionRate(activity.data.sessions, profile.data?.days_per_week ?? 0) }) : ''}</p>
      </DashboardWidget>
      <DashboardWidget state={weights} title={t('dashboard.weightTitle')} onRetry={load}>
        {weights.data?.[0] ? <><p className="large-stat"><strong>{weights.data[0].weight_kg} kg</strong><span>{(() => { const change = sevenDayWeightChange(weights.data ?? []); return change == null ? t('progress.notEnoughData') : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg ${t('progress.lastSevenDays')}`; })()}</span></p><div className="weight-mini-chart">{weights.data.slice(0, 7).reverse().map((entry) => <i key={entry.id} style={{ height: `${Math.max(12, Math.min(100, entry.weight_kg))}%` }} title={`${entry.weight_kg} kg`} />)}</div></> : <EmptyState title={t('dashboard.noWeightTitle')} description={t('dashboard.noWeightDescription')}><Link className="button button-secondary" to="/progress">{t('dashboard.addWeight')}</Link></EmptyState>}
      </DashboardWidget>
      <Card className="coach-card"><p className="eyebrow">{t('dashboard.coachEyebrow')}</p><h2>{t('dashboard.coachTitle')}</h2><p className="muted">{t('dashboard.coachDescription')}</p><Link className="button button-primary" to="/ai-coach">{t('dashboard.openCoach')}</Link></Card>
    </div>
  </main>;
}

function DashboardWidget<T>({ state, title, children, onRetry }: { state: Widget<T>; title: string; children: ReactNode; onRetry: () => void }) {
  return <Card className="dashboard-widget"><h2>{title}</h2>{state.loading ? <><Skeleton /><Skeleton /><Skeleton /></> : state.error ? <ErrorState message={t('dashboard.widgetError')} onRetry={onRetry} /> : children}</Card>;
}
