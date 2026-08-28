import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: account } = await supabase
    .from('accounts')
    .select('role, organization_id')
    .eq('id', user.id)
    .single();

  if (account?.role === 'platform_owner') {
    const { data: organizations } = await supabase
      .from('organizations')
      .select('id, name, school_name, slug, platform_fee_status, stripe_connect_onboarded')
      .order('created_at', { ascending: false });

    return (
      <div>
        <h1 className="text-2xl font-bold text-slate-900">All Organizations</h1>
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Booster Club</th>
                <th className="px-4 py-3">School</th>
                <th className="px-4 py-3">Platform Fee</th>
                <th className="px-4 py-3">Dues Connect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(organizations ?? []).map((org) => (
                <tr key={org.id}>
                  <td className="px-4 py-3 font-medium">{org.name}</td>
                  <td className="px-4 py-3">{org.school_name}</td>
                  <td className="px-4 py-3 capitalize">{org.platform_fee_status}</td>
                  <td className="px-4 py-3">{org.stripe_connect_onboarded ? 'Connected' : 'Pending'}</td>
                </tr>
              ))}
              {(organizations ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No organizations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (!account?.organization_id) {
    redirect('/admin/setup');
  }

  const orgId = account.organization_id;

  const [{ data: org }, { data: duesTiers }, { data: memberships }, { data: athletes }, { data: perkLinks }] =
    await Promise.all([
      supabase.from('organizations').select('*').eq('id', orgId).single(),
      supabase.from('dues_tiers').select('*').eq('organization_id', orgId).order('sort_order'),
      supabase
        .from('memberships')
        .select('id, status, renewal_date, dues_tier_id, accounts(full_name, email, phone)')
        .eq('organization_id', orgId),
      supabase
        .from('athlete_profiles')
        .select('id, first_name, last_name, sport, slug, published_at')
        .eq('organization_id', orgId)
        .eq('published', true),
      supabase.from('perk_organizations').select('perk_id, perks(business_name, offer_text, status)').eq('organization_id', orgId),
    ]);

  const activeCount = (memberships ?? []).filter((m) => m.status === 'active').length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{org?.name}</h1>
        <p className="text-slate-600">{org?.school_name}</p>
        <p className="mt-1 text-sm text-slate-500">
          Public roster page:{' '}
          <Link href={`/schools/${org?.slug}`} className="text-brand-700 underline">
            /schools/{org?.slug}
          </Link>
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Stat label="Members" value={String((memberships ?? []).length)} />
        <Stat label="Active dues" value={String(activeCount)} />
        <Stat label="Published athlete profiles" value={String((athletes ?? []).length)} />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Dues Tiers</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Tier</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Billing</th>
                <th className="px-4 py-3">Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(duesTiers ?? []).map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">${(t.price_cents / 100).toFixed(2)}</td>
                  <td className="px-4 py-3">{t.billing_interval}</td>
                  <td className="px-4 py-3">{t.active ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Member Roster</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3">Parent/Guardian</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Renewal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(memberships ?? []).map((m: any) => (
                <tr key={m.id}>
                  <td className="px-4 py-3 font-medium">{m.accounts?.full_name ?? '—'}</td>
                  <td className="px-4 py-3">{m.accounts?.email}</td>
                  <td className="px-4 py-3 capitalize">{m.status}</td>
                  <td className="px-4 py-3">{m.renewal_date ?? '—'}</td>
                </tr>
              ))}
              {(memberships ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-slate-400">
                    No members yet. Share your signup link: /signup?org={org?.slug}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">
          Published Athlete Recruiting Profiles
        </h2>
        <p className="text-sm text-slate-500">
          Guardian-controlled &mdash; you can feature and link to these, but only the parent can
          edit or publish/unpublish.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(athletes ?? []).map((a) => (
            <li key={a.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <Link href={`/athletes/${a.slug}`} className="font-medium text-brand-700 hover:underline">
                {a.first_name} {a.last_name}
              </Link>
              <p className="text-sm text-slate-500">{a.sport}</p>
            </li>
          ))}
          {(athletes ?? []).length === 0 && (
            <p className="text-sm text-slate-400">No published profiles yet.</p>
          )}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Local Perks</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {(perkLinks ?? []).map((p: any) => (
            <li key={p.perk_id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="font-medium">{p.perks?.business_name}</p>
              <p className="text-sm text-slate-500">{p.perks?.offer_text}</p>
            </li>
          ))}
          {(perkLinks ?? []).length === 0 && (
            <p className="text-sm text-slate-400">No perks linked yet.</p>
          )}
        </ul>
        <Link href="/admin/perks" className="mt-3 inline-block text-sm font-medium text-brand-700 underline">
          Manage perks
        </Link>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
