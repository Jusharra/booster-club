import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import type { AthleteProfilePublic } from '@/lib/types/database';

export const revalidate = 3600;

async function getAthlete(slug: string): Promise<AthleteProfilePublic | null> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from('athlete_profiles_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return (data as AthleteProfilePublic) ?? null;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const athlete = await getAthlete(params.slug);
  if (!athlete) return { title: 'Athlete Not Found' };

  const location = [athlete.city, athlete.state].filter(Boolean).join(', ');
  const title = `${athlete.first_name} ${athlete.last_name} | ${athlete.sport} | Class of ${athlete.grad_year} | ${athlete.school_name}`;
  const description = `${athlete.first_name} ${athlete.last_name} is a ${athlete.grad_year} ${athlete.sport} recruit at ${athlete.school_name}${
    location ? ` in ${location}` : ''
  }. View stats, highlight video, and contact info for college recruiters.`;

  return {
    title,
    description,
    alternates: { canonical: `/athletes/${athlete.slug}` },
    openGraph: {
      title,
      description,
      type: 'profile',
      images: athlete.photo_url ? [{ url: athlete.photo_url }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: athlete.photo_url ? [athlete.photo_url] : undefined,
    },
  };
}

export default async function AthletePublicPage({ params }: { params: { slug: string } }) {
  const athlete = await getAthlete(params.slug);
  if (!athlete) notFound();

  const location = [athlete.city, athlete.state].filter(Boolean).join(', ');
  const photoAlt =
    athlete.photo_alt ||
    `${athlete.first_name} ${athlete.last_name}, ${athlete.sport} at ${athlete.school_name}${
      location ? `, ${location}` : ''
    }`;

  const statEntries = Object.entries(athlete.stats ?? {});

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: `${athlete.first_name} ${athlete.last_name}`,
    affiliation: athlete.school_name,
    sport: athlete.sport,
    address: location || undefined,
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-4 text-sm text-slate-500">
        <Link href={`/schools/${athlete.organization_slug}`} className="hover:underline">
          &larr; {athlete.school_name} Roster
        </Link>
      </nav>

      <div className="flex items-start gap-4">
        {athlete.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={athlete.photo_url}
            alt={photoAlt}
            width={128}
            height={128}
            className="h-32 w-32 flex-shrink-0 rounded-lg object-cover"
          />
        ) : (
          <div className="flex h-32 w-32 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
            No photo
          </div>
        )}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            {athlete.first_name} {athlete.last_name}
          </h1>
          <p className="text-slate-600">
            {athlete.sport} &middot; Class of {athlete.grad_year}
          </p>
          <p className="text-sm text-slate-500">
            {athlete.school_name}
            {location && ` — ${location}`}
          </p>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
        {athlete.position && (
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs uppercase text-slate-400">Position</dt>
            <dd className="font-semibold text-slate-900">{athlete.position}</dd>
          </div>
        )}
        {athlete.height && (
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs uppercase text-slate-400">Height</dt>
            <dd className="font-semibold text-slate-900">{athlete.height}</dd>
          </div>
        )}
        {athlete.weight && (
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs uppercase text-slate-400">Weight</dt>
            <dd className="font-semibold text-slate-900">{athlete.weight}</dd>
          </div>
        )}
        {athlete.gpa != null && (
          <div className="rounded-md bg-slate-50 p-3">
            <dt className="text-xs uppercase text-slate-400">GPA</dt>
            <dd className="font-semibold text-slate-900">{athlete.gpa}</dd>
          </div>
        )}
      </dl>

      {athlete.bio && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">About</h2>
          <p className="mt-2 whitespace-pre-line text-slate-700">{athlete.bio}</p>
        </section>
      )}

      {statEntries.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">Stats</h2>
          <div className="mt-2 overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full text-left text-sm">
              <tbody className="divide-y divide-slate-100">
                {statEntries.map(([key, value]) => (
                  <tr key={key}>
                    <td className="bg-slate-50 px-4 py-2 font-medium text-slate-600">{key}</td>
                    <td className="px-4 py-2 text-slate-900">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {athlete.highlight_video_urls?.length > 0 && (
        <section className="mt-6">
          <h2 className="font-semibold text-slate-900">Highlight Video</h2>
          <ul className="mt-2 space-y-2">
            {athlete.highlight_video_urls.map((url) => (
              <li key={url}>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-brand-700 underline"
                >
                  {url}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-brand-200 bg-brand-50 p-4">
        <h2 className="font-semibold text-slate-900">Contact</h2>
        <p className="mt-1 text-sm text-slate-600">
          For recruiting inquiries, contact {athlete.guardian_name ?? 'the parent/guardian'}:
        </p>
        <p className="mt-2 font-medium text-slate-900">{athlete.guardian_email}</p>
        {athlete.guardian_phone && <p className="font-medium text-slate-900">{athlete.guardian_phone}</p>}
      </section>
    </main>
  );
}
