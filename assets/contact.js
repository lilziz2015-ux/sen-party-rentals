(() => {
  'use strict';
  const form=document.getElementById('contact-form'),status=document.getElementById('contact-form-status');
  if(!form || !status)return;
  let busy=false,requestId='',lastPayload='';
  const submit=form.querySelector('button[type="submit"]');
  const dateField=form.querySelector('[name="event_date"]');
  const messageField=form.querySelector('[name="contact_message"]');
  submit.disabled=false;

  function localDateToday(){
    const now=new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
  }
  if(dateField)dateField.min=localDateToday();

  function validateFields(){
    if(dateField)dateField.setCustomValidity(dateField.value && dateField.value<dateField.min?'Please choose today or a future event date.':'');
    if(messageField)messageField.setCustomValidity(/\p{L}/u.test(messageField.value.trim())?'':'Please include a few words so we can help with your inquiry.');
  }
  if(dateField)dateField.addEventListener('input',validateFields);
  if(messageField)messageField.addEventListener('input',validateFields);

  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy)return;
    validateFields();
    if(!form.reportValidity())return;
    const fields=new FormData(form);
    const body={name:fields.get('contact_name'),email:fields.get('contact_email'),phone:fields.get('contact_phone'),message:fields.get('contact_message'),event_date:fields.get('event_date'),city:fields.get('event_city'),subject:fields.get('contact_subject'),rental:fields.get('contact_rental'),preferred_contact:fields.get('preferred_contact'),website:fields.get('website')};
    const serialized=JSON.stringify(body);
    if(serialized!==lastPayload || !requestId){requestId=crypto.randomUUID();lastPayload=serialized;}
    busy=true;submit.disabled=true;status.textContent='Sending your message…';
    try{
      const response=await fetch('https://tuttkwpnicgfcyeptrkv.supabase.co/functions/v1/contact-inquiry',{method:'POST',headers:{apikey:'sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1','Content-Type':'application/json'},body:JSON.stringify({...body,request_id:requestId})});
      const result=await response.json();
      if(!response.ok || !result.success)throw new Error(result.error || 'Your message could not be sent. Please call 571-719-9575.');
      status.textContent='Thank you! Your message has been sent. We’ll contact you shortly.';form.reset();requestId='';lastPayload='';
    }catch(error){status.textContent=error.message || 'Your message could not be sent. Please call 571-719-9575.';}
    finally{busy=false;submit.disabled=false;}
  });
})();
