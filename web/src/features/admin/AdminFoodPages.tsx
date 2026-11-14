import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, ConfirmDialog, EmptyState, ErrorState, Field, Input, Skeleton } from '../../components/ui';
import { t } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { activeLocale } from '../../i18n/format';
import {
  adminFoodPageSize, emptyFoodForm, foodCategories, foodFormSchema, foodStatuses, foodToForm,
  foodUnits, getAdminFood, getAdminFoods, getFoodStatusCounts, isFoodSlugAvailable,
  nutritionWarning, publishAdminFood, publishFoodSchema, saveAdminFood, setFoodStatus,
  slugify, type AdminFood, type FoodFormValues, type FoodStatus,
} from './foodAdmin';

function label(value: string) { return tEnum('food_category', value); }
function dateLabel(value: string) { return new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'medium' }).format(new Date(value)); }

export function AdminFoodsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [foods, setFoods] = useState<AdminFood[]>([]);
  const [count, setCount] = useState(0);
  const [counts, setCounts] = useState<Record<FoodStatus, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [actionError, setActionError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<AdminFood | null>(null);
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const category = params.get('category') ?? '';
  const status = params.get('status') ?? '';

  useEffect(() => setSearch(params.get('q') ?? ''), [params]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (params.get('q') ?? '')) {
        const next = new URLSearchParams(location.search);
        if (search.trim()) next.set('q', search.trim()); else next.delete('q');
        next.delete('page');
        navigate({ search: next.toString() }, { replace: true });
      }
    }, 350);
    return () => window.clearTimeout(timer);
  }, [location.search, navigate, params, search]);
  useEffect(() => {
    setLoading(true); setError(false);
    void Promise.all([
      getAdminFoods({ search: params.get('q') ?? '', category, status, page }),
      getFoodStatusCounts(),
    ]).then(([result, statusCounts]) => {
      setFoods(result.foods); setCount(result.count); setCounts(statusCounts);
    }).catch(() => setError(true)).finally(() => setLoading(false));
  }, [category, page, params, retry, status]);

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
  const publish = async (food: AdminFood) => {
    setUpdatingId(food.id);
    try {
      await publishAdminFood(food.id);
      setRetry((value) => value + 1);
    } catch (publishError) {
      setActionError(publishError instanceof Error && publishError.message === 'FOOD_PUBLISH_INVALID' ? t('adminFoods.publishInvalid') : t('adminFoods.saveError'));
    } finally { setUpdatingId(null); }
  };
  const archive = async () => {
    if (!archiveTarget) return;
    setUpdatingId(archiveTarget.id);
    try { await setFoodStatus(archiveTarget.id, 'ARCHIVED'); setArchiveTarget(null); setRetry((value) => value + 1); }
    catch { setError(true); } finally { setUpdatingId(null); }
  };
  const totalPages = Math.ceil(count / adminFoodPageSize);

  return <div className="page-content admin-page">
    <div className="page-heading"><div><p className="eyebrow">{t('admin.label')}</p><h2>{t('adminFoods.title')}</h2><p className="muted">{t('adminFoods.listDescription')}</p></div><Link className="button button-primary" to="/admin/foods/new">{t('adminFoods.add')}</Link></div>
    {counts && <div className="admin-counts">{foodStatuses.map((item) => <Card key={item}><span>{t(`adminFoods.status.${item.toLowerCase()}`)}</span><strong>{counts[item]}</strong></Card>)}</div>}
    <Card className="admin-filters"><label><span>{t('adminFoods.search')}</span><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminFoods.searchPlaceholder')} /></label><Filter label={t('adminFoods.category')} value={category} options={foodCategories} kind="food_category" onChange={(value) => updateFilter('category', value)} /><Filter label={t('adminFoods.statusLabel')} value={status} options={foodStatuses} kind="status" onChange={(value) => updateFilter('status', value)} /></Card>
    {actionError && <p className="alert" role="alert">! {actionError}</p>}
    {loading ? <Card><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /></Card>
      : error ? <ErrorState message={t('adminFoods.loadError')} onRetry={() => setRetry((value) => value + 1)} />
        : foods.length === 0 ? <EmptyState title={t('adminFoods.emptyTitle')} description={t('adminFoods.emptyDescription')}><Link className="button button-primary" to="/admin/foods/new">{t('adminFoods.add')}</Link></EmptyState>
          : <><div className="admin-table-wrap"><table className="admin-table"><thead><tr>{['name', 'category', 'serving', 'calories', 'protein', 'carbs', 'fat', 'statusLabel', 'updated', 'actions'].map((key) => <th key={key}>{t(`adminFoods.${key}`)}</th>)}</tr></thead><tbody>{foods.map((food) => <tr key={food.id}><td><strong>{food.name}</strong><small>{food.slug}</small></td><td>{food.category}</td><td>{food.serving_size} {food.unit}</td><td>{food.calories}</td><td>{food.protein} g</td><td>{food.carbs} g</td><td>{food.fat} g</td><td><StatusBadge status={food.status} /></td><td>{dateLabel(food.updated_at)}</td><td><div className="table-actions"><Link className="button button-secondary" to={`/admin/foods/${food.id}/edit`}>{t('adminFoods.edit')}</Link>{food.status !== 'PUBLISHED' && <Button disabled={updatingId === food.id} onClick={() => void publish(food)}>{t('adminFoods.publish')}</Button>}{food.status !== 'ARCHIVED' && <Button variant="secondary" disabled={updatingId === food.id} onClick={() => setArchiveTarget(food)}>{t('adminFoods.archive')}</Button>}</div></td></tr>)}</tbody></table></div><div className="admin-pagination"><span>{t('adminFoods.showing', { from: page * adminFoodPageSize + 1, to: Math.min((page + 1) * adminFoodPageSize, count), total: count })}</span><Button variant="secondary" disabled={page === 0} onClick={() => setPage(page - 1)}>{t('adminFoods.previous')}</Button><span>{page + 1} / {Math.max(1, totalPages)}</span><Button variant="secondary" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>{t('adminFoods.next')}</Button></div></>}
    {archiveTarget && <ConfirmDialog title={t('adminFoods.archiveTitle')} description={t('adminFoods.archiveDescription')} confirmLabel={t('adminFoods.archive')} cancelLabel={t('adminFoods.cancel')} busy={updatingId === archiveTarget.id} onCancel={() => setArchiveTarget(null)} onConfirm={() => void archive()} />}
  </div>;
}

function Filter({ label: filterLabel, value, options, kind, onChange }: { label: string; value: string; options: readonly string[]; kind: string; onChange: (value: string) => void }) {
  return <label><span>{filterLabel}</span><select className="input" value={value} onChange={(event) => onChange(event.target.value)}><option value="">{t('adminFoods.all')}</option>{options.map((option) => <option key={option} value={option}>{tEnum(kind, option)}</option>)}</select></label>;
}
function StatusBadge({ status }: { status: FoodStatus }) { return <span className={`status-badge status-${status.toLowerCase()}`}>{tEnum('status', status)}</span>; }

export function AdminFoodEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [values, setValues] = useState<FoodFormValues>(emptyFoodForm);
  const [loading, setLoading] = useState(Boolean(id));
  const [loadError, setLoadError] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [savedSnapshot, setSavedSnapshot] = useState(JSON.stringify(emptyFoodForm()));

  useEffect(() => {
    if (!id) return;
    void getAdminFood(id).then((food) => { const next = foodToForm(food); setValues(next); setSavedSnapshot(JSON.stringify(next)); }).catch(() => setLoadError(true)).finally(() => setLoading(false));
  }, [id]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!values.slug) { setSlugStatus('idle'); return; }
      setSlugStatus('checking');
      void isFoodSlugAvailable(values.slug, id).then((available) => setSlugStatus(available ? 'available' : 'taken')).catch(() => setSlugStatus('idle'));
    }, 400);
    return () => window.clearTimeout(timer);
  }, [id, values.slug]);
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (JSON.stringify(values) !== savedSnapshot) event.preventDefault(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [savedSnapshot, values]);
  const update = <K extends keyof FoodFormValues>(key: K, value: FoodFormValues[K]) => { setValues((current) => ({ ...current, [key]: value })); setSaveStatus(''); setErrors((current) => { const next = { ...current }; delete next[String(key)]; return next; }); };
  const save = async (intent: 'draft' | 'publish') => {
    const schema = intent === 'publish' ? publishFoodSchema : foodFormSchema;
    const parsed = schema.safeParse(values);
    const nextErrors: Record<string, string> = {};
    if (!parsed.success) parsed.error.issues.forEach((issue) => { nextErrors[String(issue.path[0])] = issue.message; });
    if (slugStatus === 'taken') nextErrors.slug = t('adminFoods.slugTaken');
    if (Object.keys(nextErrors).length) { setErrors(nextErrors); setSaveStatus(t('adminFoods.fixErrors')); return; }
    setSaving(true); setSaveStatus(t('adminFoods.saving'));
    try {
      const saved = await saveAdminFood({ ...values, status: intent === 'publish' ? 'PUBLISHED' : 'DRAFT' }, id);
      const next = foodToForm(saved); setValues(next); setSavedSnapshot(JSON.stringify(next)); setSaveStatus(intent === 'publish' ? t('adminFoods.published') : t('adminFoods.draftSaved'));
      if (!id) navigate(`/admin/foods/${saved.id}/edit`, { replace: true });
    } catch { setSaveStatus(t('adminFoods.saveError')); } finally { setSaving(false); }
  };
  const archive = async () => {
    if (!id) return;
    setSaving(true); setSaveStatus(t('adminFoods.saving'));
    try { const saved = await setFoodStatus(id, 'ARCHIVED'); const next = foodToForm(saved); setValues(next); setSavedSnapshot(JSON.stringify(next)); setArchiveOpen(false); setSaveStatus(t('adminFoods.archived')); }
    catch { setSaveStatus(t('adminFoods.saveError')); } finally { setSaving(false); }
  };
  if (loading) return <div className="page-content admin-page"><Skeleton className="editor-skeleton" /><Skeleton className="editor-skeleton" /></div>;
  if (loadError) return <div className="page-content admin-page"><ErrorState message={t('adminFoods.loadError')} onRetry={() => navigate(0)} /></div>;
  const title = id ? t('adminFoods.editTitle') : t('adminFoods.newTitle');
  return <div className="page-content admin-page"><div className="page-heading"><div><Link className="back-link" to="/admin/foods">← {t('adminFoods.backToList')}</Link><h2>{title}</h2><p className="muted">{t('adminFoods.editorDescription')}</p></div><StatusBadge status={values.status} /></div>
    <Card><h3>{t('adminFoods.identity')}</h3><div className="form-grid"><Field label={t('adminFoods.name')} error={errors.name}><Input value={values.name} onChange={(event) => { update('name', event.target.value); if (!slugTouched) update('slug', slugify(event.target.value)); }} /></Field><Field label={t('adminFoods.slug')} error={errors.slug}><Input value={values.slug} onChange={(event) => { setSlugTouched(true); update('slug', slugify(event.target.value)); }} />{slugStatus === 'checking' && <small>{t('adminFoods.slugChecking')}</small>}{slugStatus === 'available' && <small className="success-message">{t('adminFoods.slugAvailable')}</small>}</Field><SelectField label={t('adminFoods.category')} value={values.category} options={foodCategories} onChange={(value) => update('category', value as FoodFormValues['category'])} error={errors.category} /></div></Card>
    <Card><h3>{t('adminFoods.servingSection')}</h3><div className="form-grid"><Field label={t('adminFoods.servingSize')} error={errors.serving_size}><Input type="number" min="0" max="100000" step="any" value={values.serving_size} onChange={(event) => update('serving_size', Number(event.target.value))} /></Field><SelectField label={t('adminFoods.unit')} value={values.unit} options={foodUnits} onChange={(value) => update('unit', value as FoodFormValues['unit'])} error={errors.unit} /></div></Card>
    <Card><h3>{t('adminFoods.nutritionSection')}</h3><div className="form-grid">{(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => <Field key={key} label={t(`adminFoods.${key}`)} error={errors[key]}><Input type="number" min="0" step="any" value={values[key]} onChange={(event) => update(key, Number(event.target.value))} /></Field>)}</div>{nutritionWarning(values) && <p className="warning-banner" role="status">{t('adminFoods.consistencyWarning')}</p>}</Card>
    <Card><h3>{t('adminFoods.statusHeading')}</h3><SelectField label={t('adminFoods.statusLabel')} value={values.status} options={foodStatuses} onChange={(value) => update('status', value as FoodStatus)} /><p className="muted">{t(`adminFoods.statusDescription.${values.status.toLowerCase()}`)}</p></Card>
    {saveStatus && <p className={saveStatus === t('adminFoods.saveError') || saveStatus === t('adminFoods.fixErrors') ? 'field-error' : 'save-status'} role="status">{saveStatus}</p>}
    <div className="editor-actions"><Button disabled={saving} onClick={() => void save('draft')}>{t('adminFoods.saveDraft')}</Button><Button disabled={saving} onClick={() => void save('publish')}>{t('adminFoods.publish')}</Button>{id && values.status !== 'ARCHIVED' && <Button variant="secondary" disabled={saving} onClick={() => setArchiveOpen(true)}>{t('adminFoods.archive')}</Button>}</div>
    {archiveOpen && <ConfirmDialog title={t('adminFoods.archiveTitle')} description={t('adminFoods.archiveDescription')} confirmLabel={t('adminFoods.archive')} cancelLabel={t('adminFoods.cancel')} busy={saving} onCancel={() => setArchiveOpen(false)} onConfirm={() => void archive()} />}
  </div>;
}

function SelectField({ label: fieldLabel, value, options, onChange, error }: { label: string; value: string; options: readonly string[]; onChange: (value: string) => void; error?: string }) {
  return <Field label={fieldLabel} error={error}><select className="input" value={value} onChange={(event) => onChange(event.target.value)}>{options.map((option) => <option key={option} value={option}>{label(option)}</option>)}</select></Field>;
}
