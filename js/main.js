'use strict';
// ===== Skrin tajuk, permainan baru, tamat =====
// ---------- Skrin tajuk: pemandangan piksel senja di pantai Seberang Perai ----------
const TitleArt = {
  cv: null, g: null,
  px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); },
  cloud(g, x, y, w, c) {
    const h = Math.max(3, w / 5 | 0);
    this.px(g, x + 2, y, w - 4, h, c); this.px(g, x, y + 2, w, h - 2, c);
    this.px(g, x + w * .2, y - 3, w * .35, 4, c); this.px(g, x + w * .45, y - 5, w * .3, 6, c);
  },
  ridge(g, W, base, amp, seed, c, peakX, peakH) {
    g.fillStyle = c;
    for (let x = 0; x < W; x++) {
      let h = amp * (.55 + .25 * Math.sin(x * .045 + seed) + .15 * Math.sin(x * .13 + seed * 3) + .05 * Math.sin(x * .41 + seed));
      if (peakX !== undefined) h += Math.max(0, peakH * (1 - Math.abs(x - peakX) / (peakH * 2.4)));
      g.fillRect(x, Math.round(base - h), 1, Math.round(h) + 1);
    }
  },
  palm(g, x, y, h, t, c) {
    for (let i = 0; i < h; i++) this.px(g, x + Math.round(Math.sin(i / h * 1.4) * 3), y - i, 2, 1, c);
    const tx = x + Math.round(Math.sin(1.4) * 3), ty = y - h, sw = Math.sin(t * 1.5 + x) * 1.2;
    for (const [dx, dy] of [[-1, 0], [1, 0], [-.7, .5], [.7, .5], [-.3, -.6], [.4, -.5]]) {
      for (let k = 1; k <= 9; k++) this.px(g, tx + dx * k + sw * k / 9, ty + dy * k + (k * k) / 14, 2, 1, c);
    }
  },
  house(g, x, y, c) { // rumah kampung bertiang
    this.px(g, x, y - 9, 16, 6, c);
    for (let i = 0; i < 6; i++) this.px(g, x - 2 + i, y - 10 - i, 20 - i * 2, 1, c);
    this.px(g, x + 1, y - 3, 1, 4, c); this.px(g, x + 14, y - 3, 1, 4, c); this.px(g, x + 7, y - 3, 1, 4, c);
    this.px(g, x + 6, y - 8, 3, 3, '#ffcf6a');
  },
  // heroBottom: kedudukan kaki wira dalam piksel logik UI
  draw(t, heroBottom) {
    const P = 4, W = Math.ceil(SW / P), H = Math.ceil(SH / P);
    if (!this.cv || this.cv.width !== W || this.cv.height !== H) this.cv = null;
    if (!this.cv) { const [c, g] = mkCanvas(W, H); this.cv = c; this.g = g; }
    const g = this.g, por = PORTRAIT, px = this.px.bind(this);
    const hz = Math.round(H * (por ? .42 : .47));
    // langit berjalur dengan tepi berdither
    const bands = ['#1b1440', '#2a1a52', '#43206a', '#6a2a78', '#9a3a7a', '#c84e72', '#e8705e', '#f89a56', '#ffc25e'];
    const bh = hz / bands.length;
    bands.forEach((c, i) => px(g, 0, Math.floor(i * bh), W, Math.ceil(bh) + 1, c));
    for (let i = 1; i < bands.length; i++) { const y = Math.floor(i * bh); g.fillStyle = bands[i]; for (let x = i % 2; x < W; x += 2) g.fillRect(x, y - 1, 1, 1); g.fillStyle = bands[i - 1]; for (let x = (i + 1) % 2; x < W; x += 3) g.fillRect(x, y, 1, 1); }
    for (let i = 0; i < 46; i++) if (Math.sin(t * 2 + i * 1.7) > -.3) px(g, hash(i, 1) * W, hash(i, 2) * hz * .45, 1, 1, i % 4 ? '#ffe8f8' : '#fff');
    // matahari berjalur retro
    const sr = Math.round(Math.min(H * (por ? .1 : .17), W * .16)), sx = Math.round(W * (por ? .68 : .66)), sy = hz - Math.round(sr * .3);
    g.fillStyle = 'rgba(255,190,110,.18)'; g.beginPath(); g.arc(sx, sy, sr * 1.7, 0, 7); g.fill();
    for (let y = -sr; y <= sr; y++) {
      const yy = sy + y; if (yy >= hz) break;
      const k = (y + sr) / (2 * sr);
      if (k > .5 && ((y + Math.floor(t * 5)) % 6 + 6) % 6 < 1 + (k - .5) * 5) continue;
      const half = Math.floor(Math.sqrt(sr * sr - y * y));
      px(g, sx - half, yy, half * 2 + 1, 1, k < .35 ? '#fff4b8' : k < .65 ? '#ffd65c' : '#ff9a48');
    }
    for (let i = 0; i < 6; i++) { const cw = 20 + hash(i, 3) * 26 | 0; const x = (hash(i, 4) * (W + 80) + t * (1.5 + i * .6)) % (W + cw * 2) - cw; this.cloud(g, x, 6 + hash(i, 5) * hz * .55, cw, i % 2 ? '#f09ab0' : '#ffc4b0'); }
    // bukit jauh dan Bukit Mertajam
    this.ridge(g, W, hz, H * .07, 1.3, '#7a3e7e');
    this.ridge(g, W, hz, H * .045, 4.1, '#58306a', W * .24, H * .12);
    // laut dengan pantulan matahari
    const seaH = Math.round(H * (por ? .06 : .09));
    px(g, 0, hz, W, seaH, '#3c2a70');
    for (let y = hz + 1; y < hz + seaH; y += 2) {
      px(g, 0, y, W, 1, '#4a347e');
      const f = 1 - (y - hz) / seaH, n = 3 + (y % 3);
      for (let i = 0; i < n; i++) { const len = 2 + hash(y, i, Math.floor(t * 3)) * 8 * f; px(g, sx - sr * .9 * f + hash(y, i + 5, Math.floor(t * 3)) * sr * 1.8 * f, y, len, 1, i % 2 ? '#ffb060' : '#ffe08a'); }
    }
    for (let i = 0; i < 2; i++) { const bx = (hash(i, 6) * W + t * (2 + i)) % (W + 30) - 15, by = hz + 3 + i * 4; px(g, bx, by, 12, 2, '#1c1030'); px(g, bx + 2, by + 2, 8, 1, '#1c1030'); for (let k = 0; k < 7; k++) px(g, bx + 5, by - k, 1 + (7 - k) * .6, 1, '#2a1838'); }
    // pantai: siluet kampung & pokok kelapa
    const shore = hz + seaH;
    px(g, 0, shore, W, 3, '#2a1838');
    this.house(g, W * .08, shore + 1, '#2a1838'); this.house(g, W * .2, shore + 1, '#2a1838'); this.house(g, W * .86, shore + 1, '#2a1838');
    for (const [fx, fh] of [[.03, 20], [.15, 24], [.3, 18], [.78, 22], [.94, 26]]) this.palm(g, Math.round(W * fx), shore + 2, fh, t, '#1f1030');
    // sawah padi berlapis
    let y = shore + 3, row = 0, rh = 2;
    while (y < H) { px(g, 0, y, W, rh, row % 2 ? '#5f9a32' : '#72ac3c'); if (row % 2) for (let x = (row * 7) % 5; x < W; x += 5) px(g, x, y, 1, 1, '#d8cc5c'); y += rh; rh = Math.min(10, rh + 1); row++; }
    // bukit kecil tempat wira berdiri
    const hb = Math.round(heroBottom / P), kx = W / 2, kw = por ? W * .62 : W * .42;
    g.fillStyle = '#3f7a2a'; g.beginPath(); g.ellipse(kx, hb + 3, kw / 2 + 2, 10, 0, 0, 7); g.fill();
    g.fillStyle = '#5aa33a'; g.beginPath(); g.ellipse(kx, hb + 1, kw / 2, 8, 0, 0, 7); g.fill();
    g.fillStyle = '#74bc48'; g.beginPath(); g.ellipse(kx - 4, hb - 1, kw / 2.6, 4, 0, 0, 7); g.fill();
    for (let i = 0; i < 14; i++) px(g, kx - kw / 2 + 6 + hash(i, 7) * (kw - 12), hb - 2 + hash(i, 8) * 6, 1, 1, ['#fff', '#ffe060', '#ff8aa8'][i % 3]);
    // Jentayu terbang merentasi langit
    const jp = (t * 16) % (W + 140) - 70, jy = hz * (por ? .78 : .42) + Math.sin(t * 2.2) * 3;
    g.imageSmoothingEnabled = false; g.drawImage(monstaSprite('Jentayu'), W - jp, jy, 40, 40);
    // tiga Monsta pemula
    const gap = por ? 54 : 70;
    ['Anakpadi', 'Percik', 'Penyucil'].forEach((n, k) => {
      const hop = Math.max(0, Math.sin(t * 3 + k * 2.1) - .75) * 12;
      g.drawImage(monstaSprite(n), Math.round(kx - 32 + (k - 1) * gap), Math.round(hb - 62 - hop), 64, 64);
    });
    // kunang-kunang
    for (let i = 0; i < 16; i++) { const fx = (hash(i, 9) * W + Math.sin(t + i) * 6) % W, fy = hb - 10 - ((t * 6 + hash(i, 10) * 80) % 80); if (Math.sin(t * 4 + i) > 0) px(g, fx, fy, 1, 1, '#fff2a0'); }
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(this.cv, 0, 0, W * P, H * P);
    ctx.imageSmoothingEnabled = true;
  }
};
// Logo piksel: MONSTA emas, reben merah SEBERANG PERAI, cogan JEJAK SEJARAH
function drawPixelLogo(cx, top, sz, t, alpha) {
  ctx.save(); ctx.globalAlpha = alpha;
  const F = "'Press Start 2P', 'Courier New', monospace";
  ctx.font = `${sz}px ${F}`; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  const o = Math.max(2, Math.round(sz / 14));
  // bayang timbul
  for (let i = 5; i >= 1; i--) { ctx.fillStyle = i > 3 ? '#1a0a04' : '#5a2a0c'; ctx.fillText('MONSTA', cx + i * o * .5, top + i * o); }
  // garis luar piksel
  ctx.fillStyle = '#1a0a04';
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, -1], [-1, 1], [1, 1]]) ctx.fillText('MONSTA', cx + dx * o, top + dy * o);
  const gr = ctx.createLinearGradient(0, top, 0, top + sz);
  gr.addColorStop(0, '#fff7c8'); gr.addColorStop(.3, '#fff7c8'); gr.addColorStop(.3, '#ffd84a'); gr.addColorStop(.62, '#ffd84a'); gr.addColorStop(.62, '#f5a322'); gr.addColorStop(.85, '#f5a322'); gr.addColorStop(.85, '#c8661a'); gr.addColorStop(1, '#c8661a');
  ctx.fillStyle = gr; ctx.fillText('MONSTA', cx, top);
  const tw = ctx.measureText('MONSTA').width;
  // kilauan bintang piksel
  const ph = (t * .8) % 1, gi = Math.floor(t * .8);
  if (ph < .4) { const r = Math.round(o * 3 * Math.sin(ph / .4 * Math.PI)), gx = cx - tw / 2 + hash(gi, 1) * tw, gy = top + sz * (.15 + hash(gi, 2) * .5); ctx.fillStyle = '#fff'; ctx.fillRect(gx - r, gy - o / 2, r * 2, o); ctx.fillRect(gx - o / 2, gy - r, o, r * 2); }
  // reben
  const rs = Math.round(sz * .3), rw = Math.max(tw * .82, rs * 16), rh = rs * 2.2, ry = top + sz + o * 5;
  ctx.fillStyle = '#6e0c14';
  for (const s of [-1, 1]) { const ex = cx + s * (rw / 2 + rs * 1.2); ctx.fillRect(Math.min(ex, cx + s * rw / 2), ry + rs * .5, rs * 1.6, rh); ctx.fillStyle = '#4a0610'; ctx.fillRect(cx + s * rw / 2 - (s > 0 ? 0 : rs * .6), ry + rh, rs * .6, rs * .5); ctx.fillStyle = '#6e0c14'; }
  ctx.fillStyle = '#1a0a04'; ctx.fillRect(cx - rw / 2 - o, ry - o, rw + 2 * o, rh + 2 * o);
  ctx.fillStyle = '#d42a36'; ctx.fillRect(cx - rw / 2, ry, rw, rh);
  ctx.fillStyle = '#f0525a'; ctx.fillRect(cx - rw / 2, ry, rw, o * 1.5);
  ctx.fillStyle = '#a0141e'; ctx.fillRect(cx - rw / 2, ry + rh - o * 1.5, rw, o * 1.5);
  ctx.font = `${rs}px ${F}`;
  ctx.fillStyle = '#3a0408'; ctx.fillText('SEBERANG PERAI', cx + o * .6, ry + (rh - rs) / 2 + o * .6);
  ctx.fillStyle = '#fff'; ctx.fillText('SEBERANG PERAI', cx, ry + (rh - rs) / 2);
  // cogan kata
  const ts = Math.round(sz * .2), ty = ry + rh + o * 5;
  ctx.font = `${ts}px ${F}`;
  ctx.fillStyle = '#1a0a04'; ctx.fillText('JEJAK SEJARAH', cx + o * .5, ty + o * .5);
  ctx.fillStyle = '#ffd84a'; ctx.fillText('JEJAK SEJARAH', cx, ty);
  const lw = ctx.measureText('JEJAK SEJARAH').width;
  for (const s of [-1, 1]) { ctx.fillRect(cx + s * (lw / 2 + ts * .8) - (s < 0 ? ts * 3 : 0), ty + ts * .4, ts * 3, Math.max(2, o * .6)); ctx.fillRect(cx + s * (lw / 2 + ts * 4.4) - ts * .3, ty + ts * .2, ts * .6, ts * .6); }
  ctx.restore();
  return ty + ts - top; // tinggi keseluruhan
}
class TitleScene {
  constructor() { this.t = 0; this.items = null; this.sel = 0; this.boxes = []; this.res = null; this.flash = 0; this.landed = false; }
  menu(items) { const keep = this.items && this.items[this.sel] && items.findIndex(i => i.id === this.items[this.sel].id); this.items = items; this.sel = keep > 0 ? keep : 0; return new Promise(r => { this.res = r; }); }
  get intro() { return clamp((this.t - .3) / .7, 0, 1); }
  update(dt) {
    this.t += dt;
    if (!this.landed && this.intro >= 1) { this.landed = true; this.flash = .55; Snd.sfx('level'); }
    this.flash = Math.max(0, this.flash - dt * 1.8);
    if (!this.items || !this.res) return;
    if (this.t < 1 && (Input.pressed.a || Input.pressed.start || Input.ptr.tap)) { this.t = 1.1; return; } // langkau intro
    const n = this.items.length;
    if (Input.pressed.up || Input.pressed.left) { this.sel = (this.sel + n - 1) % n; Snd.sfx('move'); }
    if (Input.pressed.down || Input.pressed.right) { this.sel = (this.sel + 1) % n; Snd.sfx('move'); }
    const P = Input.ptr;
    if (P.moved || P.tap) {
      const i = this.boxes.findIndex(b => P.x >= b.x && P.x <= b.x + b.w && P.y >= b.y && P.y <= b.y + b.h);
      if (i >= 0 && i !== this.sel && !P.tap && !IS_TOUCH) { this.sel = i; Snd.sfx('move'); }
      if (i >= 0 && P.tap) { this.sel = i; this.choose(); return; }
    }
    if (Input.pressed.a || Input.pressed.start) this.choose();
  }
  choose() { if (!this.res || this.t < 1.05) return; Snd.sfx('beep'); const r = this.res; this.res = null; r(this.items[this.sel].id); }
  layout() {
    const items = this.items || [{ label: '' }, { label: '' }, { label: '' }, { label: '' }]; // anggaran semasa menunggu
    const avail = SW - INSET.l - INSET.r, cx = INSET.l + avail / 2;
    const w = Math.min(PORTRAIT ? 620 : 540, avail - 40), rowH = PORTRAIT ? 66 : 50, subH = PORTRAIT ? 30 : 24, pad = 20;
    const h = pad * 2 + items.reduce((a, it) => a + rowH + (it.sub ? subH : 0), 0);
    const x = cx - w / 2, y = SH - INSET.b - (PORTRAIT ? 64 : 40) - h;
    let yy = y + pad;
    const rows = items.map(it => { const rh = rowH + (it.sub ? subH : 0); const b = { x: x + 10, y: yy, w: w - 20, h: rh, it }; yy += rh; return b; });
    return { x, y, w, h, rows };
  }
  draw() {
    const t = this.t, L = this.layout();
    TitleArt.draw(t, L.y - (PORTRAIT ? 30 : 16));
    // logo
    const avail = SW - INSET.l - INSET.r, cx = INSET.l + avail / 2;
    const sz = PORTRAIT ? Math.min(92, (avail - 60) / 6.4) : 84;
    const top0 = PORTRAIT ? 90 + (IS_TOUCH ? 30 : 0) : 26;
    if (this.intro > 0) {
      const e = this.intro, drop = e < 1 ? -(1 - e) * (1 - e) * 260 + Math.sin(e * Math.PI) * 18 : Math.sin(t * 1.6) * 3;
      drawPixelLogo(cx, top0 + drop, sz, t, Math.min(1, e * 2));
    }
    // menu klasik
    this.boxes = L.rows;
    if (this.items && t > 1.05) {
      const a = clamp((t - 1.05) / .35, 0, 1);
      ctx.save(); ctx.globalAlpha = a;
      paper(L.x, L.y, L.w, L.h, '#ec7468');
      L.rows.forEach((b, i) => {
        const sel = i === this.sel, fs = PORTRAIT ? 34 : 30;
        if (sel) { ctx.fillStyle = 'rgba(236,116,104,.16)'; rr(b.x + 6, b.y + 2, b.w - 12, b.h - 4, 8); ctx.fill(); const bob = Math.sin(t * 8) * 2; ctx.fillStyle = '#ec5a4e'; ctx.beginPath(); ctx.moveTo(b.x + 18 + bob, b.y + 14); ctx.lineTo(b.x + 32 + bob, b.y + 24); ctx.lineTo(b.x + 18 + bob, b.y + 34); ctx.closePath(); ctx.fill(); }
        txt(b.it.label, b.x + 46, b.y + (PORTRAIT ? 12 : 8), { pix: 'dlg', size: fs, color: INK, shadow: false });
        if (b.it.sub) txt(b.it.sub, b.x + 46, b.y + (PORTRAIT ? 12 : 8) + fs + 2, { pix: 'dlg', size: fs * .66, color: '#7a6a58', shadow: false });
      });
      ctx.restore();
    }
    const foot = IS_TOUCH ? 'Sentuh pilihan untuk bermula' : '↑ ↓ pilih  ·  Z / Enter  ·  atau klik';
    txt(foot, cx, SH - INSET.b - (PORTRAIT ? 44 : 30), { size: 18, align: 'center', color: 'rgba(255,255,255,.8)' });
    txt('© Monsta Seberang Perai · Versi 2.2', SW - INSET.r - 14, SH - INSET.b - 24, { size: 14, align: 'right', color: 'rgba(255,255,255,.55)', shadow: false });
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,244,220,${this.flash})`; ctx.fillRect(0, 0, SW, SH); }
  }
}
class IntroScene {
  constructor() { this.show = null; this.a = 0; }
  update() { }
  draw() {
    // animasi dikira semasa melukis: adegan ini hampir sentiasa di bawah dialog
    this.a = Math.min(1, this.a + (Game.dt || .016) * 2.5);
    const human = this.show === 'prof' || this.show === 'player' || this.show === 'rival';
    const look = this.show === 'prof' ? 'prof' : this.show === 'rival' ? 'johan' : S.look;
    if (R3.ok && this.show && R3.drawShow(human ? look : this.show, { human, y: PORTRAIT ? -1.2 : 0 })) return;
    // pentas: cahaya lembut + pelantar
    const R = dlgRect(), cx = SW / 2, base = Math.min(R.y - 40, SH * (PORTRAIT ? .5 : .66));
    const gr = ctx.createLinearGradient(0, 0, 0, SH);
    gr.addColorStop(0, '#2a3a6a'); gr.addColorStop(.55, '#5a4a8a'); gr.addColorStop(1, '#1a1430');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    const glow = ctx.createRadialGradient(cx, base - 140, 10, cx, base - 140, 360);
    glow.addColorStop(0, 'rgba(255,236,190,.45)'); glow.addColorStop(1, 'rgba(255,236,190,0)');
    ctx.fillStyle = glow; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.beginPath(); ctx.ellipse(cx, base + 8, 200, 34, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#7aa8d8'; ctx.beginPath(); ctx.ellipse(cx, base, 190, 30, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#a8cff0'; ctx.beginPath(); ctx.ellipse(cx, base - 4, 160, 20, 0, 0, 7); ctx.fill();
    if (!this.show) return;
    const e = 1 - Math.pow(1 - this.a, 3);
    ctx.globalAlpha = this.a; ctx.imageSmoothingEnabled = false;
    if (human) { const s = PORTRAIT ? 260 : 240; ctx.drawImage(personSprite(look, 'down', 0), cx - s / 2 + (1 - e) * 60, base - s + 12, s, s); }
    else { const s = PORTRAIT ? 300 : 280, bob = Math.sin(Game.t * 2.4) * 4; ctx.drawImage(monstaSprite(this.show), cx - s / 2 + (1 - e) * 60, base - s + 18 + bob, s, s); }
    ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
  }
  set(s) { this.show = s; this.a = 0; }
}
async function newGame() {
  S = newState();
  const sc = new IntroScene();
  Game.push(sc);
  Snd.music('klinik');
  await fadeTo(0, 3);
  sc.set('prof');
  await say('Assalamualaikum dan selamat datang ke dunia MONSTA!');
  await say('Nama saya MERANTI. Orang ramai memanggil saya Profesor Monsta!');
  sc.set('Kancil');
  await say('Dunia ini dihuni oleh makhluk yang dipanggil MONSTA!');
  await say('Ada orang yang memelihara Monsta sebagai kawan. Ada juga yang menggunakannya untuk bertarung.');
  await say('Saya mengkaji Monsta... dan juga SEJARAH tanah air kita. Setiap batu dan sungai di Seberang Perai menyimpan cerita beribu tahun!');
  sc.set('player');
  const g = await UI.ask('Pertama sekali, kamu budak lelaki atau perempuan?', ['LELAKI', 'PEREMPUAN'], { cancel: null });
  S.look = g === 0 ? 'pemain' : 'pemain2';
  sc.set('player');
  const defs = g === 0 ? ['ALI', 'DANIAL', 'HARIS'] : ['AISYAH', 'NURUL', 'SOFEA'];
  let i = await UI.ask('Siapa nama kamu?', ['NAMA BARU', ...defs], { cancel: null, start: 1 });
  S.name = i === 0 ? await UI.askName('Siapa nama kamu?', defs[0]) : defs[i - 1];
  await say(`Baiklah, nama kamu ${S.name}!`);
  sc.set('rival');
  await say('Ini cucu saya. Dia pesaing kamu sejak kecil lagi.');
  i = await UI.ask('...Erm, apa nama dia ya?', ['NAMA BARU', 'JOHAN', 'HAKIM', 'FARID'], { cancel: null, start: 1 });
  S.rival = i === 0 ? await UI.askName('Nama pesaing kamu?', 'JOHAN') : ['JOHAN', 'HAKIM', 'FARID'][i - 1];
  await say(`Oh ya! Sekarang saya ingat! Nama dia ${S.rival}!`);
  sc.set('player');
  await say('{P}! Kisah legenda kamu akan bermula sekarang!');
  await say('Dunia MONSTA, dari Penaga hingga Nibong Tebal, sedang menanti kamu! Ayuh!');
  await fadeTo(1, 2);
  Game.pop(sc);
  World.load('rumah_pemain', 4, 5, 'up');
  Game.push(World.scene);
  await fadeTo(0, 2);
  if (window.Cloud) Cloud.flushPending();
  await UI.chapter('BAB 1', 'Pagi di Penaga');
}
async function continueGame(s) {
  S = Object.assign(newState(), s);
  const door = S.door && MAPS[S.door.m] ? (MAPS[S.door.m].doors || {})[S.door.d] : null;
  await fadeTo(1, 4);
  World.load(S.map, S.x, S.y, S.dir, door);
  Game.push(World.scene);
  if (window.Cloud) Cloud.flushPending();
  await fadeTo(0, 4);
}
async function titleFlow() {
  Game.scenes = [];
  const t = new TitleScene();
  Game.push(t);
  Snd.music('tajuk');
  await fadeTo(0, 2);
  while (true) {
    const save = window.Cloud ? await Cloud.bestSave() : loadGame();
    const items = [];
    if (save) {
      const h = Math.floor(save.time / 3600), m = Math.floor(save.time / 60) % 60;
      items.push({ id: 'SAMBUNG', label: 'SAMBUNG', sub: `${save.name} · ${save.badges.length} lencana · ${h}:${String(m).padStart(2, '0')}${save._cloud ? ' · ☁ awan' : ''}` });
    }
    items.push({ id: 'BARU', label: 'PERMAINAN BARU', sub: save ? null : 'Mulakan pengembaraan dari Penaga' });
    items.push({ id: 'IMPORT', label: 'IMPORT SIMPANAN', icon: '⇪' });
    items.push({ id: 'AKAUN', label: 'AKAUN GOOGLE', icon: '☁' });
    const id = await t.menu(items);
    if (id === 'AKAUN') { if (window.Cloud) await Cloud.openPanel(); continue; }
    if (id === 'IMPORT') {
      const imp = await SaveFile.open('title');
      if (!imp) continue;
      await fadeTo(1, 3); Game.pop(t);
      return continueGame(imp);
    }
    if (id === 'SAMBUNG') {
      await fadeTo(1, 3); Game.pop(t);
      return continueGame(save);
    }
    if (save) {
      const ok = await UI.ask('Permainan baru akan menggantikan simpanan lama apabila kamu menyimpan. Teruskan?', ['YA', 'TIDAK'], { cancel: 1 });
      if (ok !== 0) continue;
    }
    await fadeTo(1, 3); Game.pop(t);
    return newGame();
  }
}
// Dewan Kemasyhuran & kredit
async function hallOfFame() {
  const sc = {
    k: 0, draw() {
      const m = S.party[Math.floor(Game.t / 2.5) % S.party.length];
      if (!(R3.ok && R3.drawShow(m.sp, { rot: Game.t * .4, y: PORTRAIT ? -1.2 : 0 }))) {
        screenBG('#201830', '#000');
        const s = PORTRAIT ? 320 : 300, R = dlgRect(), y = Math.min(R.y - s - 10, SH * .5 - s / 2 + 40);
        const glow = ctx.createRadialGradient(SW / 2, y + s / 2, 10, SW / 2, y + s / 2, s);
        glow.addColorStop(0, 'rgba(255,215,120,.35)'); glow.addColorStop(1, 'rgba(255,215,120,0)');
        ctx.fillStyle = glow; ctx.fillRect(0, 0, SW, SH);
        ctx.imageSmoothingEnabled = false; ctx.drawImage(monstaSprite(m.sp), SW / 2 - s / 2, y + Math.sin(Game.t * 2) * 4, s, s); ctx.imageSmoothingEnabled = true;
      }
      txt('DEWAN KEMASYHURAN', SW / 2, 30 + (IS_TOUCH ? 50 : 0), { size: 54, align: 'center', color: THEME.accent });
      txt(monName(m) + '  ·  Tp ' + m.lv, SW / 2, 96 + (IS_TOUCH ? 50 : 0), { size: 36, align: 'center' });
    }
  };
  Game.push(sc);
  Snd.music('tajuk');
  await say('Tahniah, {P}! Kamu dan Monsta kamu kini diabadikan dalam DEWAN KEMASYHURAN sebagai JUARA MONSTA SEBERANG PERAI!');
  Game.pop(sc);
  const cr = {
    y: SH, lines: ['MONSTA SEBERANG PERAI', '', 'Dari Penaga ke Nibong Tebal,', 'dari Kepala Batas ke Bukit Mertajam,', 'terima kasih kerana bermain!', '', 'Juara: ' + S.name, 'Pesaing: ' + S.rival, '', 'Monstadex: ' + dexCount()[1] + ' ditangkap', '', 'TAMAT BAHAGIAN PERTAMA', '', '...tetapi Batu Bersurat Cherok Tok Kun', 'mula bercahaya...', 'Sejarah Seberang Perai memanggil kamu!'],
    update(dt) { this.y -= dt * 60; if (Input.held.a) this.y -= dt * 200; },
    draw() { screenBG('#0a0818', '#000'); this.lines.forEach((l, i) => txt(l, SW / 2, this.y + i * 48, { size: 38, align: 'center', color: i === 0 ? THEME.accent : '#fff' })); }
  };
  Game.push(cr);
  while (cr.y > -cr.lines.length * 48) await wait(.1);
  Game.pop(cr);
  setFlag('juara');
  S.lastHeal = { map: 'rumah_pemain', x: 5, y: 5, ret: { map: 'penaga', x: 8, y: 5 } }; S.ret = { map: 'penaga', x: 8, y: 5 };
  World.load('rumah_pemain', 5, 5, 'up');
  saveGame();
  await say('Permainan telah disimpan.');
  await UI.chapter('BAB 12', 'Jejak Sejarah');
  await say('MAK: {P}! Profesor Meranti telefon tadi. Katanya Batu Bersurat di Bukit Mertajam tiba-tiba bercahaya! Dia mahu jumpa kamu di sana.');
}

// ---------- Mula ----------
function boot() {
  World.init();
  requestAnimationFrame(frame);
  Game.fade = 1;
  if (window.Monet) Monet.init();
  if (window.Cloud) Cloud.init();
  SaveFile.init();
  titleFlow();
}
window.addEventListener('error', e => { console.error('Ralat:', e.message); });
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all([document.fonts.load('600 32px "Baloo 2"'), document.fonts.load('16px "Press Start 2P"'), document.fonts.load('500 32px "Pixelify Sans"')]), new Promise(r => setTimeout(r, 1800))]).then(boot, boot);
} else boot();
