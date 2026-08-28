import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Member Perks' };

export default async function PerksPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/perks');

  // RLS (perks_select_members) already restricts this to perks visible to
  // an org where the caller has an active membership.
  const { data: perks } = await supabase
    .from('perks')
    .select('id, business_name, offer_text, website_url, logo_url')
    .eq('status', 'active');

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:underline">
        &larr; Dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Member Perks</h1>
      <p className="mt-1 text-slate-600">
        Local business discounts available to active booster club members.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {(perks ?? []).map((p) => (
          <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="font-semibold text-slate-900">{p.business_name}</p>
            <p className="mt-1 text-sm text-slate-600">{p.offer_text}</p>
            {p.website_url && (
              <a href={p.website_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-brand-700 underline">
                Visit website
              </a>
            )}
          </li>
        ))}
        {(perks ?? []).length === 0 && (
          <p className="text-sm text-slate-500">
            No perks yet, or your dues aren&rsquo;t active. Pay your dues from the dashboard to
            unlock member perks.
          </p>
        )}
      </ul>
    </main>
  );
}
