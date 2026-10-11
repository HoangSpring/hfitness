import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Input, Skeleton } from '../../components/ui';
import { exerciseDifficulties, exerciseEquipment, exerciseMuscles } from '../../lib/constants/exercise';
import { t } from '../../i18n/en';
import { exercisePageSize, getExercises, type Exercise } from './exercise';

function label(value: string) { return value.replace('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()); }

export function ExerciseLibraryPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const searchParam = params.get('q') ?? '';
  const [search, setSearch] = useState(searchParam);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const muscle = params.get('muscle') ?? '';
  const equipment = params.get('equipment') ?? '';
  const difficulty = params.get('difficulty') ?? '';

  useEffect(() => setSearch(searchParam), [searchParam]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== searchParam) {
        const next = new URLSearchParams(location.search);
        if (search) next.set('q', search); else next.delete('q');
        next.delete('page');
        navigate({ search: next.toString() }, { replace: true });
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [location.search, navigate, search, searchParam]);
  useEffect(() => {
    setLoading(true); setError(false);
    void getExercises({ search: searchParam, muscle, equipment, difficulty, page })
      .then((result) => { setExercises(result.exercises); setCount(result.count); })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [difficulty, equipment, muscle, page, retryKey, searchParam]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(location.search);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    navigate({ search: next.toString() });
  };
  const clear = () => { setSearch(''); navigate('/exercises'); };
  const totalPages = Math.ceil(count / exercisePageSize);
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(location.search);
    if (nextPage) next.set('page', String(nextPage)); else next.delete('page');
    navigate({ search: next.toString() });
  };

  return <main className="page-content exercise-page">
    <div className="page-heading"><div><p className="eyebrow">{t('navigation.exercises')}</p><h1>{t('exercises.title')}</h1><p className="muted">{t('exercises.description')}</p></div></div>
    <Card className="exercise-filters">
      <label className="exercise-search"><span className="sr-only">{t('exercises.search')}</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('exercises.searchPlaceholder')} /></label>
      <label><span>{t('exercises.muscle')}</span><select value={muscle} onChange={(event) => updateFilter('muscle', event.target.value)}><option value="">{t('exercises.allMuscles')}</option>{exerciseMuscles.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label><span>{t('exercises.equipment')}</span><select value={equipment} onChange={(event) => updateFilter('equipment', event.target.value)}><option value="">{t('exercises.allEquipment')}</option>{exerciseEquipment.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
      <label><span>{t('exercises.difficulty')}</span><select value={difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">{t('exercises.allDifficulties')}</option>{exerciseDifficulties.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label>
    </Card>
    {loading ? <div className="exercise-grid">{Array.from({ length: 6 }, (_, index) => <Card key={index} className="exercise-card"><Skeleton className="exercise-image" /><Skeleton /><Skeleton className="short-skeleton" /></Card>)}</div>
      : error ? <ErrorState onRetry={() => setRetryKey((value) => value + 1)} />
        : exercises.length === 0 ? <EmptyState title={t('exercises.noResults')} description={t('exercises.clearFilters')}><Button variant="secondary" onClick={clear}>{t('exercises.clearFilters')}</Button></EmptyState>
          : <><p className="exercise-count">{t('exercises.showing', { from: page * exercisePageSize + 1, to: Math.min((page + 1) * exercisePageSize, count), total: count })}</p><div className="exercise-grid">{exercises.map((exercise) => <Link to={`/exercises/${exercise.slug}`} key={exercise.id} className="exercise-card card"><div className="exercise-image exercise-placeholder" aria-label={t('exercises.placeholder')}>HF</div><h2>{exercise.name}</h2><p className="muted">{label(exercise.primary_muscle)} · {label(exercise.equipment)}</p><span className="difficulty-badge">{label(exercise.difficulty)}</span></Link>)}</div><div className="pagination"><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>{t('exercises.previous')}</Button><span>{page + 1} / {Math.max(1, totalPages)}</span><Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>{t('exercises.next')}</Button></div></>}
  </main>;
}
