-- Sen Moon Bounce admin, driver, inventory, and public-booking hardening.
-- This file is intentionally idempotent so it can be reviewed and reapplied safely.

begin;

create or replace function private.is_active_driver()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.driver_profiles
    where id = (select auth.uid())
      and active = true
  );
$$;

revoke all on function private.is_active_driver() from public, anon;
grant execute on function private.is_active_driver() to authenticated;

alter policy "Drivers view assigned booking items"
on public.booking_items
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.booking_id = booking_items.booking_id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers view assigned bookings"
on public.bookings
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.booking_id = bookings.id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers view assigned customers"
on public.customers
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.bookings b
    join public.delivery_assignments da on da.booking_id = b.id
    where b.customer_id = customers.id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers view assigned deliveries"
on public.delivery_assignments
using (
  (select private.is_active_driver())
  and driver_id = (select auth.uid())
);

alter policy "Drivers update assigned deliveries"
on public.delivery_assignments
using (
  (select private.is_active_driver())
  and driver_id = (select auth.uid())
)
with check (
  (select private.is_active_driver())
  and driver_id = (select auth.uid())
);

alter policy "Drivers view assigned checklist"
on public.delivery_checklist_items
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.id = delivery_checklist_items.delivery_assignment_id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers update assigned checklist"
on public.delivery_checklist_items
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.id = delivery_checklist_items.delivery_assignment_id
      and da.driver_id = (select auth.uid())
  )
)
with check (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.id = delivery_checklist_items.delivery_assignment_id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers view assigned delivery photos"
on public.delivery_photos
using (
  (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.id = delivery_photos.delivery_assignment_id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers add assigned delivery photos"
on public.delivery_photos
with check (
  (select private.is_active_driver())
  and uploaded_by = (select auth.uid())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.id = delivery_photos.delivery_assignment_id
      and da.driver_id = (select auth.uid())
  )
);

alter policy "Drivers view own profile"
on public.driver_profiles
using (
  (select private.is_active_driver())
  and id = (select auth.uid())
);

alter policy "Drivers update own profile"
on public.driver_profiles
using (
  (select private.is_active_driver())
  and id = (select auth.uid())
)
with check (
  (select private.is_active_driver())
  and id = (select auth.uid())
);

alter policy "Managers view drivers"
on public.driver_profiles
using ((select private.is_owner_or_admin()));

alter policy "Managers manage drivers"
on public.driver_profiles
with check ((select private.is_owner_or_admin()));

alter policy "Managers update drivers"
on public.driver_profiles
using ((select private.is_owner_or_admin()))
with check ((select private.is_owner_or_admin()));

alter policy "Managers delete drivers"
on public.driver_profiles
using ((select private.is_owner_or_admin()));

alter policy "Drivers upload assigned delivery photos"
on storage.objects
with check (
  bucket_id = 'delivery-photos'
  and (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.driver_id = (select auth.uid())
      and da.id::text = (storage.foldername(objects.name))[1]
  )
);

alter policy "Drivers view assigned delivery photos"
on storage.objects
using (
  bucket_id = 'delivery-photos'
  and (select private.is_active_driver())
  and exists (
    select 1
    from public.delivery_assignments da
    where da.driver_id = (select auth.uid())
      and da.id::text = (storage.foldername(objects.name))[1]
  )
);

drop policy if exists "Drivers view delivery photos" on storage.objects;

revoke execute on function public.is_owner_or_manager() from public, anon, authenticated;
revoke execute on function public.get_rental_availability(uuid, date) from public, anon, authenticated;

drop index if exists public.delivery_assignments_driver_idx;

create index if not exists activity_logs_created_at_idx
  on public.activity_logs (created_at desc);
create index if not exists activity_logs_booking_id_idx
  on public.activity_logs (booking_id);
create index if not exists activity_logs_admin_user_id_idx
  on public.activity_logs (admin_user_id);
create index if not exists rental_item_images_item_sort_idx
  on public.rental_item_images (rental_item_id, sort_order, created_at);
create unique index if not exists rental_item_images_one_primary_idx
  on public.rental_item_images (rental_item_id)
  where is_primary = true;

create or replace function private.log_admin_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin_user_id uuid;
  v_payload jsonb;
  v_entity_id uuid;
  v_booking_id uuid;
begin
  select id
  into v_admin_user_id
  from public.admin_users
  where id = (select auth.uid())
    and active = true;

  if v_admin_user_id is null then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  v_payload := coalesce(to_jsonb(new), to_jsonb(old));

  if nullif(v_payload ->> 'id', '') is not null then
    v_entity_id := (v_payload ->> 'id')::uuid;
  end if;

  if tg_table_name = 'bookings' then
    v_booking_id := v_entity_id;
  elsif nullif(v_payload ->> 'booking_id', '') is not null then
    v_booking_id := (v_payload ->> 'booking_id')::uuid;
  end if;

  insert into public.activity_logs (
    admin_user_id,
    booking_id,
    action_type,
    entity_type,
    entity_id,
    description,
    metadata
  )
  values (
    v_admin_user_id,
    v_booking_id,
    lower(tg_op),
    tg_table_name,
    v_entity_id,
    initcap(lower(tg_op)) || ' ' || replace(tg_table_name, '_', ' '),
    jsonb_build_object('table', tg_table_name, 'operation', tg_op)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

revoke all on function private.log_admin_activity() from public, anon, authenticated;

drop trigger if exists audit_admin_booking_changes on public.bookings;
create trigger audit_admin_booking_changes
after insert or update or delete on public.bookings
for each row execute function private.log_admin_activity();

drop trigger if exists audit_admin_payment_changes on public.payments;
create trigger audit_admin_payment_changes
after insert or update or delete on public.payments
for each row execute function private.log_admin_activity();

drop trigger if exists audit_admin_inventory_changes on public.rental_items;
create trigger audit_admin_inventory_changes
after insert or update or delete on public.rental_items
for each row execute function private.log_admin_activity();

drop trigger if exists audit_admin_driver_changes on public.driver_profiles;
create trigger audit_admin_driver_changes
after insert or update or delete on public.driver_profiles
for each row execute function private.log_admin_activity();

drop trigger if exists audit_admin_user_changes on public.admin_users;
create trigger audit_admin_user_changes
after insert or update or delete on public.admin_users
for each row execute function private.log_admin_activity();

drop trigger if exists audit_admin_delivery_changes on public.delivery_assignments;
create trigger audit_admin_delivery_changes
after insert or update or delete on public.delivery_assignments
for each row execute function private.log_admin_activity();

create or replace function public.submit_booking(
  p_first_name text,
  p_last_name text,
  p_phone text,
  p_email text,
  p_event_date date,
  p_start_time time without time zone,
  p_end_time time without time zone,
  p_event_address text,
  p_event_city text,
  p_event_state text,
  p_event_zip text,
  p_event_type text,
  p_surface_type text,
  p_setup_location text,
  p_special_instructions text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_customer_id uuid;
  v_booking_id uuid;
  v_booking_number text;
  v_item jsonb;
  v_rental_item_id uuid;
  v_item_name text;
  v_quantity integer;
  v_quantity_available integer;
  v_reserved_quantity integer;
  v_unit_price numeric;
  v_line_total numeric;
  v_subtotal numeric := 0;
  v_clean_phone text;
  v_clean_email text;
  v_seen_item_ids uuid[] := array[]::uuid[];
begin
  if nullif(trim(p_first_name), '') is null or length(trim(p_first_name)) > 100 then
    raise exception 'Enter a valid first name';
  end if;
  if nullif(trim(p_last_name), '') is null or length(trim(p_last_name)) > 100 then
    raise exception 'Enter a valid last name';
  end if;
  if nullif(trim(p_phone), '') is null or length(trim(p_phone)) > 40 then
    raise exception 'Enter a valid phone number';
  end if;
  if nullif(trim(p_email), '') is null
     or length(trim(p_email)) > 254
     or trim(p_email) !~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
    raise exception 'Enter a valid email address';
  end if;
  if p_event_date is null or p_event_date < current_date then
    raise exception 'Event date cannot be in the past';
  end if;
  if p_event_date > current_date + 730 then
    raise exception 'Event date is too far in the future';
  end if;
  if p_start_time is not null and p_end_time is not null and p_end_time <= p_start_time then
    raise exception 'Event end time must be later than the start time';
  end if;
  if nullif(trim(p_event_address), '') is null or length(trim(p_event_address)) > 300 then
    raise exception 'Enter a valid event address';
  end if;
  if nullif(trim(p_event_city), '') is null or length(trim(p_event_city)) > 120 then
    raise exception 'Enter a valid event city';
  end if;
  if nullif(trim(p_event_state), '') is null or length(trim(p_event_state)) > 50 then
    raise exception 'Enter a valid event state';
  end if;
  if nullif(trim(p_event_zip), '') is null or length(trim(p_event_zip)) > 20 then
    raise exception 'Enter a valid event ZIP code';
  end if;
  if length(coalesce(p_event_type, '')) > 120
     or length(coalesce(p_surface_type, '')) > 120
     or length(coalesce(p_setup_location, '')) > 200
     or length(coalesce(p_special_instructions, '')) > 2000 then
    raise exception 'One or more booking fields are too long';
  end if;
  if p_items is null
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 20 then
    raise exception 'Choose between 1 and 20 rental items';
  end if;

  v_clean_phone := trim(p_phone);
  v_clean_email := lower(trim(p_email));

  perform pg_advisory_xact_lock(
    hashtextextended(v_clean_email || '|' || v_clean_phone || '|' || p_event_date::text, 0)
  );

  if exists (
    select 1
    from public.bookings b
    join public.customers c on c.id = b.customer_id
    where b.event_date = p_event_date
      and b.status <> 'CANCELLED'
      and b.created_at >= now() - interval '90 seconds'
      and (c.phone = v_clean_phone or lower(c.email) = v_clean_email)
  ) then
    raise exception 'A matching booking was just submitted. Please wait before trying again.';
  end if;

  select id
  into v_customer_id
  from public.customers
  where phone = v_clean_phone or lower(email) = v_clean_email
  order by created_at
  limit 1;

  if v_customer_id is null then
    insert into public.customers (first_name, last_name, phone, email)
    values (trim(p_first_name), trim(p_last_name), v_clean_phone, v_clean_email)
    returning id into v_customer_id;
  else
    update public.customers
    set first_name = trim(p_first_name),
        last_name = trim(p_last_name),
        phone = v_clean_phone,
        email = v_clean_email,
        updated_at = now()
    where id = v_customer_id;
  end if;

  v_booking_number := private.generate_booking_number();

  insert into public.bookings (
    booking_number, customer_id, status, payment_status, event_type,
    event_date, start_time, end_time, event_address, event_city,
    event_state, event_zip, setup_location, surface_type,
    special_instructions, subtotal, final_total, balance_due
  )
  values (
    v_booking_number, v_customer_id, 'PENDING', 'UNPAID',
    nullif(trim(p_event_type), ''), p_event_date, p_start_time, p_end_time,
    trim(p_event_address), trim(p_event_city), upper(trim(p_event_state)),
    trim(p_event_zip), nullif(trim(p_setup_location), ''),
    nullif(trim(p_surface_type), ''), nullif(trim(p_special_instructions), ''),
    0, 0, 0
  )
  returning id into v_booking_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if jsonb_typeof(v_item) <> 'object'
       or coalesce(v_item ->> 'rental_item_id', '') !~*
          '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
      raise exception 'Every booking item must be a valid inventory item';
    end if;

    v_rental_item_id := (v_item ->> 'rental_item_id')::uuid;

    if v_rental_item_id = any(v_seen_item_ids) then
      raise exception 'The same rental item cannot be added twice';
    end if;
    v_seen_item_ids := array_append(v_seen_item_ids, v_rental_item_id);

    if coalesce(v_item ->> 'quantity', '') !~ '^[1-9][0-9]{0,2}$' then
      raise exception 'Rental item quantity must be between 1 and 100';
    end if;
    v_quantity := (v_item ->> 'quantity')::integer;
    if v_quantity > 100 then
      raise exception 'Rental item quantity must be between 1 and 100';
    end if;

    perform pg_advisory_xact_lock(
      hashtextextended(v_rental_item_id::text || '|' || p_event_date::text, 1)
    );

    select name, price, quantity_available
    into v_item_name, v_unit_price, v_quantity_available
    from public.rental_items
    where id = v_rental_item_id
      and active = true
    for update;

    if not found then
      raise exception 'A selected rental item is no longer available';
    end if;

    v_reserved_quantity := private.get_reserved_quantity(v_rental_item_id, p_event_date);
    if v_quantity > greatest(v_quantity_available - v_reserved_quantity, 0) then
      raise exception '% is not available in the requested quantity for that date', v_item_name;
    end if;

    v_line_total := v_quantity * v_unit_price;
    v_subtotal := v_subtotal + v_line_total;

    insert into public.booking_items (
      booking_id, rental_item_id, item_name, quantity, unit_price, line_total
    )
    values (
      v_booking_id, v_rental_item_id, v_item_name, v_quantity, v_unit_price, v_line_total
    );
  end loop;

  update public.bookings
  set subtotal = v_subtotal,
      final_total = v_subtotal,
      balance_due = v_subtotal,
      updated_at = now()
  where id = v_booking_id;

  return jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_number', v_booking_number,
    'status', 'PENDING',
    'subtotal', v_subtotal
  );
end;
$$;

revoke all on function public.submit_booking(
  text, text, text, text, date, time without time zone,
  time without time zone, text, text, text, text, text,
  text, text, text, jsonb
) from public;
grant execute on function public.submit_booking(
  text, text, text, text, date, time without time zone,
  time without time zone, text, text, text, text, text,
  text, text, text, jsonb
) to anon, authenticated, service_role;

commit;
