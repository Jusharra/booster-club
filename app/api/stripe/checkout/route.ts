import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, recruitingProfilePriceCents } from '@/lib/stripe/server';

// Recruiting Profile subscription checkout. Per the v1 architecture
// decision, this revenue flows to the PLATFORM's own Stripe account via
// Stripe Billing (no `stripeAccount` option here, unlike dues checkout).
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

  const { athleteProfileId, billingInterval } = (await request.json()) as {
    athleteProfileId: string;
    billingInterval: 'monthly' | 'annual';
  };

  const { data: athlete } = await supabase
    .from('athlete_profiles')
    .select('id, first_name, last_name, guardian_account_id')
    .eq('id', athleteProfileId)
    .eq('guardian_account_id', user.id)
    .single();

  if (!athlete) return NextResponse.json({ error: 'Athlete profile not found' }, { status: 404 });

  const priceCents = recruitingProfilePriceCents(billingInterval);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: user.email ?? undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: priceCents,
          recurring: { interval: billingInterval === 'monthly' ? 'month' : 'year' },
          product_data: {
            name: `Recruiting Profile — ${athlete.first_name} ${athlete.last_name}`,
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      athlete_profile_id: athlete.id,
      guardian_account_id: user.id,
      billing_interval: billingInterval,
    },
    subscription_data: {
      metadata: { athlete_profile_id: athlete.id, guardian_account_id: user.id },
    },
    success_url: `${siteUrl}/dashboard/athletes/${athlete.id}/edit?subscribed=1`,
    cancel_url: `${siteUrl}/dashboard/athletes/${athlete.id}/edit?subscribed=0`,
  });

  return NextResponse.json({ url: session.url });
}
