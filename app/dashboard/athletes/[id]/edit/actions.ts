'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

function parseStats(formData: FormData): Record<string, string> {
  const stats: Record<string, string> = {};
  for (let i = 0; i < 10; i++) {
    const key = String(formData.get(`stat_${i}_key`) ?? '').trim();
    const value = String(formData.get(`stat_${i}_value`) ?? '').trim();
    if (key && value) stats[key] = value;
  }
  return stats;
}

export async function updateAthleteProfile(athleteId: string, formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const videos = String(formData.get('highlight_video_urls') ?? '')
    .split('\n')
    .map((v) => v.trim())
    .filter(Boolean);

  const { error } = await supabase
    .from('athlete_profiles')
    .update({
      first_name: String(formData.get('first_name') ?? ''),
      last_name: String(formData.get('last_name') ?? ''),
      sport: String(formData.get('sport') ?? ''),
      grad_year: parseInt(String(formData.get('grad_year') ?? ''), 10),
      position: String(formData.get('position') ?? '') || null,
      height: String(formData.get('height') ?? '') || null,
      weight: String(formData.get('weight') ?? '') || null,
      gpa: formData.get('gpa') ? parseFloat(String(formData.get('gpa'))) : null,
      bio: String(formData.get('bio') ?? '') || null,
      city: String(formData.get('city') ?? '') || null,
      state: String(formData.get('state') ?? '') || null,
      stats: parseStats(formData),
      highlight_video_urls: videos,
    })
    .eq('id', athleteId)
    .eq('guardian_account_id', user.id);

  if (error) {
    redirect(`/dashboard/athletes/${athleteId}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/dashboard/athletes/${athleteId}/edit`);
  redirect(`/dashboard/athletes/${athleteId}/edit?saved=1`);
}

export async function setPhotoUrl(athleteId: string, photoUrl: string, alt: string) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('athlete_profiles')
    .update({ photo_url: photoUrl, photo_alt: alt })
    .eq('id', athleteId)
    .eq('guardian_account_id', user.id);

  revalidatePath(`/dashboard/athletes/${athleteId}/edit`);
}

export async function togglePublish(formData: FormData) {
  const athleteId = String(formData.get('athlete_id') ?? '');
  const publish = formData.get('publish') === 'true';

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  await supabase
    .from('athlete_profiles')
    .update({ published: publish })
    .eq('id', athleteId)
    .eq('guardian_account_id', user.id);

  revalidatePath(`/dashboard/athletes/${athleteId}/edit`);
  revalidatePath('/dashboard');
  redirect(`/dashboard/athletes/${athleteId}/edit`);
}
