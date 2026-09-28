'use strict';
// ===== Enjin asas: pentas responsif (9:16 / 16:9), input, adegan, teks, dialog, bunyi =====
// Saiz logik UI: sisi pendek sentiasa 720 unit. Landskap = 1280x720, potret = 720x(>=1280).
let SW = 1280, SH = 720, UIK = 1;
const TS = 48, PX = 3;
const INSET = { b: 0, l: 0, r: 0, t: 0 };
const stage = document.getElementById('stage');
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
const FONT = "'Baloo 2', 'Trebuchet MS', 'Segoe UI', sans-serif";
const FONT_PIX = "'Press Start 2P', 'Courier New', monospace";
const FONT_DLG = "'Pixelify Sans', 'Baloo 2', 'Trebuchet MS', sans-serif";
const IS_TOUCH = matchMedia('(hover: none), (pointer: coarse)').matches || 'ontouchstart' in window;
let PORTRAIT = false;

const rnd = n => Math.floor(Math.random() * n);
const chance = p => Math.random() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = arr => arr[rnd(arr.length)];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

function layout() {
  const vw = innerWidth, vh = innerHeight;
  PORTRAIT = vh > vw;
  let w, h;
  if (IS_TOUCH) { w = vw; h = vh; }               // telefon: skrin penuh
  else {                                           // web: 16:9 (atau 9:16 jika tetingkap tegak)
    const ar = PORTRAIT ? 9 / 16 : 16 / 9;
    w = vw; h = vw / ar; if (h > vh) { h = vh; w = vh * ar; }
  }
  w = Math.floor(w); h = Math.floor(h);
  stage.style.width = w + 'px'; stage.style.height = h + 'px';
  if (PORTRAIT) { SW = 720; SH = Math.round(720 * h / w); } else { SH = 720; SW = Math.round(720 * w / h); }
  UIK = Math.min(2.5, Math.max(1, (w * (devicePixelRatio || 1)) / SW));
  cv.width = Math.round(SW * UIK); cv.height = Math.round(SH * UIK);
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  INSET.b = INSET.l = INSET.r = INSET.t = 0;
  if (IS_TOUCH) { if (PORTRAIT) INSET.b = Math.round(SH * .25); else { INSET.l = 250; INSET.r = 250; } }
  if (window.R3 && R3.ok) R3.resize(w, h);
  document.body.classList.toggle('portrait', PORTRAIT);
}
addEventListener('resize', layout);
addEventListener('orientationchange', () => setTimeout(layout, 200));
layout();

// ---------- Input ----------
const Input = {
  held: {}, pressed: {}, enabled: true, rt: {}, joy: null,
  keymap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right', KeyZ: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Backspace: 'b',
    Escape: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b', Enter: 'start', KeyP: 'start'
  },
  press(k) { if (!this.held[k]) { this.pressed[k] = true; this.rt[k] = 0; } this.held[k] = true; Snd.unlock(); },
  release(k) { this.held[k] = false; },
  clear() { this.held = {}; this.pressed = {}; },
  tick(dt) {
    for (const k of ['up', 'down', 'left', 'right']) {
      if (this.held[k]) {
        this.rt[k] = (this.rt[k] || 0) + dt;
        if (this.rt[k] > 0.38) { this.pressed[k] = true; this.rt[k] -= 0.11; }
      }
    }
  },
  dir() { for (const k of ['up', 'down', 'left', 'right']) if (this.held[k]) return k; return null; }
};
addEventListener('keydown', e => {
  if (!Input.enabled) return;
  if (e.code === 'KeyM') { Snd.toggle(); return; }
  const k = Input.keymap[e.code];
  if (!k) return;
  e.preventDefault();
  if (e.repeat) return;
  Input.press(k);
});
addEventListener('keyup', e => { const k = Input.keymap[e.code]; if (k) Input.release(k); });
// Penunjuk (tetikus/sentuhan) pada kanvas, dalam koordinat UI logik
Input.ptr = { x: -1, y: -1, tap: false, moved: false };
(() => {
  const toUI = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * SW, y: (e.clientY - r.top) / r.height * SH }; };
  cv.addEventListener('pointermove', e => { if (!Input.enabled) return; Object.assign(Input.ptr, toUI(e), { moved: true }); });
  cv.addEventListener('pointerdown', e => { if (!Input.enabled) return; Snd.unlock(); Object.assign(Input.ptr, toUI(e), { tap: true, moved: true }); });
})();
addEventListener('blur', () => Input.clear());
document.querySelectorAll('#touch [data-k]').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); b.classList.add('on'); Input.press(k); };
  const up = e => { e.preventDefault(); b.classList.remove('on'); Input.release(k); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('pointercancel', up);
});
// Kayu bedik maya (joystick) 4 arah
(() => {
  const base = document.getElementById('joy'), knob = document.getElementById('knob');
  if (!base) return;
  let id = null, cur = null;
  const setDir = d => {
    if (d === cur) return;
    if (cur) Input.release(cur);
    cur = d;
    if (d) Input.press(d);
  };
  const move = e => {
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const max = r.width * .38, len = Math.hypot(dx, dy);
    if (len > max) { dx *= max / len; dy *= max / len; }
    knob.style.transform = `translate(${dx}px, ${dy}px)`;
    if (len < r.width * .12) setDir(null);
    else setDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  };
  base.addEventListener('pointerdown', e => { e.preventDefault(); id = e.pointerId; base.setPointerCapture(id); Snd.unlock(); move(e); });
  base.addEventListener('pointermove', e => { if (e.pointerId === id) move(e); });
  const end = e => { if (e.pointerId !== id) return; id = null; knob.style.transform = ''; setDir(null); };
  base.addEventListener('pointerup', end); base.addEventListener('pointercancel', end);
})();
const muteBtn = document.getElementById('mute');
if (muteBtn) muteBtn.addEventListener('click', () => Snd.toggle());

// ---------- Gelung & adegan ----------
const Game = {
  scenes: [], timers: [], t: 0, fade: 0, fadeTarget: 0, fadeSpeed: 4, fadeRes: null, used3d: false,
  push(s) { this.scenes.push(s); if (s.enter) s.enter(); return s; },
  pop(s) { const i = s ? this.scenes.lastIndexOf(s) : this.scenes.length - 1; if (i >= 0) this.scenes.splice(i, 1); },
  top() { return this.scenes[this.scenes.length - 1]; },
  has(s) { return this.scenes.includes(s); }
};
function wait(sec) { return new Promise(r => Game.timers.push({ t: sec, r })); }
function fadeTo(v, speed = 4) {
  return new Promise(r => { Game.fadeTarget = v; Game.fadeSpeed = speed; Game.fadeRes = r; });
}
let _last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - _last) / 1000 || 0.016);
  _last = ts; Game.t += dt; Game.dt = dt;
  Input.tick(dt);
  for (let i = Game.timers.length - 1; i >= 0; i--) {
    const tm = Game.timers[i]; tm.t -= dt;
    if (tm.t <= 0) { Game.timers.splice(i, 1); tm.r(); }
  }
  if (Game.fade !== Game.fadeTarget) {
    const d = Game.fadeSpeed * dt;
    Game.fade = Game.fade < Game.fadeTarget ? Math.min(Game.fadeTarget, Game.fade + d) : Math.max(Game.fadeTarget, Game.fade - d);
    if (Game.fade === Game.fadeTarget && Game.fadeRes) { const r = Game.fadeRes; Game.fadeRes = null; r(); }
  } else if (Game.fadeRes) { const r = Game.fadeRes; Game.fadeRes = null; r(); }
  const top = Game.top();
  if (top && top.update) {
    try { top.update(dt); } catch (e) { console.error(e); }
  }
  let s = Game.scenes.length - 1;
  while (s > 0 && Game.scenes[s].transparent) s--;
  ctx.setTransform(UIK, 0, 0, UIK, 0, 0);
  ctx.clearRect(0, 0, SW, SH);
  Game.used3d = false;
  for (let i = Math.max(0, s); i < Game.scenes.length; i++) {
    try { Game.scenes[i].draw(ctx); } catch (e) { console.error(e); }
  }
  if (window.R3 && R3.ok) R3.endFrame(Game.used3d);
  if (!Game.used3d && !Game.scenes.length) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH); }
  if (Game.fade > 0) { ctx.fillStyle = `rgba(4,6,14,${Game.fade})`; ctx.fillRect(0, 0, SW, SH); }
  if (window.Monet) Monet.drawBadge && Monet.drawBadge();
  Snd.tick();
  Input.pressed = {}; Input.ptr.tap = false; Input.ptr.moved = false;
  requestAnimationFrame(frame);
}

// ---------- Lukisan asas (gaya UI "epik") ----------
const THEME = {
  panelA: '#15213f', panelB: '#0b1328', edge: '#e9c46a', edge2: '#8a6a2a', text: '#f4f1e8', dim: '#9aa6c4',
  accent: '#e9c46a', red: '#e0524a', blue: '#4a8fe0', glass: 'rgba(12,20,42,.86)'
};
function setFont(size, pix) { ctx.font = pix === 'dlg' ? `500 ${Math.round(size * .9)}px ${FONT_DLG}` : `${pix ? '' : '600 '}${Math.round(size * (pix ? .55 : .86))}px ${pix ? FONT_PIX : FONT}`; }
function txt(s, x, y, o = {}) {
  setFont(o.size || 32, o.pix);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'top';
  const yy = y + (o.pix === 'dlg' ? 0 : o.pix ? 4 : -2);
  if (o.shadow !== false) { ctx.fillStyle = o.shadow || 'rgba(0,0,0,.45)'; ctx.fillText(s, x + 1.5, yy + 2); }
  ctx.fillStyle = o.color || THEME.text;
  ctx.fillText(s, x, yy);
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function panel(x, y, w, h, alt) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, alt ? '#1d2f5c' : THEME.panelA); g.addColorStop(1, THEME.panelB);
  ctx.fillStyle = g; rr(x, y, w, h, 14); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = THEME.edge; ctx.lineWidth = 3; rr(x + 1.5, y + 1.5, w - 3, h - 3, 13); ctx.stroke();
  ctx.strokeStyle = 'rgba(233,196,106,.25)'; ctx.lineWidth = 1.5; rr(x + 7, y + 7, w - 14, h - 14, 9); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.06)'; rr(x + 4, y + 4, w - 8, Math.min(h * .4, 40), 10); ctx.fill();
}
// Panel krim klasik (dialog & pertarungan)
function paper(x, y, w, h, inner) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.28)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#2b2f3a'; rr(x, y, w, h, 18); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#fbf8ee'; rr(x + 5, y + 5, w - 10, h - 10, 14); ctx.fill();
  if (inner) { ctx.strokeStyle = inner; ctx.lineWidth = 4; rr(x + 12, y + 12, w - 24, h - 24, 10); ctx.stroke(); }
}
const INK = '#23272f';
function cursor(x, y) {
  const bob = Math.sin(Game.t * 8) * 2;
  ctx.fillStyle = THEME.accent;
  ctx.beginPath(); ctx.moveTo(x + bob, y); ctx.lineTo(x + 13 + bob, y + 9); ctx.lineTo(x + bob, y + 18); ctx.closePath(); ctx.fill();
}
function wrapText(s, maxW, size = 32, pix) {
  setFont(size, pix);
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      const t = line ? line + ' ' + w : w;
      if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}
function fmt(s) {
  return String(s).replace(/\{P\}/g, (S && S.name) || 'ALI').replace(/\{R\}/g, (S && S.rival) || 'JOHAN');
}
// Kotak dialog: bawah skrin, di atas kawalan sentuh
function dlgRect() {
  const avail = SW - INSET.l - INSET.r - 24;
  const w = Math.min(avail, 1100), x = INSET.l + 12 + (avail - w) / 2;
  const h = 150, y = SH - INSET.b - h - 12;
  return { x, y, w, h };
}
// Lukis adegan lama 720x480 dalam kotak berskala (menu skrin penuh)
function legacy(fn, bg) {
  ctx.save();
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(0, 0, SW, SH); }
  const availH = SH - INSET.b, availW = SW - INSET.l - INSET.r;
  const k = Math.min(availW / 720, availH / 480);
  ctx.translate(INSET.l + (availW - 720 * k) / 2, (availH - 480 * k) / 2);
  ctx.scale(k, k);
  const a = SW, b = SH, il = INSET.l, ir = INSET.r, ib = INSET.b;
  SW = 720; SH = 480; INSET.l = INSET.r = INSET.b = 0;
  try { fn(); } finally { SW = a; SH = b; INSET.l = il; INSET.r = ir; INSET.b = ib; ctx.restore(); }
}

// ---------- Dialog ----------
class Dialog {
  constructor(text, res, opts = {}) {
    this.transparent = true; this.res = res; this.opts = opts;
    const pages = Array.isArray(text) ? text : [text];
    this.pages = [];
    const R = dlgRect();
    for (const p of pages) {
      const lines = wrapText(fmt(p), R.w - 80, 33, 'dlg');
      for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    }
    this.pi = 0; this.chars = 0; this.done = false;
    this.speaker = null;
    const m = /^([A-Z][A-Z .'{}]{1,24}):\s/.exec(fmt(pages[0]));
    if (m) this.speaker = m[1];
  }
  get cur() { return this.pages[this.pi]; }
  get len() { return this.cur.join('').length; }
  update(dt) {
    if (this.done) return;
    if (this.chars < this.len) {
      this.chars += dt * ((S && S.textSpeed) || 70);
      if (Input.pressed.a || Input.pressed.b) this.chars = this.len;
      if (this.chars >= this.len && this.opts.noWait && this.pi === this.pages.length - 1) this.finish();
      return;
    }
    if (this.opts.auto) { this.autoT = (this.autoT || 0) + dt; if (this.autoT > this.opts.auto) { this.next(); return; } }
    if (Input.pressed.a || Input.pressed.b) { Snd.sfx('beep'); this.next(); }
  }
  next() {
    this.autoT = 0;
    if (this.pi < this.pages.length - 1) { this.pi++; this.chars = 0; }
    else this.finish();
  }
  finish() {
    this.done = true;
    if (!this.opts.keep) Game.pop(this);
    this.res();
  }
  draw() {
    const R = dlgRect();
    paper(R.x, R.y, R.w, R.h, '#ec7468');
    let n = Math.floor(this.chars);
    this.cur.forEach((line, i) => {
      const s = line.slice(0, Math.max(0, n)); n -= line.length;
      txt(s, R.x + 36, R.y + 28 + i * 36, { pix: 'dlg', color: INK, shadow: false, size: 33 });
    });
    if (!this.done && this.chars >= this.len && !this.opts.noWait) {
      ctx.fillStyle = '#ec5a4e';
      const bx = R.x + R.w - 50, by = R.y + R.h - 36 + Math.sin(Game.t * 6) * 3;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 20, by); ctx.lineTo(bx + 10, by + 12); ctx.fill();
    }
  }
}

class Choice {
  constructor(options, res, o = {}) {
    this.transparent = true; this.opts = options; this.res = res; this.o = o;
    this.i = o.start || 0; this.cancel = o.cancel === undefined ? options.length - 1 : o.cancel;
    this.vis = o.visible || 8; this.scroll = 0;
    setFont(32, 'dlg');
    const w = Math.max(...options.map(s => ctx.measureText(fmt(s)).width));
    this.w = Math.max(o.w || 0, 150, w + 80);
    const n = Math.min(this.vis, options.length);
    this.h = n * 42 + 30;
    const R = dlgRect();
    this.x = o.x !== undefined ? o.x : R.x + R.w - this.w;
    this.y = o.y !== undefined ? o.y : R.y - 8 - this.h;
    const topMin = 8 + INSET.t + (IS_TOUCH ? 60 : 0); // jangan di bawah butang ♪/MENU pada telefon
    if (this.y < topMin) this.y = topMin;
  }
  update() {
    const n = this.opts.length;
    if (Input.pressed.up) { this.i = (this.i + n - 1) % n; Snd.sfx('move'); }
    if (Input.pressed.down) { this.i = (this.i + 1) % n; Snd.sfx('move'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + this.vis) this.scroll = this.i - this.vis + 1;
    if (this.o.onMove) this.o.onMove(this.i);
    if (Input.pressed.a) { Snd.sfx('beep'); Game.pop(this); this.res(this.i); }
    else if (Input.pressed.b && this.cancel !== null) { Snd.sfx('beep'); Game.pop(this); this.res(this.cancel); }
  }
  draw() {
    paper(this.x, this.y, this.w, this.h);
    const end = Math.min(this.opts.length, this.scroll + this.vis);
    for (let k = this.scroll; k < end; k++) {
      const yy = this.y + 16 + (k - this.scroll) * 42;
      if (k === this.i) { ctx.fillStyle = 'rgba(236,116,104,.16)'; rr(this.x + 12, yy - 2, this.w - 24, 40, 8); ctx.fill(); }
      txt(fmt(this.opts[k]), this.x + 44, yy + 4, { pix: 'dlg', size: 32, color: INK, shadow: false });
      if (k === this.i) { const bob = Math.sin(Game.t * 8) * 2; ctx.fillStyle = '#ec5a4e'; ctx.beginPath(); ctx.moveTo(this.x + 20 + bob, yy + 9); ctx.lineTo(this.x + 33 + bob, yy + 18); ctx.lineTo(this.x + 20 + bob, yy + 27); ctx.closePath(); ctx.fill(); }
    }
    if (this.scroll > 0) txt('▲', this.x + this.w - 30, this.y + 6, { size: 20, color: INK, shadow: false });
    if (end < this.opts.length) txt('▼', this.x + this.w - 30, this.y + this.h - 26, { size: 20, color: INK, shadow: false });
  }
}

const UI = {
  say(text, opts = {}) { return new Promise(r => Game.push(new Dialog(text, r, opts))); },
  async ask(text, options, o = {}) {
    let d = null;
    if (text) {
      await new Promise(r => { d = new Dialog(text, r, { noWait: true, keep: true }); Game.push(d); });
    }
    const i = await new Promise(r => Game.push(new Choice(options, r, o)));
    if (d) Game.pop(d);
    return i;
  },
  async yes(text) { return (await this.ask(text, ['YA', 'TIDAK'], { cancel: 1 })) === 0; },
  choose(options, o = {}) { return new Promise(r => Game.push(new Choice(options, r, o))); },
  askName(label, def) {
    return new Promise(res => {
      const box = document.getElementById('nameBox'), inp = document.getElementById('nameInput');
      document.getElementById('nameLabel').textContent = label;
      inp.value = ''; inp.placeholder = def; box.classList.remove('hidden');
      Input.enabled = false; Input.clear();
      setTimeout(() => inp.focus(), 50);
      const done = () => {
        const v = (inp.value.trim() || def).toUpperCase().slice(0, 10);
        box.classList.add('hidden'); Input.enabled = true; Input.clear();
        document.getElementById('nameOk').onclick = null; inp.onkeydown = null;
        res(v);
      };
      document.getElementById('nameOk').onclick = done;
      inp.onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); done(); } e.stopPropagation(); };
    });
  },
  // Sepanduk bab cerita
  chapter(n, title) {
    return new Promise(res => {
      const sc = {
        transparent: true, t: 0, update(dt) { this.t += dt; if (this.t > 3.2 || (this.t > .8 && (Input.pressed.a || Input.pressed.b))) { Game.pop(this); res(); } },
        draw() {
          const a = Math.min(1, this.t * 2, (3.2 - this.t) * 2);
          ctx.save(); ctx.globalAlpha = Math.max(0, a);
          const g = ctx.createLinearGradient(0, SH / 2 - 90, 0, SH / 2 + 90);
          g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(.5, 'rgba(6,10,24,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = g; ctx.fillRect(0, SH / 2 - 90, SW, 180);
          txt(n, SW / 2, SH / 2 - 62, { size: 30, align: 'center', color: THEME.accent });
          txt(title, SW / 2, SH / 2 - 22, { size: 60, align: 'center', color: '#fff' });
          ctx.restore();
        }
      };
      Snd.sfx('level');
      Game.push(sc);
    });
  }
};

// ---------- Bunyi (WebAudio) ----------
const NOTE = (() => {
  const m = {}; const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  for (let o = 1; o < 8; o++) names.forEach((n, i) => { m[n + o] = 440 * Math.pow(2, ((o + 1) * 12 + i - 69) / 12); });
  return m;
})();
const Snd = {
  ac: null, on: true, cur: null, want: null,
  init() {
    if (this.ac) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    try {
      this.ac = new AC(); this.g = this.ac.createGain(); this.g.gain.value = this.on ? .45 : 0; this.g.connect(this.ac.destination);
      this.mg = this.ac.createGain(); this.mg.gain.value = .28; this.mg.connect(this.g);
    } catch (e) { this.ac = null; }
  },
  unlock() { this.init(); if (this.ac && this.ac.state === 'suspended') this.ac.resume(); },
  toggle() { this.on = !this.on; if (this.g) this.g.gain.value = this.on ? .45 : 0; try { localStorage.setItem('msp_mute', this.on ? '0' : '1'); } catch (e) { } },
  note(f, t, d, type = 'square', vol = .1, dest, slide) {
    if (!this.ac) return;
    const o = this.ac.createOscillator(), g = this.ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + d);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + d);
    o.connect(g); g.connect(dest || this.g); o.start(t); o.stop(t + d + .03);
  },
  noise(t, d, vol = .15) {
    if (!this.ac) return;
    const len = Math.floor(this.ac.sampleRate * d), b = this.ac.createBuffer(1, len, this.ac.sampleRate), ch = b.getChannelData(0);
    for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = this.ac.createBufferSource(), g = this.ac.createGain(); g.gain.value = vol;
    s.buffer = b; s.connect(g); g.connect(this.g); s.start(t);
  },
  sfx(n) {
    if (!this.ac || !this.on) return;
    const t = this.ac.currentTime;
    switch (n) {
      case 'beep': this.note(1320, t, .04, 'square', .05); break;
      case 'move': this.note(990, t, .03, 'square', .03); break;
      case 'bump': this.note(120, t, .08, 'square', .08); break;
      case 'door': this.note(300, t, .08, 'square', .06); this.note(200, t + .07, .1, 'square', .06); break;
      case 'hit': this.noise(t, .15, .22); this.note(160, t, .12, 'square', .08, null, 60); break;
      case 'super': this.noise(t, .25, .3); this.note(220, t, .2, 'sawtooth', .1, null, 50); break;
      case 'weak': this.noise(t, .08, .12); break;
      case 'faint': this.note(600, t, .5, 'square', .08, null, 80); break;
      case 'heal': [523, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * .1, .12, 'square', .06)); break;
      case 'level': [523, 659, 784, 659, 784, 1047].forEach((f, i) => this.note(f, t + i * .09, .1, 'square', .07)); break;
      case 'ball': this.note(700, t, .15, 'square', .06, null, 300); break;
      case 'shake': this.note(200, t, .06, 'square', .08); break;
      case 'catch': [784, 988, 1175, 1568].forEach((f, i) => this.note(f, t + i * .12, .14, 'square', .07)); break;
      case 'item': [659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.note(f, t + i * .08, .1, 'triangle', .12)); break;
      case 'stat': this.note(400, t, .25, 'triangle', .1, null, 900); break;
      case 'statdown': this.note(900, t, .25, 'triangle', .1, null, 300); break;
      case 'run': this.note(500, t, .1, 'square', .05, null, 900); this.note(700, t + .1, .1, 'square', .05, null, 1200); break;
      case 'alert': this.note(1200, t, .08, 'square', .07); this.note(1600, t + .09, .12, 'square', .07); break;
      case 'evo': for (let i = 0; i < 8; i++) this.note(400 + i * 80, t + i * .07, .08, 'triangle', .1); break;
      case 'cut': this.noise(t, .2, .25); break;
      case 'flute': [523, 587, 659, 784, 659, 587, 523].forEach((f, i) => this.note(f, t + i * .22, .25, 'sine', .15)); break;
    }
  },
  music(name) {
    this.want = name;
    if (this.cur === name) return;
    this.cur = name; this.step = 0;
    this.nextT = this.ac ? this.ac.currentTime + .08 : 0;
  },
  tick() {
    if (!this.ac || !this.cur || !this.on) return;
    const song = SONGS[this.cur]; if (!song) return;
    if (!song._ev) parseSong(song);
    const sd = 60 / song.bpm / 2;
    if (this.nextT < this.ac.currentTime - .5) this.nextT = this.ac.currentTime + .05;
    while (this.nextT < this.ac.currentTime + .15) {
      const evs = song._ev[this.step];
      if (evs) for (const e of evs) this.note(e.f, this.nextT, e.l * sd * .92, e.w, e.v, this.mg);
      this.step++;
      if (this.step >= song._len) { this.step = 0; if (song.once) { this.cur = null; break; } }
      this.nextT += sd;
    }
  }
};
try { if (localStorage.getItem('msp_mute') === '1') Snd.on = false; } catch (e) { }
function parseSong(song) {
  song._ev = {}; song._len = 0;
  const voices = [[song.mel, 'square', .09], [song.bass, 'triangle', .16], [song.har, 'square', .04]];
  for (const [str, w, v] of voices) {
    if (!str) continue;
    const toks = str.trim().split(/\s+/);
    let cur = null;
    toks.forEach((tk, i) => {
      if (tk === '.') { if (cur) cur.l++; return; }
      cur = null;
      if (tk === '-') return;
      const f = NOTE[tk]; if (!f) return;
      cur = { f, l: 1, w, v };
      (song._ev[i] = song._ev[i] || []).push(cur);
    });
    song._len = Math.max(song._len, toks.length);
  }
}
const SONGS = {
  tajuk: {
    bpm: 132,
    mel: 'G4 . C5 . D5 . E5 . G5 . . . E5 . G5 . A5 . G5 . E5 . D5 . C5 . . . D5 . E5 . D5 . . . C5 . A4 . G4 . . . - - ' +
      'G4 . C5 . D5 . E5 . G5 . . . A5 . C6 . A5 . G5 . E5 . G5 . D5 . . . E5 . D5 . C5 . . . . . . . - - - -',
    bass: 'C3 . C3 . G2 . G2 . A2 . A2 . E2 . E2 . F2 . F2 . C3 . C3 . G2 . G2 . G2 . G2 . C3 . C3 . - - ' +
      'C3 . C3 . G2 . G2 . A2 . A2 . E2 . E2 . F2 . F2 . G2 . G2 . C3 . G2 . C3 . . . . . . . - - - -'
  },
  bandar: {
    bpm: 112,
    mel: 'E5 . D5 C5 D5 . G4 . C5 . D5 . E5 . . . G5 . E5 . D5 . C5 . D5 . . . - - - - E5 . D5 C5 D5 . G4 . A4 . C5 . D5 . . . E5 . D5 . C5 . A4 . C5 . . . - - - -',
    bass: 'C3 . G2 . C3 . G2 . A2 . E2 . A2 . E2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . G2 . A2 . E2 . A2 . E2 . F2 . G2 . F2 . G2 . C3 . G2 . C3 . . .'
  },
  laluan: {
    bpm: 150,
    mel: 'C5 . E5 . G5 . E5 . A5 . G5 . E5 . . . D5 . E5 . F5 . E5 . D5 . C5 . D5 . . . C5 . E5 . G5 . E5 . A5 . C6 . A5 . G5 . F5 . E5 . D5 . E5 . C5 . . . . . - -',
    bass: 'C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . . .'
  },
  gua: {
    bpm: 100,
    mel: 'A4 . . C5 B4 . . . E4 . . . A4 . G4 . F4 . . . E4 . . . - - - - D4 . F4 . A4 . . C5 B4 . . . G#4 . . . A4 . . . . . - - - - - -',
    bass: 'A2 . . . A2 . . . E2 . . . E2 . . . F2 . . . F2 . . . E2 . . . E2 . . . D2 . . . D2 . . . E2 . . . E2 . . . A2 . . . A2 . . . - - - -'
  },
  lawan: {
    bpm: 170,
    mel: 'A4 A4 C5 A4 D5 A4 E5 D5 C5 A4 C5 D5 E5 . G5 . A5 . G5 E5 D5 C5 D5 E5 A4 . . . - - - - F5 . E5 . D5 . C5 . D5 . E5 . C5 . A4 . G4 . A4 . C5 . D5 . E5 . . . E5 . . . - -',
    bass: 'A2 A3 A2 A3 A2 A3 A2 A3 F2 F3 F2 F3 G2 G3 G2 G3 A2 A3 A2 A3 A2 A3 A2 A3 E2 E3 E2 E3 E2 E3 E2 E3 D2 D3 D2 D3 D2 D3 D2 D3 F2 F3 F2 F3 G2 G3 G2 G3 A2 A3 A2 A3 E2 E3 E2 E3 A2 A3 A2 A3 A2 A3 A2 A3'
  },
  ketua: {
    bpm: 176,
    mel: 'E5 . E5 D5 E5 . G5 . E5 . D5 . C5 . D5 . E5 . E5 D5 E5 . A5 . G5 . E5 . D5 . . . C5 . C5 B4 C5 . E5 . D5 . C5 . B4 . A4 . B4 . C5 . D5 . E5 . . . E5 . F#5 . G#5 . . .',
    bass: 'A2 A3 A2 A3 A2 A3 A2 A3 C3 C4 C3 C4 C3 C4 C3 C4 D3 D4 D3 D4 D3 D4 D3 D4 E3 E4 E3 E4 E3 E4 E3 E4 F2 F3 F2 F3 F2 F3 F2 F3 D2 D3 D2 D3 D2 D3 D2 D3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3 E2 E3'
  },
  menang: {
    bpm: 140,
    mel: 'C5 E5 G5 C6 . . G5 . A5 . . . G5 . E5 . F5 . D5 . G5 . . . E5 . . . - - - -',
    bass: 'C3 . G2 . C3 . G2 . F2 . C3 . F2 . C3 . G2 . D3 . G2 . D3 . C3 . G2 . C3 . . .'
  },
  klinik: {
    bpm: 104,
    mel: 'G4 . C5 . E5 . D5 . C5 . . . A4 . C5 . G4 . . . E4 . G4 . A4 . C5 . D5 . . . E5 . D5 . C5 . . . - - - -',
    bass: 'C3 . . . G2 . . . A2 . . . E2 . . . F2 . . . G2 . . . C3 . . . G2 . . . C3 . . . - - - -'
  },
  lanun: {
    bpm: 150,
    mel: 'D5 . D5 . F5 . D5 . G5 . F5 . D5 . C5 . D5 . . . A4 . C5 . D5 . . . - - - - D5 . D5 . F5 . A5 . G5 . F5 . D5 . F5 . E5 . C#5 . D5 . . . - - - - - -',
    bass: 'D2 D3 D2 D3 D2 D3 D2 D3 A#2 A#3 A#2 A#3 A2 A3 A2 A3 D2 D3 D2 D3 D2 D3 D2 D3 G2 G3 G2 G3 A2 A3 A2 A3 D2 D3 D2 D3 D2 D3 D2 D3'
  }
};
