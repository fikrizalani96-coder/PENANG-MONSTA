// Pengesah peta: node tools/validate.js
const fs = require('fs'), vm = require('vm'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = {
  console, Math, JSON, Object, Array, Set, Map, String, Number, Promise, setTimeout,
  UI: {}, Snd: { sfx() { }, music() { } }, Input: {}, Game: {}, window: {},
  clamp: (v, a, b) => v < a ? a : v > b ? b : v, rnd: n => Math.floor(Math.random() * n), chance: p => Math.random() < p,
  pick: a => a[0], DIRS: { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }, OPP: { up: 'down', down: 'up', left: 'right', right: 'left' },
};
vm.createContext(ctx);
const files = ['gfx', 'data', 'monsta', 'battle', 'menus', 'world', 'story', 'sejarah', 'maps/dalam', 'maps/utara', 'maps/tengah', 'maps/selatan', 'maps/masa'];
let src = '';
for (const f of files) { const p = path.join(root, 'js', f + '.js'); if (fs.existsSync(p)) src += fs.readFileSync(p, 'utf8') + '\n;\n'; }
src += ';this.FRAGS=FRAGS;this.MAPS=MAPS;this.WALK=WALK;this.MARKERS=MARKERS;this.SP=SP;this.MOVES=MOVES;this.ITEMS=ITEMS;this.prepMap=prepMap;this.edgeOffset=edgeOffset;this.edgeOpen=edgeOpen;this.TOWN_ORDER=TOWN_ORDER;';
vm.runInContext(src, ctx, { filename: 'bundle.js' });
const { MAPS, WALK, MARKERS, SP, ITEMS } = ctx;
const BLOCK = new Set('TYt~wFr^HPMGBWRx#KCQnhzog|Xmd'.split(''));
let errs = 0, warns = 0;
const err = (m, s) => { errs++; console.log('RALAT', m + ':', s); };
const warn = (m, s) => { warns++; console.log('AMARAN', m + ':', s); };
const isWalk = c => WALK.has(c) || /\d/.test(c);
const isWater = c => c === '~' || c === 'w';
for (const id in MAPS) { MAPS[id].id = id; ctx.prepMap(MAPS[id]); }
for (const id in MAPS) {
  const m = MAPS[id];
  const lens = new Set(m.tiles.map(r => r.length));
  if (lens.size > 1) err(id, 'panjang baris tidak sama ' + m.tiles.map((r, i) => i + ':' + r.length).filter(x => +x.split(':')[1] !== m.W).join(' '));
  const defs = m.o || {};
  const used = new Set();
  m.tiles.forEach((r, y) => [...r].forEach((c, x) => {
    if (MARKERS.has(c)) { used.add(c); if (!m.template && !defs[c]) err(id, `penanda ${c} tiada takrif (${x},${y})`); return; }
    if (/\d/.test(c)) { if (!(m.doors || {})[c]) err(id, `pintu ${c} tiada takrif (${x},${y})`); return; }
    if (!WALK.has(c) && !BLOCK.has(c)) err(id, `aksara tidak dikenali '${c}' (${x},${y})`);
  }));
  for (const k in defs) if (!used.has(k)) warn(id, `objek ${k} tidak diletak dalam peta`);
  // pintu
  for (const d in (m.doors || {})) {
    const door = m.doors[d];
    const T = MAPS[door.to];
    if (!T) { err(id, `pintu ${d} ke peta tiada ${door.to}`); continue; }
    if (!m.tiles.some(r => r.includes(d))) warn(id, `pintu ${d} tidak diletak`);
    if (Array.isArray(door.at)) { const c = T.base[door.at[1]] && T.base[door.at[1]][door.at[0]]; if (!c || !isWalk(c)) err(id, `pintu ${d} sasaran ${door.to} ${door.at} tidak boleh dijejak (${c})`); }
    else if (typeof door.at === 'string') { if (!T.tiles.some(r => r.includes(door.at))) err(id, `pintu ${d} sasaran ${door.to} tiada '${door.at}'`); }
    else if (!T.tiles.some(r => r.includes('E'))) err(id, `pintu ${d} sasaran ${door.to} tiada E`);
    // petak di bawah pintu (keluar)
    if (!m.inside && T.inside && !door.ret && !door.keepRet) {
      m.base.forEach((r, y) => r.forEach((c, x) => { if (c === d) { const b = m.base[y + 1] && m.base[y + 1][x]; if (!b || !isWalk(b)) err(id, `bawah pintu ${d} (${x},${y + 1}) tidak boleh dijejak '${b}'`); } }));
    }
  }
  // sambungan
  for (const k in (m.conn || {})) {
    const c = m.conn[k]; const [tid, off] = Array.isArray(c) ? c : [c, null];
    const T = MAPS[tid]; if (!T) { err(id, `sambungan ${k} ke ${tid} tiada`); continue; }
    const opp = { n: 's', s: 'n', e: 'w', w: 'e' }[k];
    const back = T.conn && T.conn[opp]; const bid = Array.isArray(back) ? back[0] : back;
    if (bid !== id) err(id, `sambungan ${k}->${tid} tiada sambungan balik (${opp}=${bid})`);
    const a = ctx.edgeOpen(m, k), b = ctx.edgeOpen(T, opp);
    if (!a.length) err(id, `tiada bukaan di tepi ${k}`);
    if (a.length !== b.length) warn(id, `lebar bukaan ${k} (${a.join(',')}) != ${tid} (${b.join(',')})`);
    const o = off !== null ? off : ctx.edgeOffset(m, T, k);
    for (const v of a) {
      const t = v + o;
      let cell;
      if (k === 'n') cell = T.base[T.H - 1] && T.base[T.H - 1][t];
      if (k === 's') cell = T.base[0] && T.base[0][t];
      if (k === 'w') cell = T.base[t] && T.base[t][T.W - 1];
      if (k === 'e') cell = T.base[t] && T.base[t][0];
      if (!cell || !(isWalk(cell) || isWater(cell))) err(id, `bukaan ${k} ${v} -> ${tid} ${t} tidak boleh dijejak ('${cell}')`);
    }
  }
  // kebolehcapaian (BFS dari semua pintu masuk)
  if (m.template) continue;
  const starts = [];
  m.base.forEach((r, y) => r.forEach((c, x) => { if (/\d/.test(c) || c === 'E') starts.push([x, y]); }));
  for (const k in (m.conn || {})) {
    for (const v of ctx.edgeOpen(m, k)) {
      if (k === 'n') starts.push([v, 0]); if (k === 's') starts.push([v, m.H - 1]);
      if (k === 'w') starts.push([0, v]); if (k === 'e') starts.push([m.W - 1, v]);
    }
  }
  if (m.fly) starts.push(m.fly);
  if (id === 'rumah_pemain') starts.push([4, 5]);
  if (id === 'dewan') starts.push([4, 6]);
  const seen = new Set(); const q = [];
  const surfOK = !!m.surfMap;
  const blockers = new Set();
  for (const mk of m.marks) { const d = defs[mk.ch]; if (d && !d.show && !d.trig && !d.hid && !d.item && (d.sign || d.s || d.ball) && !d.move) blockers.add(mk.x + ',' + mk.y); }
  for (const s of starts) { const key = s + ''; if (!seen.has(key)) { seen.add(key); q.push(s); } }
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
      let nx = x + dx, ny = y + dy;
      const c = m.base[ny] && m.base[ny][nx]; if (!c) continue;
      if (c === 'L') { if (dy !== 1) continue; ny++; nx = nx; const c2 = m.base[ny] && m.base[ny][nx]; if (!c2 || !isWalk(c2)) continue; }
      else if (!(isWalk(c) || (surfOK && isWater(c)))) continue;
      if (blockers.has(nx + ',' + ny)) continue;
      const key = nx + ',' + ny; if (seen.has(key)) continue; seen.add(key); q.push([nx, ny]);
    }
  }
  // semak semua pintu/bukaan/objek boleh dicapai
  for (const s of starts) if (![...seen].includes(s + '')) warn(id, `titik masuk ${s} terasing`);
  for (const mk of m.marks) {
    const d = defs[mk.ch]; if (!d) continue;
    const adj = [[0, 0], [0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2], [2, 0], [-2, 0]].some(([dx, dy]) => seen.has((mk.x + dx) + ',' + (mk.y + dy)));
    if (!adj && !d.mon) warn(id, `objek ${mk.ch} di (${mk.x},${mk.y}) tidak boleh dicapai`);
  }
  // kawasan terputus dari pintu masuk utama
  const regions = [];
  const all = new Set();
  m.base.forEach((r, y) => r.forEach((c, x) => { if (isWalk(c) && c !== 'L' && !blockers.has(x + ',' + y)) all.add(x + ',' + y); }));
  const unreached = [...all].filter(k => !seen.has(k));
  if (unreached.length > 0 && unreached.length < 400) {
    if (m.outdoor || m.inside || m.cave) warn(id, `${unreached.length} petak boleh jejak tidak tercapai cth ${unreached.slice(0, 4).join(' ')}`);
  }
  // pertemuan Monsta
  if (m.enc) for (const k of ['grass', 'water', 'cave', 'fish']) for (const r of (m.enc[k] || [])) if (!SP[r[0]]) err(id, `Monsta ${r[0]} tiada`);
  for (const k in defs) {
    const d = defs[k];
    if (d.item && !ITEMS[d.item]) err(id, `barang ${d.item} tiada`);
    if (d.hid && !ITEMS[d.hid]) err(id, `barang ${d.hid} tiada`);
    if (d.tr && Array.isArray(d.tr.team)) for (const e of d.tr.team) if (!SP[e[0]]) err(id, `Monsta jurulatih ${e[0]} tiada`);
  }
  for (const k in (m.doors || {})) { const dd = m.doors[k]; if (dd.stock) for (const s of dd.stock) if (!ITEMS[s]) err(id, `stok ${s} tiada`); if (dd.o) for (const kk in dd.o) { const d = dd.o[kk]; if (d.tr && Array.isArray(d.tr.team)) for (const e of d.tr.team) if (!SP[e[0]]) err(id, `Monsta ${e[0]}`); } }
}
// serpihan sejarah
for (const f of ctx.FRAGS) {
  const m = MAPS[f.map]; if (!m) { err('serpihan', f.n + ' peta tiada ' + f.map); continue; }
  const c = m.base[f.y] && m.base[f.y][f.x];
  if (!c || !isWalk(c) || /\d/.test(c) || c === 'E') err('serpihan', `#${f.n} di ${f.map} (${f.x},${f.y}) bukan petak boleh jejak ('${c}')`);
  if (m.marks.some(k => k.x === f.x && k.y === f.y)) err('serpihan', `#${f.n} bertindih objek di ${f.map}`);
  const adj = [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => { const q = m.base[f.y + dy] && m.base[f.y + dy][f.x + dx]; return q && isWalk(q); });
  if (!adj) err('serpihan', `#${f.n} tidak boleh dicapai`);
}
// peta tidak dirujuk
const ref = new Set(['rumah_pemain']);
for (const id in MAPS) { const m = MAPS[id]; for (const k in (m.conn || {})) ref.add(Array.isArray(m.conn[k]) ? m.conn[k][0] : m.conn[k]); for (const d in (m.doors || {})) ref.add(m.doors[d].to); }
for (const id in MAPS) if (!ref.has(id) && !MAPS[id].scriptOnly) warn(id, 'peta tidak dirujuk oleh mana-mana pintu/sambungan');
// harga kedai premium: pelanggan == pelayan, semua < RM10 kecuali Buang Iklan RM29.90
{
  const msrc = fs.readFileSync(path.join(root, 'js', 'monetize.js'), 'utf8').split('const rm =')[0];
  const SK = new Function('LOOKS', msrc + ';return SKUS;')({});
  for (const fn of ['create-checkout', 'stripe-webhook']) {
    const file = `supabase/functions/${fn}/skus.json`;
    const srv = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
    for (const k of SK) {
      const v = srv[k.id];
      if (!v || v.sen !== k.sen || v.once !== !!k.once) err('harga', `${k.id} tidak sepadan dengan ${file}`);
    }
    for (const id in srv) if (!SK.some(k => k.id === id)) err('harga', `${id} ada dalam ${file} tetapi tiada dalam permainan`);
  }
  for (const k of SK) if (k.id === 'buang_iklan' ? k.sen !== 2990 : k.sen >= 1000) err('harga', `${k.id} harga ${k.sen} sen di luar julat`);
  console.log('item premium disemak: ' + SK.length);
}
console.log('serpihan disemak: ' + ctx.FRAGS.length); console.log(`\n${Object.keys(MAPS).length} peta, ${errs} ralat, ${warns} amaran`);
process.exit(errs ? 1 : 0);
