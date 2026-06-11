alter table public.session_players
add column if not exists paid_amount integer not null default 0 check (paid_amount >= 0);

update public.session_players
set paid_amount = amount
where paid = true
  and paid_amount = 0;

update public.session_players
set paid = paid_amount >= amount;

alter table public.session_players
drop constraint if exists session_players_paid_at_consistency;

update public.session_players
set paid_at = now()
where paid_amount > 0
  and paid_at is null;

alter table public.session_players
add constraint session_players_paid_at_consistency
check (
  (paid_amount = 0 and paid_at is null)
  or (paid_amount > 0 and paid_at is not null)
);

create index if not exists session_players_member_id_idx on public.session_players (member_id);
create index if not exists session_players_session_id_idx on public.session_players (session_id);
