const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const files=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
test('every inline script and structured-data block parses',()=>{
 for(const file of files){
  const source=fs.readFileSync(file,'utf8').replace(/<!--[\s\S]*?-->/g,'');
  for(const [,attrs,body] of source.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){
   if(/\bsrc=/.test(attrs))continue;
   if(attrs.includes('application/ld+json'))assert.doesNotThrow(()=>JSON.parse(body),file);
   else assert.doesNotThrow(()=>new vm.Script(body,{filename:file}),file);
  }
 }
});
test('canonical public pages are in the sitemap, private pages are excluded',()=>{
 const sitemap=fs.readFileSync('sitemap.xml','utf8');
 for(const file of files){
  const source=fs.readFileSync(file,'utf8');
  if(/^(admin|driver)/.test(file)||/name="robots"[^>]*content="[^\"]*noindex/i.test(source))continue;
  const canonical=source.match(/rel="canonical"\s+href="([^"]+)"/);
  if(canonical)assert.ok(sitemap.includes('<loc>'+canonical[1]+'</loc>'),file);
 }
 assert.doesNotMatch(sitemap,/admin\.html|driver\.html|rental-agreement\.html/);
});
test('all official product routes exist and product schema prices match inventory',()=>{
 for(const item of JSON.parse(fs.readFileSync('assets/catalog-snapshot.json','utf8'))){
  assert.ok(fs.existsSync(item.page),item.name);
  const source=fs.readFileSync(item.page,'utf8');
  for(const [,body] of source.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
   const data=JSON.parse(body);
   if(data['@type']==='Product' && data.offers?.price!==undefined)assert.equal(Number(data.offers.price),Number(item.price),item.name);
  }
 }
});
test('optimized images exist, are smaller and primary payment FAQ is consistent',()=>{
 const images=JSON.parse(fs.readFileSync('assets/image-manifest.json','utf8'));
 for(const [name,value] of Object.entries(images)){assert.ok(fs.existsSync(value.path),name);assert.ok(value.bytes<value.original_bytes,name);}
 for(const file of ['faq.html','policies.html','terms-and-conditions.html','cancellation-weather.html']){
  const source=fs.readFileSync(file,'utf8');assert.doesNotMatch(source,/A deposit may be required|Full payment may be required before|Some approved orders may be paid after setup/i,file);
 }
});
