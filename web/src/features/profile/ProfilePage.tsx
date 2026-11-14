import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorState, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError, apiRequest } from '../../lib/api';
import { t } from '../../i18n/en';
import { friendlyError } from '../../lib/errors';
import { useAuth } from '../auth/useAuth';
import { equipmentOptions, getProfile, goals, onboardingSchema, profileToForm, saveProfile, type OnboardingValues, type Profile } from './profile';
import './ProfilePage.css';

type Assessment = { calorie_target: number; protein_g: number; carbs_g: number; fat_g: number };

const svg = (children: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Icon = {
  refresh: svg(<path d="M20 11a8 8 0 10-2.3 5.7M20 4v7h-7" />, 14),
  flame: svg(<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z" />, 22),
  user: svg(<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  body: svg(<><circle cx="12" cy="5" r="2" /><path d="M5 9h14M12 9v6M9 21l3-6 3 6" /></>),
  target: svg(<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  calendar: svg(<path d="M4 5h16v15H4zM4 10h16M9 3v4M15 3v4" />),
  fork: svg(<path d="M6 3v7a2 2 0 002 2v9M10 3v7M14 3c3 0 4 3 4 7h-4v11" />),
  dumbbell: svg(<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />),
  check: svg(<path d="M5 12l5 5 9-10" />, 14),
  close: svg(<path d="M6 6l12 12M18 6L6 18" />, 12),
  plus: svg(<path d="M12 5v14M5 12h14" />, 12),
  logout: svg(<path d="M9 21H5V3h4M16 17l5-5-5-5M21 12H9" />, 16),
  save: svg(<path d="M5 3h12l4 4v14H3V3zM7 3v6h8V3M7 21v-7h10v7" />, 16),
  lock: svg(<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>, 12),
};

const goalCopy: Record<string, string> = {
  lose_weight: 'Calorie deficit while keeping muscle.',
  gain_weight: 'Calorie-dense nutrition for mass.',
  build_muscle: 'Caloric surplus paired with progressive overload lifting.',
  get_stronger: 'Progressive overload on key lifts.',
  maintain: 'Stay active and keep your current weight.',
};
const experienceCopy: Record<string, string> = {
  beginner: 'New to structured training',
  intermediate: 'Familiar with compound barbell movements',
  advanced: 'Years of consistent, programmed training',
};
const commonAllergies = ['Dairy / Lactose', 'Gluten', 'Peanuts', 'Shellfish', 'Eggs', 'Soy'];
const sessionOptions = [30, 45, 60, 90];

const splitList = (value: unknown) => String(value ?? '').split(',').map((item) => item.trim()).filter(Boolean);
const joinList = (items: string[]) => items.join(', ');

function Segmented({ options, value, onChange, label }: { options: { value: number | string; label: string }[]; value: number | string; onChange: (value: never) => void; label: string }) {
  return <div className="pf-segmented" role="group" aria-label={label}>
    {options.map((option) => <button type="button" key={option.value} className={option.value === value ? 'selected' : ''} aria-pressed={option.value === value} onClick={() => onChange(option.value as never)}>{option.label}</button>)}
  </div>;
}

function Section({ icon, title, meta, children }: { icon: ReactNode; title: string; meta?: ReactNode; children: ReactNode }) {
  return <section className="pf-card">
    <header className="pf-card-head"><h2>{icon} {title}</h2>{meta && <span className="pf-meta">{meta}</span>}</header>
    {children}
  </section>;
}

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [values, setValues] = useState<OnboardingValues | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState(t('common.error'));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState(false);
  const [newFood, setNewFood] = useState('');

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false); setErrorMessage(t('common.error'));
    try {
      const nextProfile = await getProfile(user.id);
      setProfile(nextProfile);
      setValues(profileToForm(nextProfile));
      try { setAssessment(await apiRequest<Assessment>('/fitness/assessment')); } catch (assessmentError) {
        if (!(assessmentError instanceof ApiRequestError && assessmentError.code === 'ASSESSMENT_NOT_FOUND')) throw assessmentError;
      }
    } catch (reason) {
      setErrorMessage(friendlyError(reason, t('common.error')));
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  const update = (key: keyof OnboardingValues, value: string | number | string[]) => setValues((current) => current ? { ...current, [key]: value } : current);
  const changedTargetInputs = profile && values
    ? profile.age !== values.age || profile.gender !== values.gender || profile.height_cm !== values.height_cm || profile.weight_kg !== values.weight_kg || profile.goal !== values.goal || profile.days_per_week !== values.days_per_week
    : false;
  const save = async (shouldRecalculate: boolean) => {
    if (!user || !values) return;
    setSaving(true);
    setSaved(false);
    setValidationError(false);
    const valid = onboardingSchema.safeParse(values);
    if (!valid.success) {
      setValidationError(true);
      setSaving(false);
      return;
    }
    try {
      await saveProfile(user.id, valid.data, true);
      if (shouldRecalculate) setAssessment(await apiRequest<Assessment>('/fitness/assessment', { method: 'POST' }));
      setSaved(true);
      await load();
    } catch (reason) {
      setErrorMessage(friendlyError(reason, t('profile.saveError')));
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  const logout = async () => { await signOut(); navigate('/login', { replace: true }); };
  const cancel = () => { if (profile) { setValues(profileToForm(profile)); setSaved(false); setValidationError(false); } };

  if (loading) return <div className="page-content"><Skeleton className="profile-skeleton" /><Skeleton className="profile-skeleton" /><Skeleton className="profile-skeleton" /></div>;
  if (error || !values || !profile) return <div className="page-content"><ErrorState message={errorMessage} onRetry={() => void load()} /></div>;

  const allergyList = splitList(values.allergies);
  const allergyChoices = [...commonAllergies, ...allergyList.filter((item) => !commonAllergies.includes(item))];
  const toggleAllergy = (item: string) => update('allergies', joinList(allergyList.includes(item) ? allergyList.filter((current) => current !== item) : [...allergyList, item]));
  const foodList = splitList(values.disliked_foods);
  const addFood = () => {
    const food = newFood.trim();
    if (food && !foodList.includes(food)) update('disliked_foods', joinList([...foodList, food]));
    setNewFood('');
  };
  const toggleEquipment = (item: string) => update('equipment', values.equipment.includes(item) ? values.equipment.filter((current) => current !== item) : [...values.equipment, item]);
  const minuteOptions = [...new Set([...sessionOptions, values.session_minutes])].sort((a, b) => a - b);

  // Share of calories for the target bars
  const share = (grams: number, kcalPerGram: number) => assessment ? Math.min(100, Math.round((grams * kcalPerGram / assessment.calorie_target) * 100)) : 0;
  const targetCards = assessment ? [
    { label: t('profile.calories'), value: assessment.calorie_target.toLocaleString(), unit: 'kcal', percent: 100, accent: true },
    { label: t('profile.protein'), value: String(assessment.protein_g), unit: 'g', percent: share(assessment.protein_g, 4), accent: true },
    { label: t('profile.carbs'), value: String(assessment.carbs_g), unit: 'g', percent: share(assessment.carbs_g, 4), accent: false },
    { label: t('profile.fat'), value: String(assessment.fat_g), unit: 'g', percent: share(assessment.fat_g, 9), accent: false },
  ] : [];

  return <div className="page-content profile-page pf">
    {/* Recalculate banner */}
    {changedTargetInputs && <div className="pf-banner">
      <span className="pf-banner-icon">{Icon.refresh}</span>
      <p>{t('profile.recalculationPrompt')}</p>
      <button type="button" className="pf-btn pf-btn-primary pf-btn-sm" onClick={() => void save(true)} disabled={saving}>{Icon.refresh} {t('profile.recalculate')}</button>
    </div>}

    <header className="pf-header">
      <p className="pf-eyebrow">{t('navigation.profile')} <i className="pf-dot" /> {t('profile.active')}</p>
      <h1>{t('profile.title')}</h1>
      <p className="pf-muted">{t('profile.bodyDescription')}</p>
    </header>

    {/* Targets */}
    {assessment && <section className="pf-card pf-targets">
      <header className="pf-targets-head">
        <span className="pf-icon-box">{Icon.flame}</span>
        <div><h2>{t('profile.targets')}</h2><p className="pf-muted">{t('profile.targetDescription')}</p></div>
        <button type="button" className="pf-btn pf-btn-ghost" onClick={() => void save(true)} disabled={saving}>{Icon.refresh} {t('profile.recalculate')}</button>
      </header>
      <div className="target-grid pf-target-grid">
        {targetCards.map((card) => <div className="pf-target" key={card.label}>
          <span className="pf-label">{card.label}</span>
          <strong>{card.value}<small>{card.unit}</small></strong>
          <div className="pf-bar"><span className={card.accent ? '' : 'muted'} style={{ width: `${card.percent}%` }} /></div>
        </div>)}
      </div>
    </section>}

    <div className="pf-columns">
      <div className="pf-col">
        <Section icon={Icon.user} title={t('profile.personal')}>
          <div className="pf-grid-2">
            <label className="pf-field"><span className="pf-label">{t('onboarding.displayName')}</span><input className="pf-input" value={values.display_name} onChange={(event) => update('display_name', event.target.value)} /></label>
            <label className="pf-field"><span className="pf-label">{t('auth.email')} <em>{Icon.lock} {t('profile.readOnly')}</em></span><input className="pf-input" value={user?.email ?? ''} readOnly disabled /></label>
          </div>
        </Section>

        <Section icon={Icon.body} title={t('profile.body')} meta="Metric (cm/kg)">
          <div className="pf-grid-2">
            <label className="pf-field"><span className="pf-label">{t('onboarding.age')}</span><span className="pf-unit-input"><input type="number" value={values.age} onChange={(event) => update('age', Number(event.target.value))} /><i>{t('profile.years')}</i></span></label>
            <div className="pf-field"><span className="pf-label">{t('onboarding.gender')}</span><Segmented label={t('onboarding.gender')} value={values.gender} onChange={(value) => update('gender', value)} options={[{ value: 'male', label: t('onboarding.male') }, { value: 'female', label: t('onboarding.female') }]} /></div>
            <label className="pf-field"><span className="pf-label">{t('onboarding.height')}</span><span className="pf-unit-input"><input type="number" value={values.height_cm} onChange={(event) => update('height_cm', Number(event.target.value))} /><i>cm</i></span></label>
            <label className="pf-field"><span className="pf-label">{t('onboarding.weight')}</span><span className="pf-unit-input"><input type="number" value={values.weight_kg} onChange={(event) => update('weight_kg', Number(event.target.value))} /><i>kg</i></span></label>
          </div>
          <p className="pf-note">{t('profile.bodyCalculationNote')}</p>
        </Section>

        <Section icon={Icon.target} title={t('profile.goal')} meta={`Active: ${t(`onboarding.${values.goal}`)}`}>
          <p className="pf-muted">{t('profile.goalDescription')}</p>
          <div className="pf-goals" role="radiogroup" aria-label={t('onboarding.goalTitle')}>
            {goals.map((goal) => {
              const selected = values.goal === goal;
              return <button type="button" role="radio" aria-checked={selected} key={goal} className={selected ? 'pf-goal selected' : 'pf-goal'} onClick={() => update('goal', goal)}>
                <span><strong>{t(`onboarding.${goal}`)}</strong>{selected && <small>{goalCopy[goal]}</small>}</span>
                <i>{selected && Icon.check}</i>
              </button>;
            })}
          </div>
        </Section>
      </div>

      <div className="pf-col">
        <Section icon={Icon.calendar} title={t('profile.training')} meta={t('profile.sessionsWeekly', { count: values.days_per_week })}>
          <div className="pf-field"><span className="pf-label">{t('onboarding.experience')}</span>
            <div className="pf-experience">
              {(['beginner', 'intermediate', 'advanced'] as const).map((item) => <button type="button" key={item} className={values.experience === item ? 'selected' : ''} aria-pressed={values.experience === item} onClick={() => update('experience', item)}>
                <strong>{t(`onboarding.${item}`)}</strong><small>{experienceCopy[item]}</small>
              </button>)}
            </div>
          </div>
          <div className="pf-field"><span className="pf-label">{t('onboarding.days')} <b>{t('profile.daysSelected', { count: values.days_per_week })}</b></span>
            <Segmented label={t('onboarding.days')} value={values.days_per_week} onChange={(value) => update('days_per_week', Number(value))} options={[1, 2, 3, 4, 5, 6, 7].map((day) => ({ value: day, label: String(day) }))} />
          </div>
          <div className="pf-field"><span className="pf-label">{t('onboarding.minutes')}</span>
            <Segmented label={t('onboarding.minutes')} value={values.session_minutes} onChange={(value) => update('session_minutes', Number(value))} options={minuteOptions.map((minutes) => ({ value: minutes, label: `${minutes} min` }))} />
          </div>
        </Section>

        <Section icon={Icon.fork} title={t('profile.nutrition')} meta={t('profile.dietaryFilter')}>
          <div className="pf-field"><span className="pf-label">{t('onboarding.allergies')}</span>
            <div className="pf-chips">{allergyChoices.map((item) => {
              const on = allergyList.includes(item);
              return <button type="button" key={item} className={on ? 'pf-chip on' : 'pf-chip'} aria-pressed={on} onClick={() => toggleAllergy(item)}>{item}{on && Icon.check}</button>;
            })}</div>
          </div>
          <div className="pf-field"><span className="pf-label">{t('onboarding.dislikedFoods')}</span>
            <div className="pf-chips">
              {foodList.map((item) => <span className="pf-chip" key={item}>{item}<button type="button" aria-label={t('profile.removeFood', { name: item })} onClick={() => update('disliked_foods', joinList(foodList.filter((current) => current !== item)))}>{Icon.close}</button></span>)}
              <span className="pf-add"><input value={newFood} placeholder={t('profile.addFood')} onChange={(event) => setNewFood(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addFood(); } }} /><button type="button" aria-label={t('profile.addFood')} onClick={addFood}>{Icon.plus}</button></span>
            </div>
          </div>
          <div className="pf-field"><span className="pf-label">{t('onboarding.meals')} <b>{t('profile.mealsSplit', { count: values.meals_per_day })}</b></span>
            <Segmented label={t('onboarding.meals')} value={values.meals_per_day} onChange={(value) => update('meals_per_day', Number(value))} options={[2, 3, 4, 5, 6].map((meals) => ({ value: meals, label: String(meals) }))} />
          </div>
        </Section>

        <Section icon={Icon.dumbbell} title={t('profile.equipment')} meta={t('profile.gymAccess')}>
          <p className="pf-muted">{t('profile.equipmentDescription')}</p>
          <div className="pf-chips">{equipmentOptions.map((item) => {
            const on = values.equipment.includes(item);
            return <button type="button" key={item} className={on ? 'pf-chip on' : 'pf-chip'} aria-pressed={on} onClick={() => toggleEquipment(item)}><i className={on ? 'pf-box on' : 'pf-box'}>{on && Icon.check}</i>{t(`onboarding.${item}`)}</button>;
          })}</div>
        </Section>
      </div>
    </div>

    {validationError && <div className="alert" role="alert">! {t('onboarding.validation')}</div>}
    {saved && <p className="success-message" role="status">{t('profile.saved')}</p>}

    {/* Sticky action bar */}
    <div className="pf-actions">
      <button type="button" className="pf-logout" onClick={() => void logout()}>{Icon.logout} {t('navigation.logout')}</button>
      <div>
        <button type="button" className="pf-btn pf-btn-ghost" onClick={cancel} disabled={saving}>Cancel</button>
        <button type="button" className="pf-btn pf-btn-primary" onClick={() => void save(false)} disabled={saving}>{saving ? <Spinner /> : Icon.save} {t('profile.save')}</button>
      </div>
    </div>
  </div>;
}