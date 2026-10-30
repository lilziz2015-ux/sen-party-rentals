import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const origins = new Set(["https://www.senmoonbounce.com", "https://senmoonbounce.com"]);
const key = "sb_publishable_-I_Yvq8T9nR0rYyS2Gaa8g_oykh__B1";
const serverKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const db = createClient(Deno.env.get("SUPABASE_URL") || "", serverKey, {auth:{persistSession:false,autoRefreshToken:false}});
const hash = async (value:string) => [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(value)))].map(v=>v.toString(16).padStart(2,"0")).join("");
const clean = (value:unknown,max:number) => String(value ?? "").trim().slice(0,max);

function businessDateToday():string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone:"America/New_York",
    year:"numeric",
    month:"2-digit",
    day:"2-digit"
  }).formatToParts(new Date());
  const part = (type:string) => parts.find(item => item.type === type)?.value || "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function isValidEventDate(value:string):boolean {
  if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime())
    && parsed.toISOString().slice(0,10) === value
    && value >= businessDateToday();
}

Deno.serve(async (request:Request) => {
  const origin = request.headers.get("Origin") || "";
  const headers = {"Access-Control-Allow-Origin":origins.has(origin)?origin:"https://www.senmoonbounce.com", "Vary":"Origin", "Access-Control-Allow-Headers":"apikey, content-type", "Access-Control-Allow-Methods":"POST, GET, OPTIONS", "Content-Type":"application/json", "Cache-Control":"no-store"};
  const reply = (body:unknown,status=200) => new Response(JSON.stringify(body),{status,headers});
  if (request.method === "OPTIONS") return reply({ok:true});
  if (request.method === "GET") return reply({ready:Boolean(Deno.env.get("RESEND_API_KEY") && Deno.env.get("FROM_EMAIL"))});
  if (request.method !== "POST") return reply({error:"Method not allowed"},405);
  // This is an anonymous inquiry endpoint, not a customer-account endpoint.
  // Authenticate the website's publishable API key; never accept a caller-selected recipient.
  if (!origins.has(origin) || request.headers.get("apikey") !== key) return reply({error:"Website request required"},403);
  if (Number(request.headers.get("content-length") || 0)>24000) return reply({error:"Message is too long"},413);
  try {
    const raw = await request.text();
    if (raw.length>12000) return reply({error:"Message is too long"},413);
    const body = JSON.parse(raw);
    if (body.website) return reply({success:true});
    const name=clean(body.name,120), email=clean(body.email,254).toLowerCase(), phone=clean(body.phone,40), message=clean(body.message,5000);
    const rawEventDate=body.event_date == null ? "" : typeof body.event_date === "string" ? body.event_date.trim() : "__invalid__";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.request_id || "") || !name || !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email) || /[\\r\\n]/.test(email) || message.length<10 || !/\\p{L}/u.test(message)) return reply({error:"Please enter your name, a valid email and a message of at least 10 characters that includes words."},400);
    if (rawEventDate && !isValidEventDate(rawEventDate)) return reply({error:"Please choose today or a future event date."},400);
    const details={subject:clean(body.subject,120),event_date:rawEventDate,city:clean(body.city,100),rental:clean(body.rental,120),preferred_contact:clean(body.preferred_contact,20)};
    const ip=request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "unknown").split(",").pop()!.trim();
    const [requesterHash,emailHash,payloadHash]=await Promise.all([hash(serverKey+ip),hash(serverKey+email),hash(JSON.stringify({name,email,phone,message,details}))]);
    const {data,error}=await db.rpc("reserve_contact_inquiry",{p_id:body.request_id,p_requester_hash:requesterHash,p_email_hash:emailHash,p_payload_hash:payloadHash,p_name:name,p_email:email,p_phone:phone,p_message:message,p_details:details});
    if (error) return reply({error:error.message.includes("rate limit")?"Too many messages. Please call 571-719-9575 for help.":"Your message could not be saved. Please call 571-719-9575."},error.message.includes("rate limit")?429:400);
    if (data?.status === "SENT") return reply({success:true,reference:data.id});
    const apiKey=Deno.env.get("RESEND_API_KEY"),from=Deno.env.get("FROM_EMAIL");
    if (!apiKey || !from) throw new Error("Email service unavailable");
    const result=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${apiKey}`,"Content-Type":"application/json","Idempotency-Key":`contact-${data.id}`},body:JSON.stringify({from,to:["senmoonbounce@gmail.com"],reply_to:email,subject:`Website inquiry: ${details.subject || "Party rental"}`,text:`Name: ${name}\\nEmail: ${email}\\nPhone: ${phone}\\nPreferred contact: ${details.preferred_contact}\\nEvent date: ${details.event_date}\\nCity: ${details.city}\\nRental: ${details.rental}\\n\\n${message}\\n\\nInquiry: ${data.id}`})});
    if (!result.ok) {
      await db.from("contact_inquiries").update({status:"FAILED"}).eq("id",data.id);
      throw new Error("Email provider unavailable");
    }
    const sent=await result.json();
    const {error:logError}=await db.from("contact_inquiries").update({status:"SENT",provider_message_id:sent.id,sent_at:new Date().toISOString()}).eq("id",data.id);
    if (logError) console.error("Inquiry email accepted; status logging failed",data.id);
    return reply({success:true,reference:data.id});
  } catch(error) {
    if (error instanceof SyntaxError) return reply({error:"Invalid message format"},400);
    console.error("Contact inquiry could not be delivered");
    return reply({error:"Your message could not be emailed right now. Please try again or call 571-719-9575."},503);
  }
});
