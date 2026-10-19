const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

function api({signedIn=true, assigned=true, emailFailure=false} = {}) {
  let handler;
  const calls = [], filters = [];
  const values = {
    driver_profiles: {id:'driver'}, delivery_assignments: assigned ? {id:'stop', booking_id:'booking', status:'DELIVERED'} : null,
    bookings: {id:'booking', customer_id:'customer', booking_number:'SPR-TEST', final_total:450, amount_paid:450, balance_due:0},
    customers: {first_name:'Customer', email:'customer@example.com'},
    payments: [{id:'payment', amount:450, method:'CASH', status:'COMPLETED', paid_at:'2026-10-19'}], notification_logs: null
  };
  const db = {auth:{getUser: async () => ({data:{user:signedIn ? {id:'driver'} : null}})},
    rpc: async (name, body) => {calls.push({name,body}); return {data:{booking:values.bookings,payment:values.payments[0]}};},
    from(table) {
      const query = {select() {return this;}, eq(field,value) {filters.push({table,field,value}); return this;},
        order() {return this;}, limit() {return this;},
        single: async () => ({data:structuredClone(values[table])}),
        maybeSingle: async () => ({data:structuredClone(values[table])}),
        insert: async () => ({error:null}),
        then(resolve) {return Promise.resolve({data:structuredClone(values[table])}).then(resolve);}};
      return query;
    }};
  const source=fs.readFileSync(path.join(__dirname,'../supabase/functions/driver-payment/index.ts'),'utf8').replace(/^import[^\n]+\n/, '');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
  assert.equal(compiled.diagnostics.length,0);
  vm.runInNewContext(compiled.outputText, {createClient:()=>db, Response, Request, Intl, Date, console:{error() {}},
    Deno:{env:{get:()=> 'configured'},serve:fn=>{handler=fn;}},
    fetch:async () => new Response(JSON.stringify(emailFailure ? {error:'failed'} : {id:'email'}),{status:emailFailure?502:200})});
  return {calls, filters, async send(body) {const result=await handler(new Request('https://example.com',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)}));return {status:result.status,body:await result.json()};}};
}

test('payment API rejects signed-out and unassigned callers before writing', async () => {
  for (const options of [{signedIn:false},{assigned:false}]) {
    const f=api(options), result=await f.send({action:'record',assignment_id:'stop'});
    assert.ok([401,403].includes(result.status));
    assert.equal(f.calls.length,0);
  }
});

test('payment API uses verified driver identity rather than caller-supplied identity', async () => {
  const f=api(), result=await f.send({action:'record',assignment_id:'stop',driver_id:'someone-else',method:'CASH',request_id:'request',expected_balance:450});
  assert.equal(result.status,200);
  assert.equal(f.calls[0].body.p_driver_id,'driver');
  assert.ok(f.filters.some(filter=>filter.table==='delivery_assignments'&&filter.field==='driver_id'&&filter.value==='driver'));
});

test('receipt email failure does not invoke the payment-recording transaction', async () => {
  const f=api({emailFailure:true}), result=await f.send({action:'receipt',assignment_id:'stop',payment_id:'payment'});
  assert.equal(result.status,500);
  assert.equal(f.calls.length,0);
});
