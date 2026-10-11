import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, ErrorState, Field, Input, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError, apiRequest } from '../../lib/api';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';
import { equipmentOptions, getProfile, goals, onboardingSchema, profileToForm, saveProfile, type OnboardingValues, type Profile } from './profile';

type Assessment = { calorie_target: number; protein_g: number; carbs_g: number; fat_g: number };

export function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [values, setValues] = useState<OnboardingValues | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [validationError, setValidationError] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(false);
    try {
      const nextProfile = await getProfile(user.id);
      setProfile(nextProfile);
      setValues(profileToForm(nextProfile));
      try { setAssessment(await apiRequest<Assessment>('/fitness/assessment')); } catch (assessmentError) {
        if (!(assessmentError instanceof ApiRequestError && assessmentError.code === 'ASSESSMENT_NOT_FOUND')) throw assessmentError;
      }
    } catch {
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
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };
  const logout = async () => { await signOut(); navigate('/login', { replace: true }); };
  if (loading) return <div className="page-content"><Skeleton className="profile-skeleton" /><Skeleton className="profile-skeleton" /><Skeleton className="profile-skeleton" /></div>;
  if (error || !values || !profile) return <div className="page-content"><ErrorState onRetry={() => void load()} /></div>;
  return <div className="page-content profile-page"><div className="page-heading"><div><p className="eyebrow">{t('navigation.profile')}</p><h1>{t('profile.title')}</h1></div><Button variant="secondary" onClick={logout}>{t('navigation.logout')}</Button></div>{assessment && <Card><h2>{t('profile.targets')}</h2><div className="target-grid"><div><strong>{assessment.calorie_target}</strong><span>{t('profile.calories')}</span></div><div><strong>{assessment.protein_g}g</strong><span>{t('profile.protein')}</span></div><div><strong>{assessment.carbs_g}g</strong><span>{t('profile.carbs')}</span></div><div><strong>{assessment.fat_g}g</strong><span>{t('profile.fat')}</span></div></div></Card>}<Card><h2>{t('profile.personal')}</h2><Field label={t('onboarding.displayName')}><Input value={values.display_name} onChange={(event) => update('display_name', event.target.value)} /></Field></Card><Card><h2>{t('profile.body')}</h2><div className="form-grid"><Field label={t('onboarding.age')}><Input type="number" value={values.age} onChange={(event) => update('age', Number(event.target.value))} /></Field><Field label={t('onboarding.gender')}><select className="input" value={values.gender} onChange={(event) => update('gender', event.target.value)}><option value="male">{t('onboarding.male')}</option><option value="female">{t('onboarding.female')}</option></select></Field><Field label={t('onboarding.height')}><Input type="number" value={values.height_cm} onChange={(event) => update('height_cm', Number(event.target.value))} /></Field><Field label={t('onboarding.weight')}><Input type="number" value={values.weight_kg} onChange={(event) => update('weight_kg', Number(event.target.value))} /></Field></div></Card><Card><h2>{t('profile.goal')}</h2><Field label={t('onboarding.goalTitle')}><select className="input" value={values.goal} onChange={(event) => update('goal', event.target.value)}>{goals.map((goal) => <option value={goal} key={goal}>{t(`onboarding.${goal}`)}</option>)}</select></Field></Card><Card><h2>{t('profile.training')}</h2><div className="form-grid"><Field label={t('onboarding.experience')}><select className="input" value={values.experience} onChange={(event) => update('experience', event.target.value)}>{(['beginner', 'intermediate', 'advanced'] as const).map((item) => <option value={item} key={item}>{t(`onboarding.${item}`)}</option>)}</select></Field><Field label={t('onboarding.days')}><Input type="number" value={values.days_per_week} onChange={(event) => update('days_per_week', Number(event.target.value))} /></Field><Field label={t('onboarding.minutes')}><Input type="number" value={values.session_minutes} onChange={(event) => update('session_minutes', Number(event.target.value))} /></Field></div></Card><Card><h2>{t('profile.nutrition')}</h2><div className="form-grid"><Field label={t('onboarding.allergies')}><Input value={values.allergies} onChange={(event) => update('allergies', event.target.value)} /></Field><Field label={t('onboarding.dislikedFoods')}><Input value={values.disliked_foods} onChange={(event) => update('disliked_foods', event.target.value)} /></Field><Field label={t('onboarding.meals')}><Input type="number" value={values.meals_per_day} onChange={(event) => update('meals_per_day', Number(event.target.value))} /></Field></div></Card><Card><h2>{t('profile.equipment')}</h2><div className="option-grid">{equipmentOptions.map((item) => <button type="button" className={values.equipment.includes(item) ? 'choice selected' : 'choice'} onClick={() => update('equipment', values.equipment.includes(item) ? values.equipment.filter((current) => current !== item) : [...values.equipment, item])} key={item}>{t(`onboarding.${item}`)}</button>)}</div></Card>{changedTargetInputs && <div className="recalculate-note"><p>{t('profile.recalculationPrompt')}</p><Button variant="secondary" onClick={() => void save(true)} disabled={saving}>{t('profile.recalculate')}</Button></div>}{validationError && <div className="alert" role="alert">! {t('onboarding.validation')}</div>}{saved && <p className="success-message" role="status">{t('profile.saved')}</p>}<Button onClick={() => void save(false)} disabled={saving}>{saving && <Spinner />}{t('profile.save')}</Button></div>;
}
