-- Lumora Connect: database for the real backend (Supabase).
-- Clients never write to tables directly: every change goes through a SECURITY DEFINER
-- function below, which checks who is asking, the same way the browser mock did.
-- Reading is limited by row level security. Errors are raised with a short code
-- (for example 'companyPending'); the site shows the text for that code in the visitor's language.
-- Notifications store a text code and variables, and the site translates them on display.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------- tables

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  kind text not null check (kind in ('talent', 'company', 'admin')),
  status text,                      -- companies: pending / approved / rejected
  level text,                       -- admins: super / moderator
  onboarded boolean not null default false,
  verification_level text not null default 'unverified',
  data jsonb not null,              -- the public part of the profile (no email, contact or CV)
  created_at timestamptz not null default now()
);

-- contacts and CV: visible to the person, admins, the other side of a match,
-- and a company the talent applied to
create table public.profile_private (
  id uuid primary key references public.profiles (id) on delete cascade,
  data jsonb not null default '{}'::jsonb
);

create table public.opportunities (
  id text primary key,
  company_id uuid not null references public.profiles (id) on delete cascade,
  hidden boolean not null default false,
  app_count int not null default 0,
  posted_at timestamptz not null default now(),
  data jsonb not null
);

create table public.applications (
  id text primary key,
  opportunity_id text not null references public.opportunities (id) on delete cascade,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  data jsonb not null,
  unique (opportunity_id, talent_id)
);

create table public.swipes (
  from_id uuid not null references public.profiles (id) on delete cascade,
  to_id uuid not null references public.profiles (id) on delete cascade,
  dir smallint not null check (dir in (1, -1)),
  at timestamptz not null default now(),
  primary key (from_id, to_id)
);

create table public.messages (
  id text primary key,
  match_id text not null,
  talent_id uuid not null references public.profiles (id) on delete cascade,
  company_id uuid not null references public.profiles (id) on delete cascade,
  from_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  at timestamptz not null default now()
);

create table public.notifications (
  id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  read boolean not null default false,
  at timestamptz not null default now(),
  data jsonb not null               -- { kind, t: [code, vars], b: [code, vars] | null, text, link }
);

create table public.hackathons (
  id text primary key,
  status text not null,
  team_count int not null default 0,
  data jsonb not null
);

create table public.teams (
  id text primary key,
  hackathon_id text not null references public.hackathons (id) on delete cascade,
  lead_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  data jsonb not null,
  unique (hackathon_id, lead_id)
);

create table public.audit (
  id text primary key,
  at timestamptz not null default now(),
  data jsonb not null
);

create index on public.applications (talent_id);
create index on public.applications (company_id);
create index on public.messages (match_id);
create index on public.notifications (user_id, at desc);
create index on public.swipes (to_id);

-- ---------------------------------------------------------------- helpers

create or replace function public.new_id(prefix text) returns text
language sql volatile as $$
  select prefix || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12)
$$;

create or replace function public.fail(code text) returns void
language plpgsql as $$
begin
  raise exception '%', code using errcode = 'P0001';
end $$;

create or replace function public.my_kind() returns text
language sql stable security definer set search_path = public as $$
  select kind from profiles where id = auth.uid()
$$;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and kind = 'admin')
$$;

create or replace function public.is_super() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and kind = 'admin' and level = 'super')
$$;

create or replace function public.liked(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from swipes where from_id = a and to_id = b and dir = 1)
$$;

create or replace function public.matched(a uuid, b uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select liked(a, b) and liked(b, a)
$$;

-- may the current user see this person's contacts and CV?
create or replace function public.can_see_private(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select auth.uid() = target
      or is_admin()
      or matched(auth.uid(), target)
      or exists (select 1 from applications where talent_id = target and company_id = auth.uid())
$$;

create or replace function public.notify(
  target uuid, kind text, t_code text, t_vars jsonb, b_code text, b_vars jsonb, link text, body_text text default null
) returns void
language sql security definer set search_path = public as $$
  insert into notifications (id, user_id, data)
  values (new_id('n'), target, jsonb_build_object(
    'kind', kind,
    't', jsonb_build_array(t_code, coalesce(t_vars, '{}'::jsonb)),
    'b', case when b_code is null then null else jsonb_build_array(b_code, coalesce(b_vars, '{}'::jsonb)) end,
    'text', body_text,
    'link', link))
$$;

create or replace function public.notify_admins(kind text, t_code text, t_vars jsonb, b_code text, b_vars jsonb, link text) returns void
language plpgsql security definer set search_path = public as $$
declare a record;
begin
  for a in select id from profiles where kind = 'admin' loop
    perform notify(a.id, kind, t_code, t_vars, b_code, b_vars, link);
  end loop;
end $$;

create or replace function public.audit_log(action text, target text, detail text default '') returns void
language sql security definer set search_path = public as $$
  insert into audit (id, data)
  select new_id('au'), jsonb_build_object(
    'actorId', auth.uid(), 'actorName', coalesce(p.data ->> 'name', ''),
    'action', action, 'target', target, 'detail', coalesce(detail, ''), 'at', now())
  from profiles p where p.id = auth.uid()
$$;

create or replace function public.require_admin(super_only boolean default false) returns void
language plpgsql stable security definer set search_path = public as $$
begin
  if not is_admin() then perform fail('adminOnly'); end if;
  if super_only and not is_super() then perform fail('superOnly'); end if;
end $$;

-- ---------------------------------------------------------------- new accounts

-- Every new sign-in account (email, Google, Telegram) gets a profile. The kind comes from the
-- sign-up form; it can only be talent or company. Admins are made by another admin.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  k text := case when meta ->> 'type' = 'company' then 'company' else 'talent' end;
  nm text := coalesce(nullif(trim(meta ->> 'name'), ''), nullif(trim(meta ->> 'full_name'), ''), nullif(trim(meta ->> 'preferred_username'), ''), split_part(coalesce(new.email, ''), '@', 1), 'Lumora');
  city text := coalesce(trim(meta ->> 'city'), '');
  unverified jsonb := '{"level":"unverified","proof":"","proofValue":"","requestedAt":"","reviewedAt":"","note":""}';
  base jsonb;
begin
  base := jsonb_build_object(
    'name', nm, 'city', city, 'createdAt', now(), 'verification', unverified,
    'emailConfirmed', new.email_confirmed_at is not null,
    'consentAt', case when (meta ->> 'consent')::boolean then now()::text else '' end, 'demo', false);
  if k = 'talent' then
    base := base || jsonb_build_object(
      'cat', coalesce(meta ->> 'cat', ''), 'age', null, 'bio', '', 'skills', '[]'::jsonb, 'project', '',
      'avail', 'Part-time', 'portfolio', '', 'verified', false, 'badges', '[]'::jsonb,
      'photo', coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''), 'headline', '', 'region', city,
      'education', '{"institution":"","level":"","program":"","year":""}'::jsonb,
      'languages', '[]'::jsonb, 'experience', '[]'::jsonb, 'projects', '[]'::jsonb, 'roles', '[]'::jsonb,
      'workFormats', '[]'::jsonb, 'expectedStipend', '', 'github', '', 'linkedin', '');
  else
    base := base || jsonb_build_object(
      'orgKind', case when meta ->> 'orgKind' = 'organization' then 'organization' else 'company' end,
      'tagline', '', 'industry', '', 'size', '', 'about', '', 'tags', '[]'::jsonb, 'website', '',
      'statusNote', '', 'verified', false, 'partner', false, 'hue', '#2552c4', 'logo', '',
      'foundedYear', '', 'benefits', '[]'::jsonb, 'linkedin', '', 'telegram', '');
  end if;

  insert into profiles (id, kind, status, data) values (new.id, k, case when k = 'company' then 'pending' end, base);
  insert into profile_private (id, data) values (new.id, jsonb_build_object(
    'email', coalesce(new.email, ''),
    'contact', case when k = 'company' then coalesce(new.email, '') else '' end,
    'cv', null));

  perform notify(new.id, 'system', 'n.welcomeTitle', null, case when k = 'talent' then 'n.welcomeTalent' else 'n.welcomeCompany' end, null, '#/onboarding');
  if k = 'company' then
    perform notify_admins('company_status', 'n.newCompanyTitle', null, 'n.newCompanyBody', jsonb_build_object('name', nm), '#/admin/companies');
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- keep "emailConfirmed" in step with the sign-in account
create or replace function public.handle_user_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update profiles set data = jsonb_set(data, '{emailConfirmed}', 'true') where id = new.id and kind <> 'admin';
  end if;
  return new;
end $$;

create trigger on_auth_user_confirmed after update on auth.users
  for each row execute function public.handle_user_confirmed();

-- ---------------------------------------------------------------- profiles

create or replace function public.update_me(patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  protected text[] := array['kind','id','email','verified','badges','createdAt','verification','emailConfirmed','consentAt','demo','status','statusNote','partner','level','onboarded'];
  private_keys text[] := array['contact','cv'];
  pub jsonb := '{}'::jsonb;
  priv jsonb := '{}'::jsonb;
  k text; v jsonb;
begin
  if auth.uid() is null then perform fail('signInFirst'); end if;
  for k, v in select * from jsonb_each(coalesce(patch, '{}'::jsonb)) loop
    if k = any(protected) then continue; end if;
    if k = 'name' and trim(coalesce(v #>> '{}', '')) = '' then perform fail('emptyName'); end if;
    if length(v::text) > 2100000 then perform fail('fileTooBig'); end if;
    if k = any(private_keys) then priv := priv || jsonb_build_object(k, v);
    else pub := pub || jsonb_build_object(k, v);
    end if;
  end loop;
  update profiles set data = data || pub where id = auth.uid();
  if priv <> '{}'::jsonb then
    update profile_private set data = data || priv where id = auth.uid();
  end if;
end $$;

create or replace function public.finish_onboarding() returns void
language sql security definer set search_path = public as $$
  update profiles set onboarded = true, data = data || '{"onboarded":true}' where id = auth.uid() and kind <> 'admin'
$$;

create or replace function public.request_verification(proof text, proof_value text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare p profiles; auto boolean; v jsonb;
begin
  select * into p from profiles where id = auth.uid();
  if p is null then perform fail('signInFirst'); end if;
  if p.kind = 'admin' then perform fail('adminOnly'); end if;
  if p.verification_level = 'verified' then return p.data -> 'verification'; end if;
  auto := proof = 'event' and p.kind = 'talent' and jsonb_array_length(coalesce(p.data -> 'badges', '[]')) > 0;
  if proof = 'event' and not auto and not exists (
    select 1 from teams t join hackathons h on h.id = t.hackathon_id where t.lead_id = p.id and h.status = 'finished'
  ) then perform fail('noEvent'); end if;
  v := jsonb_build_object(
    'level', case when auto then 'verified' else 'pending' end,
    'proof', proof,
    'proofValue', case when coalesce(trim(proof_value), '') <> '' then trim(proof_value) when auto then p.data #>> '{badges,0,hackathonName}' else '' end,
    'requestedAt', now(), 'reviewedAt', case when auto then now()::text else '' end, 'note', '');
  update profiles set verification_level = v ->> 'level',
    data = data || jsonb_build_object('verification', v) || case when auto then '{"verified":true}'::jsonb else '{}'::jsonb end
  where id = p.id;
  if auto then
    perform notify(p.id, 'verified', 'n.verifiedTitle', null, 'n.verifiedBody', null, '#/app/profile');
  else
    perform notify_admins('verified', 'n.verifyRequestTitle', null, 'n.verifyRequestBody', jsonb_build_object('name', p.data ->> 'name'), '#/admin/verification');
  end if;
  return v;
end $$;

-- ---------------------------------------------------------------- swipes, matches, chat

create or replace function public.do_swipe(target uuid, dir int) returns boolean
language plpgsql security definer set search_path = public as $$
declare me profiles; other profiles; mid text; is_match boolean := false;
begin
  select * into me from profiles where id = auth.uid();
  if me is null then perform fail('signInFirst'); end if;
  if me.kind = 'admin' then perform fail('adminsNoSwipe'); end if;
  if me.kind = 'company' and me.status <> 'approved' then perform fail('companyPending'); end if;
  select * into other from profiles where id = target;
  if other is null or other.kind = me.kind or other.kind = 'admin' then perform fail('notFound'); end if;
  insert into swipes (from_id, to_id, dir) values (me.id, target, dir)
    on conflict (from_id, to_id) do update set dir = excluded.dir, at = now();
  if dir = 1 and liked(target, me.id) then
    is_match := true;
    mid := case when me.kind = 'talent' then me.id::text || '__' || target::text else target::text || '__' || me.id::text end;
    perform notify(target, 'match', 'n.matchTitle', jsonb_build_object('name', me.data ->> 'name'), 'n.matchBody', null, '#/app/inbox/' || mid);
    perform notify(me.id, 'match', 'n.matchTitle', jsonb_build_object('name', other.data ->> 'name'), 'n.matchBody', null, '#/app/inbox/' || mid);
  end if;
  return is_match;
end $$;

-- clear my swipes that did not end in a match
create or replace function public.reset_deck() returns void
language sql security definer set search_path = public as $$
  delete from swipes s where s.from_id = auth.uid() and not matched(auth.uid(), s.to_id)
$$;

create or replace function public.send_message(mid text, body text) returns text
language plpgsql security definer set search_path = public as $$
declare tid uuid; cid uuid; to_id uuid; msg_id text := new_id('m'); nm text;
begin
  if auth.uid() is null then perform fail('signInFirst'); end if;
  begin
    tid := split_part(mid, '__', 1)::uuid; cid := split_part(mid, '__', 2)::uuid;
  exception when others then perform fail('noConversation'); end;
  if auth.uid() not in (tid, cid) or not matched(tid, cid) then perform fail('noConversation'); end if;
  if trim(coalesce(body, '')) = '' then perform fail('emptyMessage'); end if;
  insert into messages (id, match_id, talent_id, company_id, from_id, body) values (msg_id, mid, tid, cid, auth.uid(), trim(body));
  to_id := case when auth.uid() = tid then cid else tid end;
  select data ->> 'name' into nm from profiles where id = auth.uid();
  perform notify(to_id, 'match', 'n.messageTitle', jsonb_build_object('name', nm), null, null, '#/app/inbox/' || mid, left(trim(body), 80));
  return msg_id;
end $$;

-- ---------------------------------------------------------------- opportunities and applications

create or replace function public.opp_create(input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; oid text := new_id('o');
begin
  select * into me from profiles where id = auth.uid();
  if me is null or me.kind <> 'company' then perform fail('companyOnly'); end if;
  if me.status <> 'approved' then perform fail('companyPending'); end if;
  if trim(coalesce(input ->> 'title', '')) = '' then perform fail('noTitle'); end if;
  insert into opportunities (id, company_id, data)
  values (oid, me.id, input || jsonb_build_object('id', oid, 'companyId', me.id, 'postedAt', now(), 'hidden', false, 'hiddenReason', '', 'demo', false));
  return oid;
end $$;

create or replace function public.opp_update(oid text, patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare o opportunities;
begin
  select * into o from opportunities where id = oid;
  if o is null then perform fail('postingNotFound'); end if;
  if o.company_id <> auth.uid() then perform fail('notYourPosting'); end if;
  update opportunities set data = data || (patch - 'id' - 'companyId' - 'postedAt' - 'hidden' - 'hiddenReason' - 'demo') where id = oid;
end $$;

create or replace function public.opp_remove(oid text) returns void
language plpgsql security definer set search_path = public as $$
declare o opportunities;
begin
  select * into o from opportunities where id = oid;
  if o is null then perform fail('postingNotFound'); end if;
  if o.company_id <> auth.uid() then perform fail('notYourPosting'); end if;
  delete from opportunities where id = oid;
end $$;

create or replace function public.opp_apply(oid text, input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; o opportunities; aid text := new_id('ap'); typ text;
begin
  select * into me from profiles where id = auth.uid();
  if me is null or me.kind <> 'talent' then perform fail('talentOnly'); end if;
  select * into o from opportunities where id = oid and not hidden;
  if o is null then perform fail('postingGone'); end if;
  if (o.data ->> 'closed')::boolean or (coalesce(o.data ->> 'deadline', '') <> '' and (o.data ->> 'deadline') < to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD')) then perform fail('postingClosed'); end if;
  if exists (select 1 from applications where opportunity_id = oid and talent_id = me.id) then perform fail('alreadyApplied'); end if;
  if coalesce((input ->> 'withCv')::boolean, false) and not exists (select 1 from profile_private where id = me.id and data -> 'cv' is not null and data -> 'cv' <> 'null'::jsonb) then perform fail('noCv'); end if;
  insert into applications (id, opportunity_id, talent_id, company_id, data)
  values (aid, oid, me.id, o.company_id, jsonb_build_object(
    'id', aid, 'opportunityId', oid, 'talentId', me.id, 'status', 'pending', 'note', '', 'createdAt', now(), 'updatedAt', now(),
    'cover', trim(coalesce(input ->> 'cover', '')), 'answers', coalesce(input -> 'answers', '[]'::jsonb), 'withCv', coalesce((input ->> 'withCv')::boolean, false)));
  update opportunities set app_count = app_count + 1 where id = oid;
  typ := o.data ->> 'type';
  perform notify(o.company_id, 'application',
    case when typ = 'Event' then 'n.newRegistration' else 'n.newApplicant' end, null,
    case when typ = 'Event' then 'n.registeredFor' else 'n.appliedTo' end,
    jsonb_build_object('name', me.data ->> 'name', 'title', o.data ->> 'title'), '#/app/dashboard');
  return aid;
end $$;

create or replace function public.opp_withdraw(aid text) returns void
language plpgsql security definer set search_path = public as $$
declare a applications;
begin
  select * into a from applications where id = aid and talent_id = auth.uid();
  if a is null then perform fail('notFound'); end if;
  if a.data ->> 'status' = 'accepted' then perform fail('cannotWithdraw'); end if;
  delete from applications where id = aid;
  update opportunities set app_count = greatest(app_count - 1, 0) where id = a.opportunity_id;
end $$;

create or replace function public.app_set_status(aid text, new_status text, note text) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; o opportunities; cname text;
begin
  select * into a from applications where id = aid;
  if a is null then perform fail('notFound'); end if;
  if a.company_id <> auth.uid() then perform fail('notYourApplicant'); end if;
  if new_status not in ('pending', 'shortlisted', 'accepted', 'rejected') then perform fail('notFound'); end if;
  select * into o from opportunities where id = a.opportunity_id;
  update applications set data = data || jsonb_build_object('status', new_status, 'note', coalesce(note, ''), 'updatedAt', now()) where id = aid;
  select data ->> 'name' into cname from profiles where id = auth.uid();
  perform notify(a.talent_id, 'application', 'n.status_' || new_status || '_title', null, 'n.status_' || new_status || '_body',
    jsonb_build_object('company', cname, 'title', o.data ->> 'title', 'note', coalesce(note, '')), '#/jobs/' || o.id);
end $$;

-- ---------------------------------------------------------------- hackathons and teams

create or replace function public.ev_create(input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare hid text := new_id('h');
begin
  perform require_admin();
  insert into hackathons (id, status, data)
  values (hid, coalesce(input ->> 'status', 'draft'),
    jsonb_build_object('podium', '[]'::jsonb, 'participants', 0, 'photo', '', 'demo', false)
    || input || jsonb_build_object('id', hid, 'results', '[]'::jsonb, 'createdAt', now(), 'updatedAt', now()));
  perform audit_log('event.create', input ->> 'title', 'status ' || coalesce(input ->> 'status', 'draft'));
  return hid;
end $$;

create or replace function public.ev_update(hid text, patch jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare h hackathons; new_status text := patch ->> 'status'; t record;
begin
  perform require_admin();
  select * into h from hackathons where id = hid;
  if h is null then perform fail('eventNotFound'); end if;
  update hackathons set
    data = data || (patch - 'id' - 'results' - 'createdAt') || jsonb_build_object('updatedAt', now()),
    status = coalesce(new_status, status)
  where id = hid;
  perform audit_log('event.update', coalesce(patch ->> 'title', h.data ->> 'title'), 'Changed: ' || (select string_agg(k, ', ') from jsonb_object_keys(patch) k));
  if new_status is not null and new_status <> h.status and new_status in ('registration_closed', 'in_progress', 'cancelled', 'finished') then
    for t in select lead_id from teams where hackathon_id = hid loop
      perform notify(t.lead_id, 'event', 'n.eventStatusTitle', jsonb_build_object('title', coalesce(patch ->> 'title', h.data ->> 'title'), 'status', new_status),
        case when new_status = 'cancelled' then 'n.eventCancelled' else 'n.eventCheck' end, null, '#/app/hackathons/' || hid);
    end loop;
  end if;
end $$;

create or replace function public.ev_remove(hid text) returns void
language plpgsql security definer set search_path = public as $$
declare title text;
begin
  perform require_admin(true);
  select data ->> 'title' into title from hackathons where id = hid;
  if title is null then perform fail('eventNotFound'); end if;
  delete from hackathons where id = hid;
  perform audit_log('event.delete', title);
end $$;

create or replace function public.team_register(hid text, input jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare me profiles; h hackathons; tid text := new_id('tm'); n int; size int; nowl text := to_char(now() at time zone 'Asia/Tashkent', 'YYYY-MM-DD"T"HH24:MI');
begin
  select * into me from profiles where id = auth.uid();
  if me is null or me.kind <> 'talent' then perform fail('talentOnly'); end if;
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

create or replace function public.team_cancel(hid text) returns void
language plpgsql security definer set search_path = public as $$
begin
  with d as (delete from teams where hackathon_id = hid and lead_id = auth.uid() returning 1)
  update hackathons set team_count = greatest(team_count - (select count(*) from d), 0) where id = hid;
end $$;

create or replace function public.ev_set_results(hid text, results jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare h hackathons; r jsonb; tm teams; kind text; val text; place int; title text; badge jsonb;
begin
  perform require_admin();
  select * into h from hackathons where id = hid;
  if h is null then perform fail('eventNotFound'); end if;
  for r in select * from jsonb_array_elements(coalesce(results, '[]'::jsonb)) loop
    if not exists (select 1 from teams where id = r ->> 'teamId' and hackathon_id = hid) then perform fail('resultBadTeam'); end if;
  end loop;
  update hackathons set data = data || jsonb_build_object('results', results, 'updatedAt', now()) where id = hid;
  -- remove this event's badges, then award the new ones
  update profiles set data = jsonb_set(data, '{badges}', coalesce((select jsonb_agg(b) from jsonb_array_elements(data -> 'badges') b where b ->> 'hackathonId' <> hid), '[]'::jsonb))
  where kind = 'talent' and data -> 'badges' @> jsonb_build_array(jsonb_build_object('hackathonId', hid));
  for r in select * from jsonb_array_elements(coalesce(results, '[]'::jsonb)) loop
    select * into tm from teams where id = r ->> 'teamId';
    kind := split_part(r ->> 'key', ':', 1); val := split_part(r ->> 'key', ':', 2);
    place := case when kind = 'place' then val::int end;
    title := case
      when kind = 'place' then coalesce((select p ->> 'title' from jsonb_array_elements(h.data -> 'places') p where (p ->> 'place')::int = place), place || ' place')
      when kind = 'nom' then val else 'Finalist' end;
    badge := jsonb_build_object('id', new_id('b'), 'hackathonId', hid, 'hackathonName', h.data ->> 'title', 'place', place, 'title', title, 'teamName', tm.data ->> 'teamName', 'awardedAt', now());
    update profiles set data = jsonb_set(data, '{badges}', coalesce(data -> 'badges', '[]'::jsonb) || jsonb_build_array(badge)) where id = tm.lead_id and kind = 'talent';
    perform notify(tm.lead_id, 'badge', 'n.badgeTitle', null, 'n.badgeBody', jsonb_build_object('title', title, 'event', h.data ->> 'title'), '#/app/profile');
  end loop;
  perform audit_log('event.results', h.data ->> 'title', jsonb_array_length(coalesce(results, '[]'::jsonb)) || ' results assigned');
end $$;

-- ---------------------------------------------------------------- notifications

create or replace function public.notif_read(nid text) returns void
language sql security definer set search_path = public as $$
  update notifications set read = true where id = nid and user_id = auth.uid()
$$;

create or replace function public.notif_read_all() returns void
language sql security definer set search_path = public as $$
  update notifications set read = true where user_id = auth.uid() and not read
$$;

-- ---------------------------------------------------------------- admin

create or replace function public.adm_company_status(cid uuid, new_status text, note text) returns void
language plpgsql security definer set search_path = public as $$
declare c profiles;
begin
  perform require_admin();
  select * into c from profiles where id = cid and kind = 'company';
  if c is null then perform fail('notFound'); end if;
  if new_status not in ('approved', 'rejected') then perform fail('notFound'); end if;
  if new_status = 'rejected' and trim(coalesce(note, '')) = '' then perform fail('needReason'); end if;
  update profiles set status = new_status, data = data || jsonb_build_object('status', new_status, 'statusNote', coalesce(note, '')) where id = cid;
  perform notify(cid, 'company_status', case when new_status = 'approved' then 'n.companyApprovedTitle' else 'n.companyRejectedTitle' end, null,
    case when new_status = 'approved' then 'n.companyApprovedBody' else 'n.note' end, jsonb_build_object('note', coalesce(note, '')), '#/app/dashboard');
  perform audit_log(case when new_status = 'approved' then 'company.approve' else 'company.reject' end, c.data ->> 'name', note);
end $$;

create or replace function public.adm_review_verification(uid uuid, approve boolean, note text) returns void
language plpgsql security definer set search_path = public as $$
declare u profiles;
begin
  perform require_admin();
  select * into u from profiles where id = uid and kind <> 'admin';
  if u is null then perform fail('notFound'); end if;
  if not approve and trim(coalesce(note, '')) = '' then perform fail('needReason'); end if;
  update profiles set verification_level = case when approve then 'verified' else 'unverified' end,
    data = data || jsonb_build_object('verified', approve, 'verification',
      (data -> 'verification') || jsonb_build_object('level', case when approve then 'verified' else 'unverified' end, 'reviewedAt', now(), 'note', coalesce(note, '')))
  where id = uid;
  perform notify(uid, 'verified', case when approve then 'n.verifiedTitle' else 'n.verifyDeclinedTitle' end, null,
    case when approve then 'n.verifiedBody' else 'n.note' end, jsonb_build_object('note', coalesce(note, '')), '#/app/profile');
  perform audit_log(case when approve then 'user.verify' else 'user.verify_decline' end, u.data ->> 'name',
    trim(coalesce(u.data #>> '{verification,proof}', '') || ' ' || coalesce(u.data #>> '{verification,proofValue}', '') || ' ' || coalesce(note, '')));
end $$;

create or replace function public.adm_set_verified(uid uuid, verified boolean) returns void
language plpgsql security definer set search_path = public as $$
declare u profiles; me_name text;
begin
  perform require_admin();
  select * into u from profiles where id = uid;
  if u is null then perform fail('notFound'); end if;
  if u.kind = 'admin' then perform fail('adminNotVerified'); end if;
  select data ->> 'name' into me_name from profiles where id = auth.uid();
  update profiles set verification_level = case when verified then 'verified' else 'unverified' end,
    data = data || jsonb_build_object('verified', verified, 'verification', case when verified then
      jsonb_build_object('level', 'verified', 'proof', 'admin', 'proofValue', me_name, 'requestedAt', coalesce(nullif(u.data #>> '{verification,requestedAt}', ''), now()::text), 'reviewedAt', now(), 'note', '')
      else '{"level":"unverified","proof":"","proofValue":"","requestedAt":"","reviewedAt":"","note":""}'::jsonb end)
  where id = uid;
  if verified then perform notify(uid, 'verified', 'n.verifiedTitle', null, 'n.verifiedBody', null, '#/app/profile'); end if;
  perform audit_log(case when verified then 'user.verify' else 'user.unverify' end, u.data ->> 'name', u.kind);
end $$;

create or replace function public.adm_award_badge(tid uuid, hid text, place int, title text, team_name text) returns void
language plpgsql security definer set search_path = public as $$
declare t profiles; h hackathons;
begin
  perform require_admin();
  select * into t from profiles where id = tid and kind = 'talent';
  if t is null then perform fail('pickTalent'); end if;
  select * into h from hackathons where id = hid;
  if h is null then perform fail('pickEvent'); end if;
  if trim(coalesce(title, '')) = '' then perform fail('badgeTitle'); end if;
  update profiles set data = jsonb_set(data, '{badges}', coalesce(data -> 'badges', '[]'::jsonb) || jsonb_build_array(jsonb_build_object(
    'id', new_id('b'), 'hackathonId', hid, 'hackathonName', h.data ->> 'title', 'place', place, 'title', trim(title), 'teamName', team_name, 'awardedAt', now())))
  where id = tid;
  perform notify(tid, 'badge', 'n.badgeTitle', null, 'n.badgeBody', jsonb_build_object('title', title, 'event', h.data ->> 'title'), '#/app/profile');
  perform audit_log('badge.award', t.data ->> 'name', title || ', ' || (h.data ->> 'title'));
end $$;

create or replace function public.adm_revoke_badge(tid uuid, bid text) returns void
language plpgsql security definer set search_path = public as $$
declare t profiles; b jsonb;
begin
  perform require_admin(true);
  select * into t from profiles where id = tid and kind = 'talent';
  select x into b from jsonb_array_elements(t.data -> 'badges') x where x ->> 'id' = bid;
  if b is null then perform fail('notFound'); end if;
  update profiles set data = jsonb_set(data, '{badges}', coalesce((select jsonb_agg(x) from jsonb_array_elements(data -> 'badges') x where x ->> 'id' <> bid), '[]'::jsonb)) where id = tid;
  perform audit_log('badge.revoke', t.data ->> 'name', (b ->> 'title') || ', ' || (b ->> 'hackathonName'));
end $$;

create or replace function public.adm_opp_hidden(oid text, hide boolean, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare o opportunities;
begin
  perform require_admin();
  select * into o from opportunities where id = oid;
  if o is null then perform fail('postingNotFound'); end if;
  if hide and trim(coalesce(reason, '')) = '' then perform fail('needReason'); end if;
  update opportunities set hidden = hide, data = data || jsonb_build_object('hidden', hide, 'hiddenReason', case when hide then reason else '' end) where id = oid;
  perform notify(o.company_id, 'system', case when hide then 'n.postingHiddenTitle' else 'n.postingVisibleTitle' end, null, null, null, '#/app/dashboard',
    case when hide then (o.data ->> 'title') || ': ' || reason else o.data ->> 'title' end);
  perform audit_log(case when hide then 'opportunity.hide' else 'opportunity.restore' end, o.data ->> 'title', reason);
end $$;

create or replace function public.adm_opp_delete(oid text) returns void
language plpgsql security definer set search_path = public as $$
declare title text;
begin
  perform require_admin(true);
  select data ->> 'title' into title from opportunities where id = oid;
  if title is null then perform fail('postingNotFound'); end if;
  delete from opportunities where id = oid;
  perform audit_log('opportunity.delete', title);
end $$;

create or replace function public.adm_delete_user(uid uuid) returns void
language plpgsql security definer set search_path = public, auth as $$
declare u profiles;
begin
  perform require_admin(true);
  if uid = auth.uid() then perform fail('deleteSelf'); end if;
  select * into u from profiles where id = uid;
  if u is null then perform fail('notFound'); end if;
  perform audit_log('user.delete', u.data ->> 'name', u.kind);
  delete from auth.users where id = uid;   -- cascades to the profile and everything that belongs to it
end $$;

-- make an existing account an admin (the person signs up first, then a super admin promotes them)
create or replace function public.adm_promote(target_email text, new_level text) returns void
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid; nm text;
begin
  perform require_admin(true);
  if new_level not in ('super', 'moderator') then perform fail('notAdmin'); end if;
  select id into uid from auth.users where lower(email) = lower(trim(target_email));
  if uid is null then perform fail('noSuchAccount'); end if;
  select data ->> 'name' into nm from profiles where id = uid;
  update profiles set kind = 'admin', level = new_level, status = null,
    data = jsonb_build_object('name', nm, 'level', new_level, 'createdAt', data -> 'createdAt')
  where id = uid;
  perform audit_log('admin.create', nm, new_level);
end $$;

create or replace function public.adm_set_level(uid uuid, new_level text) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  perform require_admin(true);
  if uid = auth.uid() then perform fail('ownRole'); end if;
  select data ->> 'name' into nm from profiles where id = uid and kind = 'admin';
  if nm is null then perform fail('notAdmin'); end if;
  if new_level not in ('super', 'moderator') then perform fail('notAdmin'); end if;
  update profiles set level = new_level, data = data || jsonb_build_object('level', new_level) where id = uid;
  perform audit_log('admin.role', nm, new_level);
end $$;

-- ---------------------------------------------------------------- row level security (reading)

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.opportunities enable row level security;
alter table public.applications enable row level security;
alter table public.swipes enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.hackathons enable row level security;
alter table public.teams enable row level security;
alter table public.audit enable row level security;

create policy read_profiles on public.profiles for select using (
  id = auth.uid() or is_admin()
  or (kind = 'company' and status = 'approved')
  or (kind = 'talent' and onboarded and my_kind() = 'company')
  or (kind = 'talent' and exists (select 1 from applications a where a.talent_id = profiles.id and a.company_id = auth.uid()))
);
create policy read_private on public.profile_private for select using (can_see_private(id));
create policy read_opportunities on public.opportunities for select using (
  company_id = auth.uid() or is_admin()
  or (not hidden and exists (select 1 from profiles p where p.id = company_id and p.status = 'approved'))
);
create policy read_applications on public.applications for select using (talent_id = auth.uid() or company_id = auth.uid() or is_admin());
create policy read_swipes on public.swipes for select using (from_id = auth.uid() or (to_id = auth.uid() and dir = 1 and liked(auth.uid(), from_id)));
create policy read_messages on public.messages for select using (auth.uid() in (talent_id, company_id) and matched(talent_id, company_id));
create policy read_notifications on public.notifications for select using (user_id = auth.uid());
create policy read_hackathons on public.hackathons for select using (status <> 'draft' or is_admin());
create policy read_teams on public.teams for select using (lead_id = auth.uid() or is_admin());
create policy read_audit on public.audit for select using (is_admin());

-- no insert / update / delete policies: every change goes through the functions above.
-- Functions are callable by signed-in users only, except the read helpers used by the policies.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated;
grant execute on function public.my_kind(), public.is_admin(), public.liked(uuid, uuid), public.matched(uuid, uuid), public.can_see_private(uuid) to anon;
revoke execute on function public.notify(uuid, text, text, jsonb, text, jsonb, text, text), public.notify_admins(text, text, jsonb, text, jsonb, text),
  public.audit_log(text, text, text), public.handle_new_user(), public.handle_user_confirmed(), public.fail(text) from authenticated;

-- live updates for the site
alter publication supabase_realtime add table public.profiles, public.profile_private, public.opportunities, public.applications,
  public.swipes, public.messages, public.notifications, public.hackathons, public.teams, public.audit;
