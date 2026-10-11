create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  instructions text[] not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  difficulty text not null,
  movement_pattern text not null,
  image_url text,
  video_url text,
  safety_notes text not null,
  status text not null default 'DRAFT',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint exercises_status_check check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  constraint exercises_difficulty_check check (difficulty in ('beginner', 'intermediate', 'advanced')),
  constraint exercises_muscle_check check (primary_muscle in ('chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals', 'full_body')),
  constraint exercises_equipment_check check (equipment in ('bodyweight', 'dumbbell', 'barbell', 'machine', 'cable', 'kettlebell', 'band')),
  constraint exercises_movement_pattern_check check (movement_pattern in ('push', 'pull', 'squat', 'hinge', 'lunge', 'carry', 'rotation', 'isolation', 'locomotion'))
);

create index if not exists exercises_slug_idx on public.exercises (slug);
create index if not exists exercises_primary_muscle_idx on public.exercises (primary_muscle);
create index if not exists exercises_equipment_idx on public.exercises (equipment);
create index if not exists exercises_status_idx on public.exercises (status);

alter table public.exercises enable row level security;
drop policy if exists "Public can view published exercises" on public.exercises;
create policy "Public can view published exercises"
  on public.exercises for select
  to anon, authenticated
  using (status = 'PUBLISHED');

revoke all on table public.exercises from anon, authenticated;
grant select on table public.exercises to anon, authenticated;
grant select, insert, update on table public.exercises to service_role;

drop trigger if exists exercises_set_updated_at on public.exercises;
create trigger exercises_set_updated_at
  before update on public.exercises
  for each row execute procedure public.set_updated_at();
