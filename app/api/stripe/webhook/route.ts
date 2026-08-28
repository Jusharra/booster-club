import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Platform-account webhook: Recruiting Profile subscriptions (Stripe
// Billing) and, later, platform fee invoices. Verified with
// STRIPE_WEBHOOK_SECRET. Dues events arrive on a separate endpoint --
// see /api/stripe/dues-webhook.
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature ?? '', secret ?? '');
  } catch {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== 'subscription') break;

      const athleteProfileId = session.metadata?.athlete_profile_id;
      const guardianAccountId = session.metadata?.guardian_account_id;
      const billingInterval = session.metadata?.billing_interval as 'monthly' | 'annual' | undefined;
      if (!athleteProfileId || !guardianAccountId) break;

      const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

      await supabase.from('profile_subscriptions').upsert(
        {
          athlete_profile_id: athleteProfileId,
          guardian_account_id: guardianAccountId,
          billing_interval: billingInterval ?? 'monthly',
          price_cents: subscription.items.data[0]?.price.unit_amount ?? null,
          status: subscription.status as any,
          stripe_customer_id: String(session.customer),
          stripe_subscription_id: subscription.id,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        },
        { onConflict: 'athlete_profile_id' }
      );
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await supabase
        .from('profile_subscriptions')
        .update({
          status: subscription.status as any,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq('stripe_subscription_id', subscription.id);
      break;
    }

    case 'invoice.paid': {
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.subscription) break;

      const { data: profileSub } = await supabase
        .from('profile_subscriptions')
        .select('id')
        .eq('stripe_subscription_id', invoice.subscription as string)
        .single();

      if (profileSub) {
        await supabase.from('profile_subscription_payments').insert({
          profile_subscription_id: profileSub.id,
          amount_cents: invoice.amount_paid,
          status: 'succeeded',
          stripe_invoice_id: invoice.id,
          stripe_payment_intent_id:
            typeof invoice.payment_intent === 'string' ? invoice.payment_intent : null,
          paid_at: new Date().toISOString(),
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
