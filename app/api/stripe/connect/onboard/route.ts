import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

// Booster dues flow to the CLUB's own Stripe account, not the platform's.
// This route creates (or resumes) a Stripe Connect Express account for the
// org_admin's organization and returns an onboarding link.
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { data: account } = await supabase
    .from('accounts')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (account?.role !== 'org_admin' || !account.organization_id) {
    return NextResponse.json({ error: 'Not an organization admin' }, { status: 403 });
  }

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, stripe_connect_account_id, admin_contact_email')
    .eq('id', account.organization_id)
    .single();

  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  let accountId = org.stripe_connect_account_id;

  if (!accountId) {
    const connectAccount = await stripe.accounts.create({
      type: 'express',
      email: org.admin_contact_email ?? user.email ?? undefined,
      business_type: 'non_profit',
      business_profile: { name: org.name },
    });
    accountId = connectAccount.id;

    await supabase
      .from('organizations')
      .update({ stripe_connect_account_id: accountId })
      .eq('id', org.id);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${siteUrl}/admin/connect`,
    return_url: `${siteUrl}/admin/connect?onboarded=1`,
    type: 'account_onboarding',
  });

  return NextResponse.json({ url: accountLink.url });
}
