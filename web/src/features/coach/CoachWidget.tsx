import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { ApiRequestError } from '../../lib/api';
import { friendlyError } from '../../lib/errors';
import { t, translatedError } from '../../i18n/en';
import { useLocale } from '../../i18n/LocaleContext';
import { parseCoachReply, sendCoachMessage, type CoachMessage } from './coach';
import { Spinner } from '../../components/ui';

type Position = { right: number; bottom: number };
type DragState = Position & { startX: number; startY: number };

const initialPosition = (): Position => ({
  right: 24,
  bottom: 92,
});

export function CoachWidget() {
  const { locale } = useLocale();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position>(initialPosition);
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [dragging, setDragging] = useState(false);
  const dragState = useRef<DragState | null>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (!dragging) return undefined;
    const move = (event: PointerEvent) => {
      const current = dragState.current;
      if (!current) return;
      const deltaX = event.clientX - current.startX;
      const deltaY = event.clientY - current.startY;
      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) moved.current = true;
      setPosition({
        right: Math.max(12, Math.min(window.innerWidth - 68, current.right - deltaX)),
        bottom: Math.max(76, Math.min(window.innerHeight - 68, current.bottom - deltaY)),
      });
    };
    const stop = () => {
      dragState.current = null;
      setDragging(false);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
  }, [dragging]);

  const send = async (value = text) => {
    const message = value.trim();
    if (!message || busy || message.length > 1000) return;
    setBusy(true);
    setError('');
    setRateLimited(false);
    setText('');
    const userMessage: CoachMessage = {
      id: `widget-user-${Date.now()}`,
      conversation_id: 'widget',
      role: 'user',
      content: message,
      created_at: new Date().toISOString(),
    };
    setMessages((current) => [...current, userMessage]);
    try {
      const result = await sendCoachMessage({ message, locale });
      setMessages((current) => [...current, {
        id: `widget-assistant-${Date.now()}`,
        conversation_id: result.conversation_id,
        role: 'assistant',
        content: result.message,
        created_at: new Date().toISOString(),
      }]);
    } catch (reason) {
      const code = reason instanceof ApiRequestError ? reason.code : '';
      setRateLimited(code === 'AI_RATE_LIMIT');
      setError(code === 'AI_RATE_LIMIT' ? t('coach.rateLimit') : friendlyError(reason, translatedError(code, t('coach.responseError'))));
      setText(message);
    } finally {
      setBusy(false);
    }
  };

  const startDrag = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    moved.current = false;
    dragState.current = { ...position, startX: event.clientX, startY: event.clientY };
    setDragging(true);
  };

  const toggle = () => {
    if (moved.current) {
      moved.current = false;
      return;
    }
    setOpen((current) => !current);
  };

  return <div className={`coach-widget${dragging ? ' is-dragging' : ''}`} style={{ right: position.right, bottom: position.bottom }}>
    {open && <section className="coach-widget-panel" aria-label={t('coach.title')}>
      <header className="coach-widget-header">
        <div><span className="coach-widget-status" aria-hidden="true" /><strong>{t('coach.title')}</strong></div>
        <button type="button" className="coach-widget-close" onClick={() => setOpen(false)} aria-label={t('coach.widgetClose')}>×</button>
      </header>
      <div className="coach-widget-messages">
        {!messages.length && !busy && !error && <p className="coach-widget-empty">{t('coach.emptyDescription')}</p>}
        {messages.map((message) => {
          const reply = message.role === 'assistant' ? parseCoachReply(message.content) : { plain: message.content };
          return <article className={`coach-widget-message ${message.role}`} key={message.id}>
            {'plain' in reply ? <p>{reply.plain}</p> : <><p><strong>{t('coach.recommendation')}</strong> {reply.recommendation}</p><p><strong>{t('coach.why')}</strong> {reply.reason}</p></>}
          </article>;
        })}
        {busy && <div className="coach-widget-typing"><Spinner />{t('coach.typing')}</div>}
        {error && <p className="coach-widget-error" role="alert">! {error}</p>}
      </div>
      <form className="coach-widget-form" onSubmit={(event) => { event.preventDefault(); void send(); }}>
        <textarea
          className="input"
          value={text}
          maxLength={1000}
          placeholder={t('coach.inputPlaceholder')}
          onChange={(event) => setText(event.target.value)}
          disabled={busy || rateLimited}
          aria-label={t('coach.inputPlaceholder')}
        />
        <button type="submit" className="coach-widget-send" disabled={busy || !text.trim() || rateLimited}>
          {busy && <Spinner />}{t('coach.send')}
        </button>
      </form>
    </section>}
    <button
      type="button"
      className="coach-fab"
      onPointerDown={startDrag}
      onClick={toggle}
      aria-label={open ? t('coach.widgetClose') : t('coach.widgetOpen')}
      title={t('coach.widgetDrag')}
    >
      <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 11.5a8.4 8.4 0 01-9 8.5 9.7 9.7 0 01-4-.8L3 21l1.8-4.1A8.3 8.3 0 013 11.5 8.5 8.5 0 0112 3a8.5 8.5 0 019 8.5z" />
        <path d="M8 11h.01M12 11h.01M16 11h.01" />
      </svg>
      <span className="sr-only">{open ? t('coach.widgetClose') : t('coach.widgetOpen')}</span>
    </button>
  </div>;
}
