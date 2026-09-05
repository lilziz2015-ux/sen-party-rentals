-- Delivery-fee estimates for customer bookings.
-- Mileage is an estimated one-way driving distance from the Manassas base,
-- calculated from the destination ZIP code. The Edge Function is the only
-- public calculator and writes the server-calculated result to the booking.

alter table public.bookings
  add column if not exists delivery_distance_miles numeric(8, 1),
  add column if not exists delivery_fee_calculated_at timestamp with time zone,
  add column if not exists delivery_fee_method text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_delivery_distance_nonnegative'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_delivery_distance_nonnegative
      check (delivery_distance_miles is null or delivery_distance_miles >= 0);
  end if;
end
$$;

comment on column public.bookings.delivery_distance_miles is
  'Estimated one-way driving miles from the Sen Party Rentals Manassas base, using destination ZIP centroids.';

comment on column public.bookings.delivery_fee_calculated_at is
  'Time the delivery estimate was last calculated by the delivery-quote Edge Function.';

comment on column public.bookings.delivery_fee_method is
  'Calculator version/method used for the delivery estimate.';
