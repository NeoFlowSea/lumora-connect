-- Registering a team for a Lumora event needs a subscription to the Lumora Telegram channel
-- (@thelumoraa). Signing up on the site does not.
--
-- How the check works: the site asks for a one-time code (channel_code), the person opens the
-- Lumora bot with it (t.me/Lumora_connect_bot?start=<code>), and the bot (Edge Function tg-bot,
-- supabase/functions/tg-bot) sees the person's Telegram account, asks Telegram whether it is in
-- the channel and, if so, stamps channel_ok_at on the profile. This works the same for people
-- who signed in with Google, and the site never needs the Telegram user id itself.

alter table public.profiles add column if not exists channel_ok_at timestamptz;

-- one-time codes that tie a bot chat to a site account; only the bot (service role) reads them
create table if not exists public.channel_codes (
  code text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.channel_codes enable row level security;

-- which Telegram account confirmed the subscription, so the site can re-check later;
-- private: no read policy at all
create table if not exists public.tg_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  tg_id bigint not null,
  at timestamptz not null default now()
);
alter table public.tg_links enable row level security;

create or replace function public.channel_code() returns text
language plpgsql security definer set search_path = public as $$
declare c text := replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null or not exists (select 1 from profiles where id = auth.uid()) then perform fail('signInFirst'); end if;
  delete from channel_codes where user_id = auth.uid() or created_at < now() - interval '1 day';
  insert into channel_codes (code, user_id) values (c, auth.uid());
  return c;
end $$;

-- team_register from 0001, plus the channel check
create or replace function public.team_register(hid text, input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; h hackathons; tid text := new_id('tm'); n int; size int; nowl text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD"T"HH24:MI');
begin
  select * into me from profiles where id = auth.uid();
  if me is null or me.kind <> 'talent' then perform fail('talentOnly'); end if;
  if me.channel_ok_at is null then perform fail('channelRequired'); end if;
  select * into h from hackathons where id = hid;
  if h is null then perform fail('eventNotFound'); end if;
  if h.status <> 'registration_open' then perform fail('regNotOpen'); end if;
  if coalesce(h.data ->> 'regClose', '') <> '' and nowl > h.data ->> 'regClose' then perform fail('regClosed'); end if;
  if exists (select 1 from teams where hackathon_id = hid and lead_id = me.id) then perform fail('alreadyRegistered'); end if;
  select count(*) into n from teams where hackathon_id = hid;
  if coalesce((h.data ->> 'maxTeams')::int, 0) > 0 and n >= (h.data ->> 'maxTeams')::int then perform fail('eventFull'); end if;
  if trim(coalesce(input ->> 'teamName', '')) = '' then perform fail('noTeamName'); end if;
  select count(*) into size from jsonb_array_elements_text(coalesce(input -> 'members', '[]'::jsonb)) m where trim(m) <> '';
  if size > coalesce((h.data ->> 'teamMax')::int, 99) then perform fail('teamMax'); end if;
  insert into teams (id, hackathon_id, lead_id, data)
  values (tid, hid, me.id, (input - 'id' - 'hackathonId' - 'leadId' - 'createdAt') || jsonb_build_object('id', tid, 'hackathonId', hid, 'leadId', me.id, 'createdAt', now()));
  update hackathons set team_count = team_count + 1 where id = hid;
  perform notify(me.id, 'event', 'n.registeredTitle', jsonb_build_object('title', h.data ->> 'title'), 'n.registeredBody', jsonb_build_object('team', input ->> 'teamName'), '#/app/hackathons/' || hid);
  return tid;
end $$;

revoke execute on function public.channel_code() from public, anon;
grant execute on function public.channel_code() to authenticated;
revoke all on public.channel_codes, public.tg_links from anon, authenticated;
