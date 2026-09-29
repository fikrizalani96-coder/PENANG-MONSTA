'use strict';
// ===== Dunia: peta, pergerakan, NPC, skrip =====
const MAPS = {};
const MARKERS = new Set('ADIJNOSUVZailquvy@$%&*!?+<>[]{}()/;:"\''.split(''));
let S = null; // keadaan permainan (disimpan)

function newState() {
  return {
    name: 'ALI', rival: 'JOHAN', look: 'pemain', money: 3000, badges: [], flags: {}, party: [], pc: [], bag: {},
    dex: { seen: {}, caught: {} }, map: 'rumah_pemain', x: 4, y: 5, dir: 'up', lastHeal: { map: 'rumah_pemain', x: 5, y: 5, ret: { map: 'penaga', x: 8, y: 5 } },
    ret: { map: 'penaga', x: 8, y: 5 }, door: null, time: 0, visited: {}, lastTown: 'penaga', repel: 0, surf: false, bike: false, textSpeed: 70, steps: 0
  };
}
function prepMap(m) {
  if (m._prep) return;
  m._prep = true;
  m.H = m.tiles.length; m.W = Math.max(...m.tiles.map(r => r.length));
  m.marks = [];
  const under = m.under || (m.outdoor ? '.' : '_');
  m.base = m.tiles.map((row, y) => {
    const arr = [];
    for (let x = 0; x < m.W; x++) {
      let c = row[x] || m.border || 'T';
      if (MARKERS.has(c)) { m.marks.push({ ch: c, x, y }); const d = m.o && m.o[c]; c = (d && d.u) || under; }
      arr.push(c);
    }
    return arr;
  });
}
function isWalkTile(c) { return WALK.has(c) || /\d/.test(c); }
function isWater(c) { return c === '~' || c === 'w'; }
const TOWN_ORDER = ['penaga', 'guarperahu', 'telukayertawar', 'kepalabatas', 'bertam', 'butterworth', 'tasekgelugor', 'permatangpauh', 'seberangjaya', 'perai', 'bukittambun', 'nibongtebal', 'batukawan', 'bukitmertajam', 'puncak'];
let TOWNS = [];

const World = {
  scene: null, map: null, grid: null, objs: [], busy: false, ctx: null, banner: null, fol: null, hint: null,
  // Pemain bergerak bebas: (wx, wz) ialah kedudukan sebenar dalam unit jubin (pusat jubin = i + .5).
  // x/y = jubin semasa; px/py = koordinat piksel untuk mod 2D; ang = arah hadap (0 = ke bawah skrin).
  p: {
    x: 0, y: 0, _dir: 'down', ang: 0, wx: .5, wz: .5, px: 0, py: 0, vx: 0, vz: 0, moving: null, frame: 0, anim: 0,
    walk: 0, speed: 0, jump: 0, jumpY: 0, stepAcc: 0, lastTx: -1, lastTz: -1, stuck: 0,
    get dir() { return this._dir; }, set dir(v) { this._dir = v; this.ang = angOfDir(v); }
  },
  bumpT: 0, edgeCd: 0,

  init() {
    for (const id in MAPS) { MAPS[id].id = id; prepMap(MAPS[id]); }
    TOWNS = TOWN_ORDER.filter(id => MAPS[id] && MAPS[id].fly).map(id => ({ map: id, name: MAPS[id].name, x: MAPS[id].fly[0], y: MAPS[id].fly[1] }));
    this.scene = { update: dt => this.update(dt), draw: () => this.draw() };
  },
  // ---------- muat peta ----------
  // at = { wx, wz } untuk kedudukan tepat (contoh: melintasi sempadan peta); jika tiada, pemain di pusat jubin (x, y)
  load(id, x, y, dir, door, at) {
    const m = MAPS[id]; if (!m) { console.error('Peta tiada', id); return; }
    this.map = m;
    this.ctx = door || null;
    this.grid = m.base.map(r => r.slice());
    this.W = m.W; this.H = m.H;
    this._c2d = false; // kanvas 2D dibina hanya jika diperlukan (mod 2D / alat)
    if (R3.ok) { R3.buildWorld(m, this.grid); R3.snap = true; }
    const p = this.p;
    p.wx = at ? at.wx : x + .5; p.wz = at ? at.wz : y + .5;
    p.dir = dir || 'down';
    p.vx = p.vz = p.speed = 0; p.moving = null; p.jump = p.jumpY = 0; p.stepAcc = 0; p.stuck = 0; p.frame = 0;
    this.syncPos(); p.lastTx = p.x; p.lastTz = p.y;
    this.edgeCd = .6;
    if (!m.outdoor) S.bike = false;
    if (S.surf && !isWater(this.tile(p.x, p.y))) S.surf = false;
    this.loadObjs();
    S.map = id; S.x = p.x; S.y = p.y;
    if (m.fly) { S.visited[id] = 1; S.lastTown = id; }
    this.resetFollower();
    this.music();
  },
  // kanvas peta 2D (hanya untuk mod 2D klasik dan alat pembangun)
  ensure2d() {
    if (this._c2d) return;
    const m = this.map;
    const [c, g] = mkCanvas(m.W * 16, m.H * 16);
    for (let yy = 0; yy < m.H; yy++) for (let xx = 0; xx < m.W; xx++) {
      const ch = this.grid[yy][xx];
      if (/\d/.test(ch) || BUILD.has(ch)) drawTile(g, m.outdoor ? (m.under || '.') : (m.under || '_'), xx * 16, yy * 16, xx, yy, m.tileTheme);
      else drawTile(g, ch, xx * 16, yy * 16, xx, yy, m.tileTheme);
    }
    drawBuildings(g, this.grid, m.W, m.H);
    for (let yy = 0; yy < m.H; yy++) for (let xx = 0; xx < m.W; xx++) {
      const ch = this.grid[yy][xx];
      if (/\d/.test(ch)) {
        const d = (m.doors || {})[ch] || {};
        const above = yy > 0 ? this.grid[yy - 1][xx] : '';
        const look = d.look || (BUILD.has(above) ? 'pintu' : m.outdoor ? 'gua' : 'tangga');
        drawWarpTile(g, look, xx * 16, yy * 16, above);
      }
    }
    this._canvas = c; this._g = g;
    const [bc, bg] = mkCanvas(16, 16);
    drawTile(bg, m.border || (m.outdoor ? 'T' : 'X'), 0, 0, 0, 0, m.tileTheme);
    this.borderPat = ctx.createPattern(bc, 'repeat');
    this._c2d = true;
  },
  get canvas() { this.ensure2d(); return this._canvas; },
  get g() { this.ensure2d(); return this._g; },
  syncPos() { const p = this.p; p.px = (p.wx - .5) * 16; p.py = (p.wz - .5) * 16; p.x = Math.floor(p.wx); p.y = Math.floor(p.wz); },
  music() {
    const m = this.map; if (!m) return;
    if (S.bike && m.outdoor) { Snd.music('laluan'); return; }
    Snd.music(m.music || (m.fly ? 'bandar' : m.outdoor ? 'laluan' : m.cave ? 'gua' : 'bandar'));
  },
  loadObjs() {
    const m = this.map, defs = Object.assign({}, m.o || {}, (this.ctx && this.ctx.o) || {});
    this.objs = [];
    for (const mk of m.marks) {
      const d = defs[mk.ch]; if (!d) continue;
      if (d.show && !d.show()) continue;
      if (d.item && S.flags[this.itemFlag(mk)]) continue;
      if (d.hid && S.flags[this.itemFlag(mk)]) continue;
      this.objs.push(this.mkObj(d, mk));
    }
    if (window.Sejarah && S) Sejarah.inject(this);
  },
  mkObj(d, mk) {
    return {
      def: d, key: mk.ch, x: mk.x, y: mk.y, hx: mk.x, hy: mk.y, px: mk.x * 16, py: mk.y * 16, dir: d.d || 'down', moving: null, t: 1 + Math.random() * 3,
      block: !(d.trig || d.hid), frame: 0, auto: this.autoMove(d, mk), lookT: 0
    };
  },
  // Penduduk biasa (dialog sahaja, bukan penghalang cerita) bergerak/berpaling supaya dunia terasa hidup
  autoMove(d, mk) {
    if (!d.s || d.move || d.tr || d.run || !d.t || d.show || d.u || d.still) return null;
    const m = this.map; if (!m || !m.outdoor) return 'look';
    let open = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const c = m.base[mk.y + dy] && m.base[mk.y + dy][mk.x + dx]; if (c && WALK.has(c) && c !== ',' && c !== 'L') open++; }
    return open >= 3 && hash(mk.x, mk.y, 5) < .6 ? 'wander' : 'look';
  },
  itemFlag(mk) { return `it:${this.map.id}:${mk.ch}:${mk.x},${mk.y}`; },
  trFlag(o) { return o.def.tr.id || `tr:${this.map.id}:${o.key}`; },
  refresh() {
    if (!this.map) return;
    const m = this.map, defs = Object.assign({}, m.o || {}, (this.ctx && this.ctx.o) || {});
    const keep = [];
    for (const mk of m.marks) {
      const d = defs[mk.ch]; if (!d) continue;
      const visible = !(d.show && !d.show()) && !((d.item || d.hid) && S.flags[this.itemFlag(mk)]);
      const cur = this.objs.find(o => o.key === mk.ch && o.hx === mk.x && o.hy === mk.y);
      if (visible) keep.push(cur || this.mkObj(d, mk));
    }
    this.objs = keep;
    if (window.Sejarah && S) Sejarah.inject(this);
  },
  // ---------- pertanyaan jubin ----------
  tile(x, y) { if (x < 0 || y < 0 || x >= this.W || y >= this.H) return null; return this.grid[y][x]; },
  // jubin dengan sempadan peta di luar had (untuk perlanggaran)
  tileAt(x, y) { if (x < 0 || y < 0 || x >= this.W || y >= this.H) return this.map.border || (this.map.outdoor ? 'T' : 'X'); return this.grid[y][x]; },
  objAt(x, y, blockingOnly) { return this.objs.find(o => o.x === x && o.y === y && (!blockingOnly || o.block)) || this.objs.find(o => o.moving && o.moving.tx === x && o.moving.ty === y && (!blockingOnly || o.block)); },
  // objek dalam jejari r dari titik (x, z) dunia
  objNear(x, z, r) {
    let best = null, bd = r;
    for (const o of this.objs) { const d = Math.hypot(o.px / 16 + .5 - x, o.py / 16 + .5 - z); if (d < bd) { bd = d; best = o; } }
    return best;
  },
  passable(x, y, surf) {
    const t = this.tile(x, y); if (t === null) return false;
    if (this.objAt(x, y, true)) return false;
    if (surf) return isWater(t) || isWalkTile(t);
    return isWalkTile(t);
  },
  setTile(x, y, ch) {
    if (this.grid[y][x] === 't' && R3.ok) R3.cutBush(x, y);
    this.grid[y][x] = ch;
    if (this._c2d) drawTile(this._g, ch, x * 16, y * 16, x, y, this.map.tileTheme);
  },
  // ---------- perlanggaran (bulatan pemain vs jubin pepejal dan objek) ----------
  // Segi empat pepejal [x0, z0, x1, z1] bagi jubin (i, j) atau null jika boleh dilalui
  solidRect(i, j) {
    const r = this._r || (this._r = [0, 0, 0, 0]), W = this.W, H = this.H;
    if (i < 0 || j < 0 || i >= W || j >= H) {
      const inX = i >= 0 && i < W, inY = j >= 0 && j < H, conn = this.map.conn;
      if ((inX || inY) && conn && conn[j < 0 ? 'n' : j >= H ? 's' : i < 0 ? 'w' : 'e']) return null; // pintu sempadan ke peta jiran
      r[0] = i; r[1] = j; r[2] = i + 1; r[3] = j + 1; return r;
    }
    const t = this.grid[j][i];
    let m = 0;                                    // sisipan ke dalam jubin
    if (t === 'L') m = 0;                         // tebing: pepejal kecuali lompat dari utara
    else if (WALK.has(t) || (t >= '0' && t <= '9')) return null;
    else if (t === '~' || t === 'w') { if (S.surf) return null; }
    else if (t === 'T' || t === 'Y' || t === 'r') m = .1;
    else if (t === 't' || t === 'F') m = .06;
    else if (t === 'o') m = .2;
    else if (t === 'g') m = .08;
    r[0] = i + m; r[1] = j + m; r[2] = i + 1 - m; r[3] = j + 1 - m; return r;
  },
  // Selesaikan perlanggaran bulatan (jejari R) di (nx, nz); hasil dalam this._cx/_cz, this._hit
  collide(nx, nz) {
    const R = .3; let x = nx, z = nz, hit = false;
    for (let it = 0; it < 3; it++) {
      let pushed = false;
      const i0 = Math.floor(x - R), i1 = Math.floor(x + R), j0 = Math.floor(z - R), j1 = Math.floor(z + R);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const r = this.solidRect(i, j); if (!r) continue;
        const cx = Math.max(r[0], Math.min(x, r[2])), cz = Math.max(r[1], Math.min(z, r[3]));
        const dx = x - cx, dz = z - cz, d2 = dx * dx + dz * dz;
        if (d2 >= R * R) continue;
        if (d2 > 1e-8) { const d = Math.sqrt(d2), k = (R - d) / d; x += dx * k; z += dz * k; }
        else { // pusat di dalam segi empat: tolak ikut paksi paling dekat
          const l = x - r[0], rt = r[2] - x, tp = z - r[1], bt = r[3] - z, mn = Math.min(l, rt, tp, bt);
          if (mn === l) x = r[0] - R; else if (mn === rt) x = r[2] + R; else if (mn === tp) z = r[1] - R; else z = r[3] + R;
        }
        pushed = hit = true;
      }
      for (const o of this.objs) {
        if (!o.block) continue;
        const rr = R + (o.def.sign || o.def.frag || o.def.ball || o.def.item ? .2 : .3);
        const dx = x - (o.px / 16 + .5), dz = z - (o.py / 16 + .5), d2 = dx * dx + dz * dz;
        if (d2 < rr * rr && d2 > 1e-8) { const d = Math.sqrt(d2), k = (rr - d) / d; x += dx * k; z += dz * k; pushed = hit = true; }
      }
      if (!pushed) break;
    }
    this._cx = x; this._cz = z; this._hit = hit;
  },
  // ---------- kemas kini ----------
  update(dt) {
    if (!this.map) return;
    S.time += dt;
    this.updateObjs(dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    if (window.Monet) Monet.tick(dt);
    const p = this.p;
    if (this.edgeCd > 0) this.edgeCd -= dt;
    if (this.bumpT > 0) this.bumpT -= dt;
    this.hint = null;
    if (p.moving) this.stepAnim(dt);
    else if (this.busy) { p.vx = p.vz = 0; p.speed = 0; p.frame = 0; }
    else {
      if (Input.pressed.start) this.run(() => Menus.start());
      else if (Input.pressed.a) this.run(() => this.interact());
      else { this.freeMove(dt); if (!this.busy) this.hint = this.interactTarget(); }
    }
    this.updateFollower(dt);
  },
  // Pergerakan bebas: arah relatif kamera, pecutan licin, perlanggaran dan acara jubin
  freeMove(dt) {
    const p = this.p, A = Input.axis;
    const mag = Math.min(1, Math.hypot(A.x, A.y));
    let ux = 0, uz = 0, m = 0;
    if (mag > .1) {
      const yaw = R3.ok ? R3.camYaw : 0, sn = Math.sin(yaw), cs = Math.cos(yaw);
      ux = (A.x * cs + A.y * sn) / mag; uz = (-A.x * sn + A.y * cs) / mag; // kanan skrin = (cos, -sin), atas skrin = (-sin, -cos)
      m = Input.analog ? clamp((mag - .1) / .8, .25, 1) : 1;
    }
    const run = S.bike || Input.held.b || (Input.analog && mag > .93);
    const walkV = 4, runV = S.bike ? 8.6 : 6.6;
    const vmax = S.surf ? 5 : run ? runV : walkV;
    const tvx = ux * m * vmax, tvz = uz * m * vmax;
    const k = 1 - Math.exp(-dt * (m > 0 ? 13 : 24));
    p.vx += (tvx - p.vx) * k; p.vz += (tvz - p.vz) * k;
    let sp = Math.hypot(p.vx, p.vz);
    if (sp < .05 && m === 0) { p.vx = p.vz = 0; sp = 0; }
    // keluar melalui tikar apabila menekan ke bawah
    if (this.tile(p.x, p.y) === 'E' && !this.map.noExit && A.y > .6 && Math.abs(A.x) < .7) { this.run(() => this.exitBuilding()); return; }
    if (sp > 0) {
      const ox = p.wx, oz = p.wz;
      let nx = ox + p.vx * dt, nz = oz + p.vz * dt;
      // lompat tebing (jubin L) hanya dari utara ke selatan
      if (!S.surf && p.vz > .8) {
        const ci = Math.floor(nx), cj = Math.floor(nz + .32); // tepi depan pemain menyentuh tebing
        if (this.tile(ci, cj) === 'L' && p.y === cj - 1 && Math.abs(p.vx) < p.vz) {
          if (this.passable(ci, cj + 1)) { p.dir = 'down'; this.startMove(ci, cj + 1, true); return; }
        }
      }
      this.collide(nx, nz);
      p.wx = this._cx; p.wz = this._cz;
      const moved = Math.hypot(p.wx - ox, p.wz - oz);
      // hentakan ke dinding
      if (this._hit && moved < sp * dt * .35 && m > 0) { p.stuck += dt; if (p.stuck > .25 && this.bumpT <= 0) { Snd.sfx('bump'); this.bumpT = .6; } } else p.stuck = 0;
      p.speed = moved / Math.max(dt, 1e-4);
      p.walk += moved * 2.6;
      if (sp > .4) p._dir = dirOfAng(p.ang = angLerp(p.ang, Math.atan2(p.vx, p.vz), 1 - Math.exp(-dt * 16)));
      p.frame = p.speed > .6 ? (Math.floor(p.walk) % 2 ? 1 : 2) : 0;
      this.syncPos();
      if (this.checkEdge()) return;
      this.tileEvents(moved);
    } else { p.speed = 0; p.frame = 0; }
  },
  checkEdge() {
    const p = this.p, conn = this.map.conn;
    if (this.edgeCd > 0 || !conn) return false;
    const key = p.wz < 0 ? 'n' : p.wz >= this.H ? 's' : p.wx < 0 ? 'w' : p.wx >= this.W ? 'e' : null;
    if (!key || !conn[key]) return false;
    this.run(() => this.edgeWarp(key, conn[key]));
    return true;
  },
  // Langkah satu jubin (untuk skrip cerita, ujian dan tebing); pergerakan bebas menggunakan freeMove
  tryMove(d) {
    const p = this.p, [dx, dy] = DIRS[d], nx = p.x + dx, ny = p.y + dy;
    const cur = this.tile(p.x, p.y);
    // keluar melalui tikar
    if (cur === 'E' && d === 'down' && !this.passable(nx, ny)) { this.run(() => this.exitBuilding()); return; }
    // sambungan tepi peta
    if (nx < 0 || ny < 0 || nx >= this.W || ny >= this.H) {
      const key = { up: 'n', down: 's', left: 'w', right: 'e' }[d];
      const c = this.map.conn && this.map.conn[key];
      if (c) { this.run(() => this.edgeWarp(key, c)); return; }
      this.bump(); return;
    }
    const t = this.tile(nx, ny);
    if (t === 'L' && d === 'down' && !S.surf) {
      if (this.passable(nx, ny + 1)) { this.startMove(nx, ny + 1, true); return; }
    }
    if (t === 'L' && d !== 'down') { this.bump(); return; }
    if (S.surf) {
      if (this.passable(nx, ny, true)) {
        if (!isWater(t)) { S.surf = false; this.music(); }
        this.startMove(nx, ny); return;
      }
      this.bump(); return;
    }
    if (this.passable(nx, ny)) { this.startMove(nx, ny); return; }
    this.bump();
  },
  bump() {
    this.p.frame = 0;
    if (this.bumpT <= 0) { Snd.sfx('bump'); this.bumpT = .35; }
  },
  // Gerakan berskrip ke pusat jubin (tx, ty): dari kedudukan semasa; jump = lompat tebing
  startMove(tx, ty, jump) {
    const p = this.p;
    const dx = tx + .5 - p.wx, dz = ty + .5 - p.wz, dist = Math.hypot(dx, dz);
    const spd = jump ? 3.4 : S.bike ? 8.4 : Input.held.b ? 6.4 : 4.2;
    p.moving = { fx: p.wx, fz: p.wz, tx: tx + .5, tz: ty + .5, t: 0, dur: Math.max(.06, dist / spd), jump: !!jump, dist };
    p.vx = dx / p.moving.dur; p.vz = dz / p.moving.dur;
    if (jump) Snd.sfx('move');
  },
  stepAnim(dt) {
    const p = this.p, mv = p.moving;
    mv.t += dt / mv.dur;
    const t = Math.min(1, mv.t), ox = p.wx, oz = p.wz;
    p.wx = mv.fx + (mv.tx - mv.fx) * t; p.wz = mv.fz + (mv.tz - mv.fz) * t;
    p.jump = mv.jump ? Math.sin(t * Math.PI) * .85 : 0; p.jumpY = -p.jump * 16;
    const moved = Math.hypot(p.wx - ox, p.wz - oz);
    p.speed = moved / Math.max(dt, 1e-4); p.walk += moved * 2.6;
    p.frame = t < 1 ? (Math.floor(p.walk) % 2 ? 1 : 2) : 0;
    this.syncPos();
    if (mv.t >= 1) {
      p.moving = null; p.jump = p.jumpY = 0; p.speed = 0; p.vx = p.vz = 0; p.frame = 0;
      this.tileEvents(mv.dist);
    }
  },
  // Acara selepas bergerak: masuk jubin baharu, dan setiap 1 unit jarak = 1 "langkah" (ubat nyamuk, racun, pertemuan liar)
  tileEvents(dist) {
    const p = this.p;
    p.stepAcc += dist;
    if (p.x !== p.lastTx || p.y !== p.lastTz) { p.lastTx = p.x; p.lastTz = p.y; S.x = p.x; S.y = p.y; this.bumpT = 0; this.onTileEnter(); }
    while (p.stepAcc >= 1 && !this.busy) { p.stepAcc -= 1; this.onStepUnit(); }
  },
  onTileEnter() {
    const p = this.p, t = this.tile(p.x, p.y);
    if (t === null) return;
    if (S.surf && !isWater(t)) { S.surf = false; this.music(); }
    if (/\d/.test(t)) {
      const d = (this.map.doors || {})[t];
      if (d && d.lock && d.lock()) {
        this.run(async () => { await say((typeof d.lockText === 'function' ? d.lockText() : d.lockText) || 'Pintu ini berkunci.'); await walk('P', { up: 'd', down: 'u', left: 'r', right: 'l' }[p.dir]); });
        return;
      }
      if (d) { this.run(() => this.doWarp(d, t)); return; }
    }
    if (t === 'E' && !this.map.noExit) { this.run(() => this.exitBuilding()); return; }
    const trig = this.objs.find(o => o.def.trig && o.x === p.x && o.y === p.y && (!o.def.if || o.def.if()));
    if (trig) { this.run(() => trig.def.trig(trig)); return; }
    const tr = this.checkTrainers();
    if (tr) { this.run(() => this.trainerSpot(tr)); return; }
  },
  onStepUnit() {
    const p = this.p, t = this.tile(p.x, p.y);
    if (t === null) return;
    S.steps++;
    if (S.repel > 0) {
      S.repel--;
      if (S.repel === 0) { this.run(() => UI.say('Kesan ubat nyamuk sudah habis.')); return; }
    }
    if (S.steps % 256 === 0) { for (const m of S.party) if (m.status === 'racun' && m.hp > 1) m.hp--; }
    this.checkEncounter(t);
  },
  updateObjs(dt) {
    for (const o of this.objs) {
      if (o.lookT > 0) o.lookT -= dt;
      if (o.moving) {
        const mv = o.moving; mv.t += dt / mv.dur;
        if (mv.t >= 1) { o.x = mv.tx; o.y = mv.ty; o.px = o.x * 16; o.py = o.y * 16; o.moving = null; o.frame = 0; if (mv.res) mv.res(); }
        else { o.px = (mv.fx + (mv.tx - mv.fx) * mv.t) * 16; o.py = (mv.fy + (mv.ty - mv.fy) * mv.t) * 16; o.frame = mv.t < .5 ? (mv.alt ? 1 : 2) : 0; }
        continue;
      }
      if (this.busy) continue;
      const mvT = o.def.move || o.auto;
      if (!mvT) continue;
      o.t -= dt;
      if (o.t > 0) continue;
      o.t = mvT === o.auto ? 2 + Math.random() * 4 : 1 + Math.random() * 2.5;
      if (mvT === 'spin') { o.dir = pick(['up', 'down', 'left', 'right']); continue; }
      if (mvT === 'look') { o.dir = Math.random() < .4 ? (o.def.d || 'down') : pick(['up', 'down', 'left', 'right']); continue; }
      if (mvT === 'wander') {
        const d = pick(['up', 'down', 'left', 'right']), [dx, dy] = DIRS[d];
        o.dir = d;
        const nx = o.x + dx, ny = o.y + dy, p = this.p;
        const rad = o.def.move ? 2 : 1; if (Math.abs(nx - o.hx) > rad || Math.abs(ny - o.hy) > rad) continue;
        if (!this.passable(nx, ny) || Math.hypot(nx + .5 - p.wx, ny + .5 - p.wz) < 1.2 || (p.moving && nx === Math.floor(p.moving.tx) && ny === Math.floor(p.moving.tz))) continue;
        const tl = this.tile(nx, ny); if (/\d/.test(tl) || tl === 'E' || tl === ',' || tl === 'L' || isWater(tl)) continue;
        if (this.objs.some(q => q.def.trig && q.x === nx && q.y === ny)) continue;
        o.moving = { fx: o.x, fy: o.y, tx: nx, ty: ny, t: 0, dur: .3, alt: Math.random() < .5 };
      }
    }
  },
  // ---------- Monsta pengikut (ketua kumpulan berjalan di belakang pemain) ----------
  followerMon() { if (S.surf || S.bike || !S.party || !S.party.length) return null; return S.party.find(alive) || null; },
  resetFollower() {
    const p = this.p, fx = Math.sin(p.ang), fz = Math.cos(p.ang);
    let x = p.wx, z = p.wz;
    for (const k of [1.1, .8, .5]) { const cx = p.wx - fx * k, cz = p.wz - fz * k, t = this.tileAt(Math.floor(cx), Math.floor(cz)); if (isWalkTile(t) && t !== 'L') { x = cx; z = cz; break; } }
    this.fol = { x, z, ang: p.ang, speed: 0, walk: 0, trail: [{ x, z }, { x: p.wx, z: p.wz }], idle: 0 };
  },
  updateFollower(dt) {
    const f = this.fol, p = this.p; if (!f || !R3.ok) return;
    const tr = f.trail, last = tr[tr.length - 1];
    if (Math.hypot(p.wx - last.x, p.wz - last.z) > .18) { tr.push({ x: p.wx, z: p.wz }); if (tr.length > 48) tr.shift(); }
    // sasaran: titik 1.15 unit di belakang pemain sepanjang jejak
    let need = 1.15, cx = p.wx, cz = p.wz, tx = p.wx, tz = p.wz;
    for (let i = tr.length - 1; i >= 0 && need > 0; i--) {
      const q = tr[i], d = Math.hypot(q.x - cx, q.z - cz);
      if (d >= need) { const r = need / d; tx = cx + (q.x - cx) * r; tz = cz + (q.z - cz) * r; need = 0; }
      else { need -= d; cx = q.x; cz = q.z; tx = cx; tz = cz; }
    }
    // ofset ke sisi supaya Monsta kelihatan dari kamera di belakang pemain (hanya jika jubin itu boleh dilalui)
    { const ox = tx + Math.cos(p.ang) * .42, oz = tz - Math.sin(p.ang) * .42, t = this.tileAt(Math.floor(ox), Math.floor(oz)); if (t !== null && isWalkTile(t) && t !== 'L') { tx = ox; tz = oz; } }
    const dx = tx - f.x, dz = tz - f.z, dist = Math.hypot(dx, dz);
    if (dist > 4.5) { f.x = tx; f.z = tz; f.speed = 0; return; }
    const sp = Math.min(dist * 7, 9.5);
    if (dist > .04) { const st = Math.min(dist, sp * dt); f.x += dx / dist * st; f.z += dz / dist * st; f.speed = st / Math.max(dt, 1e-4); f.ang = angLerp(f.ang, Math.atan2(dx, dz), 1 - Math.exp(-dt * 10)); f.idle = 0; }
    else { f.speed = 0; f.idle += dt; f.ang = angLerp(f.ang, Math.atan2(p.wx - f.x, p.wz - f.z), 1 - Math.exp(-dt * 3)); }
    f.walk += f.speed * dt * 2.4;
  },
  // ---------- skrip ----------
  async run(fn) {
    if (this.busy) return;
    this.busy = true;
    try { await fn(); }
    catch (e) { console.error(e); }
    finally {
      this.busy = false; this.refresh(); Input.pressed = {};
      if (window.Sejarah && Game.top() === this.scene && Sejarah.pendingChapter()) setTimeout(() => this.run(() => Sejarah.chapterCheck()), 50);
    }
  },
  // Sasaran A: objek terdekat di hadapan pemain, atau jubin khas (semak, air, komputer...)
  interactTarget() {
    const p = this.p, fx = Math.sin(p.ang), fz = Math.cos(p.ang);
    let best = null, bs = 1e9;
    for (const o of this.objs) {
      const d = o.def; if (d.trig) continue;
      const dx = o.px / 16 + .5 - p.wx, dz = o.py / 16 + .5 - p.wz, dist = Math.hypot(dx, dz);
      if (dist > (d.hid ? 1.1 : 1.5)) continue;
      const cs = dist > 1e-3 ? (dx * fx + dz * fz) / dist : 1;
      if (dist > .8 ? cs < .5 : cs < -.2) continue;
      const sc = dist + (1 - cs) * .9;
      if (sc < bs) { bs = sc; best = o; }
    }
    if (best) return { o: best };
    for (const k of [.8, 1.25]) {
      const tx = Math.floor(p.wx + fx * k), tz = Math.floor(p.wz + fz * k), t = this.tile(tx, tz);
      if (t === null) continue;
      if (t === 'C') { // kaunter: cari orang di belakangnya
        for (const k2 of [1.6, 2.1]) { const o2 = this.objNear(p.wx + fx * k2, p.wz + fz * k2, .55); if (o2 && !o2.def.trig) return { o: o2 }; }
        continue;
      }
      if (t === 't' || (isWater(t) && !S.surf) || 'nQhmg'.includes(t)) return { t, x: tx, y: tz };
      if (!isWalkTile(t)) break;
    }
    return null;
  },
  faceToward(x, z) { const p = this.p; const dx = x - p.wx, dz = z - p.wz; if (Math.hypot(dx, dz) > .05) { p.ang = Math.atan2(dx, dz); p._dir = dirOfAng(p.ang); } },
  async interact() {
    const T = this.interactTarget();
    if (!T) return;
    if (T.o) { this.faceToward(T.o.px / 16 + .5, T.o.py / 16 + .5); await this.talk(T.o); return; }
    const { t, x, y } = T;
    this.faceToward(x + .5, y + .5);
    if (t === 't') { await this.tryCut(x, y); return; }
    if (isWater(t) && !S.surf) { await this.trySurf(x, y); return; }
    if (t === 'n') {
      if (this.map.vending) { await UI.say('Mesin layan diri. Minuman sejuk!'); await Menus.shop(this.map.vending, true); return; }
      if (this.map.pc) await Menus.pc(); else await UI.say('Komputer ini sedang memaparkan berita tentang Monsta.'); return;
    }
    if (t === 'Q') { await UI.say(this.map.shelf || 'Penuh dengan buku tentang Monsta.'); return; }
    if (t === 'h') { await UI.say('Mesin rawatan Monsta. Ia berkelip-kelip.'); return; }
    if (t === 'm') { await UI.say('Mesin ini berdengung perlahan.'); return; }
    if (t === 'g') { await UI.say(this.map.statue || 'Patung gim. Nama jurulatih yang menang terukir di sini.'); return; }
  },
  // arah 4-penjuru dari objek ke pemain
  dirToPlayer(o) { const p = this.p; return dirOfAng(Math.atan2(p.wx - (o.px / 16 + .5), p.wz - (o.py / 16 + .5))); },
  async talk(o) {
    const d = o.def;
    if (d.frag) { await Sejarah.collect(d.frag); return; }
    if (d.sign) { await UI.say(d.sign); return; }
    if (d.item) {
      const n = d.n || 1;
      Snd.sfx('item');
      await UI.say(`{P} menjumpai ${d.item.toUpperCase()}${n > 1 ? ' x' + n : ''}!`);
      giveItem(d.item, n);
      S.flags[this.itemFlag({ ch: o.key, x: o.hx, y: o.hy })] = 1;
      return;
    }
    if (d.hid) {
      Snd.sfx('item');
      await UI.say(`{P} menjumpai ${d.hid.toUpperCase()} yang tersorok!`);
      giveItem(d.hid, 1);
      S.flags[this.itemFlag({ ch: o.key, x: o.hx, y: o.hy })] = 1;
      return;
    }
    if (!d.noturn && o.dir !== undefined && !d.mon) { o.dir = this.dirToPlayer(o); o.lookT = 6; }
    if (d.run) { await d.run(o); return; }
    if (d.tr && !S.flags[this.trFlag(o)]) { await this.trainerFight(o); return; }
    if (d.tr && d.tr.after) { await UI.say(d.tr.after); return; }
    if (d.t) { await UI.say(typeof d.t === 'function' ? d.t() : d.t); return; }
  },
  checkTrainers() {
    const p = this.p;
    for (const o of this.objs) {
      const d = o.def; if (!d.tr || S.flags[this.trFlag(o)] || d.tr.nosight) continue;
      if (d.show && !d.show()) continue;
      const [dx, dy] = DIRS[o.dir], range = d.tr.sight !== undefined ? d.tr.sight : 4;
      for (let i = 1; i <= range; i++) {
        const tx = o.x + dx * i, ty = o.y + dy * i;
        if (tx === p.x && ty === p.y) return o;
        const tt = this.tile(tx, ty); if (!tt || !isWalkTile(tt) || this.objAt(tx, ty, true)) break;
      }
    }
    return null;
  },
  async trainerSpot(o) {
    Snd.sfx('alert'); o.bang = true;
    await wait(.7); o.bang = false;
    await approach(o);
    this.p.dir = dirTo(this.p, o); o.lookT = 6;
    await this.trainerFight(o);
  },
  async trainerFight(o) {
    const tr = o.def.tr;
    if (tr.pre) await UI.say(tr.pre);
    const r = await fightTrainer(tr, o.def.s);
    if (r === 'win') { S.flags[this.trFlag(o)] = 1; if (tr.win) await tr.win(o); }
  },
  checkEncounter(t) {
    const e = this.map.enc; if (!e) return;
    let table = null, rate = e.rate || .1;
    if (S.surf && isWater(t)) { table = e.water; rate = e.wrate || .06; }
    else if (t === ',' || t === 'p') table = e.grass;
    else if (e.cave && (t === 'c' || t === '_' || t === 'j')) { table = e.cave; rate = e.crate || .08; }
    if (!table || !chance(rate)) return;
    const tot = table.reduce((a, r) => a + r[3], 0); let x = Math.random() * tot, row = table[0];
    for (const r of table) { x -= r[3]; if (x <= 0) { row = r; break; } }
    const lv = row[1] + rnd(row[2] - row[1] + 1);
    const lead = S.party.find(alive);
    if (S.repel > 0 && lead && lv < lead.lv) return;
    this.run(() => wildBattle(row[0], lv, this.map.ghostEnc ? { ghost: true } : {}));
  },
  // ---------- perpindahan ----------
  async go(id, x, y, dir, door, noFade, at) {
    if (!noFade) await fadeTo(1, 6);
    const prevName = this.map && this.map.name;
    this.load(id, x, y, dir, door, at);
    if (this.map.name && this.map.name !== prevName && this.map.outdoor) this.banner = { t: 2.2, s: this.map.name };
    if (!noFade) await fadeTo(0, 6);
    if (this.map.enter) await this.map.enter();
  },
  async doWarp(d, digit) {
    Snd.sfx('door');
    const src = this.map, target = MAPS[d.to];
    if (!target) { console.error('warp ke peta tiada', d.to); return; }
    if (!src.inside && target.inside && !d.keepRet) S.ret = d.ret ? { map: src.id, x: d.ret[0], y: d.ret[1] } : { map: src.id, x: this.p.x, y: this.p.y + 1 };
    if (target.template) S.door = { m: src.id, d: digit };
    let pos;
    if (Array.isArray(d.at)) pos = { x: d.at[0], y: d.at[1] };
    else pos = findTile(target, d.at || 'E');
    if (!pos) { console.error('tiada kedudukan', d); return; }
    await this.go(d.to, pos.x, pos.y, d.dir || (d.at ? 'down' : 'up'), target.template ? d : null);
  },
  async exitBuilding() {
    Snd.sfx('door');
    const r = S.ret || { map: 'penaga', x: 5, y: 6 };
    S.door = null;
    await this.go(r.map, r.x, r.y, 'down');
  },
  async edgeWarp(key, c) {
    const [id, off] = Array.isArray(c) ? c : [c, null];
    const B = MAPS[id]; if (!B) { console.error('sambungan tiada', id); return; }
    const p = this.p;
    const o = off !== null ? off : edgeOffset(this.map, B, key);
    let wx, wz, dir;
    if (key === 'n') { wx = p.wx + o; wz = B.H - .14; dir = 'up'; }
    if (key === 's') { wx = p.wx + o; wz = .14; dir = 'down'; }
    if (key === 'w') { wx = B.W - .14; wz = p.wz + o; dir = 'left'; }
    if (key === 'e') { wx = .14; wz = p.wz + o; dir = 'right'; }
    await this.go(id, Math.floor(wx), Math.floor(wz), dir, null, false, { wx, wz });
    if (window.Monet) await Monet.interstitial('peta');
  },
  async flyTo(town, m) {
    await UI.say(`${monName(m)} menggunakan TERBANG!`);
    Snd.sfx('run');
    S.surf = false; S.bike = false;
    await this.go(town.map, town.x, town.y, 'down');
  },
  async escapeRope() {
    const t = TOWNS.find(t => t.map === S.lastTown) || TOWNS[0];
    Snd.sfx('run');
    await this.go(t.map, t.x, t.y, 'down');
  },
  async toggleBike() {
    if (S.surf) { await UI.say('Tidak boleh berbasikal di atas air!'); return false; }
    if (!this.map.outdoor || this.map.nobike) { await UI.say('Tidak boleh berbasikal di sini!'); return false; }
    S.bike = !S.bike;
    await UI.say(S.bike ? '{P} menaiki BASIKAL.' : '{P} turun dari BASIKAL.');
    this.music();
    return true;
  },
  async playFlute() {
    Snd.sfx('flute');
    await UI.say('{P} memainkan SERULING...');
    await wait(1.4);
    const p = this.p, o = this.objNear(p.wx + Math.sin(p.ang) * .95, p.wz + Math.cos(p.ang) * .95, .85);
    if (o && o.def.flute) { await o.def.flute(o); return true; }
    await UI.say('Bunyinya sungguh merdu.');
    return true;
  },
  async fish() {
    const p = this.p;
    const t = this.tile(Math.floor(p.wx + Math.sin(p.ang) * .9), Math.floor(p.wz + Math.cos(p.ang) * .9));
    if (!isWater(t)) { await UI.say('Tiada air di hadapan kamu.'); return false; }
    await UI.say('{P} melempar joran...');
    await wait(.8);
    if (chance(.7)) {
      await UI.say('Oh! Ada yang makan umpan!');
      const table = (this.map.enc && this.map.enc.fish) || [['Bilis', 5, 10, 70], ['Sepat', 5, 10, 30]];
      const tot = table.reduce((a, r) => a + r[3], 0); let x = Math.random() * tot, row = table[0];
      for (const r of table) { x -= r[3]; if (x <= 0) { row = r; break; } }
      await wildBattle(row[0], row[1] + rnd(row[2] - row[1] + 1));
    } else await UI.say('Tiada apa-apa yang makan umpan...');
    return true;
  },
  async tryCut(x, y) {
    const m = S.party.find(m => m.moves.some(x => x.id === 'tebas'));
    if (!m || S.badges.length < 2) { await UI.say('Semak ini nampak boleh ditebas.'); return; }
    if (!(await UI.yes('Semak ini nampak boleh ditebas. Guna TEBAS?'))) return;
    await UI.say(`${monName(m)} menggunakan TEBAS!`);
    Snd.sfx('cut');
    this.setTile(x, y, '.');
  },
  async trySurf(x, y) {
    const m = S.party.find(m => m.moves.some(x => x.id === 'ombak'));
    if (!m || S.badges.length < 5) { await UI.say('Airnya berwarna biru jernih.'); return; }
    if (this.map.nosurf) { await UI.say('Tidak boleh berenang di sini.'); return; }
    if (!(await UI.yes('Airnya berwarna biru jernih. Mahu berenang?'))) return;
    await UI.say(`${monName(m)} menggunakan OMBAK!`);
    S.surf = true; S.bike = false;
    this.startMove(x, y);
    while (this.p.moving) await wait(.02);
  },
  // ---------- lukisan ----------
  draw() {
    if (!this.map) return;
    if (R3.ok && R3.drawWorld()) { this.drawOverlay(); return; }
    this.draw2d();
    this.drawOverlay();
  },
  drawOverlay() {
    if (R3.ok) for (const o of this.objs) if (o.bang) {
      const P = R3.project(o.px / 16 + .5, R3.hAt(o.px / 16 + .5, o.py / 16 + .5) + 1.75, o.py / 16 + .5); if (!P) continue;
      const [sx, sy] = P;
      ctx.fillStyle = '#fff'; rr(sx - 14, sy - 40, 28, 40, 8); ctx.fill();
      txt('!', sx, sy - 40, { size: 44, align: 'center', color: '#e03030', shadow: false });
    }
    // gelembung "A" di atas sasaran yang boleh diajak berinteraksi
    if (R3.ok && this.hint && !this.busy && Game.top() === this.scene) {
      const h = this.hint; let wx, wz, wy;
      if (h.o) { wx = h.o.px / 16 + .5; wz = h.o.py / 16 + .5; wy = h.o.def.s ? 1.5 : h.o.def.mon ? 1.6 : h.o.def.sign ? 1.05 : .8; }
      else { wx = h.x + .5; wz = h.y + .5; wy = 1.15; }
      const P = R3.project(wx, R3.hAt(wx, wz) + wy, wz);
      if (P) {
        const bob = Math.sin(Game.t * 5) * 4, x = P[0], y = P[1] - 30 + bob;
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
        ctx.fillStyle = '#fbf8ee'; ctx.beginPath(); ctx.arc(x, y, 22, 0, 7); ctx.fill(); ctx.restore();
        ctx.strokeStyle = '#ec7468'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(x, y, 20, 0, 7); ctx.stroke();
        ctx.fillStyle = '#fbf8ee'; ctx.beginPath(); ctx.moveTo(x - 7, y + 19); ctx.lineTo(x + 7, y + 19); ctx.lineTo(x, y + 28); ctx.fill();
        txt('A', x, y - 15, { size: 34, align: 'center', color: '#c8324a', shadow: false });
      }
    }
    if (this.banner) {
      const a = Math.min(1, this.banner.t * 2, (2.2 - this.banner.t) * 3);
      ctx.save(); ctx.globalAlpha = Math.max(0, a);
      setFont(34); const w = ctx.measureText(this.banner.s).width + 64;
      const x = INSET.l + 16, y = 16 + (IS_TOUCH ? 50 : 0);
      panel(x, y, w, 58);
      txt(this.banner.s, x + 32, y + 14, { size: 34, color: THEME.accent });
      ctx.restore();
    }
  },
  draw2d() {
    this.ensure2d();
    const p = this.p;
    const vw = SW / PX, vh = SH / PX;
    let cx = Math.round((p.px + 8 - vw / 2) * PX) / PX, cy = Math.round((p.py + 8 - vh / 2) * PX) / PX;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.scale(PX, PX);
    ctx.translate(-cx, -cy);
    ctx.fillStyle = this.borderPat; ctx.fillRect(cx - 16, cy - 16, vw + 32, vh + 32);
    ctx.drawImage(this.canvas, 0, 0);
    const ents = this.objs.filter(o => !o.def.trig && !o.def.hid).map(o => ({ o, y: o.py }));
    ents.push({ o: null, y: p.py });
    ents.sort((a, b) => a.y - b.y);
    for (const e of ents) {
      if (!e.o) { this.drawPlayer(); continue; }
      const o = e.o, d = o.def;
      if (o.px < cx - 32 || o.px > cx + vw + 16 || o.py < cy - 32 || o.py > cy + vh + 16) continue;
      if (d.sign) ctx.drawImage(signSprite(), o.px, o.py);
      else if (d.item || d.ball || d.frag) ctx.drawImage(ballSprite(d.frag ? '#e9c46a' : undefined), o.px, o.py);
      else if (d.bar) ctx.drawImage(barSprite(), o.px, o.py);
      else if (d.mon) { const img = monstaSprite(d.mon); ctx.drawImage(img, o.px - 6, o.py - 12, 28, 28); }
      else if (d.boulder) { drawTile(ctx, 'r', o.px, o.py, 0, 0); }
      else if (d.s) {
        const img = personSprite(d.s, o.dir, o.frame || 0);
        ctx.drawImage(img, o.px, o.py - 4);
        if (this.tile(o.x, o.y) === ',' && !o.moving) this.drawGrassOver(o.px, o.py);
      }
      if (o.bang) { ctx.fillStyle = '#fff'; ctx.fillRect(o.px + 4, o.py - 18, 8, 12); ctx.fillStyle = '#e03030'; ctx.fillRect(o.px + 7, o.py - 16, 2, 6); ctx.fillRect(o.px + 7, o.py - 9, 2, 2); }
    }
    ctx.restore();
  },
  drawGrassOver(x, y) {
    ctx.fillStyle = PAL.tg; ctx.fillRect(x, y + 10, 16, 6);
    ctx.fillStyle = PAL.tgd; ctx.fillRect(x + 2, y + 11, 2, 5); ctx.fillRect(x + 9, y + 11, 2, 5);
    ctx.fillStyle = '#5cb04c'; ctx.fillRect(x + 5, y + 10, 2, 6); ctx.fillRect(x + 12, y + 10, 2, 6);
  },
  drawPlayer() {
    const p = this.p;
    const x = p.px, y = p.py + (p.jumpY || 0);
    if (S.surf) {
      ctx.fillStyle = '#e8f4ff'; ctx.beginPath(); ctx.ellipse(x + 8, y + 12, 9, 4, 0, 0, 7); ctx.fill();
      const lead = S.party.find(m => m.moves.some(q => q.id === 'ombak')) || S.party[0];
      if (lead) ctx.drawImage(monstaSprite(lead.sp), x - 4, y - 2, 24, 24);
      ctx.drawImage(personSprite(S.look, p.dir, 0), x, y - 10);
      return;
    }
    if (p.jumpY) { ctx.fillStyle = '#0003'; ctx.beginPath(); ctx.ellipse(x + 8, p.py + 15, 6, 2, 0, 0, 7); ctx.fill(); }
    if (S.bike) {
      ctx.fillStyle = '#303030';
      if (p.dir === 'left' || p.dir === 'right') { ctx.fillRect(x + 1, y + 12, 5, 4); ctx.fillRect(x + 10, y + 12, 5, 4); ctx.fillStyle = '#d03030'; ctx.fillRect(x + 4, y + 11, 8, 2); }
      else { ctx.fillRect(x + 6, y + 10, 4, 6); ctx.fillStyle = '#d03030'; ctx.fillRect(x + 4, y + 8, 8, 2); }
    }
    ctx.drawImage(personSprite(S.look, p.dir, S.bike ? 0 : p.frame), x, y - 4 - (S.bike ? 2 : 0));
    if (this.tile(p.x, p.y) === ',' && !p.moving) this.drawGrassOver(x, p.py);
  }
};
function findTile(m, ch) {
  prepMap(m);
  for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (m.base[y][x] === ch) return { x, y };
  const mk = m.marks.find(k => k.ch === ch); if (mk) return { x: mk.x, y: mk.y };
  return null;
}
function edgeOpen(m, key) {
  prepMap(m);
  const cells = [];
  if (key === 'n' || key === 's') { const y = key === 'n' ? 0 : m.H - 1; for (let x = 0; x < m.W; x++) { const c = m.base[y][x]; if (isWalkTile(c) || isWater(c)) cells.push(x); } }
  else { const x = key === 'w' ? 0 : m.W - 1; for (let y = 0; y < m.H; y++) { const c = m.base[y][x]; if (isWalkTile(c) || isWater(c)) cells.push(y); } }
  return cells;
}
function edgeOffset(A, B, key) {
  const opp = { n: 's', s: 'n', e: 'w', w: 'e' }[key];
  const a = edgeOpen(A, key), b = edgeOpen(B, opp);
  if (!a.length || !b.length) return 0;
  return b[0] - a[0];
}
function dirTo(from, to) {
  const dx = to.x - from.x, dy = to.y - from.y;
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

// ---------- API skrip ----------
const say = (t, o) => UI.say(t, o);
function flag(f) { return !!S.flags[f]; }
function setFlag(f, v = true) { S.flags[f] = v; World.refresh(); }
function badges() { return S.badges.length; }
function obj(key) { return World.objs.find(o => o.key === key); }
async function give(item, n = 1, msg) {
  giveItem(item, n); Snd.sfx('item');
  await say(msg || `{P} menerima ${item.toUpperCase()}${n > 1 ? ' x' + n : ''}!`);
}
async function giveMon(sp, lv) {
  const m = makeMon(sp, lv); catchMon(sp); addMon(m);
  Snd.sfx('catch');
  await say(`{P} menerima ${sp.toUpperCase()}!`);
  if (!S.party.includes(m)) await say(`${sp.toUpperCase()} telah dihantar ke PC Monsta.`);
  return m;
}
function moveObj(o, d) {
  return new Promise(res => {
    const [dx, dy] = DIRS[d]; o.dir = d;
    o.moving = { fx: o.x, fy: o.y, tx: o.x + dx, ty: o.y + dy, t: 0, dur: .25, res, alt: (o.x + o.y) % 2 === 0 };
  });
}
const PATH = { u: 'up', d: 'down', l: 'left', r: 'right' };
async function walk(o, path) {
  for (const ch of path) {
    const d = PATH[ch];
    if (o === 'P') {
      const p = World.p; p.dir = d; const [dx, dy] = DIRS[d];
      World.startMove(p.x + dx, p.y + dy);
      while (p.moving) {
        await wait(.016);
      }
      p.frame = 0;
    } else await moveObj(o, d);
  }
}
// NPC berjalan ke sebelah pemain
async function approach(o) {
  const p = World.p;
  let guard = 20;
  while (Math.abs(o.x - p.x) + Math.abs(o.y - p.y) > 1 && guard--) {
    const d = dirTo(o, p); await moveObj(o, d);
  }
  o.dir = dirTo(o, p);
}
function faceP(o) { o.dir = dirTo(o, World.p); }
function turnP(d) { World.p.dir = d; }
async function heal(noMsg) {
  for (const m of S.party) healMon(m);
  if (!noMsg) { Snd.sfx('heal'); await wait(1); }
}
async function warp(map, x, y, dir) { await World.go(map, x, y, dir || 'down'); }
function buildTeam(team) {
  return team.map(e => Array.isArray(e) ? makeMon(e[0], e[1], e[2] ? { moves: e[2] } : {}) : e);
}
async function fightTrainer(tr, look, opts = {}) {
  const team = buildTeam(typeof tr.team === 'function' ? tr.team() : tr.team);
  const t = { cls: tr.cls, name: tr.name, look: tr.look || look, team, lose: tr.lose, money: tr.money, pay: tr.pay, items: (tr.items || []).slice(), lanun: tr.lanun };
  const r = await startBattle({ trainer: t, theme: tr.theme || World.map.theme, music: tr.music, canLose: opts.canLose, loseText: opts.loseText });
  if (r === 'lose' && !opts.canLose) { await blackout(); return 'lose'; }
  if (r === 'lose') for (const m of S.party) healMon(m);
  return r;
}
async function wildBattle(sp, lv, o = {}) {
  const m = makeMon(sp, lv);
  const r = await startBattle(Object.assign({ wild: m, theme: World.map.theme || (World.map.cave ? 'gua' : 'rumput') }, o));
  if (r === 'lose') { await blackout(); }
  return r;
}
async function blackout() {
  await say('{P} tiada lagi Monsta yang boleh bertarung!');
  let lost = Math.floor(S.money / 2);
  if (lost >= 200 && window.Monet && await UI.yes(Monet.noAds ? `Guna perlindungan premium untuk mengekalkan ${kupang(lost)}?` : `Tonton satu iklan pendek untuk mengekalkan ${kupang(lost)}?`)) {
    if (await Monet.rewarded('kekal_wang')) { lost = 0; await say('Wang kamu selamat!'); }
  }
  S.money -= lost;
  if (lost) await say(`{P} tercicir ${kupang(lost)} ketika melarikan diri...`);
  await say('{P} pengsan!');
  for (const m of S.party) healMon(m);
  if (!S.flags.juara) for (const f of ['e1', 'e2', 'e3', 'e4']) delete S.flags[f];
  S.surf = false; S.bike = false;
  const h = S.lastHeal;
  if (h.ret) S.ret = h.ret;
  if (h.door) S.door = h.door;
  const door = h.door ? (MAPS[h.door.m].doors || {})[h.door.d] : null;
  await fadeTo(1, 3);
  World.load(h.map, h.x, h.y, 'up', door);
  await fadeTo(0, 3);
  if (h.map !== 'rumah_pemain') await say('Jururawat: Monsta kamu sudah pulih sepenuhnya. Berhati-hati lain kali ya!');
  if (window.Monet) await Monet.interstitial('pengsan');
  else await say('Mak: Ya Allah, {P}! Kamu tak apa-apa? Mak dah rawat Monsta kamu. Rehatlah dulu.');
}
