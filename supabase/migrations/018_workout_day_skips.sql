alter table public.workout_sessions
  drop constraint if exists workout_sessions_status_check;

alter table public.workout_sessions
  add constraint workout_sessions_status_check check (status in ('IN_PROGRESS', 'COMPLETED', 'ABANDONED', 'SKIPPED'));

alter table public.workout_sessions
  drop constraint if exists workout_sessions_finished_at_check;

alter table public.workout_sessions
  add constraint workout_sessions_finished_at_check check (
    (status = 'IN_PROGRESS' and finished_at is null)
    or (status in ('COMPLETED', 'ABANDONED', 'SKIPPED') and finished_at is not null)
  );

create or replace function public.skip_workout_day(p_plan_day_id uuid)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  skipped public.workout_sessions;
begin
  if exists (
    select 1
    from public.workout_sessions
    where user_id = auth.uid()
      and status = 'IN_PROGRESS'
  ) then
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

  insert into public.workout_sessions (user_id, plan_day_id, status, started_at, finished_at)
  values (auth.uid(), p_plan_day_id, 'SKIPPED', timezone('utc', now()), timezone('utc', now()))
  returning * into skipped;

  return skipped;
end;
$$;

revoke all on function public.skip_workout_day(uuid) from public, anon;
grant execute on function public.skip_workout_day(uuid) to authenticated;
