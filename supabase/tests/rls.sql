begin;

insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'owner-a@example.test', '{}', '{}', now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'owner-b@example.test', '{}', '{}', now(), now());

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
select public.create_business_workspace('Business A');
reset role;

insert into public.business_workspaces (id, name, created_by)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'Business B', '22222222-2222-4222-8222-222222222222');
insert into public.business_memberships (workspace_id, user_id, role)
values ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', '22222222-2222-4222-8222-222222222222', 'owner');

do $$
begin
  if (select count(*) from public.business_workspaces where created_by = '11111111-1111-4111-8111-111111111111') <> 1 then
    raise exception 'workspace_creation_failed';
  end if;
  if not exists (
    select 1 from public.business_memberships
    where user_id = '11111111-1111-4111-8111-111111111111' and role = 'owner'
  ) then
    raise exception 'owner_membership_missing';
  end if;
  if has_table_privilege('authenticated', 'public.social_credentials', 'select') then
    raise exception 'credentials_visible_to_authenticated';
  end if;
  if has_table_privilege('anon', 'public.oauth_states', 'select') then
    raise exception 'oauth_states_visible_to_anon';
  end if;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);
do $$
begin
  if (select count(*) from public.business_workspaces) <> 1 then
    raise exception 'workspace_isolation_failed';
  end if;
end;
$$;
reset role;

rollback;
