import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { calculateDuration, calculateVolume } from '../../lib/workout-metrics';
import { t } from '../../i18n/en';
import { getHistory, type HistoryItem } from './workout';

const dateFormatter = new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' });

export function WorkoutHistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const load = useCallback(async (nextOffset = 0) => {
    setLoading(true); setError('');
    try { const result = await getHistory(10, nextOffset); setItems((current) => nextOffset === 0 ? result.items : [...current, ...result.items]); setTotal(result.total); setOffset(nextOffset); } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutHistory.loadError')); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  if (loading && items.length === 0) return <main className="page-content history-page"><Skeleton /><Skeleton /><Skeleton /></main>;
  if (error && items.length === 0) return <main className="page-content"><ErrorState onRetry={() => void load()} /><p className="alert" role="alert">{error}</p></main>;
  if (!loading && items.length === 0) return <main className="page-content"><EmptyState title={t('workoutHistory.emptyTitle')} description={t('workoutHistory.emptyDescription')}><Link className="button button-primary" to="/workout">{t('workoutHistory.goToPlan')}</Link></EmptyState></main>;
  return <main className="page-content history-page"><div className="page-heading"><div><p className="eyebrow">{t('navigation.workout')}</p><h1>{t('workoutHistory.title')}</h1><p className="muted">{t('workoutHistory.description')}</p></div></div>{error && <p className="alert" role="alert">{error}</p>}<p className="muted">{t('workoutHistory.showing', { shown: items.length, total })}</p><div className="history-list">{items.map((item) => { const bodyweight = item.sets.length === 0 || item.sets.every((set) => Number(set.weight_kg) === 0); return <Card key={item.id} className="history-card"><button className="history-toggle" onClick={() => setExpanded((current) => current === item.id ? null : item.id)} aria-expanded={expanded === item.id}><span><strong>{item.day?.name ?? t('workoutHistory.workout')}</strong><span className="muted">{dateFormatter.format(new Date(item.finished_at ?? item.started_at))}</span></span><span><strong>{calculateDuration(item.started_at, item.finished_at)} min</strong><span className="muted">{bodyweight ? `${item.sets.reduce((sum, set) => sum + set.reps, 0)} ${t('workoutHistory.reps')}` : `${calculateVolume(item.sets)} kg`}</span></span></button>{expanded === item.id && <div className="history-detail"><p>{t('workoutHistory.date')}: {dateFormatter.format(new Date(item.finished_at ?? item.started_at))}</p><p>{t('workoutHistory.setsCompleted')}: {item.sets.length}</p>{item.sets.map((set) => <p key={set.id}>{t('workoutHistory.setLine', { number: set.set_number, weight: set.weight_kg, reps: set.reps })}</p>)}</div>}</Card>; })}</div>{items.length < total && <Button variant="secondary" onClick={() => void load(offset + 10)} disabled={loading}>{t('workoutHistory.loadMore')}</Button>}</main>;
}
