import { Navigate, Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';

const steps = [
  ['1', 'public.stepOne', 'public.stepOneDescription'],
  ['2', 'public.stepTwo', 'public.stepTwoDescription'],
  ['3', 'public.stepThree', 'public.stepThreeDescription'],
] as const;
const features = [
  ['public.workoutFeature', 'public.workoutFeatureDescription'],
  ['public.exerciseFeature', 'public.exerciseFeatureDescription'],
  ['public.nutritionFeature', 'public.nutritionFeatureDescription'],
  ['public.progressFeature', 'public.progressFeatureDescription'],
] as const;
const faqs = [
  ['public.faqOne', 'public.faqOneAnswer'],
  ['public.faqTwo', 'public.faqTwoAnswer'],
  ['public.faqThree', 'public.faqThreeAnswer'],
  ['public.faqFour', 'public.faqFourAnswer'],
] as const;

export function LandingPage() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <main className="landing-page">
    <section className="landing-hero"><div className="hero-copy"><p className="eyebrow">{t('brand')}</p><h1>{t('tagline')}</h1><p className="hero-description">{t('public.heroDescription')}</p><div className="hero-actions"><Link className="button button-primary" to="/register">{t('public.getStarted')}</Link><Link className="button button-secondary" to="/exercises">{t('public.exploreExercises')}</Link></div></div><div className="hero-preview" aria-label={t('public.heroDescription')}><div className="preview-header"><span>{t('public.previewToday')}</span><strong>{t('public.previewDate')}</strong></div><div className="preview-card"><span className="preview-label">{t('public.previewWorkout')}</span><strong>{t('public.previewWorkoutName')}</strong><small>{t('public.previewWorkoutMeta')}</small></div><div className="preview-card"><span className="preview-label">{t('public.previewNutrition')}</span><strong>{t('public.previewCalories')}</strong><div className="preview-bars"><i /><i /><i /></div></div></div></section>
    <section className="landing-section" id="how-it-works"><div className="section-heading"><p className="eyebrow">{t('public.howItWorks')}</p><h2>{t('public.howItWorksDescription')}</h2></div><div className="steps-grid">{steps.map(([number, title, description]) => <Card key={number}><span className="step-number">{number}</span><h3>{t(title)}</h3><p className="muted">{t(description)}</p></Card>)}</div></section>
    <section className="landing-section" id="features"><div className="section-heading"><p className="eyebrow">{t('public.features')}</p><h2>{t('public.featuresTitle')}</h2><p className="muted">{t('public.featuresDescription')}</p></div><div className="feature-grid">{features.map(([title, description]) => <Card key={title}><div className="feature-icon">+</div><h3>{t(title)}</h3><p className="muted">{t(description)}</p></Card>)}</div></section>
    <section className="landing-section faq-section"><div className="section-heading"><p className="eyebrow">{t('public.faqLabel')}</p><h2>{t('public.faqTitle')}</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <Card key={question}><h3>{t(question)}</h3><p className="muted">{t(answer)}</p></Card>)}</div></section>
    <section className="landing-cta"><h2>{t('public.finalCtaTitle')}</h2><p>{t('public.finalCtaDescription')}</p><Link className="button button-primary" to="/register">{t('public.getStarted')}</Link></section>
    <footer className="landing-footer"><span className="brand-mark">HF<span>itness</span></span><p>{t('public.footer')}</p><small>© {new Date().getFullYear()} HFitness</small></footer>
  </main>;
}
