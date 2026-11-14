import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { t } from '../../i18n/en';
import { useAuth } from '../auth/useAuth';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';

export function LandingHeader() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setEntered(true));
    const safety = window.setTimeout(() => setEntered(true), 3000);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(safety);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (panelRef.current?.contains(event.target as Node) || menuButtonRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const closeMenu = () => setOpen(false);
  const action = user ? { label: t('public.goDashboard'), path: '/dashboard' } : { label: t('public.getStarted'), path: '/register' };

  return <header className={`landing-header-wrap ${entered ? 'is-entered' : ''}`}>
    <div className={`landing-header ${open ? 'menu-open' : ''}`}>
      <Link to="/" className="landing-logo" aria-label={t('brand')} onClick={closeMenu}><span>HF</span><strong>itness</strong></Link>
      <nav className="landing-nav" aria-label={t('shell.menu')}>
        <a href="/#features" onClick={closeMenu}>{t('public.features')}</a>
        <Link to="/exercises" onClick={closeMenu}>{t('navigation.exercises')}</Link>
      </nav>
      <div className="landing-actions">
        <LanguageSwitcher />
        {loading ? <><span className="landing-login-placeholder" aria-hidden="true" /><span className="landing-action-placeholder" aria-hidden="true" /></> : <>{!user && <Link className="landing-login" to="/login" onClick={closeMenu}>{t('public.login')}</Link>}<Link className="landing-pill" to={action.path} onClick={closeMenu}>{action.label}</Link></>}
      </div>
      <button ref={menuButtonRef} className="landing-menu-button" type="button" aria-label={t('public.menu')} aria-expanded={open} aria-controls="landing-mobile-menu" onClick={() => setOpen((value) => !value)}>
        <span /><span /><span />
      </button>
      <div ref={panelRef} id="landing-mobile-menu" className={`landing-mobile-menu ${open ? 'is-open' : ''}`}>
        <a href="/#features" onClick={closeMenu}>{t('public.features')}</a>
        <Link to="/exercises" onClick={closeMenu}>{t('navigation.exercises')}</Link>
        <LanguageSwitcher />
        {!loading && !user && <Link to="/login" onClick={closeMenu}>{t('public.login')}</Link>}
        {!loading && <Link className="landing-pill" to={action.path} onClick={closeMenu}>{action.label}</Link>}
      </div>
    </div>
  </header>;
}
