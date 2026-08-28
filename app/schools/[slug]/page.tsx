import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';

export const revalidate = 3600;

async function getOrgWithRoster(slug: string) {
  const supabase = createPublicClient();
  const { data: org } = await supabase
    .from('organizations_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  if (!org) return null;

  const { data: athletes } = await supabase
    .from('athlete_profiles_public')
    .select('id, slug, first_name, last_name, sport, grad_year, photo_url, photo_alt, city, state')
    .eq('organization_id', org.id)
    .order('last_name');

  return { org, athletes: athletes ?? [] };
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const result = await getOrgWithRoster(params.slug);
  if (!result) return { title: 'School Not Found' };
  const { org } = result;

  const title = `${org.school_name} Athlete Roster | ${org.name}`;
  const description = `Browse the athlete recruiting profiles published by ${org.name} at ${org.school_name}${
    org.city ? ` in ${org.city}, ${org.state}` : ''
  }. Find stats, highlight video, and recruiter contact info.`;

  return { title, description, alternates: { canonical: `/schools/${org.slug}` } };
}

export default async function SchoolRosterPage({ params }: { params: { slug: string } }) {
  const result = await getOrgWithRoster(params.slug);
  if (!result) notFound();
  const { org, athletes } = result;

  const bySport = athletes.reduce<Record<string, typeof athletes>>((acc, a) => {
    (acc[a.sport] ??= []).push(a);
    return acc;
  }, {});

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-slate-900">{org.school_name} Athlete Roster</h1>
      <p className="mt-1 text-slate-600">
        Published recruiting profiles from {org.name}
        {org.city && ` — ${org.city}, ${org.state}`}
      </p>

      {athletes.length === 0 && (
        <p className="mt-8 text-slate-500">No published athlete profiles yet. Check back soon.</p>
      )}

      {Object.entries(bySport).map(([sport, list]) => (
        <section key={sport} className="mt-8">
          <h2 className="text-lg font-semibold text-slate-900">{sport}</h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {list.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/athletes/${a.slug}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 hover:border-brand-400"
                >
                  {a.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.photo_url}
                      alt={a.photo_alt || `${a.first_name} ${a.last_name}, ${sport}`}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-md bg-slate-100" />
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {a.first_name} {a.last_name}
                    </p>
                    <p className="text-sm text-slate-500">Class of {a.grad_year}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
}
