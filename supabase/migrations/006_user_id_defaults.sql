alter table public.workout_sessions alter column user_id set default auth.uid();
alter table public.workout_sets alter column user_id set default auth.uid();
