alter table public.exercises
  add column if not exists image_urls text[] not null default '{}';

insert into storage.buckets (id, name, public)
values ('exercise-media', 'exercise-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can view exercise media" on storage.objects;
create policy "Public can view exercise media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'exercise-media');

drop policy if exists "Service role can manage exercise media" on storage.objects;
create policy "Service role can manage exercise media"
  on storage.objects for all
  to service_role
  using (bucket_id = 'exercise-media')
  with check (bucket_id = 'exercise-media');
