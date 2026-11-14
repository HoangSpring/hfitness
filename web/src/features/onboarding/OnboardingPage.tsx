import { useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Field, Input, Spinner } from '../../components/ui';
import { t } from '../../i18n/en';
import { friendlyError } from '../../lib/errors';
import { useAuth } from '../auth/useAuth';
import { equipmentOptions, onboardingSchema, type OnboardingValues } from '../profile/profile';
import { saveProfile } from '../profile/profile';
import './OnboardingPage.css';

type FormState = {
  display_name: string;
  goal: string;
  age: string;
  gender: string;
  height_cm: string;
  weight_kg: string;
  experience: string;
  days_per_week: string;
  session_minutes: string;
  equipment: string[];
  allergies: string;
  disliked_foods: string;
  meals_per_day: string;
};

const initialValues: FormState = {
  display_name: '', goal: '', age: '', gender: '', height_cm: '', weight_kg: '',
  experience: '', days_per_week: '', session_minutes: '', equipment: [],
  allergies: '', disliked_foods: '', meals_per_day: '',
};

const stepSchemas = [
  z.object({ goal: z.enum(['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain']) }),
  z.object({ age: z.coerce.number().int().min(14).max(90), gender: z.enum(['male', 'female']), height_cm: z.coerce.number().min(120).max(230), weight_kg: z.coerce.number().min(30).max(250) }),
  z.object({ experience: z.enum(['beginner', 'intermediate', 'advanced']), days_per_week: z.coerce.number().int().min(1).max(7), session_minutes: z.coerce.number().int().min(15).max(180) }),
  z.object({ equipment: z.array(z.string()).min(1) }),
  onboardingSchema,
];

function normalizedValues(values: FormState) {
  return {
    ...values,
    age: Number(values.age),
    height_cm: Number(values.height_cm),
    weight_kg: Number(values.weight_kg),
    days_per_week: Number(values.days_per_week),
    session_minutes: Number(values.session_minutes),
    meals_per_day: Number(values.meals_per_day),
  };
}

const svg = (children: ReactNode, size = 20) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

const goalIcons: Record<string, ReactNode> = {
  lose_weight: svg(<path d="M12 3c1 3 5 5 5 10a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-6 1-9z" />),
  gain_weight: svg(<path d="M3 17l6-6 4 4 8-8M15 7h6v6" />),
  build_muscle: svg(<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />),
  get_stronger: svg(<path d="M13 2L4 14h7l-1 8 9-12h-7z" />),
  maintain: svg(<path d="M3 12h4l3-7 4 14 3-7h4" />),
};

const goalCopy: Record<string, string> = {
  lose_weight: 'Burn body fat and create a sustainable calorie deficit without losing muscle.',
  gain_weight: 'Add healthy scale weight and build mass through calorie-dense nutrition.',
  build_muscle: 'Maximize muscle hypertrophy and sculpt a lean, athletic physique.',
  get_stronger: 'Focus on progressive overload and lifting heavier weights on key movements.',
  maintain: 'Keep your current weight, stay active, and improve daily energy levels.',
};

const goals = ['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain'] as const;
const stepLabels = ['Goal setting', 'Body metrics', 'Training profile', 'Equipment', 'Nutrition preferences'];
const checkIcon = svg(<path d="M5 12l5 5 9-10" />, 14);

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState(t('onboarding.saveError'));
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const update = (key: keyof FormState, value: string | string[]) => setValues((current) => ({ ...current, [key]: value }));
  const validateStep = () => {
    const result = stepSchemas[step].safeParse(step === 4 ? normalizedValues(values) : Object.fromEntries(Object.keys(stepSchemas[step].shape).map((key) => [key, values[key as keyof FormState]])));
    if (result.success) {
      setErrors({});
      return true;
    }
    const next: Record<string, string> = {};
    result.error.issues.forEach((issue) => { next[String(issue.path[0])] = t('onboarding.validation'); });
    setErrors(next);
    return false;
  };
  const next = () => {
    if (!validateStep()) return;
    if (step < 4) setStep((current) => current + 1);
    else void finish();
  };
  const finish = async () => {
    const result = onboardingSchema.safeParse(normalizedValues(values));
    if (!result.success || !user) {
      setErrors({ form: t('onboarding.validation') });
      return;
    }
    setSaving(true);
    setSaveError(false); setSaveErrorMessage(t('onboarding.saveError'));
    try {
      await saveProfile(user.id, result.data as OnboardingValues, true);
      navigate('/analyzing', { replace: true });
    } catch (reason) {
      setSaveErrorMessage(friendlyError(reason, t('onboarding.saveError')));
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };

  const toggleEquipment = (item: string) => update('equipment', values.equipment.includes(item) ? values.equipment.filter((current) => current !== item) : [...values.equipment, item]);

  const stepContent = [
    // Step 1 — goal
    <div className="ob-goals" key="goal" role="radiogroup" aria-label={t('onboarding.goalTitle')}>
      {goals.map((goal) => {
        const selected = values.goal === goal;
        return <button type="button" role="radio" aria-checked={selected} className={`ob-choice ob-goal ${selected ? 'selected' : ''} ${goal === 'maintain' ? 'wide' : ''}`} onClick={() => update('goal', goal)} key={goal}>
          <span className="ob-choice-icon">{goalIcons[goal]}</span>
          <span className="ob-choice-body">
            <strong>{t(`onboarding.${goal}`)}{goal === 'build_muscle' && <em className="ob-badge">Recommended</em>}</strong>
            <span>{goalCopy[goal]}</span>
          </span>
          <span className="ob-radio">{selected && checkIcon}</span>
        </button>;
      })}
    </div>,

    // Step 2 — basics
    <div className="ob-panel form-grid" key="basic"><Field label={t('onboarding.displayName')}><Input value={values.display_name} onChange={(event) => update('display_name', event.target.value)} /></Field><Field label={t('onboarding.age')} error={errors.age}><Input type="number" min="14" max="90" value={values.age} onChange={(event) => update('age', event.target.value)} /></Field><Field label={t('onboarding.gender')} error={errors.gender}><select className="input" value={values.gender} onChange={(event) => update('gender', event.target.value)}><option value="">—</option><option value="male">{t('onboarding.male')}</option><option value="female">{t('onboarding.female')}</option></select></Field><Field label={t('onboarding.height')} error={errors.height_cm}><Input type="number" min="120" max="230" value={values.height_cm} onChange={(event) => update('height_cm', event.target.value)} /></Field><Field label={t('onboarding.weight')} error={errors.weight_kg}><Input type="number" min="30" max="250" value={values.weight_kg} onChange={(event) => update('weight_kg', event.target.value)} /></Field></div>,

    // Step 3 — training
    <div className="ob-panel form-grid" key="training"><Field label={t('onboarding.experience')} error={errors.experience}><select className="input" value={values.experience} onChange={(event) => update('experience', event.target.value)}><option value="">—</option>{(['beginner', 'intermediate', 'advanced'] as const).map((item) => <option value={item} key={item}>{t(`onboarding.${item}`)}</option>)}</select></Field><Field label={t('onboarding.days')} error={errors.days_per_week}><Input type="number" min="1" max="7" value={values.days_per_week} onChange={(event) => update('days_per_week', event.target.value)} /></Field><Field label={t('onboarding.minutes')} error={errors.session_minutes}><Input type="number" min="15" max="180" value={values.session_minutes} onChange={(event) => update('session_minutes', event.target.value)} /></Field></div>,

    // Step 4 — equipment (multi-select)
    <div className="ob-equipment" key="equipment" role="group" aria-label={t('onboarding.equipmentTitle')}>
      {equipmentOptions.map((item) => {
        const selected = values.equipment.includes(item);
        return <button type="button" aria-pressed={selected} className={selected ? 'ob-choice ob-equip selected' : 'ob-choice ob-equip'} onClick={() => toggleEquipment(item)} key={item}>
          <span className="ob-choice-icon">{goalIcons.build_muscle}</span>
          <span className="ob-choice-body"><strong>{t(`onboarding.${item}`)}</strong></span>
          <span className="ob-radio ob-check">{selected && checkIcon}</span>
        </button>;
      })}
    </div>,

    // Step 5 — nutrition
    <div className="ob-panel form-grid" key="nutrition"><Field label={t('onboarding.allergies')}><Input value={values.allergies} onChange={(event) => update('allergies', event.target.value)} /></Field><Field label={t('onboarding.dislikedFoods')}><Input value={values.disliked_foods} onChange={(event) => update('disliked_foods', event.target.value)} /></Field><Field label={t('onboarding.meals')} error={errors.meals_per_day}><Input type="number" min="1" max="8" value={values.meals_per_day} onChange={(event) => update('meals_per_day', event.target.value)} /></Field></div>,
  ][step];

  return <div className="page-content onboarding-page ob">
    {/* Brand bar */}
    <div className="ob-brand"><span className="ob-logo">H</span><strong>HFITNESS</strong></div>

    <div className="ob-inner">
      {/* Step indicator */}
      <div className="ob-steps">
        <p className="ob-step-label"><span className="ob-step-num">{step + 1}</span>{t('onboarding.stepOf', { step: step + 1 })}</p>
        <div className="ob-segments" role="progressbar" aria-valuemin={1} aria-valuemax={5} aria-valuenow={step + 1}>
          {[0, 1, 2, 3, 4].map((index) => <span key={index} className={index <= step ? 'on' : ''} />)}
        </div>
      </div>

      {/* Heading */}
      <header className="ob-header">
        <p className="ob-eyebrow">{svg(<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" />, 14)} {stepLabels[step]}</p>
        <h1>{t(['onboarding.goalTitle', 'onboarding.basicTitle', 'onboarding.trainingTitle', 'onboarding.equipmentTitle', 'onboarding.nutritionTitle'][step])}</h1>
        <p className="ob-muted">{t(['onboarding.goalDescription', 'onboarding.basicDescription', 'onboarding.trainingDescription', 'onboarding.equipmentDescription', 'onboarding.nutritionDescription'][step])}</p>
      </header>

      {stepContent}

      {errors.form && <p className="field-error">{errors.form}</p>}
      {errors.goal && <p className="field-error" role="alert">! {errors.goal}</p>}
      {errors.equipment && <p className="field-error" role="alert">! {errors.equipment}</p>}
      {saveError && <div className="alert" role="alert">! {saveErrorMessage}</div>}

      {/* Actions */}
      <div className="ob-actions">
        {step > 0
          ? <button type="button" className="ob-back" onClick={() => setStep((current) => current - 1)}>{svg(<path d="M19 12H5M11 6l-6 6 6 6" />, 16)} {t('onboarding.back')}</button>
          : <span />}
        <button type="button" className="ob-continue" onClick={next} disabled={saving}>
          {saving && <Spinner />}{step === 4 ? t('onboarding.finish') : t('onboarding.continue')} {svg(<path d="M5 12h14M13 6l6 6-6 6" />, 18)}
        </button>
      </div>
    </div>

    {/* Status bar */}
    <div className="ob-status"><span><i /> Telemetry system active</span><span>HFit protocol v2.4</span></div>
  </div>;
}