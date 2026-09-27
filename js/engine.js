'use strict';
// ===== Enjin asas: kanvas, input, adegan, teks, dialog, bunyi =====
const SW = 720, SH = 480, TS = 48, PX = 3;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const FONT = "'VT323', 'Courier New', monospace";

const rnd = n => Math.floor(Math.random() * n);
const chance = p => Math.random() < p;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const pick = arr => arr[rnd(arr.length)];
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };

// ---------- Input ----------
const Input = {
  held: {}, pressed: {}, enabled: true, rt: {},
  keymap: {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right', KeyZ: 'a', Space: 'a', KeyJ: 'a', KeyX: 'b', Backspace: 'b',
    Escape: 'b', KeyK: 'b', ShiftLeft: 'b', ShiftRight: 'b', Enter: 'start', KeyP: 'start'
  },
  press(k) { if (!this.held[k]) { this.pressed[k] = true; this.rt[k] = 0; } this.held[k] = true; Snd.unlock(); },
  release(k) { this.held[k] = false; },
  clear() { this.held = {}; this.pressed = {}; },
  tick(dt) { // auto ulang untuk arah
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
addEventListener('blur', () => Input.clear());
document.querySelectorAll('#pad [data-k]').forEach(b => {
  const k = b.dataset.k;
  const down = e => { e.preventDefault(); b.classList.add('on'); Input.press(k); };
  const up = e => { e.preventDefault(); b.classList.remove('on'); Input.release(k); };
  b.addEventListener('pointerdown', down);
  b.addEventListener('pointerup', up);
  b.addEventListener('pointerleave', up);
  b.addEventListener('pointercancel', up);
});
document.getElementById('mute').addEventListener('click', () => Snd.toggle());

// ---------- Gelung & adegan ----------
const Game = {
  scenes: [], timers: [], t: 0, fade: 0, fadeTarget: 0, fadeSpeed: 4, fadeRes: null,
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
  _last = ts; Game.t += dt;
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
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH);
  for (let i = Math.max(0, s); i < Game.scenes.length; i++) {
    try { Game.scenes[i].draw(ctx); } catch (e) { console.error(e); }
  }
  if (Game.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${Game.fade})`; ctx.fillRect(0, 0, SW, SH); }
  Snd.tick();
  Input.pressed = {};
  requestAnimationFrame(frame);
}

// ---------- Lukisan asas ----------
function setFont(size) { ctx.font = `${size}px ${FONT}`; }
function txt(s, x, y, o = {}) {
  setFont(o.size || 32);
  ctx.textAlign = o.align || 'left';
  ctx.textBaseline = 'top';
  if (o.shadow) { ctx.fillStyle = o.shadow; ctx.fillText(s, x + 2, y + 2); }
  ctx.fillStyle = o.color || '#202028';
  ctx.fillText(s, x, y);
}
function rr(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}
function panel(x, y, w, h, alt) {
  ctx.fillStyle = '#283044'; rr(x, y, w, h, 10); ctx.fill();
  ctx.fillStyle = alt ? '#eef4ff' : '#fafaf6'; rr(x + 4, y + 4, w - 8, h - 8, 7); ctx.fill();
  ctx.strokeStyle = alt ? '#5a8ad0' : '#d05a5a'; ctx.lineWidth = 3; rr(x + 9, y + 9, w - 18, h - 18, 4); ctx.stroke();
}
function cursor(x, y) {
  ctx.fillStyle = '#202028';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 12, y + 9); ctx.lineTo(x, y + 18); ctx.closePath(); ctx.fill();
}
function wrapText(s, maxW, size = 32) {
  setFont(size);
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

// ---------- Dialog ----------
class Dialog {
  constructor(text, res, opts = {}) {
    this.transparent = true; this.res = res; this.opts = opts;
    const pages = Array.isArray(text) ? text : [text];
    this.pages = [];
    for (const p of pages) {
      const lines = wrapText(fmt(p), SW - 80);
      for (let i = 0; i < lines.length; i += 3) this.pages.push(lines.slice(i, i + 3));
    }
    this.pi = 0; this.chars = 0; this.done = false;
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
    panel(8, SH - 152, SW - 16, 144);
    let n = Math.floor(this.chars);
    this.cur.forEach((line, i) => {
      const s = line.slice(0, Math.max(0, n)); n -= line.length;
      txt(s, 36, SH - 124 + i * 36);
    });
    if (!this.done && this.chars >= this.len && !this.opts.noWait && Math.floor(Game.t * 3) % 2 === 0) {
      ctx.fillStyle = '#d05a5a';
      ctx.beginPath(); ctx.moveTo(SW - 50, SH - 44); ctx.lineTo(SW - 36, SH - 44); ctx.lineTo(SW - 43, SH - 35); ctx.fill();
    }
  }
}

class Choice {
  constructor(options, res, o = {}) {
    this.transparent = true; this.opts = options; this.res = res; this.o = o;
    this.i = o.start || 0; this.cancel = o.cancel === undefined ? options.length - 1 : o.cancel;
    this.vis = o.visible || 8; this.scroll = 0;
    setFont(32);
    const w = Math.max(...options.map(s => ctx.measureText(fmt(s)).width));
    this.w = Math.max(o.w || 0, 140, w + 76);
    const n = Math.min(this.vis, options.length);
    this.h = n * 38 + 30;
    this.x = o.x !== undefined ? o.x : SW - this.w - 8;
    this.y = o.y !== undefined ? o.y : SH - 156 - this.h;
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
    panel(this.x, this.y, this.w, this.h, true);
    const end = Math.min(this.opts.length, this.scroll + this.vis);
    for (let k = this.scroll; k < end; k++) {
      const yy = this.y + 16 + (k - this.scroll) * 38;
      txt(fmt(this.opts[k]), this.x + 40, yy);
      if (k === this.i) cursor(this.x + 20, yy + 7);
    }
    if (this.scroll > 0) txt('▲', this.x + this.w - 30, this.y + 8, { size: 20 });
    if (end < this.opts.length) txt('▼', this.x + this.w - 30, this.y + this.h - 28, { size: 20 });
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
