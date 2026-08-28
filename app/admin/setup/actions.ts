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

export async function finishOrganizationSetup(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/setup');

  const orgName = String(formData.get('name') ?? '');
  const schoolName = String(formData.get('school_name') ?? '');
  const sports = String(formData.get('sports') ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const city = String(formData.get('city') ?? '');
  const state = String(formData.get('state') ?? '');
  const tiers = parseTiers(formData);

  try {
    await createOrganizationForCurrentAdmin(
      supabase,
      user!.id,
      { name: orgName, schoolName, sports, city, state, adminContactEmail: user!.email ?? undefined },
      tiers
    );
  } catch (e) {
    redirect(`/admin/setup?error=${encodeURIComponent((e as Error).message)}`);
  }

  redirect('/admin');
}
