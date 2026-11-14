alter table public.exercises
  drop constraint if exists exercises_muscle_check;

alter table public.exercises
  add constraint exercises_muscle_check
  check (primary_muscle in (
    'chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
    'quadriceps', 'hamstrings', 'glutes', 'calves', 'abdominals',
    'full_body', 'trapezius'
  ));
