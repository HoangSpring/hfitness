import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card, EmptyState, ErrorState, Field, Input, Skeleton, Spinner } from '../../components/ui';
import { t } from '../../i18n/en';
import { calculateItemNutrition, addFood, dateKey, deleteMealItem, getNutritionDay, mealTypes, searchFoods, updateMealItem, type Food, type Meal, type MealItem, type MealType, type NutritionValues } from '../../lib/nutrition';

const labels: Record<MealType, string> = { BREAKFAST: 'nutrition.breakfast', LUNCH: 'nutrition.lunch', DINNER: 'nutrition.dinner', SNACK: 'nutrition.snack' };
const today = () => new Date();
const formatDate = (date: Date) => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
const formatNumber = (value: number) => new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(value);

function TargetCard({ targets, consumed }: { targets: NutritionValues; consumed: NutritionValues }) {
  const measures = [['calories', t('nutrition.calories'), 'kcal'], ['protein', t('nutrition.protein'), 'g'], ['carbs', t('nutrition.carbs'), 'g'], ['fat', t('nutrition.fat'), 'g']] as const;
  return <Card><h2>{t('nutrition.targets')}</h2><div className="nutrition-targets">{measures.map(([key, label, unit]) => { const remaining = targets[key] - consumed[key]; const progress = Math.min(100, Math.max(0, consumed[key] / targets[key] * 100)); return <div className="nutrition-target" key={key}><div><strong>{label}</strong><span>{formatNumber(consumed[key])} / {formatNumber(targets[key])}{unit}</span></div><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{remaining >= 0 ? t('nutrition.remaining', { value: formatNumber(remaining), unit }) : t('nutrition.overBy', { value: formatNumber(Math.abs(remaining)), unit })}</small></div>; })}</div></Card>;
}

function FoodSheet({ date, initialMeal, editItem, onClose, onSaved }: { date: Date; initialMeal: MealType; editItem?: MealItem; onClose: () => void; onSaved: () => Promise<void> }) {
  const [query, setQuery] = useState(editItem?.foods?.name ?? '');
  const [foods, setFoods] = useState<Food[]>(editItem?.foods ? [editItem.foods] : []);
  const [selected, setSelected] = useState<Food | undefined>(editItem?.foods ?? undefined);
  const [quantity, setQuantity] = useState(String(editItem?.quantity ?? 1));
  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { if (!query.trim() || selected) return; const timer = window.setTimeout(() => { void searchFoods(query).then(setFoods).catch(() => setError(t('nutrition.searchError'))); }, 300); return () => window.clearTimeout(timer); }, [query, selected]);
  const preview = selected ? (() => { try { return calculateItemNutrition(selected, Number(quantity)); } catch { return null; } })() : null;
  const save = async () => { if (!selected) return; setBusy(true); setError(''); try { if (editItem) await updateMealItem(editItem, Number(quantity)); else await addFood(selected, mealType, Number(quantity), date); await onSaved(); onClose(); } catch { setError(t('nutrition.saveError')); } finally { setBusy(false); } };
  return <div className="sheet-backdrop"><section className="food-sheet" role="dialog" aria-modal="true"><div className="page-heading"><h2>{editItem ? t('nutrition.editFood') : t('nutrition.addFood')}</h2><Button variant="secondary" onClick={onClose}>{t('nutrition.cancel')}</Button></div>{!editItem && <Field label={t('nutrition.searchFoods')}><Input autoFocus value={query} onChange={(event) => { setQuery(event.target.value); setSelected(undefined); }} /></Field>}{!selected && <div className="food-results">{query && foods.length === 0 ? <p className="muted">{t('nutrition.noFoods')}</p> : foods.map((food) => <button className="food-result" type="button" key={food.id} onClick={() => { setSelected(food); setQuery(food.name); }}><strong>{food.name}</strong><span>{food.serving_size} {food.unit} · {food.calories} kcal · {food.protein}g protein</span></button>)}</div>}{selected && <><Field label={t('nutrition.quantity')}><Input type="number" min="0.1" max="50" step="0.1" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></Field>{!editItem && <div className="meal-chips">{mealTypes.map((type) => <Button key={type} variant={mealType === type ? 'primary' : 'secondary'} onClick={() => setMealType(type)}>{t(labels[type])}</Button>)}</div>}{preview && <Card className="nutrition-preview"><strong>{formatNumber(preview.calories)} kcal</strong><span>{formatNumber(preview.protein)}g protein · {formatNumber(preview.carbs)}g carbs · {formatNumber(preview.fat)}g fat</span></Card>}<Button onClick={() => void save()} disabled={busy}>{busy && <Spinner />}{t('nutrition.save')}</Button></>}{error && <p className="alert" role="alert">! {error}</p>}</section></div>;
}

export function NutritionPage() {
  const [date, setDate] = useState(today);
  const [data, setData] = useState<{ meals: Meal[]; targets: NutritionValues | null }>();
  const [error, setError] = useState('');
  const [sheet, setSheet] = useState<{ meal: MealType; item?: MealItem }>();
  const load = useCallback(() => { setError(''); void getNutritionDay(date).then(setData).catch(() => setError(t('nutrition.loadError'))); }, [date]);
  useEffect(() => { load(); }, [load]);
  const meals = useMemo(() => new Map((data?.meals ?? []).map((meal) => [meal.meal_type, meal])), [data]);
  const consumed = useMemo(() => (data ? data.meals.flatMap((meal) => meal.meal_items).reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, carbs: sum.carbs + item.carbs, fat: sum.fat + item.fat }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) : { calories: 0, protein: 0, carbs: 0, fat: 0 }), [data]);
  const remove = async (item: MealItem) => { if (!window.confirm(t('nutrition.deleteConfirm'))) return; try { await deleteMealItem(item.id); await load(); } catch { setError(t('nutrition.deleteError')); } };
  if (!data && !error) return <main className="page-content nutrition-page"><Skeleton /><Skeleton /><Skeleton /></main>;
  return <main className="page-content nutrition-page"><div className="page-heading"><div><p className="eyebrow">{t('navigation.nutrition')}</p><h1>{t('nutrition.title')}</h1><p className="muted">{t('nutrition.description')}</p></div><Button onClick={() => setSheet({ meal: 'BREAKFAST' })}>{t('nutrition.addFood')}</Button></div>{error && <><ErrorState onRetry={load} /><p className="alert" role="alert">! {error}</p></>}{data?.targets ? <TargetCard targets={data.targets} consumed={consumed} /> : <EmptyState title={t('nutrition.noTargets')} description={t('nutrition.noTargetsDescription')}><Link className="button button-secondary" to="/profile">{t('nutrition.goProfile')}</Link></EmptyState>}<div className="nutrition-date"><Button variant="secondary" onClick={() => setDate((value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() - 1))}>←</Button><strong>{dateKey(date) === dateKey(today()) ? t('nutrition.today') : formatDate(date)}</strong><Button variant="secondary" onClick={() => setDate((value) => new Date(value.getFullYear(), value.getMonth(), value.getDate() + 1))}>→</Button></div><div className="meal-grid">{mealTypes.map((type) => { const meal = meals.get(type); return <Card className="meal-card" key={type}><div className="page-heading"><h2>{t(labels[type])}</h2><Button variant="secondary" onClick={() => setSheet({ meal: type })}>{t('nutrition.addFood')}</Button></div>{!meal || meal.meal_items.length === 0 ? <p className="muted">{t('nutrition.nothingLogged')}</p> : meal.meal_items.map((item) => <div className="meal-item" key={item.id}><div><strong>{item.foods?.name ?? t('nutrition.archivedFood')}</strong><span>{formatNumber(item.quantity)} {t('nutrition.servings')} · {formatNumber(item.calories)} kcal</span></div><div><Button variant="secondary" onClick={() => setSheet({ meal: type, item })}>{t('nutrition.edit')}</Button><Button variant="secondary" onClick={() => void remove(item)}>{t('nutrition.delete')}</Button></div></div>)}</Card>; })}</div>{sheet && <FoodSheet date={date} initialMeal={sheet.meal} editItem={sheet.item} onClose={() => setSheet(undefined)} onSaved={async () => load()} />}</main>;
}
