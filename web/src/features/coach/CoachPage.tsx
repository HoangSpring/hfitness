import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, EmptyState, ErrorState, Skeleton, Spinner } from '../../components/ui';
import { ApiRequestError } from '../../lib/api';
import { t, translatedError } from '../../i18n/en';
import { deleteConversation, listConversations, listMessages, sendCoachMessage, type Conversation, type CoachMessage } from './coach';

const timeFormatter = new Intl.DateTimeFormat('en', { hour: 'numeric', minute: '2-digit' });
const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const suggestions = ['coach.promptTrain', 'coach.promptProgress', 'coach.promptFood'] as const;

export function CoachPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState<string>();
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [text, setText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [messageError, setMessageError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);
  const [busy, setBusy] = useState(false);
  const [mobileList, setMobileList] = useState(false);
  const [lastFailed, setLastFailed] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    setLoadingHistory(true); setHistoryError(false);
    try {
      const items = await listConversations();
      setConversations(items);
      setSelected((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id);
    } catch { setHistoryError(true); } finally { setLoadingHistory(false); }
  }, []);
  const loadMessages = useCallback(async (id: string) => {
    try { setMessages(await listMessages(id)); setMessageError(''); } catch { setMessageError(t('coach.historyError')); }
  }, []);
  useEffect(() => { void loadConversations(); }, [loadConversations]);
  useEffect(() => { if (selected) void loadMessages(selected); else setMessages([]); }, [selected, loadMessages]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [messages, busy]);

  const grouped = useMemo(() => {
    const today = new Date().toDateString();
    return { today: conversations.filter((item) => new Date(item.created_at).toDateString() === today), earlier: conversations.filter((item) => new Date(item.created_at).toDateString() !== today) };
  }, [conversations]);
  const send = async (value = text) => {
    const message = value.trim();
    if (!message || busy || message.length > 1000) return;
    setBusy(true); setMessageError(''); setRateLimited(false); setLastFailed(message); setText('');
    try {
      const result = await sendCoachMessage({ conversationId: selected, message });
      setSelected(result.conversation_id);
      setMessages((current) => [...current, { id: `user-${Date.now()}`, conversation_id: result.conversation_id, role: 'user', content: message, created_at: new Date().toISOString() }, { id: `assistant-${Date.now()}`, conversation_id: result.conversation_id, role: 'assistant', content: result.message, created_at: new Date().toISOString() }]);
      await loadConversations();
    } catch (reason) {
      const code = reason instanceof ApiRequestError ? reason.code : '';
      setRateLimited(code === 'AI_RATE_LIMIT');
      setMessageError(code === 'AI_RATE_LIMIT' ? t('coach.rateLimit') : translatedError(code, t('coach.responseError')));
      setText(message);
    } finally { setBusy(false); }
  };
  const newChat = () => { setSelected(undefined); setMessages([]); setMessageError(''); setRateLimited(false); setMobileList(false); };
  const remove = async (conversation: Conversation) => {
    if (!window.confirm(t('coach.deleteConfirm'))) return;
    try { await deleteConversation(conversation.id); const remaining = conversations.filter((item) => item.id !== conversation.id); setConversations(remaining); setSelected(remaining[0]?.id); } catch { setMessageError(t('coach.deleteError')); }
  };

  return <main className="page-content coach-page">
    <div className="coach-heading"><div><p className="eyebrow">{t('navigation.coach')}</p><h1>{t('coach.title')}</h1><p className="muted">{t('coach.subtitle')}</p></div><Button variant="secondary" onClick={() => setMobileList((open) => !open)}>{t('coach.today')}</Button></div>
    <div className="coach-layout">
      <aside className={mobileList ? 'coach-sidebar mobile-open' : 'coach-sidebar'}><Button onClick={newChat}>{t('coach.newChat')}</Button>{loadingHistory ? <><Skeleton /><Skeleton /></> : historyError ? <ErrorState message={t('coach.historyError')} onRetry={() => void loadConversations()} /> : conversations.length === 0 ? <p className="muted">{t('coach.noConversations')}</p> : <><ConversationGroup title={t('coach.today')} items={grouped.today} selected={selected} onSelect={(id) => { setSelected(id); setMobileList(false); }} onDelete={remove} /><ConversationGroup title={t('coach.earlier')} items={grouped.earlier} selected={selected} onSelect={(id) => { setSelected(id); setMobileList(false); }} onDelete={remove} /></>}</aside>
      <section className="coach-chat" aria-label={t('coach.title')}><div className="message-list">{messageError && <ErrorState message={messageError} onRetry={lastFailed ? () => void send(lastFailed) : undefined} />}{!messages.length && !busy && !messageError && <EmptyState title={t('coach.emptyTitle')} description={t('coach.emptyDescription')}><div className="suggestion-list">{suggestions.map((key) => <button type="button" className="suggestion-chip" key={key} onClick={() => void send(t(key))}>{t(key)}</button>)}</div></EmptyState>}{messages.map((message) => <article className={message.role === 'user' ? 'coach-message user-message' : 'coach-message assistant-message'} key={message.id}><div className="message-meta"><strong>{message.role === 'user' ? t('coach.user') : t('coach.assistant')}</strong><time>{timeFormatter.format(new Date(message.created_at))}</time></div><p className="plain-message">{message.content}</p></article>)}{busy && <div className="typing-indicator"><Spinner />{t('coach.typing')}</div>}<div ref={endRef} /></div><p className="coach-disclaimer">{t('coach.disclaimer')}</p><form className="coach-input" onSubmit={(event) => { event.preventDefault(); void send(); }}><textarea className="input coach-textarea" value={text} maxLength={1000} placeholder={t('coach.inputPlaceholder')} onChange={(event) => setText(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} disabled={busy || rateLimited} /><div className="coach-input-footer"><span className="muted">{t('coach.characterCount', { count: text.length })}</span><Button type="submit" disabled={busy || !text.trim() || rateLimited}>{busy && <Spinner />}{t('coach.send')}</Button></div></form></section>
    </div>
  </main>;
}

function ConversationGroup({ title, items, selected, onSelect, onDelete }: { title: string; items: Conversation[]; selected?: string; onSelect: (id: string) => void; onDelete: (conversation: Conversation) => void }) {
  return items.length ? <div className="conversation-group"><h2>{title}</h2>{items.map((item) => <div className={selected === item.id ? 'conversation-item selected' : 'conversation-item'} key={item.id}><button type="button" onClick={() => onSelect(item.id)}><strong>{item.title}</strong><time>{dateFormatter.format(new Date(item.created_at))}</time></button><button type="button" className="conversation-delete" onClick={() => onDelete(item)} aria-label={t('coach.delete')}>×</button></div>)}</div> : null;
}
