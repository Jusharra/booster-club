-- Storage bucket for athlete profile photos. Public read (needed for the
-- public athlete page), write restricted to the authenticated guardian
-- uploading into their own folder (auth.uid()/...).
insert into storage.buckets (id, name, public)
values ('athlete-photos', 'athlete-photos', true)
on conflict (id) do nothing;

create policy "athlete_photos_public_read"
  on storage.objects for select
  using (bucket_id = 'athlete-photos');

create policy "athlete_photos_owner_write"
  on storage.objects for insert
  with check (bucket_id = 'athlete-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "athlete_photos_owner_update"
  on storage.objects for update
  using (bucket_id = 'athlete-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "athlete_photos_owner_delete"
  on storage.objects for delete
  using (bucket_id = 'athlete-photos' and (storage.foldername(name))[1] = auth.uid()::text);
