# Launch guide: Monsta Seberang Perai

This guide takes the game from this repository to a live website that earns money from ads and optional purchases.

The game runs without any setup. It saves to the browser, and purchases are simulated on `localhost` / `file://`. Real payments and real ads only switch on after you complete the steps below.

| Part | Service | Status |
|---|---|---|
| Database, cloud saves, payment server | Supabase project `monsta-seberang-perai` (Singapore) | **Done**: tables, security rules and 2 Edge Functions are live |
| Google login | Supabase Auth + a Google Cloud OAuth client | **You**: create the Google client and paste it into Supabase (step 2) |
| Hosting the website | GitHub Pages or Cloudflare Pages (free) | **You**: switch it on (step 1) |
| Payments (RM, FPX, cards) | Stripe Malaysia | **You**: log in, then paste 2 keys into Supabase (step 3) |
| Ads | Google AdSense, H5 Games Ads | **You**: apply once the site is live (step 4) |

Supabase project: <https://supabase.com/dashboard/project/aobpmnuvccntrjfsvxgf>
The project URL and publishable key are already in `js/config.js`. The publishable key is designed to be public; the database is protected by row-level security.

---

## 1. Host the website

**Option A: GitHub Pages.** Open the repository's **Settings → Pages**, set **Source: Deploy from a branch**, and pick the branch (for example `main`) and `/ (root)`. The game appears at `https://fikrizalani96-coder.github.io/penang-monsta/`. Private repositories need a paid GitHub plan for Pages.

**Option B: Cloudflare Pages** (works with private repos on the free plan). Go to <https://dash.cloudflare.com> → **Workers & Pages → Create → Pages → Connect to Git**, pick the repository, leave the build command empty and set the output directory to `/`.

Write down your final address; the next steps use it as `YOUR_SITE`.

## 2. Google login (Supabase Auth)

1. **Create the Google OAuth client.** Go to <https://console.cloud.google.com/auth/branding>, create a project if asked, and fill in the consent screen:
   - App name "Monsta Seberang Perai", your support email.
   - Audience **External**, then **Publish app**.
2. Go to <https://console.cloud.google.com/apis/credentials> → **Create credentials → OAuth client ID** → **Web application**:
   - **Authorized JavaScript origins:** `YOUR_SITE` (origin only, for example `https://fikrizalani96-coder.github.io`).
   - **Authorized redirect URIs:** `https://aobpmnuvccntrjfsvxgf.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.
3. **Paste them into Supabase:** <https://supabase.com/dashboard/project/aobpmnuvccntrjfsvxgf/auth/providers> → **Google** → enable, paste both values, and save.
4. **Allow your site as a return address:** <https://supabase.com/dashboard/project/aobpmnuvccntrjfsvxgf/auth/url-configuration>
   - **Site URL:** `YOUR_SITE`
   - **Redirect URLs:** add `YOUR_SITE` (the full address including the path, for example `https://fikrizalani96-coder.github.io/penang-monsta/`) and `http://localhost:8080/` for testing.
5. Open the game → **MENU → AKAUN → Log masuk dengan Google**. After signing in, **SIMPAN** saves to the cloud as well as the browser, and **Muat dari awan** restores it on another device.

## 3. Stripe (payments in RM)

1. **Log in or sign up:** <https://dashboard.stripe.com/register>. Choose country **Malaysia** and complete business verification (an individual/sole proprietor is fine).
2. **Payment methods:** <https://dashboard.stripe.com/settings/payment_methods>. Enable Cards and **FPX**, plus GrabPay if you want. Checkout shows every enabled method automatically.
3. **Secret key:** <https://dashboard.stripe.com/apikeys>. Copy the **Secret key**. Start with test mode (`sk_test_...`); switch to `sk_live_...` when you're ready to take real money.
4. **Paste it into Supabase:** <https://supabase.com/dashboard/project/aobpmnuvccntrjfsvxgf/functions/secrets> → add a secret named `STRIPE_SECRET_KEY` with that value. It applies immediately.

   That's all. The first time someone opens checkout, the server creates the Stripe webhook itself and keeps its signing secret in a private database table. You don't need to create a webhook in Stripe or copy a `whsec_...` value. (If you prefer to create the webhook by hand, set `STRIPE_WEBHOOK_SECRET` as well and the automatic setup is skipped.)
5. Test: sign in with Google in the game, open **KEDAI PREMIUM**, buy something and pay with test card `4242 4242 4242 4242` (any future date, any CVC). You return to the game, and the item arrives within a few seconds. In Stripe you'll see a webhook named "Monsta Seberang Perai (automatik)".
6. Switching to live mode: replace `STRIPE_SECRET_KEY` with the `sk_live_...` key. The next checkout creates the live webhook automatically.

Until the Stripe secrets are set, the shop tells players "Kedai Premium belum dibuka".

### Prices

Prices are defined in three places that **must match**:

- `js/monetize.js`: what the shop shows.
- `supabase/functions/create-checkout/skus.json` and `supabase/functions/stripe-webhook/skus.json`: what the server actually charges and checks.

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

1. The player taps an item. The game calls the `create-checkout` Edge Function, which requires a Google login.
2. The server looks up the price in `skus.json`, refuses a one-time item the player already owns, and creates a Stripe Checkout session in MYR.
3. The player pays on Stripe's page and returns with `?bayar=berjaya`.
4. Stripe calls `stripe-webhook`. The server verifies the signature and the amount, then records the purchase in the `purchases` table (once per Stripe session, so retries can't double-grant). For one-time items it also updates `entitlements.owned`, and for Buang Iklan it sets `no_ads`.
5. The game checks for unclaimed purchases every few seconds after returning, marks them claimed, and adds the items to the save.

### If you change the database or functions

The SQL is in `supabase/migrations/` and the functions are in `supabase/functions/`. To redeploy with the Supabase CLI: `supabase link --project-ref aobpmnuvccntrjfsvxgf`, then `supabase db push` and `supabase functions deploy create-checkout --no-verify-jwt` / `supabase functions deploy stripe-webhook --no-verify-jwt`. Both functions check the caller themselves: the checkout function verifies the player's login, and the webhook verifies Stripe's signature.

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
- `js/config.js`: `adsenseClient`, `adsTest: false`, `devPurchases: false`.
- `ads.txt`: your publisher ID.

## 6. Custom domain (optional)

Add the domain in GitHub Pages or Cloudflare Pages (for example `monsta.my` from a .my registrar). Then add it to:

- Google OAuth client: authorized JavaScript origins.
- Supabase Auth URL configuration: Site URL and Redirect URLs.
- AdSense sites.

The payment function accepts any return address on the same site that started the checkout, so no extra payment setting is needed.

## Honest notes

- **Revenue isn't guaranteed.** Earnings depend on traffic. Ad rates for Malaysian traffic are low, so ad income stays small until you have thousands of regular players. Purchases usually come from a small share of committed players. Promote the game on TikTok, Facebook groups and school or history communities.
- **Ad removal and items are enforced client-side.** The server is authoritative for *payments* and *ownership*, but the game runs in the browser. A technical user could edit their own save to hide ads or add items. That's normal for web games and doesn't affect other players.
- **Refunds:** refunding "Buang Iklan" in Stripe automatically turns ads back on for that account (the `charge.refunded` webhook).
- **Taxes:** income from ads and sales is taxable. Declare it to LHDN, and check your SST obligations with a tax adviser.
- **Children:** the game suits all ages. The terms ask under-18s to get parental permission before buying.
