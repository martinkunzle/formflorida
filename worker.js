const PACKAGES = {
  essential: { name: 'Form Florida Essential', service: 12400, government: 12500, includesStatus: false, includesCopy: false },
  plus: { name: 'Form Florida Complete', service: 21900, government: 13000, includesStatus: true, includesCopy: false },
  premium: { name: 'Form Florida Premium', service: 33900, government: 16000, includesStatus: true, includesCopy: true }
};

const json = (data, status = 200, extraHeaders = {}) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
    ...extraHeaders
  }
});

const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const yes = (value) => value === true || value === 'on' || value === 'yes' || value === 'true';
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function filingPayload(body) {
  return {
    correspondenceName: clean(body.correspondenceName, 120),
    email: clean(body.email, 180).toLowerCase(),
    phone: clean(body.phone, 60),
    country: clean(body.country, 100),
    companyName: clean(body.companyName, 180),
    alternateCompanyName: clean(body.alternateCompanyName, 180),
    streetAddress: clean(body.streetAddress, 180),
    city: clean(body.city, 100),
    state: clean(body.state, 100),
    postalCode: clean(body.postalCode, 30),
    principalCountry: clean(body.principalCountry, 100),
    mailingStreet: clean(body.mailingStreet, 180),
    mailingCity: clean(body.mailingCity, 100),
    mailingState: clean(body.mailingState, 100),
    mailingPostalCode: clean(body.mailingPostalCode, 30),
    mailingCountry: clean(body.mailingCountry, 100),
    registeredAgentType: clean(body.registeredAgentType, 30),
    registeredAgentName: clean(body.registeredAgentName, 180),
    registeredAgentStreet: clean(body.registeredAgentStreet, 180),
    registeredAgentCity: clean(body.registeredAgentCity, 100),
    registeredAgentState: clean(body.registeredAgentState, 100),
    registeredAgentPostalCode: clean(body.registeredAgentPostalCode, 30),
    registeredAgentSignature: clean(body.registeredAgentSignature, 180),
    managementType: clean(body.managementType, 40),
    representativeTitle: clean(body.representativeTitle, 20),
    representativeName: clean(body.representativeName, 180),
    representativeStreet: clean(body.representativeStreet, 180),
    representativeCity: clean(body.representativeCity, 100),
    representativeState: clean(body.representativeState, 100),
    representativePostalCode: clean(body.representativePostalCode, 30),
    representativeCountry: clean(body.representativeCountry, 100),
    additionalRepresentatives: clean(body.additionalRepresentatives, 480),
    companyType: clean(body.companyType, 30),
    purpose: clean(body.purpose, 300),
    effectiveDateChoice: clean(body.effectiveDateChoice, 30),
    effectiveDate: clean(body.effectiveDate, 20),
    filerSignature: clean(body.filerSignature, 180)
  };
}

function validateFiling(body, f) {
  const required = [
    'correspondenceName','email','phone','country','companyName','streetAddress','city','state','postalCode','principalCountry',
    'registeredAgentType','registeredAgentName','registeredAgentStreet','registeredAgentCity','registeredAgentState','registeredAgentPostalCode',
    'registeredAgentSignature','managementType','representativeTitle','representativeName','representativeStreet','representativeCity',
    'representativeState','representativePostalCode','representativeCountry','companyType','effectiveDateChoice','filerSignature'
  ];
  if (required.some((key) => !f[key])) return 'Please complete all required filing fields.';
  if (!validEmail(f.email)) return 'Please enter a valid email address.';
  if (f.registeredAgentState.toLowerCase() !== 'florida') return 'The registered agent address must be in Florida.';
  if (f.companyType === 'professional' && !f.purpose) return 'A professional purpose is required for a professional LLC.';
  if (f.effectiveDateChoice === 'custom' && !f.effectiveDate) return 'Please enter the requested effective date.';
  if (!yes(body.mailingSame) && (!f.mailingStreet || !f.mailingCity || !f.mailingState || !f.mailingPostalCode || !f.mailingCountry)) {
    return 'Please complete the mailing address or mark it as the same as the principal address.';
  }
  if (!yes(body.registeredAgentConsent) || !yes(body.certify) || !yes(body.publicRecordNotice) || !yes(body.terms)) {
    return 'Please complete the required consent and policy acknowledgments.';
  }
  return null;
}

function buildMetadata(body, f, packageKey, p, service, government, orderId) {
  const wantStatus = yes(body.certificateOfStatus);
  const wantCopy = yes(body.certifiedCopy);
  return {
    order_id: orderId,
    package: packageKey,
    customer_name: f.correspondenceName,
    customer_email: f.email,
    customer_country: f.country,
    proposed_company_name: f.companyName,
    alternate_company_name: f.alternateCompanyName,
    phone: f.phone,
    principal_address: [f.streetAddress, f.city, f.state, f.postalCode, f.principalCountry].join(', '),
    mailing_same: yes(body.mailingSame) ? 'yes' : 'no',
    mailing_address: yes(body.mailingSame)
      ? [f.streetAddress, f.city, f.state, f.postalCode, f.principalCountry].join(', ')
      : [f.mailingStreet, f.mailingCity, f.mailingState, f.mailingPostalCode, f.mailingCountry].filter(Boolean).join(', '),
    registered_agent_type: f.registeredAgentType,
    registered_agent_name: f.registeredAgentName,
    registered_agent_address: [f.registeredAgentStreet, f.registeredAgentCity, f.registeredAgentState, f.registeredAgentPostalCode].join(', '),
    registered_agent_signature: f.registeredAgentSignature,
    management_type: f.managementType,
    authorized_rep_title: f.representativeTitle,
    authorized_rep_name: f.representativeName,
    authorized_rep_address: [f.representativeStreet, f.representativeCity, f.representativeState, f.representativePostalCode, f.representativeCountry].join(', '),
    additional_representatives: f.additionalRepresentatives,
    company_type: f.companyType,
    purpose: f.purpose,
    effective_date_choice: f.effectiveDateChoice,
    effective_date: f.effectiveDate,
    filer_signature: f.filerSignature,
    mailing_same_ack: yes(body.mailingSame) ? 'yes' : 'no',
    registered_agent_consent: yes(body.registeredAgentConsent) ? 'yes' : 'no',
    certify_ack: yes(body.certify) ? 'yes' : 'no',
    public_record_ack: yes(body.publicRecordNotice) ? 'yes' : 'no',
    terms_ack: yes(body.terms) ? 'yes' : 'no',
    certificate_status: (p.includesStatus || wantStatus) ? 'yes' : 'no',
    certified_copy: (p.includesCopy || wantCopy) ? 'yes' : 'no',
    service_fee_cents: String(service),
    government_fee_cents: String(government),
    annual_plan_selected: yes(body.annualPlan) ? 'yes' : 'no'
  };
}


function localePaths(body, origin, successQuery = '') {
  const lang = clean(body?.language, 5).toLowerCase() === 'es' ? 'es' : 'en';
  const base = lang === 'es' ? '/es' : '';
  return {
    success: `${origin}${base}/success.html${successQuery}`,
    cancelFormation: `${origin}${base}/#start`,
    cancelAnnual: `${origin}${base}/#annual-report`
  };
}

async function createCheckout(request, env) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe is not configured yet.' }, 500);
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'Invalid request format.' }, 415);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid checkout request.' }, 400); }

  const packageKey = clean(body.package, 30).toLowerCase();
  const p = PACKAGES[packageKey];
  if (!p) return json({ error: 'Please select a valid package.' }, 400);

  const f = filingPayload(body);
  const validationError = validateFiling(body, f);
  if (validationError) return json({ error: validationError }, 400);

  let service = p.service;
  let government = p.government;
  const wantStatus = yes(body.certificateOfStatus);
  const wantCopy = yes(body.certifiedCopy);
  if (wantStatus && !p.includesStatus) government += 500;
  if (wantCopy && !p.includesCopy) government += 3000;
  const total = service + government;

  const origin = new URL(request.url).origin;
  const paths = localePaths(body, origin, '?session_id={CHECKOUT_SESSION_ID}');
  const annualSelected = yes(body.annualPlan);
  const orderId = `FF-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const params = new URLSearchParams();
  params.set('mode', annualSelected ? 'subscription' : 'payment');
  params.set('customer_email', f.email);
  params.set('success_url', paths.success);
  params.set('cancel_url', paths.cancelFormation);
  params.set('billing_address_collection', 'required');
  params.set('phone_number_collection[enabled]', 'true');
  params.set('submit_type', 'pay');
  params.set('payment_method_types[0]', 'card');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', String(total));
  params.set('line_items[0][price_data][product_data][name]', p.name);
  params.set(
    'line_items[0][price_data][product_data][description]',
    `Form Florida administrative filing service $${(service / 100).toFixed(2)} + Florida government charges $${(government / 100).toFixed(2)}.`
  );

  if (annualSelected) {
    params.set('line_items[1][quantity]', '1');
    params.set('line_items[1][price_data][currency]', 'usd');
    params.set('line_items[1][price_data][unit_amount]', '23775');
    params.set('line_items[1][price_data][recurring][interval]', 'year');
    params.set('line_items[1][price_data][product_data][name]', 'Form Florida Annual Compliance Plan');
    params.set('line_items[1][price_data][product_data][description]', 'Annual subscription: $99 Form Florida service + current $138.75 Florida LLC Annual Report state fee. Renews annually until canceled.');
    const trialEnd = nextJanuaryFirstBillingDate();
    params.set('subscription_data[trial_end]', String(trialEnd));
    params.set('subscription_data[trial_settings][end_behavior][missing_payment_method]', 'cancel');
    params.set('payment_method_collection', 'always');
    params.set('subscription_data[metadata][order_id]', orderId);
    params.set('subscription_data[metadata][company_name]', f.companyName);
    params.set('subscription_data[metadata][service_fee_cents]', '9900');
    params.set('subscription_data[metadata][state_fee_cents]', '13875');
  }

  const metadata = buildMetadata(body, f, packageKey, p, service, government, orderId);
  Object.entries(metadata).forEach(([key, value]) => params.set(`metadata[${key}]`, clean(value, 500)));

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': crypto.randomUUID()
    },
    body: params.toString()
  });
  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    console.error('Stripe Checkout error', JSON.stringify(stripeData));
    return json({ error: stripeData?.error?.message || 'Stripe could not start checkout.' }, 502);
  }
  return json({ url: stripeData.url });
}

function nextJanuaryFirstBillingDate() {
  const now = new Date();
  const nowSec = Math.floor(now.getTime() / 1000);
  const year = now.getUTCFullYear();
  // January 1 at 12:00 PM Eastern Standard Time (17:00 UTC).
  // Stripe Checkout requires a future trial end; if the upcoming Jan 1 is too close
  // to safely establish the subscription, use the following Jan 1 instead.
  let anchor = Math.floor(Date.UTC(year + 1, 0, 1, 17, 0, 0) / 1000);
  const minimumLead = nowSec + 48 * 60 * 60 + 60;
  if (anchor < minimumLead) {
    anchor = Math.floor(Date.UTC(year + 2, 0, 1, 17, 0, 0) / 1000);
  }
  return anchor;
}

async function createAnnualSubscription(request, env) {
  if (!env.STRIPE_SECRET_KEY) return json({ error: 'Stripe is not configured yet.' }, 500);
  if (!(request.headers.get('content-type') || '').includes('application/json')) return json({ error: 'Invalid request format.' }, 415);
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid subscription request.' }, 400); }
  const email = clean(body.email, 180).toLowerCase();
  const companyName = clean(body.companyName, 180);
  const annualPhone = clean(body.annualPhone, 80);
  const principalAddress = clean(body.principalAddress, 500);
  const mailingSame = yes(body.mailingSame);
  const mailingAddress = mailingSame ? principalAddress : clean(body.mailingAddress, 500);
  const einStatus = clean(body.einStatus, 30);
  const einUpdate = clean(body.einUpdate, 40);
  const registeredAgentStatus = clean(body.registeredAgentStatus, 30);
  const registeredAgentName = clean(body.registeredAgentName, 180);
  const registeredAgentAddress = clean(body.registeredAgentAddress, 500);
  const managementStatus = clean(body.managementStatus, 30);
  const managementUpdate = clean(body.managementUpdate, 500);
  const signerName = clean(body.signerName, 180);
  const signerTitle = clean(body.signerTitle, 120);

  if (!validEmail(email) || !companyName || !annualPhone || !principalAddress || !mailingAddress || !einStatus || !registeredAgentStatus || !managementStatus || !signerName || !signerTitle || !yes(body.filingAuthorization) || !yes(body.recurringConsent)) {
    return json({ error: 'Please complete all required Annual Report questionnaire fields and authorizations.' }, 400);
  }
  if (einStatus === 'update' && !einUpdate) return json({ error: 'Please enter the updated EIN / FEI.' }, 400);
  if (registeredAgentStatus === 'update' && (!registeredAgentName || !registeredAgentAddress)) return json({ error: 'Please enter the updated registered-agent name and Florida address.' }, 400);
  if (managementStatus === 'update' && !managementUpdate) return json({ error: 'Please enter the updated members, managers, officers, or directors.' }, 400);

  const origin = new URL(request.url).origin;
  const paths = localePaths(body, origin, '?annual=1&session_id={CHECKOUT_SESSION_ID}');
  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('customer_email', email);
  params.set('success_url', paths.success);
  params.set('cancel_url', paths.cancelAnnual);
  params.set('billing_address_collection', 'required');
  params.set('payment_method_types[0]', 'card');
  params.set('payment_method_collection', 'always');
  params.set('line_items[0][quantity]', '1');
  params.set('line_items[0][price_data][currency]', 'usd');
  params.set('line_items[0][price_data][unit_amount]', '23775');
  params.set('line_items[0][price_data][recurring][interval]', 'year');
  params.set('line_items[0][price_data][product_data][name]', 'Form Florida Annual Compliance Plan');
  params.set('line_items[0][price_data][product_data][description]', 'Annual subscription: $99 Form Florida filing-assistance service + current $138.75 Florida LLC Annual Report state fee. Renews annually until canceled.');
  const orderId = `FF-ANNUAL-${new Date().toISOString().slice(0,10).replaceAll('-', '')}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  params.set('metadata[order_id]', orderId);
  params.set('metadata[order_type]', 'annual_compliance_only');
  params.set('metadata[company_name]', companyName);
  params.set('metadata[contact_phone]', annualPhone);
  params.set('metadata[principal_address]', principalAddress);
  params.set('metadata[mailing_same]', mailingSame ? 'yes' : 'no');
  params.set('metadata[mailing_address]', mailingAddress);
  params.set('metadata[ein_status]', einStatus);
  params.set('metadata[ein_update_provided]', einUpdate ? 'yes' : 'no');
  params.set('metadata[registered_agent_status]', registeredAgentStatus);
  params.set('metadata[registered_agent_name]', registeredAgentName);
  params.set('metadata[registered_agent_address]', registeredAgentAddress);
  params.set('metadata[management_status]', managementStatus);
  params.set('metadata[management_update]', managementUpdate);
  params.set('metadata[authorized_signer_name]', signerName);
  params.set('metadata[signer_title]', signerTitle);
  params.set('metadata[filing_authorization]', 'yes');
  params.set('metadata[form_florida_service_fee_cents]', '9900');
  params.set('metadata[state_fee_cents]', '13875');
  params.set('metadata[recurring_consent]', 'yes');
  params.set('subscription_data[metadata][order_id]', orderId);
  params.set('subscription_data[metadata][company_name]', companyName);
  params.set('subscription_data[metadata][authorized_signer_name]', signerName);
  params.set('subscription_data[metadata][signer_title]', signerTitle);
  params.set('subscription_data[metadata][service_fee_cents]', '9900');
  params.set('subscription_data[metadata][state_fee_cents]', '13875');
  const trialEnd = nextJanuaryFirstBillingDate();
  if (trialEnd) params.set('subscription_data[trial_end]', String(trialEnd));
  params.set('subscription_data[trial_settings][end_behavior][missing_payment_method]', 'cancel');

  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, 'Content-Type': 'application/x-www-form-urlencoded', 'Idempotency-Key': crypto.randomUUID() },
    body: params.toString()
  });
  const stripeData = await stripeResponse.json();
  if (!stripeResponse.ok) {
    console.error('Stripe annual subscription error', JSON.stringify(stripeData));
    return json({ error: stripeData?.error?.message || 'Stripe could not start subscription checkout.' }, 502);
  }
  return json({ url: stripeData.url });
}


const htmlEscape = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const cents = (value) => `$${(Number(value || 0) / 100).toFixed(2)} USD`;

function prettyKey(key) {
  return String(key || '').replaceAll('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function metadataRows(metadata = {}) {
  const preferred = [
    'order_id','package','customer_name','customer_email','phone','customer_country','proposed_company_name','alternate_company_name',
    'contact_phone','principal_address','mailing_same','mailing_address','registered_agent_type','registered_agent_name','registered_agent_address',
    'registered_agent_signature','management_type','authorized_rep_title','authorized_rep_name','authorized_rep_address',
    'additional_representatives','company_type','purpose','effective_date_choice','effective_date','certificate_status','certified_copy',
    'service_fee_cents','government_fee_cents','annual_plan_selected','filer_signature','registered_agent_consent','certify_ack','public_record_ack','terms_ack',
    'principal_address','mailing_same','mailing_address','ein_status','ein_update_provided','registered_agent_status','registered_agent_name','registered_agent_address','management_status','management_update','authorized_signer_name','signer_title','filing_authorization','form_florida_service_fee_cents','state_fee_cents','recurring_consent','order_type'
  ];
  const used = new Set();
  const rows = [];
  for (const key of preferred) {
    if (metadata[key] !== undefined && metadata[key] !== '') {
      let value = metadata[key];
      if (key.endsWith('_cents')) value = cents(value);
      rows.push([prettyKey(key), value]); used.add(key);
    }
  }
  for (const [key, value] of Object.entries(metadata)) {
    if (!used.has(key) && value !== '') rows.push([prettyKey(key), value]);
  }
  return rows;
}

function rowsHtml(rows) {
  return rows.map(([k,v]) => `<tr><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#4b5563;vertical-align:top;width:34%"><strong>${htmlEscape(k)}</strong></td><td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;color:#111827;white-space:pre-wrap">${htmlEscape(v)}</td></tr>`).join('');
}
function rowsText(rows) { return rows.map(([k,v]) => `${k}: ${v}`).join('\n'); }

async function sendSupportEmail(env, { subject, heading, intro, rows, eventId }) {
  if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured.');
  const to = env.ORDER_NOTIFICATION_EMAIL || 'support@formflorida.com';
  const from = env.ORDER_EMAIL_FROM || 'Form Florida Orders <orders@formflorida.com>';
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f6f7f6;padding:24px;color:#111827"><div style="max-width:760px;margin:auto;background:white;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden"><div style="background:#0b5d44;color:white;padding:20px 24px"><div style="font-size:13px;opacity:.9">FORM FLORIDA LLC</div><h1 style="font-size:22px;margin:6px 0 0">${htmlEscape(heading)}</h1></div><div style="padding:22px 24px"><p style="margin-top:0">${htmlEscape(intro || '')}</p><table style="width:100%;border-collapse:collapse;font-size:14px">${rowsHtml(rows)}</table><p style="font-size:12px;color:#6b7280;margin-top:20px">Automated operational notification from FormFlorida.com. Do not reply with card numbers, SSNs, passwords, or bank credentials.</p></div></div></body></html>`;
  const text = `${heading}\n\n${intro || ''}\n\n${rowsText(rows)}\n\nAutomated notification from FormFlorida.com.`;
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      ...(eventId ? {'Idempotency-Key': `stripe-${eventId}`} : {})
    },
    body: JSON.stringify({ from, to: [to], subject, html, text, reply_to: to })
  });
  if (!r.ok) throw new Error(`Email provider error ${r.status}: ${await r.text()}`);
}

function parseStripeSignature(header) {
  const out = { t: null, v1: [] };
  for (const part of String(header || '').split(',')) {
    const [k, v] = part.split('=', 2);
    if (k === 't') out.t = v;
    if (k === 'v1' && v) out.v1.push(v);
  }
  return out;
}

function timingSafeEqualHex(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), {name:'HMAC', hash:'SHA-256'}, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2,'0')).join('');
}

async function verifyStripeWebhook(rawBody, signatureHeader, secret) {
  if (!secret) return false;
  const parsed = parseStripeSignature(signatureHeader);
  if (!parsed.t || !parsed.v1.length) return false;
  const age = Math.abs(Math.floor(Date.now()/1000) - Number(parsed.t));
  if (!Number.isFinite(age) || age > 300) return false;
  const expected = await hmacHex(secret, `${parsed.t}.${rawBody}`);
  return parsed.v1.some(sig => timingSafeEqualHex(sig, expected));
}

async function stripeGet(env, path, params = {}) {
  const qs = new URLSearchParams(params).toString();
  const r = await fetch(`https://api.stripe.com/v1/${path}${qs ? `?${qs}` : ''}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  if (!r.ok) throw new Error(`Stripe retrieval failed ${r.status}`);
  return r.json();
}

async function notifyCheckoutCompleted(env, event) {
  const session = event.data.object;
  const m = session.metadata || {};
  const rows = [
    ['Stripe event', event.id], ['Checkout session', session.id], ['Order ID', m.order_id || '—'],
    ['Payment status', session.payment_status || '—'], ['Amount charged today', cents(session.amount_total)],
    ['Currency', String(session.currency || 'usd').toUpperCase()], ['Customer email', session.customer_details?.email || session.customer_email || m.customer_email || '—'],
    ['Customer billing name', session.customer_details?.name || '—'], ['Customer billing phone', session.customer_details?.phone || m.phone || '—'],
    ['Stripe customer ID', session.customer || '—'], ['Stripe subscription ID', session.subscription || 'None'],
    ['Annual plan', m.annual_plan_selected === 'yes' || m.order_type === 'annual_compliance_only' ? 'YES — $237.75/year; first/next billing January 1' : 'No']
  ];
  rows.push(...metadataRows(m).filter(([k]) => !['Order Id','Customer Email','Phone'].includes(k)));
  await sendSupportEmail(env, {
    subject: `NEW FORM FLORIDA ORDER — ${m.order_id || session.id} — ${m.proposed_company_name || m.company_name || session.customer_details?.name || 'Customer'}`,
    heading: session.payment_status === 'paid' ? 'New paid Form Florida order' : 'New Form Florida checkout completed',
    intro: session.payment_status === 'paid' ? 'Stripe reported a completed paid checkout. The filing/order details are below.' : 'Stripe reported a completed checkout. A future subscription payment may be scheduled; review the payment status below before filing or paying any government fee.',
    rows,
    eventId: event.id
  });
}

async function subscriptionIdFromInvoice(invoice) {
  return invoice.subscription || invoice.parent?.subscription_details?.subscription || null;
}

async function notifyInvoice(env, event, paid) {
  const invoice = event.data.object;
  const subId = await subscriptionIdFromInvoice(invoice);
  let sub = null;
  if (subId && env.STRIPE_SECRET_KEY) {
    try { sub = await stripeGet(env, `subscriptions/${subId}`); } catch (e) { console.error(e); }
  }
  const m = sub?.metadata || {};
  const rows = [
    ['Stripe event', event.id], ['Invoice', invoice.id], ['Status', invoice.status || (paid ? 'paid' : 'payment failed')],
    ['Amount due', cents(invoice.amount_due)], ['Amount paid', cents(invoice.amount_paid)], ['Amount remaining', cents(invoice.amount_remaining)],
    ['Customer email', invoice.customer_email || '—'], ['Stripe customer ID', invoice.customer || '—'], ['Subscription ID', subId || '—'],
    ['Company', m.company_name || '—'], ['Order ID', m.order_id || '—'], ['Invoice URL', invoice.hosted_invoice_url || '—']
  ];
  rows.push(...metadataRows(m).filter(([k]) => !['Company Name','Order Id'].includes(k)));
  await sendSupportEmail(env, {
    subject: `${paid ? 'ANNUAL PAYMENT RECEIVED' : 'ANNUAL PAYMENT FAILED'} — ${m.company_name || invoice.customer_email || invoice.id}`,
    heading: paid ? 'Annual subscription payment received' : 'Annual subscription payment failed',
    intro: paid ? 'Stripe reported a paid subscription invoice.' : 'Stripe could not collect a subscription invoice. Follow up in Stripe before filing any state fee on the customer’s behalf.',
    rows,
    eventId: event.id
  });
}

async function notifySubscriptionCanceled(env, event) {
  const sub = event.data.object;
  const m = sub.metadata || {};
  const rows = [
    ['Stripe event', event.id], ['Subscription ID', sub.id], ['Status', sub.status || 'canceled'], ['Company', m.company_name || '—'],
    ['Order ID', m.order_id || '—'], ['Stripe customer ID', sub.customer || '—'], ['Canceled at', sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : '—']
  ];
  rows.push(...metadataRows(m).filter(([k]) => !['Company Name','Order Id'].includes(k)));
  await sendSupportEmail(env, {
    subject: `ANNUAL PLAN CANCELED — ${m.company_name || sub.id}`,
    heading: 'Annual Compliance Plan canceled',
    intro: 'Stripe reported that this annual subscription was canceled.',
    rows,
    eventId: event.id
  });
}

async function handleStripeWebhook(request, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ error: 'Stripe webhook secret is not configured.' }, 500);
  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');
  if (!await verifyStripeWebhook(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)) return json({ error: 'Invalid webhook signature.' }, 400);
  let event;
  try { event = JSON.parse(rawBody); } catch { return json({ error: 'Invalid webhook payload.' }, 400); }
  try {
    if (event.type === 'checkout.session.completed') await notifyCheckoutCompleted(env, event);
    else if (event.type === 'invoice.paid') await notifyInvoice(env, event, true);
    else if (event.type === 'invoice.payment_failed') await notifyInvoice(env, event, false);
    else if (event.type === 'customer.subscription.deleted') await notifySubscriptionCanceled(env, event);
    return json({ received: true });
  } catch (err) {
    console.error('Webhook notification failed', err?.stack || err);
    return json({ error: 'Notification delivery failed; Stripe should retry this webhook.' }, 500);
  }
}

async function health(env) {
  return json({
    ok: true,
    service: 'Form Florida',
    stripeConfigured: Boolean(env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(env.STRIPE_WEBHOOK_SECRET),
    orderEmailConfigured: Boolean(env.RESEND_API_KEY),
    notificationEmail: env.ORDER_NOTIFICATION_EMAIL || 'support@formflorida.com'
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      if (request.method !== 'GET') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
      return health(env);
    }
    if (url.pathname === '/api/stripe-webhook') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      return handleStripeWebhook(request, env);
    }
    if (url.pathname === '/api/create-annual-subscription') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      return createAnnualSubscription(request, env);
    }
    if (url.pathname === '/api/create-checkout-session') {
      if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
      return createCheckout(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
