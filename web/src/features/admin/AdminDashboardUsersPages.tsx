import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Card, EmptyState, ErrorState, Skeleton } from '../../components/ui';
import { goals } from '../profile/profile';
import { t } from '../../i18n/en';
import { tEnum } from '../../i18n/enum';
import { activeLocale } from '../../i18n/format';
import { getAdminUserSummary, getAdminUsers, getDashboardStats, type AdminUser, type AdminUserSummary, type DashboardStats } from './adminData';
import './AdminPages.css';

const pageSize = 20;
function label(value: string | null) { return value ? tEnum('goal', value) : t('adminUsers.notSet'); }
function dateLabel(value: string | null) { return value ? new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : t('adminUsers.notAvailable'); }
function shortDate(value: string | null) { return value ? new Intl.DateTimeFormat(activeLocale(), { dateStyle: 'medium' }).format(new Date(value)) : t('adminUsers.notAvailable'); }
function initials(user: Pick<AdminUser, 'display_name' | 'email'>) { return (user.display_name || user.email || '?').slice(0, 1).toUpperCase(); }
function twoInitials(user: Pick<AdminUser, 'display_name' | 'email'>) {
  const parts = (user.display_name || user.email || '?').split(/[\s@._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts[1]?.[0] ?? '')).toUpperCase();
}
/** "12 minutes ago" style label + whether the activity is within the last hour. */
function relativeTime(value: string | null): { text: string; recent: boolean } {
  if (!value) return { text: t('adminUsers.notAvailable'), recent: false };
  const seconds = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(activeLocale(), { numeric: 'auto' });
  const abs = Math.abs(seconds);
  let text: string;
  if (abs < 3600) text = formatter.format(Math.round(seconds / 60), 'minute');
  else if (abs < 86400) text = formatter.format(Math.round(seconds / 3600), 'hour');
  else if (abs < 86400 * 30) text = formatter.format(Math.round(seconds / 86400), 'day');
  else text = shortDate(value);
  return { text, recent: abs < 3600 };
}

const svg = (children: ReactNode, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const Icon = {
  users: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M16 4.5a3.5 3.5 0 010 7M18 14.8c2.4.6 4 2.2 4 5.2" /></>),
  userPlus: svg(<><circle cx="9" cy="8" r="3.5" /><path d="M2 20c0-3.5 3-5.5 7-5.5s7 2 7 5.5M19 8v6M16 11h6" /></>),
  dumbbell: svg(<path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" />),
  fork: svg(<path d="M6 3v7a2 2 0 002 2v9M10 3v7M14 3c3 0 4 3 4 7h-4v11" />),
  bot: svg(<><rect x="4" y="8" width="16" height="12" rx="3" /><path d="M12 4v4M9 14h.01M15 14h.01" /></>),
  alert: svg(<path d="M12 3l10 18H2zM12 10v5M12 18h.01" />),
  search: svg(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  eye: svg(<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>, 16),
  chevL: svg(<path d="M15 6l-6 6 6 6" />, 14),
  chevR: svg(<path d="M9 6l6 6-6 6" />, 14),
};

function Kpi({ title, value, icon, foot, tone = 'default' }: { title: string; value: ReactNode; icon: ReactNode; foot?: ReactNode; tone?: 'default' | 'danger' }) {
  return <div className={tone === 'danger' ? 'ap-kpi ap-kpi-danger' : 'ap-kpi'}>
    <div className="ap-kpi-top"><span className="ap-label">{title}</span><span className="ap-kpi-icon">{icon}</span></div>
    <strong>{value}</strong>
    {foot && <span className="ap-kpi-foot">{foot}</span>}
  </div>;
}

function GrowthChart({ points }: { points: DashboardStats['user_growth_30_days'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 640;
  const height = 240;
  const max = Math.max(...points.map((point) => point.count), 1);
  const top = Math.ceil(max / 10) * 10 || 10;
  const coords = points.map((point, index) => ({
    x: points.length > 1 ? (index / (points.length - 1)) * width : width / 2,
    y: height - (point.count / top) * height,
    ...point,
  }));
  const line = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const formatter = new Intl.DateTimeFormat(activeLocale(), { month: 'short', day: 'numeric' });
  const fmt = (date: string) => formatter.format(new Date(`${date}T00:00:00`));
  const active = hover ?? coords.reduce((best, c, i) => (c.count > coords[best].count ? i : best), 0);
  const current = coords[active];
  const tickIndexes = [0, 0.25, 0.5, 0.75, 1].map((ratio) => Math.round(ratio * (points.length - 1)));
  return <div className="ap-chart" role="img" aria-label={t('adminDashboard.growthLabel')}>
    <svg viewBox={`-30 -16 ${width + 40} ${height + 56}`} preserveAspectRatio="none">
      <defs><linearGradient id="ap-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff5252" stopOpacity="0.35" /><stop offset="100%" stopColor="#ff5252" stopOpacity="0" /></linearGradient></defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <g key={ratio}>
        <line x1="0" x2={width} y1={height * ratio} y2={height * ratio} className="grid" />
        <text x="-8" y={height * ratio + 4} textAnchor="end" className="axis">{Math.round(top * (1 - ratio))}</text>
      </g>)}
      {coords.length > 1 && <polygon points={`0,${height} ${line} ${width},${height}`} fill="url(#ap-fill)" />}
      <polyline points={line} fill="none" stroke="#ff5252" strokeWidth="2.5" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {current && <line x1={current.x} x2={current.x} y1="0" y2={height} className="cursor" />}
      {current && <circle cx={current.x} cy={current.y} r="5" fill="#ff5252" stroke="#fff" strokeWidth="1.5" />}
      {tickIndexes.map((index) => coords[index] && <text key={index} x={coords[index].x} y={height + 24} textAnchor="middle" className="axis">{fmt(coords[index].date)}</text>)}
      {coords.map((c, index) => <rect key={c.date} x={c.x - width / points.length / 2} y="0" width={width / points.length} height={height} fill="transparent" onMouseEnter={() => setHover(index)} onMouseLeave={() => setHover(null)}><title>{t('adminDashboard.tooltip', { date: fmt(c.date), count: c.count })}</title></rect>)}
    </svg>
    {current && <div className="ap-tooltip" style={{ left: `${Math.min(85, Math.max(5, (current.x / width) * 100))}%` }}><small>{fmt(current.date)}</small><strong>{current.count}</strong></div>}
  </div>;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>();
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => { setError(false); void getDashboardStats().then(setStats).catch(() => setError(true)); }, [retry]);

  const growth = stats?.user_growth_30_days ?? [];
  const growthTotal = growth.reduce((sum, point) => sum + point.count, 0);
  const peak = growth.reduce<DashboardStats['user_growth_30_days'][number] | null>((best, point) => (!best || point.count > best.count ? point : best), null);
  const failRate = stats && stats.ai_requests_today ? (stats.ai_failed_requests_today / stats.ai_requests_today) * 100 : 0;
  const peakDate = peak ? new Intl.DateTimeFormat(activeLocale(), { month: 'short', day: 'numeric' }).format(new Date(`${peak.date}T00:00:00`)) : '';

  return <div className="page-content admin-page ap">
    <header className="ap-header">
      <p className="ap-eyebrow"><i className="ap-dot" /> {t('admin.label')}</p>
      <h2>{t('adminDashboard.title')}</h2>
      <p className="ap-muted">{t('adminDashboard.description')}</p>
    </header>

    {error ? <ErrorState message={t('adminDashboard.loadError')} onRetry={() => setRetry((value) => value + 1)} /> : !stats ? <div className="ap-kpis">{Array.from({ length: 6 }, (_, index) => <Card key={index}><Skeleton /><Skeleton className="kpi-skeleton" /></Card>)}</div> : <>
      <div className="ap-kpis admin-kpis">
        <Kpi title={t('adminDashboard.totalUsers')} value={stats.total_users.toLocaleString()} icon={Icon.users} />
        <Kpi title={t('adminDashboard.newUsers')} value={stats.new_users_7_days.toLocaleString()} icon={Icon.userPlus} />
        <Kpi title={t('adminDashboard.workouts')} value={stats.workouts_completed_today.toLocaleString()} icon={Icon.dumbbell} />
        <Kpi title={t('adminDashboard.meals')} value={stats.meals_logged_today.toLocaleString()} icon={Icon.fork} />
        <Kpi title={t('adminDashboard.aiRequests')} value={stats.ai_requests_today.toLocaleString()} icon={Icon.bot} />
        <Kpi title={t('adminDashboard.aiFailures')} value={<>{stats.ai_failed_requests_today.toLocaleString()}<small>/ {stats.ai_requests_today.toLocaleString()}</small></>} icon={Icon.alert} tone={stats.ai_failed_requests_today ? 'danger' : 'default'} foot={`${failRate.toFixed(2)}%`} />
      </div>

      <section className="ap-card">
        <div className="ap-card-head">
          <div><h3>{t('adminDashboard.growthTitle')}</h3><p className="ap-muted">{t('adminDashboard.growthLabel')}</p></div>
          {growth.length > 0 && <div className="ap-summary"><div><span className="ap-label">Total</span><strong>{growthTotal.toLocaleString()}</strong></div>{peak && <div><span className="ap-label">Peak</span><strong className="ap-accent">{peak.count}</strong><small>({peakDate})</small></div>}</div>}
        </div>
        {growth.length === 0 ? <p className="ap-muted">{t('adminDashboard.noGrowth')}</p> : <GrowthChart points={growth} />}
      </section>
    </>}
  </div>;
}

function pageList(current: number, total: number): (number | '…')[] {
  if (total <= 6) return Array.from({ length: total }, (_, index) => index);
  const pages = new Set([0, 1, 2, total - 1, current]);
  const sorted = [...pages].filter((page) => page >= 0 && page < total).sort((a, b) => a - b);
  const result: (number | '…')[] = [];
  sorted.forEach((page, index) => { if (index && page - sorted[index - 1] > 1) result.push('…'); result.push(page); });
  return result;
}

export function AdminUsersPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [stats, setStats] = useState<DashboardStats>();
  const page = Math.max(0, Number(params.get('page') ?? 0) || 0);
  const goal = params.get('goal') ?? '';
  useEffect(() => setSearch(params.get('q') ?? ''), [params]);
  useEffect(() => { void getDashboardStats().then(setStats).catch(() => undefined); }, []);
  useEffect(() => { const timer = window.setTimeout(() => { if (search !== (params.get('q') ?? '')) { const next = new URLSearchParams(location.search); if (search.trim()) next.set('q', search.trim()); else next.delete('q'); next.delete('page'); navigate({ search: next.toString() }, { replace: true }); } }, 350); return () => window.clearTimeout(timer); }, [location.search, navigate, params, search]);
  const load = useCallback(() => { void retry; setLoading(true); setError(false); void getAdminUsers({ search: params.get('q') ?? '', goal, page, pageSize }).then((result) => { setUsers(result.users); setCount(result.count); }).catch(() => setError(true)).finally(() => setLoading(false)); }, [goal, page, params, retry]);
  useEffect(() => { load(); }, [load]);
  const update = (key: string, value: string) => { const next = new URLSearchParams(location.search); if (value) next.set(key, value); else next.delete(key); next.delete('page'); navigate({ search: next.toString() }); };
  const setPage = (nextPage: number) => { const next = new URLSearchParams(location.search); if (nextPage) next.set('page', String(nextPage)); else next.delete('page'); navigate({ search: next.toString() }); };
  const totalPages = Math.ceil(count / pageSize);
  const from = page * pageSize + 1;
  const to = Math.min((page + 1) * pageSize, count);

  return <div className="page-content admin-page ap">
    <header className="ap-header">
      <p className="ap-eyebrow"><i className="ap-dot" /> {t('admin.label')}</p>
      <h2>{t('adminUsers.title')}</h2>
      <p className="ap-muted">{t('adminUsers.description')}</p>
    </header>

    <div className="ap-kpis ap-kpis-3">
      <Kpi title="Total registered" value={(stats?.total_users ?? count).toLocaleString()} icon={Icon.users} foot={t('adminUsers.title')} />
      {stats && <Kpi title={t('adminDashboard.newUsers')} value={stats.new_users_7_days.toLocaleString()} icon={Icon.userPlus} foot="Last 7 days" />}
    </div>

    <section className="ap-card ap-filters admin-filters">
      <label className="ap-search"><span className="sr-only">{t('adminUsers.search')}</span>{Icon.search}<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('adminUsers.searchPlaceholder')} /></label>
      <div className="ap-pills" role="group" aria-label={t('adminUsers.goal')}>
        <button type="button" className={goal === '' ? 'on' : ''} aria-pressed={goal === ''} onClick={() => update('goal', '')}>{t('adminUsers.allGoals')}</button>
        {goals.map((item) => <button type="button" key={item} className={goal === item ? 'on' : ''} aria-pressed={goal === item} onClick={() => update('goal', item)}>{label(item)}</button>)}
      </div>
      {!loading && !error && count > 0 && <span className="ap-showing">{t('adminUsers.showing', { from, to, total: count })}</span>}
    </section>

    {loading ? <Card><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /><Skeleton className="table-skeleton" /></Card> : error ? <ErrorState message={t('adminUsers.loadError')} onRetry={() => setRetry((value) => value + 1)} /> : users.length === 0 ? <EmptyState title={t('adminUsers.emptyTitle')} description={t('adminUsers.emptyDescription')} /> : <section className="ap-card ap-table-card">
      <div className="admin-table-wrap ap-table-wrap"><table className="admin-table ap-table"><thead><tr>{['user', 'email', 'goalColumn', 'joined', 'lastActive', 'actions'].map((key) => <th key={key}>{t(`adminUsers.${key}`)}</th>)}</tr></thead><tbody>{users.map((user) => {
        const active = relativeTime(user.last_active);
        return <tr key={user.user_id}>
          <td><span className="user-cell ap-user"><span className="user-initial ap-avatar">{twoInitials(user)}</span><span><strong>{user.display_name || t('adminUsers.unnamed')}</strong><small>{user.user_id.slice(0, 8)}</small></span></span></td>
          <td className="ap-email">{user.email || t('adminUsers.notAvailable')}</td>
          <td>{user.goal ? <span className={`ap-goal ap-goal-${user.goal}`}>{tEnum('goal', user.goal)}</span> : <span className="ap-muted">{t('adminUsers.notSet')}</span>}</td>
          <td>{shortDate(user.joined_at)}</td>
          <td><span className="ap-activity">{active.recent && <i className="ap-dot" />}{active.text}</span></td>
          <td><Link className="ap-view" to={`/admin/users/${user.user_id}`}>{Icon.eye} {t('adminUsers.view')}</Link></td>
        </tr>;
      })}</tbody></table></div>

      <div className="admin-pagination ap-pagination">
        <span>{t('adminUsers.showing', { from, to, total: count })}</span>
        <nav aria-label="Pagination">
          <button type="button" className="ap-page-btn" disabled={page === 0} onClick={() => setPage(page - 1)}>{Icon.chevL} {t('adminUsers.previous')}</button>
          {pageList(page, totalPages).map((item, index) => item === '…' ? <span key={`gap-${index}`} className="ap-gap">…</span> : <button type="button" key={item} className={item === page ? 'ap-page on' : 'ap-page'} aria-current={item === page ? 'page' : undefined} onClick={() => setPage(item)}>{item + 1}</button>)}
          <button type="button" className="ap-page-btn" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>{t('adminUsers.next')} {Icon.chevR}</button>
        </nav>
      </div>
    </section>}
  </div>;
}

export function AdminUserDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<AdminUserSummary>();
  const [error, setError] = useState(false);
  useEffect(() => { setError(false); void getAdminUserSummary(id).then(setUser).catch(() => setError(true)); }, [id]);
  if (error) return <div className="page-content admin-page"><ErrorState message={t('adminUsers.detailLoadError')} onRetry={() => navigate(0)} /></div>;
  if (!user) return <div className="page-content admin-page"><Skeleton className="editor-skeleton" /><Skeleton className="editor-skeleton" /></div>;
  return <div className="page-content admin-page"><Link className="back-link" to="/admin/users">← {t('adminUsers.backToList')}</Link><div className="user-detail-heading"><span className="user-initial large">{initials(user)}</span><div><h2>{user.display_name || t('adminUsers.unnamed')}</h2><p className="muted">{user.email || t('adminUsers.notAvailable')}</p><p className="muted">{t('adminUsers.joined')}: {dateLabel(user.joined_at)} · {t('adminUsers.lastActive')}: {dateLabel(user.last_active)}</p></div></div><div className="user-detail-grid"><Card><h3>{t('adminUsers.profile')}</h3><p>{t('adminUsers.goal')}: <strong>{label(user.goal)}</strong></p>  <p>{t('adminUsers.experience')}: <strong>{user.experience ? tEnum('experience', user.experience) : t('adminUsers.notSet')}</strong></p><p>{t('adminUsers.days')}: <strong>{user.days_per_week ?? t('adminUsers.notSet')}</strong></p><p>{t('adminUsers.minutes')}: <strong>{user.session_minutes ?? t('adminUsers.notSet')}</strong></p></Card><Card><h3>{t('adminUsers.completedWorkouts')}</h3><strong className="detail-count">{user.completed_workouts}</strong></Card><Card><h3>{t('adminUsers.mealsLogged')}</h3><strong className="detail-count">{user.meals_logged}</strong></Card><Card><h3>{t('adminUsers.aiRequests')}</h3><strong className="detail-count">{user.ai_requests}</strong></Card></div></div>;
}