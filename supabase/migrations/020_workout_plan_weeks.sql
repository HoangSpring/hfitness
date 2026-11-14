alter table public.workout_plans
  add column if not exists week_start date;

update public.workout_plans
set week_start = date_trunc('week', created_at)::date
where week_start is null;

alter table public.workout_plans
  alter column week_start set not null;

create index if not exists workout_plans_user_week_start_idx
  on public.workout_plans (user_id, week_start desc);
