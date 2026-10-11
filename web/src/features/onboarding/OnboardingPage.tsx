import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Card, Field, Input, Spinner } from '../../components/ui';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';
import { equipmentOptions, onboardingSchema, type OnboardingValues } from '../profile/profile';
import { saveProfile } from '../profile/profile';

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

export function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<FormState>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState(false);
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
    setSaveError(false);
    try {
      await saveProfile(user.id, result.data as OnboardingValues, true);
      navigate('/analyzing', { replace: true });
    } catch {
      setSaveError(true);
    } finally {
      setSaving(false);
    }
  };
  const stepContent = [
    <div className="option-grid" key="goal">{(['lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain'] as const).map((goal) => <button type="button" className={values.goal === goal ? 'choice selected' : 'choice'} onClick={() => update('goal', goal)} key={goal}>{t(`onboarding.${goal}`)}</button>)}</div>,
    <div className="form-grid" key="basic"><Field label={t('onboarding.displayName')}><Input value={values.display_name} onChange={(event) => update('display_name', event.target.value)} /></Field><Field label={t('onboarding.age')} error={errors.age}><Input type="number" min="14" max="90" value={values.age} onChange={(event) => update('age', event.target.value)} /></Field><Field label={t('onboarding.gender')} error={errors.gender}><select className="input" value={values.gender} onChange={(event) => update('gender', event.target.value)}><option value="">—</option><option value="male">{t('onboarding.male')}</option><option value="female">{t('onboarding.female')}</option></select></Field><Field label={t('onboarding.height')} error={errors.height_cm}><Input type="number" min="120" max="230" value={values.height_cm} onChange={(event) => update('height_cm', event.target.value)} /></Field><Field label={t('onboarding.weight')} error={errors.weight_kg}><Input type="number" min="30" max="250" value={values.weight_kg} onChange={(event) => update('weight_kg', event.target.value)} /></Field></div>,
    <div className="form-grid" key="training"><Field label={t('onboarding.experience')} error={errors.experience}><select className="input" value={values.experience} onChange={(event) => update('experience', event.target.value)}><option value="">—</option>{(['beginner', 'intermediate', 'advanced'] as const).map((item) => <option value={item} key={item}>{t(`onboarding.${item}`)}</option>)}</select></Field><Field label={t('onboarding.days')} error={errors.days_per_week}><Input type="number" min="1" max="7" value={values.days_per_week} onChange={(event) => update('days_per_week', event.target.value)} /></Field><Field label={t('onboarding.minutes')} error={errors.session_minutes}><Input type="number" min="15" max="180" value={values.session_minutes} onChange={(event) => update('session_minutes', event.target.value)} /></Field></div>,
    <div className="option-grid" key="equipment">{equipmentOptions.map((item) => <button type="button" className={values.equipment.includes(item) ? 'choice selected' : 'choice'} onClick={() => update('equipment', values.equipment.includes(item) ? values.equipment.filter((current) => current !== item) : [...values.equipment, item])} key={item}>{t(`onboarding.${item}`)}</button>)}</div>,
    <div className="form-grid" key="nutrition"><Field label={t('onboarding.allergies')}><Input value={values.allergies} onChange={(event) => update('allergies', event.target.value)} /></Field><Field label={t('onboarding.dislikedFoods')}><Input value={values.disliked_foods} onChange={(event) => update('disliked_foods', event.target.value)} /></Field><Field label={t('onboarding.meals')} error={errors.meals_per_day}><Input type="number" min="1" max="8" value={values.meals_per_day} onChange={(event) => update('meals_per_day', event.target.value)} /></Field></div>,
  ][step];
  return <div className="page-content onboarding-page"><div className="onboarding-header"><p className="eyebrow">{t('onboarding.stepOf', { step: step + 1 })}</p><div className="progress-track"><span style={{ width: `${((step + 1) / 5) * 100}%` }} /></div><h1>{t(['onboarding.goalTitle', 'onboarding.basicTitle', 'onboarding.trainingTitle', 'onboarding.equipmentTitle', 'onboarding.nutritionTitle'][step])}</h1><p className="muted">{t(['onboarding.goalDescription', 'onboarding.basicDescription', 'onboarding.trainingDescription', 'onboarding.equipmentDescription', 'onboarding.nutritionDescription'][step])}</p></div><Card>{stepContent}{errors.form && <p className="field-error">{errors.form}</p>}{saveError && <div className="alert" role="alert">! {t('onboarding.saveError')}</div>}<div className="onboarding-actions">{step > 0 && <Button type="button" variant="secondary" onClick={() => setStep((current) => current - 1)}>{t('onboarding.back')}</Button>}<Button type="button" onClick={next} disabled={saving}>{saving && <Spinner />}{step === 4 ? t('onboarding.finish') : t('onboarding.continue')}</Button></div></Card></div>;
}

