'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function signUpParent(formData: FormData) {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');
  const fullName = String(formData.get('full_name') ?? '');
  const phone = String(formData.get('phone') ?? '');
  const organizationId = String(formData.get('organization_id') ?? '');
  const duesTierId = String(formData.get('dues_tier_id') ?? '');

  const supabase = createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role: 'parent', full_name: fullName, phone },
    },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  // No session yet (email confirmation required) -- the membership gets
  // created on first dashboard visit instead, once we have an authenticated
  // session to satisfy the accounts/memberships RLS policies.
  if (!data.session) {
    redirect('/signup/check-email');
  }

  if (organizationId) {
    await supabase.from('memberships').insert({
      account_id: data.user!.id,
      organization_id: organizationId,
      dues_tier_id: duesTierId || null,
      status: 'pending',
    });
  }

  redirect('/dashboard');
}
