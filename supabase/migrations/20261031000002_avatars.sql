-- avatars bucket: profile photos.
-- Why: riders recognise each other at the meet spot. The bucket is private: photos are only
-- reachable through short-lived signed links, which only signed-in users can create, so a
-- photo can't be shared or scraped from a public URL (§10 privacy: campus-scoped visibility).
-- Each user writes only inside their own folder: avatars/<user id>/<file>.
-- Spec: §6.2 profiles.avatar_path, Storage in §3 (brought forward from Phase 7).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 2 * 1024 * 1024, array['image/jpeg', 'image/png', 'image/webp']);

create policy "signed-in users can view avatars"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'avatars');

create policy "users can upload into their own avatar folder"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users can replace files in their own avatar folder"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "users can delete files in their own avatar folder"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
