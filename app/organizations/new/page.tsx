import { NavBar } from '@/components/NavBar';
import { Footer } from '@/components/Footer';
import { OrganizationForm } from '@/components/OrganizationForm';
import { registerOrganization } from './actions';

export const metadata = { title: 'Start Your Booster Club' };

export default function NewOrganizationPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-xl px-4 py-16">
        <h1 className="text-2xl font-bold text-slate-900">Start your booster club</h1>
        <p className="mt-1 text-sm text-slate-600">
          Set up your organization and dues tiers. You&rsquo;ll be the booster club admin, and can
          invite parents once your club is live.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {searchParams.error}
          </p>
        )}

        <OrganizationForm
          action={registerOrganization}
          includeCredentials
          submitLabel="Create booster club"
        />
      </main>
      <Footer />
    </>
  );
}
