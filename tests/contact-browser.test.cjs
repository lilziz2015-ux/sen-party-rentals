const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');

function fixture({date='',message='Please check availability for my event.'}={}){
 let submitHandler,fetchCount=0;
 const makeField=value=>({value,min:'',validationMessage:'',listeners:{},setCustomValidity(value){this.validationMessage=value;},addEventListener(type,fn){this.listeners[type]=fn;}});
 const dateField=makeField(date),messageField=makeField(message),submit={disabled:true};
 const form={
   querySelector(selector){if(selector==='button[type="submit"]')return submit;if(selector==='[name="event_date"]')return dateField;if(selector==='[name="contact_message"]')return messageField;return null;},
   addEventListener(type,fn){if(type==='submit')submitHandler=fn;},
   reportValidity(){return !dateField.validationMessage&&!messageField.validationMessage;},
   reset(){}
 };
 const status={textContent:''};
 class FakeFormData{get(name){return ({contact_name:'Test Person',contact_email:'test@example.com',contact_phone:'5715551212',contact_message:messageField.value,event_date:dateField.value, event_city:'',contact_subject:'availability',contact_rental:'',preferred_contact:'text',website:''})[name] ?? '';}}
 vm.runInNewContext(fs.readFileSync('assets/contact.js','utf8'),{
   document:{getElementById(id){return id==='contact-form'?form:status;}},
   FormData:FakeFormData,
   crypto:{randomUUID:()=> '00000000-0000-4000-8000-000000000001'},
   Date,JSON,
   fetch:async()=>{fetchCount++;return {ok:true,json:async()=>({success:true})};}
 });
 return {dateField,messageField,submit,status,get fetchCount(){return fetchCount;},async submitForm(){await submitHandler({preventDefault(){}});}};
}
test('browser contact form sets today as the earliest date and rejects an older date',async()=>{
 const f=fixture({date:'1970-05-31'});
 assert.match(f.dateField.min,/^\d{4}-\d{2}-\d{2}$/);
 await f.submitForm();
 assert.match(f.dateField.validationMessage,/today or a future/);
 assert.equal(f.fetchCount,0);
});
test('browser contact form rejects a numeric-only message but permits omitted optional date',async()=>{
 const bad=fixture({message:'1234567890'});
 await bad.submitForm();
 assert.match(bad.messageField.validationMessage,/few words/);
 assert.equal(bad.fetchCount,0);
 const good=fixture({date:''});
 await good.submitForm();
 assert.equal(good.fetchCount,1);
});
