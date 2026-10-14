import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';
import { activatePlan, estimateDayMinutes, generatePlan, getCurrentPlan, startWorkout, type WorkoutPlan } from './workout';

const label = (value: string) => value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

export function WorkoutPage() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<WorkoutPlan | null | undefined>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => { setError(''); void getCurrentPlan().then(setPlan).catch((reason: unknown) => setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.loadError')) : t('workout.loadError'))); }, []);
  useEffect(() => { load(); }, [load]);
  const generate = async () => { setBusy(true); setError(''); try { setPlan(await generatePlan()); } catch (reason) { setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.generationError')) : t('workout.generationError')); } finally { setBusy(false); } };
  const activate = async () => { if (!plan) return; setBusy(true); try { setPlan(await activatePlan(plan.id)); } catch (reason) { setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.generationError')) : t('workout.generationError')); } finally { setBusy(false); } };
  const start = async (dayId: string) => { setBusy(true); setError(''); try { const session = await startWorkout(dayId); navigate(`/workout/session/${session.id}`); } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutSession.startError')); } finally { setBusy(false); } };
  if (plan === undefined && !error) return <main className="page-content workout-page"><Skeleton className="workout-skeleton" /><Skeleton /><Skeleton /></main>;
  if (error && plan === undefined) return <main className="page-content"><ErrorState onRetry={load} /><p className="alert" role="alert">{error}</p></main>;
  if (!plan) return <main className="page-content"><EmptyState title={t('workout.emptyTitle')} description={t('workout.emptyDescription')}><Button onClick={generate} disabled={busy}>{busy && <Spinner />}{t('workout.generate')}</Button></EmptyState></main>;
  return <main className="page-content workout-page">
    <div className="page-heading"><div><p className="eyebrow">{plan.status === 'ACTIVE' ? t('workout.active') : t('workout.draft')}</p><h1>{plan.name}</h1><p className="muted">{t('workout.description')}</p></div></div>
    {error && <p className="alert" role="alert">{error}</p>}
    <Card className="workout-summary"><div><span className="muted">{t('workout.goal')}</span><strong>{label(plan.goal)}</strong></div><div><span className="muted">{t('workout.frequencyLabel')}</span><strong>{t('workout.frequencyValue', { days: plan.workout_plan_days.length })}</strong></div></Card>
    {plan.status === 'DRAFT' && <Card className="draft-banner"><div><strong>{t('workout.draft')}</strong></div><div className="workout-actions"><Button onClick={activate} disabled={busy}>{busy && <Spinner />}{t('workout.activate')}</Button><Button variant="secondary" onClick={generate} disabled={busy}>{t('workout.regenerate')}</Button></div></Card>}
    <h2>{t('workout.schedule')}</h2><div className="workout-days">{plan.workout_plan_days.map((day) => <Card key={day.id} className="workout-day-card"><div className="day-card-heading"><div><p className="eyebrow">{t('workout.day', { day: day.day_index })}</p><h3>{day.name}</h3></div><span className="badge">{label(day.muscle_focus)}</span></div><p className="muted">{t('workout.exercises', { count: day.workout_plan_exercises.length })} · {t('workout.minutes', { minutes: estimateDayMinutes(day) })}</p><div className="workout-actions"><Link className="button button-secondary" to={`/workout/day/${day.id}`}>{t('workout.viewWorkout')}</Link><Button onClick={() => void start(day.id)} disabled={busy}>{t('workoutSession.start')}</Button></div></Card>)}</div>
    {plan.status === 'ACTIVE' && <Button variant="secondary" onClick={() => navigate('/dashboard')}>{t('shell.backDashboard')}</Button>}
  </main>;
}
