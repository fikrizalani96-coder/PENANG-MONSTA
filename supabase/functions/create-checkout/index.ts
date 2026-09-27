// Monsta Seberang Perai: cipta sesi Stripe Checkout (RM) untuk pemain yang log masuk.
// Harga ditentukan oleh skus.json di pelayan, bukan oleh pelayar.
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.117.2';
import SKUS from './skus.json' with { type: 'json' };

type Sku = { name: string; sen: number; once: boolean };
const skus = SKUS as Record<string, Sku>;

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const envKey = (name: string, legacy: string) => {
  try { const k = JSON.parse(Deno.env.get(name) ?? '{}').default; if (k) return k as string; } catch { /* guna kunci lama */ }
  return Deno.env.get(legacy) ?? '';
};

// Cipta webhook Stripe secara automatik pada kali pertama (atau apabila kunci bertukar antara ujian/langsung),
// supaya pemilik hanya perlu menetapkan STRIPE_SECRET_KEY. Rahsia webhook disimpan dalam private.app_config.
const WEBHOOK_EVENTS: Stripe.WebhookEndpointCreateParams.EnabledEvent[] = [
  'checkout.session.completed', 'checkout.session.async_payment_succeeded', 'charge.refunded',
];
async function ensureWebhook(stripe: Stripe, secret: string, supabaseUrl: string) {
  if (Deno.env.get('STRIPE_WEBHOOK_SECRET')) return; // ditetapkan secara manual
  const admin = createClient(supabaseUrl, envKey('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
  const mode = secret.includes('_live_') ? 'live' : 'test';
  const [{ data: whsec }, { data: whMode }] = await Promise.all([
    admin.rpc('get_app_config', { p_key: 'stripe_webhook_secret' }),
    admin.rpc('get_app_config', { p_key: 'stripe_webhook_mode' }),
  ]);
  if (whsec && whMode === mode) return;
  const hookUrl = `${supabaseUrl}/functions/v1/stripe-webhook`;
  // rahsia hanya diberi semasa dicipta, jadi buang titik akhir lama yang sama URL
  const list = await stripe.webhookEndpoints.list({ limit: 100 });
  for (const ep of list.data) if (ep.url === hookUrl) await stripe.webhookEndpoints.del(ep.id);
  const ep = await stripe.webhookEndpoints.create({ url: hookUrl, enabled_events: WEBHOOK_EVENTS, description: 'Monsta Seberang Perai (automatik)' });
  const r1 = await admin.rpc('set_app_config', { p_key: 'stripe_webhook_secret', p_value: ep.secret! });
  const r2 = await admin.rpc('set_app_config', { p_key: 'stripe_webhook_mode', p_value: mode });
  if (r1.error || r2.error) throw r1.error || r2.error;
  console.log('Webhook Stripe dicipta', ep.id, mode);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Kaedah tidak dibenarkan.' }, 405);

  const secret = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secret) return json({ error: 'Kedai Premium belum dibuka. Pembayaran belum dikonfigurasi.', code: 'not_configured' }, 503);

  // Sahkan pemain melalui token sesi Supabase
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const url = Deno.env.get('SUPABASE_URL')!;
  const pub = envKey('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY');
  const sb = createClient(url, pub, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
  const { data: { user } } = await sb.auth.getUser(token);
  if (!user) return json({ error: 'Sila log masuk dengan Google dahulu.', code: 'unauthenticated' }, 401);

  let body: { sku?: string; returnUrl?: string };
  try { body = await req.json(); } catch { return json({ error: 'Permintaan tidak sah.' }, 400); }
  const sku = String(body.sku ?? '');
  const item = skus[sku];
  if (!item) return json({ error: 'Item tidak wujud.' }, 400);

  // URL kembali mesti sama asal dengan halaman yang membuat permintaan (atau dalam ALLOWED_ORIGINS)
  let base: string;
  try {
    const u = new URL(String(body.returnUrl));
    const origin = req.headers.get('Origin');
    const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map((s) => s.trim().replace(/\/$/, '')).filter(Boolean);
    const secure = u.protocol === 'https:' || u.hostname === 'localhost' || u.hostname === '127.0.0.1';
    if (!secure || !(allowed.includes(u.origin) || (origin && origin === u.origin))) throw new Error('origin');
    base = u.origin + u.pathname;
  } catch {
    return json({ error: 'URL kembali tidak dibenarkan.' }, 400);
  }

  if (item.once) {
    const { data } = await sb.from('entitlements').select('owned').eq('user_id', user.id).maybeSingle();
    if (data?.owned?.[sku] === true) return json({ error: 'Kamu sudah memiliki item ini.', code: 'already_owned' }, 409);
  }

  const stripe = new Stripe(secret);
  try {
    await ensureWebhook(stripe, secret, url);
  } catch (e) {
    console.error('Gagal menyediakan webhook Stripe', e);
    return json({ error: 'Kedai Premium belum dapat disediakan. Cuba lagi sebentar.', code: 'webhook_setup' }, 503);
  }
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ quantity: 1, price_data: { currency: 'myr', unit_amount: item.sen, product_data: { name: `Monsta Seberang Perai: ${item.name}` } } }],
    client_reference_id: user.id,
    customer_email: user.email ?? undefined,
    metadata: { uid: user.id, sku },
    payment_intent_data: { metadata: { uid: user.id, sku } },
    success_url: `${base}?bayar=berjaya&sid={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}?bayar=batal`,
    locale: 'auto',
  });
  return json({ url: session.url });
});
