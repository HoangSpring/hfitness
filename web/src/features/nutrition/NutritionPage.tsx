
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { Link } from 'react-router-dom';
import './nutrition.css';

import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  Input,
  Skeleton,
  Spinner,
} from '../../components/ui';

import { t, translatedError } from '../../i18n/en';
import { useLocale } from '../../i18n/LocaleContext';
import { formatDate, formatNumber } from '../../i18n/format';
import { friendlyError } from '../../lib/errors';

import {
  calculateItemNutrition,
  addFood,
  dateKey,
  deleteMealItem,
  getMealItemAmount,
  getMealItemName,
  getNutritionDay,
  mealTypes,
  searchFoods,
  updateMealItem,
  type Food,
  type Meal,
  type MealItem,
  type MealType,
  type NutritionValues,
} from '../../lib/nutrition';
import {
  blobToBase64,
  canSaveScan,
  recalculateScanItem,
  resizeFoodImage,
  saveScannedMeal,
  scanFoodPhoto,
  type EditableScanItem,
} from '../../lib/food-scan';
import { ApiRequestError } from '../../lib/api';

// ============================================
// CONFIGURATION
// ============================================

const labels: Record<MealType, string> = {
  BREAKFAST: 'nutrition.breakfast',
  LUNCH: 'nutrition.lunch',
  DINNER: 'nutrition.dinner',
  SNACK: 'nutrition.snack',
};

const mealIcons: Record<MealType, string> = {
  BREAKFAST: '☀',
  LUNCH: '☼',
  DINNER: '☾',
  SNACK: '◉',
};

const emptyNutrition: NutritionValues = {
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
};

const today = () => new Date();

function getMealTotals(meal?: Meal): NutritionValues {
  if (!meal) return { ...emptyNutrition };

  return meal.meal_items.reduce(
    (sum, item) => ({
      calories: sum.calories + item.calories,
      protein: sum.protein + item.protein,
      carbs: sum.carbs + item.carbs,
      fat: sum.fat + item.fat,
    }),
    { ...emptyNutrition }
  );
}

// ============================================
// MACRO CARD
// ============================================

function MacroCard({
  label,
  consumed,
  target,
  unit,
  color = 'red',
}: {
  label: string;
  consumed: number;
  target: number;
  unit: string;
  color?: string;
}) {
  const remaining = target - consumed;

  const progress =
    target > 0
      ? Math.min(100, Math.max(0, (consumed / target) * 100))
      : 0;

  return (
    <div className="macro-card">
      <div className="macro-top">
        <span className="macro-label">{label}</span>

        <span className={`macro-remaining ${remaining < 0 ? 'over' : ''}`}>
          {remaining >= 0
            ? `${formatNumber(remaining)} ${unit} left`
            : `${formatNumber(Math.abs(remaining))} ${unit} over`}
        </span>
      </div>

      <div className="macro-value">
        <strong>{formatNumber(consumed)}</strong>
        <span>
          / {formatNumber(target)} {unit}
        </span>
      </div>

      <div className="macro-progress">
        <div
          className={`macro-progress-fill ${color}`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ============================================
// DAILY TARGET & MACROS
// ============================================

function TargetCard({
  targets,
  consumed,
}: {
  targets: NutritionValues;
  consumed: NutritionValues;
}) {
  const measures = [
    {
      key: 'calories',
      label: 'CALORIES',
      unit: 'kcal',
      color: 'red',
    },
    {
      key: 'protein',
      label: 'PROTEIN',
      unit: 'g',
      color: 'red',
    },
    {
      key: 'carbs',
      label: 'CARBOHYDRATES',
      unit: 'g',
      color: 'white',
    },
    {
      key: 'fat',
      label: 'HEALTHY FATS',
      unit: 'g',
      color: 'white',
    },
  ] as const;

  const percentage =
    targets.calories > 0
      ? Math.min(
          100,
          Math.round((consumed.calories / targets.calories) * 100)
        )
      : 0;

  return (
    <Card className="nutrition-target-card">
      <div className="nutrition-section-header">
        <div>
          <h2>{t('nutrition.dailyTargetTitle')}</h2>
          <p>{t('nutrition.dailyTargetDescription')}</p>
        </div>

        <div className="target-completion">
          <span className="completion-dot" />
          {percentage}% {t('nutrition.targetCompleted')}
        </div>
      </div>

      <div className="macro-grid">
        {measures.map((item) => (
          <MacroCard
            key={item.key}
            label={item.label}
            consumed={consumed[item.key]}
            target={targets[item.key]}
            unit={item.unit}
            color={item.color}
          />
        ))}
      </div>
    </Card>
  );
}

// ============================================
// MEAL CARD
// ============================================

function MealCard({
  type,
  meal,
  onAdd,
  onEdit,
  onDelete,
}: {
  type: MealType;
  meal?: Meal;
  onAdd: () => void;
  onEdit: (item: MealItem) => void;
  onDelete: (item: MealItem) => void;
}) {
  const totals = getMealTotals(meal);
  const items = meal?.meal_items ?? [];

  return (
    <Card className="nutrition-meal-card">
      <div className="meal-header">
        <div className="meal-title-group">
          <div className="meal-icon">
            {mealIcons[type]}
          </div>

          <div>
            <h2>{t(labels[type])}</h2>

            <p>
              {formatNumber(totals.calories)} kcal
              {' • '}
              {formatNumber(totals.protein)}g Protein
            </p>
          </div>
        </div>

        <button
          className="meal-add-button"
          type="button"
          onClick={onAdd}
        >
          + {t('nutrition.addFoodAction')}
        </button>
      </div>

      {items.length > 0 ? (
        <div className="meal-items">
          {items.map((item) => (
            <div className="meal-item" key={item.id}>
              <div className="meal-item-info">
                <strong>
                  {getMealItemName(item)}
                </strong>

                <span>
                  {getMealItemAmount(item)}
                  {item.source === 'SCAN_ESTIMATE' && (
                    <em className="ai-estimate-badge">{t('nutrition.aiEstimate')}</em>
                  )}
                </span>

                <p>
                  {formatNumber(item.calories)} kcal
                  {' | '}
                  {formatNumber(item.protein)}g P
                  {' · '}
                  {formatNumber(item.carbs)}g C
                  {' · '}
                  {formatNumber(item.fat)}g F
                </p>
              </div>

              <div className="meal-item-actions">
                <button
                  type="button"
                  title={t('nutrition.editFoodLabel')}
                  aria-label={t('nutrition.editFoodLabel')}
                  onClick={() => onEdit(item)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.12 2.12 0 013 3L8 18l-4 1 1-4Z" />
                  </svg>
                </button>

                <button
                  type="button"
                  title={t('nutrition.deleteFoodLabel')}
                  aria-label={t('nutrition.deleteFoodLabel')}
                  onClick={() => onDelete(item)}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="17"
                    height="17"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  >
                    <path d="M3 6h18" />
                    <path d="M8 6V4h8v2" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v5M14 11v5" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="meal-empty">
          <div className="meal-empty-icon">♧</div>

          <strong>{t('nutrition.emptyMealTitle')}</strong>

          <p>
            {t('nutrition.emptyMealDescription')}
          </p>

          <button
            className="meal-empty-button"
            type="button"
            onClick={onAdd}
          >
            + {type === 'SNACK' ? t('nutrition.addSnack') : t('nutrition.addFoodAction')}
          </button>
        </div>
      )}
    </Card>
  );
}

// ============================================
// ADD / EDIT FOOD SHEET
// ============================================

function ScanEditor({
  items,
  setItems,
  onAddMissing,
}: {
  items: EditableScanItem[];
  setItems: Dispatch<SetStateAction<EditableScanItem[]>>;
  onAddMissing: () => void;
}) {
  const totals = items.reduce((sum, item) => ({
    calories: sum.calories + item.calories,
    protein: sum.protein + item.protein,
    carbs: sum.carbs + item.carbs,
    fat: sum.fat + item.fat,
  }), emptyNutrition);

  return (
    <div className="scan-results">
      <p className="scan-estimate-banner" role="note">{t('nutrition.scanBanner')}</p>
      {items.map((item, index) => (
        <div className="scan-result-item" key={`${item.food_id ?? item.item_name}-${index}`}>
          <div className="scan-result-heading">
            <strong>{item.item_name}</strong>
            <span className={`scan-source-badge ${item.source === 'SCAN_DB' ? 'database' : 'estimate'}`}>
              {item.source === 'SCAN_DB' ? t('nutrition.databaseMatch') : t('nutrition.aiEstimate')}
            </span>
            <button type="button" className="scan-remove" aria-label={t('nutrition.removeItem', { name: item.item_name })} onClick={() => setItems((current) => current.filter((_, currentIndex) => currentIndex !== index))}>{t('nutrition.removeItem', { name: item.item_name })}</button>
          </div>
          <label className="scan-amount-label">
            {t('nutrition.amount')}
            <input
              type="number"
              min={item.amount_unit === 'piece' ? 1 : 5}
              max={item.amount_unit === 'piece' ? 20 : 2000}
              step={item.amount_unit === 'piece' ? 1 : 1}
              value={item.amount}
              onChange={(event) => {
                const amount = Number(event.target.value);
                if (Number.isFinite(amount) && amount > 0) {
                  setItems((current) => current.map((currentItem, currentIndex) => currentIndex === index ? recalculateScanItem(currentItem, amount) : currentItem));
                }
              }}
            />
            <span>{item.amount_unit}</span>
          </label>
          <p className="scan-macros">
            {formatNumber(item.calories)} kcal · {formatNumber(item.protein)}g protein · {formatNumber(item.carbs)}g carbs · {formatNumber(item.fat)}g fat
          </p>
          {item.needs_check && (
            <label className="scan-check">
              <input type="checkbox" checked={item.checked} onChange={(event) => setItems((current) => current.map((currentItem, currentIndex) => currentIndex === index ? { ...currentItem, checked: event.target.checked } : currentItem))} />
              {t('nutrition.checkItem')}
            </label>
          )}
        </div>
      ))}
      <button type="button" className="food-result scan-add-missing" onClick={onAddMissing}>+ {t('nutrition.addMissing')}</button>
      <Card className="nutrition-preview scan-totals">
        <strong>{formatNumber(totals.calories)} kcal total</strong>
        <span>{formatNumber(totals.protein)}g protein · {formatNumber(totals.carbs)}g carbs · {formatNumber(totals.fat)}g fat</span>
      </Card>
    </div>
  );
}

function FoodSheet({
  date,
  initialMeal,
  editItem,
  onClose,
  onSaved,
  locale,
}: {
  date: Date;
  initialMeal: MealType;
  editItem?: MealItem;
  onClose: () => void;
  onSaved: () => Promise<void>;
  locale: 'en' | 'vi';
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const libraryInput = useRef<HTMLInputElement>(null);
  const abortController = useRef<AbortController | null>(null);
  const [query, setQuery] = useState(editItem?.foods?.name ?? '');
  const [foods, setFoods] = useState<Food[]>(
    editItem?.foods ? [editItem.foods] : []
  );
  const [selected, setSelected] = useState<Food | undefined>(
    editItem?.foods ?? undefined
  );

  const [quantity, setQuantity] = useState(
    String(editItem?.quantity ?? 1)
  );

  const [mealType, setMealType] = useState<MealType>(initialMeal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'search' | 'scan'>('search');
  const [scanItems, setScanItems] = useState<EditableScanItem[]>([]);
  const [previewUrl, setPreviewUrl] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'preview' | 'analyzing' | 'results'>('idle');
  const [showMissingSearch, setShowMissingSearch] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(() => window.localStorage.getItem('hfitness.food-scan-privacy') === 'acknowledged');

  useEffect(() => () => {
    abortController.current?.abort();
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const scanError = (reason: unknown): string => {
    if (reason instanceof ApiRequestError) {
      return translatedError(reason.code, t('nutrition.scanError'));
    }
    return reason instanceof Error ? reason.message : t('nutrition.scanError');
  };

  const choosePhoto = async (file?: File) => {
    if (!file) return;
    setError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(t('nutrition.scanUnsupported'));
      return;
    }
    try {
      const blob = await resizeFoodImage(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(blob));
      setScanState('preview');
      setBusy(false);
    } catch {
      setError(t('nutrition.scanPrepareError'));
    }
  };

  const analyze = async () => {
    if (!previewUrl) return;
    if (!privacyAcknowledged) {
      window.localStorage.setItem('hfitness.food-scan-privacy', 'acknowledged');
      setPrivacyAcknowledged(true);
    }
    setBusy(true);
    setError('');
    setScanState('analyzing');
    const controller = new AbortController();
    abortController.current = controller;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const result = await scanFoodPhoto(await blobToBase64(blob), 'image/jpeg', locale, controller.signal);
      setScanItems(result.items.map((item) => ({ ...item, checked: false })));
      setScanState('results');
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === 'AbortError') {
        setScanState('preview');
        return;
      }
      setError(scanError(reason));
      setScanState('preview');
    } finally {
      setBusy(false);
      abortController.current = null;
    }
  };

  useEffect(() => {
    if (!query.trim() || selected) return;

    const timer = window.setTimeout(() => {
      void searchFoods(query, locale)
        .then(setFoods)
        .catch((reason) =>
          setError(
            friendlyError(reason, t('nutrition.searchError'))
          )
        );
    }, 300);

    return () => window.clearTimeout(timer);
  }, [query, selected, locale]);

  const preview = useMemo(() => {
    if (!selected) return null;

    try {
      const amount = Number(quantity);

      if (!Number.isFinite(amount) || amount <= 0) return null;

      return calculateItemNutrition(selected, amount);
    } catch {
      return null;
    }
  }, [selected, quantity]);

  const save = async () => {
    const amount = Number(quantity);

    if (
      !selected ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 50
    ) {
      setError('Please enter a valid quantity.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (editItem) {
        await updateMealItem(editItem, amount);
      } else {
        await addFood(selected, mealType, amount, date);
      }

      await onSaved();
      onClose();
    } catch (reason) {
      setError(
        friendlyError(reason, t('nutrition.saveError'))
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="sheet-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="food-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="food-sheet-title"
      >
        <div className="food-sheet-header">
          <h2 id="food-sheet-title">
            {editItem
              ? t('nutrition.editFood')
              : t('nutrition.addFood')}
          </h2>

          <Button variant="secondary" onClick={onClose}>
            {t('nutrition.cancel')}
          </Button>
        </div>

        {!editItem && (
          <div className="food-sheet-tabs" role="tablist" aria-label={t('nutrition.scanMethodLabel')}>
            <button type="button" className={tab === 'search' ? 'active' : ''} role="tab" aria-selected={tab === 'search'} onClick={() => setTab('search')}>{t('nutrition.searchFoods')}</button>
            <button type="button" className={tab === 'scan' ? 'active' : ''} role="tab" aria-selected={tab === 'scan'} onClick={() => setTab('scan')}>{t('nutrition.scanTab')}</button>
          </div>
        )}

        {!editItem && tab === 'search' && (
          <Field label={t('nutrition.searchFoods')}>
            <Input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelected(undefined);
              }}
            />
          </Field>
        )}

        {!editItem && tab === 'scan' ? (
          <div className="scan-panel">
            {!privacyAcknowledged && <p className="scan-privacy">{t('nutrition.scanPrivacy')}</p>}
            {scanState === 'idle' && (
              <div className="scan-choice-buttons">
                <Button onClick={() => fileInput.current?.click()}>{t('nutrition.takePhoto')}</Button>
                <Button variant="secondary" onClick={() => libraryInput.current?.click()}>{t('nutrition.choosePhoto')}</Button>
              </div>
            )}
            <input ref={fileInput} className="scan-file-input" type="file" accept="image/*" capture="environment" onChange={(event) => void choosePhoto(event.target.files?.[0])} />
            <input ref={libraryInput} className="scan-file-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void choosePhoto(event.target.files?.[0])} />
            {previewUrl && scanState !== 'results' && (
              <div className="scan-preview">
                <img src={previewUrl} alt={t('nutrition.previewAlt')} />
                {scanState === 'analyzing' ? (
                  <div className="scan-preview-actions" aria-live="polite">
                    <span>{t('nutrition.analyzing')}</span>
                    <Button variant="secondary" onClick={() => abortController.current?.abort()}>{t('nutrition.cancel')}</Button>
                  </div>
                ) : (
                  <div className="scan-preview-actions">
                    <Button onClick={() => void analyze()}>{t('nutrition.analyzePhoto')}</Button>
                    <Button variant="secondary" onClick={() => abortController.current?.abort()}>{t('nutrition.cancel')}</Button>
                  </div>
                )}
              </div>
            )}
            {scanState === 'results' && (
              <>
                <ScanEditor items={scanItems} setItems={setScanItems} onAddMissing={() => setShowMissingSearch(true)} />
                {showMissingSearch && (
                  <>
                    <Field label={t('nutrition.searchFoods')}>
                      <Input value={query} onChange={(event) => { setQuery(event.target.value); setSelected(undefined); }} />
                    </Field>
                    <div className="food-results">
                      {foods.map((food) => (
                        <button className="food-result" type="button" key={food.id} onClick={() => {
                          const nutrition = calculateItemNutrition(food, 1);
                          setScanItems((current) => [...current, {
                            ...nutrition,
                            food_id: food.id,
                            item_name: food.name,
                            amount: food.serving_size,
                            amount_unit: food.unit as 'g' | 'ml' | 'piece',
                            confidence: 1,
                            source: 'SCAN_DB',
                            servings: 1,
                            needs_check: false,
                            checked: false,
                          }]);
                          setShowMissingSearch(false);
                          setQuery('');
                        }}>
                          <strong>{food.name}</strong>
                          <span>{food.serving_size} {food.unit} · {food.calories} kcal</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ) : !selected && (
          <div className="food-results">
            {query && foods.length === 0 ? (
              <p className="muted">{t('nutrition.noFoods')}</p>
            ) : (
              foods.map((food) => (
                <button
                  className="food-result"
                  type="button"
                  key={food.id}
                  onClick={() => {
                    if (tab === 'scan') {
                      const nutrition = calculateItemNutrition(food, 1);
                      setScanItems((current) => [...current, {
                        ...nutrition,
                        food_id: food.id,
                        item_name: food.name,
                        amount: food.serving_size,
                        amount_unit: food.unit as 'g' | 'ml' | 'piece',
                        confidence: 1,
                        source: 'SCAN_DB',
                        servings: 1,
                        needs_check: false,
                        checked: false,
                      }]);
                      setShowMissingSearch(false);
                      setQuery('');
                      return;
                    }
                    setSelected(food);
                    setQuery(food.name);
                  }}
                >
                  <strong>{food.name}</strong>
                  <span>
                    {food.serving_size} {food.unit}
                    {' · '}
                    {food.calories} kcal
                    {' · '}
                    {food.protein}g protein
                  </span>
                </button>
              ))
            )}
          </div>
        )}

        {selected && (
          <>
            <Field label={t('nutrition.quantity')}>
              <Input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={quantity}
                onChange={(event) =>
                  setQuantity(event.target.value)
                }
              />
            </Field>

            {!editItem && (
              <div className="meal-chips">
                {mealTypes.map((type) => (
                  <Button
                    key={type}
                    variant={
                      mealType === type ? 'primary' : 'secondary'
                    }
                    onClick={() => setMealType(type)}
                  >
                    {t(labels[type])}
                  </Button>
                ))}
              </div>
            )}

            {preview && (
              <Card className="nutrition-preview">
                <strong>
                  {formatNumber(preview.calories)} kcal
                </strong>

                <span>
                  {formatNumber(preview.protein)}g protein
                  {' · '}
                  {formatNumber(preview.carbs)}g carbs
                  {' · '}
                  {formatNumber(preview.fat)}g fat
                </span>
              </Card>
            )}

            <Button
              onClick={() => void save()}
              disabled={busy || !preview}
            >
              {busy && <Spinner />}
              {t('nutrition.save')}
            </Button>
          </>
        )}

        {!editItem && tab === 'scan' && scanState === 'results' && (
          <>
            <div className="meal-chips">
              {mealTypes.map((type) => (
                <Button key={type} variant={mealType === type ? 'primary' : 'secondary'} onClick={() => setMealType(type)}>
                  {t(labels[type])}
                </Button>
              ))}
            </div>
            <Button disabled={busy || !canSaveScan(scanItems)} onClick={() => {
              setBusy(true);
              void saveScannedMeal(mealType, scanItems, date).then(onSaved).then(onClose).catch((reason) => setError(friendlyError(reason, t('nutrition.saveError')))).finally(() => setBusy(false));
            }}>
              {busy && <Spinner />}
              {t('nutrition.saveToMeal')}
            </Button>
          </>
        )}

        {error && (
          <p className="alert" role="alert">
            ! {error}
          </p>
        )}
      </section>
    </div>
  );
}

// ============================================
// MAIN NUTRITION PAGE
// ============================================

export function NutritionPage() {
  const { locale } = useLocale();

  const [date, setDate] = useState(today);
  const [data, setData] = useState<{
    meals: Meal[];
    targets: NutritionValues | null;
  }>();

  const [error, setError] = useState('');

  const [sheet, setSheet] = useState<{
    meal: MealType;
    item?: MealItem;
  }>();

  // Load nutrition data
  const load = useCallback(async () => {
    setError('');

    try {
      const result = await getNutritionDay(date, locale);
      setData(result);
    } catch (reason) {
      setError(
        friendlyError(reason, t('nutrition.loadError'))
      );
    }
  }, [date, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  // Map meals by meal type
  const meals = useMemo(
    () =>
      new Map(
        (data?.meals ?? []).map((meal) => [
          meal.meal_type,
          meal,
        ])
      ),
    [data]
  );

  // Calculate daily nutrition
  const consumed = useMemo(() => {
    if (!data) return { ...emptyNutrition };

    return data.meals.reduce((sum, meal) => {
      const totals = getMealTotals(meal);

      return {
        calories: sum.calories + totals.calories,
        protein: sum.protein + totals.protein,
        carbs: sum.carbs + totals.carbs,
        fat: sum.fat + totals.fat,
      };
    }, { ...emptyNutrition });
  }, [data]);

  // Change date
  const changeDate = (days: number) => {
    setDate((current) => {
      return new Date(
        current.getFullYear(),
        current.getMonth(),
        current.getDate() + days
      );
    });
  };

  const isToday = dateKey(date) === dateKey(today());

  // Delete meal item
  const remove = async (item: MealItem) => {
    if (!window.confirm(t('nutrition.deleteConfirm'))) return;

    try {
      await deleteMealItem(item.id);
      await load();
    } catch (reason) {
      setError(
        friendlyError(reason, t('nutrition.deleteError'))
      );
    }
  };

  // Loading
  if (!data && !error) {
    return (
      <main className="page-content nutrition-page">
        <Skeleton />
        <Skeleton />
        <Skeleton />
      </main>
    );
  }

  return (
    <main className="page-content nutrition-page">

      {/* PAGE HEADER */}
      <div className="nutrition-header">
        <div className="nutrition-heading">
          <div className="nutrition-breadcrumb">
            <span>HFITNESS</span>
            <span>›</span>
            <strong>{t('nutrition.nutritionHeading')}</strong>
          </div>

          <h1>{t('nutrition.title')}</h1>
        </div>

        <div className="nutrition-header-actions">

          {/* DATE SELECTOR */}
          <div className="nutrition-date">
            <button
              type="button"
              aria-label={t('nutrition.previousDay')}
              onClick={() => changeDate(-1)}
            >
              ‹
            </button>

            <span className="nutrition-date-label">
              <span className="calendar-icon">▣</span>

              {isToday
                ? `${t('nutrition.today')}, ${formatDate(date)}`
                : formatDate(date)}
            </span>

            <button
              type="button"
              aria-label={t('nutrition.nextDay')}
              onClick={() => changeDate(1)}
              disabled={isToday}
            >
              ›
            </button>
          </div>

          <div className="nutrition-status">
            <span className={!error ? 'active' : ''}>
              Logged
            </span>

            <span className={!data?.targets ? 'active' : ''}>
              No Targets
            </span>
          </div>

          <Button
            onClick={() =>
              setSheet({ meal: 'BREAKFAST' })
            }
          >
            + {t('nutrition.addFood')}
          </Button>
        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="nutrition-error">
          <ErrorState onRetry={load} />

          <p className="alert" role="alert">
            ! {error}
          </p>
        </div>
      )}

      {/* DAILY TARGET */}
      {data?.targets ? (
        <TargetCard
          targets={data.targets}
          consumed={consumed}
        />
      ) : (
        <div className="nutrition-no-target">
          <EmptyState
            title={t('nutrition.noTargets')}
            description={t('nutrition.noTargetsDescription')}
          >
            <Link
              className="button button-secondary"
              to="/profile"
            >
              {t('nutrition.goProfile')}
            </Link>
          </EmptyState>
        </div>
      )}

      {/* MEALS */}
      <section className="nutrition-meals">
        {mealTypes.map((type) => (
          <MealCard
            key={type}
            type={type}
            meal={meals.get(type)}
            onAdd={() => setSheet({ meal: type })}
            onEdit={(item) =>
              setSheet({ meal: type, item })
            }
            onDelete={(item) => void remove(item)}
          />
        ))}
      </section>

      {/* FOOD MODAL */}
      {sheet && (
        <FoodSheet
          date={date}
          initialMeal={sheet.meal}
          editItem={sheet.item}
          locale={locale}
          onClose={() => setSheet(undefined)}
          onSaved={load}
        />
      )}
    </main>
  );
}
