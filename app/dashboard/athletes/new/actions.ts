'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { athleteProfileSlug } from '@/lib/slug';

export async function createAthleteProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/dashboard/athletes/new');

  const organizationId = String(formData.get('organization_id') ?? '');
  const firstName = String(formData.get('first_name') ?? '');
  const lastName = String(formData.get('last_name') ?? '');
  const sport = String(formData.get('sport') ?? '');
  const gradYear = parseInt(String(formData.get('grad_year') ?? ''), 10);

  const { data: org } = await supabase
    .from('organizations')
    .select('school_name, city, state')
    .eq('id', organizationId)
    .single();

  if (!org) redirect('/dashboard/athletes/new?error=Choose a booster club first');

  const baseSlug = athleteProfileSlug({ schoolName: org!.school_name, firstName, lastName, sport });
  let slug = baseSlug;
  for (let attempt = 1; attempt < 20; attempt++) {
    const { data: existing } = await supabase
      .from('athlete_profiles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();
    if (!existing) break;
    slug = `${baseSlug}-${attempt + 1}`;
  }

  const { data: athlete, error } = await supabase
    .from('athlete_profiles')
    .insert({
      guardian_account_id: user!.id,
      organization_id: organizationId,
      slug,
      first_name: firstName,
      last_name: lastName,
      sport,
      sports: [sport],
      grad_year: gradYear,
      school_name: org!.school_name,
      city: org!.city,
      state: org!.state,
      published: false,
    })
    .select('id')
    .single();

  if (error || !athlete) {
    // slug collision or validation error
    redirect(`/dashboard/athletes/new?error=${encodeURIComponent(error?.message ?? 'Could not create profile')}`);
  }

  redirect(`/dashboard/athletes/${athlete!.id}/edit`);
}
