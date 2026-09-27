'use strict';
// ===== Skrin tajuk, permainan baru, tamat =====
// ---------- Logo tajuk: MONSTA emas timbul, reben SEBERANG PERAI, cogan JEJAK SEJARAH ----------
const Logo = {
  W: 980, H: 230, BASE: 180, SIZE: 176,
  fill: null,
  // lapisan emas + kilauan bergerak dilukis pada kanvas luar skrin
  gold(t) {
    if (!this.fill) { this.fill = mkCanvas(this.W, this.H); this.fill[1].imageSmoothingEnabled = true; }
    const [c, g] = this.fill, W = this.W, H = this.H;
    g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, W, H);
    g.font = `800 ${this.SIZE}px ${FONT}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    const gr = g.createLinearGradient(0, this.BASE - this.SIZE * .72, 0, this.BASE);
    gr.addColorStop(0, '#fffbe6'); gr.addColorStop(.38, '#ffd966'); gr.addColorStop(.62, '#f0a22a'); gr.addColorStop(1, '#b8601a');
    g.fillStyle = gr; g.fillText('MONSTA', W / 2, this.BASE);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(0, 0, W, this.BASE - this.SIZE * .42);
    const sx = ((t * .42) % 1.8 - .4) * W;
    const sh = g.createLinearGradient(sx - 90, 0, sx + 90, 0);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(.5, 'rgba(255,255,255,.85)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.save(); g.transform(1, 0, -.35, 1, 0, 0); g.fillStyle = sh; g.fillRect(sx - 90, 0, 180 + H, H); g.restore();
    return c;
  },
  // lukis logo berpusat pada (cx, top) dengan skala k
  draw(cx, top, k, t, alpha = 1) {
    const S0 = this.SIZE, B = this.BASE;
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, top); ctx.scale(k, k);
    ctx.font = `800 ${S0}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,150,50,.55)'; ctx.shadowBlur = 50;
    for (let i = 12; i >= 1; i--) { ctx.fillStyle = i > 8 ? '#261006' : '#6e3812'; ctx.fillText('MONSTA', 0, B + i * 1.3); if (i === 12) ctx.shadowBlur = 0; }
    ctx.lineWidth = 18; ctx.strokeStyle = '#261006'; ctx.strokeText('MONSTA', 0, B);
    ctx.lineWidth = 5; ctx.strokeStyle = '#ffe9a8'; ctx.strokeText('MONSTA', 0, B);
    ctx.drawImage(this.gold(t), -this.W / 2, 0);
    // kilauan bintang pada huruf
    const gl = Math.floor(t * .9), ph = (t * .9) % 1;
    if (ph < .5) {
      const gx = (hash(gl, 1) - .5) * 600, gy = B - 40 - hash(gl, 2) * 90, r = 22 * Math.sin(ph / .5 * Math.PI);
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.moveTo(gx, gy - r); ctx.quadraticCurveTo(gx, gy, gx + r, gy); ctx.quadraticCurveTo(gx, gy, gx, gy + r); ctx.quadraticCurveTo(gx, gy, gx - r, gy); ctx.quadraticCurveTo(gx, gy, gx, gy - r); ctx.fill();
    }
    // reben merah
    const ry = B + 22, rw = 300, rh = 66;
    ctx.fillStyle = '#7a0e16';
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(s * (rw - 30), ry + 14); ctx.lineTo(s * (rw + 56), ry + 14); ctx.lineTo(s * (rw + 30), ry + 14 + rh / 2); ctx.lineTo(s * (rw + 56), ry + 14 + rh); ctx.lineTo(s * (rw - 30), ry + 14 + rh); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#4a060c'; ctx.beginPath(); ctx.moveTo(s * rw, ry + rh); ctx.lineTo(s * (rw - 30), ry + 14 + rh); ctx.lineTo(s * rw, ry + 14 + rh); ctx.fill(); ctx.fillStyle = '#7a0e16';
    }
    const rg = ctx.createLinearGradient(0, ry, 0, ry + rh);
    rg.addColorStop(0, '#f0424a'); rg.addColorStop(.5, '#d0202c'); rg.addColorStop(1, '#a01018');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(-rw, ry); ctx.quadraticCurveTo(0, ry - 14, rw, ry); ctx.lineTo(rw, ry + rh); ctx.quadraticCurveTo(0, ry + rh - 14, -rw, ry + rh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffd36a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-rw + 8, ry + 7); ctx.quadraticCurveTo(0, ry - 7, rw - 8, ry + 7); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-rw + 8, ry + rh - 7); ctx.quadraticCurveTo(0, ry + rh - 21, rw - 8, ry + rh - 7); ctx.stroke();
    ctx.font = `800 44px ${FONT}`; ctx.lineWidth = 7; ctx.strokeStyle = '#5a0810';
    ctx.strokeText('SEBERANG PERAI', 0, ry + 47); ctx.fillStyle = '#fff'; ctx.fillText('SEBERANG PERAI', 0, ry + 47);
    // cogan kata
    const ty = ry + rh + 44;
    ctx.font = `800 28px ${FONT}`; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,12,4,.85)';
    ctx.strokeText('JEJAK  SEJARAH', 0, ty); ctx.fillStyle = '#ffd966'; ctx.fillText('JEJAK  SEJARAH', 0, ty);
    ctx.fillStyle = '#ffd966';
    for (const s of [-1, 1]) {
      ctx.fillRect(s > 0 ? 130 : -230, ty - 12, 100, 3);
      ctx.save(); ctx.translate(s * 245, ty - 10); ctx.rotate(Math.PI / 4); ctx.fillRect(-6, -6, 12, 12); ctx.restore();
    }
    ctx.restore();
  },
  height: 410,
};
function titleButton(b, sel, t, primary) {
  const { x, y, w, h } = b;
  ctx.save();
  if (sel) { ctx.shadowColor = primary ? 'rgba(255,190,70,.9)' : 'rgba(255,210,120,.7)'; ctx.shadowBlur = 26 + Math.sin(t * 5) * 8; }
  else { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 14; }
  ctx.shadowOffsetY = 4;
  if (primary) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#fff0b0'); g.addColorStop(.45, '#f6c850'); g.addColorStop(1, '#c47a18');
    ctx.fillStyle = g;
  } else ctx.fillStyle = sel ? 'rgba(40,28,70,.9)' : 'rgba(14,14,36,.72)';
  rr(x, y, w, h, h / 2); ctx.fill();
  ctx.restore();
  ctx.lineWidth = sel ? 4 : 2;
  ctx.strokeStyle = primary ? '#5a2e08' : sel ? '#ffd966' : 'rgba(255,217,102,.45)';
  rr(x + 1, y + 1, w - 2, h - 2, h / 2 - 1); ctx.stroke();
  if (primary) { ctx.fillStyle = 'rgba(255,255,255,.35)'; rr(x + 10, y + 5, w - 20, h * .36, h * .18); ctx.fill(); }
  const tc = primary ? '#3a1e04' : '#fff';
  const hasSub = !!b.it.sub;
  const fs = primary ? (PORTRAIT ? 40 : 36) : (PORTRAIT ? 30 : 26);
  const cy = y + h / 2 - (hasSub ? 12 : 0);
  ctx.save(); ctx.font = `800 ${fs}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = tc; ctx.fillText((b.it.icon ? b.it.icon + '  ' : '') + b.it.label, x + w / 2, cy + 2);
  if (hasSub) { ctx.font = `600 ${primary ? 21 : 18}px ${FONT}`; ctx.fillStyle = primary ? '#6a3e0e' : '#c8c0e8'; ctx.fillText(b.it.sub, x + w / 2, cy + fs * .72); }
  ctx.restore();
  if (sel) { const bob = Math.sin(t * 8) * 4; ctx.fillStyle = primary ? '#3a1e04' : '#ffd966'; ctx.beginPath(); ctx.moveTo(x + 22 + bob, y + h / 2 - 11); ctx.lineTo(x + 38 + bob, y + h / 2); ctx.lineTo(x + 22 + bob, y + h / 2 + 11); ctx.fill(); }
}
class TitleScene {
  constructor() { this.t = 0; this.items = null; this.sel = 0; this.boxes = []; this.res = null; this.menuT = 0; this.flash = 0; this.landed = false; }
  menu(items) { const keep = this.items && this.items[this.sel] && items.findIndex(i => i.id === this.items[this.sel].id); this.items = items; this.sel = keep > 0 ? keep : 0; return new Promise(r => { this.res = r; }); }
  get intro() { return clamp((this.t - .3) / .8, 0, 1); }
  update(dt) {
    this.t += dt;
    if (this.items) this.menuT += dt;
    if (!this.landed && this.intro >= 1) { this.landed = true; this.flash = .7; Snd.sfx('level'); }
    this.flash = Math.max(0, this.flash - dt * 1.6);
    if (!this.items || !this.res) return;
    if (this.t < 1 && (Input.pressed.a || Input.pressed.start || Input.ptr.tap)) { this.t = 1.2; return; } // langkau intro
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
  choose() { if (!this.res || this.t < 1.1) return; Snd.sfx('beep'); const r = this.res; this.res = null; r(this.items[this.sel].id); }
  layout() {
    const items = this.items || [], boxes = [];
    const bottom = SH - INSET.b - (PORTRAIT ? 70 : 44);
    const avail = SW - INSET.l - INSET.r, cx = INSET.l + avail / 2;
    if (!items.length) return boxes;
    const primary = items[0], rest = items.slice(1);
    if (PORTRAIT) {
      const w = Math.min(620, avail - 60), h2 = 74, gap = 14, h1 = primary.sub ? 110 : 96;
      let y = bottom - rest.length * (h2 + gap) - h1 - 8;
      boxes.push({ x: cx - w / 2, y, w, h: h1, it: primary }); y += h1 + gap + 8;
      for (const it of rest) { boxes.push({ x: cx - w / 2 + 20, y, w: w - 40, h: h2, it }); y += h2 + gap; }
    } else {
      const h1 = primary.sub ? 92 : 80, h2 = 60, gap = 16;
      const w2 = Math.min(300, (avail - 60 - gap * (rest.length - 1)) / rest.length), rowW = w2 * rest.length + gap * (rest.length - 1);
      const y2 = bottom - h2, y1 = y2 - 18 - h1, w1 = Math.min(560, avail - 60);
      boxes.push({ x: cx - w1 / 2, y: y1, w: w1, h: h1, it: primary });
      rest.forEach((it, i) => boxes.push({ x: cx - rowW / 2 + i * (w2 + gap), y: y2, w: w2, h: h2, it }));
    }
    return boxes;
  }
  draw() {
    const intro = this.intro, t = this.t;
    if (!(R3.ok && R3.drawTitle(t, clamp(t / 2.6, 0, 1)))) {
      screenBG('#3a2060', '#f89850');
      ctx.imageSmoothingEnabled = false;
      ['Anakpadi', 'Percik', 'Penyucil'].forEach((n, k) => ctx.drawImage(monstaSprite(n), SW / 2 - 330 + k * 220, SH * .42, 220, 220));
      ctx.imageSmoothingEnabled = true;
    }
    // bayang atas & bawah supaya teks jelas
    let g = ctx.createLinearGradient(0, 0, 0, SH * .38); g.addColorStop(0, 'rgba(10,6,30,.55)'); g.addColorStop(1, 'rgba(10,6,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH * .38);
    g = ctx.createLinearGradient(0, SH * .6, 0, SH); g.addColorStop(0, 'rgba(10,6,30,0)'); g.addColorStop(1, 'rgba(10,6,30,.7)');
    ctx.fillStyle = g; ctx.fillRect(0, SH * .6, SW, SH * .4);
    // logo
    const avail = SW - INSET.l - INSET.r;
    const k0 = PORTRAIT ? Math.min(.8, (avail - 40) / 760) : .62;
    const top = PORTRAIT ? 70 + (IS_TOUCH ? 40 : 0) : 14;
    if (intro > 0) {
      const e = intro < 1 ? 1 + 2.2 * Math.pow(1 - intro, 3) - .15 * Math.sin(intro * Math.PI) : 1;
      const float = this.landed ? Math.sin(t * 1.4) * 4 : 0;
      Logo.draw(INSET.l + avail / 2, top + float, k0 * e, t, Math.min(1, intro * 1.6));
    }
    // menu
    this.boxes = this.layout();
    if (this.items && t > 1.1) {
      const a = clamp((t - 1.1) / .5, 0, 1);
      ctx.save(); ctx.globalAlpha = a; ctx.translate(0, (1 - a) * 30);
      this.boxes.forEach((b, i) => titleButton(b, i === this.sel, t, i === 0));
      ctx.restore();
    }
    const foot = IS_TOUCH ? 'Sentuh pilihan untuk bermula' : '↑ ↓ pilih  ·  Z / Enter mula  ·  atau klik';
    txt(foot, SW / 2, SH - INSET.b - (PORTRAIT ? 50 : 30), { size: 18, align: 'center', color: 'rgba(255,255,255,.7)' });
    txt('© Monsta Seberang Perai · Versi 2.1', SW - INSET.r - 16, SH - INSET.b - (PORTRAIT ? 26 : 26), { size: 15, align: 'right', color: 'rgba(255,255,255,.45)', shadow: false });
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,244,220,${this.flash})`; ctx.fillRect(0, 0, SW, SH); }
  }
}
class IntroScene {
  constructor() { this.show = null; this.a = 0; }
  update(dt) { this.a = Math.min(1, this.a + dt * 2); }
  draw() {
    const human = this.show === 'prof' || this.show === 'player' || this.show === 'rival';
    const look = this.show === 'prof' ? 'prof' : this.show === 'rival' ? 'johan' : S.look;
    if (R3.ok && this.show && R3.drawShow(human ? look : this.show, { human, y: PORTRAIT ? -1.2 : 0 })) return;
    screenBG('#2a2050', '#0a0818');
    ctx.globalAlpha = this.a; ctx.imageSmoothingEnabled = false;
    if (human) ctx.drawImage(personSprite(look, 'down', 0), SW / 2 - 110, SH * .2, 220, 220);
    else if (this.show) ctx.drawImage(monstaSprite(this.show), SW / 2 - 130, SH * .15, 260, 260);
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
      if (!(R3.ok && R3.drawShow(m.sp, { rot: Game.t * .4, y: PORTRAIT ? -1.2 : 0 }))) screenBG('#201830', '#000');
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
