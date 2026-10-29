-- Website inquiries are private. Only the server-side Edge Function may access them.
create table if not exists public.contact_inquiries (
  id uuid primary key,
  created_at timestamptz not null default now(),
  requester_hash text not null,
  email_hash text not null,
  payload_hash text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  message text not null,
  details jsonb not null default '{}'::jsonb,
  status text not null default 'PENDING' check (status in ('PENDING','SENT','FAILED')),
  provider_message_id text,
  sent_at timestamptz
);
create index if not exists contact_inquiries_requester_time on public.contact_inquiries(requester_hash,created_at);
create index if not exists contact_inquiries_email_time on public.contact_inquiries(email_hash,created_at);
alter table public.contact_inquiries enable row level security;
revoke all on public.contact_inquiries from public,anon,authenticated;
grant select,insert,update on public.contact_inquiries to service_role;

create or replace function public.reserve_contact_inquiry(p_id uuid,p_requester_hash text,p_email_hash text,p_payload_hash text,p_name text,p_email text,p_phone text,p_message text,p_details jsonb)
returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare existing public.contact_inquiries;
begin
  perform pg_advisory_xact_lock(hashtextextended('contact:' || p_requester_hash,0));
  perform pg_advisory_xact_lock(hashtextextended('contact-email:' || p_email_hash,0));
  select * into existing from public.contact_inquiries where id=p_id;
  if found then
    if existing.payload_hash <> p_payload_hash or existing.requester_hash <> p_requester_hash then
      raise exception 'Request ID does not match';
    end if;
    return jsonb_build_object('id',existing.id,'status',existing.status);
  end if;
  if (select count(*) from public.contact_inquiries where requester_hash=p_requester_hash and created_at>now()-interval '1 hour')>=10
     or (select count(*) from public.contact_inquiries where email_hash=p_email_hash and created_at>now()-interval '1 hour')>=3 then
    raise exception 'Contact rate limit reached';
  end if;
  insert into public.contact_inquiries(id,requester_hash,email_hash,payload_hash,name,email,phone,message,details)
    values(p_id,p_requester_hash,p_email_hash,p_payload_hash,p_name,p_email,p_phone,p_message,p_details);
  return jsonb_build_object('id',p_id,'status','PENDING');
end;
$$;
revoke all on function public.reserve_contact_inquiry(uuid,text,text,text,text,text,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.reserve_contact_inquiry(uuid,text,text,text,text,text,text,text,jsonb) to service_role;
