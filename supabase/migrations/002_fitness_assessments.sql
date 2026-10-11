create table if not exists public.fitness_assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  age integer not null,
  gender text not null,
  height_cm numeric not null,
  weight_kg numeric not null,
  goal text not null,
  experience text not null,
  days_per_week integer not null,
  bmr numeric not null,
  tdee numeric not null,
  calorie_target numeric not null,
  protein_g numeric not null,
  carbs_g numeric not null,
  fat_g numeric not null,
  formula_version text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint fitness_assessments_gender_check check (gender in ('male', 'female')),
  constraint fitness_assessments_goal_check check (goal in ('lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain')),
  constraint fitness_assessments_experience_check check (experience in ('beginner', 'intermediate', 'advanced')),
  constraint fitness_assessments_age_check check (age between 14 and 90),
  constraint fitness_assessments_height_check check (height_cm between 120 and 230),
  constraint fitness_assessments_weight_check check (weight_kg between 30 and 250),
  constraint fitness_assessments_days_check check (days_per_week between 1 and 7)
);

alter table public.profiles
  drop constraint if exists profiles_age_check,
  drop constraint if exists profiles_height_cm_check,
  drop constraint if exists profiles_weight_kg_check,
  drop constraint if exists profiles_days_per_week_check,
  drop constraint if exists profiles_session_minutes_check,
  drop constraint if exists profiles_meals_per_day_check,
  drop constraint if exists profiles_gender_check,
  drop constraint if exists profiles_goal_check,
  drop constraint if exists profiles_experience_check;

alter table public.profiles
  add constraint profiles_age_check check (age is null or age between 14 and 90),
  add constraint profiles_height_cm_check check (height_cm is null or height_cm between 120 and 230),
  add constraint profiles_weight_kg_check check (weight_kg is null or weight_kg between 30 and 250),
  add constraint profiles_days_per_week_check check (days_per_week is null or days_per_week between 1 and 7),
  add constraint profiles_session_minutes_check check (session_minutes is null or session_minutes between 15 and 180),
  add constraint profiles_meals_per_day_check check (meals_per_day is null or meals_per_day between 1 and 8),
  add constraint profiles_gender_check check (gender is null or gender in ('male', 'female')),
  add constraint profiles_goal_check check (goal is null or goal in ('lose_weight', 'gain_weight', 'build_muscle', 'get_stronger', 'maintain')),
  add constraint profiles_experience_check check (experience is null or experience in ('beginner', 'intermediate', 'advanced'));

alter table public.fitness_assessments enable row level security;
drop policy if exists "Users can view their own assessments" on public.fitness_assessments;
create policy "Users can view their own assessments"
  on public.fitness_assessments for select
  using (auth.uid() = user_id);
drop policy if exists "Users can insert their own assessments" on public.fitness_assessments;
create policy "Users can insert their own assessments"
  on public.fitness_assessments for insert
  with check (auth.uid() = user_id);

