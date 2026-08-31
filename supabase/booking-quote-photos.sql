-- Optional customer photos for booking quote review.
-- Files stay private and are only readable by active Owner/Admin users.

create table if not exists public.booking_quote_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 8388608),
  created_at timestamptz not null default now()
);

create index if not exists booking_quote_photos_booking_created_idx
  on public.booking_quote_photos (booking_id, created_at);

alter table public.booking_quote_photos enable row level security;

revoke all on table public.booking_quote_photos from anon;
grant select on table public.booking_quote_photos to authenticated;

drop policy if exists "Owners and admins view booking quote photos"
  on public.booking_quote_photos;

create policy "Owners and admins view booking quote photos"
  on public.booking_quote_photos
  for select
  to authenticated
  using ((select private.is_owner_or_admin()));

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'booking-quote-photos',
  'booking-quote-photos',
  false,
  8388608,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Owners and admins read booking quote photo files"
  on storage.objects;

create policy "Owners and admins read booking quote photo files"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'booking-quote-photos'
    and (select private.is_owner_or_admin())
  );

