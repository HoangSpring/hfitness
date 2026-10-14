import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { Button, Card, EmptyState, ErrorState, Field, Input, Skeleton, Spinner } from '../../components/ui';
import { dateKey } from '../../lib/nutrition';
import { completionRate, sevenDayNutritionAverage, sevenDayWeightChange, weeklySessionCounts, weeklyVolumeOrReps } from '../../lib/progress-metrics';
import { t } from '../../i18n/en';
import { deleteWeight, getProgressData, saveWeight, type ProgressData } from './progress';

const ProgressChart = lazy(() => import('./ProgressChart').then((module) => ({ default: module.ProgressChart })));
const weightSchema = z.object({ date: z.string().min(1), weight: z.coerce.number().min(20).max(400) });
const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

export function ProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [range, setRange] = useState(30);
  const [date, setDate] = useState(dateKey(new Date()));
  const [weight, setWeight] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try { setData(await getProgressData()); } catch { setError(true); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const weightChart = useMemo(() => {
    if (!data) return [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - range);
    return data.weights.filter((entry) => new Date(`${entry.logged_on}T00:00:00`) >= cutoff).sort((a, b) => a.logged_on.localeCompare(b.logged_on)).map((entry) => ({ date: dateFormatter.format(new Date(`${entry.logged_on}T00:00:00`)), weight: entry.weight_kg }));
  }, [data, range]);
  const rangeEntries = data?.weights.filter((entry) => weightChart.some((point) => point.date === dateFormatter.format(new Date(`${entry.logged_on}T00:00:00`)))) ?? [];
  const rangeChange = rangeEntries.length > 1 ? rangeEntries[0].weight_kg - rangeEntries[rangeEntries.length - 1].weight_kg : null;
  const average = data ? sevenDayNutritionAverage(data.nutrition) : null;
  const change = data ? sevenDayWeightChange(data.weights) : null;
  const weeklyCounts = data ? weeklySessionCounts(data.sessions) : [];
  const volume = data ? weeklyVolumeOrReps(data.sessions, data.sets) : null;

  const addWeight = async (event: FormEvent) => {
    event.preventDefault(); setFormError('');
    const valid = weightSchema.safeParse({ date, weight });
    if (!valid.success || valid.data.date > dateKey(new Date())) { setFormError(t('progress.invalidWeight')); return; }
    setSaving(true);
    try { await saveWeight(valid.data.date, valid.data.weight); setWeight(''); await load(); } catch { setFormError(t('progress.saveWeightError')); } finally { setSaving(false); }
  };
  const removeWeight = async (id: string) => {
    if (!window.confirm(t('progress.deleteWeightConfirm'))) return;
    try { await deleteWeight(id); setData((current) => current ? { ...current, weights: current.weights.filter((entry) => entry.id !== id) } : current); } catch { setFormError(t('progress.deleteWeightError')); }
  };

  if (loading) return <main className="page-content progress-page"><Skeleton className="progress-skeleton" /><Skeleton className="progress-skeleton" /><Skeleton className="progress-skeleton" /></main>;
  if (error || !data) return <main className="page-content"><ErrorState message={t('progress.loadError')} onRetry={() => void load()} /></main>;
  return <main className="page-content progress-page">
    <div className="page-heading"><div><p className="eyebrow">{t('navigation.progress')}</p><h1>{t('progress.title')}</h1><p className="muted">{t('progress.description')}</p></div></div>
    <Card className="progress-section"><div className="page-heading"><div><h2>{t('progress.weightTitle')}</h2><p className="muted">{t('progress.weightDescription')}</p></div><div className="range-selector" role="group" aria-label={t('progress.rangeLabel')}>{[30, 90].map((days) => <button type="button" className={range === days ? 'range-button selected' : 'range-button'} onClick={() => setRange(days)} key={days}>{t('progress.days', { days })}</button>)}</div></div>
      {weightChart.length ? <Suspense fallback={<Skeleton className="chart-skeleton" />}><ProgressChart data={weightChart} /></Suspense> : <EmptyState title={t('progress.noWeightTitle')} description={t('progress.noWeightDescription')} />}
      {weightChart.length > 1 && <div className="metric-grid weight-period-stats"><div><strong>{rangeChange == null ? '—' : `${rangeChange > 0 ? '+' : ''}${rangeChange.toFixed(1)} kg`}</strong><span>{t('progress.changeOverPeriod')}</span></div><div><strong>{weightChart.length}</strong><span>{t('progress.entriesThisPeriod')}</span></div></div>}
      <form className="weight-form" onSubmit={(event) => void addWeight(event)}><Field label={t('progress.date')}><Input type="date" value={date} max={dateKey(new Date())} onChange={(event) => setDate(event.target.value)} /></Field><Field label={t('progress.weightKg')}><Input type="number" min="20" max="400" step="0.1" value={weight} onChange={(event) => setWeight(event.target.value)} placeholder="70" /></Field><Button type="submit" disabled={saving}>{saving && <Spinner />}{t('progress.addWeight')}</Button></form>
      {formError && <p className="field-error" role="alert">! {formError}</p>}
      {data.weights.length ? <div className="weight-list">{data.weights.slice(0, 10).map((entry) => <div className="weight-row" key={entry.id}><span><strong>{entry.weight_kg} kg</strong><span className="muted">{dateFormatter.format(new Date(`${entry.logged_on}T00:00:00`))}</span></span><Button variant="secondary" onClick={() => void removeWeight(entry.id)}>{t('progress.delete')}</Button></div>)}</div> : null}
    </Card>
    <Card className="progress-section"><h2>{t('progress.workoutsTitle')}</h2><div className="metric-grid"><div><strong>{weeklyCounts.reduce((sum, count) => sum + count, 0)} of {data.profile.days_per_week}</strong><span>{t('progress.sessionsThisWeek')}</span></div><div><strong>{completionRate(data.sessions, data.profile.days_per_week)}%</strong><span>{t('progress.completionRate')}</span></div><div><strong>{volume?.value} {volume?.unit}</strong><span>{t('progress.weeklyWork')}</span></div></div>{weeklyCounts.every((count) => count === 0) && <p className="muted">{t('progress.noWorkoutData')}</p>}</Card>
    <Card className="progress-section"><h2>{t('progress.nutritionTitle')}</h2>{data.targets ? <div className="metric-grid nutrition-metric-grid">{(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => { const value = Math.round(average?.[key] ?? 0); const target = Math.round(data.targets?.[key] ?? 0); const percent = target ? Math.min(100, Math.round((value / target) * 100)) : 0; return <div key={key}><strong>{value} {key === 'calories' ? 'kcal' : 'g'}</strong><span>{t(`nutrition.${key}`)} vs {target} {key === 'calories' ? 'kcal' : 'g'}</span><i className="metric-progress"><i style={{ width: `${percent}%` }} /></i></div>; })}</div> : <EmptyState title={t('progress.noTargetsTitle')} description={t('progress.noTargetsDescription')}><Link className="button button-secondary" to="/profile">{t('progress.goProfile')}</Link></EmptyState>}<p className="muted">{average?.daysLogged ? t('progress.daysLogged', { count: average.daysLogged }) : t('progress.noNutritionData')}</p></Card>
    <Card className="progress-section"><h2>{t('progress.latestWeight')}</h2>{data.weights[0] ? <p className="large-stat"><strong>{data.weights[0].weight_kg} kg</strong> <span>{change == null ? t('progress.notEnoughData') : `${change > 0 ? '+' : ''}${change.toFixed(1)} kg ${t('progress.lastSevenDays')}`}</span></p> : <p className="muted">{t('progress.noWeightDescription')}</p>}</Card>
  </main>;
}
