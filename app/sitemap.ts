import type { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
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

  return [
    { url: siteUrl, changeFrequency: 'monthly', priority: 1 },
    ...orgUrls,
    ...athleteUrls,
  ];
}
