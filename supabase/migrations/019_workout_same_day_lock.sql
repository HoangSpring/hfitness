drop policy if exists "Users can create workout sessions" on public.workout_sessions;
revoke insert on table public.workout_sessions from authenticated;

create or replace function public.start_workout_session(p_plan_day_id uuid)
returns public.workout_sessions
language plpgsql
security definer
set search_path = public
as $$
declare
  started public.workout_sessions;
begin
  if exists (
    select 1
    from public.workout_sessions
    where user_id = auth.uid()
      and status = 'IN_PROGRESS'
  ) then
    raise exception 'WORKOUT_SESSION_IN_PROGRESS';
  end if;

  if exists (
    select 1
    from public.workout_sessions
    where user_id = auth.uid()
      and status = 'COMPLETED'
      and timezone('UTC', finished_at)::date = timezone('UTC', now())::date
  ) then
    raise exception 'WORKOUT_DAY_ALREADY_COMPLETED_TODAY';
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

  insert into public.workout_sessions (user_id, plan_day_id, status)
  values (auth.uid(), p_plan_day_id, 'IN_PROGRESS')
  returning * into started;

  return started;
end;
$$;

revoke all on function public.start_workout_session(uuid) from public, anon;
grant execute on function public.start_workout_session(uuid) to authenticated;
