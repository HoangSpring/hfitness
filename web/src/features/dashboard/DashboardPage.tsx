import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { dateKey } from '../../lib/nutrition';
import { completionRate, selectTodaysWorkout, sevenDayWeightChange, weeklySessionCounts } from '../../lib/progress-metrics';
import { t } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { useLocale } from '../../i18n/LocaleContext';
import { activeLocale } from '../../i18n/format';
import { friendlyError } from '../../lib/errors';
import { estimateDayMinutes, getCurrentPlan, getScheduledWeekday, localizeWorkoutExercise, requiresPastWorkoutConfirmation, startWorkout, type WorkoutPlan } from '../workout/workout';
import { getDashboardActivity, getDashboardNutrition, getDashboardProfile, getDashboardWeight, type AssessmentTargets, type ProgressProfile, type WeightLog } from '../progress/progress';
import './DashboardPage.css';

const ActivityChart = lazy(() => import('../progress/ProgressChart').then((module) => ({ default: module.ActivityChart })));
type Widget<T> = { loading: boolean; error: string | false; data: T | null };

const svg = (children: ReactNode, size = 16) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Icon = {
  play: svg(<path d="M7 4l13 8-13 8z" />),
  eye: svg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>),
  clock: svg(<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></>),
  dumbbell: svg(<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />),
  plus: svg(<><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" /></>),
  check: svg(<path d="M5 12l5 5 9-10" />),
  moon: svg(<path d="M20 14A8 8 0 019.5 4 8 8 0 1020 14z" />),
  chevron: svg(<path d="M9 6l6 6-6 6" />),
  spark: svg(<path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z" />),
  fork: svg(<path d="M6 3v7a2 2 0 002 2v9M10 3v7M14 3c3 0 4 3 4 7h-4v11" />, 18),
  calendar: svg(<path d="M4 5h16v15H4zM4 10h16M9 5v15M15 5v15" />, 18),
};

function Ring({ percent, tone }: { percent: number; tone: 'accent' | 'soft' | 'muted' }) {
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg className={`db-ring db-ring-${tone}`} width="76" height="76" viewBox="0 0 76 76" aria-hidden="true">
      <circle cx="38" cy="38" r={radius} className="track" />
      <circle cx="38" cy="38" r={radius} className="value" strokeDasharray={`${(Math.min(100, percent) / 100) * circumference} ${circumference}`} transform="rotate(-90 38 38)" />
      <text x="38" y="42" textAnchor="middle">{percent}%</text>
    </svg>
  );
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((value, index) => [(index / (values.length - 1)) * 300, 8 + (1 - (value - min) / span) * 54]);
  const line = points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const last = points[points.length - 1];
  return (
    <svg className="db-spark" viewBox="0 0 300 70" preserveAspectRatio="none" role="img" aria-label={t('progress.weightTrend')}>
      <defs><linearGradient id="db-spark-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5252" stopOpacity="0.35" /><stop offset="100%" stopColor="#ff5252" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,70 ${line} 300,70`} fill="url(#db-spark-fill)" />
      <polyline points={line} fill="none" stroke="#ff5252" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="4" fill="#ff5252" />
    </svg>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { locale } = useLocale();
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
      setProfile({ loading: false, error: profileResult.status === 'rejected' ? friendlyError(profileResult.reason, t('dashboard.widgetError')) : false, data: profileResult.status === 'fulfilled' ? profileResult.value : null });
      setPlan({ loading: false, error: planResult.status === 'rejected' ? friendlyError(planResult.reason, t('dashboard.widgetError')) : false, data: planResult.status === 'fulfilled' ? planResult.value : null });
      setNutrition({ loading: false, error: nutritionResult.status === 'rejected' ? friendlyError(nutritionResult.reason, t('dashboard.widgetError')) : false, data: nutritionResult.status === 'fulfilled' ? nutritionResult.value : null });
      setActivity({ loading: false, error: activityResult.status === 'rejected' ? friendlyError(activityResult.reason, t('dashboard.widgetError')) : false, data: activityResult.status === 'fulfilled' ? activityResult.value : null });
      setWeights({ loading: false, error: weightsResult.status === 'rejected' ? friendlyError(weightsResult.reason, t('dashboard.widgetError')) : false, data: weightsResult.status === 'fulfilled' ? weightsResult.value : null });
    });
  }, []);
  useEffect(() => { load(); }, [load]);

  const start = async (dayId: string) => {
    if (plan.data && workout.kind === 'start') {
      const dayIndex = plan.data.workout_plan_days.findIndex((day) => day.id === dayId);
      const scheduledWeekday = getScheduledWeekday(plan.data.workout_plan_days, dayIndex);
      const todayWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + 6) % 7];
      if (scheduledWeekday && requiresPastWorkoutConfirmation(plan.data.workout_plan_days, dayIndex) && !window.confirm(t('workout.pastDayConfirm', { today: t(`dashboard.${todayWeekday}`), day: t(`dashboard.${scheduledWeekday}`) }))) return;
    }
    setBusy(true); try { const session = await startWorkout(dayId); navigate(`/workout/session/${session.id}`); } finally { setBusy(false); }
  };

  const workout = plan.data ? selectTodaysWorkout(plan.data.workout_plan_days, activity.data?.sessions ?? []) : { kind: 'no-plan' as const };
  const selectedDay = plan.data && (workout.kind === 'start' || workout.kind === 'view') ? plan.data.workout_plan_days.find((day) => day.day_index === workout.dayIndex) : null;
  const todayNutrition = nutrition.data?.nutrition.find((entry) => entry.date === dateKey(new Date()));
  const counts = activity.data ? weeklySessionCounts(activity.data.sessions) : [];
  const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => t(`dashboard.${day}`));
  const goal = profile.data?.goal ? tEnum('goal', profile.data.goal) : '';
  const todayIndex = (new Date().getDay() + 6) % 7; // Monday = 0
  const dateLabel = useMemo(() => new Intl.DateTimeFormat(activeLocale(), { weekday: 'long', month: 'short', day: 'numeric' }).format(new Date()), []);
  const percent = activity.data ? completionRate(activity.data.sessions, profile.data?.days_per_week ?? 0) : 0;
  const sessionsDone = counts.reduce((sum, count) => sum + count, 0);
  const daysPerWeek = profile.data?.days_per_week ?? 0;

  // Hero details for the selected day
  const dayExercises = selectedDay ? [...selectedDay.workout_plan_exercises].sort((a, b) => a.position - b.position) : [];
  const workingSets = dayExercises.reduce((sum, item) => sum + item.sets, 0);

  // Nutrition
  const macros = (['calories', 'protein', 'carbs', 'fat'] as const).map((key, index) => {
    const value = Number(todayNutrition?.[key] ?? 0);
    const target = Number(nutrition.data?.targets?.[key] ?? 0);
    return { key, value: Math.round(value), target: Math.round(target), percent: target ? Math.min(100, Math.round((value / target) * 100)) : 0, unit: key === 'calories' ? 'kcal' : 'g', tone: (index === 0 ? 'accent' : index === 1 ? 'soft' : 'muted') as 'accent' | 'soft' | 'muted' };
  });
  const calories = macros[0];

  // Weight
  const latest = weights.data?.[0];
  const recent = (weights.data ?? []).slice(0, 7);
  const average = recent.length ? recent.reduce((sum, entry) => sum + entry.weight_kg, 0) / recent.length : null;
  const weightChange = weights.data ? sevenDayWeightChange(weights.data) : null;

  return <main className="page-content dashboard-page db">
    {/* ───────── Header ───────── */}
    <header className="db-header">
      <div>
        <p className="db-eyebrow"><i className="db-dot" /> {dateLabel}</p>
        <h1>{profile.loading ? t('dashboard.greetingFallback') : t('dashboard.greeting', { name: profile.data?.display_name || t('dashboard.friend') })}</h1>
        {profile.data && <p className="db-muted">{t('dashboard.goal', { goal })}</p>}
      </div>
      {profile.data && <aside className="db-card db-protocol">
        <div className="db-protocol-top"><span className="db-label">{t('dashboard.primaryProtocol')}</span><strong>{sessionsDone} / {daysPerWeek} {t('dashboard.sessions')}</strong></div>
        <div className="db-protocol-mid"><strong>{goal}</strong><span>{percent}%</span></div>
        <div className="db-bar"><span style={{ width: `${Math.min(100, percent)}%` }} /></div>
      </aside>}
    </header>

    {/* ───────── Today's workout ───────── */}
    <Panel state={plan} onRetry={load} className="db-hero">
      {workout.kind === 'resume' ? <div className="db-hero-body">
        <p className="db-eyebrow"><i className="db-dot" /> {t('dashboard.resumeLabel')}</p>
        <h2 className="db-hero-title">{t('dashboard.resumeTitle')}</h2>
        <div className="db-hero-actions"><button type="button" className="db-btn db-btn-primary" onClick={() => navigate(`/workout/session/${workout.session.id}`)} disabled={busy}>{Icon.play} {t('dashboard.resume')}</button></div>
      </div> : workout.kind === 'no-plan' ? <EmptyState title={t('dashboard.noPlanTitle')} description={t('dashboard.noPlanDescription')}><Link className="button button-secondary" to="/workout">{t('dashboard.goWorkout')}</Link></EmptyState> : selectedDay ? <div className="db-hero-body">
        <div className="db-hero-top">
          <div className="db-pills"><span className="db-pill db-pill-accent"><i className="db-dot" /> {t('dashboard.todayLabel')}</span><span className="db-pill">{tEnum('muscle', selectedDay.muscle_focus)}</span></div>
          <span className="db-est">{Icon.clock} {t('workout.minutes', { minutes: estimateDayMinutes(selectedDay) })}</span>
        </div>
        <div className="db-hero-main">
          <div>
            <h2 className="db-hero-title">{selectedDay.name}</h2>
            <p className="db-muted">{t('workout.exercises', { count: dayExercises.length })} · {t('workout.minutes', { minutes: estimateDayMinutes(selectedDay) })}</p>
          </div>
          <div className="db-hero-actions">
            <Link className="db-btn db-btn-ghost" to={`/workout/day/${selectedDay.id}`}>{Icon.eye} {t('dashboard.previewRoutine')}</Link>
            {workout.kind === 'start'
              ? <button type="button" className="db-btn db-btn-primary" onClick={() => void start(selectedDay.id)} disabled={busy}>{busy ? <Spinner /> : Icon.play} {t('dashboard.start')}</button>
              : <span className="db-muted">{t('workout.viewOnlyToday')}</span>}
          </div>
        </div>

        <dl className="db-stats">
          <div><dt>{Icon.clock} {t('dashboard.plannedDuration')}</dt><dd>{estimateDayMinutes(selectedDay)}<small>min</small></dd></div>
          <div><dt>{Icon.dumbbell} {t('dashboard.movements')}</dt><dd>{dayExercises.length}<small>{t('dashboard.drills')}</small></dd></div>
          <div><dt>{Icon.spark} {t('dashboard.workingSets')}</dt><dd>{workingSets}<small>{t('dashboard.sets')}</small></dd></div>
        </dl>

        <p className="db-label">{t('dashboard.sequenceBreakdown')}</p>
        <div className="db-sequence">
          {dayExercises.slice(0, 3).map((item, index) => {
            const localized = localizeWorkoutExercise(item.exercises, locale);
            return <div className="db-seq-item" key={item.id}>
              <span className="db-seq-num">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{localized?.name ?? t('workout.exerciseDetails')}</strong><small>{t('workout.setsReps', { sets: item.sets, repsMin: item.reps_min, repsMax: item.reps_max })}</small></span>
            </div>;
          })}
          {dayExercises.length > 3 && <Link className="db-seq-item db-seq-more" to={`/workout/day/${selectedDay.id}`}>
            <span className="db-seq-num">+{dayExercises.length - 3}</span>
            <span><strong>{t('dashboard.moreExercises')}</strong><small>{dayExercises.slice(3).reduce((sum, item) => sum + item.sets, 0)} {t('dashboard.cumulativeSets')}</small></span>
            {Icon.chevron}
          </Link>}
        </div>
      </div> : null}
    </Panel>

    {/* ───────── Nutrition ───────── */}
    <Panel state={nutrition} onRetry={load} className="db-nutrition">
      <div className="db-panel-head">
        <div>
          <h2>{Icon.fork} {t('dashboard.nutritionTitle')}</h2>
          {nutrition.data?.targets && <p className="db-muted"><strong>{calories.value.toLocaleString(locale)}</strong> / {calories.target.toLocaleString(locale)} kcal {t('dashboard.consumed')} · <span className="db-accent">{Math.max(0, calories.target - calories.value).toLocaleString(locale)} kcal</span> {t('dashboard.remainingToday')}</p>}
        </div>
        <Link className="db-btn db-btn-ghost" to="/nutrition">{Icon.plus} {t('dashboard.logMeal')}</Link>
      </div>
      {nutrition.data?.targets ? <div className="db-macros">
        {macros.map((macro) => <div className="db-macro" key={macro.key}>
          <Ring percent={macro.percent} tone={macro.tone} />
          <div><span className="db-label">{t(`nutrition.${macro.key}`)}</span><strong>{macro.value}{macro.unit === 'g' ? 'g' : ''}</strong><small>Target: {macro.target.toLocaleString(locale)} {macro.unit}</small></div>
        </div>)}
      </div> : <EmptyState title={t('dashboard.noTargetsTitle')} description={t('dashboard.noTargetsDescription')}><Link className="button button-secondary" to="/profile">{t('dashboard.goProfile')}</Link></EmptyState>}
    </Panel>

    {/* ───────── Weekly + weight/coach ───────── */}
    <div className="db-columns">
      <Panel state={activity} onRetry={load} className="db-week">
        <div className="db-panel-head"><h2>{Icon.calendar} {t('dashboard.activityTitle')}</h2></div>
        {counts.every((count) => count === 0) ? <EmptyState title={t('dashboard.noActivityTitle')} description={t('dashboard.noActivityDescription')} /> : <>
          <div className="db-days">
            {labels.map((label, index) => {
              const done = (counts[index] ?? 0) > 0;
              const today = index === todayIndex;
              return <div key={label} className={`db-day ${done ? 'done' : ''} ${today ? 'today' : ''}`}>
                <span>{label}</span>
                <i>{done ? Icon.check : today ? Icon.dumbbell : Icon.moon}</i>
                <small>{today ? t('dashboard.todayLabel') : done ? 'Done' : ''}</small>
              </div>;
            })}
          </div>
          <Suspense fallback={<Skeleton className="chart-skeleton" />}><ActivityChart counts={counts} labels={labels} /></Suspense>
        </>}
        <div className="db-week-stats">
          <div><span className="db-label">{t('dashboard.completed')}</span><strong>{sessionsDone} / {daysPerWeek}</strong></div>
          <div><span className="db-label">{t('progress.completionRate')}</span><strong className="db-accent">{percent}%</strong></div>
        </div>
      </Panel>

      <div className="db-side">
        <Panel state={weights} onRetry={load} className="db-weight">
          {latest ? <>
            <div className="db-panel-head"><span className="db-label">{t('dashboard.weightTitle')}</span></div>
            <div className="db-weight-top">
              <p className="db-weight-value">{latest.weight_kg}<small>kg</small></p>
              <span className="db-chip">{weightChange == null ? t('progress.notEnoughData') : `${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg ${t('progress.lastSevenDays')}`}</span>
            </div>
            <Sparkline values={[...recent].reverse().map((entry) => entry.weight_kg)} />
            {average != null && <p className="db-muted">7D avg: {average.toFixed(1)} kg</p>}
          </> : <EmptyState title={t('dashboard.noWeightTitle')} description={t('dashboard.noWeightDescription')}><Link className="button button-secondary" to="/progress">{t('dashboard.addWeight')}</Link></EmptyState>}
        </Panel>

        <section className="db-card db-coach">
          <p className="db-label">{Icon.spark} {t('dashboard.coachEyebrow')}</p>
          <h2>{t('dashboard.coachTitle')}</h2>
          <p className="db-muted">{t('dashboard.coachDescription')}</p>
          <Link className="db-btn db-btn-ghost" to="/ai-coach">{Icon.spark} {t('dashboard.openCoach')}</Link>
        </section>
      </div>
    </div>
  </main>;
}

function Panel<T>({ state, children, onRetry, className = '' }: { state: Widget<T>; children: ReactNode; onRetry: () => void; className?: string }) {
  return <section className={`db-card dashboard-widget ${className}`}>{state.loading ? <><Skeleton /><Skeleton /><Skeleton /></> : state.error ? <ErrorState message={state.error} onRetry={onRetry} /> : children}</section>;
}