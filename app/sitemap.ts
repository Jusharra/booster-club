import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';

// Force this route to run at request time, never at build time. Netlify
// (and any host) builds this image before env vars from its dashboard are
// necessarily wired up for that build, and Next tries to prerender
// sitemap.ts as a static route by default -- that crashed the whole build
// with "supabaseUrl is required" the moment NEXT_PUBLIC_SUPABASE_URL wasn't
// present yet. Deferring to request time means it always runs with real
// runtime env vars instead.
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const homeEntry: MetadataRoute.Sitemap = [{ url: siteUrl, changeFrequency: 'monthly', priority: 1 }];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return homeEntry;
  }

  try {
    const supabase = createPublicClient();

    const [{ data: athletes }, { data: orgs }] = await Promise.all([
      supabase.from('athlete_profiles_public').select('slug, published_at'),
      supabase.from('organizations_public').select('slug'),
    ]);

    const athleteUrls: MetadataRoute.Sitemap = (athletes ?? []).map((a) => ({
      url: `${siteUrl}/athletes/${a.slug}`,
      lastModified: a.published_at ?? undefined,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    const orgUrls: MetadataRoute.Sitemap = (orgs ?? []).map((o) => ({
      url: `${siteUrl}/schools/${o.slug}`,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    return [...homeEntry, ...orgUrls, ...athleteUrls];
  } catch {
    // Never let a Supabase hiccup take the sitemap route down entirely.
    return homeEntry;
  }
}
