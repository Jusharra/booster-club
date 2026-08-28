-- Booster Club & Athlete Recruiting Profile Platform
-- v1 initial schema

create extension if not exists pgcrypto;

create type account_role as enum ('parent', 'org_admin', 'platform_owner');
create type membership_status as enum ('pending', 'active', 'past_due', 'canceled');
create type subscription_status as enum ('incomplete', 'trialing', 'active', 'past_due', 'canceled');
create type billing_interval as enum ('one_time', 'monthly', 'annual');
create type payment_status as enum ('pending', 'succeeded', 'failed', 'refunded');

-- ORGANIZATIONS -------------------------------------------------------------
create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  school_name text not null,
  slug text not null unique,
  sports text[] not null default '{}',
  city text,
  state text,
  admin_contact_name text,
  admin_contact_email text,
  admin_contact_phone text,
  logo_url text,
  platform_fee_status text not null default 'pending' check (platform_fee_status in ('pending','active','past_due','canceled')),
  platform_fee_amount_cents integer,
  stripe_connect_account_id text,
  stripe_connect_onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organizations_slug_idx on organizations (slug);

-- ACCOUNTS (parents, org admins, platform owner) -----------------------------
-- 1:1 with auth.users
create table accounts (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role account_role not null default 'parent',
  organization_id uuid references organizations (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index accounts_organization_id_idx on accounts (organization_id);
create index accounts_role_idx on accounts (role);

-- DUES TIERS ------------------------------------------------------------
create table dues_tiers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  name text not null,
  price_cents integer not null,
  billing_interval billing_interval not null default 'annual',
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);
create index dues_tiers_organization_id_idx on dues_tiers (organization_id);

-- MEMBERSHIPS -------------------------------------------------------------
create table memberships (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  dues_tier_id uuid references dues_tiers (id) on delete set null,
  status membership_status not null default 'pending',
  renewal_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (account_id, organization_id)
);
create index memberships_organization_id_idx on memberships (organization_id);
create index memberships_account_id_idx on memberships (account_id);

-- ATHLETE PROFILES ----------------------------------------------------------
create table athlete_profiles (
  id uuid primary key default gen_random_uuid(),
  guardian_account_id uuid not null references accounts (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  slug text not null unique,
  first_name text not null,
  last_name text not null,
  sport text not null,
  sports text[] not null default '{}',
  grad_year integer not null,
  school_name text not null,
  city text,
  state text,
  position text,
  height text,
  weight text,
  gpa numeric(3,2),
  bio text,
  stats jsonb not null default '{}'::jsonb,
  highlight_video_urls text[] not null default '{}',
  photo_url text,
  photo_alt text,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index athlete_profiles_guardian_idx on athlete_profiles (guardian_account_id);
create index athlete_profiles_org_published_idx on athlete_profiles (organization_id, published);
create index athlete_profiles_slug_idx on athlete_profiles (slug);

-- PROFILE SUBSCRIPTIONS (recruiting profile paid add-on, platform revenue) --
create table profile_subscriptions (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null unique references athlete_profiles (id) on delete cascade,
  guardian_account_id uuid not null references accounts (id) on delete cascade,
  tier text not null default 'standard',
  billing_interval billing_interval not null default 'monthly',
  price_cents integer,
  status subscription_status not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profile_subscriptions_guardian_idx on profile_subscriptions (guardian_account_id);
create index profile_subscriptions_stripe_sub_idx on profile_subscriptions (stripe_subscription_id);

-- QR CODES --------------------------------------------------------------
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  athlete_profile_id uuid not null unique references athlete_profiles (id) on delete cascade,
  target_url text not null,
  created_at timestamptz not null default now()
);

-- PERKS / SPONSORS -----------------------------------------------------
create table perks (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  offer_text text not null,
  website_url text,
  logo_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_by uuid references accounts (id) on delete set null,
  created_at timestamptz not null default now()
);

create table perk_organizations (
  perk_id uuid not null references perks (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  primary key (perk_id, organization_id)
);
create index perk_organizations_org_idx on perk_organizations (organization_id);

-- PAYMENTS ---------------------------------------------------------------
-- Booster dues -> the club's own Stripe Connect account
create table dues_payments (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null references memberships (id) on delete cascade,
  organization_id uuid not null references organizations (id) on delete cascade,
  account_id uuid not null references accounts (id) on delete cascade,
  amount_cents integer not null,
  status payment_status not null default 'pending',
  stripe_connect_account_id text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index dues_payments_org_idx on dues_payments (organization_id);
create index dues_payments_account_idx on dues_payments (account_id);

-- Recruiting profile subscription payments -> platform's own Stripe account
create table profile_subscription_payments (
  id uuid primary key default gen_random_uuid(),
  profile_subscription_id uuid not null references profile_subscriptions (id) on delete cascade,
  amount_cents integer not null,
  status payment_status not null default 'pending',
  stripe_invoice_id text,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index profile_subscription_payments_sub_idx on profile_subscription_payments (profile_subscription_id);

-- Flat platform fee billed to each Organization -- kept structurally
-- separate from both dues and profile-subscription revenue.
create table platform_fee_payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations (id) on delete cascade,
  amount_cents integer not null,
  status payment_status not null default 'pending',
  stripe_invoice_id text,
  period_start date,
  period_end date,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index platform_fee_payments_org_idx on platform_fee_payments (organization_id);
