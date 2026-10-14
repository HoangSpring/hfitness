create table if not exists public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category text not null,
  serving_size numeric not null check (serving_size > 0),
  unit text not null,
  calories numeric not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbs numeric not null check (carbs >= 0),
  fat numeric not null check (fat >= 0),
  status text not null default 'PUBLISHED' check (status in ('DRAFT', 'PUBLISHED', 'ARCHIVED')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK')),
  eaten_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  food_id uuid references public.foods(id) on delete set null,
  quantity numeric not null check (quantity > 0 and quantity <= 50),
  calories numeric not null check (calories >= 0),
  protein numeric not null check (protein >= 0),
  carbs numeric not null check (carbs >= 0),
  fat numeric not null check (fat >= 0),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists foods_name_idx on public.foods using btree (name);
create index if not exists meals_user_eaten_at_idx on public.meals (user_id, eaten_at);
create index if not exists meal_items_meal_idx on public.meal_items (meal_id);

alter table public.foods enable row level security;
alter table public.meals enable row level security;
alter table public.meal_items enable row level security;

grant select on public.foods to authenticated;
grant select, insert, update on public.foods to service_role;
grant select, insert, update, delete on public.meals to authenticated;
grant select, insert, update, delete on public.meal_items to authenticated;
grant select, insert, update, delete on public.meals to service_role;
grant select, insert, update, delete on public.meal_items to service_role;
revoke all on public.foods, public.meals, public.meal_items from anon;
revoke all on public.foods, public.meals, public.meal_items from public;

drop policy if exists foods_published_select on public.foods;
create policy foods_published_select on public.foods for select to authenticated
  using (status = 'PUBLISHED');

drop policy if exists meals_own_select on public.meals;
create policy meals_own_select on public.meals for select to authenticated using (auth.uid() = user_id);
drop policy if exists meals_own_insert on public.meals;
create policy meals_own_insert on public.meals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists meals_own_update on public.meals;
create policy meals_own_update on public.meals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists meals_own_delete on public.meals;
create policy meals_own_delete on public.meals for delete to authenticated using (auth.uid() = user_id);

drop policy if exists meal_items_own_select on public.meal_items;
create policy meal_items_own_select on public.meal_items for select to authenticated using (auth.uid() = user_id);
drop policy if exists meal_items_own_insert on public.meal_items;
create policy meal_items_own_insert on public.meal_items for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid())
  );
drop policy if exists meal_items_own_update on public.meal_items;
create policy meal_items_own_update on public.meal_items for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = auth.uid())
  );
drop policy if exists meal_items_own_delete on public.meal_items;
create policy meal_items_own_delete on public.meal_items for delete to authenticated using (auth.uid() = user_id);
