-- ============================================================
-- StudyGuide – Supabase Database Migration
-- Run this entire script in Supabase > SQL Editor > New Query
-- ============================================================

-- Create the main user data table
-- One row per user; all study data stored as JSONB blobs
create table if not exists public.user_data (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  profile     jsonb    default null,
  tasks       jsonb    default '[]'::jsonb,
  messages    jsonb    default '[]'::jsonb,
  tests       jsonb    default '[]'::jsonb,
  study_logs  jsonb    default '[]'::jsonb,
  past_papers jsonb    default '{}'::jsonb,
  streak      integer  default 0,
  gemini_key  text     default '',
  updated_at  timestamptz default now()
);

-- Enable Row Level Security so users can only access their own data
alter table public.user_data enable row level security;

-- Policy: users can SELECT their own row only
create policy "Users can view own data"
  on public.user_data
  for select
  using (auth.uid() = user_id);

-- Policy: users can INSERT their own row only
create policy "Users can insert own data"
  on public.user_data
  for insert
  with check (auth.uid() = user_id);

-- Policy: users can UPDATE their own row only
create policy "Users can update own data"
  on public.user_data
  for update
  using (auth.uid() = user_id);

-- Policy: users can DELETE their own row only
create policy "Users can delete own data"
  on public.user_data
  for delete
  using (auth.uid() = user_id);

-- Automatically update the updated_at timestamp on every update
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger on_user_data_updated
  before update on public.user_data
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- Username lookup for login (username OR email)
-- ============================================================

create table if not exists public.profiles (
  user_id  uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  email    text not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = user_id);

-- Auto-create profile row when a new auth user registers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (user_id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (user_id) do update
    set username = excluded.username,
        email    = excluded.email;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Allow login form to resolve username → email (anon-safe RPC)
create or replace function public.get_email_by_username(uname text)
returns text
language sql
security definer
stable
set search_path = public
as $$
  select email from public.profiles where lower(username) = lower(uname) limit 1;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;

-- Backfill profiles for users who registered before this migration
insert into public.profiles (user_id, username, email)
select
  id,
  coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1)),
  email
from auth.users
on conflict (user_id) do nothing;
