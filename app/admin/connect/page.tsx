import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ConnectButton } from './ConnectButton';

export default async function AdminConnectPage({
  searchParams,
}: {
  searchParams: { onboarded?: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/connect');

  const { data: account } = await supabase
    .from('accounts')
    .select('organization_id, role')
    .eq('id', user.id)
    .single();

  if (account?.role !== 'org_admin' || !account.organization_id) redirect('/admin');

  const { data: org } = await supabase
    .from('organizations')
    .select('name, stripe_connect_account_id, stripe_connect_onboarded')
    .eq('id', account.organization_id)
    .single();

  return (
    <div className="max-w-lg">
      <h1 className="text-2xl font-bold text-slate-900">Dues Payment Setup</h1>
      <p className="mt-2 text-slate-600">
        Booster dues are paid straight into <strong>{org?.name}</strong>&rsquo;s own Stripe
        account &mdash; Booster Club Hub never holds your families&rsquo; money. Connect a Stripe
        account to start collecting dues online.
      </p>

      {searchParams.onboarded && (
        <p className="mt-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          Redirected back from Stripe. If onboarding is complete, your status below will update
          shortly.
        </p>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6">
        <p className="text-sm text-slate-500">Status</p>
        <p className="mt-1 font-semibold text-slate-900">
          {org?.stripe_connect_onboarded
            ? 'Connected'
            : org?.stripe_connect_account_id
            ? 'Onboarding started — finish it in Stripe'
            : 'Not connected'}
        </p>
        <ConnectButton />
      </div>
    </div>
  );
}
