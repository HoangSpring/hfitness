import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { useLocale } from '../../i18n/LocaleContext';
import { friendlyError } from '../../lib/errors';
import { activatePlan, estimateDayMinutes, generatePlan, getCurrentPlan, getScheduledWeekday, getWeeklySchedule, getWorkoutDayState, requiresPastWorkoutConfirmation, skipWorkoutDay, startWorkout, type WorkoutPlan } from './workout';
import './WorkoutPage.css';

type PlanDay = WorkoutPlan['workout_plan_days'][number];

/** Best-effort exercise name: adjust to match your real data shape. */
function exerciseName(exercise: unknown): string {
  const e = exercise as Record<string, unknown> & { exercises?: { name?: string }; exercise?: { name?: string } };
  return String(e.exercise_name ?? e.name ?? e.exercises?.name ?? e.exercise?.name ?? '—');
}

function formatTotal(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours ? `${hours} hrs ${rest} min` : `${rest} min`;
}

const Icon = {
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>,
  check: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>,
  refresh: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>,
  spark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7z" /></svg>,
};

export function WorkoutPage() {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [plan, setPlan] = useState<WorkoutPlan | null | undefined>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError('');
    void getCurrentPlan(locale)
      .then(setPlan)
      .catch((reason: unknown) => {
        setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.loadError')) : friendlyError(reason, t('workout.loadError')));
      });
  }, [locale]);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      setPlan(await generatePlan(locale));
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.generationError')) : friendlyError(reason, t('workout.generationError')));
    } finally {
      setBusy(false);
    }
  };

  const activate = async () => {
    if (!plan) return;
    setBusy(true);
    try {
      setPlan(await activatePlan(plan.id));
    } catch (reason) {
      setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.generationError')) : friendlyError(reason, t('workout.generationError')));
    } finally {
      setBusy(false);
    }
  };

  const start = async (dayId: string, dayIndex: number) => {
    const scheduledWeekday = getScheduledWeekday(days, dayIndex);
    if (requiresPastWorkoutConfirmation(days, dayIndex) && scheduledWeekday && !window.confirm(t('workout.pastDayConfirm', { today: t(`workout.${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][(new Date().getDay() + 6) % 7]}`), day: t(`workout.${scheduledWeekday}`) }))) return;
    setBusy(true);
    setError('');
    try {
      const session = await startWorkout(dayId);
      navigate(`/workout/session/${session.id}`);
    } catch (reason) {
      setError(friendlyError(reason, reason instanceof Error ? reason.message : t('workoutSession.startError')));
    } finally {
      setBusy(false);
    }
  };

  const skip = async (dayId: string) => {
    if (!window.confirm(t('workout.skipConfirm'))) return;
    setBusy(true);
    setError('');
    try {
      await skipWorkoutDay(dayId);
      setPlan(await getCurrentPlan(locale));
    } catch (reason) {
      setError(friendlyError(reason, t('workout.skipError')));
    } finally {
      setBusy(false);
    }
  };

  if (plan === undefined && !error) return <main className="page-content workout-page"><Skeleton className="workout-skeleton" /><Skeleton /><Skeleton /></main>;
  if (error && plan === undefined) return <main className="page-content"><ErrorState onRetry={load} /><p className="alert" role="alert">{error}</p></main>;
  if (!plan) return <main className="page-content"><EmptyState title={t('workout.emptyTitle')} description={t('workout.emptyDescription')}><Button onClick={generate} disabled={busy}>{busy && <Spinner />}{t('workout.generate')}</Button></EmptyState></main>;

  const days: PlanDay[] = plan.workout_plan_days;
  const weeklySchedule = getWeeklySchedule(days);
  const nextDay = days.find((day, index) => getWorkoutDayState(days, index) === 'up_next');
  const nextDayIndex = nextDay ? days.indexOf(nextDay) : -1;
  const isCatchUp = nextDayIndex >= 0 && requiresPastWorkoutConfirmation(days, nextDayIndex);
  const waitingForTomorrow = !nextDay && days.some((day) => day.progress?.status === 'COMPLETED');
  const totalMinutes = days.reduce((sum, day) => sum + estimateDayMinutes(day), 0);
  const averageMinutes = days.length ? Math.round(totalMinutes / days.length) : 0;
  const isDraft = plan.status === 'DRAFT';

  return <main className="page-content workout-page wk">
    {/* ───────── Draft banner ───────── */}
    {isDraft && <section className="wk-card wk-draft">
      <span className="wk-draft-icon">{Icon.spark}</span>
      <div className="wk-draft-text">
        <h2>{t('workout.draftReady')} <span className="wk-pill wk-pill-accent">{t('workout.draft')}</span></h2>
        <p className="wk-muted">{t('workout.draftDescription')}</p>
      </div>
      <div className="wk-actions">
        <button type="button" className="wk-btn wk-btn-ghost" onClick={generate} disabled={busy}>{Icon.refresh} {t('workout.regenerate')}</button>
        <button type="button" className="wk-btn wk-btn-primary" onClick={activate} disabled={busy}>{busy ? <Spinner /> : Icon.check} {t('workout.reviewActivate')}</button>
      </div>
    </section>}

    {error && <p className="alert" role="alert">{error}</p>}

    {/* ───────── Heading ───────── */}
    <header className="wk-heading">
      <p className="wk-eyebrow">{t('workout.trainingProgram')}</p>
      <h1>{t('workout.title')}</h1>
      <p className="wk-lead">{t('workout.description')}</p>
    </header>

    {/* ───────── Plan summary ───────── */}
    <section className="wk-card wk-summary">
      <div className="wk-summary-top">
        <div>
          <div className="wk-pills">
            <span className="wk-pill">{Icon.spark} {t('workout.generatedByAi')}</span>
            <span className="wk-pill">{tEnum('goal', plan.goal)}</span>
            <span className="wk-pill">{t('workout.frequencyValue', { days: days.length })}</span>
          </div>
          <h2 className="wk-plan-name">{plan.name}</h2>
        </div>
        <div className="wk-summary-actions">
          {nextDay
            ? <button type="button" className="wk-btn wk-btn-primary" onClick={() => void start(nextDay.id, nextDayIndex)} disabled={busy}>{Icon.play} {t(isCatchUp ? 'workout.startCatchUp' : 'workout.startToday')}</button>
            : <span className="wk-pill wk-pill-accent">{waitingForTomorrow ? t('workout.nextDayTomorrow') : t('workout.allDaysComplete')}</span>}
          <Link className="wk-btn wk-btn-ghost" to="/workout/history">{t('workout.viewHistory')}</Link>
        </div>
      </div>
      <dl className="wk-stats">
        <div><dt>{t('workout.weeklyTime')}</dt><dd>{formatTotal(totalMinutes)}</dd><span>{t('workout.minutesPerSession', { minutes: averageMinutes })}</span></div>
        <div><dt>{t('workout.goal')}</dt><dd>{tEnum('goal', plan.goal)}</dd><span>{t('workout.personalisedByAi')}</span></div>
        <div><dt>{t('workout.frequencyLabel')}</dt><dd>{t('workout.frequencyValue', { days: days.length })}</dd><span>{t('workout.plannedWorkoutDays')}</span></div>
      </dl>
    </section>

    {/* ───────── Weekly schedule ───────── */}
    <section className="wk-section">
      <div className="wk-section-head">
        <div><h2>{t('workout.schedule')}</h2><p className="wk-muted">{t('workout.cycleDescription', { days: days.length })}</p></div>
        <span className="wk-legend"><i className="wk-dot" /> {t('workout.nextWorkoutHighlighted')}</span>
      </div>

      <div className="wk-days">
        {weeklySchedule.map(({ weekday, day }) => {
          if (!day) {
            return <article key={weekday} className="wk-day wk-rest-day">
              <div className="wk-day-top"><span className="wk-day-state">{t('workout.restDay')}</span></div>
              <p className="wk-day-label">{t(`workout.${weekday}`)}</p>
              <h3>{t('workout.restDay')}</h3>
              <p className="wk-muted">{t('workout.restDayDescription')}</p>
            </article>;
          }
          const index = days.indexOf(day);
          const state = getWorkoutDayState(days, index);
          const next = state === 'up_next';
          const exercises = day.workout_plan_exercises;
          return <article key={day.id} className={`wk-day ${next ? 'wk-day-next' : ''} wk-day-${state}`}>
            <div className="wk-day-top">
              <span className={next ? 'wk-pill wk-pill-accent' : 'wk-day-state'}>
                {state === 'completed' ? t('workout.completed') : state === 'skipped' ? t('workout.skipped') : state === 'locked' ? t('workout.nextDayTomorrow') : next ? t('workout.upNext') : t('workout.upcoming')}
              </span>
              <span className="wk-minutes">{t('workout.minutes', { minutes: estimateDayMinutes(day) })}</span>
            </div>
            <p className="wk-day-label">{t('workout.day', { day: day.day_index })}</p>
            <h3>{day.name}</h3>
            <p className="wk-muted">{t('workout.exercises', { count: exercises.length })} · {tEnum('muscle', day.muscle_focus)}</p>

            <ul className="wk-preview">
              {exercises.slice(0, 3).map((exercise, i) => <li key={i}><i className="wk-dot wk-dot-sm" />{exerciseName(exercise)}</li>)}
              {exercises.length > 3 && <li className="wk-more">+{exercises.length - 3} more</li>}
            </ul>

            <div className="wk-day-actions">
              {next && <button type="button" className="wk-btn wk-btn-primary wk-btn-block" onClick={() => void start(day.id, index)} disabled={busy}>{Icon.play} {t(isCatchUp ? 'workout.startCatchUp' : 'workoutSession.start')}</button>}
              {next && <button type="button" className="wk-btn wk-btn-ghost wk-btn-block" onClick={() => void skip(day.id)} disabled={busy}>{t('workout.skipToday')}</button>}
              <Link className="wk-link" to={`/workout/day/${day.id}`}>{t('workout.viewWorkout')}</Link>
            </div>
          </article>;
        })}
      </div>
    </section>

    {plan.status === 'ACTIVE' && <Button variant="secondary" onClick={() => navigate('/dashboard')}>{t('shell.backDashboard')}</Button>}
  </main>;
}