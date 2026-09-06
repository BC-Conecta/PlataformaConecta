-- Fotos opcionais de perfil e portal para pessoas.
alter table public.people
  add column if not exists profile_photo_url text,
  add column if not exists portal_photo_url text;

insert into storage.buckets (id, name, public)
values
  ('profile-photos', 'profile-photos', true),
  ('portal-photos', 'portal-photos', true)
on conflict (id) do update set public = excluded.public;

create policy profile_photos_select_public
on storage.objects for select
to public
using (bucket_id = 'profile-photos');

create policy portal_photos_select_public
on storage.objects for select
to public
using (bucket_id = 'portal-photos');

create policy profile_photos_insert_manager
on storage.objects for insert
to authenticated
with check (bucket_id = 'profile-photos' and public.is_manager());

create policy portal_photos_insert_manager
on storage.objects for insert
to authenticated
with check (bucket_id = 'portal-photos' and public.is_manager());

create policy profile_photos_update_manager
on storage.objects for update
to authenticated
using (bucket_id = 'profile-photos' and public.is_manager())
with check (bucket_id = 'profile-photos' and public.is_manager());

create policy portal_photos_update_manager
on storage.objects for update
to authenticated
using (bucket_id = 'portal-photos' and public.is_manager())
with check (bucket_id = 'portal-photos' and public.is_manager());

create policy profile_photos_delete_manager
on storage.objects for delete
to authenticated
using (bucket_id = 'profile-photos' and public.is_manager());

create policy portal_photos_delete_manager
on storage.objects for delete
to authenticated
using (bucket_id = 'portal-photos' and public.is_manager());
