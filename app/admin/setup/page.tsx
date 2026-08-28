import { redirect } from 'next/navigation';
import { OrganizationForm } from '@/components/OrganizationForm';
import { createClient } from '@/lib/supabase/server';
import { finishOrganizationSetup } from './actions';

export default async function AdminSetupPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/setup');

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-slate-900">Finish setting up your booster club</h1>
      <p className="mt-1 text-sm text-slate-600">
        Your login is confirmed &mdash; now configure your organization and dues tiers.
      </p>
      {searchParams.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      <OrganizationForm
        action={finishOrganizationSetup}
        includeCredentials={false}
        submitLabel="Create booster club"
      />
    </div>
  );
}
