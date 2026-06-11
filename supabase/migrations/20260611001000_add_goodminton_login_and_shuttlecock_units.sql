alter table public.sessions
add column if not exists shuttlecock_unit_price integer not null default 0 check (shuttlecock_unit_price >= 0),
add column if not exists shuttlecock_quantity integer not null default 0 check (shuttlecock_quantity >= 0);

alter table public.sessions
drop constraint if exists sessions_shuttlecock_fee_matches_units;

alter table public.sessions
add constraint sessions_shuttlecock_fee_matches_units
check (
  (shuttlecock_unit_price = 0 and shuttlecock_quantity = 0)
  or shuttlecock_fee = shuttlecock_unit_price * shuttlecock_quantity
);

alter table public.members
add column if not exists login_name text,
add column if not exists pin_code text;

create unique index if not exists members_login_name_key
on public.members (login_name)
where login_name is not null;
