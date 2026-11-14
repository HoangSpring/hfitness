import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Field, Input, Skeleton } from '../../components/ui';
import { exerciseDifficulties, exerciseEquipment, exerciseMovementPatterns, exerciseMuscles } from '../../lib/constants/exercise';
import { t } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { activeLocale } from '../../i18n/format';
import {
  adminExercisePageSize,
  emptyExerciseForm,
  exerciseFormSchema,
  exerciseStatuses,
  exerciseToForm,
  getAdminExercise,
  getAdminExercises,
  getExerciseStatusCounts,
  isExerciseSlugAvailable,
  publishAdminExercise,
  publishExerciseSchema,
  saveAdminExercise,
  setExerciseStatus,
  type AdminExercise,
  type ExerciseFormValues,
  type ExerciseStatus,
} from './exerciseAdmin';

function label(value: string) { return tEnum('muscle', value); }
function dateLabel(value: string) { return new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'medium' }).format(new Date(value)); }
function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }

export function AdminExercisesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [exercises, setExercises] = useState<AdminExercise[]>([]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState<Record<ExerciseStatus, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const filters = { muscle: params.get('muscle') ?? '', equipment: params.get('equipment') ?? '', difficulty: params.get('difficulty') ?? '', status: params.get('status') ?? '' };

  useEffect(() => setSearch(params.get('q') ?? ''), [params]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (search !== (params.get('q') ?? '')) {
        const next = new URLSearchParams(location.search);
        if (search.trim()) next.set('q', search.trim()); else next.delete('q');
        next.delete('page');
        navigate({ search: next.toString() }, { replace: true });
      }
    }, 350);
    return () => window.clearTimeout(timeout);
  }, [location.search, navigate, params, search]);
  useEffect(() => {
    setLoading(true); setError(false);
    void Promise.all([
      getAdminExercises({ muscle: params.get('muscle') ?? '', equipment: params.get('equipment') ?? '', difficulty: params.get('difficulty') ?? '', status: params.get('status') ?? '', search: params.get('q') ?? '', page }),
      getExerciseStatusCounts(),
    ]).then(([result, statusCounts]) => {
      setExercises(result.exercises); setCount(result.count); setCounts(statusCounts);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [filters.difficulty, filters.equipment, filters.muscle, filters.status, page, params, retry]);

  const updateFilter = (key: string, value: string) => {
    const next = new URLSearchParams(location.search);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    navigate({ search: next.toString() });
  };
  const setPage = (nextPage: number) => {
    const next = new URLSearchParams(location.search);
    if (nextPage) next.set('page', String(nextPage)); else next.delete('page');
    navigate({ search: next.toString() });
  };
  const updateStatus = async (exercise: AdminExercise, status: ExerciseStatus) => {
    if (status === 'ARCHIVED' && !window.confirm(t('adminExercises.archiveConfirm'))) return;
    try {
      setUpdatingId(exercise.id);
      if (status === 'PUBLISHED') await publishAdminExercise(exercise.id);
      else await setExerciseStatus(exercise.id, status);
      setRetry((value) => value + 1);
    } catch (error) {
      if (error instanceof Error && error.message === 'EXERCISE_PUBLISH_INVALID') window.alert(t('adminExercises.publishInvalid'));
      else setError(true);
    } finally { setUpdatingId(null); }
  };
  const totalPages = Math.ceil(count / adminExercisePageSize);

  return <div className="page-content admin-page">
    <div className="page-heading"><div><p className="eyebrow">{t('admin.label')}</p><h2>{t('adminExercises.title')}</h2><p className="muted">{t('adminExercises.listDescription')}</p></div><Link className="button button-primary" to="/admin/exercises/new">{t('adminExercises.add')}</Link></div>
    {counts && <div className="admin-counts">{exerciseStatuses.map((status) => <Card key={status}><span>{t(`adminExercises.status.${status.toLowerCase()}`)}</span><strong>{counts[status]}</strong></Card>)}</div>}
    <Card className="admin-filters">
      <label><span>{t('adminExercises.search')}</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminExercises.searchPlaceholder')} /></label>
      <Filter label={t('adminExercises.muscle')} value={filters.muscle} options={exerciseMuscles} onChange={(value) => updateFilter('muscle', value)} />
      <Filter label={t('adminExercises.equipment')} value={filters.equipment} options={exerciseEquipment} onChange={(value) => updateFilter('equipment', value)} />
      <Filter label={t('adminExercises.difficulty')} value={filters.difficulty} options={exerciseDifficulties} onChange={(value) => updateFilter('difficulty', value)} />
      <Filter label={t('adminExercises.statusLabel')} value={filters.status} options={exerciseStatuses} onChange={(value) => updateFilter('status', value)} />
    </Card>
    {loading ? <Card><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /></Card>
      : error ? <ErrorState message={t('adminExercises.loadError')} onRetry={() => setRetry((value) => value + 1)} />
        : exercises.length === 0 ? <EmptyState title={t('adminExercises.emptyTitle')} description={t('adminExercises.emptyDescription')}><Link className="button button-primary" to="/admin/exercises/new">{t('adminExercises.add')}</Link></EmptyState>
          : <><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['image', 'name', 'muscle', 'equipment', 'difficulty', 'statusLabel', 'updated', 'actions'].map((key) => <th key={key}>{t(`adminExercises.${key}`)}</th>)}</tr></thead><tbody>{exercises.map((exercise) => <tr key={exercise.id}><td><ExerciseImage exercise={exercise} /></td><td><strong>{exercise.name}</strong><small>{exercise.slug}</small></td><td>{tEnum('muscle', exercise.primary_muscle)}{exercise.secondary_muscles.length > 0 && <small>{exercise.secondary_muscles.map((value) => tEnum('muscle', value)).join(', ')}</small>}</td><td>{tEnum('equipment', exercise.equipment)}</td><td>{tEnum('difficulty', exercise.difficulty)}</td><td><StatusBadge status={exercise.status} /></td><td>{dateLabel(exercise.updated_at)}</td><td><div className="table-actions"><Link className="button button-secondary" to={`/admin/exercises/${exercise.id}/edit`}>{t('adminExercises.edit')}</Link>{exercise.status !== 'PUBLISHED' && <Button disabled={updatingId === exercise.id} onClick={() => void updateStatus(exercise, 'PUBLISHED')}>{t('adminExercises.publish')}</Button>}{exercise.status !== 'ARCHIVED' && <Button variant="secondary" disabled={updatingId === exercise.id} onClick={() => void updateStatus(exercise, 'ARCHIVED')}>{t('adminExercises.archive')}</Button>}</div></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>{t('adminExercises.showing', { from: page * adminExercisePageSize + 1, to: Math.min((page + 1) * adminExercisePageSize, count), total: count })}</span><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>{t('adminExercises.previous')}</Button><span>{page + 1} / {Math.max(1, totalPages)}</span><Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>{t('adminExercises.next')}</Button></div></>}
  </div>;
}

function Filter({ label: filterLabel, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void }) {
  return <label><span>{filterLabel}</span><select className="input" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{t('adminExercises.all')}</option>{options.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></label>;
}

function StatusBadge({ status }: { status: ExerciseStatus }) { return <span className={`status-badge status-${status.toLowerCase()}`}>{tEnum('status', status)}</span>; }
function ExerciseImage({ exercise }: { exercise: AdminExercise }) { return exercise.image_url ? <img className="admin-exercise-image" src={exercise.image_url} alt="" /> : <span className="admin-exercise-placeholder">{t('adminExercises.placeholder')}</span>; }

export function AdminExerciseEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState<ExerciseFormValues>(emptyExerciseForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [imagePreview, setImagePreview] = useState('');
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(emptyExerciseForm()));

  useEffect(() => {
    if (!id) return;
    void getAdminExercise(id).then((exercise) => {
      const nextValues = exerciseToForm(exercise);
      setValues(nextValues);
      setSavedSnapshot(JSON.stringify(nextValues));
    }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (!values.slug) { setSlugStatus('idle'); return; }
      setSlugStatus('checking');
      void isExerciseSlugAvailable(values.slug, id).then((available) => setSlugStatus(available ? 'available' : 'taken')).catch(() => setSlugStatus('idle'));
    }, 400);
    return () => window.clearTimeout(timeout);
  }, [id, values.slug]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => {
      if (JSON.stringify(values) === savedSnapshot) return;
      event.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savedSnapshot, values]);
  const update = <K extends keyof ExerciseFormValues>(key: K, value: ExerciseFormValues[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setSaveStatus('');
    setErrors((current) => { const next = { ...current }; delete next[String(key)]; return next; });
  };
  const save = async (intent: 'draft' | 'publish' | 'archive') => {
    if (intent === 'archive') {
      if (!id || !window.confirm(t('adminExercises.archiveConfirm'))) return;
      setSaving(true); setSaveStatus(t('adminExercises.saving'));
      try { await setExerciseStatus(id, 'ARCHIVED'); setValues((current) => ({ ...current, status: 'ARCHIVED' })); setSaveStatus(t('adminExercises.archived')); } catch { setSaveStatus(t('adminExercises.saveError')); } finally { setSaving(false); }
      return;
    }
    const schema = intent === 'publish' ? publishExerciseSchema : exerciseFormSchema;
    const parsed = schema.safeParse(values);
    if (!parsed.success || slugStatus === 'taken') {
      const nextErrors: Record<string, string> = {};
      if (!parsed.success) parsed.error.issues.forEach((issue) => { nextErrors[String(issue.path[0])] = issue.message; });
      if (slugStatus === 'taken') nextErrors.slug = t('adminExercises.slugTaken');
      setErrors(nextErrors);
      setSaveStatus(t('adminExercises.fixErrors'));
      return;
    }
    setSaving(true); setSaveStatus(t('adminExercises.saving'));
    try {
      const saved = await saveAdminExercise({ ...values, status: intent === 'publish' ? 'PUBLISHED' : 'DRAFT' }, id);
      const nextValues = exerciseToForm(saved);
      setValues(nextValues);
      setSavedSnapshot(JSON.stringify(nextValues));
      setSlugTouched(true);
      setSaveStatus(intent === 'publish' ? t('adminExercises.published') : t('adminExercises.draftSaved'));
      if (!id) navigate(`/admin/exercises/${saved.id}/edit`, { replace: true });
    } catch { setSaveStatus(t('adminExercises.saveError')); } finally { setSaving(false); }
  };
  const title = id ? t('adminExercises.editTitle') : t('adminExercises.newTitle');
  if (loading) return <div className="page-content admin-page"><Skeleton className="editor-skeleton" /><Skeleton className="editor-skeleton" /></div>;
  if (loadError) return <div className="page-content admin-page"><ErrorState message={t('adminExercises.loadError')} onRetry={() => navigate(0)} /></div>;

  return <div className="page-content admin-page"><div className="page-heading"><div><Link className="back-link" to="/admin/exercises">← {t('adminExercises.backToList')}</Link><h2>{title}</h2><p className="muted">{t('adminExercises.editorDescription')}</p></div><StatusBadge status={values.status} /></div>
    <Card><h3>{t('adminExercises.basic')}</h3><div className="form-grid"><Field label={t('adminExercises.name')} error={errors.name}><Input value={values.name} onChange={(event) => { update('name', event.target.value); if (!slugTouched) update('slug', slugify(event.target.value)); }} /></Field><Field label={t('adminExercises.slug')} error={errors.slug}><Input value={values.slug} onChange={(event) => { setSlugTouched(true); update('slug', slugify(event.target.value)); }} />{slugStatus === 'checking' && <small>{t('adminExercises.slugChecking')}</small>}{slugStatus === 'available' && <small className="success-message">{t('adminExercises.slugAvailable')}</small>}</Field></div><Field label={t('adminExercises.description')} error={errors.description}><textarea className="input" rows={3} value={values.description} onChange={(event) => update('description', event.target.value)} /></Field></Card>
    <Card><h3>{t('adminExercises.instructions')}</h3>{values.instructions.map((instruction, index) => <div className="instruction-row" key={`${index}-${instruction}`}><span>{index + 1}</span><Input aria-label={t('adminExercises.instructionLabel', { number: index + 1 })} value={instruction} onChange={(event) => { const next = [...values.instructions]; next[index] = event.target.value; update('instructions', next); }} /><div className="instruction-actions"><Button variant="secondary" type="button" aria-label={t('adminExercises.moveUp')} onClick={() => { if (index > 0) { const next = [...values.instructions]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; update('instructions', next); } }} disabled={index === 0}>↑</Button><Button variant="secondary" type="button" aria-label={t('adminExercises.moveDown')} onClick={() => { if (index < values.instructions.length - 1) { const next = [...values.instructions]; [next[index], next[index + 1]] = [next[index + 1], next[index]]; update('instructions', next); } }} disabled={index === values.instructions.length - 1}>↓</Button><Button variant="secondary" type="button" onClick={() => update('instructions', values.instructions.filter((_, itemIndex) => itemIndex !== index))} disabled={values.instructions.length === 1}>{t('adminExercises.remove')}</Button></div></div>)}{errors.instructions && <p className="field-error" role="alert">! {errors.instructions}</p>}<Button variant="secondary" type="button" onClick={() => update('instructions', [...values.instructions, ''])}>{t('adminExercises.addInstruction')}</Button></Card>
    <Card><h3>{t('adminExercises.safety')}</h3><textarea className="input" rows={3} value={values.safety_notes} onChange={(event) => update('safety_notes', event.target.value)} /></Card>
    <Card><h3>{t('adminExercises.muscles')}</h3><div className="form-grid"><SelectField label={t('adminExercises.primaryMuscle')} value={values.primary_muscle} options={exerciseMuscles} onChange={(value) => update('primary_muscle', value as ExerciseFormValues['primary_muscle'])} error={errors.primary_muscle} /><SelectField label={t('adminExercises.secondaryMuscles')} value="" options={exerciseMuscles.filter((item) => !values.secondary_muscles.includes(item))} onChange={(value) => value && update('secondary_muscles', [...values.secondary_muscles, value as ExerciseFormValues['secondary_muscles'][number]])} /><div className="tag-list">{values.secondary_muscles.map((muscle) => <button className="tag" type="button" key={muscle} onClick={() => update('secondary_muscles', values.secondary_muscles.filter((item) => item !== muscle))}>{label(muscle)} ×</button>)}</div></div></Card>
    <Card><h3>{t('adminExercises.details')}</h3><div className="form-grid"><SelectField label={t('adminExercises.equipment')} value={values.equipment} options={exerciseEquipment} onChange={(value) => update('equipment', value as ExerciseFormValues['equipment'])} error={errors.equipment} /><SelectField label={t('adminExercises.difficulty')} value={values.difficulty} options={exerciseDifficulties} onChange={(value) => update('difficulty', value as ExerciseFormValues['difficulty'])} error={errors.difficulty} /><SelectField label={t('adminExercises.movementPattern')} value={values.movement_pattern} options={exerciseMovementPatterns} onChange={(value) => update('movement_pattern', value as ExerciseFormValues['movement_pattern'])} error={errors.movement_pattern} /></div></Card>
    <Card><h3>{t('adminExercises.media')}</h3><div className="form-grid"><Field label={t('adminExercises.imageUrl')} error={errors.image_url}><Input type="url" value={values.image_url} onChange={(event) => { update('image_url', event.target.value); setImagePreview(''); }} />{imagePreview && <img className="editor-image-preview" src={imagePreview} alt="" onError={() => setImagePreview('')} />}{values.image_url.startsWith('https://') && !imagePreview && <Button variant="secondary" type="button" onClick={() => setImagePreview(values.image_url)}>{t('adminExercises.previewImage')}</Button>}</Field><Field label={t('adminExercises.imageUrls')} error={errors.image_urls}><textarea className="input" rows={3} value={values.image_urls.join('\n')} onChange={(event) => update('image_urls', event.target.value.split(/\r?\n/).map((value) => value.trim()).filter(Boolean))} placeholder={t('adminExercises.imageUrlsPlaceholder')} /></Field><Field label={t('adminExercises.videoUrl')} error={errors.video_url}><Input type="url" value={values.video_url} onChange={(event) => update('video_url', event.target.value)} /></Field></div></Card>
    <Card><h3>{t('adminExercises.statusHeading')}</h3><SelectField label={t('adminExercises.statusLabel')} value={values.status} options={exerciseStatuses} onChange={(value) => update('status', value as ExerciseStatus)} /><p className="muted">{t(`adminExercises.statusDescription.${values.status.toLowerCase()}`)}</p></Card>
    {saveStatus && <p className={saveStatus === t('adminExercises.saveError') || saveStatus === t('adminExercises.fixErrors') ? 'field-error' : 'save-status'} role="status">{saveStatus}</p>}
    <div className="editor-actions"><Button type="button" disabled={saving} onClick={() => void save('draft')}>{t('adminExercises.saveDraft')}</Button><Button type="button" disabled={saving} onClick={() => void save('publish')}>{t('adminExercises.publish')}</Button>{id && values.status !== 'ARCHIVED' && <Button type="button" variant="secondary" disabled={saving} onClick={() => void save('archive')}>{t('adminExercises.archive')}</Button>}</div>
  </div>;
}

function SelectField({ label: fieldLabel, value, options, onChange, error }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; error?: string }) {
  const kind = fieldLabel === t('adminExercises.equipment') ? 'equipment' : fieldLabel === t('adminExercises.difficulty') ? 'difficulty' : fieldLabel === t('adminExercises.movementPattern') ? 'movement_pattern' : 'muscle';
  return <Field label={fieldLabel} error={error}><select className="input" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{tEnum(kind, option)}</option>)}</select></Field>;
}
