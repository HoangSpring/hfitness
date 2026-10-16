create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'ADMIN'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

grant select, insert, update on public.exercises to authenticated;
grant select, insert, update on public.foods to authenticated;
revoke insert, update, delete on public.exercises, public.foods from anon, public;

drop policy if exists "Public can view published exercises" on public.exercises;
create policy "Public can view published exercises"
  on public.exercises for select
  to anon
  using (status = 'PUBLISHED');

drop policy if exists exercises_authenticated_select on public.exercises;
create policy exercises_authenticated_select
  on public.exercises for select
  to authenticated
  using (status = 'PUBLISHED' or public.is_admin());

drop policy if exists exercises_admin_insert on public.exercises;
create policy exercises_admin_insert
  on public.exercises for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists exercises_admin_update on public.exercises;
create policy exercises_admin_update
  on public.exercises for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists foods_published_select on public.foods;
create policy foods_published_select
  on public.foods for select
  to authenticated
  using (status = 'PUBLISHED' or public.is_admin());

drop policy if exists foods_admin_insert on public.foods;
create policy foods_admin_insert
  on public.foods for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists foods_admin_update on public.foods;
create policy foods_admin_update
  on public.foods for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
