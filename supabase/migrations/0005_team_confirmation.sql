-- Teams by Telegram username, and confirmation a few days before the event.
--
-- 1. Any account can connect Telegram through the Lumora bot (/start <code>, code from
--    channel_code()). The bot stores the Telegram id and username in tg_links.
-- 2. A team lead needs an account with Telegram connected. Members are listed by name and
--    Telegram username and need no account. When someone later connects Telegram (or signs in
--    with Telegram), the site matches the username and shows them their team.
-- 3. Before the event an admin asks teams to confirm (Edge Function tg-bot, action
--    "request_confirm"). The bot writes to each lead with the team's link; every member who opens
--    it and is subscribed to @thelumoraa is confirmed. A team is confirmed once at least teamMin
--    people are. A smaller team can agree to be merged with another one (merge_ok).
-- The channel subscription is no longer needed to register; it is checked at confirmation.

-- ---------- Telegram link ----------

alter table public.tg_links add column if not exists username text;
create unique index if not exists tg_links_tg_id on public.tg_links (tg_id);
grant select on public.tg_links to authenticated;
drop policy if exists read_own_tg on public.tg_links;
create policy read_own_tg on public.tg_links for select using (user_id = auth.uid() or is_admin());

/** the Telegram usernames of the signed-in person: connected through the bot or used to sign in */
create or replace function public.my_tg_usernames() returns text[]
language sql stable security definer set search_path = public, auth as $$
  select coalesce(array_agg(distinct lower(u)) filter (where coalesce(u, '') <> ''), '{}')
  from (
    select username as u from public.tg_links where user_id = auth.uid()
    union all
    select identity_data ->> 'preferred_username' from auth.identities where user_id = auth.uid() and provider = 'custom:telegram'
  ) s;
$$;

-- ---------- team members ----------

alter table public.teams
  add column if not exists confirm_code text unique,
  add column if not exists confirm_requested_at timestamptz,
  add column if not exists confirmed_at timestamptz,
  add column if not exists merge_ok boolean not null default false;

create table if not exists public.team_members (
  id text primary key default new_id('tmm'),
  team_id text not null references public.teams (id) on delete cascade,
  hackathon_id text not null,
  name text not null default '',
  username text,
  is_lead boolean not null default false,
  user_id uuid references public.profiles (id) on delete set null,
  tg_id bigint,
  confirmed_at timestamptz,
  declined_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists team_members_event_username on public.team_members (hackathon_id, username)
  where username is not null and declined_at is null;
create index if not exists team_members_team on public.team_members (team_id);
alter table public.team_members enable row level security;

create or replace function public.is_team_lead(tid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from teams where id = tid and lead_id = auth.uid());
$$;

create or replace function public.in_team(tid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from team_members m
    where m.team_id = tid and m.declined_at is null
      and (m.user_id = auth.uid() or m.username = any (my_tg_usernames()))
  );
$$;

drop policy if exists read_teams on public.teams;
create policy read_teams on public.teams for select using (lead_id = auth.uid() or is_admin() or in_team(id));
create policy read_team_members on public.team_members for select using (
  is_admin() or is_team_lead(team_id) or user_id = auth.uid() or (declined_at is null and username = any (my_tg_usernames()))
);
grant select on public.team_members to authenticated;

/** "@Name", "t.me/name" or "name" -> "name"; empty when there is none */
create or replace function public.norm_username(v text) returns text
language sql immutable as $$
  select lower(regexp_replace(trim(coalesce(v, '')), '^(https?://)?(t\.me/|telegram\.me/)?@?', '', 'i'));
$$;

/**
 * Checks a member list ([{name, username}]) for a team and returns it cleaned up.
 * Errors: "badUsername|x", "dupUsername|x", "usernameTaken|x".
 */
create or replace function public.clean_members(hid text, tid text, lead_username text, members jsonb)
returns table (name text, username text)
language plpgsql security definer set search_path = public as $$
declare m jsonb; nm text; un text; seen text[] := '{}';
begin
  for m in select * from jsonb_array_elements(coalesce(members, '[]'::jsonb)) loop
    nm := trim(coalesce(m ->> 'name', ''));
    un := norm_username(m ->> 'username');
    continue when nm = '' and un = '';
    if un <> '' then
      if un !~ '^[a-z][a-z0-9_]{3,31}$' then perform fail('badUsername|' || un); end if;
      continue when un = coalesce(lead_username, '');
      if un = any (seen) then perform fail('dupUsername|' || un); end if;
      if exists (select 1 from team_members x where x.hackathon_id = hid and x.username = un and x.declined_at is null and x.team_id <> coalesce(tid, '')) then
        perform fail('usernameTaken|' || un);
      end if;
      seen := seen || un;
    end if;
    name := left(nm, 80);
    username := nullif(un, '');
    return next;
  end loop;
end $$;

-- ---------- registration ----------

create or replace function public.team_register(hid text, input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare
  me profiles; link tg_links; h hackathons; tid text := new_id('tm'); n int; size int;
  nowl text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD"T"HH24:MI');
  lead_name text; shown jsonb; names text[]; unames text[];
begin
  select * into me from profiles where id = auth.uid();
  if me is null or me.kind <> 'talent' then perform fail('talentOnly'); end if;
  select * into link from tg_links where user_id = me.id;
  if link is null then perform fail('telegramRequired'); end if;
  select * into h from hackathons where id = hid;
  if h is null then perform fail('eventNotFound'); end if;
  if h.status <> 'registration_open' then perform fail('regNotOpen'); end if;
  if coalesce(h.data ->> 'regClose', '') <> '' and nowl > h.data ->> 'regClose' then perform fail('regClosed'); end if;
  if exists (select 1 from teams where hackathon_id = hid and lead_id = me.id) then perform fail('alreadyRegistered'); end if;
  if link.username is not null and exists (select 1 from team_members where hackathon_id = hid and username = link.username and declined_at is null) then
    perform fail('usernameTaken|' || link.username);
  end if;
  select count(*) into n from teams where hackathon_id = hid;
  if coalesce((h.data ->> 'maxTeams')::int, 0) > 0 and n >= (h.data ->> 'maxTeams')::int then perform fail('eventFull'); end if;
  if trim(coalesce(input ->> 'teamName', '')) = '' then perform fail('noTeamName'); end if;
  if not coalesce((input ->> 'consent')::boolean, false) then perform fail('noConsent'); end if;

  select coalesce(array_agg(c.name), '{}'), coalesce(array_agg(c.username), '{}') into names, unames
    from clean_members(hid, null, link.username, input -> 'members') c;
  size := coalesce(array_length(names, 1), 0) + 1;
  if size > coalesce((h.data ->> 'teamMax')::int, 99) then perform fail('teamMax'); end if;

  lead_name := coalesce(nullif(me.data ->> 'name', ''), link.username, 'Lead');
  select coalesce(jsonb_agg(case when u is null then nm when nm = '' then '@' || u else nm || ' (@' || u || ')' end), '[]'::jsonb)
    into shown from unnest(names, unames) as m(nm, u);

  insert into teams (id, hackathon_id, lead_id, confirm_code, data)
  values (tid, hid, me.id, replace(gen_random_uuid()::text, '-', ''),
    (input - 'id' - 'hackathonId' - 'leadId' - 'createdAt' - 'members' - 'consent')
    || jsonb_build_object('id', tid, 'hackathonId', hid, 'leadId', me.id, 'createdAt', now(),
         'members', jsonb_build_array(lead_name || coalesce(' (@' || link.username || ')', '')) || shown,
         'contact', coalesce('@' || link.username, input ->> 'contact', '')));
  insert into team_members (team_id, hackathon_id, name, username, is_lead, user_id, tg_id)
  values (tid, hid, lead_name, link.username, true, me.id, link.tg_id);
  insert into team_members (team_id, hackathon_id, name, username) select tid, hid, nm, u from unnest(names, unames) as m(nm, u);

  update hackathons set team_count = team_count + 1 where id = hid;
  perform notify(me.id, 'event', 'n.registeredTitle', jsonb_build_object('title', h.data ->> 'title'), 'n.registeredBody', jsonb_build_object('team', input ->> 'teamName'), '#/app/hackathons/' || hid);
  return tid;
end $$;

/** the lead fixes the list: confirmed people stay, everyone else is replaced by the new list */
create or replace function public.team_set_members(tid text, members jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare t teams; h hackathons; lead team_members; size int; shown jsonb; names text[]; unames text[];
begin
  select * into t from teams where id = tid;
  if t is null or t.lead_id <> auth.uid() then perform fail('notFound'); end if;
  select * into h from hackathons where id = t.hackathon_id;
  select * into lead from team_members where team_id = tid and is_lead;
  delete from team_members where team_id = tid and not is_lead and confirmed_at is null and declined_at is null;
  -- people who already confirmed stay as they are, so they are left out of the new list
  select coalesce(array_agg(c.name), '{}'), coalesce(array_agg(c.username), '{}') into names, unames
    from clean_members(t.hackathon_id, tid, lead.username, members) c
    where c.username is null or not exists (select 1 from team_members x where x.team_id = tid and x.username = c.username);
  select count(*) into size from team_members where team_id = tid and declined_at is null;
  if size + coalesce(array_length(names, 1), 0) > coalesce((h.data ->> 'teamMax')::int, 99) then perform fail('teamMax'); end if;
  insert into team_members (team_id, hackathon_id, name, username) select tid, t.hackathon_id, nm, u from unnest(names, unames) as m(nm, u);
  select coalesce(jsonb_agg(case when x.username is null then x.name when x.name = '' then '@' || x.username else x.name || ' (@' || x.username || ')' end order by x.is_lead desc, x.created_at), '[]'::jsonb)
    into shown from team_members x where x.team_id = tid and x.declined_at is null;
  update teams set data = data || jsonb_build_object('members', shown) where id = tid;
end $$;

/** "this is not me": someone was listed by mistake */
create or replace function public.team_member_decline(mid text) returns void
language plpgsql security definer set search_path = public as $$
declare m team_members; t teams;
begin
  select * into m from team_members where id = mid;
  if m is null or m.is_lead or not (m.user_id = auth.uid() or m.username = any (my_tg_usernames())) then perform fail('notFound'); end if;
  update team_members set declined_at = now(), user_id = null where id = mid;
  select * into t from teams where id = m.team_id;
  perform notify(t.lead_id, 'event', 'n.memberDeclinedTitle', jsonb_build_object('team', t.data ->> 'teamName'),
    'n.memberDeclinedBody', jsonb_build_object('who', coalesce('@' || m.username, m.name)), '#/app/hackathons/' || t.hackathon_id);
end $$;

/** a small team agrees to be merged with another one by the organizers */
create or replace function public.team_merge_ok(tid text, ok boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  update teams set merge_ok = ok where id = tid and lead_id = auth.uid();
  if not found then perform fail('notFound'); end if;
end $$;

revoke execute on function public.clean_members(text, text, text, jsonb) from public, anon, authenticated;
revoke execute on function public.team_set_members(text, jsonb), public.team_member_decline(text), public.team_merge_ok(text, boolean),
  public.my_tg_usernames() from public, anon;
grant execute on function public.team_set_members(text, jsonb), public.team_member_decline(text), public.team_merge_ok(text, boolean),
  public.my_tg_usernames() to authenticated;

alter publication supabase_realtime add table public.team_members, public.tg_links;
