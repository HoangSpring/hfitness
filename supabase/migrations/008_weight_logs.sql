create table if not exists public.weight_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  weight_kg numeric not null,
  logged_on date not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint weight_logs_weight_check check (weight_kg between 20 and 400)
);

create unique index if not exists weight_logs_user_logged_on_idx
  on public.weight_logs (user_id, logged_on);

alter table public.weight_logs enable row level security;

revoke all on table public.weight_logs from anon, public;
grant select, insert, update, delete on table public.weight_logs to authenticated;
grant select, insert, update, delete on table public.weight_logs to service_role;

drop policy if exists weight_logs_own_select on public.weight_logs;
create policy weight_logs_own_select on public.weight_logs
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists weight_logs_own_insert on public.weight_logs;
create policy weight_logs_own_insert on public.weight_logs
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists weight_logs_own_update on public.weight_logs;
create policy weight_logs_own_update on public.weight_logs
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists weight_logs_own_delete on public.weight_logs;
create policy weight_logs_own_delete on public.weight_logs
  for delete to authenticated using (auth.uid() = user_id);
