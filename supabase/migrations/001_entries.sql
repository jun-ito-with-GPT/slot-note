create table public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  played_on date not null,
  store text not null check (char_length(trim(store)) between 1 and 100),
  machine text not null check (char_length(trim(machine)) between 1 and 100),
  investment integer not null check (investment between 0 and 100000000),
  returned integer not null check (returned between 0 and 100000000),
  memo text not null default '' check (char_length(memo) <= 2000),
  created_at timestamptz not null default now()
);
create index entries_user_date on public.entries(user_id, played_on desc);
alter table public.entries enable row level security;
revoke all on public.entries from anon;
grant select, insert, update, delete on public.entries to authenticated;
create policy "Read own entries" on public.entries for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own entries" on public.entries for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own entries" on public.entries for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Delete own entries" on public.entries for delete to authenticated using ((select auth.uid()) = user_id);
