# Booster Club Hub (v1)

High school booster club membership platform + guardian-controlled, SEO-optimized
athlete recruiting profiles. Next.js 14 (App Router) + Supabase (Postgres, Auth,
Storage) + Stripe, deployed on Netlify.

## Architecture decisions locked in for v1

Per the spec's "Open Decisions" section, these were confirmed before development:

1. **Recruiting Profile subscription revenue flows to the platform**, via
   Stripe Billing (`app/api/stripe/checkout`, `app/api/stripe/webhook`). This
   is separate from booster dues, which flow to each club's own Stripe
   Connect account (`app/api/stripe/dues-checkout`, `app/api/stripe/dues-webhook`)
   — the platform never holds dues money. The platform's own revenue is a
   flat fee billed directly to each Organization (`platform_fee_payments`),
   kept structurally separate from both.
2. **Pricing is a placeholder.** `RECRUITING_PROFILE_PRICE_CENTS_MONTHLY` /
   `_ANNUAL` in `.env` drive the Stripe Checkout price dynamically — update
   these (or wire up real Stripe Price IDs) before go-live.
3. **Athlete profiles are 100% guardian-controlled.** Booster club admins can
   feature/link to a published profile from the roster page but cannot view,
   edit, or unpublish it. Only the guardian's own login (`guardian_account_id
   = auth.uid()`) can touch an `athlete_profiles` row — enforced in
   PostgreSQL RLS, not just in application code.

## Stack

- **Frontend/backend**: Next.js 14 App Router, TypeScript, Tailwind CSS
- **Database/Auth/Storage**: Supabase project `booster-club`
  (`https://piqeuqiacmkyjneybjkg.supabase.co`)
- **Payments**: Stripe (Billing for platform subscriptions, Connect Express
  for club dues)
- **Hosting**: Netlify, via the GitHub integration + `@netlify/plugin-nextjs`

## Data model

See `supabase/migrations/`. Tables: `organizations`, `accounts`,
`dues_tiers`, `memberships`, `athlete_profiles`, `profile_subscriptions`,
`qr_codes`, `perks` / `perk_organizations`, `dues_payments`,
`profile_subscription_payments`, `platform_fee_payments`. Two public views
(`organizations_public`, `athlete_profiles_public`) expose only the
non-sensitive columns anonymous visitors are allowed to see.

Row Level Security is on for every table. The load-bearing rule: an athlete
profile is visible to the public only when `published = true`; it is always
visible/editable to `guardian_account_id = auth.uid()`; nobody else — not
even the org admin — gets edit access.

## Local development

```bash
npm install
cp .env.example .env.local   # fill in real keys
npm run dev
```

You need, at minimum, `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (already pointed at the `booster-club`
Supabase project in `.env.example`) plus a Supabase `SUPABASE_SERVICE_ROLE_KEY`
for server-side webhook writes. Stripe keys are only required to exercise the
payment flows.

## Deploying

1. Push to GitHub (`main` branch) — already configured as `origin`.
2. In Netlify: **Add new site → Import from Git → GitHub → `booster-club`**.
   Netlify auto-detects `@netlify/plugin-nextjs` from `netlify.toml`.
3. Set the environment variables from `.env.example` in Netlify's site
   settings (Site configuration → Environment variables), using real values.
4. Set `NEXT_PUBLIC_SITE_URL` to the Netlify production URL (or custom
   domain) once known — it's used to build QR codes, canonical URLs, and
   Stripe redirect URLs.

## Stripe setup checklist (before going live)

- [ ] Create the platform Stripe account, set `STRIPE_SECRET_KEY` /
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] Add a webhook endpoint at `/api/stripe/webhook` for
      `checkout.session.completed`, `customer.subscription.updated`,
      `customer.subscription.deleted`, `invoice.paid` → set
      `STRIPE_WEBHOOK_SECRET`.
- [ ] Add a **separate** webhook endpoint at `/api/stripe/dues-webhook`,
      scoped to Connect events (`checkout.session.completed`,
      `account.updated`) → set `STRIPE_CONNECT_WEBHOOK_SECRET`.
- [ ] Confirm real Recruiting Profile pricing and update
      `RECRUITING_PROFILE_PRICE_CENTS_MONTHLY` / `_ANNUAL`.
- [ ] Each booster club admin connects their own Stripe account from
      `/admin/connect` (Stripe Connect Express onboarding) before their
      parents can pay dues online.
- [ ] Decide how the flat platform fee is actually invoiced to each
      Organization (v1 ships the `platform_fee_payments` table and
      `organizations.platform_fee_status`, but the invoicing trigger — a
      Stripe Billing subscription on the platform account, billed to the
      org's admin contact — is intentionally left as a manual/next step
      rather than wired into a public flow no visitor should trigger).

## First pilot school

Org name/branding, dues tiers, and the real Recruiting Profile price are
supplied by you and entered through `/organizations/new` (or `/admin` once
logged in) — no seed data is hardcoded.

## Known follow-up: Next.js version

Pinned to `next@14.2.35` (latest 14.x patch) to stay on the App Router APIs
this codebase is written against. `npm audit` still flags two `high`
advisories against the 14.x line (an internal Server Function endpoint
disclosure, and a nested `postcss` issue bundled inside Next's own
tooling) that only have fixes on Next 15/16, which change server-side APIs
(`cookies()`/`headers()` become async, etc.) enough to require a deliberate
migration pass across every Server Component in this repo. Do that
migration before this app handles production traffic, not as a drive-by
version bump.

## Roadmap

- **v2**: physical NFC card (reuses `qr_codes.target_url` as-is), automated
  stat pulling from public data sources, multi-school perks network.
- **Out of scope, permanently**: anything involving NIL compensation or
  monetizing an athlete's likeness for a third party.
