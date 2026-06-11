create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  court_fee integer not null default 0 check (court_fee >= 0),
  shuttlecock_fee integer not null default 0 check (shuttlecock_fee >= 0),
  drink_fee integer not null default 0 check (drink_fee >= 0),
  other_fee integer not null default 0 check (other_fee >= 0),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.session_players (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  member_id uuid references public.members(id) on delete set null,
  member_name_snapshot text not null,
  share_count numeric not null default 1 check (share_count > 0),
  drink_shared boolean not null default false,
  adjustment integer not null default 0,
  amount integer not null default 0,
  paid boolean not null default false,
  paid_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint session_players_paid_at_consistency check (
    (paid = true and paid_at is not null)
    or (paid = false and paid_at is null)
  )
);

create index if not exists members_active_name_idx on public.members (active, name);
create index if not exists sessions_date_idx on public.sessions (date desc);
create index if not exists session_players_session_id_idx on public.session_players (session_id);
create index if not exists session_players_member_id_idx on public.session_players (member_id);
create index if not exists session_players_paid_idx on public.session_players (paid);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists members_set_updated_at on public.members;
create trigger members_set_updated_at
before update on public.members
for each row execute function public.set_updated_at();

drop trigger if exists sessions_set_updated_at on public.sessions;
create trigger sessions_set_updated_at
before update on public.sessions
for each row execute function public.set_updated_at();

drop trigger if exists session_players_set_updated_at on public.session_players;
create trigger session_players_set_updated_at
before update on public.session_players
for each row execute function public.set_updated_at();

alter table public.members enable row level security;
alter table public.sessions enable row level security;
alter table public.session_players enable row level security;

drop policy if exists "Deny direct member access" on public.members;
create policy "Deny direct member access"
on public.members
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Deny direct session access" on public.sessions;
create policy "Deny direct session access"
on public.sessions
as restrictive
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "Deny direct session player access" on public.session_players;
create policy "Deny direct session player access"
on public.session_players
as restrictive
for all
to anon, authenticated
using (false)
with check (false);
