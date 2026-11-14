create or replace function public.skip_workout_day(p_plan_day_id uuid)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  active_session public.workout_sessions;
  skipped public.workout_sessions;
begin
  select *
  into active_session
  from public.workout_sessions
  where user_id = auth.uid()
    and status = 'IN_PROGRESS'
  limit 1
  for update;

  if active_session.id is not null and active_session.plan_day_id is distinct from p_plan_day_id then
    raise exception 'WORKOUT_SESSION_IN_PROGRESS';
  end if;

  if not exists (
    select 1
    from public.workout_plan_days
    join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
    where workout_plan_days.id = p_plan_day_id
      and workout_plans.user_id = auth.uid()
      and workout_plans.status = 'ACTIVE'
  ) then
    raise exception 'WORKOUT_DAY_NOT_FOUND_OR_NOT_ACTIVE';
  end if;

  if exists (
    select 1
    from public.workout_sessions
    where user_id = auth.uid()
      and workout_sessions.plan_day_id = p_plan_day_id
      and status in ('COMPLETED', 'SKIPPED')
  ) then
    raise exception 'WORKOUT_DAY_ALREADY_PROCESSED';
  end if;

  if active_session.id is not null then
    update public.workout_sessions
    set status = 'ABANDONED',
        finished_at = timezone('utc', now())
    where id = active_session.id;
  end if;

  insert into public.workout_sessions (user_id, plan_day_id, status, started_at, finished_at)
  values (auth.uid(), p_plan_day_id, 'SKIPPED', timezone('utc', now()), timezone('utc', now()))
  returning * into skipped;

  return skipped;
end;
$$;

revoke all on function public.skip_workout_day(uuid) from public, anon;
grant execute on function public.skip_workout_day(uuid) to authenticated;
