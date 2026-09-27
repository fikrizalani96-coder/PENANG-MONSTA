'use strict';
// ===== Menu: mula, Monsta, beg, Monstadex, PC, kedai, kad, simpan =====
class ListScene {
  constructor(items, res, o = {}) {
    this.items = items; this.res = res; this.o = o; this.transparent = true;
    this.i = clamp(o.start || 0, 0, Math.max(0, items.length - 1));
    this.x = o.x !== undefined ? o.x : 250; this.y = o.y !== undefined ? o.y : 12;
    this.w = o.w || SW - this.x - 8; this.h = o.h || SH - 172; this.row = 38;
    this.vis = Math.floor((this.h - 36 - (o.title ? 34 : 0)) / this.row); this.scroll = 0;
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
    let y0 = this.y + 18;
    if (this.o.title) { txt(this.o.title, this.x + 24, y0 - 2, { color: '#4060a0' }); y0 += 34; }
    const end = Math.min(this.items.length, this.scroll + this.vis);
    for (let k = this.scroll; k < end; k++) {
      const it = this.items[k], yy = y0 + (k - this.scroll) * this.row;
      txt(it.l, this.x + 44, yy, { color: it.dim ? '#909098' : '#202028' });
      if (it.r !== undefined) txt(String(it.r), this.x + this.w - 26, yy, { align: 'right', color: it.dim ? '#909098' : '#202028' });
      if (k === this.i) cursor(this.x + 22, yy + 7);
    }
    if (!this.items.length) txt(this.o.empty || '(kosong)', this.x + 44, y0, { color: '#909098' });
    if (this.scroll > 0) txt('▲', this.x + this.w - 34, this.y + 6, { size: 22 });
    if (end < this.items.length) txt('▼', this.x + this.w - 34, this.y + this.h - 30, { size: 22 });
    if (this.o.desc && this.items.length) {
      panel(8, SH - 152, SW - 16, 144);
      wrapText(fmt(this.o.desc(this.i)), SW - 80).slice(0, 3).forEach((l, k) => txt(l, 36, SH - 124 + k * 36));
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
    panel(SW - 320, SH - 240, 312, 84, true);
    txt('x' + String(this.n).padStart(2, '0'), SW - 290, SH - 214);
    if (this.price) txt('RM' + this.price * this.n, SW - 36, SH - 214, { align: 'right' });
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
        const c = await UI.choose(opts, { cancel: o.mode === 'forced' ? null : 2, y: SH - 160 - opts.length * 38 - 30 });
        if (c === 0) {
          if (!alive(m)) { await UI.say('Tiada tenaga lagi untuk bertarung!'); return; }
          if (this.i === o.cur) { await UI.say(`${monName(m)} sedang bertarung!`); return; }
          Game.pop(this); this.res(this.i); return;
        }
        if (c === 1) await Menus.summary(this.i);
        return;
      }
      // mod padang
      const field = [];
      for (const mv of ['tebas', 'terbang', 'ombak']) if (m.moves.some(x => x.id === mv)) field.push(mv);
      const opts = ['STATUS', 'SUSUN', ...field.map(f => MOVES[f].n.toUpperCase()), 'BATAL'];
      const c = await UI.choose(opts, { cancel: opts.length - 1, y: SH - 160 - opts.length * 38 - 30 });
      if (c === 0) await Menus.summary(this.i);
      else if (c === 1) { this.swap = this.i; this.msg = 'Tukar dengan yang mana?'; }
      else if (c >= 2 && c < opts.length - 1) {
        const mv = field[c - 2];
        if (mv === 'terbang') {
          if (S.badges.length < 3) { await UI.say('Kamu perlukan LENCANA PETIR untuk menggunakan TERBANG di luar pertarungan.'); return; }
          if (!World.map.outdoor) { await UI.say('Tidak boleh terbang di sini!'); return; }
          const dest = await Menus.fly();
          if (dest) { Game.pop(this); this.res({ fly: dest, mon: m }); }
        } else if (mv === 'tebas') await UI.say('Gunakan TEBAS dengan menghadap semak kecil dan tekan A.');
        else await UI.say('Gunakan OMBAK dengan menghadap air dan tekan A.');
      }
    } finally { this.busy = false; }
  }
  draw() {
    ctx.fillStyle = '#e8f0e0'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#d0e0c8'; for (let y = 0; y < SH; y += 24) ctx.fillRect(0, y, SW, 12);
    S.party.forEach((m, k) => {
      const y = 8 + k * 52, sel = k === this.i;
      ctx.fillStyle = sel ? '#f8e8a0' : '#f8f8f0'; rr(20, y, SW - 40, 48, 8); ctx.fill();
      ctx.strokeStyle = this.swap === k ? '#e04040' : sel ? '#d0a020' : '#90a090'; ctx.lineWidth = 3; rr(20, y, SW - 40, 48, 8); ctx.stroke();
      ctx.imageSmoothingEnabled = false;
      const bob = sel && Math.floor(Game.t * 4) % 2 ? -3 : 0;
      ctx.drawImage(monstaSprite(m.sp), 28, y - 4 + bob, 52, 52);
      setFont(28); const nw = ctx.measureText(monName(m)).width;
      txt(monName(m), 88, y + 9, { size: nw > 190 ? 24 : 28 });
      txt('Tp' + m.lv, 292, y + 9, { size: 26 });
      const badge = !alive(m) ? ['PSN', '#c04040'] : m.status ? [STATUS_NAME[m.status], STATUS_COL[m.status]] : null;
      if (badge) { ctx.fillStyle = badge[1]; rr(356, y + 12, 50, 24, 5); ctx.fill(); txt(badge[0], 381, y + 12, { size: 22, color: '#fff', align: 'center' }); }
      const mh = maxHp(m), p = m.hp / mh;
      if (this.o.label) txt(this.o.label(m), SW - 44, y + 9, { size: 26, align: 'right', color: '#406080' });
      else {
        ctx.fillStyle = '#404850'; ctx.fillRect(416, y + 17, 136, 14);
        ctx.fillStyle = p > .5 ? '#48c048' : p > .2 ? '#e8c030' : '#e04040'; ctx.fillRect(418, y + 19, 132 * p, 10);
        txt(`${m.hp}/${mh}`, SW - 36, y + 9, { size: 26, align: 'right' });
      }
    });
    panel(8, SH - 152, SW - 16, 144);
    txt(this.msg, 36, SH - 124);
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
    ctx.fillStyle = '#f0ece0'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = TYPE_COLOR[sp.types[0]]; ctx.fillRect(0, 0, SW, 54);
    txt(`No.${String(sp.no).padStart(3, '0')}  ${monName(m)}`, 20, 10, { color: '#fff', shadow: '#0005' });
    txt('Tp' + m.lv, SW - 20, 10, { color: '#fff', align: 'right', shadow: '#0005' });
    ctx.fillStyle = '#fff'; rr(20, 66, 230, 230, 12); ctx.fill();
    ctx.drawImage(monstaSprite(m.sp), 25, 71, 220, 220);
    sp.types.forEach((t, k) => { ctx.fillStyle = TYPE_COLOR[t]; rr(20 + k * 118, 304, 110, 30, 6); ctx.fill(); txt(t.toUpperCase(), 75 + k * 118, 304, { size: 26, color: '#fff', align: 'center' }); });
    txt('STATUS: ' + (!alive(m) ? 'PENGSAN' : m.status ? m.status.toUpperCase() : 'OK'), 20, 342, { size: 28 });
    const rows = [['HP', `${m.hp}/${maxHp(m)}`], ...['atk', 'def', 'spa', 'spd', 'spe'].map(k => [STAT_NAME[k], stat(m, k)]),
    ['EXP', m.exp], ['KE TAHAP SETERUSNYA', m.lv < 100 ? expFor(m.lv + 1) - m.exp : 0]];
    rows.forEach(([a, b], k) => { txt(a, 272, 66 + k * 30, { size: 28 }); txt(String(b), SW - 24, 66 + k * 30, { size: 28, align: 'right' }); });
    ctx.fillStyle = '#fff'; rr(260, 322, SW - 280, 150, 10); ctx.fill();
    m.moves.forEach((x, k) => {
      const d = MOVES[x.id], yy = 330 + k * 35;
      ctx.fillStyle = TYPE_COLOR[d.t]; rr(272, yy + 4, 90, 26, 5); ctx.fill();
      txt(d.t.toUpperCase(), 317, yy + 3, { size: 22, color: '#fff', align: 'center' });
      txt(d.n, 374, yy, { size: 28 }); txt(`PP ${x.pp}/${d.pp}`, SW - 36, yy, { size: 28, align: 'right' });
    });
    txt('▲▼ tukar Monsta', 20, 400, { size: 22, color: '#807868' }); txt('A/B keluar', 20, 426, { size: 22, color: '#807868' });
  }
}

// ---------- Monstadex ----------
class DexScene {
  constructor(res) { this.res = res; this.i = 0; this.scroll = 0; this.detail = false; this.max = MONSTA_RAW.length; }
  update() {
    if (this.detail) { if (Input.pressed.a || Input.pressed.b) this.detail = false; if (Input.pressed.up) this.move(-1); if (Input.pressed.down) this.move(1); return; }
    if (Input.pressed.up) this.move(-1);
    if (Input.pressed.down) this.move(1);
    if (Input.pressed.left) this.move(-8);
    if (Input.pressed.right) this.move(8);
    if (Input.pressed.a && S.dex.seen[DEX[this.i + 1]]) { this.detail = true; Snd.sfx('beep'); }
    if (Input.pressed.b) { Game.pop(this); this.res(); }
  }
  move(d) { this.i = clamp(this.i + d, 0, this.max - 1); if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + 10) this.scroll = this.i - 9; }
  draw() {
    ctx.fillStyle = '#c83838'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#a02828'; ctx.fillRect(0, 0, SW, 50);
    txt('MONSTADEX', 20, 8, { color: '#fff', size: 36 });
    const [seen, caught] = dexCount();
    txt(`DILIHAT ${seen}   DITANGKAP ${caught}`, SW - 20, 12, { color: '#fff', align: 'right', size: 28 });
    const name = DEX[this.i + 1], seenIt = S.dex.seen[name];
    if (this.detail) {
      ctx.fillStyle = '#f8f8f0'; rr(20, 64, SW - 40, SH - 84, 12); ctx.fill();
      ctx.drawImage(monstaSprite(name), 30, 70, 240, 240);
      const sp = SP[name];
      txt(`No.${String(sp.no).padStart(3, '0')}`, 290, 80); txt(name.toUpperCase(), 290, 114, { size: 40 });
      sp.types.forEach((t, k) => { ctx.fillStyle = TYPE_COLOR[t]; rr(290 + k * 118, 166, 110, 30, 6); ctx.fill(); txt(t.toUpperCase(), 345 + k * 118, 166, { size: 26, color: '#fff', align: 'center' }); });
      const body = S.dex.caught[name] ? sp.dex : 'Tangkap Monsta ini untuk mengetahui lebih lanjut.';
      wrapText(body, SW - 100, 30).forEach((l, k) => txt(l, 44, 320 + k * 32, { size: 30 }));
      return;
    }
    ctx.fillStyle = '#f8f8f0'; rr(20, 64, 390, SH - 84, 12); ctx.fill();
    for (let k = 0; k < 10; k++) {
      const n = this.scroll + k; if (n >= this.max) break;
      const nm = DEX[n + 1], yy = 74 + k * 39;
      if (n === this.i) { ctx.fillStyle = '#f8e088'; ctx.fillRect(26, yy - 2, 378, 38); }
      if (S.dex.caught[nm]) ctx.drawImage(ballSprite(), 34, yy + 4, 26, 26);
      txt(String(n + 1).padStart(3, '0'), 66, yy, { size: 30 });
      txt(S.dex.seen[nm] ? nm.toUpperCase() : '----------', 124, yy, { size: 30 });
    }
    ctx.fillStyle = '#f8f8f0'; rr(426, 64, SW - 446, 260, 12); ctx.fill();
    if (seenIt) ctx.drawImage(monstaSprite(name), 440, 70, 250, 250);
    else { txt('?', 566, 150, { size: 90, align: 'center', color: '#c0c0c0' }); }
    txt('A: butiran', 440, 340, { color: '#fff', size: 28 }); txt('B: keluar', 440, 372, { color: '#fff', size: 28 }); txt('◀▶: lompat', 440, 404, { color: '#fff', size: 28 });
  }
}

// ---------- Kad jurulatih ----------
class CardScene {
  constructor(res) { this.res = res; }
  update() { if (Input.pressed.a || Input.pressed.b) { Game.pop(this); this.res(); } }
  draw() {
    ctx.fillStyle = '#304880'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#f0f0e0'; rr(30, 24, SW - 60, SH - 48, 16); ctx.fill();
    txt('KAD JURULATIH', 60, 44, { size: 36, color: '#304880' });
    txt('NAMA: {P}'.replace('{P}', S.name), 60, 100);
    txt('WANG: RM' + S.money, 60, 140);
    const [, c] = dexCount(); txt('MONSTADEX: ' + c, 60, 180);
    const h = Math.floor(S.time / 3600), mnt = Math.floor(S.time / 60) % 60;
    txt(`MASA MAIN: ${h}:${String(mnt).padStart(2, '0')}`, 60, 220);
    ctx.drawImage(personSprite(S.look, 'down', 0), SW - 220, 70, 160, 160);
    txt('LENCANA', 60, 270, { color: '#304880' });
    BADGES.forEach((b, k) => {
      const x = 80 + (k % 4) * 150, y = 320 + Math.floor(k / 4) * 70, has = S.badges.includes(k);
      ctx.fillStyle = has ? b.col : '#d0d0c8'; ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.283, r = i % 2 ? 16 : 26; ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); }
      ctx.fill();
      if (has) { ctx.fillStyle = '#fff8'; ctx.beginPath(); ctx.arc(x - 5, y - 5, 5, 0, 7); ctx.fill(); }
      txt(has ? b.n.replace('Lencana ', '') : '???', x + 34, y - 14, { size: 24, color: has ? '#202028' : '#909090' });
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
      opts.push('SIMPAN'); ids.push('save');
      opts.push('PILIHAN'); ids.push('opt');
      opts.push('TUTUP'); ids.push('close');
      const i = await UI.choose(opts, { y: 8, cancel: opts.length - 1, start: Math.min(last, opts.length - 1), w: 230 });
      last = i; Menus._last = i;
      const id = ids[i];
      if (id === 'close') return;
      if (id === 'dex') await Menus.dex();
      if (id === 'party') { const r = await Menus.party({ mode: 'field' }); if (r && r.fly) { await World.flyTo(r.fly, r.mon); return; } }
      if (id === 'bag') { const r = await Menus.bag({}); if (r === 'close') return; }
      if (id === 'card') await Menus.card();
      if (id === 'save') { await Menus.save(); return; }
      if (id === 'opt') {
        const sp = await UI.ask('Kelajuan teks?', ['LAMBAT', 'SEDERHANA', 'LAJU', 'BATAL'], { cancel: 3 });
        if (sp < 3) S.textSpeed = [40, 70, 200][sp];
      }
    }
  },
  async save() {
    if (await UI.yes('Simpan permainan sekarang?')) {
      saveGame();
      Snd.sfx('item');
      await UI.say('{P} telah menyimpan permainan.');
    }
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
          const i = await UI.list(stock.map(n => ({ l: n, r: 'RM' + ITEMS[n].p })), { title: 'WANG: RM' + S.money, start: st, desc: k => ITEMS[stock[k]].d });
          if (i < 0) break;
          st = i;
          const name = stock[i], p = ITEMS[name].p;
          if (S.money < p) { await UI.say('Maaf, wang kamu tidak mencukupi.'); continue; }
          const n = await UI.qty(Math.min(99, Math.floor(S.money / p)), p);
          if (!n) continue;
          if (await UI.yes(`${name} x${n}? Jumlahnya RM${p * n}.`)) {
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
          const i = await UI.list(list.map(n => ({ l: n + ' x' + S.bag[n], r: price(n) ? 'RM' + price(n) : '-' })), { title: 'JUAL', start: st, empty: 'Tiada barang untuk dijual.' });
          if (i < 0) break;
          st = i;
          const name = list[i], p = price(name);
          if (!p) { await UI.say('Maaf, saya tidak boleh membeli barang itu.'); continue; }
          const n = await UI.qty(S.bag[name], p);
          if (!n) continue;
          if (await UI.yes(`Saya boleh bayar RM${p * n}. Setuju?`)) { S.money += p * n; takeItem(name, n); Snd.sfx('item'); }
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
  S.map = World.map.id; S.x = World.p.x; S.y = World.p.y; S.dir = World.p.dir;
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { console.warn(e); }
}
function loadGame() {
  try { const s = localStorage.getItem(SAVE_KEY); if (!s) return null; return JSON.parse(s); } catch (e) { return null; }
}
function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
