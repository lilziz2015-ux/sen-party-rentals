-- Apply to the Sen Party Rentals database only, before deploying driver-payment.
-- Service-only transaction: driver browsers cannot invoke it directly or edit bookings.
begin;
create or replace function public.record_driver_balance_payment(
  p_driver_id uuid, p_assignment_id uuid, p_request_id uuid,
  p_method text, p_expected_balance numeric
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  b public.bookings%rowtype;
  a public.delivery_assignments%rowtype;
  receipt public.payments%rowtype;
  collected numeric;
  due numeric;
  ref text := 'driver:' || p_request_id::text;
begin
  if p_request_id is null or p_method not in ('CASH','CHECK','ZELLE') or p_method is null then
    raise exception 'A request ID and cash, check or Zelle method are required';
  end if;
  select * into a from public.delivery_assignments
    where id=p_assignment_id and driver_id=p_driver_id for share;
  if not found or not exists(select 1 from public.driver_profiles where id=p_driver_id and active=true)
    or a.status::text in ('CANCELLED','CANCELED') then
    raise exception 'Active driver assignment required';
  end if;
  select * into b from public.bookings where id=a.booking_id for update;
  if not found or b.status::text in ('CANCELLED','CANCELED') or b.payment_status='REFUNDED' then
    raise exception 'This booking cannot receive a driver payment';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(ref,0));
  select * into receipt from public.payments where transaction_reference=ref;
  if found then
    if receipt.booking_id<>b.id then raise exception 'Request ID already used'; end if;
    return jsonb_build_object('booking',to_jsonb(b),'payment',to_jsonb(receipt));
  end if;
  select greatest(coalesce(b.amount_paid,0),coalesce(sum(amount),0)) into collected
    from public.payments where booking_id=b.id and upper(status::text) in ('PAID','COMPLETED','SUCCESS','SUCCEEDED');
  due := greatest(0,coalesce(b.final_total,b.subtotal,0)-collected);
  if b.balance_due is not null then due := least(due,greatest(0,b.balance_due)); end if;
  if due<=0 then raise exception 'No balance is due. Refresh this stop'; end if;
  if p_expected_balance is null or due<>p_expected_balance then
    raise exception 'The balance changed. Refresh this stop before recording payment';
  end if;
  receipt := jsonb_populate_record(null::public.payments,jsonb_build_object('method',p_method,'status','PAID'));
  insert into public.payments(booking_id,amount,method,status,transaction_reference,notes,received_by,paid_at)
    values(b.id,due,receipt.method,receipt.status,ref,'Received by assigned driver '||p_driver_id::text,p_driver_id,now())
    returning * into receipt;
  update public.bookings set amount_paid=collected+due,balance_due=0,payment_status='PAID',
    paid_at=coalesce(paid_at,now()),updated_at=now() where id=b.id returning * into b;
  return jsonb_build_object('booking',to_jsonb(b),'payment',to_jsonb(receipt));
end;
$$;
revoke all on function public.record_driver_balance_payment(uuid,uuid,uuid,text,numeric) from public,anon,authenticated;
grant execute on function public.record_driver_balance_payment(uuid,uuid,uuid,text,numeric) to service_role;
commit;
