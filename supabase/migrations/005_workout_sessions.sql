create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_day_id uuid references public.workout_plan_days(id) on delete set null,
  status text not null default 'IN_PROGRESS',
  started_at timestamptz not null default timezone('utc', now()),
  finished_at timestamptz,
  notes text,
  constraint workout_sessions_status_check check (status in ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')),
  constraint workout_sessions_finished_at_check check (
    (status = 'IN_PROGRESS' and finished_at is null)
    or (status in ('COMPLETED', 'ABANDONED') and finished_at is not null)
  )
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  set_number integer not null,
  weight_kg numeric not null default 0,
  reps integer not null,
  rpe integer,
  created_at timestamptz not null default timezone('utc', now()),
  constraint workout_sets_set_number_check check (set_number >= 1),
  constraint workout_sets_weight_check check (weight_kg between 0 and 1000),
  constraint workout_sets_reps_check check (reps between 1 and 100),
  constraint workout_sets_rpe_check check (rpe is null or rpe between 1 and 10)
);

create index if not exists workout_sessions_user_started_idx
  on public.workout_sessions (user_id, started_at desc);
create index if not exists workout_sets_session_idx
  on public.workout_sets (session_id, exercise_id, set_number);
create unique index if not exists workout_sessions_one_in_progress_idx
  on public.workout_sessions (user_id)
  where status = 'IN_PROGRESS';

alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "Users can read their workout sessions" on public.workout_sessions;
create policy "Users can read their workout sessions"
  on public.workout_sessions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create workout sessions" on public.workout_sessions;
create policy "Users can create workout sessions"
  on public.workout_sessions for insert to authenticated
  with check (
    auth.uid() = user_id
    and status = 'IN_PROGRESS'
    and finished_at is null
    and (
      plan_day_id is null
      or exists (
        select 1
        from public.workout_plan_days
        join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
        where workout_plan_days.id = workout_sessions.plan_day_id
          and workout_plans.user_id = auth.uid()
      )
    )
  );

drop policy if exists "Users can update in-progress workout sessions" on public.workout_sessions;
create policy "Users can update in-progress workout sessions"
  on public.workout_sessions for update to authenticated
  using (auth.uid() = user_id and status = 'IN_PROGRESS')
  with check (
    auth.uid() = user_id
    and status in ('IN_PROGRESS', 'COMPLETED', 'ABANDONED')
  );

drop policy if exists "Users can delete in-progress workout sessions" on public.workout_sessions;
create policy "Users can delete in-progress workout sessions"
  on public.workout_sessions for delete to authenticated
  using (auth.uid() = user_id and status = 'IN_PROGRESS');

drop policy if exists "Users can read their workout sets" on public.workout_sets;
create policy "Users can read their workout sets"
  on public.workout_sets for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create sets for in-progress sessions" on public.workout_sets;
create policy "Users can create sets for in-progress sessions"
  on public.workout_sets for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
        and workout_sessions.status = 'IN_PROGRESS'
    )
  );

drop policy if exists "Users can update sets for in-progress sessions" on public.workout_sets;
create policy "Users can update sets for in-progress sessions"
  on public.workout_sets for update to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
        and workout_sessions.status = 'IN_PROGRESS'
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
        and workout_sessions.status = 'IN_PROGRESS'
    )
  );

drop policy if exists "Users can delete sets for in-progress sessions" on public.workout_sets;
create policy "Users can delete sets for in-progress sessions"
  on public.workout_sets for delete to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.workout_sessions
      where workout_sessions.id = workout_sets.session_id
        and workout_sessions.user_id = auth.uid()
        and workout_sessions.status = 'IN_PROGRESS'
    )
  );

revoke all on table public.workout_sessions, public.workout_sets from anon;
grant select, insert, update, delete on table public.workout_sessions, public.workout_sets to authenticated;
grant select, insert, update, delete on table public.workout_sessions, public.workout_sets to service_role;

create or replace function public.finish_workout_session(session_id uuid)
returns public.workout_sessions
language plpgsql
set search_path = public
as $$
declare
  finished public.workout_sessions;
begin
  update public.workout_sessions
  set status = 'COMPLETED', finished_at = timezone('utc', now())
  where id = session_id
    and user_id = auth.uid()
    and status = 'IN_PROGRESS'
  returning * into finished;
  if finished.id is null then
    raise exception 'WORKOUT_SESSION_NOT_IN_PROGRESS';
  end if;
  return finished;
end;
$$;

create or replace function public.abandon_workout_session(session_id uuid)
returns public.workout_sessions
language plpgsql
set search_path = public
as $$
declare
  abandoned public.workout_sessions;
begin
  update public.workout_sessions
  set status = 'ABANDONED', finished_at = timezone('utc', now())
  where id = session_id
    and user_id = auth.uid()
    and status = 'IN_PROGRESS'
  returning * into abandoned;
  if abandoned.id is null then
    raise exception 'WORKOUT_SESSION_NOT_IN_PROGRESS';
  end if;
  return abandoned;
end;
$$;

revoke all on function public.finish_workout_session(uuid), public.abandon_workout_session(uuid) from public, anon;
grant execute on function public.finish_workout_session(uuid), public.abandon_workout_session(uuid) to authenticated;
