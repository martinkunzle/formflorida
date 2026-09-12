# Form Florida — Final Production Website

This package contains the bilingual Form Florida LLC production site, guided Florida LLC formation questionnaire, Stripe Checkout integration, optional Annual Compliance Plan billed each January 1, and automatic internal order/subscription email notifications to **support@formflorida.com**.

## What the order emails include

After Stripe confirms checkout, Form Florida receives an email containing the Stripe IDs, payment status, amount charged, customer contact information, proposed LLC name, backup name, principal/mailing addresses, registered-agent details and acceptance signature, management structure, authorized representative information, company type/purpose, effective-date choice, requested state documents, package/service/government fee breakdown, annual-plan selection, filer signature, and authorization acknowledgments. **Card numbers, bank numbers, SSNs, ITINs and passwords are never emailed or collected by the questionnaire.**

Additional automatic emails are sent when an annual subscription invoice is paid, an annual payment fails, or an Annual Compliance Plan is canceled. Stripe retries the webhook when the email provider fails. Resend requests use the Stripe event ID as an idempotency key to reduce duplicate notifications.

## 1. Install and deploy

```bash
npm install
npx wrangler login
npx wrangler secret put STRIPE_SECRET_KEY
npx wrangler secret put STRIPE_WEBHOOK_SECRET
npx wrangler secret put RESEND_API_KEY
npm run deploy
```

Use a Stripe test secret (`sk_test_...`) while testing. Use the webhook signing secret (`whsec_...`) from the Stripe webhook endpoint described below.

## 2. Connect FormFlorida.com

Attach `formflorida.com` (and optionally `www.formflorida.com`) to the deployed `formflorida` Worker in Cloudflare. Keep the site publicly accessible for Stripe review.

## 3. Set up support@formflorida.com

Create or route **support@formflorida.com** to a mailbox you monitor. Cloudflare Email Routing can forward incoming messages if you do not use a hosted mailbox.

## 4. Set up outbound order emails with Resend

1. Create a Resend account.
2. Add and verify `formflorida.com` in Resend.
3. Add the DNS records Resend provides (SPF/DKIM/DMARC) in Cloudflare DNS.
4. Create a Resend API key.
5. Run `npx wrangler secret put RESEND_API_KEY` and paste that key.
6. The default sender is `Form Florida Orders <orders@formflorida.com>` and the destination is `support@formflorida.com`.

You can override those defaults using Worker variables:

- `ORDER_NOTIFICATION_EMAIL=support@formflorida.com`
- `ORDER_EMAIL_FROM=Form Florida Orders <orders@formflorida.com>`

## 5. Create the Stripe webhook

In Stripe Dashboard, create a webhook endpoint pointing to:

`https://formflorida.com/api/stripe-webhook`

Subscribe the endpoint to these events:

- `checkout.session.completed`
- `invoice.paid`
- `invoice.payment_failed`
- `customer.subscription.deleted`

Copy the endpoint signing secret (`whsec_...`) and save it with:

```bash
npx wrangler secret put STRIPE_WEBHOOK_SECRET
```

Never put the webhook secret, Stripe secret key or Resend API key into public HTML/JavaScript.

## 6. Test before live payments

Visit `/api/health`. It should report Stripe, webhook and order-email configuration as `true`. Then place a Stripe test order. Confirm all of the following:

- payment succeeds in Stripe Test mode;
- the success page loads;
- support@formflorida.com receives a NEW FORM FLORIDA ORDER email;
- the email contains the submitted filing information and fee breakdown;
- if Annual Compliance Plan was checked, the email shows the Stripe subscription ID and January 1 annual billing;
- Stripe Dashboard shows the webhook delivery as HTTP 200.

Then switch to the live Stripe secret and the live webhook endpoint/signing secret.

## Annual Compliance Plan

Current displayed recurring price: **$237.75/year**, composed of **$99 Form Florida service + $138.75 current Florida LLC Annual Report state fee**. The site discloses that government-fee changes can require a future recurring-price adjustment with notice. For a formation customer who opts in, the formation package is charged now and the annual plan is scheduled to bill on January 1, then each January 1 until canceled.

## Operational note

Do not file an annual report merely because an invoice exists. File only after the subscription invoice/payment is confirmed paid and after verifying the company's current filing information. Florida government fees, deadlines and forms can change; review the current official requirements before each filing cycle.


## Favicon
Includes favicon.ico, SVG/PNG favicon assets, Apple touch icon, Android icons, and a web app manifest using the Form Florida green F brand mark.


## Easier customer intake
This version uses dropdown country selection, state/province suggestions, and address-reuse checkboxes. Customers can reuse the principal business address for an individual registered agent when that address is in Florida, and for the authorized representative/manager. Mailing-address reuse remains available as well.

## Final functional safeguards

This build also:
- keeps the contact country, phone calling code, and sample phone number synchronized;
- includes calling-code coverage for every country currently shown in the intake country dropdown;
- sends Spanish customers back to Spanish success/cancel pages;
- collects a payment method when an Annual Compliance Plan begins with a trial before January 1 billing;
- validates on the server that the registered-agent state is Florida;
- keeps English and Spanish progress-step labels localized;
- adds canonical/hreflang metadata and mobile-safe viewport behavior.

Always complete a Stripe **test-mode** order in both English and Spanish before enabling live payments.


## Annual Report questionnaire

The Annual Compliance Plan intake now collects:
Company Name → Contact Email → Principal Address → Mailing Address → EIN/FEI confirmation or update → Registered Agent confirmation or update → Members/Managers/Officers/Directors confirmation or update → Authorized Signer Name → Signer Title → filing authorization → Annual Compliance Plan recurring-payment acceptance → Stripe Checkout.

For privacy, the build does **not** place the actual updated EIN/FEI value into Stripe metadata or automated order-email metadata. If an EIN/FEI update is entered, Stripe metadata records only that an updated value was provided.
