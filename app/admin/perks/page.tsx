import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { addPerk } from './actions';

export default async function AdminPerksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin/perks');

  const { data: account } = await supabase
    .from('accounts')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  const { data: perkLinks } = account?.organization_id
    ? await supabase
        .from('perk_organizations')
        .select('perk_id, perks(id, business_name, offer_text, website_url, status)')
        .eq('organization_id', account.organization_id)
    : { data: [] };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Local Perks &amp; Sponsors</h1>

      <form action={addPerk} className="max-w-lg space-y-4 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Add a perk</h2>
        <div>
          <label className="block text-sm font-medium text-slate-700">Business name</label>
          <input name="business_name" required className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Offer</label>
          <input
            name="offer_text"
            required
            placeholder="10% off for members"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Website (optional)</label>
          <input name="website_url" type="url" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
        >
          Add perk
        </button>
      </form>

      <ul className="grid gap-3 sm:grid-cols-2">
        {(perkLinks ?? []).map((p: any) => (
          <li key={p.perk_id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-medium">{p.perks?.business_name}</p>
            <p className="text-sm text-slate-500">{p.perks?.offer_text}</p>
            {p.perks?.website_url && (
              <a href={p.perks.website_url} className="text-sm text-brand-700 underline">
                {p.perks.website_url}
              </a>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
