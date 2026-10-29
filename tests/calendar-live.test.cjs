const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function fixture({fail=false}={}){
 const events={},date={value:'',addEventListener(n,fn){events[n]=fn;}},grid={innerHTML:''},message={textContent:''},empty={hidden:false};
 const elements={availabilityDate:date,availabilityGrid:grid,selectedDateMessage:message,availabilityEmpty:empty};
 let calls=0;
 const window={SenCatalog:{load:async()=>[{id:'rental',name:'Test Rental',price:250,dimensions:'13 × 13 ft',image_url:'https://example.com/photo.jpg'}],imageURL:v=>v,detailPage:()=> './modular-moon-bounce-rental.html',availability:async()=>{calls++;if(fail)throw new Error('Availability could not be checked.');return [{rental_item_id:'rental',quantity_available:0}];}}};
 vm.runInNewContext(fs.readFileSync('calendar.js','utf8'),{window,document:{getElementById:id=>elements[id],querySelectorAll:()=>[]},URL,URLSearchParams,location:{href:'https://www.senmoonbounce.com/availability-calendar.html'},history:{replaceState(){}},Intl,Date,Map,Set});
 await tick();return {grid,message,date,events,get calls(){return calls;}};
}
test('calendar requires a date and respects zero availability from the live API',async()=>{
 const f=await fixture();assert.match(f.grid.innerHTML,/Choose a date/);assert.equal(f.calls,0);
 f.date.value='2026-11-01';f.events.change();await tick();assert.equal(f.calls,1);assert.match(f.grid.innerHTML,/Not available on this date/);assert.doesNotMatch(f.grid.innerHTML,/class="availability-status available"/);
});
test('calendar does not claim availability when the API fails',async()=>{
 const f=await fixture({fail:true});f.date.value='2026-11-01';f.events.change();await tick();assert.match(f.message.textContent,/could not be checked/);assert.match(f.grid.innerHTML,/Check by phone/);assert.doesNotMatch(f.grid.innerHTML,/class="availability-status available"/);
});
