import { supabase } from '../../lib/supabase';

export type GrowthPoint = { date: string; count: number };
export type DashboardStats = {
  total_users: number;
  new_users_7_days: number;
  workouts_completed_today: number;
  meals_logged_today: number;
  ai_requests_today: number;
  ai_failed_requests_today: number;
  user_growth_30_days: GrowthPoint[];
};
export type AdminUser = {
  user_id: string;
  display_name: string | null;
  email: string | null;
  goal: string | null;
  joined_at: string;
  last_active: string | null;
  total_count: number;
};
export type AdminUserSummary = AdminUser & {
  experience: string | null;
  days_per_week: number | null;
  session_minutes: number | null;
  completed_workouts: number;
  meals_logged: number;
  ai_requests: number;
};

function friendlyError(code: string) {
  return new Error(code);
}

export async function getDashboardStats() {
  const result = await supabase.rpc('admin_dashboard_stats');
  if (result.error || !result.data) throw result.error ?? friendlyError('ADMIN_DASHBOARD_LOAD_FAILED');
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row) throw friendlyError('ADMIN_DASHBOARD_LOAD_FAILED');
  return { ...row, user_growth_30_days: (row.user_growth_30_days ?? []) as GrowthPoint[] } as DashboardStats;
}

export async function getAdminUsers(filters: { search: string; goal: string; page: number; pageSize: number }) {
  const result = await supabase.rpc('admin_list_users', {
    search: filters.search,
    p_goal: filters.goal,
    page: filters.page,
    page_size: Math.min(filters.pageSize, 50),
  });
  if (result.error) throw result.error;
  const users = (result.data ?? []) as AdminUser[];
  return { users, count: users[0]?.total_count ?? 0 };
}

export async function getAdminUserSummary(id: string) {
  const result = await supabase.rpc('admin_user_summary', { target_user_id: id });
  if (result.error) throw result.error;
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row) throw friendlyError('ADMIN_USER_NOT_FOUND');
  return row as AdminUserSummary;
}