const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const {PGlite}=require('@electric-sql/pglite');
test('private contact storage enforces access, idempotency and rate limits',async()=>{
 const db=new PGlite();try{
 await db.exec('create role anon;create role authenticated;create role service_role;');
 await db.exec(fs.readFileSync('supabase/contact-inquiries.sql','utf8'));
 const send=(id,email='same',payload='payload')=>db.query('select public.reserve_contact_inquiry($1,$2,$3,$4,$5,$6,$7,$8,$9) as saved',[`00000000-0000-4000-8000-${String(id).padStart(12,'0')}`,'test-ip',email,payload,'Name','test@example.com','','Test message',{}]);
 await send(1);await send(1);assert.equal((await db.query('select count(*)::int as count from contact_inquiries')).rows[0].count,1);
 await assert.rejects(send(1,'same','different'),/does not match/);
 await send(2);await send(3);await assert.rejects(send(4),/rate limit/);
 for(let i=4;i<=10;i++)await send(i,'email-'+i);
 await assert.rejects(send(11,'new'),/rate limit/);
 await db.exec('set role anon');await assert.rejects(db.query('select * from public.contact_inquiries'),/permission denied/);await assert.rejects(send(12),/permission denied/);
 }finally{await db.close();}
});
