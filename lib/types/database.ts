// Hand-authored types mirroring supabase/migrations/*.sql. Regenerate with
// the Supabase MCP `generate_typescript_types` (or `supabase gen types`)
// once the schema stabilizes; this file keeps the app compiling until then.

export type AccountRole = 'parent' | 'org_admin' | 'platform_owner';
export type MembershipStatus = 'pending' | 'active' | 'past_due' | 'canceled';
export type SubscriptionStatus = 'incomplete' | 'trialing' | 'active' | 'past_due' | 'canceled';
export type BillingInterval = 'one_time' | 'monthly' | 'annual';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface Organization {
  id: string;
  name: string;
  school_name: string;
  slug: string;
  sports: string[];
  city: string | null;
  state: string | null;
  admin_contact_name: string | null;
  admin_contact_email: string | null;
  admin_contact_phone: string | null;
  logo_url: string | null;
  platform_fee_status: 'pending' | 'active' | 'past_due' | 'canceled';
  platform_fee_amount_cents: number | null;
  stripe_connect_account_id: string | null;
  stripe_connect_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface OrganizationPublic {
  id: string;
  name: string;
  school_name: string;
  slug: string;
  sports: string[];
  city: string | null;
  state: string | null;
  logo_url: string | null;
}

export interface Account {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: AccountRole;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DuesTier {
  id: string;
  organization_id: string;
  name: string;
  price_cents: number;
  billing_interval: BillingInterval;
  description: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Membership {
  id: string;
  account_id: string;
  organization_id: string;
  dues_tier_id: string | null;
  status: MembershipStatus;
  renewal_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface AthleteProfile {
  id: string;
  guardian_account_id: string;
  organization_id: string;
  slug: string;
  first_name: string;
  last_name: string;
  sport: string;
  sports: string[];
  grad_year: number;
  school_name: string;
  city: string | null;
  state: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  gpa: number | null;
  bio: string | null;
  stats: Record<string, string>;
  highlight_video_urls: string[];
  photo_url: string | null;
  photo_alt: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AthleteProfilePublic {
  id: string;
  organization_id: string;
  organization_slug: string;
  slug: string;
  first_name: string;
  last_name: string;
  sport: string;
  sports: string[];
  grad_year: number;
  school_name: string;
  city: string | null;
  state: string | null;
  position: string | null;
  height: string | null;
  weight: string | null;
  gpa: number | null;
  bio: string | null;
  stats: Record<string, string>;
  highlight_video_urls: string[];
  photo_url: string | null;
  photo_alt: string | null;
  published_at: string | null;
  guardian_name: string | null;
  guardian_email: string;
  guardian_phone: string | null;
}

export interface ProfileSubscription {
  id: string;
  athlete_profile_id: string;
  guardian_account_id: string;
  tier: string;
  billing_interval: BillingInterval;
  price_cents: number | null;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface QrCode {
  id: string;
  athlete_profile_id: string;
  target_url: string;
  created_at: string;
}

export interface Perk {
  id: string;
  business_name: string;
  offer_text: string;
  website_url: string | null;
  logo_url: string | null;
  status: 'active' | 'inactive';
  created_by: string | null;
  created_at: string;
}

export interface DuesPayment {
  id: string;
  membership_id: string;
  organization_id: string;
  account_id: string;
  amount_cents: number;
  status: PaymentStatus;
  stripe_connect_account_id: string | null;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  created_at: string;
}
