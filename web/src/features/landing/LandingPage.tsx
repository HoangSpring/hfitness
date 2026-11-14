import { Link } from 'react-router-dom';
import { Card } from '../../components/ui';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';
import { HeroSection } from './HeroSection';

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
  const primaryLabel = user ? t('public.goDashboard') : t('public.getStarted');
  const primaryPath = user ? '/dashboard' : '/register';
  return <main className="landing-page">
    <HeroSection />
    <section className="landing-section" id="how-it-works"><div className="section-heading"><p className="eyebrow">{t('public.howItWorks')}</p><h2>{t('public.howItWorksDescription')}</h2></div><div className="steps-grid">{steps.map(([number, title, description]) => <Card key={number}><span className="step-number">{number}</span><h3>{t(title)}</h3><p className="muted">{t(description)}</p></Card>)}</div></section>
    <section className="landing-section" id="features"><div className="section-heading"><p className="eyebrow">{t('public.features')}</p><h2>{t('public.featuresTitle')}</h2><p className="muted">{t('public.featuresDescription')}</p></div><div className="feature-grid">{features.map(([title, description]) => <Card key={title}><div className="feature-icon">+</div><h3>{t(title)}</h3><p className="muted">{t(description)}</p></Card>)}</div></section>
    <section className="landing-section faq-section"><div className="section-heading"><p className="eyebrow">{t('public.faqLabel')}</p><h2>{t('public.faqTitle')}</h2></div><div className="faq-list">{faqs.map(([question, answer]) => <Card key={question}><h3>{t(question)}</h3><p className="muted">{t(answer)}</p></Card>)}</div></section>
    <section className="landing-cta"><h2>{t('public.finalCtaTitle')}</h2><p>{t('public.finalCtaDescription')}</p><Link className="button button-primary" to={primaryPath}>{primaryLabel}</Link></section>
    <footer className="landing-footer"><Link className="brand-mark" to="/" aria-label={t('brand')}>HF<span>itness</span></Link><p>{t('public.footer')}</p><small>© {new Date().getFullYear()} HFitness</small></footer>
  </main>;
}
