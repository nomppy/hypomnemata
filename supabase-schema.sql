-- Supabase schema for Hypomnēmata sync
-- Run this in the Supabase SQL Editor to set up the project

create table entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  source text default '',
  tags text[] default '{}',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Index for fast user lookups
create index entries_user_id_idx on entries(user_id);
create index entries_updated_at_idx on entries(updated_at);

-- Row Level Security: users can only access their own entries
alter table entries enable row level security;

create policy "Users can read own entries"
  on entries for select
  using (auth.uid() = user_id);

create policy "Users can insert own entries"
  on entries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own entries"
  on entries for update
  using (auth.uid() = user_id);

create policy "Users can delete own entries"
  on entries for delete
  using (auth.uid() = user_id);
