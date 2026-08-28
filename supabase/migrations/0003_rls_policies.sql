-- Row Level Security
-- Guiding rule: the guardian (parent) is the only party that can create,
-- edit, or publish anything tied to a minor's athlete profile. Athletes
-- never authenticate. Public visitors may only ever see PUBLISHED profiles.

alter table organizations enable row level security;
alter table accounts enable row level security;
alter table dues_tiers enable row level security;
alter table memberships enable row level security;
alter table athlete_profiles enable row level security;
alter table profile_subscriptions enable row level security;
alter table qr_codes enable row level security;
alter table perks enable row level security;
alter table perk_organizations enable row level security;
alter table dues_payments enable row level security;
alter table profile_subscription_payments enable row level security;
alter table platform_fee_payments enable row level security;

-- ORGANIZATIONS -----------------------------------------------------------
-- No public/anon row access to the base table (it holds Stripe Connect
-- account ids); public pages read through the organizations_public view.
create policy organizations_select_visible on organizations for select
  using (
    is_platform_owner()
    or id = current_admin_org_id()
    or id in (select organization_id from memberships where account_id = auth.uid())
  );
create policy organizations_insert_admin on organizations for insert
  with check (auth.uid() is not null);
create policy organizations_update_admin on organizations for update
  using (is_platform_owner() or id = current_admin_org_id());
create policy organizations_delete_platform on organizations for delete
  using (is_platform_owner());

-- ACCOUNTS ------------------------------------------------------------------
create policy accounts_select_self on accounts for select
  using (
    id = auth.uid()
    or is_platform_owner()
    or (
      organization_id = current_admin_org_id()
      or id in (select account_id from memberships where organization_id = current_admin_org_id())
    )
  );
create policy accounts_update_self on accounts for update
  using (id = auth.uid() or is_platform_owner());

-- DUES TIERS ------------------------------------------------------------
-- Publicly readable (needed to show pricing before a parent logs in).
create policy dues_tiers_select_public on dues_tiers for select
  using (active = true or is_platform_owner() or organization_id = current_admin_org_id());
create policy dues_tiers_write_admin on dues_tiers for insert
  with check (is_platform_owner() or organization_id = current_admin_org_id());
create policy dues_tiers_update_admin on dues_tiers for update
  using (is_platform_owner() or organization_id = current_admin_org_id());
create policy dues_tiers_delete_admin on dues_tiers for delete
  using (is_platform_owner() or organization_id = current_admin_org_id());

-- MEMBERSHIPS -------------------------------------------------------------
create policy memberships_select on memberships for select
  using (
    account_id = auth.uid()
    or is_platform_owner()
    or organization_id = current_admin_org_id()
  );
create policy memberships_insert_self on memberships for insert
  with check (account_id = auth.uid());
create policy memberships_update on memberships for update
  using (
    account_id = auth.uid()
    or is_platform_owner()
    or organization_id = current_admin_org_id()
  );

-- ATHLETE PROFILES ----------------------------------------------------------
-- Public may only ever see published rows. The guardian sees/edits all of
-- their own rows regardless of publish state. Org admins get NO extra
-- visibility beyond what's already public -- profiles are guardian-only.
create policy athlete_profiles_select_public on athlete_profiles for select
  using (published = true or guardian_account_id = auth.uid() or is_platform_owner());
create policy athlete_profiles_insert_guardian on athlete_profiles for insert
  with check (guardian_account_id = auth.uid());
create policy athlete_profiles_update_guardian on athlete_profiles for update
  using (guardian_account_id = auth.uid() or is_platform_owner());
create policy athlete_profiles_delete_guardian on athlete_profiles for delete
  using (guardian_account_id = auth.uid() or is_platform_owner());

-- PROFILE SUBSCRIPTIONS ------------------------------------------------
create policy profile_subscriptions_select_guardian on profile_subscriptions for select
  using (guardian_account_id = auth.uid() or is_platform_owner());
create policy profile_subscriptions_insert_guardian on profile_subscriptions for insert
  with check (guardian_account_id = auth.uid());
create policy profile_subscriptions_update_guardian on profile_subscriptions for update
  using (guardian_account_id = auth.uid() or is_platform_owner());

-- QR CODES ----------------------------------------------------------------
create policy qr_codes_select on qr_codes for select
  using (
    is_platform_owner()
    or exists (
      select 1 from athlete_profiles ap
      where ap.id = qr_codes.athlete_profile_id
        and (ap.published = true or ap.guardian_account_id = auth.uid())
    )
  );

-- PERKS ---------------------------------------------------------------------
-- Members-only: readable only by an account with an active membership in an
-- org the perk is visible to. Org admins manage perks for their own org.
create policy perks_select_members on perks for select
  using (
    is_platform_owner()
    or created_by = auth.uid()
    or exists (
      select 1 from perk_organizations po
      where po.perk_id = perks.id
        and (has_active_membership(po.organization_id) or po.organization_id = current_admin_org_id())
    )
  );
create policy perks_write_admin on perks for insert
  with check (is_platform_owner() or current_admin_org_id() is not null);
create policy perks_update_admin on perks for update
  using (is_platform_owner() or created_by = auth.uid());
create policy perks_delete_admin on perks for delete
  using (is_platform_owner() or created_by = auth.uid());

create policy perk_organizations_select on perk_organizations for select
  using (
    is_platform_owner()
    or organization_id = current_admin_org_id()
    or has_active_membership(organization_id)
  );
create policy perk_organizations_write_admin on perk_organizations for insert
  with check (is_platform_owner() or organization_id = current_admin_org_id());
create policy perk_organizations_delete_admin on perk_organizations for delete
  using (is_platform_owner() or organization_id = current_admin_org_id());

-- PAYMENTS --------------------------------------------------------------
-- Read-only for the parties involved; all writes happen via the service
-- role from Stripe webhook handlers, never from the client.
create policy dues_payments_select on dues_payments for select
  using (account_id = auth.uid() or is_platform_owner() or organization_id = current_admin_org_id());

create policy profile_subscription_payments_select on profile_subscription_payments for select
  using (
    is_platform_owner()
    or exists (
      select 1 from profile_subscriptions ps
      where ps.id = profile_subscription_payments.profile_subscription_id
        and ps.guardian_account_id = auth.uid()
    )
  );

create policy platform_fee_payments_select on platform_fee_payments for select
  using (is_platform_owner() or organization_id = current_admin_org_id());
