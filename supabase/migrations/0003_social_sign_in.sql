-- Sign-in is only through Telegram and Google. Those providers create the account before the
-- person has said whether they are a student or a company, so every new account starts as a
-- talent profile built from what the provider gives (name, photo; Telegram gives no email).
-- Right after the first sign-in the site calls choose_kind with what the person picked on the
-- sign-up screen. It works only for a fresh account that has not finished onboarding.

-- the profile builder, shared by the sign-up trigger and choose_kind
create or replace function public.create_profile(uid uuid, email text, confirmed boolean, meta jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare
  k text := case when meta ->> 'type' = 'company' then 'company' else 'talent' end;
  nm text := coalesce(nullif(trim(meta ->> 'name'), ''), nullif(trim(meta ->> 'full_name'), ''), nullif(trim(meta ->> 'preferred_username'), ''), nullif(split_part(coalesce(email, ''), '@', 1), ''), 'Lumora');
  city text := coalesce(trim(meta ->> 'city'), '');
  unverified jsonb := '{"level":"unverified","proof":"","proofValue":"","requestedAt":"","reviewedAt":"","note":""}';
  base jsonb;
begin
  base := jsonb_build_object(
    'name', nm, 'city', city, 'createdAt', now(), 'verification', unverified,
    'emailConfirmed', confirmed,
    'consentAt', case when coalesce((meta ->> 'consent')::boolean, false) then now()::text else '' end, 'demo', false);
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
      'statusNote', '', 'verified', false, 'partner', false, 'hue', '#2552c4',
      'logo', coalesce(meta ->> 'avatar_url', meta ->> 'picture', ''),
      'foundedYear', '', 'benefits', '[]'::jsonb, 'linkedin', '', 'telegram', '');
  end if;

  insert into profiles (id, kind, status, data) values (uid, k, case when k = 'company' then 'pending' end, base);
  insert into profile_private (id, data) values (uid, jsonb_build_object(
    'email', coalesce(email, ''),
    'contact', case when k = 'company' then coalesce(email, '') else '' end,
    'cv', null));

  perform notify(uid, 'system', 'n.welcomeTitle', null, case when k = 'talent' then 'n.welcomeTalent' else 'n.welcomeCompany' end, null, '#/onboarding');
  if k = 'company' then
    perform notify_admins('company_status', 'n.newCompanyTitle', null, 'n.newCompanyBody', jsonb_build_object('name', nm), '#/admin/companies');
  end if;
end $$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform create_profile(new.id, new.email, new.email_confirmed_at is not null, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end $$;

-- student or company, picked on the sign-up screen before going to Telegram or Google
create or replace function public.choose_kind(new_kind text, org_kind text default 'company', consent boolean default false) returns void
language plpgsql security definer set search_path = public, auth as $$
declare p profiles; u auth.users; meta jsonb;
begin
  select * into p from profiles where id = auth.uid();
  if p is null then perform fail('signInFirst'); end if;
  if p.kind = 'admin' or p.onboarded then return; end if;
  if new_kind not in ('talent', 'company') then perform fail('notFound'); end if;
  -- only a fresh account: nothing done with it yet
  if exists (select 1 from swipes where from_id = p.id) or exists (select 1 from applications where talent_id = p.id)
     or exists (select 1 from opportunities where company_id = p.id) or exists (select 1 from teams where lead_id = p.id) then
    return;
  end if;
  select * into u from auth.users where id = p.id;
  meta := coalesce(u.raw_user_meta_data, '{}'::jsonb)
    || jsonb_build_object('type', new_kind, 'orgKind', org_kind, 'consent', consent, 'name', p.data ->> 'name', 'city', coalesce(p.data ->> 'city', ''));
  if p.kind = new_kind then
    -- same kind: only record the consent
    if consent and coalesce(p.data ->> 'consentAt', '') = '' then
      update profiles set data = data || jsonb_build_object('consentAt', now()) where id = p.id;
    end if;
    return;
  end if;
  delete from notifications where user_id = p.id;
  delete from profile_private where id = p.id;
  delete from profiles where id = p.id;
  perform create_profile(p.id, u.email, u.email_confirmed_at is not null, meta);
end $$;

-- admins: promote a person from the user list (Telegram accounts have no email)
create or replace function public.adm_promote_id(target uuid, new_level text) returns void
language plpgsql security definer set search_path = public as $$
declare nm text;
begin
  perform require_admin(true);
  if new_level not in ('super', 'moderator') then perform fail('notAdmin'); end if;
  select data ->> 'name' into nm from profiles where id = target;
  if nm is null then perform fail('noSuchAccount'); end if;
  update profiles set kind = 'admin', level = new_level, status = null, onboarded = true,
    data = jsonb_build_object('name', nm, 'level', new_level, 'createdAt', data -> 'createdAt')
  where id = target;
  perform audit_log('admin.create', nm, new_level);
end $$;

revoke execute on function public.create_profile(uuid, text, boolean, jsonb) from public, anon, authenticated;
revoke execute on function public.choose_kind(text, text, boolean), public.adm_promote_id(uuid, text) from public, anon;
grant execute on function public.choose_kind(text, text, boolean), public.adm_promote_id(uuid, text) to authenticated;
