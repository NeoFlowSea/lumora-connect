-- Any member can leave a team after registration (also after confirming), for example to join
-- another team or register their own. The lead is told. If the team was confirmed and now has
-- fewer than teamMin confirmed people, it is no longer confirmed.
-- Also: deleting an account recounts the events' team numbers (the account's teams go with it).

create or replace function public.team_member_decline(mid text) returns void
language plpgsql security definer set search_path = public as $$
declare m team_members; t teams; h hackathons; n int; shown jsonb;
begin
  select * into m from team_members where id = mid;
  if m is null or m.is_lead or m.declined_at is not null
     or not (m.user_id = auth.uid() or m.username = any (my_tg_usernames())) then
    perform fail('notFound');
  end if;
  update team_members set declined_at = now(), user_id = null where id = mid;

  select * into t from teams where id = m.team_id;
  select * into h from hackathons where id = t.hackathon_id;
  select coalesce(jsonb_agg(case when x.username is null then x.name when x.name = '' then '@' || x.username else x.name || ' (@' || x.username || ')' end order by x.is_lead desc, x.created_at), '[]'::jsonb)
    into shown from team_members x where x.team_id = t.id and x.declined_at is null;
  select count(*) into n from team_members where team_id = t.id and declined_at is null and confirmed_at is not null;
  update teams set data = data || jsonb_build_object('members', shown),
    confirmed_at = case when n < greatest(coalesce((h.data ->> 'teamMin')::int, 1), 1) then null else confirmed_at end
  where id = t.id;

  perform notify(t.lead_id, 'event', 'n.memberDeclinedTitle', jsonb_build_object('team', t.data ->> 'teamName'),
    'n.memberDeclinedBody', jsonb_build_object('who', coalesce('@' || m.username, m.name)), '#/app/hackathons/' || t.hackathon_id);
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
  update hackathons h set team_count = (select count(*) from teams t where t.hackathon_id = h.id)
  where team_count <> (select count(*) from teams t where t.hackathon_id = h.id);
end $$;
