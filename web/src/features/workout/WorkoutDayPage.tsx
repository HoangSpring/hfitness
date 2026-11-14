import { useCallback, useEffect, useState } from 'react';
import { Fragment } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { useLocale } from '../../i18n/LocaleContext';
import { friendlyError } from '../../lib/errors';
import { ExerciseVideo } from '../exercises/ExerciseMedia';
import { estimateDayMinutes, getPlanDay, localizeWorkoutExercise, startWorkout, type PlanDay } from './workout';
import './WorkoutDayPage.css';

const Icon = {
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>,
  play: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M7 4l13 8-13 8z" /></svg>,
  timer: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="13" r="8" /><path d="M12 9v4l2 2M9 2h6" /></svg>,
  list: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
  bolt: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true"><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></svg>,
  info: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>,
  chevron: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  dumbbell: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></svg>,
};

export function WorkoutDayPage() {
  const { dayId = '' } = useParams();
  const navigate = useNavigate();
  const { locale } = useLocale();
  const [day, setDay] = useState<PlanDay | null>();
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [starting, setStarting] = useState(false);
  const load = useCallback(() => { setError(''); setErrorCode(''); void getPlanDay(dayId, locale).then(setDay).catch((reason: unknown) => { setErrorCode(reason instanceof ApiRequestError ? reason.code : 'REQUEST_FAILED'); setError(reason instanceof ApiRequestError ? translatedError(reason.code, t('workout.loadError')) : t('workout.loadError')); }); }, [dayId, locale]);
  useEffect(() => { load(); }, [load]);

  if (errorCode === 'WORKOUT_DAY_NOT_FOUND') return <main className="page-content"><Card className="not-found"><h1>{t('workout.dayNotFoundTitle')}</h1><p className="muted">{t('workout.dayNotFoundDescription')}</p><Link className="button button-secondary" to="/workout">{t('workout.backToPlan')}</Link></Card></main>;
  if (error) return <main className="page-content"><ErrorState onRetry={load} /><p className="alert" role="alert">{error}</p></main>;
  if (day === undefined) return <main className="page-content"><Skeleton /><Skeleton /><Skeleton /></main>;
  if (!day) return <main className="page-content"><ErrorState /></main>;

  const start = async () => { setStarting(true); setError(''); try { const session = await startWorkout(day.id); navigate(`/workout/session/${session.id}`); } catch (reason) { setError(friendlyError(reason, reason instanceof Error ? reason.message : t('workoutSession.startError'))); } finally { setStarting(false); } };
  const exercises = [...day.workout_plan_exercises].sort((a, b) => a.position - b.position);

  const StartButton = ({ large = false }: { large?: boolean }) => (
    <button type="button" className={large ? 'wd-btn wd-btn-primary wd-btn-lg' : 'wd-btn wd-btn-primary'} onClick={() => void start()} disabled={starting}>
      {starting ? <Spinner /> : Icon.play} {t('workoutSession.start')}
    </button>
  );

  return <main className="page-content workout-day-detail wd">
    <nav className="wd-top"><Link className="wd-back" to="/workout">{Icon.back} {t('workout.backToPlan')}</Link></nav>

    {/* ───────── Heading ───────── */}
    <header className="wd-head">
      <div>
        <p className="wd-eyebrow"><i className="wd-dot" /> {t('workout.day', { day: day.day_index })}</p>
        <h1>{t('workout.day', { day: day.day_index })}: {day.name}</h1>
        <div className="wd-chips">
          <span>{Icon.timer} {t('workout.minutes', { minutes: estimateDayMinutes(day) })}</span>
          <span>{Icon.list} {t('workout.exercises', { count: exercises.length })}</span>
          <span>{Icon.bolt} {tEnum('muscle', day.muscle_focus)}</span>
        </div>
      </div>
      <StartButton large />
    </header>

    {error && <p className="alert" role="alert">{error}</p>}

    {/* ───────── Overview ───────── */}
    <section className="wd-card wd-overview">
      <span className="wd-icon-box">{Icon.info}</span>
      <div>
        <h2>{t('workout.sessionOverview')}</h2>
        <p className="wd-muted">{t('workout.focusWarmup', { muscle: tEnum('muscle', day.muscle_focus) })}</p>
      </div>
    </section>

    {/* ───────── Exercises ───────── */}
    <section className="wd-section">
      <div className="wd-section-head">
        <h2>{t('navigation.exercises')} <span className="wd-count">{t('workout.movements', { count: exercises.length })}</span></h2>
        <span className="wd-muted">{t('workout.prescribedOrder')}</span>
      </div>

      <div className="exercise-list wd-list">
        {exercises.map((exercise, index) => {
          const localized = localizeWorkoutExercise(exercise.exercises, locale);
          const imageUrl = localized?.image_url ?? localized?.image_urls?.[0] ?? null;
          const name = localized?.name ?? t('workout.exerciseDetails');
          const row = (
            <>
              <span className="wd-index">{String(index + 1).padStart(2, '0')}</span>
              <span className="wd-thumb">{imageUrl ? <img src={imageUrl} alt={name} loading="lazy" /> : Icon.dumbbell}</span>
              <div className="wd-main">
                <h3>{name}</h3>
                <div className="wd-tags">
                  {localized?.primary_muscle && <span className="wd-tag">{localized.primary_muscle}</span>}
                  {exercise.notes && <span className="wd-note">{exercise.notes}</span>}
                </div>
              </div>
              <div className="wd-meta">
                <span className="wd-meta-label">{t('workout.volume')}</span>
                <strong>{t('workout.setsReps', { sets: exercise.sets, repsMin: exercise.reps_min, repsMax: exercise.reps_max })}</strong>
              </div>
              <div className="wd-meta">
                <span className="wd-meta-label">{t('workout.restLabel')}</span>
                <strong className="wd-rest">{Icon.timer} {t('workout.rest', { seconds: exercise.rest_seconds })}</strong>
              </div>
              <span className="wd-chevron">{Icon.chevron}</span>
            </>
          );
          return (
            <Fragment key={exercise.id}>
              {localized?.slug
                ? <Link className="wd-row" to={`/exercises/${localized.slug}`}>{row}</Link>
                : <div className="wd-row">{row}</div>}
              {localized?.video_url && (
                <div className="wd-video">
                  <ExerciseVideo name={name} videoUrl={localized.video_url} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </section>

    {/* ───────── Footer CTA ───────── */}
    <section className="wd-card wd-cta">
      <span className="wd-icon-box wd-icon-accent">{Icon.dumbbell}</span>
      <div className="wd-cta-text">
        <h2>{t('workout.readyToBegin')}</h2>
        <p className="wd-muted">{t('workout.readyDescription')}</p>
      </div>
      <StartButton large />
    </section>
  </main>;
}