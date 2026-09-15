# Form Florida Mobile

Expo/React Native app for iOS and Android. It reuses the production FormFlorida.com questionnaires and Cloudflare Worker APIs, preserving the existing Stripe and Resend order workflow.

## Test locally

Install Expo Go on the phone, then run:

```bash
cd mobile
npm install
npx expo start
```

For safe payment testing, copy `.env.example` to `.env.local` and set
`EXPO_PUBLIC_FORMFLORIDA_URL` to a separate Cloudflare test Worker that uses
Stripe test-mode secrets. Do not replace the live site's Stripe key just to test
the app.

Scan the QR code. On iPhone use Camera; on Android use Expo Go's scanner.

Test all of these before launch:

1. Home, packages, support links, and English/Spanish switching.
2. Every formation step with valid information.
3. Back navigation without losing answers.
4. Close and reopen the app; confirm the draft remains.
5. Confirm invalid email and non-Florida registered-agent addresses are rejected.
6. Check Essential ($249), Complete ($349), and Premium ($499), including optional documents.
7. Test the Annual Compliance Plan ($237.75/year) with formation and by itself.
8. In Stripe test mode, pay with `4242 4242 4242 4242`, any future expiry, any CVC, and any U.S. ZIP.
9. Confirm the native success screen and order email to support@formflorida.com.
10. Test cancel/back from Stripe and retry after a declined test card.
11. Repeat formation and annual-plan checkout in Spanish.
12. Test on a physical iPhone, physical Android phone, small screen, and tablet.

Never use a real card while the Worker has a Stripe test key.

## Create store builds

1. Create an Expo account and run `npm install -g eas-cli`.
2. Run `eas login` and `eas init` from this folder.
3. Run `eas build --platform all --profile production`.
4. Test the Android build and iOS build in TestFlight.
5. Submit with `eas submit --platform ios --profile production` and `eas submit --platform android --profile production`.

## Store information

- Name: Form Florida
- Category: Business
- Support URL: https://formflorida.com/#contact
- Marketing URL: https://formflorida.com
- Privacy URL: https://formflorida.com/privacy.html
- Bundle ID / package: `com.formflorida.app`
- Reviewer note: Form Florida sells real-world Florida filing-preparation and submission services. Payments use Stripe-hosted Checkout. Form Florida is not a government agency or law firm.

Before submission, provide final 1024x1024 artwork without transparency, required phone/tablet screenshots, an Apple Developer account, a Google Play Console account, and completed privacy/data-safety disclosures.
