create table if not exists public.exercise_translations (
  exercise_id uuid not null references public.exercises(id) on delete cascade,
  locale text not null check (locale in ('vi')),
  name text not null,
  description text,
  instructions text[],
  safety_notes text,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (exercise_id, locale)
);

create table if not exists public.food_translations (
  food_id uuid not null references public.foods(id) on delete cascade,
  locale text not null check (locale in ('vi')),
  name text not null,
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (food_id, locale)
);

drop trigger if exists exercise_translations_set_updated_at on public.exercise_translations;
create trigger exercise_translations_set_updated_at before update on public.exercise_translations
for each row execute procedure public.set_updated_at();
drop trigger if exists food_translations_set_updated_at on public.food_translations;
create trigger food_translations_set_updated_at before update on public.food_translations
for each row execute procedure public.set_updated_at();

alter table public.exercise_translations enable row level security;
alter table public.food_translations enable row level security;

create policy "Public can read visible exercise translations" on public.exercise_translations
for select to anon, authenticated using (exists (
  select 1 from public.exercises e where e.id = exercise_id
));
create policy "Admins can write exercise translations" on public.exercise_translations
for insert to authenticated with check (public.is_admin());
create policy "Admins can update exercise translations" on public.exercise_translations
for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "Users can read visible food translations" on public.food_translations
for select to authenticated using (exists (
  select 1 from public.foods f where f.id = food_id
));
create policy "Admins can write food translations" on public.food_translations
for insert to authenticated with check (public.is_admin());
create policy "Admins can update food translations" on public.food_translations
for update to authenticated using (public.is_admin()) with check (public.is_admin());

grant select on public.exercise_translations to anon, authenticated;
grant insert, update on public.exercise_translations to authenticated;
grant select on public.food_translations to authenticated;
grant insert, update on public.food_translations to authenticated;
grant select, insert, update on public.exercise_translations to service_role;
grant select, insert, update on public.food_translations to service_role;
