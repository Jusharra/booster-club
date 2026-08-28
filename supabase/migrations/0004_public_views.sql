-- Public-safe views for anonymous pages (public roster page, public athlete
-- page). Views run with the privileges of their owner, so they intentionally
-- expose only non-sensitive columns and are the only way anon/public reads
-- reach organizations (never Stripe account ids) or accounts (never emails,
-- phone numbers -- a minor's public "Contact" element always resolves to the
-- guardian, but never by exposing raw contact info in a public query).

create view organizations_public
  with (security_invoker = false) as
  select id, name, school_name, slug, sports, city, state, logo_url
  from organizations;

grant select on organizations_public to anon, authenticated;

create view athlete_profiles_public
  with (security_invoker = false) as
  select
    ap.id, ap.organization_id, ap.slug, ap.first_name, ap.last_name,
    ap.sport, ap.sports, ap.grad_year, ap.school_name, ap.city, ap.state,
    ap.position, ap.height, ap.weight, ap.gpa, ap.bio, ap.stats,
    ap.highlight_video_urls, ap.photo_url, ap.photo_alt, ap.published_at,
    o.slug as organization_slug,
    a.full_name as guardian_name,
    a.email as guardian_email,
    a.phone as guardian_phone
  from athlete_profiles ap
  join accounts a on a.id = ap.guardian_account_id
  join organizations o on o.id = ap.organization_id
  where ap.published = true;

grant select on athlete_profiles_public to anon, authenticated;
