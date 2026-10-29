(() => {
  'use strict';
  const date = document.getElementById('availabilityDate');
  const grid = document.getElementById('availabilityGrid');
  const message = document.getElementById('selectedDateMessage');
  const empty = document.getElementById('availabilityEmpty');
  const buttons = [...document.querySelectorAll('.calendar-filter')];
  if (!date || !grid || !window.SenCatalog) return;
  const money = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2});
  const escape = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today = new Date(); today.setMinutes(today.getMinutes()-today.getTimezoneOffset());
  date.min = today.toISOString().slice(0,10);
  const requested = new URL(location.href).searchParams.get('date');
  if (/^\d{4}-\d{2}-\d{2}$/.test(requested || '') && requested >= date.min) date.value = requested;
  let inventory=[], availability=new Map(), category='all', generation=0, failed=false;
  const group = item => {
    const name = String(item.name).toLowerCase();
    if (/obstacle|backyard extreme/.test(name)) return 'obstacle-course';
    if (/combo/.test(name)) return 'combo';
    if (/slide|dino splash|wild rapid|tropical thunder/.test(name)) return 'water-slide';
    if (/moonbounce|moon bounce|castle|basketball hoop/.test(name)) return 'bounce-house';
    return 'party-extra';
  };
  function render() {
    const items=inventory.filter(item=>category==='all'||group(item)===category);
    empty.hidden=items.length>0 || failed;
    grid.innerHTML=items.map(item=>{
      const row=availability.get(String(item.id));
      const checked=Boolean(date.value && row && !failed);
      const available=checked && Number(row.quantity_available)>0;
      const status=failed?'Check by phone':!date.value?'Choose a date':!row?'Check by phone':available?'Available':'Unavailable';
      const image=window.SenCatalog.imageURL(item.image_url);
      const link='./booking.html?'+new URLSearchParams({add:item.id,...(date.value?{date:date.value}:{})});
      return `<article class="availability-card"><div class="availability-card-image">${image?`<img src="${escape(image)}" alt="${escape(item.name)} rental" width="800" height="600" loading="lazy">`:''}<span class="availability-status ${available?'available':'unavailable'}">${status}</span></div><div class="availability-card-body"><h3>${escape(item.name)}</h3><p class="availability-card-details">${escape(item.dimensions || '')}<br>${money.format(Number(item.price))} per day</p><div class="availability-card-actions">${checked&&!available?'<span>Not available on this date</span>':`<a class="calendar-book-button" href="${escape(link)}">${available?'Request booking':'Check availability'}</a>`}<a class="calendar-view-button" href="${escape(window.SenCatalog.detailPage(item))}">View details</a></div></div></article>`;
    }).join('');
  }
  async function refresh() {
    const current=++generation;failed=false;availability.clear();
    message.textContent=date.value?'Checking live availability…':'Choose your event date to check live availability.';
    render();
    if (!date.value) return;
    try {
      const rows=await window.SenCatalog.availability(date.value);
      if(current!==generation)return;
      availability=new Map(rows.map(row=>[String(row.rental_item_id),row]));
      message.textContent='Live availability for '+date.value+'. Your reservation is confirmed by our team.';
    } catch(error) {
      if(current!==generation)return;
      failed=true;message.textContent=error.message;
    }
    render();
  }
  buttons.forEach(button=>button.addEventListener('click',()=>{
    category=button.dataset.filter || button.dataset.category || 'all';
    buttons.forEach(b=>{const selected=b===button;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected));});
    render();
  }));
  date.addEventListener('change',()=>{
    const url=new URL(location.href);date.value?url.searchParams.set('date',date.value):url.searchParams.delete('date');history.replaceState({},'',url);refresh();
  });
  grid.innerHTML='';message.textContent='Loading current rentals…';
  window.SenCatalog.load().then(items=>{inventory=items;refresh();}).catch(error=>{failed=true;grid.innerHTML='';empty.hidden=true;message.textContent=error.message+' Call 571-719-9575 for assistance.';});
})();
