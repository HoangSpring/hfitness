import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Card, ErrorState, Skeleton } from '../../components/ui';
import { t } from '../../i18n/en';
import { useLocale } from '../../i18n/LocaleContext';
import { friendlyError } from '../../lib/errors';
import { useAuth } from '../auth/useAuth';
import { getExercise, type Exercise } from './exercise';
import { ExerciseFrameViewer, ExerciseVideo } from './ExerciseMedia';

function label(value: string) { return value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function ExerciseDetailPage() {
  const { slug = '' } = useParams();
  const { user } = useAuth();
  const { locale } = useLocale();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<Exercise | null | undefined>();
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t('exercises.loadError'));
  useEffect(() => { setError(false); void getExercise(slug, locale).then(setExercise).catch((reason) => { setErrorMessage(friendlyError(reason, t('exercises.loadError'))); setError(true); }); }, [slug, locale]);
  if (error) return <main className="page-content"><ErrorState message={errorMessage} onRetry={() => navigate(0)} /></main>;
  if (exercise === undefined) return <main className="page-content detail-page"><Skeleton className="detail-placeholder" /><Skeleton /><Skeleton /></main>;
  if (!exercise) return <main className="page-content"><Card className="not-found"><h1>{t('exercises.notFound')}</h1><p className="muted">{t('exercises.notFoundDescription')}</p><Link className="button button-secondary" to="/exercises">{t('exercises.backToLibrary')}</Link></Card></main>;
  return <main className="page-content detail-page">
    <Link className="back-link" to="/exercises">← {t('exercises.backToLibrary')}</Link>
    <div className="detail-hero"><ExerciseFrameViewer name={exercise.name} imageUrl={exercise.image_url} imageUrls={exercise.image_urls} /><div><p className="eyebrow">{label(exercise.primary_muscle)}</p><h1>{exercise.name}</h1><p className="muted">{exercise.description}</p><div className="exercise-meta"><span>{label(exercise.equipment)}</span><span>{label(exercise.difficulty)}</span></div></div></div>
    <div className="detail-grid"><Card><h2>{t('exercises.instructions')}</h2><ol className="instructions">{exercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}</ol></Card><Card><h2>{t('exercises.safety')}</h2><p className="muted">{exercise.safety_notes}</p></Card></div>
    <ExerciseVideo name={exercise.name} videoUrl={exercise.video_url} />
    <Link className="button button-primary detail-cta" to={user ? '/exercises' : '/register'}>{user ? t('exercises.backToLibrary') : t('exercises.getStarted')}</Link>
  </main>;
}
