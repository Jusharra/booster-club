import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';

// Booster dues checkout. Money is charged directly on the CLUB's own
// connected Stripe account (`stripeAccount` option below) -- it never
// touches the platform's balance. v1 charges each dues period as a single
// payment (mode: 'payment'); a club that wants Stripe-native recurring
// billing on their own account can set that up directly with Stripe.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { membershipId } = await request.json();

  const { data: membership } = await supabase
    .from('memberships')
    .select('id, account_id, organization_id, dues_tier_id')
    .eq('id', membershipId)
    .eq('account_id', user.id)
    .single();

  if (!membership) return NextResponse.json({ error: 'Membership not found' }, { status: 404 });

  const { data: tier } = await supabase
    .from('dues_tiers')
    .select('name, price_cents')
    .eq('id', membership.dues_tier_id)
    .single();

  const { data: org } = await supabase
    .from('organizations')
    .select('name, stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', membership.organization_id)
    .single();

  if (!org?.stripe_connect_account_id || !org.stripe_connect_onboarded) {
    return NextResponse.json(
      { error: 'This booster club has not finished setting up payments yet.' },
      { status: 400 }
    );
  }
  if (!tier) return NextResponse.json({ error: 'No dues tier selected' }, { status: 400 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      customer_email: user.email ?? undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: tier.price_cents,
            product_data: { name: `${org.name} booster dues — ${tier.name}` },
          },
          quantity: 1,
        },
      ],
      metadata: { membership_id: membership.id, organization_id: membership.organization_id, account_id: user.id },
      success_url: `${siteUrl}/dashboard?dues=success`,
      cancel_url: `${siteUrl}/dashboard?dues=canceled`,
    },
    { stripeAccount: org.stripe_connect_account_id }
  );

  return NextResponse.json({ url: session.url });
}
