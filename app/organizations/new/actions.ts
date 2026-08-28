'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createOrganizationForCurrentAdmin, type OrgTierInput } from '@/lib/actions/organization';

function parseTiers(formData: FormData): OrgTierInput[] {
  const tiers: OrgTierInput[] = [];
  for (let i = 0; i < 5; i++) {
    const name = String(formData.get(`tier_${i}_name`) ?? '');
    const price = String(formData.get(`tier_${i}_price`) ?? '');
    const interval = String(formData.get(`tier_${i}_interval`) ?? 'annual') as OrgTierInput['billingInterval'];
    if (name.trim() && price) {
      tiers.push({ name, priceCents: Math.round(parseFloat(price) * 100), billingInterval: interval });
    }
  }
  return tiers;
}

export async function registerOrganization(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const adminName = String(formData.get('admin_contact_name') ?? '');
  const orgName = String(formData.get('name') ?? '');
  const schoolName = String(formData.get('school_name') ?? '');
  const sports = String(formData.get('sports') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const city = String(formData.get('city') ?? '');
  const state = String(formData.get('state') ?? '');
  const tiers = parseTiers(formData);

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role: 'org_admin', full_name: adminName } },
  });

  if (error) {
    redirect(`/organizations/new?error=${encodeURIComponent(error.message)}`);
  }

  if (!data.session || !data.user) {
    // Email confirmation is required before we have a session. The
    // organization + dues tiers get created on first login instead --
    // see app/admin/page.tsx and app/admin/setup/actions.ts.
    redirect('/signup/check-email');
  }

  try {
    await createOrganizationForCurrentAdmin(
      supabase,
      data.user.id,
      {
        name: orgName,
        schoolName,
        sports,
        city,
        state,
        adminContactName: adminName,
        adminContactEmail: email,
      },
      tiers
    );
  } catch (e) {
    redirect(`/organizations/new?error=${encodeURIComponent((e as Error).message)}`);
  }

  redirect('/admin');
}
