'use strict';
// ===== Menu: mula, Monsta, beg, Monstadex, PC, kedai, kad, simpan =====
function kupang(n) { return Number(n).toLocaleString('en-US') + ' Kupang'; }
function screenBG(c1 = '#1a2850', c2 = '#070b18') {
  const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, c1); g.addColorStop(1, c2);
  ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  ctx.fillStyle = 'rgba(233,196,106,.05)';
  for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.arc((i * 211) % SW, (i * 137) % SH, 40 + (i % 4) * 30, 0, 7); ctx.fill(); }
}
function card(x, y, w, h, sel, col) {
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, sel ? '#3a3a20' : 'rgba(30,44,84,.92)'); g.addColorStop(1, sel ? '#221e0c' : 'rgba(14,22,44,.92)');
  ctx.fillStyle = g; rr(x, y, w, h, 12); ctx.fill();
  ctx.strokeStyle = col || (sel ? THEME.accent : 'rgba(255,255,255,.18)'); ctx.lineWidth = sel ? 3 : 1.5; rr(x + .5, y + .5, w - 1, h - 1, 12); ctx.stroke();
}
function hpBar(x, y, w, h, p) {
  ctx.fillStyle = '#060a16'; rr(x - 1, y - 1, w + 2, h + 2, h / 2 + 1); ctx.fill();
  ctx.fillStyle = p > .5 ? '#4fd06a' : p > .2 ? '#f0c040' : '#f05848'; rr(x, y, Math.max(0, w * p), h, h / 2); ctx.fill();
}
class ListScene {
  constructor(items, res, o = {}) {
    this.items = items; this.res = res; this.o = o; this.transparent = true;
    this.i = clamp(o.start || 0, 0, Math.max(0, items.length - 1));
    const R = dlgRect();
    const w = o.w || Math.min(620, R.w * (PORTRAIT ? 1 : .6));
    this.x = o.x !== undefined ? o.x : R.x + R.w - w; this.y = o.y !== undefined ? o.y : 16 + INSET.t + (IS_TOUCH ? 56 : 0);
    this.w = w; this.h = o.h || (R.y - 10 - this.y); this.row = 44;
    this.vis = Math.max(3, Math.floor((this.h - 36 - (o.title ? 40 : 0)) / this.row)); this.scroll = 0;
  }
  update() {
    const n = this.items.length;
    if (n && Input.pressed.up) { this.i = (this.i + n - 1) % n; Snd.sfx('move'); }
    if (n && Input.pressed.down) { this.i = (this.i + 1) % n; Snd.sfx('move'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + this.vis) this.scroll = this.i - this.vis + 1;
    if (Input.pressed.a && n) { Snd.sfx('beep'); Game.pop(this); this.res(this.i); }
    else if (Input.pressed.b && this.o.cancel !== false) { Snd.sfx('beep'); Game.pop(this); this.res(-1); }
  }
  draw() {
    panel(this.x, this.y, this.w, this.h, true);
    let y0 = this.y + 20;
    if (this.o.title) { txt(this.o.title, this.x + 26, y0 - 4, { color: THEME.accent, size: 34 }); y0 += 42; }
    const end = Math.min(this.items.length, this.scroll + this.vis);
    for (let k = this.scroll; k < end; k++) {
      const it = this.items[k], yy = y0 + (k - this.scroll) * this.row;
      if (k === this.i) { ctx.fillStyle = 'rgba(233,196,106,.15)'; rr(this.x + 12, yy - 3, this.w - 24, 40, 8); ctx.fill(); }
      txt(it.l, this.x + 46, yy, { color: it.dim ? THEME.dim : THEME.text });
      if (it.r !== undefined) txt(String(it.r), this.x + this.w - 26, yy, { align: 'right', color: it.dim ? THEME.dim : '#fff2c8' });
      if (k === this.i) cursor(this.x + 22, yy + 9);
    }
    if (!this.items.length) txt(this.o.empty || '(kosong)', this.x + 46, y0, { color: THEME.dim });
    if (this.scroll > 0) txt('▲', this.x + this.w - 34, this.y + 8, { size: 22 });
    if (end < this.items.length) txt('▼', this.x + this.w - 34, this.y + this.h - 30, { size: 22 });
    if (this.o.desc && this.items.length) {
      const R = dlgRect();
      panel(R.x, R.y, R.w, R.h);
      wrapText(fmt(this.o.desc(this.i)), R.w - 70).slice(0, 3).forEach((l, k) => txt(l, R.x + 32, R.y + 24 + k * 38));
    }
  }
}
UI.list = (items, o) => new Promise(r => Game.push(new ListScene(items, r, o)));

class QtyScene {
  constructor(max, price, res) { this.max = max; this.price = price; this.res = res; this.n = 1; this.transparent = true; }
  update() {
    if (Input.pressed.up) this.n = this.n >= this.max ? 1 : this.n + 1;
    if (Input.pressed.down) this.n = this.n <= 1 ? this.max : this.n - 1;
    if (Input.pressed.right) this.n = Math.min(this.max, this.n + 10);
    if (Input.pressed.left) this.n = Math.max(1, this.n - 10);
    if (Input.pressed.a) { Game.pop(this); this.res(this.n); }
    if (Input.pressed.b) { Game.pop(this); this.res(0); }
  }
  draw() {
    const R = dlgRect();
    panel(R.x + R.w - 360, R.y - 100, 360, 88, true);
    txt('× ' + String(this.n).padStart(2, '0'), R.x + R.w - 330, R.y - 76, { size: 36 });
    if (this.price) txt(kupang(this.price * this.n), R.x + R.w - 28, R.y - 72, { align: 'right', color: '#fff2c8' });
  }
}
UI.qty = (max, price) => new Promise(r => Game.push(new QtyScene(max, price, r)));

// ---------- Skrin Monsta (party) ----------
class PartyScene {
  constructor(o, res) { this.o = o; this.res = res; this.i = o.start || 0; this.swap = -1; this.msg = o.msg || 'Pilih Monsta.'; }
  update() {
    if (this.busy) return;
    const n = S.party.length;
    if (Input.pressed.up) { this.i = (this.i + n - 1) % n; Snd.sfx('move'); }
    if (Input.pressed.down) { this.i = (this.i + 1) % n; Snd.sfx('move'); }
    if (Input.pressed.a) { Snd.sfx('beep'); this.select(); }
    else if (Input.pressed.b) {
      if (this.swap >= 0) { this.swap = -1; this.msg = 'Pilih Monsta.'; }
      else if (this.o.mode !== 'forced') { Game.pop(this); this.res(-1); }
    }
  }
  async select() {
    this.busy = true;
    const o = this.o, m = S.party[this.i];
    try {
      if (this.swap >= 0) {
        const a = this.swap, b = this.i; [S.party[a], S.party[b]] = [S.party[b], S.party[a]];
        this.swap = -1; this.msg = 'Pilih Monsta.'; return;
      }
      if (o.mode === 'pick' || o.mode === 'use') { Game.pop(this); this.res(this.i); return; }
      if (o.mode === 'battle' || o.mode === 'forced') {
        const opts = o.mode === 'forced' ? ['TUKAR', 'STATUS'] : ['TUKAR', 'STATUS', 'BATAL'];
        const c = await UI.choose(opts, { cancel: o.mode === 'forced' ? null : 2 });
        if (c === 0) {
          if (!alive(m)) { await UI.say('Tiada tenaga lagi untuk bertarung!'); return; }
          if (this.i === o.cur) { await UI.say(`${monName(m)} sedang bertarung!`); return; }
          Game.pop(this); this.res(this.i); return;
        }
        if (c === 1) await Menus.summary(this.i);
        return;
      }
      const field = [];
      for (const mv of ['tebas', 'terbang', 'ombak']) if (m.moves.some(x => x.id === mv)) field.push(mv);
      const opts = ['STATUS', 'SUSUN', ...field.map(f => MOVES[f].n.toUpperCase()), 'BATAL'];
      const c = await UI.choose(opts, { cancel: opts.length - 1 });
      if (c === 0) await Menus.summary(this.i);
      else if (c === 1) { this.swap = this.i; this.msg = 'Tukar dengan yang mana?'; }
      else if (c >= 2 && c < opts.length - 1) {
        const mv = field[c - 2];
        if (mv === 'terbang') {
          if (S.badges.length < 3) { await UI.say('Kamu perlukan LENCANA PETIR untuk menggunakan TERBANG di luar pertarungan.'); return; }
          if (!World.map.outdoor || World.map.era) { await UI.say('Tidak boleh terbang di sini!'); return; }
          const dest = await Menus.fly();
          if (dest) { Game.pop(this); this.res({ fly: dest, mon: m }); }
        } else if (mv === 'tebas') await UI.say('Gunakan TEBAS dengan menghadap semak kecil dan tekan A.');
        else await UI.say('Gunakan OMBAK dengan menghadap air dan tekan A.');
      }
    } finally { this.busy = false; }
  }
  draw() {
    screenBG();
    const R = dlgRect();
    const top = 16 + (IS_TOUCH ? 56 : 0);
    txt('MONSTA SAYA', INSET.l + 30, top, { size: 40, color: THEME.accent });
    const cols = !PORTRAIT && SW - INSET.l - INSET.r > 1000 ? 2 : 1;
    const areaW = Math.min(SW - INSET.l - INSET.r - 40, cols === 2 ? 1180 : 680);
    const x0 = INSET.l + (SW - INSET.l - INSET.r - areaW) / 2;
    const rows = Math.ceil(6 / cols), y0 = top + 56;
    const ch = Math.min(110, (R.y - 16 - y0) / rows - 10), cw = (areaW - (cols - 1) * 16) / cols;
    S.party.forEach((m, k) => {
      const x = x0 + (k % cols) * (cw + 16), y = y0 + Math.floor(k / cols) * (ch + 10), sel = k === this.i;
      card(x, y, cw, ch, sel, this.swap === k ? '#f05848' : null);
      const bob = sel ? Math.sin(Game.t * 6) * 3 : 0;
      ctx.imageSmoothingEnabled = false;
      const sz = ch - 8;
      ctx.drawImage(monstaSprite(m.sp), x + 8, y + 4 + bob, sz, sz);
      ctx.imageSmoothingEnabled = true;
      const tx = x + sz + 20;
      txt(monName(m), tx, y + 8, { size: 32 });
      txt('Tp ' + m.lv, x + cw - 20, y + 10, { size: 28, align: 'right', color: THEME.accent });
      const badge = !alive(m) ? ['PSN', '#c04040'] : m.status ? [STATUS_NAME[m.status], STATUS_COL[m.status]] : null;
      if (badge) { ctx.fillStyle = badge[1]; rr(tx, y + ch - 36, 60, 24, 12); ctx.fill(); txt(badge[0], tx + 30, y + ch - 38, { size: 20, align: 'center', shadow: false }); }
      const mh = maxHp(m), p = m.hp / mh;
      if (this.o.label) txt(this.o.label(m), x + cw - 20, y + ch - 42, { size: 26, align: 'right', color: '#9fd0ff' });
      else {
        const bx = tx + (badge ? 72 : 0), bw = x + cw - 150 - bx;
        hpBar(bx, y + ch - 30, Math.max(60, bw), 12, p);
        txt(`${m.hp}/${mh}`, x + cw - 20, y + ch - 42, { size: 26, align: 'right' });
      }
    });
    panel(R.x, R.y, R.w, R.h);
    txt(this.msg, R.x + 32, R.y + 24);
  }
}

// ---------- Ringkasan Monsta ----------
class SummaryScene {
  constructor(i, res) { this.i = i; this.res = res; }
  update() {
    const n = S.party.length;
    if (Input.pressed.up) this.i = (this.i + n - 1) % n;
    if (Input.pressed.down) this.i = (this.i + 1) % n;
    if (Input.pressed.a || Input.pressed.b) { Game.pop(this); this.res(); }
  }
  draw() {
    const m = S.party[this.i], sp = SP[m.sp];
    if (R3.ok) { R3.drawShow(m.sp, { y: PORTRAIT ? -1.2 : 0 }); }
    else screenBG();
    ctx.fillStyle = 'rgba(5,8,18,.45)'; ctx.fillRect(0, 0, SW, SH);
    const top = 16 + (IS_TOUCH ? 56 : 0);
    txt(`No.${String(sp.no).padStart(3, '0')}  ${monName(m)}`, INSET.l + 30, top, { size: 44 });
    txt('Tp ' + m.lv, INSET.l + 30, top + 50, { size: 34, color: THEME.accent });
    sp.types.forEach((t, k) => { ctx.fillStyle = TYPE_COLOR[t]; rr(INSET.l + 130 + k * 124, top + 56, 114, 32, 16); ctx.fill(); txt(t.toUpperCase(), INSET.l + 187 + k * 124, top + 54, { size: 24, align: 'center', shadow: false }); });
    if (!R3.ok) { ctx.imageSmoothingEnabled = false; ctx.drawImage(monstaSprite(m.sp), INSET.l + 30, top + 110, 260, 260); ctx.imageSmoothingEnabled = true; }
    const pw = Math.min(520, SW - 40), px = PORTRAIT ? (SW - pw) / 2 : SW - INSET.r - pw - 24;
    const py = PORTRAIT ? SH - INSET.b - 560 : top;
    panel(px, py, pw, 540, true);
    const rows = [['HP', `${m.hp}/${maxHp(m)}`], ...['atk', 'def', 'spa', 'spd', 'spe'].map(k => [STAT_NAME[k], stat(m, k)]), ['STATUS', !alive(m) ? 'PENGSAN' : m.status ? m.status.toUpperCase() : 'OK'], ['EXP KE TAHAP SETERUSNYA', m.lv < 100 ? expFor(m.lv + 1) - m.exp : 0]];
    rows.forEach(([a, b], k) => { txt(a, px + 28, py + 22 + k * 34, { size: 26, color: THEME.dim }); txt(String(b), px + pw - 28, py + 22 + k * 34, { size: 26, align: 'right' }); });
    m.moves.forEach((x, k) => {
      const d = MOVES[x.id], yy = py + 310 + k * 54;
      ctx.fillStyle = shade(TYPE_COLOR[d.t], -.35); rr(px + 20, yy, pw - 40, 46, 10); ctx.fill();
      ctx.fillStyle = TYPE_COLOR[d.t]; rr(px + 20, yy, 10, 46, 5); ctx.fill();
      txt(d.n, px + 44, yy + 6, { size: 28 }); txt(`${d.t.toUpperCase()} · PP ${x.pp}/${d.pp}`, px + pw - 36, yy + 10, { size: 22, align: 'right', color: '#fff2c8' });
    });
    txt('▲▼ tukar Monsta  ·  A/B keluar', INSET.l + 30, SH - INSET.b - 44, { size: 22, color: THEME.dim });
  }
}

// ---------- Monstadex ----------
class DexScene {
  constructor(res) { this.res = res; this.i = 0; this.scroll = 0; this.detail = false; this.max = MONSTA_RAW.length; }
  get vis() { return Math.max(6, Math.floor((SH - INSET.b - 170 - (IS_TOUCH ? 56 : 0)) / 46)); }
  update() {
    if (this.detail) { if (Input.pressed.a || Input.pressed.b) this.detail = false; if (Input.pressed.up) this.move(-1); if (Input.pressed.down) this.move(1); return; }
    if (Input.pressed.up) this.move(-1);
    if (Input.pressed.down) this.move(1);
    if (Input.pressed.left) this.move(-8);
    if (Input.pressed.right) this.move(8);
    if (Input.pressed.a && S.dex.seen[DEX[this.i + 1]]) { this.detail = true; Snd.sfx('beep'); }
    if (Input.pressed.b) { Game.pop(this); this.res(); }
  }
  move(d) { const v = this.vis; this.i = clamp(this.i + d, 0, this.max - 1); if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + v) this.scroll = this.i - v + 1; }
  draw() {
    const name = DEX[this.i + 1], seenIt = S.dex.seen[name];
    if (R3.ok && seenIt) R3.drawShow(name, { white: !S.dex.caught[name], y: PORTRAIT ? -1.5 : 0 });
    else {
      screenBG('#3a1420', '#0a0610');
      if (seenIt) { // gambar Monsta 2D: siluet jika belum ditangkap
        const s = PORTRAIT ? 300 : 280, x = PORTRAIT ? SW / 2 - s / 2 : SW - INSET.r - s - 80, y = PORTRAIT ? 170 + (IS_TOUCH ? 56 : 0) : SH * .2;
        ctx.fillStyle = 'rgba(255,255,255,.06)'; ctx.beginPath(); ctx.ellipse(x + s / 2, y + s * .9, s * .42, s * .1, 0, 0, 7); ctx.fill();
        ctx.imageSmoothingEnabled = false; ctx.drawImage(S.dex.caught[name] ? monstaSprite(name) : silhouette(name), x, y, s, s); ctx.imageSmoothingEnabled = true;
      }
    }
    ctx.fillStyle = 'rgba(5,8,18,.35)'; ctx.fillRect(0, 0, SW, SH);
    const top = 16 + (IS_TOUCH ? 56 : 0);
    txt('MONSTADEX', INSET.l + 30, top, { size: 44, color: '#ff8a7a' });
    const [seen, caught] = dexCount();
    txt(`Dilihat ${seen}  ·  Ditangkap ${caught} / ${this.max}`, INSET.l + 30, top + 48, { size: 26, color: THEME.dim });
    if (this.detail) {
      const sp = SP[name];
      const R = dlgRect(); const h = 250, y = R.y + R.h - h;
      panel(R.x, y, R.w, h);
      txt(`No.${String(sp.no).padStart(3, '0')}  ${name.toUpperCase()}`, R.x + 30, y + 22, { size: 40 });
      sp.types.forEach((t, k) => { ctx.fillStyle = TYPE_COLOR[t]; rr(R.x + 30 + k * 124, y + 74, 114, 30, 15); ctx.fill(); txt(t.toUpperCase(), R.x + 87 + k * 124, y + 72, { size: 24, align: 'center', shadow: false }); });
      const body = S.dex.caught[name] ? sp.dex : 'Tangkap Monsta ini untuk mengetahui lebih lanjut.';
      wrapText(body, R.w - 70, 30).slice(0, 3).forEach((l, k) => txt(l, R.x + 30, y + 118 + k * 36, { size: 30 }));
      return;
    }
    const lw = Math.min(460, SW * (PORTRAIT ? .92 : .4)), lx = PORTRAIT ? (SW - lw) / 2 : INSET.l + 30;
    const ly = PORTRAIT ? SH - INSET.b - this.vis * 46 - 36 : top + 96;
    panel(lx, ly, lw, this.vis * 46 + 24, true);
    for (let k = 0; k < this.vis; k++) {
      const n = this.scroll + k; if (n >= this.max) break;
      const nm = DEX[n + 1], yy = ly + 14 + k * 46;
      if (n === this.i) { ctx.fillStyle = 'rgba(233,196,106,.18)'; rr(lx + 10, yy - 2, lw - 20, 42, 8); ctx.fill(); }
      if (S.dex.caught[nm]) ctx.drawImage(ballSprite(), lx + 18, yy + 6, 28, 28);
      txt(String(n + 1).padStart(3, '0'), lx + 56, yy + 2, { size: 30, color: THEME.dim });
      txt(S.dex.seen[nm] ? nm.toUpperCase() : '- - - - -', lx + 122, yy + 2, { size: 30 });
    }
    if (!seenIt) txt('?', PORTRAIT ? SW / 2 : SW * .7, SH * .3, { size: 160, align: 'center', color: 'rgba(255,255,255,.2)' });
    txt('A: butiran  ·  ◀▶: lompat  ·  B: keluar', SW - INSET.r - 30, SH - INSET.b - 44, { size: 22, align: 'right', color: THEME.dim });
  }
}

// ---------- Kad jurulatih ----------
class CardScene {
  constructor(res) { this.res = res; }
  update() { if (Input.pressed.a || Input.pressed.b) { Game.pop(this); this.res(); } }
  draw() {
    screenBG('#1c2a5a', '#070b18');
    const w = Math.min(760, SW - INSET.l - INSET.r - 40), h = Math.min(560, SH - INSET.b - 60 - (IS_TOUCH ? 56 : 0));
    const x = INSET.l + (SW - INSET.l - INSET.r - w) / 2, y = (IS_TOUCH ? 56 : 0) + (SH - INSET.b - (IS_TOUCH ? 56 : 0) - h) / 2;
    panel(x, y, w, h);
    txt('KAD JURULATIH', x + 34, y + 24, { size: 40, color: THEME.accent });
    const rows = [['NAMA', S.name], ['WANG', kupang(S.money)], ['MONSTADEX', dexCount()[1] + ' ditangkap'], ['MASA MAIN', `${Math.floor(S.time / 3600)}:${String(Math.floor(S.time / 60) % 60).padStart(2, '0')}`], ['SERPIHAN SEJARAH', (window.Sejarah ? Sejarah.count() : 0) + ' / 12']];
    rows.forEach(([a, b], k) => { txt(a, x + 34, y + 84 + k * 40, { size: 26, color: THEME.dim }); txt(String(b), x + 300, y + 84 + k * 40, { size: 28 }); });
    if (window.Cloud && Cloud.user) txt('☁ ' + (Cloud.user.email || 'Log masuk'), x + 34, y + h - 44, { size: 22, color: '#9fd0ff' });
    ctx.imageSmoothingEnabled = false; ctx.drawImage(personSprite(S.look, 'down', 0), x + w - 170, y + 60, 128, 128); ctx.imageSmoothingEnabled = true;
    txt('LENCANA', x + 34, y + 296, { size: 28, color: THEME.accent });
    BADGES.forEach((b, k) => {
      const bx = x + 70 + (k % 4) * ((w - 80) / 4), by = y + 360 + Math.floor(k / 4) * 70, has = S.badges.includes(k);
      ctx.fillStyle = has ? b.col : 'rgba(255,255,255,.12)'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, r = i % 2 ? 16 : 26; ctx.lineTo(bx + Math.cos(a) * r, by + Math.sin(a) * r); }
      ctx.fill();
      if (has) { ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(bx - 5, by - 5, 5, 0, 7); ctx.fill(); }
      txt(has ? b.n.replace('Lencana ', '') : '???', bx + 32, by - 14, { size: 22, color: has ? THEME.text : THEME.dim });
    });
  }
}

// ---------- Tetapan & API menu ----------
function takeItem(name, n = 1) { S.bag[name] = (S.bag[name] || 0) - n; if (S.bag[name] <= 0) delete S.bag[name]; }
function giveItem(name, n = 1) { S.bag[name] = (S.bag[name] || 0) + n; }
function addMon(m, silent) {
  if (S.party.length < 6) S.party.push(m); else S.pc.push(m);
}
const Menus = {
  party(o) { return new Promise(r => Game.push(new PartyScene(o, r))); },
  summary(i) { return new Promise(r => Game.push(new SummaryScene(i, r))); },
  dex() { return new Promise(r => Game.push(new DexScene(r))); },
  card() { return new Promise(r => Game.push(new CardScene(r))); },
  async start() {
    let last = Menus._last || 0;
    while (true) {
      const opts = [], ids = [];
      if (S.flags.dex) { opts.push('MONSTADEX'); ids.push('dex'); }
      if (S.party.length) { opts.push('MONSTA'); ids.push('party'); }
      opts.push('BEG'); ids.push('bag');
      opts.push(S.name); ids.push('card');
      if (window.Sejarah) { opts.push('SEJARAH'); ids.push('sejarah'); }
      opts.push('SIMPAN'); ids.push('save');
      opts.push('FAIL SIMPANAN'); ids.push('savefile');
      opts.push('KEDAI PREMIUM'); ids.push('premium');
      opts.push('AKAUN'); ids.push('akaun');
      opts.push('PILIHAN'); ids.push('opt');
      opts.push('TUTUP'); ids.push('close');
      const i = await UI.choose(opts, { x: SW - INSET.r - 330, y: 16 + (IS_TOUCH ? 56 : 0), cancel: opts.length - 1, start: Math.min(last, opts.length - 1), w: 310, visible: 11 });
      last = i; Menus._last = i;
      const id = ids[i];
      if (id === 'close') return;
      if (id === 'dex') await Menus.dex();
      if (id === 'party') { const r = await Menus.party({ mode: 'field' }); if (r && r.fly) { await World.flyTo(r.fly, r.mon); return; } }
      if (id === 'bag') { const r = await Menus.bag({}); if (r === 'close') return; }
      if (id === 'card') await Menus.card();
      if (id === 'save') { await Menus.save(); return; }
      if (id === 'savefile') await SaveFile.open('game');
      if (id === 'sejarah') await Sejarah.book();
      if (id === 'premium') await Monet.openShop();
      if (id === 'akaun') await Cloud.openPanel();
      if (id === 'opt') {
        const o = await UI.choose(['KELAJUAN TEKS', 'GRAFIK', 'KOSTUM', 'BATAL'], { cancel: 3 });
        if (o === 0) { const sp = await UI.ask('Kelajuan teks?', ['LAMBAT', 'SEDERHANA', 'LAJU', 'BATAL'], { cancel: 3 }); if (sp < 3) S.textSpeed = [40, 70, 200][sp]; }
        if (o === 1) {
          const g = await UI.ask('Mod grafik? Pilih 3D RENDAH atau 2D KLASIK jika telefon kamu perlahan.', ['3D TINGGI', '3D RENDAH', '2D KLASIK', 'BATAL'], { cancel: 3 });
          if (g < 3) {
            const q = ['tinggi', 'rendah', '2d'][g];
            const reload = (q === '2d') === R3.ok;
            try { localStorage.setItem('msp_grafik_pilih', '1'); } catch (e) { }
            R3.setQuality(q);
            await UI.say('Grafik ditetapkan: ' + ['3D TINGGI', '3D RENDAH', '2D KLASIK'][g] + '.' + (reload ? ' SIMPAN permainan dan muat semula halaman untuk menukar mod grafik.' : ''));
          }
        }
        if (o === 2) {
          S.baseLook = S.baseLook || S.look;
          const looks = [S.baseLook, ...(S.looks || [])];
          const names = { kostum_emas: 'BAJU MELAYU EMAS', kostum_kebaya: 'KEBAYA MERAH', kostum_harimau: 'JERSI HARIMAU' };
          if (looks.length < 2) { await UI.say('Kamu belum memiliki kostum. Kostum boleh didapati di KEDAI PREMIUM.'); continue; }
          const k = await UI.choose([...looks.map(l => names[l] || 'PAKAIAN ASAL'), 'BATAL'], { cancel: looks.length });
          if (k < looks.length) { S.look = looks[k]; await UI.say('Pakaian ditukar!'); }
        }
      }
    }
  },
  async save() {
    const c = await UI.ask('Simpan permainan sekarang?', ['SIMPAN', 'SIMPAN + EKSPORT FAIL', 'BATAL'], { cancel: 2 });
    if (c === 2) return;
    saveGame();
    Snd.sfx('item');
    await UI.say('{P} telah menyimpan permainan.');
    if (c === 1) await SaveFile.open('game');
  },
  bagList(battle) {
    const names = Object.keys(S.bag).filter(n => S.bag[n] > 0 && ITEMS[n]);
    const norm = names.filter(n => !ITEMS[n].key), key = names.filter(n => ITEMS[n].key);
    return battle ? norm : [...norm, ...key];
  },
  async bag(o) {
    let start = 0;
    while (true) {
      const list = Menus.bagList(o.battle);
      const i = await UI.list(list.map(n => ({ l: n, r: ITEMS[n].key ? '' : 'x' + S.bag[n] })), { title: 'BEG', start, desc: k => ITEMS[list[k]].d, empty: 'Beg kosong.' });
      if (i < 0) return null;
      start = i;
      const name = list[i], it = ITEMS[name];
      if (o.battle) {
        if (it.ball) {
          if (!o.wild) { await UI.say('Tidak boleh menggunakan bola dalam pertarungan jurulatih!'); continue; }
          if (S.party.length >= 6 && S.pc.length >= 240) { await UI.say('PC dan kumpulan kamu sudah penuh!'); continue; }
          return { item: name };
        }
        if (it.heal || it.cure || it.revive || it.pp) {
          const t = await Menus.party({ mode: 'use', msg: `Guna ${name} pada siapa?` });
          if (t < 0) continue;
          if (!canUseItemOn(S.party[t], name)) { await UI.say('Ia tidak akan memberi apa-apa kesan.'); continue; }
          return { item: name, target: t };
        }
        await UI.say('Ini bukan masa untuk menggunakannya!');
        continue;
      }
      const c = await UI.ask(null, ['GUNA', 'BATAL'], { cancel: 1, y: SH - 160 - 106 });
      if (c !== 0) continue;
      const r = await useItemField(name);
      if (r === 'close') return 'close';
    }
  },
  async fly() {
    const towns = TOWNS.filter(t => S.visited[t.map]);
    const i = await UI.list(towns.map(t => ({ l: t.name })), { title: 'TERBANG KE MANA?' });
    return i < 0 ? null : towns[i];
  },
  async pc() {
    Snd.sfx('beep');
    await UI.say('{P} menghidupkan PC.');
    while (true) {
      const c = await UI.ask('Sistem Simpanan Monsta. Pilih perkhidmatan.', ['AMBIL MONSTA', 'SIMPAN MONSTA', 'TUTUP'], { cancel: 2 });
      if (c === 2) return;
      if (c === 0) {
        if (!S.pc.length) { await UI.say('Tiada Monsta dalam simpanan.'); continue; }
        if (S.party.length >= 6) { await UI.say('Kumpulan kamu sudah penuh!'); continue; }
        const i = await UI.list(S.pc.map(m => ({ l: monName(m), r: 'Tp' + m.lv })), { title: 'AMBIL', desc: k => SP[S.pc[k].sp].types.join('/') });
        if (i < 0) continue;
        const m = S.pc.splice(i, 1)[0]; S.party.push(m);
        await UI.say(`${monName(m)} telah diambil.`);
      }
      if (c === 1) {
        if (S.party.length <= 1) { await UI.say('Kamu perlu sekurang-kurangnya satu Monsta!'); continue; }
        const i = await Menus.party({ mode: 'pick', msg: 'Simpan Monsta yang mana?' });
        if (i < 0) continue;
        const rest = S.party.filter((m, k) => k !== i);
        if (!rest.some(alive)) { await UI.say('Kamu perlukan Monsta yang boleh bertarung!'); continue; }
        const m = S.party.splice(i, 1)[0]; healMon(m); S.pc.push(m);
        await UI.say(`${monName(m)} telah disimpan dalam PC.`);
      }
    }
  },
  async shop(stock, vending) {
    if (!vending) await UI.say('Selamat datang! Ada apa-apa yang boleh saya bantu?');
    while (true) {
      const c = await UI.ask(null, ['BELI', 'JUAL', 'KELUAR'], { cancel: 2, y: 8 });
      if (c === 2) break;
      if (c === 0) {
        let st = 0;
        while (true) {
          const i = await UI.list(stock.map(n => ({ l: n, r: kupang(ITEMS[n].p) })), { title: 'WANG: ' + kupang(S.money), start: st, desc: k => ITEMS[stock[k]].d });
          if (i < 0) break;
          st = i;
          const name = stock[i], p = ITEMS[name].p;
          if (S.money < p) { await UI.say('Maaf, wang kamu tidak mencukupi.'); continue; }
          const n = await UI.qty(Math.min(99, Math.floor(S.money / p)), p);
          if (!n) continue;
          if (await UI.yes(`${name} x${n}? Jumlahnya ${kupang(p * n)}.`)) {
            S.money -= p * n; giveItem(name, n); Snd.sfx('item');
            await UI.say('Terima kasih!');
            if (name === 'Bola Tangkap' && n >= 10) { giveItem('Bola Hebat', 1); await UI.say('Kamu beli 10 bola, jadi ini hadiah BOLA HEBAT untuk kamu!'); }
          }
        }
      }
      if (c === 1) {
        let st = 0;
        while (true) {
          const list = Menus.bagList(true);
          const price = n => ITEMS[n].sell || Math.floor((ITEMS[n].p || 0) / 2);
          const i = await UI.list(list.map(n => ({ l: n + ' x' + S.bag[n], r: price(n) ? kupang(price(n)) : '-' })), { title: 'JUAL', start: st, empty: 'Tiada barang untuk dijual.' });
          if (i < 0) break;
          st = i;
          const name = list[i], p = price(name);
          if (!p) { await UI.say('Maaf, saya tidak boleh membeli barang itu.'); continue; }
          const n = await UI.qty(S.bag[name], p);
          if (!n) continue;
          if (await UI.yes(`Saya boleh bayar ${kupang(p * n)}. Setuju?`)) { S.money += p * n; takeItem(name, n); Snd.sfx('item'); }
        }
      }
    }
    if (!vending) await UI.say('Terima kasih! Datang lagi!');
  }
};

async function useItemField(name) {
  const it = ITEMS[name];
  if (it.heal || it.cure || it.revive || it.pp) {
    while (S.bag[name]) {
      const t = await Menus.party({ mode: 'use', msg: `Guna ${name} pada siapa?` });
      if (t < 0) return;
      const m = S.party[t];
      if (!canUseItemOn(m, name)) { await UI.say('Ia tidak akan memberi apa-apa kesan.'); continue; }
      const before = m.hp;
      takeItem(name); applyItemEffect(m, name); Snd.sfx('heal');
      await UI.say(it.revive ? `${monName(m)} sudah sedar semula!` : m.hp > before ? `HP ${monName(m)} dipulihkan sebanyak ${m.hp - before}.` : `${monName(m)} sudah sembuh!`);
      return;
    }
    return;
  }
  if (it.stone) {
    const t = await Menus.party({ mode: 'pick', msg: `Guna ${name} pada siapa?`, label: m => evoByItem(m, name) ? 'BOLEH' : 'TIDAK BOLEH' });
    if (t < 0) return;
    const m = S.party[t], to = evoByItem(m, name);
    if (!to) { await UI.say('Ia tidak memberi apa-apa kesan.'); return; }
    takeItem(name);
    await evolve(m, to);
    return 'close';
  }
  if (it.rare) {
    const t = await Menus.party({ mode: 'pick', msg: 'Guna pada siapa?' });
    if (t < 0) return;
    const m = S.party[t]; if (m.lv >= 100) { await UI.say('Ia tidak memberi apa-apa kesan.'); return; }
    takeItem(name);
    m.exp = expFor(m.lv + 1); const oldMax = maxHp(m); m.lv++; m.hp += maxHp(m) - oldMax;
    Snd.sfx('level'); await UI.say(`${monName(m)} naik ke tahap ${m.lv}!`);
    for (const mv of movesAt(m, m.lv)) await learnMove(m, mv, s => UI.say(s));
    const to = evoByLevel(m); if (to) { await evolve(m, to); return 'close'; }
    return;
  }
  if (it.repel) { takeItem(name); S.repel = it.repel; Snd.sfx('item'); await UI.say(`{P} menyembur ${name.toUpperCase()}. Monsta liar yang lemah akan menjauhkan diri.`); return 'close'; }
  if (it.escape) {
    if (!World.map.escape) { await UI.say('Tidak boleh digunakan di sini!'); return; }
    takeItem(name); await World.escapeRope(); return 'close';
  }
  if (it.hm) {
    const mv = it.hm;
    const t = await Menus.party({ mode: 'pick', msg: `Ajar ${MOVES[mv].n.toUpperCase()} kepada siapa?`, label: m => m.moves.some(x => x.id === mv) ? 'SUDAH TAHU' : hmCompatible(m.sp, mv) ? 'BOLEH' : 'TIDAK BOLEH' });
    if (t < 0) return;
    const m = S.party[t];
    if (!hmCompatible(m.sp, mv)) { await UI.say(`${monName(m)} tidak boleh mempelajari ${MOVES[mv].n.toUpperCase()}.`); return; }
    await learnMove(m, mv, s => UI.say(s));
    return;
  }
  if (name === 'Basikal') { return (await World.toggleBike()) ? 'close' : undefined; }
  if (name === 'Seruling') { return (await World.playFlute()) ? 'close' : undefined; }
  if (name === 'Joran Buruk') { return (await World.fish()) ? 'close' : undefined; }
  await UI.say('Ini bukan masa untuk menggunakannya!');
}

// ---------- Simpan / muat ----------
const SAVE_KEY = 'monsta_seberang_perai_v1';
function saveGame() {
  if (!S) return;
  if (World.map) { S.map = World.map.id; S.x = World.p.x; S.y = World.p.y; S.dir = World.p.dir; }
  S.savedAt = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { console.warn(e); }
  if (window.Cloud && Cloud.user) Cloud.saveCloud();
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; return JSON.parse(s); } catch (e) { return null; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
