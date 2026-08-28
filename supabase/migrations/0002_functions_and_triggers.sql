-- Helper functions + triggers

-- updated_at maintenance ------------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger organizations_set_updated_at before update on organizations
  for each row execute function set_updated_at();
create trigger accounts_set_updated_at before update on accounts
  for each row execute function set_updated_at();
create trigger memberships_set_updated_at before update on memberships
  for each row execute function set_updated_at();
create trigger athlete_profiles_set_updated_at before update on athlete_profiles
  for each row execute function set_updated_at();
create trigger profile_subscriptions_set_updated_at before update on profile_subscriptions
  for each row execute function set_updated_at();

-- auto-create an accounts row when a new auth user signs up -------------
-- role/full_name/organization_id are read from auth signup metadata so a
-- parent signup and an org-admin signup can both flow through one trigger.
create or replace function handle_new_user() returns trigger as $$
declare
  requested_role account_role;
begin
  begin
    requested_role := coalesce(new.raw_user_meta_data ->> 'role', 'parent')::account_role;
  exception when others then
    requested_role := 'parent';
  end;

  insert into public.accounts (id, email, full_name, phone, role, organization_id)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'phone',
    requested_role,
    nullif(new.raw_user_meta_data ->> 'organization_id', '')::uuid
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- publish/unpublish timestamp -------------------------------------------
create or replace function athlete_profiles_track_published() returns trigger as $$
begin
  if new.published = true and (old.published is distinct from true) then
    new.published_at = now();
  elsif new.published = false then
    new.published_at = null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger athlete_profiles_track_published_trg before update on athlete_profiles
  for each row execute function athlete_profiles_track_published();

-- auto-create a qr_codes row whenever an athlete profile is created -------
create or replace function athlete_profiles_create_qr_code() returns trigger as $$
begin
  insert into public.qr_codes (athlete_profile_id, target_url)
  values (new.id, '/athletes/' || new.slug);
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger athlete_profiles_create_qr_code_trg after insert on athlete_profiles
  for each row execute function athlete_profiles_create_qr_code();

-- security-definer helpers used by RLS policies (avoid recursive RLS) ----
create or replace function is_platform_owner() returns boolean as $$
  select exists (
    select 1 from public.accounts where id = auth.uid() and role = 'platform_owner'
  );
$$ language sql security definer stable set search_path = public;

create or replace function current_admin_org_id() returns uuid as $$
  select organization_id from public.accounts
  where id = auth.uid() and role = 'org_admin';
$$ language sql security definer stable set search_path = public;

create or replace function has_active_membership(org_id uuid) returns boolean as $$
  select exists (
    select 1 from public.memberships
    where account_id = auth.uid()
      and organization_id = org_id
      and status = 'active'
  );
$$ language sql security definer stable set search_path = public;
