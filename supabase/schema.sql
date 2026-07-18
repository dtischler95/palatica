-- Palatica schema for Supabase (Postgres).
-- Run once in the project's SQL editor.
-- Row Level Security is what keeps the public anon key safe: without it, anyone
-- holding the frontend-visible key could read and write every row. Per-user rows
-- fall out of that for free and let a second person learn on the same DB with
-- their own separate progress.

create table if not exists entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- No CHECK on kind: the set of collections lives in js/collections.js, a new
  -- one should not cost a migration.
  kind          text not null,
  word          text not null,
  trans         text not null,
  ex            text not null default '',
  tags          text[] not null default '{}',
  reps          int  not null default 0,
  -- "interval" is reserved in Postgres, hence interval_days.
  interval_days int  not null default 0,
  due_at        timestamptz not null default now(),
  learned_at    timestamptz,
  added_at      timestamptz not null default now(),
  -- Free-form space for later per-entry data (image path, audio, note), so such
  -- additions need no schema change.
  meta          jsonb not null default '{}'::jsonb
);

create table if not exists history (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entry_id uuid references entries(id) on delete set null,
  ts       timestamptz not null default now(),
  level    text not null check (level in ('good','hard','fail')),
  kind     text not null
);

alter table entries enable row level security;
alter table history enable row level security;

-- Each user sees and changes only their own rows.
drop policy if exists "own entries" on entries;
create policy "own entries" on entries
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "own history" on history;
create policy "own history" on history
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create index if not exists entries_user_kind_due on entries (user_id, kind, due_at);
create index if not exists entries_tags_gin      on entries using gin (tags);
create index if not exists history_user_ts       on history (user_id, ts);
