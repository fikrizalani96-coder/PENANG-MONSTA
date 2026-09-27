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
  scene: null, map: null, grid: null, objs: [], busy: false, ctx: null, banner: null,
  p: { x: 0, y: 0, dir: 'down', px: 0, py: 0, moving: null, frame: 0, anim: 0 },
  turnWait: 0, bumpT: 0,

  init() {
    for (const id in MAPS) { MAPS[id].id = id; prepMap(MAPS[id]); }
    TOWNS = TOWN_ORDER.filter(id => MAPS[id] && MAPS[id].fly).map(id => ({ map: id, name: MAPS[id].name, x: MAPS[id].fly[0], y: MAPS[id].fly[1] }));
    this.scene = { update: dt => this.update(dt), draw: () => this.draw() };
  },
  // ---------- muat peta ----------
  load(id, x, y, dir, door) {
    const m = MAPS[id]; if (!m) { console.error('Peta tiada', id); return; }
    this.map = m;
    this.ctx = door || null;
    this.grid = m.base.map(r => r.slice());
    this.W = m.W; this.H = m.H;
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
    this.canvas = c; this.g = g;
    const [bc, bg] = mkCanvas(16, 16);
    drawTile(bg, m.border || (m.outdoor ? 'T' : 'X'), 0, 0, 0, 0, m.tileTheme);
    this.borderPat = ctx.createPattern(bc, 'repeat');
    this.p.x = x; this.p.y = y; this.p.dir = dir || 'down'; this.p.px = x * 16; this.p.py = y * 16; this.p.moving = null;
    if (!m.outdoor) S.bike = false;
    if (S.surf && !isWater(this.grid[y][x])) S.surf = false;
    this.loadObjs();
    S.map = id; S.x = x; S.y = y;
    if (m.fly) { S.visited[id] = 1; S.lastTown = id; }
    this.music();
  },
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
  },
  mkObj(d, mk) {
    return {
      def: d, key: mk.ch, x: mk.x, y: mk.y, hx: mk.x, hy: mk.y, px: mk.x * 16, py: mk.y * 16, dir: d.d || 'down', moving: null, t: Math.random() * 2,
      block: !(d.trig || d.hid), frame: 0
    };
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
  },
  // ---------- pertanyaan jubin ----------
  tile(x, y) { if (x < 0 || y < 0 || x >= this.W || y >= this.H) return null; return this.grid[y][x]; },
  objAt(x, y, blockingOnly) { return this.objs.find(o => o.x === x && o.y === y && (!blockingOnly || o.block)) || this.objs.find(o => o.moving && o.moving.tx === x && o.moving.ty === y && (!blockingOnly || o.block)); },
  passable(x, y, surf) {
    const t = this.tile(x, y); if (t === null) return false;
    if (this.objAt(x, y, true)) return false;
    if (surf) return isWater(t) || isWalkTile(t);
    return isWalkTile(t);
  },
  setTile(x, y, ch) {
    this.grid[y][x] = ch;
    drawTile(this.g, ch, x * 16, y * 16, x, y, this.map.tileTheme);
  },
  // ---------- kemas kini ----------
  update(dt) {
    S.time += dt;
    this.updateObjs(dt);
    if (this.banner) { this.banner.t -= dt; if (this.banner.t <= 0) this.banner = null; }
    const p = this.p;
    if (p.moving) { this.stepAnim(dt); return; }
    if (this.busy) return;
    if (Input.pressed.start) { this.run(() => Menus.start()); return; }
    if (Input.pressed.a) { this.run(() => this.interact()); return; }
    const d = Input.dir();
    if (!d) { this.turnWait = 0; p.frame = 0; return; }
    if (d !== p.dir) { p.dir = d; this.turnWait = .09; return; }
    if (this.turnWait > 0) { this.turnWait -= dt; return; }
    this.tryMove(d);
  },
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
  startMove(tx, ty, jump) {
    const p = this.p;
    const fast = (S.bike || (Input.held.b && !S.surf)) ? 2 : 1;
    p.moving = { fx: p.x, fy: p.y, tx, ty, t: 0, dur: (jump ? .4 : .24) / fast, jump };
    p.anim = (p.anim + 1) % 4;
    if (jump) Snd.sfx('move');
  },
  stepAnim(dt) {
    const p = this.p, mv = p.moving;
    mv.t += dt / mv.dur;
    if (mv.t >= 1) {
      p.x = mv.tx; p.y = mv.ty; p.px = p.x * 16; p.py = p.y * 16; p.moving = null; p.jumpY = 0;
      this.onStep();
      return;
    }
    p.px = (mv.fx + (mv.tx - mv.fx) * mv.t) * 16; p.py = (mv.fy + (mv.ty - mv.fy) * mv.t) * 16;
    p.jumpY = mv.jump ? -Math.sin(mv.t * Math.PI) * 8 : 0;
    p.frame = mv.t < .5 ? (p.anim % 2 ? 1 : 2) : 0;
  },
  onStep() {
    const p = this.p, t = this.tile(p.x, p.y);
    S.x = p.x; S.y = p.y; S.steps++;
    if (this.bumpT > 0) this.bumpT = 0;
    if (S.repel > 0) {
      S.repel--;
      if (S.repel === 0) { this.run(() => UI.say('Kesan ubat nyamuk sudah habis.')); return; }
    }
    if (S.steps % 256 === 0) { for (const m of S.party) if (m.status === 'racun' && m.hp > 1) m.hp--; }
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
    this.checkEncounter(t);
  },
  updateObjs(dt) {
    for (const o of this.objs) {
      if (o.moving) {
        const mv = o.moving; mv.t += dt / mv.dur;
        if (mv.t >= 1) { o.x = mv.tx; o.y = mv.ty; o.px = o.x * 16; o.py = o.y * 16; o.moving = null; o.frame = 0; if (mv.res) mv.res(); }
        else { o.px = (mv.fx + (mv.tx - mv.fx) * mv.t) * 16; o.py = (mv.fy + (mv.ty - mv.fy) * mv.t) * 16; o.frame = mv.t < .5 ? (mv.alt ? 1 : 2) : 0; }
        continue;
      }
      if (this.busy) continue;
      const mvT = o.def.move;
      if (!mvT) continue;
      o.t -= dt;
      if (o.t > 0) continue;
      o.t = 1 + Math.random() * 2.5;
      if (mvT === 'spin') { o.dir = pick(['up', 'down', 'left', 'right']); continue; }
      if (mvT === 'wander') {
        const d = pick(['up', 'down', 'left', 'right']), [dx, dy] = DIRS[d];
        o.dir = d;
        const nx = o.x + dx, ny = o.y + dy, p = this.p;
        if (Math.abs(nx - o.hx) > 2 || Math.abs(ny - o.hy) > 2) continue;
        if (!this.passable(nx, ny) || (nx === p.x && ny === p.y) || (p.moving && nx === p.moving.tx && ny === p.moving.ty)) continue;
        const tl = this.tile(nx, ny); if (/\d/.test(tl) || tl === 'E' || tl === ',' ) continue;
        if (this.objs.some(q => q.def.trig && q.x === nx && q.y === ny)) continue;
        o.moving = { fx: o.x, fy: o.y, tx: nx, ty: ny, t: 0, dur: .3, alt: Math.random() < .5 };
      }
    }
  },
  // ---------- skrip ----------
  async run(fn) {
    if (this.busy) return;
    this.busy = true;
    try { await fn(); }
    catch (e) { console.error(e); }
    finally { this.busy = false; this.refresh(); Input.pressed = {}; }
  },
  async interact() {
    const p = this.p, [dx, dy] = DIRS[p.dir];
    let fx = p.x + dx, fy = p.y + dy;
    let o = this.objAt(fx, fy);
    const t = this.tile(fx, fy);
    if (!o && t === 'C') { o = this.objAt(fx + dx, fy + dy); }
    if (o && o.def.trig) o = null;
    if (o) { await this.talk(o); return; }
    if (t === 't') { await this.tryCut(fx, fy); return; }
    if (isWater(t) && !S.surf) { await this.trySurf(fx, fy); return; }
    if (t === 'n') {
      if (this.map.vending) { await UI.say('Mesin layan diri. Minuman sejuk!'); await Menus.shop(this.map.vending, true); return; }
      if (this.map.pc) await Menus.pc(); else await UI.say('Komputer ini sedang memaparkan berita tentang Monsta.'); return;
    }
    if (t === 'Q') { await UI.say(this.map.shelf || 'Penuh dengan buku tentang Monsta.'); return; }
    if (t === 'h') { await UI.say('Mesin rawatan Monsta. Ia berkelip-kelip.'); return; }
    if (t === 'm') { await UI.say('Mesin ini berdengung perlahan.'); return; }
    if (t === 'g') { await UI.say(this.map.statue || 'Patung gim. Nama jurulatih yang menang terukir di sini.'); return; }
  },
  async talk(o) {
    const d = o.def;
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
    if (!d.noturn && o.dir !== undefined && !d.mon) o.dir = OPP[this.p.dir];
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
    this.p.dir = dirTo(this.p, o);
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
  async go(id, x, y, dir, door, noFade) {
    if (!noFade) await fadeTo(1, 6);
    const prevName = this.map && this.map.name;
    this.load(id, x, y, dir, door);
    if (this.map.name && this.map.name !== prevName && this.map.outdoor) this.banner = { t: 2.2, s: this.map.name };
    if (!noFade) await fadeTo(0, 6);
    if (this.map.enter) await this.map.enter();
  },
  async doWarp(d, digit) {
    Snd.sfx('door');
    const src = this.map, target = MAPS[d.to];
    if (!target) { console.error('warp ke peta tiada', d.to); return; }
    if (!src.inside && target.inside) S.ret = d.ret ? { map: src.id, x: d.ret[0], y: d.ret[1] } : { map: src.id, x: this.p.x, y: this.p.y + 1 };
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
    let x, y, dir;
    if (key === 'n') { x = p.x + o; y = B.H - 1; dir = 'up'; }
    if (key === 's') { x = p.x + o; y = 0; dir = 'down'; }
    if (key === 'w') { x = B.W - 1; y = p.y + o; dir = 'left'; }
    if (key === 'e') { x = 0; y = p.y + o; dir = 'right'; }
    await this.go(id, x, y, dir, null, false);
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
    const p = this.p, [dx, dy] = DIRS[p.dir];
    const o = this.objAt(p.x + dx, p.y + dy);
    if (o && o.def.flute) { await o.def.flute(o); return true; }
    await UI.say('Bunyinya sungguh merdu.');
    return true;
  },
  async fish() {
    const p = this.p, [dx, dy] = DIRS[p.dir];
    const t = this.tile(p.x + dx, p.y + dy);
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
      else if (d.item || d.ball) ctx.drawImage(ballSprite(), o.px, o.py);
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
    if (this.banner) {
      const a = Math.min(1, this.banner.t * 2);
      ctx.globalAlpha = a;
      setFont(30); const w = ctx.measureText(this.banner.s).width + 48;
      ctx.fillStyle = '#6a4a2a'; rr(12, 12, w, 50, 8); ctx.fill();
      ctx.fillStyle = '#f0e0c0'; rr(16, 16, w - 8, 42, 6); ctx.fill();
      txt(this.banner.s, 36, 22, { size: 30, color: '#3a2a10' });
      ctx.globalAlpha = 1;
    }
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
  const lost = Math.floor(S.money / 2); S.money -= lost;
  if (lost) await say(`{P} tercicir RM${lost} ketika melarikan diri...`);
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
  else await say('Mak: Ya Allah, {P}! Kamu tak apa-apa? Mak dah rawat Monsta kamu. Rehatlah dulu.');
}
