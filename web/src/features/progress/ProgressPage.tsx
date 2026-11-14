import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button, EmptyState, ErrorState, Field, Input, Skeleton, Spinner } from '../../components/ui';
import { dateKey } from '../../lib/nutrition';
import { completionRate, sevenDayNutritionAverage, sevenDayWeightChange, weeklySessionCounts, weeklyVolumeOrReps } from '../../lib/progress-metrics';
import { t } from '../../i18n/en';
import { friendlyError } from '../../lib/errors';
import { activeLocale } from '../../i18n/format';
import { deleteWeight, getProgressData, saveWeight, type ProgressData } from './progress';
import './ProgressPage.css';

const ProgressChart = lazy(() => import('./ProgressChart').then((module) => ({ default: module.ProgressChart })));
const weightSchema = z.object({ date: z.string().min(1), weight: z.coerce.number().min(20).max(400) });

const parseDay = (value: string) => new Date(`${value}T00:00:00`);
const signed = (value: number, digits = 1) => `${value > 0 ? '+' : ''}${value.toFixed(digits)}`;

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" />
    </svg>
  );
}

function ProgressBar({ percent, soft = false }: { percent: number; soft?: boolean }) {
  return (
    <div className={soft ? 'pg-bar pg-bar-soft' : 'pg-bar'} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)}>
      <span style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
    </div>
  );
}

export function ProgressPage() {
  const active = activeLocale();
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(active, { month: 'short', day: 'numeric' }), [active]);
  const dayFormatter = useMemo(() => new Intl.DateTimeFormat(active, { weekday: 'short' }), [active]);
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t('progress.loadError'));
  const [range, setRange] = useState(30);
  const [date, setDate] = useState(dateKey(new Date()));
  const [weight, setWeight] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setData(await getProgressData()); } catch (reason) { setErrorMessage(friendlyError(reason, t('progress.loadError'))); setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  // Weight entries newest → oldest
  const sortedWeights = useMemo(() => (data ? [...data.weights].sort((a, b) => b.logged_on.localeCompare(a.logged_on)) : []), [data]);

  // Entries inside the selected range, oldest → newest
  const rangeEntries = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return sortedWeights.filter((entry) => parseDay(entry.logged_on) >= cutoff).reverse();
  }, [sortedWeights, range]);

  const weightChart = useMemo(
    () => rangeEntries.map((entry) => ({ date: dateFormatter.format(parseDay(entry.logged_on)), weight: entry.weight_kg })),
    [rangeEntries, dateFormatter],
  );

  const latest = sortedWeights[0];
  const start = rangeEntries[0];
  const rangeChange = latest && start && rangeEntries.length > 1 ? latest.weight_kg - start.weight_kg : null;
  const weighInsPerWeek = rangeEntries.length / (range / 7);
  const sevenChange = data ? sevenDayWeightChange(data.weights) : null;
  const average = data ? sevenDayNutritionAverage(data.nutrition) : null;
  const weeklyCounts = data ? weeklySessionCounts(data.sessions) : [];
  const volume = data ? weeklyVolumeOrReps(data.sessions, data.sets) : null;

  const addWeight = async (event: FormEvent) => {
    event.preventDefault(); setFormError('');
    const valid = weightSchema.safeParse({ date, weight });
    if (!valid.success || valid.data.date > dateKey(new Date())) { setFormError(t('progress.invalidWeight')); return; }
    setSaving(true);
    try { await saveWeight(valid.data.date, valid.data.weight); setWeight(''); setShowForm(false); await load(); } catch (reason) { setFormError(friendlyError(reason, t('progress.saveWeightError'))); } finally { setSaving(false); }
  };
  const removeWeight = async (id: string) => {
    if (!window.confirm(t('progress.deleteWeightConfirm'))) return;
    try { await deleteWeight(id); setData((current) => current ? { ...current, weights: current.weights.filter((entry) => entry.id !== id) } : current); } catch (reason) { setFormError(friendlyError(reason, t('progress.deleteWeightError'))); }
  };

  if (loading) return <main className="page-content progress-page"><Skeleton className="progress-skeleton" /><Skeleton className="progress-skeleton" /><Skeleton className="progress-skeleton" /></main>;
  if (error || !data) return <main className="page-content"><ErrorState message={errorMessage} onRetry={() => void load()} /></main>;

  const todayKey = dateKey(new Date());
  const latestLabel = latest ? `${latest.logged_on === todayKey ? 'Today, ' : ''}${dateFormatter.format(parseDay(latest.logged_on))}` : '';

  // Workouts
  const target = data.profile.days_per_week;
  const sessionsThisWeek = weeklyCounts.reduce((sum, count) => sum + count, 0);
  const sessionPercent = target ? (sessionsThisWeek / target) * 100 : 0;
  const remaining = Math.max(0, target - sessionsThisWeek);
  const rate = completionRate(data.sessions, target);
  const barMax = Math.max(target, ...weeklyCounts, 1);

  // Nutrition: last 7 days (oldest → today)
  const last7 = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return { key: dateKey(day), label: dayFormatter.format(day).toUpperCase().slice(0, 3), isToday: index === 6 };
  });
  const loggedDays = new Set(
    (data.nutrition as unknown as Array<{ logged_on?: string }>).map((entry) => entry.logged_on).filter(Boolean) as string[],
  );
  const macros = (['calories', 'protein', 'carbs', 'fat'] as const).map((key) => {
    const value = Math.round(average?.[key] ?? 0);
    const goal = Math.round(data.targets?.[key] ?? 0);
    return { key, value, goal, unit: key === 'calories' ? 'kcal' : 'g', percent: goal ? Math.round((value / goal) * 100) : 0 };
  });
  const [calories, protein, carbs, fat] = macros;

  return <main className="page-content progress-page">
    {/* ───────── Header ───────── */}
    <header className="pg-header">
      <div>
        <p className="pg-breadcrumb">HFitness <span aria-hidden="true">›</span> <strong>{t('navigation.progress')}</strong></p>
        <h1>{t('progress.title')}</h1>
        <p className="pg-muted">{t('progress.description')}</p>
      </div>
      <div className="pg-segmented" role="group" aria-label={t('progress.rangeLabel')}>
        {[30, 90].map((days) => <button type="button" key={days} className={range === days ? 'selected' : ''} aria-pressed={range === days} onClick={() => setRange(days)}>{t('progress.days', { days })}</button>)}
      </div>
    </header>

    {/* ───────── Body weight ───────── */}
    <section className="pg-section">
      <div className="pg-section-head">
        <div><h2>{t('progress.weightTitle')}</h2><p className="pg-muted">{t('progress.weightDescription')}</p></div>
        <button type="button" className="pg-primary" onClick={() => setShowForm((open) => !open)} aria-expanded={showForm}>+ {t('progress.logWeight')}</button>
      </div>

      {showForm && <form className="pg-card weight-form" onSubmit={(event) => void addWeight(event)}>
        <Field label={t('progress.date')}><Input type="date" value={date} max={todayKey} onChange={(event) => setDate(event.target.value)} /></Field>
        <Field label={t('progress.weightKg')}><Input type="number" min="20" max="400" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="70" /></Field>
        <Button type="submit" disabled={saving}>{saving && <Spinner />}{t('progress.addWeight')}</Button>
      </form>}
      {formError && <p className="field-error" role="alert">! {formError}</p>}

      <div className="pg-grid-3">
        <div className="pg-card pg-stat">
          <div className="pg-stat-top"><span className="pg-label">{t('progress.latestWeight')}</span>{sevenChange != null && <span className="pg-chip">{signed(sevenChange)} kg {t('progress.inDays', { days: 7 })}</span>}</div>
          <p className="pg-big">{latest ? latest.weight_kg.toFixed(1) : '—'}<small>kg</small></p>
          <p className="pg-foot">{latest ? latestLabel : t('progress.noWeightDescription')}</p>
        </div>
        <div className="pg-card pg-stat">
          <div className="pg-stat-top"><span className="pg-label">{t('progress.starting', { days: range })}</span>{rangeChange != null && <span className="pg-chip">{signed(rangeChange)} kg {t('progress.total')}</span>}</div>
          <p className="pg-big">{start ? start.weight_kg.toFixed(1) : '—'}<small>kg</small></p>
          <p className="pg-foot">{start ? `Logged on ${dateFormatter.format(parseDay(start.logged_on))}` : t('progress.notEnoughData')}</p>
        </div>
        <div className="pg-card pg-stat">
          <div className="pg-stat-top"><span className="pg-label">{t('progress.weighInFrequency')}</span><span className="pg-chip">{t('progress.targetPerWeek')}</span></div>
          <p className="pg-big">{weighInsPerWeek.toFixed(1)}<small>{t('progress.daysPerWeek')}</small></p>
          <p className="pg-foot">{t('progress.totalLogs', { count: rangeEntries.length })}</p>
        </div>
      </div>

      <div className="pg-grid-chart">
        <div className="pg-card">
          <div className="pg-card-head">
            <h3>{t('progress.weightTrend')}</h3>
            <span className="pg-legend"><i className="dot" /> {t('progress.recorded')}</span>
          </div>
          {weightChart.length
            ? <Suspense fallback={<Skeleton className="chart-skeleton" />}><ProgressChart data={weightChart} /></Suspense>
            : <EmptyState title={t('progress.noWeightTitle')} description={t('progress.noWeightDescription')} />}
        </div>
        <div className="pg-card">
          <div className="pg-card-head"><h3>{t('progress.recentLogs')}</h3><span className="pg-label">{Math.min(5, sortedWeights.length)} {t('progress.entries')}</span></div>
          <ul className="pg-logs">
            {sortedWeights.slice(0, 5).map((entry) => <li key={entry.id}>
              <span>{dateFormatter.format(parseDay(entry.logged_on))}</span>
              <strong>{entry.weight_kg.toFixed(1)} kg</strong>
              <button type="button" className="pg-icon-btn" onClick={() => void removeWeight(entry.id)} aria-label={t('progress.delete')}><TrashIcon /></button>
            </li>)}
          </ul>
          {!sortedWeights.length && <p className="pg-muted">{t('progress.noWeightDescription')}</p>}
        </div>
      </div>
    </section>

    {/* ───────── Workouts ───────── */}
    <section className="pg-section">
      <div className="pg-section-head">
        <div><h2>{t('progress.workoutsTitle')}</h2><p className="pg-muted">{t('progress.consistencyEightWeeks')}</p></div>
        <span className="pg-target"><i className="dot" /> {target} {t('progress.sessions')} / week target</span>
      </div>

      <div className="pg-grid-3">
        <div className="pg-card pg-stat">
          <span className="pg-label">{t('progress.workoutsThisWeek')}</span>
          <p className="pg-big">{t('progress.ofTarget', { done: sessionsThisWeek, target })}<small>{t('progress.sessions')}</small></p>
          <ProgressBar percent={sessionPercent} />
          <p className="pg-foot">{Math.round(sessionPercent)}% {t('progress.completed')} • {t('progress.remaining', { count: remaining })}</p>
        </div>
        <div className="pg-card pg-stat">
          <span className="pg-label">{t('progress.completionRateLabel')}</span>
          <p className="pg-big">{rate}%{rate >= 80 && <small className="pg-accent">{t('progress.onTarget')}</small>}</p>
          <ProgressBar percent={rate} soft />
          <p className="pg-foot">{t('progress.completionRate')}</p>
        </div>
        <div className="pg-card pg-stat">
          <span className="pg-label">{t('progress.totalVolumeWeek')}</span>
          <p className="pg-big">{volume?.value}<small>{volume?.unit}</small></p>
          <p className="pg-foot">{t('progress.weeklyWork')}</p>
        </div>
      </div>

      <div className="pg-card">
        <div className="pg-card-head">
          <div><h3>{t('progress.weeklySessionFrequency')}</h3><p className="pg-muted">{t('progress.consistencyEightWeeks')}</p></div>
          <span className="pg-legend"><i className="dot dot-muted" /> {t('progress.completedLegend')} <i className="dot" /> {t('progress.currentWeek', { week: weeklyCounts.length })}</span>
        </div>
        {weeklyCounts.every((count) => count === 0) && <p className="pg-muted">{t('progress.noWorkoutData')}</p>}
        <div className="pg-bars">
          {weeklyCounts.map((count, index) => {
            const current = index === weeklyCounts.length - 1;
            return <div className="pg-bar-col" key={index}>
              <div className="pg-bar-track"><div className={current ? 'pg-bar-fill current' : 'pg-bar-fill'} style={{ height: `${(count / barMax) * 100}%` }}>{current && <em>{count}</em>}</div></div>
              <span>W{index + 1}</span>
            </div>;
          })}
        </div>
      </div>
    </section>

    {/* ───────── Nutrition ───────── */}
    <section className="pg-section">
      <div className="pg-section-head">
        <div><h2>{t('progress.nutritionConsistency')}</h2><p className="pg-muted">{t('progress.weeklyMacroAverages')}</p></div>
        <span className="pg-label">{t('progress.lastSevenDays')}</span>
      </div>

      <div className="pg-card pg-logged">
        <div className="pg-logged-text">
          <strong>{t('progress.daysLoggedOf', { logged: average?.daysLogged ?? 0, total: 7 })}</strong>
          <span className="pg-muted">{average?.daysLogged ? t('progress.daysLogged', { count: average.daysLogged }) : t('progress.noNutritionData')}</span>
        </div>
        <div className="pg-days">
          {last7.map((day) => <div key={day.key} className={day.isToday ? 'today' : ''}><i className={loggedDays.has(day.key) ? 'dot' : 'dot dot-muted'} /><span>{day.label}</span></div>)}
        </div>
      </div>

      {data.targets ? <>
        <div className="pg-grid-2">
          {[calories, protein].map((m) => <div className="pg-card pg-stat" key={m.key}>
            <div className="pg-stat-top"><span className="pg-label">Average {m.key}</span><span className="pg-chip pg-chip-plain">{m.percent}% of target</span></div>
            <p className="pg-big pg-big-sm">{m.value.toLocaleString(active)} <small>/ {m.goal.toLocaleString(active)} {m.unit}</small></p>
            <ProgressBar percent={m.percent} soft={m.key === 'protein'} />
            <p className="pg-foot">{signed(m.value - m.goal, 0)} {m.unit} vs daily goal</p>
          </div>)}
        </div>
        <div className="pg-grid-2">
          {[carbs, fat].map((m) => <div className="pg-card pg-compact" key={m.key}>
            <div className="pg-stat-top"><span className="pg-label">Average {m.key === 'carbs' ? 'carbohydrates' : 'fats'}</span><strong>{m.value} / {m.goal} g ({m.percent}%)</strong></div>
            <ProgressBar percent={m.percent} soft />
          </div>)}
        </div>
      </> : <EmptyState title={t('progress.noTargetsTitle')} description={t('progress.noTargetsDescription')}><Link className="button button-secondary" to="/profile">{t('progress.goProfile')}</Link></EmptyState>}
    </section>
  </main>;
}