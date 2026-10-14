create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  goal text not null,
  source text not null default 'AI',
  status text not null default 'DRAFT',
  created_at timestamptz not null default timezone('utc', now()),
  constraint workout_plans_source_check check (source in ('AI', 'MANUAL')),
  constraint workout_plans_status_check check (status in ('DRAFT', 'ACTIVE', 'ARCHIVED'))
);

create table if not exists public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_index integer not null,
  name text not null,
  muscle_focus text not null,
  constraint workout_plan_days_day_index_check check (day_index >= 1)
);

create table if not exists public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  plan_day_id uuid not null references public.workout_plan_days(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null,
  sets integer not null,
  reps_min integer not null,
  reps_max integer not null,
  rest_seconds integer not null,
  notes text,
  constraint workout_plan_exercises_position_check check (position >= 1),
  constraint workout_plan_exercises_sets_check check (sets between 1 and 6),
  constraint workout_plan_exercises_reps_check check (reps_min between 1 and 30 and reps_max between 1 and 30 and reps_min <= reps_max),
  constraint workout_plan_exercises_rest_check check (rest_seconds between 20 and 300),
  unique (plan_day_id, position)
);

create index if not exists workout_plans_user_id_idx on public.workout_plans (user_id);
create index if not exists workout_plan_days_plan_id_idx on public.workout_plan_days (plan_id);
create index if not exists workout_plan_exercises_day_id_idx on public.workout_plan_exercises (plan_day_id);
create unique index if not exists workout_plans_one_active_per_user_idx
  on public.workout_plans (user_id)
  where status = 'ACTIVE';

alter table public.workout_plans enable row level security;
alter table public.workout_plan_days enable row level security;
alter table public.workout_plan_exercises enable row level security;

drop policy if exists "Users can manage their own workout plans" on public.workout_plans;
create policy "Users can manage their own workout plans"
  on public.workout_plans for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can manage days in their own plans" on public.workout_plan_days;
create policy "Users can manage days in their own plans"
  on public.workout_plan_days for all to authenticated
  using (exists (
    select 1 from public.workout_plans
    where workout_plans.id = workout_plan_days.plan_id
      and workout_plans.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.workout_plans
    where workout_plans.id = workout_plan_days.plan_id
      and workout_plans.user_id = auth.uid()
  ));

drop policy if exists "Users can manage exercises in their own plans" on public.workout_plan_exercises;
create policy "Users can manage exercises in their own plans"
  on public.workout_plan_exercises for all to authenticated
  using (exists (
    select 1
    from public.workout_plan_days
    join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
    where workout_plan_days.id = workout_plan_exercises.plan_day_id
      and workout_plans.user_id = auth.uid()
  ))
  with check (exists (
    select 1
    from public.workout_plan_days
    join public.workout_plans on workout_plans.id = workout_plan_days.plan_id
    where workout_plan_days.id = workout_plan_exercises.plan_day_id
      and workout_plans.user_id = auth.uid()
  ));

revoke all on table public.workout_plans, public.workout_plan_days, public.workout_plan_exercises from anon;
grant select, insert, update, delete on table public.workout_plans, public.workout_plan_days, public.workout_plan_exercises to authenticated;
grant select, insert, update, delete on table public.workout_plans, public.workout_plan_days, public.workout_plan_exercises to service_role;

create table if not exists public.ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  prompt_version text not null,
  status text not null,
  latency_ms integer,
  error_code text,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_requests_user_created_at_idx on public.ai_requests (user_id, created_at);
alter table public.ai_requests enable row level security;
drop policy if exists "Users can view their own AI requests" on public.ai_requests;
create policy "Users can view their own AI requests"
  on public.ai_requests for select to authenticated
  using (auth.uid() = user_id);

revoke all on table public.ai_requests from anon;
grant select on table public.ai_requests to authenticated;
grant select, insert, update, delete on table public.ai_requests to service_role;

create or replace function public.activate_workout_plan(plan_id uuid)
returns public.workout_plans
language plpgsql
set search_path = public
as $$
declare
  activated public.workout_plans;
begin
  if not exists (
    select 1 from public.workout_plans
    where id = plan_id and user_id = auth.uid() and status = 'DRAFT'
  ) then
    raise exception 'WORKOUT_PLAN_NOT_FOUND_OR_NOT_DRAFT';
  end if;

  update public.workout_plans
  set status = 'ARCHIVED'
  where user_id = auth.uid() and status = 'ACTIVE';

  update public.workout_plans
  set status = 'ACTIVE'
  where id = plan_id and user_id = auth.uid()
  returning * into activated;

  return activated;
end;
$$;

revoke all on function public.activate_workout_plan(uuid) from public, anon;
grant execute on function public.activate_workout_plan(uuid) to authenticated;
