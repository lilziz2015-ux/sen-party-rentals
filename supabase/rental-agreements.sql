-- Personalized customer rental agreements and electronic signatures.
-- Public visitors can only access an agreement through the rental-agreement
-- Edge Function. The underlying table is private to the service role.

begin;

create table if not exists public.rental_agreements (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SIGNED', 'VOID')),
  access_token text not null unique
    check (length(access_token) between 40 and 180),
  agreement_version text not null,
  agreement_title text not null default 'Rental Agreement and Safety Waiver',
  business_snapshot jsonb not null,
  customer_snapshot jsonb not null,
  booking_snapshot jsonb not null,
  items_snapshot jsonb not null default '[]'::jsonb,
  terms_snapshot jsonb not null,
  signer_name text,
  electronic_consent boolean not null default false,
  terms_accepted boolean not null default false,
  signed_at timestamptz,
  signer_ip_hash text,
  signer_user_agent text,
  signature_hash text,
  expires_at timestamptz not null,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_agreements_signed_fields check (
    (status <> 'SIGNED') or
    (
      signer_name is not null and
      electronic_consent = true and
      terms_accepted = true and
      signed_at is not null and
      signature_hash is not null
    )
  )
);

create index if not exists rental_agreements_status_created_idx
  on public.rental_agreements (status, created_at desc);

create index if not exists rental_agreements_expires_idx
  on public.rental_agreements (expires_at)
  where status = 'PENDING';

alter table public.rental_agreements enable row level security;

revoke all on table public.rental_agreements from public, anon, authenticated;

drop policy if exists "No direct client access to rental agreements"
  on public.rental_agreements;

create policy "No direct client access to rental agreements"
  on public.rental_agreements
  as restrictive
  for all
  to anon, authenticated
  using (false)
  with check (false);

comment on table public.rental_agreements is
  'Immutable booking and terms snapshots used for customer electronic signatures. Access is mediated by the rental-agreement Edge Function.';

comment on column public.rental_agreements.access_token is
  'High-entropy bearer token. Never expose through direct public table access.';

commit;
