'use strict';
// ===== Akaun Google & simpanan awan (Firebase Auth + Firestore) =====
const Cloud = {
  ready: false, user: null, db: null, auth: null, fns: null, owned: {}, noAds: false,
  $(id) { return document.getElementById(id); },
  toast(msg, ms = 3200) {
    const t = this.$('toast'); if (!t) return;
    t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(this._tt); this._tt = setTimeout(() => t.classList.add('hidden'), ms);
  },
  loadScript(src) {
    return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => rej(new Error('Gagal memuat ' + src)); document.head.appendChild(s); });
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
    if (!CONFIG.firebase) return;
    const v = CONFIG.firebaseVersion, base = `https://www.gstatic.com/firebasejs/${v}/`;
    try {
      await this.loadScript(base + 'firebase-app-compat.js');
      await Promise.all(['auth', 'firestore', 'functions'].map(m => this.loadScript(base + `firebase-${m}-compat.js`)));
      firebase.initializeApp(CONFIG.firebase);
      this.auth = firebase.auth(); this.db = firebase.firestore(); this.fns = firebase.app().functions(CONFIG.functionsRegion);
      this.ready = true;
      this.auth.getRedirectResult().catch(e => console.warn(e));
      this.auth.onAuthStateChanged(u => {
        this.user = u; this.refreshPanel();
        if (this._unsub) { this._unsub.forEach(f => f()); this._unsub = null; }
        if (u) { this.listen(u.uid); this.toast('Log masuk sebagai ' + (u.displayName || u.email)); }
        else { this.owned = {}; this.noAds = false; }
      });
    } catch (e) { console.warn('Firebase tidak dapat dimuat', e); this.refreshPanel(); }
  },
  refreshPanel() {
    const st = this.$('acctStatus'), note = this.$('acctNote');
    const inBox = this.$('acctIn'), g = this.$('btnGoogle');
    if (!CONFIG.firebase || !this.ready) {
      st.textContent = 'Log masuk Google belum diaktifkan pada laman ini. Kemajuan disimpan dalam pelayar ini.';
      g.disabled = true; g.style.opacity = .5; inBox.classList.add('hidden');
      note.textContent = IS_DEV ? 'Pembangun: isi CONFIG.firebase dalam js/config.js (lihat LAUNCH.md).' : '';
      return;
    }
    g.disabled = false; g.style.opacity = 1;
    if (this.user) {
      st.textContent = `Log masuk sebagai ${this.user.displayName || ''} (${this.user.email}). Kemajuan disimpan ke awan secara automatik setiap kali kamu SIMPAN.`;
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
  signIn() {
    if (!this.ready) return;
    const p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    if (IS_TOUCH) { if (S) saveGame(); this.auth.signInWithRedirect(p); return; }
    this.auth.signInWithPopup(p).catch(e => {
      if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') this.auth.signInWithRedirect(p);
      else if (e.code !== 'auth/popup-closed-by-user') this.toast('Log masuk gagal: ' + e.message);
    });
  },
  signOut() { if (this.auth) this.auth.signOut(); this.toast('Log keluar.'); },
  listen(uid) {
    this._unsub = [];
    this._unsub.push(this.db.doc(`users/${uid}`).onSnapshot(d => {
      const v = d.data() || {};
      this.owned = v.owned || {}; this.noAds = !!v.noAds;
      if (this.noAds && S) S.noAds = true;
      if (S && this.owned.buang_iklan === false) { S.noAds = false; if (S.owned) delete S.owned.buang_iklan; }
      this.refreshPanel(); if (window.Monet) Monet.renderShop();
    }, e => console.warn(e)));
    this._unsub.push(this.db.collection(`users/${uid}/purchases`).where('claimed', '==', false).onSnapshot(q => {
      q.forEach(async doc => {
        const p = doc.data();
        if (!S) { this._pending = (this._pending || []).concat([[doc.ref, p]]); return; }
        await this.claim(doc.ref, p);
      });
    }, e => console.warn(e)));
  },
  async claim(ref, p) {
    try {
      await ref.update({ claimed: true, claimedAt: firebase.firestore.FieldValue.serverTimestamp() });
      Monet.grant(p.sku, true);
    } catch (e) { console.warn('Tuntutan gagal', e); }
  },
  flushPending() { if (this._pending && S) { const l = this._pending; this._pending = null; l.forEach(([r, p]) => this.claim(r, p)); } },
  async saveCloud() {
    if (!this.user || !S) return false;
    try {
      await this.db.doc(`saves/${this.user.uid}`).set({
        data: JSON.stringify(S), savedAt: S.savedAt || Date.now(), name: S.name, badges: S.badges.length,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      return true;
    } catch (e) { console.warn(e); return false; }
  },
  async loadCloud() {
    if (!this.user) return null;
    try {
      const d = await this.db.doc(`saves/${this.user.uid}`).get();
      if (!d.exists) return null;
      const s = JSON.parse(d.data().data); s._cloud = true; return s;
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
  async call(name, data) {
    const f = this.fns.httpsCallable(name);
    const r = await f(data); return r.data;
  }
};
window.Cloud = Cloud;
