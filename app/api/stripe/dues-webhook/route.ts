import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Receives events from CONNECTED accounts (booster clubs), configured
// separately in the Stripe dashboard from the platform-account webhook
// used by /api/stripe/webhook. Verified with STRIPE_CONNECT_WEBHOOK_SECRET.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? '', secret ?? '');
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed` }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const membershipId = session.metadata?.membership_id;
    const organizationId = session.metadata?.organization_id;
    const accountId = session.metadata?.account_id;
    if (!membershipId || !organizationId || !accountId) {
      return NextResponse.json({ received: true });
    }

    await supabase.from('dues_payments').insert({
      membership_id: membershipId,
      organization_id: organizationId,
      account_id: accountId,
      amount_cents: session.amount_total ?? 0,
      status: 'succeeded',
      stripe_connect_account_id: event.account ?? null,
      stripe_checkout_session_id: session.id,
      stripe_payment_intent_id:
        typeof session.payment_intent === 'string' ? session.payment_intent : null,
      paid_at: new Date().toISOString(),
    });

    const renewal = new Date();
    renewal.setFullYear(renewal.getFullYear() + 1);

    await supabase
      .from('memberships')
      .update({ status: 'active', renewal_date: renewal.toISOString().slice(0, 10) })
      .eq('id', membershipId);
  }

  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account;
    await supabase
      .from('organizations')
      .update({ stripe_connect_onboarded: Boolean(account.details_submitted && account.charges_enabled) })
      .eq('stripe_connect_account_id', account.id);
  }

  return NextResponse.json({ received: true });
}
