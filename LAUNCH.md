# Launch guide: Monsta Seberang Perai

This guide takes the game from this repository to a live website that earns money from ads and optional purchases.

The game runs without any setup. It saves to the browser, and purchases are simulated on `localhost` / `file://`. Google login, cloud saves, real payments and real ads only switch on after you complete the steps below.

| Part | Service | Cost to start |
|---|---|---|
| Hosting + Google login + cloud saves | Firebase (Hosting, Authentication, Firestore) | Free tier (Spark), but Functions needs the Blaze pay-as-you-go plan |
| Payments (RM, FPX, cards) | Stripe Malaysia + 2 Cloud Functions | No monthly fee; Stripe takes a fee per transaction |
| Ads | Google AdSense, H5 Games Ads (Ad Placement API) | Free; needs approval |

---

## 1. Firebase project

1. Go to <https://console.firebase.google.com>, then **Add project** (for example `monsta-seberang-perai`).
2. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
3. **Authentication → Settings → Authorized domains:** add your custom domain if you use one. `*.web.app` and `*.firebaseapp.com` are already there.
4. **Build → Firestore Database → Create database**, in production mode. Choose region `asia-southeast1` (Singapore).
5. **Project settings → General → Your apps → Web app (</>)**. Register it and copy the `firebaseConfig` object.
6. Paste that object into `js/config.js` as `firebase: { ... }`. These values are public identifiers, not secrets.
7. Upgrade the project to the **Blaze** plan (Cloud Functions requires it). Set a budget alert, for example RM20/month, under Google Cloud Billing.

## 2. Deploy hosting, rules and functions

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # pick your project
cd functions && npm install && cd ..
firebase deploy --only hosting,firestore:rules
```

Your game is now live at `https://<project-id>.web.app`.

## 3. Stripe (payments in RM)

1. Create an account at <https://dashboard.stripe.com> with country **Malaysia**, and complete business verification. An individual/sole proprietor is fine.
2. **Settings → Payment methods:** enable Cards, **FPX**, and GrabPay if you want. Checkout shows every enabled method automatically.
3. Store your secret key in Firebase Secret Manager. Use a `sk_test_...` key first, then `sk_live_...` when ready:
   ```bash
   firebase functions:secrets:set STRIPE_SECRET
   ```
4. Deploy the functions once, so the webhook URL exists:
   ```bash
   firebase deploy --only functions
   ```
   Note the `stripeWebhook` URL it prints, for example `https://asia-southeast1-<project-id>.cloudfunctions.net/stripeWebhook`.
5. In Stripe, go to **Developers → Webhooks → Add endpoint**:
   - URL: the `stripeWebhook` URL from step 4.
   - Events: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`.
   - Copy the **Signing secret** (`whsec_...`).
6. Store the signing secret and redeploy:
   ```bash
   firebase functions:secrets:set STRIPE_WEBHOOK_SECRET
   firebase deploy --only functions
   ```
7. If you use a custom domain, allow it as a checkout return URL:
   ```bash
   # functions/.env
   ALLOWED_ORIGINS=https://monsta.my,https://www.monsta.my
   ```
8. Set `devPurchases: false` in `js/config.js` for production. It only works on localhost anyway.
9. Test with a test key and card `4242 4242 4242 4242`. The item should appear in-game within a few seconds of returning from Stripe.

### Prices

Prices are defined in two places that **must match**:

- `js/monetize.js`: what the shop shows.
- `functions/skus.json`: what the server actually charges.

`node tools/validate.js` fails if they differ, or if any item other than "Buang Iklan" reaches RM10.

| Item | Price |
|---|---|
| Buang Iklan Selamanya (one-time, permanent on the Google account) | RM29.90 |
| Pek 10 Bola Hebat | RM2.90 |
| 20,000 Kupang | RM2.90 |
| Pek Rawatan · Set Batu Evolusi | RM3.90 |
| Kostum (Baju Melayu Emas / Kebaya Merah / Jersi Harimau), each one-time | RM3.90 |
| Pek 10 Bola Ultra · Penggalak EXP ×2 (2 h) | RM4.90 |
| 5 Gula Ajaib | RM5.90 |
| Bola Sakti | RM6.90 |

### How a purchase flows

1. The player taps an item. The game calls the `createCheckout` function, which requires a Google login.
2. The server looks up the price in `skus.json`, refuses a one-time item the player already owns, and creates a Stripe Checkout session in MYR.
3. The player pays on Stripe's page and returns with `?bayar=berjaya`.
4. Stripe calls `stripeWebhook`. The server verifies the signature and the amount, then writes `users/{uid}/purchases/{sessionId}` with `claimed: false`. For one-time items it also sets `users/{uid}.owned`, and for Buang Iklan it sets `noAds: true`.
5. The game, listening on Firestore, sees the unclaimed purchase, marks it claimed, and adds the items to the save.

## 4. Google AdSense (H5 Games Ads)

1. Apply at <https://www.google.com/adsense> with your live domain. The site must be live, with `privasi.html` and `terma.html` reachable. Both are included and linked from the shop.
2. Request access to **H5 Games Ads** (Ad Placement API) for games. Approval can take days to weeks.
3. Once approved:
   - Put your publisher ID in `js/config.js`: `adsenseClient: 'ca-pub-XXXXXXXXXXXXXXXX'`.
   - Keep `adsTest: true` while checking that ads appear, then set it to `false`.
   - Edit `ads.txt`: uncomment the line and insert your `pub-` ID.
4. In AdSense, set up the consent message (**Privacy & messaging**) for EEA/UK visitors if you get traffic from there.

### Where ads appear

| Type | When | Rules |
|---|---|---|
| Interstitial (`next`) | Moving between areas; after a blackout | Never in the first 10 minutes of play; at least 4 minutes apart (`interstitialMinGap`) |
| Rewarded (`reward`) | Klinik nurse: "watch an ad for 3 Bola Hebat" (every 15 min); after a blackout: "watch an ad to keep your Kupang" | Always optional |

Players who bought **Buang Iklan** see no interstitials, and rewarded bonuses are given without an ad.

## 5. Update the placeholders

- `privasi.html` and `terma.html`: replace `sokongan@contoh.my` with your real support email, and review the text.
- `js/config.js`: `firebase`, `adsenseClient`, `adsTest: false`, `devPurchases: false`.
- `ads.txt`: your publisher ID.

## 6. Custom domain (optional)

**Firebase Hosting → Add custom domain** (for example `monsta.my` from a .my registrar). Then add it to:

- Authentication authorized domains.
- `ALLOWED_ORIGINS` in `functions/.env`.
- AdSense sites.

## Honest notes

- **Revenue isn't guaranteed.** Earnings depend on traffic. Ad rates for Malaysian traffic are low, so ad income stays small until you have thousands of regular players. Purchases usually come from a small share of committed players. Promote the game on TikTok, Facebook groups and school or history communities.
- **Ad removal and items are enforced client-side.** The server is authoritative for *payments* and *ownership*, but the game runs in the browser. A technical user could edit their own save to hide ads or add items. That's normal for web games and doesn't affect other players.
- **Refunds:** refunding "Buang Iklan" in Stripe automatically turns ads back on for that account (the `charge.refunded` webhook).
- **Taxes:** income from ads and sales is taxable. Declare it to LHDN, and check your SST obligations with a tax adviser.
- **Children:** the game suits all ages. The terms ask under-18s to get parental permission before buying.
