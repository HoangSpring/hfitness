drop policy if exists "Users can create their own minimal profile" on public.profiles;
create policy "Users can create their own minimal profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id and role = 'USER');
