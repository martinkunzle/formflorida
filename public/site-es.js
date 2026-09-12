
(()=>{
const form=document.getElementById('checkout-form'); if(!form) return;
const steps=[...document.querySelectorAll('.form-step')]; let current=0;
const label=document.getElementById('step-label'), nameEl=document.getElementById('step-name'), bar=document.getElementById('progress-bar');
const back=document.getElementById('back-button'), next=document.getElementById('next-button'), checkout=document.getElementById('checkout-button'), msg=document.getElementById('msg');
const packageSelect=document.getElementById('package'), cards=[...document.querySelectorAll('[data-package-card]')], annualPlan=document.getElementById('annualPlan');
const packageData={essential:{label:'Esencial',base:249,service:124,gov:125,includesStatus:false,includesCopy:false},plus:{label:'Completo',base:349,service:219,gov:130,includesStatus:true,includesCopy:false},premium:{label:'Premium',base:499,service:339,gov:160,includesStatus:true,includesCopy:true}};
const money=n=>'$'+Number(n).toFixed(2);

function ffScrollFormIntoView(){
  if(window.matchMedia('(max-width: 640px)').matches){
    document.querySelector('.form-shell')?.scrollIntoView({behavior:'smooth',block:'start'});
  }
}

function showStep(i){current=Math.max(0,Math.min(steps.length-1,i));steps.forEach((s,idx)=>s.classList.toggle('active',idx===current));label.textContent=`Paso ${current+1} de ${steps.length}`;nameEl.textContent=steps[current].dataset.name;bar.style.width=`${((current+1)/steps.length)*100}%`;back.hidden=current===0;next.hidden=current===steps.length-1;checkout.hidden=current!==steps.length-1;if(current===steps.length-1) renderReview();steps[current].querySelector('input,select,textarea')?.focus({preventScroll:true});}
function fieldsInStep(){return [...steps[current].querySelectorAll('input,select,textarea')].filter(el=>!el.disabled && !el.closest('[hidden]'));}
function validateCurrent(){msg.style.display='none';for(const el of fieldsInStep()){if(!el.checkValidity()){el.reportValidity();return false;}}return true;}
next.addEventListener('click',()=>{if(validateCurrent()){showStep(current+1);document.querySelector('.form-shell').scrollIntoView({behavior:'smooth',block:'start'});}});back.addEventListener('click',()=>{showStep(current-1);document.querySelector('.form-shell').scrollIntoView({behavior:'smooth',block:'start'});});
function selectPackage(key,scroll=false){if(!packageData[key])return;packageSelect.value=key;cards.forEach(c=>{const on=c.dataset.packageCard===key;c.classList.toggle('selected',on);c.setAttribute('aria-pressed',on?'true':'false')});updateStateDocs();updateSummary();if(scroll)document.getElementById('start').scrollIntoView({behavior:'smooth'});}
cards.forEach(card=>{card.addEventListener('click',e=>{if(e.target.closest('.choose-package'))return;selectPackage(card.dataset.packageCard)});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPackage(card.dataset.packageCard)}})});document.querySelectorAll('.choose-package').forEach(a=>a.addEventListener('click',()=>selectPackage(a.dataset.package)));packageSelect.addEventListener('change',()=>selectPackage(packageSelect.value));
const mailSame=document.getElementById('mailingSame'),mailFields=document.getElementById('mailing-fields');function toggleMail(){mailFields.hidden=mailSame.checked;mailFields.querySelectorAll('input').forEach(x=>x.required=!mailSame.checked)}mailSame.addEventListener('change',toggleMail);toggleMail();
const companyType=document.getElementById('companyType'),purposeWrap=document.getElementById('purpose-wrap'),purpose=document.getElementById('purpose');function togglePurpose(){const on=companyType.value==='professional';purposeWrap.hidden=!on;purpose.required=on}companyType.addEventListener('change',togglePurpose);togglePurpose();
const dateChoice=document.getElementById('effectiveDateChoice'),dateWrap=document.getElementById('effective-date-wrap'),dateInput=document.getElementById('effectiveDate');function toggleDate(){const on=dateChoice.value==='custom';dateWrap.hidden=!on;dateInput.required=on}dateChoice.addEventListener('change',toggleDate);toggleDate();
const status=document.getElementById('certificateOfStatus'),copy=document.getElementById('certifiedCopy'),statusLabel=document.getElementById('certificate-label'),copyLabel=document.getElementById('certified-label'),docsNote=document.getElementById('included-docs-note');
function updateStateDocs(){const p=packageData[packageSelect.value];status.disabled=p.includesStatus;status.checked=p.includesStatus;copy.disabled=p.includesCopy;copy.checked=p.includesCopy;statusLabel.style.opacity=p.includesStatus?'.55':'1';copyLabel.style.opacity=p.includesCopy?'.55':'1';docsNote.textContent=p.includesCopy?'Premium ya incluye un Certificado de Estado y una copia certificada.':p.includesStatus?'Completo ya incluye un Certificado de Estado de Florida. Podés agregar una copia certificada por $30.':'Esencial incluye la tarifa obligatoria de presentación de $125. Podés agregar documentos estatales opcionales abajo.';}
status.addEventListener('change',updateSummary);copy.addEventListener('change',updateSummary);annualPlan?.addEventListener('change',()=>{updateSummary();if(current===steps.length-1)renderReview();});
function getBreakdown(){const p=packageData[packageSelect.value];let service=p.service,gov=p.gov,extra=0;if(status.checked&&!p.includesStatus){gov+=5;extra+=5}if(copy.checked&&!p.includesCopy){gov+=30;extra+=30}return{p,service,gov,extra,total:service+gov};}
function updateSummary(){const b=getBreakdown();document.getElementById('summary-plan').textContent=b.p.label;document.getElementById('summary-base').textContent=money(b.p.base);document.getElementById('summary-service').textContent=money(b.service);document.getElementById('summary-government').textContent=money(b.gov);document.getElementById('summary-total').textContent=money(b.total)+' USD';const row=document.getElementById('summary-extra-row');row.hidden=!b.extra;document.getElementById('summary-extra').textContent=money(b.extra);const ar=document.getElementById('summary-annual-row');if(ar)ar.hidden=!annualPlan?.checked;}
function v(name){const el=form.elements[name];if(!el)return'—';if(el.type==='checkbox')return el.checked?'Sí':'No';return el.value?.trim()||'—'}
function renderReview(){const b=getBreakdown();const items=[['Contacto',v('correspondenceName')],['Email',v('email')],['LLC propuesta',v('companyName')],['Dirección principal',[v('streetAddress'),v('city'),v('state'),v('postalCode'),v('principalCountry')].filter(x=>x!=='—').join(', ')],['Agente registrado',v('registeredAgentName')],['Administración',v('managementType')],['Representante',v('representativeName')],['Paquete',b.p.label],['Plan anual',annualPlan?.checked?'Sí — $237.75/año desde el 1 de enero':'No'],['A pagar hoy',money(b.total)+' USD']];document.getElementById('review-grid').innerHTML=items.map(([k,val])=>`<div class="review-item"><small>${k}</small><strong>${escapeHtml(val)}</strong></div>`).join('')}
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
form.addEventListener('input',()=>{if(current===steps.length-1)renderReview()});form.addEventListener('change',()=>{if(current===steps.length-1)renderReview()});
form.addEventListener('submit',async e=>{e.preventDefault();if(!validateCurrent())return;checkout.disabled=true;checkout.textContent='Abriendo pago seguro…';msg.style.display='none';try{const payload=Object.fromEntries(new FormData(form).entries());if(payload.phone_country_code&&payload.phone){payload.phone=(payload.phone_country_code+' '+payload.phone).trim();}const response=await fetch('/api/create-checkout-session',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await response.json();if(!response.ok||!data.url)throw new Error(data.error||'No se pudo iniciar el pago.');window.location.assign(data.url)}catch(err){msg.textContent=err.message||'No se pudo iniciar el pago. Intentá de nuevo.';msg.style.display='block';checkout.disabled=false;checkout.textContent='Continuar al pago seguro';}});
const support=document.getElementById('support-form');support?.addEventListener('submit',e=>{e.preventDefault();const n=document.getElementById('support-name').value.trim(),em=document.getElementById('support-email').value.trim(),m=document.getElementById('support-message').value.trim();const subject=encodeURIComponent('Solicitud de soporte de Form Florida');const body=encodeURIComponent(`Name: ${n}\nEmail: ${em}\n\n${m}`);window.location.href=`mailto:support@formflorida.com?subject=${subject}&body=${body}`});

// Customer-friendly address helpers: dropdown countries, region suggestions, and address reuse.
const FF_REGIONS = {"United States": ["Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware", "District of Columbia", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming", "Puerto Rico", "U.S. Virgin Islands"], "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Northwest Territories", "Nova Scotia", "Nunavut", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan", "Yukon"], "Paraguay": ["Alto Paraguay", "Alto Paraná", "Amambay", "Boquerón", "Caaguazú", "Caazapá", "Canindeyú", "Central", "Concepción", "Cordillera", "Guairá", "Itapúa", "Misiones", "Ñeembucú", "Paraguarí", "Presidente Hayes", "San Pedro", "Asunción"], "Argentina": ["Buenos Aires", "Catamarca", "Chaco", "Chubut", "Córdoba", "Corrientes", "Entre Ríos", "Formosa", "Jujuy", "La Pampa", "La Rioja", "Mendoza", "Misiones", "Neuquén", "Río Negro", "Salta", "San Juan", "San Luis", "Santa Cruz", "Santa Fe", "Santiago del Estero", "Tierra del Fuego", "Tucumán", "Ciudad Autónoma de Buenos Aires"], "Brazil": ["Acre", "Alagoas", "Amapá", "Amazonas", "Bahia", "Ceará", "Distrito Federal", "Espírito Santo", "Goiás", "Maranhão", "Mato Grosso", "Mato Grosso do Sul", "Minas Gerais", "Pará", "Paraíba", "Paraná", "Pernambuco", "Piauí", "Rio de Janeiro", "Rio Grande do Norte", "Rio Grande do Sul", "Rondônia", "Roraima", "Santa Catarina", "São Paulo", "Sergipe", "Tocantins"], "Colombia": ["Amazonas", "Antioquia", "Arauca", "Atlántico", "Bogotá D.C.", "Bolívar", "Boyacá", "Caldas", "Caquetá", "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare", "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo", "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima", "Valle del Cauca", "Vaupés", "Vichada"]};
function ffFillRegionList(input){
  if(!input) return;
  const countryName=input.dataset.countrySource;
  const country=form.elements[countryName]?.value || '';
  const dl=document.getElementById(input.getAttribute('list'));
  if(!dl) return;
  const opts=FF_REGIONS[country] || [];
  dl.innerHTML=opts.map(v=>`<option value="${escapeHtml(v)}"></option>`).join('');
}
function ffRefreshRegionLists(){document.querySelectorAll('[data-region-input]').forEach(ffFillRegionList);}
document.querySelectorAll('[data-country-select]').forEach(sel=>sel.addEventListener('change',()=>{ffRefreshRegionLists();
const FF_PHONE_CODES={"United States": "+1", "Canada": "+1", "Puerto Rico": "+1-787", "Mexico": "+52", "Paraguay": "+595", "Argentina": "+54", "Brazil": "+55", "Colombia": "+57", "Chile": "+56", "Uruguay": "+598", "Peru": "+51", "Ecuador": "+593", "Bolivia": "+591", "Venezuela": "+58", "Costa Rica": "+506", "Panama": "+507", "Guatemala": "+502", "Honduras": "+504", "El Salvador": "+503", "Nicaragua": "+505", "Dominican Republic": "+1-809", "United Kingdom": "+44", "Spain": "+34", "Portugal": "+351", "France": "+33", "Germany": "+49", "Italy": "+39", "Switzerland": "+41"};
const FF_PHONE_EXAMPLES={"+1": "305 555 0123", "+54": "11 2345 6789", "+55": "11 91234 5678", "+56": "9 1234 5678", "+57": "300 123 4567", "+51": "912 345 678", "+595": "981 123 456", "+598": "99 123 456", "+52": "55 1234 5678", "+34": "612 345 678", "+44": "7400 123456", "+33": "6 12 34 56 78", "+49": "1512 3456789", "+39": "312 345 6789", "+351": "912 345 678", "+41": "79 123 45 67", "+507": "6123 4567", "+506": "8312 3456", "+593": "99 123 4567", "+591": "71234567", "+58": "412 123 4567", "+502": "5123 4567", "+503": "7123 4567", "+504": "9123 4567", "+505": "8123 4567", "+1-809": "809 555 0123", "+1-787": "787 555 0123"};
const ffPhoneCode=form.elements.phone_country_code,ffCountry=form.elements.country;
function ffSyncPhoneCode(){const c=FF_PHONE_CODES[ffCountry?.value];if(c&&ffPhoneCode)ffPhoneCode.value=c;ffUpdatePhonePlaceholder();}
function ffUpdatePhonePlaceholder(){
  const phoneInput=form.elements.phone;
  const selected=ffPhoneCode?.value;
  if(phoneInput&&selected&&FF_PHONE_EXAMPLES[selected]){
    phoneInput.placeholder=FF_PHONE_EXAMPLES[selected];
  }
}
ffCountry?.addEventListener('change',ffSyncPhoneCode);
ffPhoneCode?.addEventListener('change',ffUpdatePhonePlaceholder);ffSyncPhoneCode();
}));
ffRefreshRegionLists();
function ffPrincipal(){return {street:v('streetAddress')==='—'?'':v('streetAddress'),city:v('city')==='—'?'':v('city'),state:v('state')==='—'?'':v('state'),postal:v('postalCode')==='—'?'':v('postalCode'),country:v('principalCountry')==='—'?'':v('principalCountry')}}
function ffSet(name,value){const el=form.elements[name]; if(el){el.value=value||''; el.dispatchEvent(new Event('change',{bubbles:true}));}}
const agentType=form.elements.registeredAgentType, agentSame=document.getElementById('agentSameBusiness');
function ffAgentVisibility(){if(!agentSame||!agentType)return;const row=agentSame.closest('label');row.hidden=agentType.value!=='individual';if(row.hidden)agentSame.checked=false;}
function ffApplyAgentSame(){if(!agentSame?.checked)return;const a=ffPrincipal();const isFlorida=(a.country==='United States' && a.state.toLowerCase()==='florida');if(!isFlorida){agentSame.checked=false;const note=agentSame.closest('label')?.querySelector('.same-address-note');if(note){note.style.color='#9a3412';note.textContent="La direcci\u00f3n principal del negocio debe ser una direcci\u00f3n f\u00edsica en Florida para usarla como direcci\u00f3n del agente registrado.";}return;}ffSet('registeredAgentStreet',a.street);ffSet('registeredAgentCity',a.city);ffSet('registeredAgentState','Florida');ffSet('registeredAgentPostalCode',a.postal);}
agentType?.addEventListener('change',ffAgentVisibility);agentSame?.addEventListener('change',ffApplyAgentSame);ffAgentVisibility();
const repSame=document.getElementById('representativeSameBusiness');
function ffApplyRepSame(){if(!repSame?.checked)return;const a=ffPrincipal();ffSet('representativeStreet',a.street);ffSet('representativeCity',a.city);ffSet('representativeState',a.state);ffSet('representativePostalCode',a.postal);ffSet('representativeCountry',a.country);ffRefreshRegionLists();}
repSame?.addEventListener('change',ffApplyRepSame);
['streetAddress','city','state','postalCode','principalCountry'].forEach(n=>form.elements[n]?.addEventListener('change',()=>{if(agentSame?.checked)ffApplyAgentSame();if(repSame?.checked)ffApplyRepSame();}));


const ffMobileCta=document.querySelector('.mobile-cta'),ffIntake=document.getElementById('start');
if(ffMobileCta&&ffIntake&&'IntersectionObserver' in window){
  const ffObs=new IntersectionObserver(entries=>{
    ffMobileCta.classList.toggle('is-hidden',entries.some(e=>e.isIntersecting));
  },{threshold:.08});
  ffObs.observe(ffIntake);
}

updateStateDocs();updateSummary();selectPackage(packageSelect.value);showStep(0);
})();

;(()=>{document.querySelectorAll('.annual-subscription-form').forEach(form=>{form.addEventListener('submit',async e=>{e.preventDefault();const btn=form.querySelector('button[type="submit"]'),msg=form.querySelector('.annual-sub-msg');if(!form.reportValidity())return;btn.disabled=true;btn.textContent='Abriendo suscripción segura…';msg.classList.remove('show');try{const payload=Object.fromEntries(new FormData(form).entries());const r=await fetch('/api/create-annual-subscription',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok||!d.url)throw new Error(d.error||'No se pudo iniciar la suscripción.');window.location.assign(d.url)}catch(err){msg.textContent=err.message||'No se pudo iniciar la suscripción.';msg.classList.add('show');btn.disabled=false;btn.textContent='Suscribirme al Plan Anual';}})});})();
