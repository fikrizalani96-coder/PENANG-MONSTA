// Monsta Seberang Perai: webhook Stripe. Sahkan tandatangan, rekod pembelian (idempoten),
// dan kemas kini hak milik (Buang Iklan / kostum). Bayaran balik Buang Iklan mengembalikan iklan.
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import SKUS from './skus.json' with { type: 'json' };

type Sku = { name: string; sen: number; once: boolean };
const skus = SKUS as Record<string, Sku>;

const envKey = (name: string, legacy: string) => {
  try { const k = JSON.parse(Deno.env.get(name) ?? '{}').default; if (k) return k as string; } catch { /* guna kunci lama */ }
  return Deno.env.get(legacy) ?? '';
};
const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req) => {
  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return new Response('Belum dikonfigurasi', { status: 503 });
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, envKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  // rahsia webhook: tetapan manual, atau yang dicipta secara automatik oleh create-checkout
  let whsec = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
  if (!whsec) { const { data } = await admin.rpc('get_app_config', { p_key: 'stripe_webhook_secret' }); whsec = data ?? ''; }
  if (!whsec) return new Response('Webhook belum disediakan', { status: 503 });
  const stripe = new Stripe(secret);
  const sig = req.headers.get('Stripe-Signature') ?? '';
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(raw, sig, whsec, undefined, cryptoProvider);
  } catch (e) {
    console.warn('Tandatangan webhook tidak sah', (e as Error).message);
    return new Response('Tandatangan tidak sah', { status: 400 });
  }
  try {
    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const s = event.data.object as Stripe.Checkout.Session;
      const uid = s.metadata?.uid, sku = s.metadata?.sku ?? '';
      const item = skus[sku];
      if (!uid || !item) { console.error('Metadata tidak sah', s.id); return new Response('ok'); }
      if (s.payment_status !== 'paid') { console.log('Belum dibayar', s.id, s.payment_status); return new Response('ok'); }
      if (s.amount_total !== item.sen || String(s.currency).toLowerCase() !== 'myr') { console.error('Jumlah tidak sepadan', s.id, s.amount_total); return new Response('ok'); }
      const { data, error } = await admin.rpc('record_purchase', { p_id: s.id, p_user: uid, p_sku: sku, p_sen: item.sen, p_once: item.once });
      if (error) throw error;
      console.log(data ? 'Pembelian direkod' : 'Sudah direkod', uid, sku, s.id);
    }
    if (event.type === 'charge.refunded') {
      const ch = event.data.object as Stripe.Charge;
      if (ch.refunded && ch.payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(String(ch.payment_intent));
        if (pi.metadata?.sku === 'buang_iklan' && pi.metadata?.uid) {
          const { error } = await admin.rpc('revoke_no_ads', { p_user: pi.metadata.uid });
          if (error) throw error;
        }
      }
    }
    return new Response(JSON.stringify({ received: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error(e);
    return new Response('Ralat pelayan', { status: 500 });
  }
});
