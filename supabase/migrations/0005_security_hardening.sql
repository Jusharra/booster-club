-- Pin a stable search_path on trigger functions (Supabase linter:
-- function_search_path_mutable).
alter function set_updated_at() set search_path = public;
alter function athlete_profiles_track_published() set search_path = public;

-- Note on remaining advisor warnings (intentionally left as-is):
--  * organizations_public / athlete_profiles_public are SECURITY DEFINER
--    views by design -- they exist specifically to expose a curated,
--    non-sensitive subset of RLS-protected tables to anon/public callers
--    (the public roster page and public athlete page). Each view's WHERE
--    clause is the security boundary; no Stripe ids or unpublished rows
--    are ever selected.
--  * is_platform_owner / current_admin_org_id / has_active_membership are
--    SECURITY DEFINER helper functions used inside RLS policies on
--    publicly-readable tables (athlete_profiles, dues_tiers, organizations),
--    so anon/authenticated necessarily retain EXECUTE for policy
--    evaluation to work. They return only booleans/uuids derived from
--    auth.uid() and disclose nothing sensitive if called directly.
