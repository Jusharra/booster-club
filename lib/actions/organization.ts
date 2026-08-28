import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { organizationSlug } from '@/lib/slug';
import { createAdminClient } from '@/lib/supabase/admin';

export interface OrgTierInput {
  name: string;
  priceCents: number;
  billingInterval: 'one_time' | 'monthly' | 'annual';
}

export interface OrgFieldsInput {
  name: string;
  schoolName: string;
  sports: string[];
  city?: string;
  state?: string;
  adminContactName?: string;
  adminContactEmail?: string;
  adminContactPhone?: string;
}

// Creates the Organization for the currently-authenticated org_admin,
// links it back onto their account, and seeds dues tiers. Called both from
// the org-signup flow (session available immediately) and from a
// first-login "finish setup" screen (when email confirmation delayed the
// session at signup time).
export async function createOrganizationForCurrentAdmin(
  supabase: SupabaseClient,
  userId: string,
  fields: OrgFieldsInput,
  tiers: OrgTierInput[]
) {
  // Slug uniqueness is a cross-tenant check -- a brand new org_admin has no
  // org yet, so organizations_select_admin (RLS) would never let them see
  // anyone else's row anyway. Use the service-role client for this
  // existence check only; nothing sensitive is read, just slug collisions.
  const adminClient = createAdminClient();
  const baseSlug = organizationSlug(`${fields.schoolName}`);
  let slug = baseSlug;
  let attempt = 0;
  for (;;) {
    const { data: existing } = await adminClient
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    attempt += 1;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  // Generate the id ourselves and skip `.select()` on the insert: PostgREST
  // re-reads an inserted row under the SELECT policy to return it, but
  // organizations_select_admin requires accounts.organization_id to already
  // point at this org -- which is exactly what we're about to set below.
  // Chaining .select() here would fail with a misleading
  // "new row violates row-level security policy" on a perfectly valid insert.
  const orgId = randomUUID();

  const { error: orgError } = await supabase.from('organizations').insert({
    id: orgId,
    name: fields.name,
    school_name: fields.schoolName,
    slug,
    sports: fields.sports,
    city: fields.city || null,
    state: fields.state || null,
    admin_contact_name: fields.adminContactName || null,
    admin_contact_email: fields.adminContactEmail || null,
    admin_contact_phone: fields.adminContactPhone || null,
  });

  if (orgError) throw new Error(orgError.message);

  const { error: acctError } = await supabase
    .from('accounts')
    .update({ organization_id: orgId, role: 'org_admin' })
    .eq('id', userId);

  if (acctError) throw new Error(acctError.message);

  const tierRows = tiers
    .filter((t) => t.name.trim() && t.priceCents >= 0)
    .map((t, i) => ({
      organization_id: orgId,
      name: t.name,
      price_cents: t.priceCents,
      billing_interval: t.billingInterval,
      sort_order: i,
    }));

  if (tierRows.length) {
    const { error: tiersError } = await supabase.from('dues_tiers').insert(tierRows);
    if (tiersError) throw new Error(tiersError.message);
  }

  return { id: orgId, slug };
}
