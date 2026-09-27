'use strict';
// ===== Fail simpanan: eksport ke fail .json dan import semula (tanpa akaun) =====
const SAVE_FORMAT = 'monsta-seberang-perai-save';
const SaveFile = {
  $(id) { return document.getElementById(id); },
  // semak kasar (FNV-1a) untuk mengesan fail rosak atau terpotong
  sum(str) { let h = 0x811c9dc5; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); },
  summary(s) {
    const m = MAPS[s.map];
    const h = Math.floor((s.time || 0) / 3600), mm = Math.floor((s.time || 0) / 60) % 60;
    return `${s.name} · ${(s.badges || []).length} lencana · ${(s.party || []).length} Monsta · ${h}:${String(mm).padStart(2, '0')}${m && m.name ? ' · ' + m.name : ''}`;
  },
  pack(s) {
    const data = JSON.parse(JSON.stringify(s)); delete data._cloud;
    return { format: SAVE_FORMAT, version: 1, exportedAt: new Date().toISOString(), summary: this.summary(data), check: this.sum(JSON.stringify(data)), data };
  },
  // kembalikan { save } atau { error }
  parse(text) {
    let o;
    try { o = JSON.parse(text); } catch (e) { return { error: 'Fail ini bukan fail simpanan Monsta (format tidak dikenali).' }; }
    let data = o;
    if (o && o.format === SAVE_FORMAT) {
      data = o.data;
      if (!data || this.sum(JSON.stringify(data)) !== o.check) return { error: 'Fail simpanan ini rosak atau telah diubah. Ia tidak boleh dimuat.' };
    }
    const ok = data && typeof data === 'object' && typeof data.name === 'string' && Array.isArray(data.party) && Array.isArray(data.badges)
      && data.bag && typeof data.bag === 'object' && data.flags && typeof data.flags === 'object' && MAPS[data.map]
      && data.party.every(m => m && SP[m.sp] && typeof m.lv === 'number');
    if (!ok) return { error: 'Fail ini bukan fail simpanan Monsta yang sah.' };
    return { save: data };
  },
  exportFile() {
    if (!S) { Cloud.toast('Mulakan atau sambung permainan dahulu.'); return; }
    saveGame();
    const pack = this.pack(S);
    const d = new Date(), pad = n => String(n).padStart(2, '0');
    const name = `monsta-${(S.name || 'pemain').toLowerCase().replace(/[^a-z0-9]+/g, '')}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
    const url = URL.createObjectURL(new Blob([JSON.stringify(pack)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    this.$('saveNote').textContent = `Fail "${name}" telah dimuat turun. Simpan di tempat selamat (contoh: Google Drive).`;
    Cloud.toast('Simpanan dieksport ke fail ✔');
  },
  init() {
    this.$('btnExport').onclick = () => this.exportFile();
    this.$('saveClose').onclick = () => this.close(null);
    this.$('saveInput').onchange = e => {
      const f = e.target.files && e.target.files[0]; e.target.value = '';
      if (!f) return;
      if (f.size > 2e6) { this.showError('Fail terlalu besar untuk fail simpanan Monsta.'); return; }
      const rd = new FileReader();
      rd.onload = () => {
        const r = this.parse(String(rd.result));
        if (r.error) { this.showError(r.error); return; }
        this.pending = r.save;
        this.$('importInfo').textContent = this.summary(r.save);
        this.$('importPreview').classList.remove('hidden');
        this.$('saveNote').textContent = 'Simpanan dalam pelayar ini akan diganti dengan fail ini.';
      };
      rd.onerror = () => this.showError('Fail tidak dapat dibaca.');
      rd.readAsText(f);
    };
    this.$('btnImportOk').onclick = () => {
      const s = this.pending; if (!s) return;
      s.savedAt = Date.now();
      try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); } catch (e) { this.showError('Tidak dapat menyimpan dalam pelayar ini.'); return; }
      if (this.mode === 'game') { Cloud.toast('Simpanan diimport. Memulakan semula…'); setTimeout(() => location.reload(), 700); return; }
      this.close(s);
    };
  },
  showError(msg) { this.pending = null; this.$('importPreview').classList.add('hidden'); this.$('saveNote').textContent = '⚠ ' + msg; },
  // mode 'title' (import sahaja) atau 'game' (eksport & import); kembali simpanan yang diimport atau null
  open(mode) {
    this.mode = mode; this.pending = null;
    this.$('importPreview').classList.add('hidden');
    this.$('saveNote').textContent = '';
    this.$('btnExport').classList.toggle('hidden', mode !== 'game');
    this.$('saveStatus').textContent = mode === 'game'
      ? 'Eksport permainan kamu ke satu fail untuk disimpan atau dipindahkan ke peranti lain. Import fail untuk menggantikan permainan semasa.'
      : 'Pilih fail simpanan Monsta (.json) yang pernah kamu eksport untuk menyambung permainan.';
    this.$('saveBox').classList.remove('hidden'); Input.enabled = false; Input.clear();
    return new Promise(r => { this._close = r; });
  },
  close(result) {
    this.$('saveBox').classList.add('hidden'); Input.enabled = true; Input.clear();
    if (this._close) { const r = this._close; this._close = null; r(result); }
  }
};
window.SaveFile = SaveFile;
