create table if not exists public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists ai_conversations_user_created_idx
  on public.ai_conversations (user_id, created_at desc);
create index if not exists ai_messages_conversation_created_idx
  on public.ai_messages (conversation_id, created_at);

alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;

revoke all on table public.ai_conversations, public.ai_messages from anon, public;
grant select, insert, update, delete on table public.ai_conversations, public.ai_messages to authenticated;
grant select, insert, update, delete on table public.ai_conversations, public.ai_messages to service_role;

drop policy if exists ai_conversations_own_select on public.ai_conversations;
create policy ai_conversations_own_select on public.ai_conversations
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists ai_conversations_own_insert on public.ai_conversations;
create policy ai_conversations_own_insert on public.ai_conversations
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists ai_conversations_own_update on public.ai_conversations;
create policy ai_conversations_own_update on public.ai_conversations
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists ai_conversations_own_delete on public.ai_conversations;
create policy ai_conversations_own_delete on public.ai_conversations
  for delete to authenticated using (auth.uid() = user_id);

drop policy if exists ai_messages_own_select on public.ai_messages;
create policy ai_messages_own_select on public.ai_messages
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists ai_messages_own_insert on public.ai_messages;
create policy ai_messages_own_insert on public.ai_messages
  for insert to authenticated with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
drop policy if exists ai_messages_own_update on public.ai_messages;
create policy ai_messages_own_update on public.ai_messages
  for update to authenticated using (auth.uid() = user_id) with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.ai_conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );
drop policy if exists ai_messages_own_delete on public.ai_messages;
create policy ai_messages_own_delete on public.ai_messages
  for delete to authenticated using (auth.uid() = user_id);
