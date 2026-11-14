import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';
import { HeroMosaic } from './HeroMosaic';

export function HeroSection() {
  const { user } = useAuth();
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    const safety = window.setTimeout(() => setEntered(true), 3000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(safety);
    };
  }, []);
  const primaryLabel = user ? t('public.goDashboard') : t('public.getStarted');
  const primaryPath = user ? '/dashboard' : '/register';
  return <section className={`landing-hero ${entered ? 'is-entered' : ''}`}>
    <div className="hero-copy">
      <p className="hero-eyebrow">{t('public.heroEyebrow')}</p>
      <h1>{t('public.heroHeadline').split('|').map((line) => <span key={line}>{line}</span>)}</h1>
      <p className="hero-description">{t('public.heroDescription')}</p>
      <div className="hero-actions">
        <Link className="landing-pill hero-primary" to={primaryPath}>{primaryLabel}</Link>
        <Link className="hero-secondary" to="/exercises">{t('public.exploreExercises')} <span aria-label={t('public.arrowLabel')}>→</span></Link>
      </div>
    </div>
    <HeroMosaic />
  </section>;
}
