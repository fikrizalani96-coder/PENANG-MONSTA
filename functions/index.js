'use strict';
// ===== Pelayan pembayaran Monsta Seberang Perai (Firebase Cloud Functions v2 + Stripe) =====
// createCheckout : dipanggil oleh permainan (pemain mesti log masuk Google) -> pautan Stripe Checkout
// stripeWebhook  : dipanggil oleh Stripe selepas bayaran berjaya -> rekod pembelian dalam Firestore
// Harga ditentukan DI SINI (skus.json), bukan oleh pelayar, supaya tidak boleh diubah oleh pemain.
const { onCall, onRequest, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret, defineString } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');
const admin = require('firebase-admin');
const Stripe = require('stripe');
const SKUS = require('./skus.json');

admin.initializeApp();
const db = admin.firestore();

const REGION = 'asia-southeast1';
const STRIPE_SECRET = defineSecret('STRIPE_SECRET');
const STRIPE_WEBHOOK_SECRET = defineSecret('STRIPE_WEBHOOK_SECRET');
// Domain tambahan yang dibenarkan sebagai URL kembali, dipisah koma. Contoh: "https://monsta.my,https://www.monsta.my"
const EXTRA_ORIGINS = defineString('ALLOWED_ORIGINS', { default: '' });

function allowedOrigins() {
  const pid = process.env.GCLOUD_PROJECT || (JSON.parse(process.env.FIREBASE_CONFIG || '{}').projectId);
  const list = [`https://${pid}.web.app`, `https://${pid}.firebaseapp.com`];
  for (const o of EXTRA_ORIGINS.value().split(',')) if (o.trim()) list.push(o.trim().replace(/\/$/, ''));
  return list;
}

exports.createCheckout = onCall({ region: REGION, secrets: [STRIPE_SECRET] }, async req => {
  if (!req.auth) throw new HttpsError('unauthenticated', 'Sila log masuk dengan Google dahulu.');
  const uid = req.auth.uid;
  const { sku, returnUrl } = req.data || {};
  const item = SKUS[sku];
  if (!item) throw new HttpsError('invalid-argument', 'Item tidak wujud.');
  let base;
  try {
    const u = new URL(String(returnUrl));
    if (!allowedOrigins().includes(u.origin)) throw new Error('origin');
    base = u.origin + u.pathname;
  } catch (e) { throw new HttpsError('invalid-argument', 'URL kembali tidak dibenarkan.'); }
  if (item.once) {
    const snap = await db.doc(`users/${uid}`).get();
    const owned = (snap.exists && snap.data().owned) || {};
    if (owned[sku]) throw new HttpsError('already-exists', 'Kamu sudah memiliki item ini.');
  }
  const stripe = new Stripe(STRIPE_SECRET.value());
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'myr', unit_amount: item.sen, product_data: { name: `Monsta Seberang Perai: ${item.name}` } } }],
    client_reference_id: uid,
    customer_email: req.auth.token.email || undefined,
    metadata: { uid, sku },
    payment_intent_data: { metadata: { uid, sku } },
    success_url: `${base}?bayar=berjaya&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}?bayar=batal`,
    locale: 'auto',
  });
  return { url: session.url };
});

async function fulfil(session) {
  const { uid, sku } = session.metadata || {};
  const item = SKUS[sku];
  if (!uid || !item) { logger.error('Sesi tanpa metadata sah', session.id); return; }
  if (session.payment_status !== 'paid') { logger.info('Belum dibayar', session.id, session.payment_status); return; }
  if (session.amount_total !== item.sen || String(session.currency).toLowerCase() !== 'myr') { logger.error('Jumlah tidak sepadan', session.id, session.amount_total, item.sen); return; }
  const pref = db.doc(`users/${uid}/purchases/${session.id}`);
  const uref = db.doc(`users/${uid}`);
  await db.runTransaction(async t => {
    const p = await t.get(pref);
    if (p.exists) return; // sudah direkod (idempoten)
    t.set(pref, { sku, sen: item.sen, createdAt: admin.firestore.FieldValue.serverTimestamp(), claimed: false });
    const upd = { updatedAt: admin.firestore.FieldValue.serverTimestamp() };
    if (item.once) upd.owned = { [sku]: true };
    if (sku === 'buang_iklan') upd.noAds = true;
    t.set(uref, upd, { merge: true });
  });
  logger.info('Pembelian direkod', uid, sku, session.id);
}

exports.stripeWebhook = onRequest({ region: REGION, secrets: [STRIPE_SECRET, STRIPE_WEBHOOK_SECRET] }, async (req, res) => {
  const stripe = new Stripe(STRIPE_SECRET.value());
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.rawBody, req.headers['stripe-signature'], STRIPE_WEBHOOK_SECRET.value());
  } catch (e) {
    logger.warn('Tandatangan webhook tidak sah', e.message);
    res.status(400).send('Tandatangan tidak sah'); return;
  }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') await fulfil(event.data.object);
    if (event.type === 'charge.refunded') {
      // Bayaran balik "Buang Iklan": kembalikan iklan untuk akaun tersebut.
      const ch = event.data.object;
      const pi = ch.payment_intent ? await stripe.paymentIntents.retrieve(ch.payment_intent) : null;
      const md = (pi && pi.metadata) || ch.metadata || {};
      if (ch.refunded && md.uid && md.sku === 'buang_iklan') await db.doc(`users/${md.uid}`).set({ noAds: false, owned: { buang_iklan: false } }, { merge: true });
    }
    res.json({ received: true });
  } catch (e) {
    logger.error(e);
    res.status(500).send('Ralat pelayan');
  }
});
