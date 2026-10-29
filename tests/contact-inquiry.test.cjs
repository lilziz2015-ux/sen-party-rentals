const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const ts=require('typescript');
const {webcrypto}=require('node:crypto');
function fixture({sent=false,fail=false}={}){
 let handler;const calls=[],updates=[],messages=[];
 const db={rpc:async(n,args)=>{calls.push({n,args});return {data:{id:args.p_id,status:sent?'SENT':'PENDING'}};},from(){return {update(v){updates.push(v);return {eq:async()=>({})};}};}};
 const source=fs.readFileSync('supabase/functions/contact-inquiry/index.ts','utf8').replace(/^import .*;\n/,'');
 const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},reportDiagnostics:true});
 assert.equal(out.diagnostics.length,0);
 vm.runInNewContext(out.outputText,{createClient:()=>db,Response,Request,TextEncoder,crypto:webcrypto,Set,Date,console:{error(){}},Deno:{env:{get:()=> 'configured'},serve(fn){handler=fn;}},fetch:async(url,args)=>{messages.push(JSON.parse(args.body));return new Response(JSON.stringify({id:'provider'}),{status:fail?500:200});}});
 const valid={request_id:'00000000-0000-4000-8000-000000000001',name:'Test Person',email:'test@example.com',message:'A sufficiently long test message.'};
 return {calls,updates,messages,async send(body=valid,headers={}){return handler(new Request('https://example.com',{method:'POST',headers:{Origin:'https://www.senmoonbounce.com',apikey:'sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1','Content-Type':'application/json',...headers},body:JSON.stringify(body)}));},valid};
}
test('contact rejects foreign sites and invalid fields without sending email',async()=>{
 const f=fixture();assert.equal((await f.send(f.valid,{Origin:'https://other.example'})).status,403);
 assert.equal((await f.send({...f.valid,email:'invalid'})).status,400);assert.equal(f.calls.length,0);assert.equal(f.messages.length,0);
});
test('contact saves privately, fixes recipient to owner, and sends only once on retry',async()=>{
 const f=fixture();assert.equal((await f.send({...f.valid,to:'attacker@example.com'})).status,200);
 assert.deepEqual(f.messages[0].to,['senmoonbounce@gmail.com']);assert.equal(f.messages[0].reply_to,'test@example.com');assert.equal(f.updates.at(-1).status,'SENT');
 const replay=fixture({sent:true});assert.equal((await replay.send()).status,200);assert.equal(replay.messages.length,0);
});
test('provider failures are shown as failures, preserving message for retry',async()=>{
 const f=fixture({fail:true});assert.equal((await f.send()).status,503);assert.equal(f.updates.at(-1).status,'FAILED');
});
