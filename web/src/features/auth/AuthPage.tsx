import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Button, Card, Field, Input, Spinner } from '../../components/ui';
import { t } from '../../i18n/en';
import { useAuth } from './useAuth';

const emailSchema = z.string().email(t('auth.invalidEmail'));
const passwordSchema = z.string().min(8, t('auth.passwordShort'));

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const isRegister = mode === 'register';
  const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({}); const [serverError, setServerError] = useState(''); const [submitting, setSubmitting] = useState(false); const [showPassword, setShowPassword] = useState(false);
  const { signIn, signUp } = useAuth(); const navigate = useNavigate(); const location = useLocation();
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setErrors({}); setServerError('');
    const next: Record<string, string> = {};
    if (!emailSchema.safeParse(email).success) next.email = t('auth.invalidEmail');
    if (!passwordSchema.safeParse(password).success) next.password = t('auth.passwordShort');
    if (isRegister && password !== confirm) next.confirm = t('auth.passwordMismatch');
    if (Object.keys(next).length) { setErrors(next); return; }
    setSubmitting(true);
    try { if (isRegister) await signUp(email, password); else await signIn(email, password); navigate(isRegister ? '/dashboard' : (location.state as { from?: string } | null)?.from ?? '/dashboard', { replace: true }); }
    catch { setServerError(isRegister ? t('auth.genericError') : t('auth.login.error')); }
    finally { setSubmitting(false); }
  };
  return <div className="auth-page"><div className="auth-container"><header className="auth-header"><div className="brand-mark">HF<span>itness</span></div><p>{t('tagline')}</p></header><Card className="auth-card"><div className="auth-tabs"><Link className={!isRegister ? 'selected' : ''} to="/login">{t('auth.login.submit')}</Link><Link className={isRegister ? 'selected' : ''} to="/register">{t('auth.register.submit')}</Link></div>{serverError && <div className="alert" role="alert">! {serverError}</div>}<form onSubmit={submit} noValidate><Field label={t('auth.email')} error={errors.email}><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('auth.emailPlaceholder')} autoComplete="email" /></Field><Field label={t('auth.password')} error={errors.password}><span className="input-wrap"><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('auth.passwordPlaceholder')} autoComplete={isRegister ? 'new-password' : 'current-password'} /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? t('auth.hidePassword') : t('auth.showPassword')}</button></span></Field>{isRegister && <Field label={t('auth.confirmPassword')} error={errors.confirm}><Input type={showPassword ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder={t('auth.confirmPassword')} autoComplete="new-password" /></Field>}<Button type="submit" disabled={submitting}>{submitting && <Spinner />}{isRegister ? t('auth.register.submit') : t('auth.login.submit')}</Button></form><p className="auth-switch">{isRegister ? t('auth.register.switchPrompt') : t('auth.login.switchPrompt')} <Link to={isRegister ? '/login' : '/register'}>{isRegister ? t('auth.register.switch') : t('auth.login.switch')}</Link></p></Card></div></div>;
}
