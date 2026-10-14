import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Card, ErrorState, Skeleton } from '../../components/ui';
import { ApiRequestError } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';
import { estimateDayMinutes, getPlanDay, type PlanDay } from './workout';

export function WorkoutDayPage() {
  const { dayId = '' } = useParams();
  const [day, setDay] = useState<PlanDay | null>();
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const load = useCallback(() => { setError(''); setErrorCode(''); void getPlanDay(dayId).then(setDay).catch((reason: unknown) => { setErrorCode(reason instanceof ApiRequestError ? reason.code : 'REQUEST_FAILED'); setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.loadError')) : t('workout.loadError')); }); }, [dayId]);
  useEffect(() => { load(); }, [load]);
  if (errorCode === 'WORKOUT_DAY_NOT_FOUND') return <main className="page-content"><Card className="not-found"><h1>{t('workout.dayNotFoundTitle')}</h1><p className="muted">{t('workout.dayNotFoundDescription')}</p><Link className="button button-secondary" to="/workout">{t('workout.backToPlan')}</Link></Card></main>;
  if (error) return <main className="page-content"><ErrorState onRetry={load} /><p className="alert" role="alert">{error}</p></main>;
  if (day === undefined) return <main className="page-content"><Skeleton /><Skeleton /><Skeleton /></main>;
  if (!day) return <main className="page-content"><ErrorState /></main>;
  return <main className="page-content workout-day-detail"><Link className="back-link" to="/workout">← {t('navigation.workout')}</Link><p className="eyebrow">{t('workout.day', { day: day.day_index })}</p><h1>{day.name}</h1><p className="muted">{day.muscle_focus}</p><p className="day-duration">{t('workout.duration', { minutes: estimateDayMinutes(day) })}</p><div className="exercise-list">{[...day.workout_plan_exercises].sort((a, b) => a.position - b.position).map((exercise) => <Card key={exercise.id}><div className="day-card-heading"><div><h2>{exercise.exercises ? <Link to={`/exercises/${exercise.exercises.slug}`}>{exercise.exercises.name}</Link> : t('workout.exerciseDetails')}</h2><p className="muted">{exercise.exercises?.primary_muscle && `${exercise.exercises.primary_muscle} · `}{t('workout.setsReps', { sets: exercise.sets, repsMin: exercise.reps_min, repsMax: exercise.reps_max })}</p></div><span className="badge">{t('workout.rest', { seconds: exercise.rest_seconds })}</span></div>{exercise.notes && <p className="muted">{exercise.notes}</p>}</Card>)}</div></main>;
}
