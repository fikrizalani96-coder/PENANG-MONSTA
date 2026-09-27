'use strict';
// ===== Akaun Google & simpanan awan (Supabase Auth + Postgres) =====
// Jadual: saves (simpanan), entitlements (Buang Iklan/kostum), purchases (pembelian Stripe).
const Cloud = {
  ready: false, user: null, sb: null, owned: {}, noAds: false,
  $(id) { return document.getElementById(id); },
  toast(msg, ms = 3200) {
    const t = this.$('toast'); if (!t) return;
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.add('hidden'), ms);
  },
  async init() {
    this.$('btnGoogle').onclick = () => this.signIn();
    this.$('btnLogout').onclick = () => this.signOut();
    this.$('btnCloudSave').onclick = async () => { if (!S) { this.toast('Mulakan permainan dahulu.'); return; } saveGame(); const ok = await this.saveCloud(); this.toast(ok ? 'Disimpan ke awan ☁' : 'Gagal menyimpan ke awan.'); };
    this.$('btnCloudLoad').onclick = async () => {
      const c = await this.loadCloud();
      if (!c) { this.toast('Tiada simpanan awan untuk akaun ini.'); return; }
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(c)); } catch (e) { }
      this.toast('Simpanan awan dimuat. Memulakan semula…'); setTimeout(() => location.reload(), 900);
    };
    this.$('acctClose').onclick = () => this.closePanel();
    this.refreshPanel();
    const C = CONFIG.supabase;
    if (!C || !window.supabase) return;
    try {
      this.sb = supabase.createClient(C.url, C.key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' } });
      this.ready = true;
      this.sb.auth.onAuthStateChange((ev, session) => { setTimeout(() => this.setUser(session ? session.user : null, ev), 0); });
      const { data } = await this.sb.auth.getSession();
      this.setUser(data.session ? data.session.user : null, 'INITIAL');
      // semak pembelian apabila pemain kembali ke tab
      document.addEventListener('visibilitychange', () => { if (!document.hidden && this.user) this.sync(); });
    } catch (e) { console.warn('Supabase tidak dapat dimulakan', e); this.ready = false; this.refreshPanel(); }
  },
  setUser(u, ev) {
    const was = this.user && this.user.id;
    this.user = u;
    this.refreshPanel();
    if (u && u.id !== was) {
      if (ev === 'SIGNED_IN') this.toast('Log masuk sebagai ' + this.displayName());
      this.sync();
    }
    if (!u) { this.owned = {}; this.noAds = false; }
  },
  displayName() { const u = this.user; if (!u) return ''; const m = u.user_metadata || {}; return m.full_name || m.name || u.email || 'Pemain'; },
  refreshPanel() {
    const st = this.$('acctStatus'), note = this.$('acctNote');
    const inBox = this.$('acctIn'), g = this.$('btnGoogle');
    if (!CONFIG.supabase || !this.ready) {
      st.textContent = 'Log masuk Google belum diaktifkan pada laman ini. Kemajuan disimpan dalam pelayar ini.';
      g.disabled = true; g.style.opacity = .5; inBox.classList.add('hidden');
      note.textContent = IS_DEV && !CONFIG.supabase ? 'Pembangun: isi CONFIG.supabase dalam js/config.js (lihat LAUNCH.md).' : '';
      return;
    }
    g.disabled = false; g.style.opacity = 1;
    if (this.user) {
      st.textContent = `Log masuk sebagai ${this.displayName()}${this.user.email ? ' (' + this.user.email + ')' : ''}. Kemajuan disimpan ke awan secara automatik setiap kali kamu SIMPAN.`;
      g.classList.add('hidden'); inBox.classList.remove('hidden');
      note.textContent = this.noAds ? '✔ Iklan telah dibuang untuk akaun ini.' : '';
    } else {
      st.textContent = 'Log masuk untuk menyimpan kemajuan ke awan dan main di mana-mana peranti. Pembelian juga disimpan pada akaun kamu.';
      g.classList.remove('hidden'); inBox.classList.add('hidden'); note.textContent = '';
    }
  },
  openPanel() {
    this.refreshPanel();
    this.$('acct').classList.remove('hidden'); Input.enabled = false; Input.clear();
    return new Promise(r => { this._close = r; });
  },
  closePanel() {
    this.$('acct').classList.add('hidden'); Input.enabled = true; Input.clear();
    if (this._close) { const r = this._close; this._close = null; r(); }
  },
  async signIn() {
    if (!this.ready) return;
    if (S) saveGame(); // simpan dahulu kerana halaman akan beralih ke Google
    const { error } = await this.sb.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: location.origin + location.pathname, queryParams: { prompt: 'select_account' } }
    });
    if (error) this.toast('Log masuk gagal: ' + error.message, 6000);
  },
  async signOut() { if (this.sb) await this.sb.auth.signOut(); this.toast('Log keluar.'); },
  // Ambil hak milik & tuntut pembelian baharu
  async sync() {
    if (!this.user) return;
    try {
      const { data, error } = await this.sb.from('entitlements').select('owned, no_ads').eq('user_id', this.user.id).maybeSingle();
      if (!error) {
        this.owned = (data && data.owned) || {}; this.noAds = !!(data && data.no_ads);
        if (S) { if (this.noAds) S.noAds = true; if (this.owned.buang_iklan === false) { S.noAds = false; if (S.owned) delete S.owned.buang_iklan; } }
        this.refreshPanel(); if (window.Monet) Monet.renderShop();
      }
      if (!S) { this._needClaim = true; return; }
      const r = await this.sb.rpc('claim_purchases');
      if (r.error) { console.warn(r.error); return; }
      for (const p of r.data || []) Monet.grant(p.sku, true);
    } catch (e) { console.warn('Segerak gagal', e); }
  },
  // dipanggil selepas permainan dimuat (S wujud)
  flushPending() { if (this._needClaim && S) { this._needClaim = false; this.sync(); } },
  // tinjau pembelian selepas kembali dari Stripe (webhook mungkin lambat beberapa saat)
  pollPurchases(ms = 60000) {
    const t0 = Date.now();
    const tick = async () => { if (!this.user || Date.now() - t0 > ms) return; await this.sync(); setTimeout(tick, 4000); };
    tick();
  },
  async saveCloud() {
    if (!this.user || !S) return false;
    try {
      const { error } = await this.sb.from('saves').upsert({
        user_id: this.user.id, data: S, name: S.name, badges: S.badges.length, saved_at: S.savedAt || Date.now(), updated_at: new Date().toISOString()
      });
      if (error) throw error;
      return true;
    } catch (e) { console.warn(e); return false; }
  },
  async loadCloud() {
    if (!this.user) return null;
    try {
      const { data, error } = await this.sb.from('saves').select('data').eq('user_id', this.user.id).maybeSingle();
      if (error || !data) return null;
      const s = data.data; s._cloud = true; return s;
    } catch (e) { console.warn(e); return null; }
  },
  // Pilih simpanan terbaharu antara pelayar dan awan
  async bestSave() {
    const local = loadGame();
    if (!this.user) return local;
    const cloud = await this.loadCloud();
    if (!cloud) return local;
    if (!local || (cloud.savedAt || 0) > (local.savedAt || 0)) return cloud;
    return local;
  },
  // Panggil Edge Function Supabase
  async call(name, body) {
    const { data, error } = await this.sb.functions.invoke(name, { body });
    if (error) {
      let msg = error.message;
      try { const j = await error.context.json(); if (j && j.error) msg = j.error; if (j && j.code) error.code = j.code; } catch (e) { }
      const err = new Error(msg); err.code = error.code; throw err;
    }
    return data;
  }
};
window.Cloud = Cloud;
