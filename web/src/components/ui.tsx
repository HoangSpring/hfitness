import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';
import { t } from '../i18n/en';

export function Button({ children, variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' }) {
  return <button className={`button button-${variant}`} {...props}>{children}</button>;
}
export function Input(props: InputHTMLAttributes<HTMLInputElement>) { return <input className="input" {...props} />; }
export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return <div className="field"><label>{label}{children}</label>{error && <p className="field-error" role="alert">! {error}</p>}</div>;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
export function Spinner() { return <span className="spinner" aria-label={t('common.loading')} />; }
export function Skeleton({ className = '' }: { className?: string }) { return <div className={`skeleton ${className}`} aria-hidden="true" />; }
export function EmptyState({ title, description, children }: { title: string; description: string; children?: ReactNode }) { return <Card className="empty-state"><h2>{title}</h2><p>{description}</p>{children}</Card>; }
export function ErrorState({ onRetry, message = t('common.error') }: { onRetry?: () => void; message?: string }) { return <Card className="error-state"><p role="alert">! {message}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>{t('common.retry')}</Button>}</Card>; }
export function Toast({ children }: { children: ReactNode }) { return <div className="toast" role="status">{children}</div>; }
export function ConfirmDialog({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, busy = false }: { title: string; description: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return <div className="dialog-backdrop"><section className="dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title"><h2 id="confirm-dialog-title">{title}</h2><p>{description}</p><div className="dialog-actions"><Button variant="secondary" onClick={onCancel} disabled={busy}>{cancelLabel}</Button><Button onClick={onConfirm} disabled={busy}>{busy && <Spinner />}{confirmLabel}</Button></div></section></div>;
}
