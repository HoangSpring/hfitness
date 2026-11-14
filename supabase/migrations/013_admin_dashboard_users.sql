drop function if exists public.admin_dashboard_stats();
drop function if exists public.admin_list_users(text, text, integer, integer);
drop function if exists public.admin_user_summary(uuid);

create or replace function public.admin_dashboard_stats()
returns table (
  total_users bigint,
  new_users_7_days bigint,
  workouts_completed_today bigint,
  meals_logged_today bigint,
  ai_requests_today bigint,
  ai_failed_requests_today bigint,
  user_growth_30_days jsonb
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  growth jsonb;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object('date', dates.day, 'count', dates.count) order by dates.day), '[]'::jsonb)
    into growth
  from (
    select days.day::date as day, count(p.id)::bigint as count
    from generate_series(current_date - interval '29 days', current_date, interval '1 day') as days(day)
    left join public.profiles p on p.created_at >= days.day
      and p.created_at < days.day + interval '1 day'
    group by day
  ) dates;

  return query
  select
    (select count(*) from public.profiles),
    (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    (select count(*) from public.workout_sessions where status = 'COMPLETED' and finished_at >= current_date and finished_at < current_date + interval '1 day'),
    (select count(*) from public.meals where eaten_at >= current_date and eaten_at < current_date + interval '1 day'),
    (select count(*) from public.ai_requests where created_at >= current_date and created_at < current_date + interval '1 day'),
    (select count(*) from public.ai_requests where status in ('FAILED', 'VALIDATION_FAILED') and created_at >= current_date and created_at < current_date + interval '1 day'),
    growth;
end;
$$;

create or replace function public.admin_list_users(
  search text default '',
  p_goal text default '',
  page integer default 0,
  page_size integer default 20
)
returns table (
  user_id uuid,
  display_name text,
  email text,
  goal text,
  joined_at timestamptz,
  last_active timestamptz,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  safe_page integer := greatest(coalesce(page, 0), 0);
  safe_page_size integer := least(greatest(coalesce(page_size, 20), 1), 50);
  escaped_search text := replace(replace(replace(coalesce(search, ''), '\', '\\'), '%', '\%'), '_', '\_');
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  with filtered as (
    select
      p.id as uid,
      p.display_name::text as dname,
      u.email::text as mail,
      p.goal::text as user_goal,
      p.created_at as created,
      greatest(
        (select max(ws.started_at) from public.workout_sessions ws where ws.user_id = p.id),
        (select max(m.eaten_at) from public.meals m where m.user_id = p.id),
        (select max(ar.created_at) from public.ai_requests ar where ar.user_id = p.id)
      ) as activity
    from public.profiles p
    join auth.users u on u.id = p.id
    where (
      escaped_search = ''
      or coalesce(p.display_name, '') ilike '%' || escaped_search || '%' escape '\'
      or coalesce(u.email, '') ilike '%' || escaped_search || '%' escape '\'
    )
    and (coalesce(p_goal, '') = '' or p.goal = p_goal)
  )
  select f.uid, f.dname, f.mail, f.user_goal, f.created, f.activity, count(*) over ()
  from filtered f
  order by f.created desc, f.uid
  offset safe_page * safe_page_size
  limit safe_page_size;
end;
$$;

create or replace function public.admin_user_summary(target_user_id uuid)
returns table (
  user_id uuid,
  display_name text,
  email text,
  goal text,
  experience text,
  days_per_week integer,
  session_minutes integer,
  joined_at timestamptz,
  last_active timestamptz,
  completed_workouts bigint,
  meals_logged bigint,
  ai_requests bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.display_name::text,
    u.email::text,
    p.goal::text,
    p.experience::text,
    p.days_per_week::integer,
    p.session_minutes::integer,
    p.created_at,
    greatest(
      (select max(ws.started_at) from public.workout_sessions ws where ws.user_id = p.id),
      (select max(m.eaten_at) from public.meals m where m.user_id = p.id),
      (select max(ar.created_at) from public.ai_requests ar where ar.user_id = p.id)
    ),
    (select count(*) from public.workout_sessions ws where ws.user_id = p.id and ws.status = 'COMPLETED'),
    (select count(*) from public.meals m where m.user_id = p.id),
    (select count(*) from public.ai_requests ar where ar.user_id = p.id)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.id = target_user_id;
end;
$$;

revoke execute on function public.admin_dashboard_stats() from public, anon;
revoke execute on function public.admin_list_users(text, text, integer, integer) from public, anon;
revoke execute on function public.admin_user_summary(uuid) from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;
grant execute on function public.admin_user_summary(uuid) to authenticated;

notify pgrst, 'reload schema';