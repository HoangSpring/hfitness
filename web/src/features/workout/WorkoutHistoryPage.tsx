import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { calculateDuration, calculateVolume } from '../../lib/workout-metrics';
import { t } from '../../i18n/en';
import { friendlyError } from '../../lib/errors';
import { activeLocale } from '../../i18n/format';
import { getHistory, startWorkout, type HistoryItem } from './workout';
import './WorkoutHistoryPage.css';

type HistorySet = HistoryItem['sets'][number];
type ExerciseGroup = { key: string; name: string; sets: HistorySet[] };

/**
 * Group sets by exercise. Field names are a best guess — adjust to your real data:
 * the exercise id/name may live on the set itself or on a nested relation.
 */
function groupSets(sets: HistorySet[]): ExerciseGroup[] {
  const groups = new Map<string, ExerciseGroup>();
  [...sets]
    .sort((a, b) => a.set_number - b.set_number)
    .forEach((set) => {
      const s = set as unknown as Record<string, unknown> & { exercises?: { name?: string }; exercise?: { name?: string } };
      const key = String(s.exercise_id ?? s.workout_plan_exercise_id ?? s.exercise_name ?? 'all');
      const name = String(s.exercise_name ?? s.exercises?.name ?? s.exercise?.name ?? t('workoutHistory.setsCompleted'));
      const group = groups.get(key) ?? { key, name, sets: [] };
      group.sets.push(set);
      groups.set(key, group);
    });
  return [...groups.values()];
}

const Icon = {
  chevronDown: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>,
  chevronRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>,
  chevronUp: <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>,
  dumbbell: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></svg>,
  repeat: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" /></svg>,
};

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="wh-metric"><span>{label}</span><strong>{value}</strong></div>;
}

export function WorkoutHistoryPage() {
  const navigate = useNavigate();
  const locale = activeLocale();
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }), [locale]);
  const fullFormatter = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), [locale]);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined); // undefined = auto-open the latest session
  const [offset, setOffset] = useState(0);
  const [repeating, setRepeating] = useState(false);

  const load = useCallback(async (nextOffset = 0) => {
    setLoading(true); setError('');
    try { const result = await getHistory(10, nextOffset); setItems((current) => nextOffset === 0 ? result.items : [...current, ...result.items]); setTotal(result.total); setOffset(nextOffset); } catch (reason) { setError(friendlyError(reason, reason instanceof Error ? reason.message : t('workoutHistory.loadError'))); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const repeat = async (item: HistoryItem) => {
    const dayId = (item as unknown as { day_id?: string }).day_id ?? (item.day as unknown as { id?: string } | null)?.id;
    if (!dayId) return;
    setRepeating(true); setError('');
    try { const session = await startWorkout(dayId); navigate(`/workout/session/${session.id}`); } catch (reason) { setError(friendlyError(reason, reason instanceof Error ? reason.message : t('workoutSession.startError'))); } finally { setRepeating(false); }
  };

  if (loading && items.length === 0) return <main className="page-content history-page"><Skeleton /><Skeleton /><Skeleton /></main>;
  if (error && items.length === 0) return <main className="page-content"><ErrorState onRetry={() => void load()} /><p className="alert" role="alert">{error}</p></main>;
  if (!loading && items.length === 0) return <main className="page-content"><EmptyState title={t('workoutHistory.emptyTitle')} description={t('workoutHistory.emptyDescription')}><Link className="button button-primary" to="/workout">{t('workoutHistory.goToPlan')}</Link></EmptyState></main>;

  const openId = expanded === undefined ? items[0]?.id ?? null : expanded;

  return <main className="page-content history-page wh">
    <header className="wh-head">
      <p className="wh-breadcrumb">{t('navigation.workout')} <span aria-hidden="true">›</span> <strong>Log archive</strong></p>
      <h1>{t('workoutHistory.title')}</h1>
      <p className="wh-muted">{t('workoutHistory.description')}</p>
    </header>

    {error && <p className="alert" role="alert">{error}</p>}

    <div className="history-list wh-list">
      {items.map((item, index) => {
        const open = openId === item.id;
        const endTime = item.finished_at ?? item.started_at;
        const minutes = calculateDuration(item.started_at, item.finished_at);
        const bodyweight = item.sets.length === 0 || item.sets.every((set) => Number(set.weight_kg) === 0);
        const volumeLabel = bodyweight ? `${item.sets.reduce((sum, set) => sum + set.reps, 0)} ${t('workoutHistory.reps')}` : `${calculateVolume(item.sets).toLocaleString(locale)} kg`;
        const groups = groupSets(item.sets);
        const seconds = item.finished_at ? Math.max(0, Math.round((new Date(item.finished_at).getTime() - new Date(item.started_at).getTime()) / 1000)) : 0;

        return <article key={item.id} className={open ? 'wh-card open' : 'wh-card'}>
          <button type="button" className="history-toggle wh-toggle" onClick={() => setExpanded(open ? null : item.id)} aria-expanded={open}>
            <span className="wh-icon">{Icon.dumbbell}</span>
            <span className="wh-title">
              <small>{dateFormatter.format(new Date(endTime))}{index === 0 && <em className="wh-latest">{t('workoutHistory.latest')}</em>}</small>
              <strong>{item.day?.name ?? t('workoutHistory.workout')}</strong>
            </span>
            <span className="wh-summary">
              <Metric label={t('workoutHistory.duration')} value={`${minutes} ${t('workoutHistory.minutes')}`} />
              <Metric label={t('workoutHistory.totalVolumeLabel')} value={volumeLabel} />
              <Metric label={t('workoutHistory.completedLabel')} value={t('workoutHistory.exercisesCount', { count: groups.length })} />
            </span>
            <span className="wh-chevron">{open ? Icon.chevronUp : Icon.chevronRight}</span>
          </button>

          {open && <div className="history-detail wh-detail">
            <div className="wh-overview">
              <Metric label={t('workoutHistory.loggedTimestamp')} value={fullFormatter.format(new Date(endTime))} />
              <Metric label={t('workoutHistory.preciseTime')} value={`${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, '0')}s`} />
              <Metric label={t('workoutHistory.sessionLoad')} value={volumeLabel} />
              <div className="wh-metric wh-metric-accent"><span>{t('workoutHistory.accumulatedEffort')}</span><strong>{t('workoutHistory.setsCompleted', { count: item.sets.length })}</strong></div>
            </div>

            <div className="wh-log-head"><span>{t('workoutHistory.performanceLog')}</span><span>{t('workoutHistory.readOnly')}</span></div>

            {groups.map((group, groupIndex) => <section className="wh-exercise" key={group.key}>
              <div className="wh-exercise-head"><h3>{groupIndex + 1}. {group.name}</h3><span>{group.sets.length} {t('workoutHistory.sets')}</span></div>
              <div className="wh-sets">
                {group.sets.map((set) => <div className="wh-set" key={set.id}><span>Set {set.set_number}</span><strong>{set.weight_kg} kg × {set.reps}</strong></div>)}
              </div>
            </section>)}

            <div className="wh-detail-foot">
              <button type="button" className="wh-close" onClick={() => setExpanded(null)}>{Icon.chevronUp} Close detail</button>
              <button type="button" className="wh-repeat" onClick={() => void repeat(item)} disabled={repeating}>{repeating ? <Spinner /> : Icon.repeat} Repeat this workout</button>
            </div>
          </div>}
        </article>;
      })}
    </div>

    <footer className="wh-more">
      {items.length < total && <button type="button" className="wh-more-btn" onClick={() => void load(offset + 10)} disabled={loading}>{loading ? <Spinner /> : Icon.repeat} {t('workoutHistory.loadMore')}</button>}
      <p className="wh-muted">{t('workoutHistory.showing', { shown: items.length, total })}</p>
    </footer>
  </main>;
}