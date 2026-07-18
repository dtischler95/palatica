-- Palatica: Schema fuer Supabase (Postgres).
-- Einmal im SQL-Editor des Supabase-Projekts ausfuehren.
-- Die Trennung pro Nutzer wird ueber Row Level Security durchgesetzt, nicht im Frontend.

create table if not exists entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  -- Bewusst ohne CHECK: welche Sammlungen es gibt, steht in js/collections.js.
  -- Eine neue Sammlung soll keine Migration kosten.
  kind          text not null,
  word          text not null,
  trans         text not null,
  ex            text not null default '',
  tags          text[] not null default '{}',
  reps          int  not null default 0,
  -- "interval" ist in Postgres reserviert, daher interval_days.
  interval_days int  not null default 0,
  due_at        timestamptz not null default now(),
  learned_at    timestamptz,
  added_at      timestamptz not null default now(),
  -- Freier Sack fuer spaetere Zusatzdaten pro Eintrag (Bild-Pfad, Audio, Notiz),
  -- damit solche Erweiterungen ohne Schema-Aenderung auskommen.
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

-- Jeder Nutzer sieht und aendert ausschliesslich eigene Zeilen.
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
