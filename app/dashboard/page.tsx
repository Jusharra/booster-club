import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { DuesPayButton } from '@/components/DuesPayButton';

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: memberships }, { data: athletes }] = await Promise.all([
    supabase
      .from('memberships')
      .select('id, status, renewal_date, organizations(name, school_name, slug), dues_tiers(name, price_cents)')
      .eq('account_id', user.id),
    supabase
      .from('athlete_profiles')
      .select('id, first_name, last_name, sport, published, slug, profile_subscriptions(status)')
      .eq('guardian_account_id', user.id),
  ]);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">My Booster Club Membership</h1>
        <div className="mt-4 space-y-3">
          {(memberships ?? []).map((m: any) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="font-medium">{m.organizations?.name}</p>
                <p className="text-sm text-slate-500">
                  {m.organizations?.school_name} &middot; {m.dues_tiers?.name ?? 'No tier selected'}{' '}
                  {m.dues_tiers?.price_cents != null && `— $${(m.dues_tiers.price_cents / 100).toFixed(2)}`}
                </p>
                <p className="mt-1 text-sm capitalize text-slate-600">
                  Status: <span className="font-semibold">{m.status}</span>
                  {m.renewal_date && ` · renews ${m.renewal_date}`}
                </p>
              </div>
              {m.status !== 'active' && <DuesPayButton membershipId={m.id} />}
            </div>
          ))}
          {(memberships ?? []).length === 0 && (
            <p className="text-sm text-slate-500">You haven&rsquo;t joined a booster club yet.</p>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">My Athletes</h2>
          <Link
            href="/dashboard/athletes/new"
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Add an athlete
          </Link>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {(athletes ?? []).map((a: any) => (
            <Link
              key={a.id}
              href={`/dashboard/athletes/${a.id}/edit`}
              className="rounded-lg border border-slate-200 bg-white p-4 hover:border-brand-400"
            >
              <p className="font-medium">
                {a.first_name} {a.last_name}
              </p>
              <p className="text-sm text-slate-500">{a.sport}</p>
              <div className="mt-2 flex gap-2 text-xs">
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    a.published ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {a.published ? 'Published' : 'Private'}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 font-medium ${
                    a.profile_subscriptions?.[0]?.status === 'active'
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Recruiting profile: {a.profile_subscriptions?.[0]?.status ?? 'none'}
                </span>
              </div>
            </Link>
          ))}
          {(athletes ?? []).length === 0 && (
            <p className="text-sm text-slate-500">
              No athlete profiles yet. Adding one is optional and always private until you publish
              it.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
