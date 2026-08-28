import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { createClient } from '@/lib/supabase/server';
import { SignupForm } from './SignupForm';
import type { DuesTier, OrganizationPublic } from '@/lib/types/database';

export const metadata = { title: 'Join Your Booster Club' };

export default async function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; org?: string };
}) {
  const supabase = createClient();

  const { data: organizations } = await supabase
    .from('organizations_public')
    .select('*')
    .order('name');

  const orgs = (organizations ?? []) as OrganizationPublic[];
  const defaultOrg = searchParams.org ? orgs.find((o) => o.slug === searchParams.org) : undefined;

  const orgIds = orgs.map((o) => o.id);
  const { data: duesTiers } = orgIds.length
    ? await supabase
        .from('dues_tiers')
        .select('*')
        .in('organization_id', orgIds)
        .eq('active', true)
        .order('sort_order')
    : { data: [] as DuesTier[] };

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-md px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Join your booster club</h1>
        <p className="mt-1 text-sm text-slate-600">
          You&rsquo;re the account holder &mdash; you&rsquo;ll be the only one who can manage dues
          and, later, your athlete&rsquo;s recruiting profile.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        {orgs.length === 0 ? (
          <p className="mt-6 text-sm text-slate-600">
            No booster clubs are set up yet.{' '}
            <a href="/organizations/new" className="text-brand-700 underline">
              Start one
            </a>
            .
          </p>
        ) : (
          <SignupForm
            organizations={orgs}
            duesTiers={(duesTiers ?? []) as DuesTier[]}
            defaultOrgId={defaultOrg?.id}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
