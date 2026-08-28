import Stripe from 'stripe';

// Platform-level Stripe client. Used only for Recruiting Profile
// subscriptions (Stripe Billing, revenue flows to the platform) and the
// flat platform fee billed to Organizations. Booster dues checkout uses
// this same client but with the `stripeAccount` option pointed at the
// club's own Connect account, so dues money never touches the platform's
// balance -- see app/api/stripe/dues-checkout/route.ts.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
  apiVersion: '2024-06-20',
  typescript: true,
});

export function recruitingProfilePriceCents(interval: 'monthly' | 'annual') {
  const key =
    interval === 'monthly'
      ? 'RECRUITING_PROFILE_PRICE_CENTS_MONTHLY'
      : 'RECRUITING_PROFILE_PRICE_CENTS_ANNUAL';
  const raw = process.env[key];
  // Placeholder defaults -- confirm real pricing before go-live (see
  // .env.example and the spec's Open Decisions section).
  return raw ? parseInt(raw, 10) : interval === 'monthly' ? 999 : 9900;
}
