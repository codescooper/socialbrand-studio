create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 100)
);

create table public.business_workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_workspaces_name_length check (char_length(btrim(name)) between 1 and 100)
);

create table public.business_memberships (
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id),
  constraint business_memberships_role check (role in ('owner', 'admin', 'editor', 'viewer'))
);

create table public.brand_kit_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  local_brand_kit_id text not null,
  brand_name text not null,
  linked_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, local_brand_kit_id),
  constraint brand_kit_links_local_id_length check (char_length(local_brand_kit_id) between 1 and 200),
  constraint brand_kit_links_name_length check (char_length(btrim(brand_name)) between 1 and 100)
);

create table public.social_connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  brand_kit_link_id uuid references public.brand_kit_links(id) on delete set null,
  provider text not null,
  platform text not null,
  external_account_id text not null,
  parent_connection_id uuid references public.social_connections(id) on delete set null,
  display_name text not null,
  username text,
  profile_url text,
  avatar_url text,
  account_type text,
  connection_status text not null default 'connected',
  granted_scopes text[] not null default '{}',
  provider_metadata jsonb not null default '{}',
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  sync_status text,
  connected_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, external_account_id),
  constraint social_connections_provider check (provider in ('meta', 'tiktok', 'linkedin')),
  constraint social_connections_platform check (platform in ('facebook', 'instagram', 'tiktok', 'linkedin')),
  constraint social_connections_status check (connection_status in ('connected', 'expired', 'permission_required', 'reconnect_required', 'revoked', 'error', 'disconnected'))
);

create table public.social_credentials (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null unique references public.social_connections(id) on delete cascade,
  encrypted_payload text not null,
  initialization_vector text not null,
  key_version integer not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint social_credentials_key_version_positive check (key_version > 0)
);

create table public.oauth_states (
  id uuid primary key default gen_random_uuid(),
  state_hash text not null unique,
  provider text not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references public.business_workspaces(id) on delete cascade,
  return_url text not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint oauth_states_provider check (provider in ('meta', 'tiktok', 'linkedin'))
);

create table public.social_sync_jobs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references public.social_connections(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  status text not null default 'queued',
  request_id uuid not null default gen_random_uuid(),
  result_summary jsonb not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint social_sync_jobs_status check (status in ('queued', 'running', 'partial', 'completed', 'failed', 'cancelled', 'permission_required', 'reconnect_required'))
);

create table public.security_audit_events (
  id bigint generated always as identity primary key,
  workspace_id uuid references public.business_workspaces(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  request_id uuid not null default gen_random_uuid(),
  safe_metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index business_workspaces_created_by_idx on public.business_workspaces(created_by);
create index business_memberships_user_id_idx on public.business_memberships(user_id);
create index brand_kit_links_workspace_id_idx on public.brand_kit_links(workspace_id);
create index brand_kit_links_linked_by_idx on public.brand_kit_links(linked_by);
create index social_connections_workspace_updated_idx on public.social_connections(workspace_id, updated_at desc);
create index social_connections_brand_kit_link_id_idx on public.social_connections(brand_kit_link_id);
create index social_connections_parent_connection_id_idx on public.social_connections(parent_connection_id);
create index social_connections_connected_by_idx on public.social_connections(connected_by);
create index oauth_states_user_id_idx on public.oauth_states(user_id);
create index oauth_states_workspace_id_idx on public.oauth_states(workspace_id);
create index oauth_states_expiry_idx on public.oauth_states(expires_at) where consumed_at is null;
create index social_sync_jobs_connection_created_idx on public.social_sync_jobs(connection_id, created_at desc);
create index social_sync_jobs_requested_by_idx on public.social_sync_jobs(requested_by);
create index security_audit_events_workspace_created_idx on public.security_audit_events(workspace_id, created_at desc);
create index security_audit_events_actor_user_id_idx on public.security_audit_events(actor_user_id);

create or replace function private.is_workspace_member(target_workspace_id uuid, allowed_roles text[] default array['owner', 'admin', 'editor', 'viewer'])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.business_memberships
    where workspace_id = target_workspace_id
      and user_id = (select auth.uid())
      and role = any(allowed_roles)
  );
$$;
revoke execute on function private.is_workspace_member(uuid, text[]) from public, anon;
grant execute on function private.is_workspace_member(uuid, text[]) to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke execute on function private.set_updated_at() from public, anon, authenticated;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger profiles_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger business_workspaces_updated_at before update on public.business_workspaces for each row execute function private.set_updated_at();
create trigger brand_kit_links_updated_at before update on public.brand_kit_links for each row execute function private.set_updated_at();
create trigger social_connections_updated_at before update on public.social_connections for each row execute function private.set_updated_at();
create trigger social_credentials_updated_at before update on public.social_credentials for each row execute function private.set_updated_at();
create trigger on_auth_user_created after insert on auth.users for each row execute function private.handle_new_user();

create or replace function public.create_business_workspace(workspace_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  workspace_id uuid;
  clean_name text := btrim(workspace_name);
begin
  if caller_id is null then raise exception 'authentication_required'; end if;
  if clean_name is null or char_length(clean_name) not between 1 and 100 then raise exception 'invalid_workspace_name'; end if;
  insert into public.business_workspaces(name, created_by) values (clean_name, caller_id) returning id into workspace_id;
  insert into public.business_memberships(workspace_id, user_id, role) values (workspace_id, caller_id, 'owner');
  return workspace_id;
end;
$$;
revoke execute on function public.create_business_workspace(text) from public, anon;
grant execute on function public.create_business_workspace(text) to authenticated;

create or replace function public.link_brand_kit(target_workspace_id uuid, target_local_brand_kit_id text, target_brand_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := (select auth.uid());
  link_id uuid;
begin
  if caller_id is null then raise exception 'authentication_required'; end if;
  if not private.is_workspace_member(target_workspace_id, array['owner', 'admin', 'editor']) then raise exception 'workspace_permission_denied'; end if;
  insert into public.brand_kit_links(workspace_id, local_brand_kit_id, brand_name, linked_by)
  values (target_workspace_id, target_local_brand_kit_id, btrim(target_brand_name), caller_id)
  on conflict (workspace_id, local_brand_kit_id)
  do update set brand_name = excluded.brand_name, linked_by = caller_id, updated_at = now()
  returning id into link_id;
  return link_id;
end;
$$;
revoke execute on function public.link_brand_kit(uuid, text, text) from public, anon;
grant execute on function public.link_brand_kit(uuid, text, text) to authenticated;

alter table public.profiles enable row level security;
alter table public.business_workspaces enable row level security;
alter table public.business_memberships enable row level security;
alter table public.brand_kit_links enable row level security;
alter table public.social_connections enable row level security;
alter table public.social_credentials enable row level security;
alter table public.oauth_states enable row level security;
alter table public.social_sync_jobs enable row level security;
alter table public.security_audit_events enable row level security;

create policy profiles_select_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy workspaces_select_member on public.business_workspaces for select to authenticated using ((select private.is_workspace_member(id)));
create policy workspaces_update_admin on public.business_workspaces for update to authenticated
  using ((select private.is_workspace_member(id, array['owner', 'admin'])))
  with check ((select private.is_workspace_member(id, array['owner', 'admin'])));
create policy memberships_select_member on public.business_memberships for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy brand_kit_links_select_member on public.brand_kit_links for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy brand_kit_links_insert_editor on public.brand_kit_links for insert to authenticated
  with check ((select private.is_workspace_member(workspace_id, array['owner', 'admin', 'editor'])) and linked_by = (select auth.uid()));
create policy brand_kit_links_update_editor on public.brand_kit_links for update to authenticated
  using ((select private.is_workspace_member(workspace_id, array['owner', 'admin', 'editor'])))
  with check ((select private.is_workspace_member(workspace_id, array['owner', 'admin', 'editor'])) and linked_by = (select auth.uid()));
create policy brand_kit_links_delete_admin on public.brand_kit_links for delete to authenticated using ((select private.is_workspace_member(workspace_id, array['owner', 'admin'])));
create policy social_connections_select_member on public.social_connections for select to authenticated using ((select private.is_workspace_member(workspace_id)));
create policy social_connections_update_admin on public.social_connections for update to authenticated
  using ((select private.is_workspace_member(workspace_id, array['owner', 'admin'])))
  with check ((select private.is_workspace_member(workspace_id, array['owner', 'admin'])));
create policy social_sync_jobs_select_member on public.social_sync_jobs for select to authenticated
  using (exists (
    select 1 from public.social_connections
    where social_connections.id = social_sync_jobs.connection_id
      and (select private.is_workspace_member(social_connections.workspace_id))
  ));
create policy social_credentials_deny_client on public.social_credentials for all to anon, authenticated using (false) with check (false);
create policy oauth_states_deny_client on public.oauth_states for all to anon, authenticated using (false) with check (false);
create policy security_audit_events_deny_client on public.security_audit_events for all to anon, authenticated using (false) with check (false);

revoke all on all tables in schema public from anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select, update on public.business_workspaces to authenticated;
grant select on public.business_memberships to authenticated;
grant select, insert, update, delete on public.brand_kit_links to authenticated;
grant select, update on public.social_connections to authenticated;
grant select on public.social_sync_jobs to authenticated;
revoke all on public.social_credentials, public.oauth_states, public.security_audit_events from anon, authenticated;
