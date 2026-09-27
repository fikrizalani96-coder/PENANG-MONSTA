'use strict';
// ===== Pengewangan: iklan (Google H5 Games Ads) & Kedai Premium (Stripe melalui Firebase Functions) =====
// Harga dalam sen (RM). Senarai yang sama WAJIB ada dalam functions/index.js (pelayan menentukan harga sebenar).
const SKUS = [
  { id: 'buang_iklan', name: 'Buang Iklan Selamanya', sen: 2990, desc: 'Tiada lagi iklan selingan. Semua ganjaran "tonton iklan" diberi terus. Sekali bayar, kekal pada akaun Google kamu.', once: true, hero: true },
  { id: 'pek_bola_hebat', name: 'Pek 10 Bola Hebat', sen: 290, desc: '10 × Bola Hebat untuk menangkap Monsta.', items: { 'Bola Hebat': 10 } },
  { id: 'pek_bola_ultra', name: 'Pek 10 Bola Ultra', sen: 490, desc: '10 × Bola Ultra berprestasi tinggi.', items: { 'Bola Ultra': 10 } },
  { id: 'bola_sakti', name: 'Bola Sakti', sen: 690, desc: '1 × Bola Sakti yang pasti menangkap.', items: { 'Bola Sakti': 1 } },
  { id: 'pek_rawatan', name: 'Pek Rawatan', sen: 390, desc: '10 × Ubat Hiper + 5 × Semangat.', items: { 'Ubat Hiper': 10, 'Semangat': 5 } },
  { id: 'gula_ajaib', name: '5 Gula Ajaib', sen: 590, desc: 'Naikkan 5 tahap Monsta serta-merta.', items: { 'Gula Ajaib': 5 } },
  { id: 'batu_evolusi', name: 'Set Batu Evolusi', sen: 390, desc: 'Batu Api, Batu Air dan Batu Petir.', items: { 'Batu Api': 1, 'Batu Air': 1, 'Batu Petir': 1 } },
  { id: 'kupang_20k', name: '20,000 Kupang', sen: 290, desc: 'Wang dalam permainan untuk kedai Monsta.', money: 20000 },
  { id: 'exp_ganda', name: 'Penggalak EXP ×2', sen: 490, desc: 'EXP berganda selama 2 jam masa permainan.', boost: 7200 },
  { id: 'kostum_emas', name: 'Kostum Baju Melayu Emas', sen: 390, desc: 'Baju Melayu emas bersongkok untuk watak kamu.', look: 'kostum_emas', once: true },
  { id: 'kostum_kebaya', name: 'Kostum Kebaya Merah', sen: 390, desc: 'Kebaya merah bertudung untuk watak kamu.', look: 'kostum_kebaya', once: true },
  { id: 'kostum_harimau', name: 'Kostum Jersi Harimau', sen: 390, desc: 'Jersi belang harimau kebanggaan negara.', look: 'kostum_harimau', once: true },
];
Object.assign(LOOKS, {
  kostum_emas: { h: '#2a1a10', hat: '#1a1a1a', s: '#e0b890', c: '#e8b830', p: '#c89820' },
  kostum_kebaya: { hij: '#f0e6d8', s: '#f0c8a0', c: '#c82838', p: '#7a1a28' },
  kostum_harimau: { h: '#1a1a1a', s: '#d8a878', c: '#f0c020', p: '#1a1a1a' },
});
const rm = sen => 'RM' + (sen / 100).toFixed(2);

const Monet = {
  adsOn: false, lastAd: 0, playSince: 0,
  get noAds() { return !!((S && S.noAds) || (window.Cloud && Cloud.noAds)); },
  init() {
    this.lastAd = performance.now() / 1000;
    const c = CONFIG.adsenseClient;
    if (c) {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adBreak = window.adConfig = function (o) { adsbygoogle.push(o); };
      const s = document.createElement('script');
      s.async = true; s.crossOrigin = 'anonymous';
      s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(c);
      s.setAttribute('data-ad-client', c);
      if (CONFIG.adsTest) s.setAttribute('data-adbreak-test', 'on');
      s.setAttribute('data-ad-frequency-hint', Math.max(30, CONFIG.interstitialMinGap) + 's');
      document.head.appendChild(s);
      adConfig({ preloadAdBreaks: 'on', sound: 'on', onReady: () => { this.adsOn = true; } });
      this.adsOn = true;
    }
    document.getElementById('shopClose').onclick = () => this.closeShop();
    // kembali dari Stripe
    const q = new URLSearchParams(location.search);
    if (q.get('bayar')) {
      setTimeout(() => Cloud.toast(q.get('bayar') === 'berjaya' ? 'Terima kasih! Pembayaran berjaya. Barang akan dihantar ke permainan kamu sebentar lagi.' : 'Pembayaran dibatalkan.', 6000), 800);
      history.replaceState(null, '', location.pathname);
    }
  },
  tick(dt) { if (S && S.expBoost > 0) S.expBoost = Math.max(0, S.expBoost - dt); },
  expMul() { return S && S.expBoost > 0 ? 2 : 1; },
  // ----- iklan -----
  _pause() { Snd._wasOn = Snd.on; if (Snd.on) Snd.toggle(); Input.enabled = false; Input.clear(); },
  _resume() { if (Snd._wasOn && !Snd.on) Snd.toggle(); Input.enabled = true; Input.clear(); },
  async interstitial(name) {
    if (this.noAds || !this.adsOn) return;
    const now = performance.now() / 1000;
    if (now - this.lastAd < CONFIG.interstitialMinGap) return;
    if (S && S.time < 600) return; // tiada iklan dalam 10 minit pertama
    this.lastAd = now;
    await new Promise(res => {
      let done = false; const fin = () => { if (!done) { done = true; this._resume(); res(); } };
      try { adBreak({ type: 'next', name, beforeAd: () => this._pause(), afterAd: fin, adBreakDone: fin }); } catch (e) { fin(); }
      setTimeout(() => { if (!done && Input.enabled) fin(); }, 4000);
    });
  },
  // Iklan berganjaran: kembali true jika pemain layak menerima ganjaran
  async rewarded(name) {
    if (this.noAds) return true;
    if (!this.adsOn) {
      if (IS_DEV) { await UI.say('(Mod ujian) Iklan contoh dipaparkan... Terima kasih kerana menonton!'); return true; }
      await UI.say('Tiada iklan tersedia sekarang. Cuba lagi nanti.'); return false;
    }
    return new Promise(res => {
      let granted = false, done = false;
      const fin = ok => { if (!done) { done = true; this._resume(); res(ok); } };
      try {
        adBreak({
          type: 'reward', name,
          beforeAd: () => this._pause(), afterAd: () => { },
          beforeReward: show => show(),
          adDismissed: () => { granted = false; }, adViewed: () => { granted = true; },
          adBreakDone: info => { if (!granted && info && info.breakStatus !== 'viewed') UI.say('Iklan tidak tersedia atau tidak ditonton hingga habis.'); fin(granted); }
        });
      } catch (e) { fin(false); }
      setTimeout(() => { if (!done && Input.enabled) fin(false); }, 6000);
    });
  },
  // ----- kedai premium -----
  owns(id) { return !!((window.Cloud && Cloud.owned[id]) || (S && S.owned && S.owned[id])); },
  openShop() {
    this.renderShop();
    document.getElementById('shop').classList.remove('hidden'); Input.enabled = false; Input.clear();
    return new Promise(r => { this._close = r; });
  },
  closeShop() {
    document.getElementById('shop').classList.add('hidden'); Input.enabled = true; Input.clear();
    if (this._close) { const r = this._close; this._close = null; r(); }
  },
  renderShop() {
    const list = document.getElementById('skuList'); if (!list) return;
    list.innerHTML = '';
    const note = document.getElementById('shopNote');
    const live = window.Cloud && Cloud.ready;
    note.textContent = live ? (Cloud.user ? 'Pembelian disimpan pada akaun Google kamu dan boleh dipulihkan di peranti lain.' : 'Log masuk dengan Google dahulu supaya pembelian kamu selamat dan boleh dipulihkan.')
      : IS_DEV && CONFIG.devPurchases ? 'Mod ujian: pembelian disimulasikan (tiada bayaran sebenar).' : 'Kedai Premium belum dibuka pada laman ini.';
    for (const k of SKUS) {
      const row = document.createElement('div');
      const owned = k.once && this.owns(k.id) || (k.id === 'buang_iklan' && this.noAds);
      row.className = 'sku' + (k.hero ? ' hero' : '') + (owned ? ' owned' : '');
      const b = document.createElement('b'); b.textContent = k.name;
      const sp = document.createElement('span'); sp.textContent = k.desc;
      const btn = document.createElement('button'); btn.className = 'btn gold';
      btn.textContent = owned ? 'DIMILIKI' : rm(k.sen); btn.disabled = owned;
      btn.onclick = () => this.buy(k.id);
      row.append(b, btn, sp); list.appendChild(row);
    }
  },
  async buy(id) {
    const k = SKUS.find(s => s.id === id); if (!k) return;
    if (!S) { Cloud.toast('Mulakan atau sambung permainan dahulu.'); return; }
    if (window.Cloud && Cloud.ready) {
      if (!Cloud.user) { this.closeShop(); Cloud.toast('Sila log masuk dengan Google dahulu.'); Cloud.openPanel(); return; }
      try {
        saveGame();
        Cloud.toast('Membuka halaman pembayaran selamat…', 8000);
        const r = await Cloud.call('createCheckout', { sku: id, returnUrl: location.origin + location.pathname });
        if (r && r.url) location.href = r.url; else Cloud.toast('Gagal membuka pembayaran.');
      } catch (e) { Cloud.toast(e.code === 'functions/already-exists' ? 'Kamu sudah memiliki item ini.' : 'Ralat pembayaran: ' + (e.message || e)); }
      return;
    }
    if (IS_DEV && CONFIG.devPurchases) {
      this.grant(id, true); Cloud.toast(`(Mod ujian) ${k.name} dibeli — ${rm(k.sen)}`); this.renderShop(); return;
    }
    Cloud.toast('Kedai Premium belum tersedia.');
  },
  grant(id, notify) {
    const k = SKUS.find(s => s.id === id); if (!k || !S) return;
    S.owned = S.owned || {};
    if (k.once) S.owned[id] = true;
    if (id === 'buang_iklan') S.noAds = true;
    if (k.items) for (const n in k.items) giveItem(n, k.items[n]);
    if (k.money) S.money += k.money;
    if (k.boost) S.expBoost = (S.expBoost || 0) + k.boost;
    if (k.look) { S.looks = S.looks || []; if (!S.looks.includes(k.look)) S.looks.push(k.look); }
    saveGame();
    if (notify) { Snd.sfx('item'); Cloud.toast('Diterima: ' + k.name + ' ✔', 5000); }
  },
  drawBadge() {
    if (!S || !(S.expBoost > 0) || !World.map || Game.top() !== World.scene) return;
    const m = Math.ceil(S.expBoost / 60);
    txt(`EXP ×2 · ${m} min`, SW - INSET.r - 20, 20 + (IS_TOUCH ? 56 : 0), { size: 22, align: 'right', color: '#9fe8a0' });
  }
};
window.Monet = Monet;
