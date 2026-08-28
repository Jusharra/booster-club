'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function addPerk(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: account } = await supabase
    .from('accounts')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!account?.organization_id) return;

  const businessName = String(formData.get('business_name') ?? '');
  const offerText = String(formData.get('offer_text') ?? '');
  const websiteUrl = String(formData.get('website_url') ?? '');

  const { data: perk, error } = await supabase
    .from('perks')
    .insert({
      business_name: businessName,
      offer_text: offerText,
      website_url: websiteUrl || null,
      created_by: user.id,
    })
    .select('id')
    .single();

  if (error || !perk) return;

  await supabase.from('perk_organizations').insert({
    perk_id: perk.id,
    organization_id: account.organization_id,
  });

  revalidatePath('/admin/perks');
  revalidatePath('/admin');
  revalidatePath('/perks');
}
