import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import { Button, Card, ErrorState, Field, Input, Skeleton } from '../../components/ui';
import { t } from '../../i18n/en';
import { calculateDuration, calculateVolume, findPersonalRecords } from '../../lib/workout-metrics';
import {
  abandonWorkout, deleteSet, finishWorkout, getAllPreviousSets, getPreviousSets, getSession, saveSet,
  type SessionData, type WorkoutSet,
} from './workout';

const setInputSchema = z.object({
  weight_kg: z.coerce.number().min(0).max(1000),
  reps: z.coerce.number().int().min(1).max(100),
  rpe: z.union([z.literal(''), z.coerce.number().int().min(1).max(10)]),
});

type SetDraft = { id?: string; weight_kg: string; reps: string; rpe: string; saved: boolean };

function draftFromSet(set?: WorkoutSet): SetDraft {
  return { id: set?.id, weight_kg: set ? String(set.weight_kg) : '', reps: set ? String(set.reps) : '', rpe: set?.rpe ? String(set.rpe) : '', saved: Boolean(set) };
}

function SessionSummary({ session, onDone }: { session: SessionData; onDone: () => void }) {
  const navigate = useNavigate();
  const sets = session.sets;
  const [previous, setPrevious] = useState<WorkoutSet[]>([]);
  useEffect(() => {
    void Promise.all([...new Set(sets.map((set) => set.exercise_id))].map((id) => getAllPreviousSets(id, session.id)))
      .then((groups) => setPrevious(groups.flat()));
  }, [sets, session.id]);
  const currentMetrics = sets.map((set) => ({ exercise_id: set.exercise_id, weight_kg: Number(set.weight_kg), reps: set.reps }));
  const previousMetrics = previous.map((set) => ({ exercise_id: set.exercise_id, weight_kg: Number(set.weight_kg), reps: set.reps }));
  const records = findPersonalRecords(currentMetrics, previousMetrics);
  const allBodyweight = sets.length === 0 || sets.every((set) => Number(set.weight_kg) === 0);
  const exerciseCount = new Set(sets.map((set) => set.exercise_id)).size;
  return <main className="page-content session-summary"><Card className="summary-heading"><span className="summary-check" aria-hidden="true">✓</span><p className="eyebrow">{t('workoutSession.complete')}</p><h1>{t('workoutSession.workoutComplete')}</h1><p className="muted">{session.day?.name} {t('workoutSession.finished')}</p></Card><div className="session-stats"><Card><span className="muted">{t('workoutSession.duration')}</span><strong>{calculateDuration(session.started_at, session.finished_at)} min</strong></Card><Card><span className="muted">{t('workoutSession.exercisesCompleted')}</span><strong>{exerciseCount} / {session.day?.workout_plan_exercises.length ?? 0}</strong></Card><Card><span className="muted">{t('workoutSession.totalSets')}</span><strong>{sets.length}</strong></Card><Card><span className="muted">{allBodyweight ? t('workoutSession.totalReps') : t('workoutSession.totalVolume')}</span><strong>{allBodyweight ? sets.reduce((sum, set) => sum + set.reps, 0) : `${calculateVolume(currentMetrics)} kg`}</strong></Card></div><Card><h2>{t('workoutSession.records')}</h2>{records.length === 0 ? <p className="muted">{t('workoutSession.noRecords')}</p> : <ul>{records.map((id) => <li key={id}>{session.day?.workout_plan_exercises.find((exercise) => exercise.exercise_id === id)?.exercises?.name ?? id} <strong>PR</strong></li>)}</ul>}</Card><div className="workout-actions"><Button onClick={onDone}>{t('workoutSession.done')}</Button><Button variant="secondary" onClick={() => navigate('/workout/history')}>{t('workoutSession.viewHistory')}</Button></div></main>;
}

export function WorkoutSessionPage() {
  const { sessionId = '' } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<SessionData>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, SetDraft[]>>({});
  const [rest, setRest] = useState(0);
  const [previous, setPrevious] = useState<WorkoutSet[]>([]);
  const load = useCallback(() => { setError(''); void getSession(sessionId).then((data) => { setSession(data); const next: Record<string, SetDraft[]> = {}; data.day?.workout_plan_exercises.forEach((exercise) => { next[exercise.exercise_id] = data.sets.filter((set) => set.exercise_id === exercise.exercise_id).sort((a, b) => a.set_number - b.set_number).map((set) => draftFromSet(set)); }); setDrafts(next); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : t('workoutSession.loadError'))); }, [sessionId]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (rest <= 0) return; const timer = window.setInterval(() => setRest((value) => value - 1), 1000); return () => window.clearInterval(timer); }, [rest]);
  const exercise = session?.day?.workout_plan_exercises.slice().sort((a, b) => a.position - b.position)[exerciseIndex];
  const rows = exercise ? drafts[exercise.exercise_id] ?? [] : [];
  useEffect(() => { if (!exercise || !session) return; void getPreviousSets(exercise.exercise_id, session.id).then(setPrevious).catch(() => setPrevious([])); }, [exercise, session]);
  const updateDraft = (index: number, key: keyof SetDraft, value: string) => { if (!exercise) return; setDrafts((current) => ({ ...current, [exercise.exercise_id]: (current[exercise.exercise_id] ?? []).map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value, saved: false } : row) })); };
  const completeSet = async (index: number) => {
    if (!session || !exercise) return;
    const parsed = setInputSchema.safeParse(rows[index]);
    if (!parsed.success) { setError(t('workoutSession.invalidSet')); return; }
    setBusy(true); setError('');
    try {
      const saved = await saveSet({ id: rows[index].id, session_id: session.id, exercise_id: exercise.exercise_id, set_number: index + 1, weight_kg: parsed.data.weight_kg, reps: parsed.data.reps, rpe: parsed.data.rpe === '' ? null : parsed.data.rpe });
      setSession((current) => current ? { ...current, sets: [...current.sets.filter((set) => set.id !== saved.id), saved] } : current);
      setDrafts((current) => ({ ...current, [exercise.exercise_id]: current[exercise.exercise_id].map((row, rowIndex) => rowIndex === index ? { ...row, id: saved.id, saved: true } : row) }));
      setRest(exercise.rest_seconds);
    } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutSession.saveError')); } finally { setBusy(false); }
  };
  const removeSet = async (index: number) => { const id = rows[index].id; if (!id || !exercise) return; setBusy(true); try { await deleteSet(id); setSession((current) => current ? { ...current, sets: current.sets.filter((set) => set.id !== id) } : current); setDrafts((current) => ({ ...current, [exercise.exercise_id]: current[exercise.exercise_id].filter((_, rowIndex) => rowIndex !== index) })); } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutSession.saveError')); } finally { setBusy(false); } };
  const finish = async () => { if (!session) return; const missing = session.day?.workout_plan_exercises.filter((item) => !session.sets.some((set) => set.exercise_id === item.exercise_id)).length ?? 0; if (missing > 0 && !window.confirm(t('workoutSession.finishConfirm', { count: missing }))) return; setBusy(true); try { const finished = await finishWorkout(session.id); setSession((current) => current ? { ...current, ...finished } : current); } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutSession.finishError')); } finally { setBusy(false); } };
  const abandon = async () => { if (!session || !window.confirm(t('workoutSession.abandonConfirm'))) return; setBusy(true); try { await abandonWorkout(session.id); navigate('/workout'); } catch (reason) { setError(reason instanceof Error ? reason.message : t('workoutSession.finishError')); } finally { setBusy(false); } };
  const addSet = () => { if (!exercise) return; setDrafts((current) => ({ ...current, [exercise.exercise_id]: [...(current[exercise.exercise_id] ?? []), draftFromSet()] })); };
  if (error && !session) return <main className="page-content"><ErrorState onRetry={load} /><p className="alert" role="alert">{t('workoutSession.loadError')}</p></main>;
  if (!session) return <main className="page-content"><Skeleton /><Skeleton /><Skeleton /></main>;
  if (session.status === 'COMPLETED') return <SessionSummary session={session} onDone={() => navigate('/workout')} />;
  if (!exercise) return <main className="page-content"><ErrorState onRetry={load} /></main>;
  const previousText = previous.length > 0 ? t('workoutSession.previousPerformance', { weight: Math.max(...previous.map((set) => Number(set.weight_kg))), reps: previous[0].reps }) : t('workoutSession.noPrevious');
  return <main className="page-content active-session"><header className="session-header"><Link to="/workout">← {t('navigation.workout')}</Link><span>{session.day?.name}</span><Button onClick={finish} disabled={busy}>{t('workoutSession.finish')}</Button></header><p className="eyebrow">{t('workoutSession.progress', { current: exerciseIndex + 1, total: session.day?.workout_plan_exercises.length ?? 0 })}</p><div className="progress-track"><span style={{ width: `${((exerciseIndex + 1) / (session.day?.workout_plan_exercises.length ?? 1)) * 100}%` }} /></div><Card className="current-exercise"><p className="eyebrow">{exercise.exercises?.primary_muscle}</p><h1>{exercise.exercises?.name ?? t('workout.exerciseDetails')}</h1><p className="muted">{t('workoutSession.target', { sets: exercise.sets, repsMin: exercise.reps_min, repsMax: exercise.reps_max })}</p><p className="muted">{previousText}</p>{exercise.exercises?.safety_notes && <p className="muted">{exercise.exercises.safety_notes.split('.')[0]}.</p>}</Card>{error && <p className="alert" role="alert">{t('workoutSession.saveError')}</p>}{rest > 0 && <Card className="rest-timer"><strong>{t('workoutSession.restTimer', { seconds: rest })}</strong><Button variant="secondary" onClick={() => setRest((value) => value + 30)}>{t('workoutSession.addRest')}</Button><Button variant="secondary" onClick={() => setRest(0)}>{t('workoutSession.skipRest')}</Button></Card>}<div className="set-list">{rows.map((row, index) => <Card key={row.id ?? `${exercise.exercise_id}-${index}`} className="set-row"><strong>{t('workoutSession.set', { number: index + 1 })}</strong><Field label={t('workoutSession.kg')}><Input inputMode="decimal" value={row.weight_kg} onChange={(event) => updateDraft(index, 'weight_kg', event.target.value)} disabled={row.saved && busy} /></Field><Field label={t('workoutSession.reps')}><Input inputMode="numeric" value={row.reps} onChange={(event) => updateDraft(index, 'reps', event.target.value)} /></Field><Field label={t('workoutSession.rpe')}><Input inputMode="numeric" value={row.rpe} onChange={(event) => updateDraft(index, 'rpe', event.target.value)} /></Field><Button onClick={() => void completeSet(index)} disabled={busy}>{row.saved ? t('workoutSession.editSave') : t('workoutSession.complete')}</Button>{row.id && <Button variant="secondary" onClick={() => void removeSet(index)} disabled={busy}>{t('workoutSession.delete')}</Button>}</Card>)}</div><div className="workout-actions"><Button variant="secondary" onClick={addSet}>{t('workoutSession.addSet')}</Button><Button variant="secondary" onClick={() => setExerciseIndex((value) => Math.max(0, value - 1))} disabled={exerciseIndex === 0}>{t('workoutSession.previous')}</Button><Button variant="secondary" onClick={() => setExerciseIndex((value) => Math.min((session.day?.workout_plan_exercises.length ?? 1) - 1, value + 1))} disabled={exerciseIndex >= (session.day?.workout_plan_exercises.length ?? 1) - 1}>{t('workoutSession.next')}</Button><Button variant="secondary" onClick={() => void abandon()}>{t('workoutSession.abandon')}</Button></div></main>;
}
