'use strict';
// ===== Pembinaan dunia 3D: rupa bumi berketinggian, air, ketulan (chunk) instancing dengan LOD, bangunan dan perabot =====
const KINDS = { // jenis instance: bahan, nama geometri, ada versi jauh?, memancarkan bayang?
  tree: { mat: 'veg', far: 1, cast: 1, near: 8.5 }, mangrove: { mat: 'veg', far: 1, cast: 1, near: 8.5 }, palm: { mat: 'leaf', far: 1, cast: 1, near: 9 }, banana: { mat: 'leaf', far: 1, cast: 1, near: 9 },
  bush: { mat: 'veg', far: 1, near: 8 }, thorn: { mat: 'veg', far: 1, near: 8 }, rock: { mat: 'rigid', far: 1, cast: 1, near: 9 }, boulder: { mat: 'rigid', far: 1, cast: 1 }, pebble: { mat: 'rigid' },
  fern: { mat: 'leaf', far: 1 }, crystal: { mat: 'glow' }, lamp: { mat: 'rigid', cast: 1 }, lampGlow: { mat: 'glow' }, bench: { mat: 'rigid', cast: 1 }, bin: { mat: 'rigid' },
  barrel: { mat: 'rigid', cast: 1 }, umbrella: { mat: 'leaf', cast: 1 }, lounger: { mat: 'rigid' }, mass: { mat: 'veg', far: 0 },
};
const GRND = { // saluran splat
  '=': 1, '-': 2, 's': 3, 'c': 4, 'X': 0, 'x': 4, '_': 5, 'e': 5, 'j': 6, 'p': 7, '~': 8, 'w': 8, 'k': 8, 'b': 8,
};
const CS = 10; // saiz ketulan (unit dunia)
Object.assign(R3, {
  // ---------- persekitaran mengikut peta ----------
  envFor(m) {
    const th = m.theme, outdoor = !!m.outdoor, cave = !!m.cave, night = th === 'malam';
    if (m.sky) return { sky: m.sky, fog: [m.sky[1], 12, 40], hemi: ['#d8b8ff', '#5a3a70', .8], sun: ['#ffd0f0', 1.2], dir: [-.4, .7, .6], clouds: 0, stars: .8, exp: 1.05 };
    if (outdoor) {
      if (night) return { sky: ['#070c26', '#1a2858', '#39457a'], fog: ['#141c3c', 22, 70], hemi: ['#6c7cc0', '#2c3560', .78], sun: ['#a8bcff', .9], dir: [-.4, .8, .5], clouds: .3, stars: 1, exp: 1.08, glare: .3 };
      const T = {
        pantai: { sky: ['#3a9cf0', '#9ad6fa', '#fff0d0'], fog: ['#d4ecf6', 34, 90], hemi: ['#d0e8ff', '#a8a070', .85], sun: ['#fff0d0', 1.85] },
        bandar: { sky: ['#5a9ee0', '#b4d2ec', '#eee8dc'], fog: ['#d4e0ea', 30, 82], hemi: ['#d8e6f8', '#8a8a78', .85], sun: ['#fff0da', 1.75] },
        air: { sky: ['#3a94e8', '#a8d8fa', '#eaf6ff'], fog: ['#d8eef8', 32, 88], hemi: ['#d0e8ff', '#7a9aa0', .85], sun: ['#fff4e0', 1.8] },
        rumput: { sky: ['#4ea2ee', '#b0dcf6', '#f4f2dc'], fog: ['#d0e8ee', 28, 80], hemi: ['#cde6ff', '#78a04e', .85], sun: ['#ffe8c4', 1.8] },
      }[th] || { sky: ['#4a9eee', '#b0d8f4', '#f4f0dc'], fog: ['#d0e6f0', 28, 80], hemi: ['#cde6ff', '#7a9a52', .85], sun: ['#ffe8c4', 1.8] };
      return Object.assign({ dir: [-.55, .78, .5], clouds: 1, exp: 1.02 }, T);
    }
    if (cave) {
      if (th === 'masa') return { sky: ['#1a0a2a', '#4a2a6a', '#8a5a9a'], fog: ['#2a1a3a', 8, 34], hemi: ['#b8a0d8', '#3a2a50', .8], sun: ['#d8b8ff', .9], dir: [-.3, .8, .5], clouds: 0, stars: .5, exp: 1.1 };
      if (th === 'bandar') return { sky: ['#101418', '#181e24', '#20262c'], fog: ['#161c22', 10, 34], hemi: ['#b8c8d8', '#3a4048', .95], sun: ['#dfe8f0', .9], dir: [-.3, .8, .5], clouds: 0, exp: 1.05 };
      return { sky: ['#08060a', '#120e0a', '#1a140e'], fog: ['#120e0a', 8, 30], hemi: ['#c0a884', '#3a2c20', .85], sun: ['#ffd8a0', .9], dir: [-.3, .8, .55], clouds: 0, exp: 1.08 };
    }
    if (th === 'gim') return { sky: ['#0a0810', '#0c0a14', '#100e18'], fog: null, hemi: ['#f0e4ff', '#8a70b0', .95], sun: ['#fff0e0', .95], dir: [-.35, .85, .5], clouds: 0, exp: 1.05 };
    if (th === 'liga') return { sky: ['#0a0806', '#100c08', '#14100a'], fog: null, hemi: ['#fff0d0', '#a88040', .95], sun: ['#ffe8b8', .95], dir: [-.35, .85, .5], clouds: 0, exp: 1.05 };
    if (night) return { sky: ['#06060a', '#0a0a10', '#0e0e14'], fog: null, hemi: ['#ffdcb0', '#6a4a30', .82], sun: ['#ffd8a8', .8], dir: [-.35, .85, .5], clouds: 0, exp: 1.1 };
    return { sky: ['#06060a', '#0a0a10', '#0e0e14'], fog: null, hemi: ['#fff0d8', '#8a6a48', .95], sun: ['#fff0d0', .9], dir: [-.35, .85, .5], clouds: 0, exp: 1.06 };
  },
  clearWorld() {
    if (this.wg) { this.world.remove(this.wg); this.disposeGroup(this.wg); }
    for (const e of (this.ents || new Map()).values()) { this.world.remove(e.g); }
    for (const k of ['player', 'bike', 'surfMon', 'fol']) if (this[k]) { this.world.remove(this[k]); this[k] = null; }
    this.ents = new Map(); this.portals = []; this.chunks = []; this.bushes = {}; this.stairs = []; this.blds = [];
    if (this.pts && this.pts.parent) this.pts.parent.remove(this.pts);
    this.P && this.P.life.fill(0);
    this.wg = new THREE.Group(); this.world.add(this.wg);
  },
  // ---------- pembina utama ----------
  buildWorld(m, grid) {
    if (!this.ok) return;
    const t0 = performance.now();
    this.clearWorld();
    const wg = this.wg, W = m.W, H = m.H, outdoor = !!m.outdoor, cave = !!m.cave, inside = !outdoor && !cave, hi = this.hi;
    const M = outdoor ? 14 : cave ? 6 : 3;
    const border = m.border || (outdoor ? 'T' : 'X'), under = m.under || (outdoor ? '.' : '_');
    const isW = c => c === '~' || c === 'w';
    const cell = (x, y) => {
      if (x >= 0 && y >= 0 && x < W && y < H) return grid[y][x];
      if (outdoor) { const c = grid[Math.min(H - 1, Math.max(0, y))][Math.min(W - 1, Math.max(0, x))]; if (isW(c) || c === 'b' || c === 'k') return '~'; }
      return border;
    };
    this.grid = grid; this.map = m; this.inside = inside; this.cave = cave; this.outdoor = outdoor; this.M = M; this.W = W; this.H = H; this.cellFn = cell;
    const env = this.envFor(m); this.env = env;
    this.applyEnv(this.world, this.lightsW, this.skyW, env);
    // ----- kelas jubin -----
    const GW = W + 2 * M, GH = H + 2 * M;
    const BLDS = BUILD, WALKS = WALK;
    const solidMass = c => c === 'x' || c === '^' || c === 'X';
    const flatKeep = c => !'.f,TYtr'.includes(c);
    const groundOf = ch => {
      if ('TYtFrL'.includes(ch)) return '.';
      if (ch === '^') return cave || inside ? 'c' : '.';
      if (ch === 'x') return 'c';
      if (ch === 'X') return 'X';
      if (ch === '#' || 'KCQnhzog|md'.includes(ch)) return inside ? under : 'c';
      if (BLDS.has(ch) || /\d/.test(ch)) return under;
      return ch;
    };
    const fIdx = (i, j) => j * GW + i;
    // jarak air ke daratan (jubin): -1 = bukan air; digunakan untuk lekuk tasik dan kedalaman
    const wat = (i, j) => { if (i < 0 || j < 0 || i >= GW || j >= GH) return true; const c = cell(i - M, j - M); return isW(c) || c === 'b' || c === 'k'; };
    const wd = new Int8Array(GW * GH).fill(-1), wq = [];
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (wat(i, j)) { let land = false; for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if ((di || dj) && i + di >= 0 && j + dj >= 0 && i + di < GW && j + dj < GH && !wat(i + di, j + dj)) land = true; wd[fIdx(i, j)] = land ? 0 : 99; if (land) wq.push(i, j); }
    for (let qi = 0; qi < wq.length; qi += 2) { const i = wq[qi], j = wq[qi + 1], d = wd[fIdx(i, j)]; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < GW && b < GH && wd[fIdx(a, b)] === 99) { wd[fIdx(a, b)] = d + 1; wq.push(a, b); } } }
    this._wd = wd;
    const nearWater = (i, j) => { for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < GW && b < GH && wd[fIdx(a, b)] >= 0) return true; } return false; };
    // jarak jubin ke jubin rata (rupa bumi berbukit hanya jauh dari laluan/bangunan)
    const fd = new Float32Array(GW * GH).fill(9);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) { const x = i - M, y = j - M, inMap = x >= 0 && y >= 0 && x < W && y < H; if (!outdoor || (inMap && (flatKeep(cell(x, y)) || nearWater(i, j)))) fd[fIdx(i, j)] = 0; }
    for (let pass = 0; pass < 2; pass++) {
      const j0 = pass ? GH - 1 : 0, j1 = pass ? -1 : GH, js = pass ? -1 : 1, i0 = pass ? GW - 1 : 0, i1 = pass ? -1 : GW, is = pass ? -1 : 1;
      for (let j = j0; j !== j1; j += js) for (let i = i0; i !== i1; i += is) {
        let v = fd[fIdx(i, j)];
        for (const [di, dj, c] of [[-is, 0, 1], [0, -js, 1], [-is, -js, 1.41], [is, -js, 1.41]]) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < GW && b < GH) v = Math.min(v, fd[fIdx(a, b)] + c); }
        fd[fIdx(i, j)] = v;
      }
    }
    // tinggi bucu (2 bucu setiap jubin)
    const VW = GW * 2 + 1, VH = GH * 2 + 1, hg = new Float32Array(VW * VH), tb = (i, j) => { if (i < 0 || j < 0 || i >= GW || j >= GH) return 0; const d = wd[fIdx(i, j)]; return d >= 0 ? -.3 - Math.min(d, 3) * .08 : 0; };
    const fdAt = (wx, wz) => { const u = wx + M - .5, v = wz + M - .5, i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, g = (a, b) => fd[fIdx(Math.min(GW - 1, Math.max(0, a)), Math.min(GH - 1, Math.max(0, b)))]; return (g(i, j) * (1 - fu) + g(i + 1, j) * fu) * (1 - fv) + (g(i, j + 1) * (1 - fu) + g(i + 1, j + 1) * fu) * fv; };
    const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
    const marginRise = border === '^' ? 4.6 : 2.6;
    const seaEdge = (wx, wz) => { // tepi peta berair: tiada bukit
      const cx = Math.min(W - 1, Math.max(0, Math.floor(wx))), cy = Math.min(H - 1, Math.max(0, Math.floor(wz))), c = grid[cy][cx]; return isW(c) || c === 'b' || c === 'k';
    };
    for (let b = 0; b < VH; b++) for (let a = 0; a < VW; a++) {
      const wx = -M + a / 2, wz = -M + b / 2;
      const i0 = a % 2 ? (a - 1) / 2 : a / 2 - 1, i1 = a % 2 ? i0 : i0 + 1, j0 = b % 2 ? (b - 1) / 2 : b / 2 - 1, j1 = b % 2 ? j0 : j0 + 1;
      let base = (tb(i0, j0) + tb(i1, j0) + tb(i0, j1) + tb(i1, j1)) / 4, h = base;
      if (outdoor) {
        const inMap = wx >= 0 && wz >= 0 && wx <= W && wz <= H;
        const fdv = fdAt(wx, wz), mask = sm(.5, 2.4, fdv);
        h += ((N2.fbm(wx * .11 + 3.3, wz * .11 + 1.7, 3) - .36) * 1.0 + (N2.vn(wx * .5, wz * .5, 2) - .5) * .1) * mask * (base < -.05 ? 0 : 1);
        if (!inMap) {
          const dx = Math.max(-wx, 0, wx - W), dz = Math.max(-wz, 0, wz - H), de = Math.hypot(dx, dz);
          if (!seaEdge(wx, wz) && base > -.05) h += sm(3.2, 13, de) * (marginRise + (N2.fbm(wx * .14 + 9, wz * .14, 3) - .4) * 2.6);
        }
      }
      hg[b * VW + a] = h;
    }
    this.hg = hg; this.VW = VW; this.VH = VH;
    // ----- tekstur splat (1 teksel = 1 jubin) & warna bucu -----
    const A = new Uint8Array(GW * GH * 4), B = new Uint8Array(GW * GH * 4);
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const g = groundOf(cell(i - M, j - M));
      let c = g === 'E' ? (inside ? (under === 'j' ? 6 : 5) : 4) : (GRND[g] || 0);
      if (inside && c === 5 && /^(menara|pasaraya|stesen|klinik|makmal|muzium)/.test(m.id || '')) c = 6;
      if (!c) continue;
      (c <= 4 ? A : B)[(j * GW + i) * 4 + ((c - 1) % 4)] = 255;
    }
    const occ = c => BLDS.has(c) || c === '#' || solidMass(c) ? 1 : (c === 'T' || c === 'Y') ? .5 : (c === 't' || c === 'r') ? .25 : 0;
    const col = new Float32Array(VW * VH * 3);
    for (let b = 0; b < VH; b++) for (let a = 0; a < VW; a++) {
      const wx = -M + a / 2, wz = -M + b / 2;
      const i0 = a % 2 ? (a - 1) / 2 : a / 2 - 1, i1 = a % 2 ? i0 : i0 + 1, j0 = b % 2 ? (b - 1) / 2 : b / 2 - 1, j1 = b % 2 ? j0 : j0 + 1;
      let o = 0, wet = 0, out = 0;
      for (const [i, j] of [[i0, j0], [i1, j0], [i0, j1], [i1, j1]]) { const c = cell(i - M, j - M); o += occ(c); wet += (isW(c) || c === 'b' || c === 'k') ? 1 : 0; if (inside && (i - M < 0 || j - M < 0 || i - M >= W || j - M >= H)) out++; }
      o /= 4; wet /= 4;
      let k = (.94 + .14 * N2.vn(wx * .33, wz * .33, 4)) * (1 - .32 * o) * (1 - .16 * wet * (1 - wet) * 4);
      if (out >= 2) k = .02;
      const hh = hg[b * VW + a], tone = outdoor ? Math.min(1, Math.max(0, hh / 3)) : 0;
      // bukit di sempadan berwarna hutan lebih gelap/biru (perspektif udara dikendalikan kabus)
      col[(b * VW + a) * 3] = k * (1 - tone * .35); col[(b * VW + a) * 3 + 1] = k * (1 - tone * .18); col[(b * VW + a) * 3 + 2] = k * (1 - tone * .3);
    }
    // ----- rangkaian rupa bumi -----
    {
      const P = new Float32Array(VW * VH * 3), Nn = new Float32Array(VW * VH * 3), idx = [];
      const ht = (a, b) => hg[Math.min(VH - 1, Math.max(0, b)) * VW + Math.min(VW - 1, Math.max(0, a))];
      for (let b = 0; b < VH; b++) for (let a = 0; a < VW; a++) {
        const k = b * VW + a; P[k * 3] = -M + a / 2; P[k * 3 + 1] = hg[k]; P[k * 3 + 2] = -M + b / 2;
        const dx = (ht(a + 1, b) - ht(a - 1, b)) / 1, dz = (ht(a, b + 1) - ht(a, b - 1)) / 1, l = Math.hypot(dx, 1, dz);
        Nn[k * 3] = -dx / l; Nn[k * 3 + 1] = 1 / l; Nn[k * 3 + 2] = -dz / l;
      }
      for (let b = 0; b < VH - 1; b++) for (let a = 0; a < VW - 1; a++) { const i = b * VW + a; idx.push(i, i + VW, i + 1, i + 1, i + VW, i + VW + 1); }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
      g.computeBoundingSphere();
      const sa = this.splatTex(GW, GH, A), sb = this.splatTex(GW, GH, B);
      const tint = m.tileTheme === 'bakau' ? [.7, .78, .62] : m.tileTheme === 'gali' ? [.85, .8, .74] : [1, 1, 1];
      const ground = new THREE.Mesh(g, this.terrainMat(sa, sb, new THREE.Vector2(M, M), new THREE.Vector2(GW, GH), tint));
      ground.name = 'terrain'; ground.receiveShadow = true; ground.matrixAutoUpdate = false; ground.frustumCulled = false; wg.add(ground); this.ground = ground;
    }
    // ----- ketulan -----
    const chunks = new Map();
    const chunkAt = (x, z) => { const cx = Math.floor(x / CS), cz = Math.floor(z / CS), key = cx + ',' + cz; let c = chunks.get(key); if (!c) { c = { key, cx, cz, x: cx * CS + CS / 2, z: cz * CS + CS / 2, inst: {}, meshes: [], sigs: [], far: [], near: [], statics: [] }; chunks.set(key, c); } return c; };
    const gbOf = (c, k) => c[k] || (c[k] = new GB());
    const V = this.V, Q = this.Q, E = this.E, SC = this.SC, M4 = this.M4;
    const IL = {}; // senarai instance mengikut jenis (dipilih semula setiap bingkai mengikut jarak dan frustum)
    const inst = (kind, x, y, z, s, ry, tint, sy, tilt) => {
      const a = IL[kind] || (IL[kind] = { m: [], c: [], p: [] });
      E.set(tilt || 0, ry || 0, 0); Q.setFromEuler(E); M4.compose(V.set(x, y, z), Q, SC.set(s, sy === undefined ? s : sy, s));
      for (let i = 0; i < 16; i++) a.m.push(M4.elements[i]);
      if (tint === undefined || tint === null) a.c.push(1, 1, 1); else if (typeof tint === 'number') a.c.push(tint, tint, tint); else { const t = rgb(tint); a.c.push(t[0], t[1], t[2]); }
      a.p.push(x, y, z, Math.max(s, sy === undefined ? s : sy));
      return [kind, a.m.length / 16 - 1];
    };
    this._inst = inst;
    const hAt = (x, z) => this.terrainH(x, z);
    const dens = hi ? 1 : .55;
    const walkable = c => WALKS.has(c) || /\d/.test(c);
    const nearWalk = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && walkable(cell(x + dx, y + dy))) return true; return false; };
    const FLW = ['#ffffff', '#fff1a0', '#ffa4b4', '#ff6a5a', '#ffd24a', '#c8b4ff', '#ff9ad0'];
    const theme = m.tileTheme, water = [];
    const deepForest = new Map(); // kedalaman jubin pokok dari jubin bukan-pokok
    if (outdoor) {
      const isT = c => c === 'T' || c === 'Y';
      const dd = new Int16Array(GW * GH).fill(9);
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) if (!isT(cell(i - M, j - M))) dd[fIdx(i, j)] = 0;
      for (let pass = 0; pass < 2; pass++) {
        const j0 = pass ? GH - 1 : 0, j1 = pass ? -1 : GH, js = pass ? -1 : 1, i0 = pass ? GW - 1 : 0, i1 = pass ? -1 : GW, is = pass ? -1 : 1;
        for (let j = j0; j !== j1; j += js) for (let i = i0; i !== i1; i += is) { let v = dd[fIdx(i, j)]; for (const [di, dj] of [[-is, 0], [0, -js]]) { const a = i + di, b = j + dj; if (a >= 0 && b >= 0 && a < GW && b < GH) v = Math.min(v, dd[fIdx(a, b)] + 1); } dd[fIdx(i, j)] = v; }
      }
      deepForest.get = (x, y) => dd[fIdx(x + M, y + M)];
    }
    const wallNb = (x, y, f) => ({ u: f(cell(x, y - 1)), d: f(cell(x, y + 1)), l: f(cell(x - 1, y)), r: f(cell(x + 1, y)) });
    const isWallC = c => c === '#';
    const isMass = c => solidMass(c);
    const X = { m, W, H, cell, pal: ST.palette(m), inside, cave, outdoor, seed: Math.floor(hash(W, H, 3) * 100), vend: !!m.vending };
    const ground = (c) => { const k = 'gGr'; return gbOf(c, k); };
    // deko pantai/bandar menggantikan pokok di tepi laluan
    const roadAdj = (x, y, set) => { for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) if (set.includes(cell(x + dx, y + dy))) return true; return false; };
    const decorRule = (x, y, h) => {
      if (!outdoor || m.theme === 'malam') return null;
      if (m.theme === 'bandar' && roadAdj(x, y, ['-', '='])) { if (h < .3) return 'lamp'; if (h < .42) return 'bench'; if (h < .5) return 'bin'; }
      if (m.theme === 'pantai' && roadAdj(x, y, ['s'])) { if (h < .3) return 'umbrella'; if (h < .4) return 'lounger'; }
      return null;
    };
    // ----- imbas jubin -----
    for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) {
      const inMap = x >= 0 && y >= 0 && x < W && y < H;
      if (inside && !inMap) continue;
      const ch = cell(x, y), h = hash(x + 50, y + 50, 1), cx = x + .5, cz = y + .5;
      const gy = hAt(cx, cz), jit = (k) => (hash(x, y, 100 + k) - .5) * .3, tintV = (k, v = .14) => 1 + (hash(x, y, 200 + k) - .5) * v;
      const c = chunkAt(cx, cz);
      const deco = (extra = 0, area = 1) => { // rumput, bunga, batu kecil
        if (!inMap) return;
        const n = Math.round((2.2 + extra) * dens + hash(x, y, 30)), gg = gbOf(c, 'gGr');
        for (let i = 0; i < n; i++) PR.tuft(gg, cx + (hash(x, y, i + 20) - .5) * .95 * area, hAt(cx, cz) + 0, cz + (hash(x, y, i + 25) - .5) * .95 * area, .85 + hash(x, y, i + 35) * .6, x * 131 + y * 17 + i, { n: hi ? 6 : 4, c0: rgbMul('#3d7d2b', .85 + hash(x, y, i + 4) * .3), h: .3 });
        if (hash(x, y, 50) < .1 * (hi ? 1 : .6)) { const nf = 1 + Math.floor(hash(x, y, 51) * 3); for (let i = 0; i < nf; i++) PR.flower(gg, cx + (hash(x, y, 52 + i) - .5) * .8, gy, cz + (hash(x, y, 55 + i) - .5) * .8, 1 + hash(x, y, 58 + i) * .4, FLW[Math.floor(hash(x, y, 60 + i) * FLW.length)], x * 7 + y * 3 + i); }
        if (hash(x, y, 70) < .06) inst('fern', cx + (hash(x, y, 71) - .5) * .7, gy, cz + (hash(x, y, 72) - .5) * .7, .9 + hash(x, y, 73) * .5, hash(x, y, 74) * 6);
        if (hash(x, y, 80) < .05) inst('pebble', cx + (hash(x, y, 81) - .5) * .8, gy, cz + (hash(x, y, 82) - .5) * .8, .8 + hash(x, y, 83), hash(x, y, 84) * 6);
      };
      switch (ch) {
        case '.': if (outdoor) deco(); break;
        case 'f': if (outdoor) {
          deco(-1); const gg = gbOf(c, 'gGr');
          for (let i = 0; i < 6; i++) PR.flower(gg, cx + (hash(x, y, i + 90) - .5) * .9, gy, cz + (hash(x, y, i + 95) - .5) * .9, 1.1 + hash(x, y, i + 99) * .4, FLW[Math.floor(hash(x, y, i + 101) * FLW.length)], x * 11 + y * 5 + i);
          inst('fern', cx, gy, cz, 1.2, h * 6);
        } break;
        case 'T': case 'Y': {
          const decor = inMap ? decorRule(x, y, hash(x, y, 300)) : null;
          if (decor) {
            const ang = (() => { for (const [dx, dy, a] of [[0, 1, 0], [1, 0, Math.PI / 2], [0, -1, Math.PI], [-1, 0, -Math.PI / 2]]) if (walkable(cell(x + dx, y + dy))) return a; return 0; })();
            if (decor === 'lamp') { inst('lamp', cx, gy, cz, 1, ang - Math.PI / 2 + Math.PI); inst('lampGlow', cx, gy, cz, 1, ang - Math.PI / 2 + Math.PI); }
            else if (decor === 'bench') inst('bench', cx, gy, cz, 1.05, ang);
            else if (decor === 'bin') inst('bin', cx, gy, cz, 1.05, 0);
            else if (decor === 'umbrella') { inst('umbrella', cx, gy, cz, 1, h * 6, null, 1); inst('lounger', cx + .28, gy, cz + .2, 1, h * 6 + 1); }
            else if (decor === 'lounger') { inst('lounger', cx, gy, cz, 1.1, ang); inst('umbrella', cx - .3, gy, cz - .25, .8, h * 4); }
            break;
          }
          const dp = outdoor ? deepForest.get(x, y) : 0, dEdge = inMap ? 0 : Math.max(-x - 1 + 0, x - W, -y - 1, y - H, 0);
          const nw = inMap && nearWalk(x, y), s = nw ? .78 + h * .1 : .95 + h * .45;
          if (ch === 'Y' || (theme !== 'bakau' && m.theme === 'pantai' && hash(x, y, 9) < .35)) {
            if (dp >= 3) { if ((x + y * 2) % 3 === 0) inst('mass', cx + .5, gy + .1, cz + .5, 2.0 + h * .4, h * 6, [.62, .82, .3], 1.05); break; }
            inst('palm', cx + jit(1) * .4, gy, cz + jit(2) * .4, (nw ? .95 : 1.05) + h * .3, h * 6, tintV(1, .18), undefined, (h - .5) * .05);
            if (inMap && hash(x, y, 12) < .5) inst('fern', cx + .3, gy, cz - .28, 1, h * 5);
          } else if (dp >= 3) {
            if ((x + y * 2) % 3 === 0) inst('mass', cx + .5, gy + .1, cz + .5, 2.1 + h * .5, h * 6, tintV(2, .25), 1.1);
          }
          else {
            if (theme === 'bakau') inst('mangrove', cx + jit(1) * .3, gy, cz + jit(2) * .3, s, h * 6, tintV(3, .16));
            else inst('tree', cx + jit(1) * .3, gy, cz + jit(2) * .3, s, h * 6, tintV(3, .2));
            if (inMap && outdoor && hash(x, y, 13) < .4) deco(-1.5, .9);
          }
          break;
        }
        case 't': {
          const r = inst('thorn', cx, gy, cz, 1.05, h * 5, tintV(5), 1.12);
          if (inMap) this.bushes[x + ',' + y] = r;
          break;
        }
        case 'r': inst('rock', cx, gy, cz, .95, h * 6, tintV(6, .18), .95); if (outdoor) deco(-1.5); break;
        case '^': case 'x': case 'X': ST.rock(Object.assign(X, { gB: gbOf(c, 'gB') }), x, y, wallNb(x, y, isMass), ch); break;
        case '#': ST.wall(Object.assign(X, { gB: gbOf(c, 'gB'), gR: gbOf(c, 'gR'), gG: gbOf(c, 'gG') }), x, y, wallNb(x, y, c2 => c2 === '#' || c2 === 'X' || c2 === undefined), h); break;
        case 'F': ST.fence(Object.assign(X, { gR: gbOf(c, 'gR') }), x, y); if (outdoor) deco(-1); break;
        case ',': {
          const gg = gbOf(c, 'gGr');
          for (let i = 0; i < 4; i++) { const ox = (i % 2 - .5) * .5 + (hash(x, y, i) - .5) * .18, oz = (Math.floor(i / 2) - .5) * .5 + (hash(x, y, i + 9) - .5) * .18; PR.tuft(gg, cx + ox, gy, cz + oz, 1 + hash(x, y, i + 3) * .35, x * 77 + y * 5 + i, { n: hi ? 7 : 5, h: .62, w: .1, c0: '#2c7424', c1: '#7cc84c', spread: 1.3 }); }
          break;
        }
        case 'p': {
          const gg = gbOf(c, 'gGr'), tebu = theme === 'tebu';
          for (let i = 0; i < (tebu ? 4 : 9); i++) {
            const gx = tebu ? (i % 2 - .5) * .5 : ((i % 3) - 1) * .32, gz = tebu ? (Math.floor(i / 2) - .5) * .5 : (Math.floor(i / 3) - 1) * .32, ox = (hash(x, y, i) - .5) * .1, oz = (hash(x, y, i + 9) - .5) * .1;
            if (tebu) PR.tuft(gg, cx + gx + ox, gy, cz + gz + oz, 1.9 + hash(x, y, i + 3) * .5, x * 91 + y * 7 + i, { n: 5, h: .7, w: .06, c0: '#5a8a3a', c1: '#b0d060', spread: .8 });
            else PR.tuft(gg, cx + gx + ox, gy, cz + gz + oz, 1.1 + hash(x, y, i + 3) * .3, x * 91 + y * 7 + i, { n: hi ? 6 : 4, h: .62, w: .04, c0: '#6a9a34', c1: '#e2d46a', spread: .7 });
          }
          break;
        }
        case 'L': ST.ledge(Object.assign(X, { gR: gbOf(c, 'gR') }), x, y, h); if (outdoor) deco(-1.5); break;
        case 'b': ST.bridge(Object.assign(X, { gR: gbOf(c, 'gR'), gB: gbOf(c, 'gB') }), x, y, { l: isW(cell(x - 1, y)), r: isW(cell(x + 1, y)), u: isW(cell(x, y - 1)), d: isW(cell(x, y + 1)) }); water.push([x, y]); break;
        case 'k': ST.jetty(Object.assign(X, { gR: gbOf(c, 'gR'), gB: gbOf(c, 'gB') }), x, y); water.push([x, y]); break;
        case '~': case 'w': water.push([x, y]); break;
        case 'K': case 'C': case 'Q': case 'n': case 'h': case 'z': case 'o': case 'g': case '|': case 'm': case 'd': case 'e': case 'E':
          if (ch === 'E' && !inside) break;
          ST.furn(Object.assign(X, { gB: gbOf(c, 'gB'), gR: gbOf(c, 'gR'), gG: gbOf(c, 'gG') }), ch, x, y, wallNb(x, y, c2 => c2 === '#'), hash(x, y, 9));
          break;
        case 'c': if (!inMap || outdoor) break; if (hash(x, y, 7) < .07) inst('boulder', cx + (h - .5) * .5, gy, cz, .3 + hash(x, y, 8) * .35, h * 6, .95); if (hash(x, y, 14) < .05) inst('crystal', cx + (h - .5) * .4, gy, cz + jit(3), 1 + hash(x, y, 15) * .6, h * 6); break;
        case 's': if (outdoor && hash(x, y, 7) < .04) inst('pebble', cx, gy, cz, .7, h * 6, '#f4ece0'); if (outdoor && hash(x, y, 17) < .02) inst('boulder', cx, gy, cz, .3, h * 6, '#efe6d8'); break;
      }
    }
    // ----- pintu, tangga, portal (bukan pada bangunan) -----
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x]; if (!/\d/.test(ch)) continue;
      const d = (m.doors || {})[ch] || {}, above = y > 0 ? grid[y - 1][x] : '';
      if (BLDS.has(above)) continue;
      const look = d.look || (outdoor ? 'gua' : 'tangga'), c = chunkAt(x + .5, y + .5);
      if (look === 'portal') { this.mkPortal(x + .5, hAt(x + .5, y + .5), y + .5); continue; }
      ST.doorProp(Object.assign(X, { gB: gbOf(c, 'gB'), gR: gbOf(c, 'gR'), gG: gbOf(c, 'gG') }), x, y, look, above);
    }
    // ----- bangunan -----
    const seen = new Set();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (!BLDS.has(ch) || seen.has(x + ',' + y)) continue;
      let w = 0; while (x + w < W && (grid[y][x + w] === ch || /\d/.test(grid[y][x + w]) && y > 0 && grid[y - 1][x + w] === ch)) w++;
      let h = 0;
      while (y + h < H) { let ok = true; for (let i = 0; i < w; i++) { const c2 = grid[y + h][x + i]; if (!(c2 === ch || (/\d/.test(c2) && h > 0))) { ok = false; break; } } if (!ok) break; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) seen.add((x + i) + ',' + (y + j));
      const doors = []; for (let i = 0; i < w; i++) if (/\d/.test(grid[y + h - 1][x + i])) doors.push(i);
      const S = BLD.make(ch, w, h, doors, Math.floor(hash(x, y, 77 + W) * 1e6)), c = chunkAt(x + w / 2, y + h / 2);
      for (const [k, gg] of [['gB', S.gB], ['gR', S.gR], ['gG', S.gG]]) if (gg.count) gbOf(c, k).push().t(x, 0, y).addGB(gg).pop();
      for (const s of S.stairs) this.stairs.push({ x0: x + s.x0, x1: x + s.x1, z0: y + s.z0, z1: y + s.z1, y0: s.y0, y1: s.y1 });
      for (const sg of S.signs) c.sigs.push({ text: sg.text, x: x + sg.x, y: sg.y, z: y + sg.z, w: sg.w, h: sg.h, ry: sg.ry });
      const foot = [x, y, w, h]; (this.blds = this.blds || []).push(foot);
    }
    // ----- air -----
    this.buildWater(wg, cell, water, GW, GH, M);
    // ----- pasang jaringan ketulan -----
    let tris = 0;
    for (const c of [...chunks.values()]) {
      if (!(c.gB || c.gR || c.gG || c.gGr || c.sigs.length)) { chunks.delete(c.key); continue; }
      const grp = new THREE.Group(); grp.matrixAutoUpdate = false; wg.add(grp); c.group = grp;
      const rad = CS * .72 + 4;
      c.sph = new THREE.Sphere(new THREE.Vector3(c.x, 1.2, c.z), rad);
      for (const [key, matName, cast, recv] of [['gB', 'bld', 1, 1], ['gR', 'rigid', 1, 1], ['gG', 'glow', 0, 0], ['gGr', 'grass', 0, 1]]) {
        const g = c[key]; if (!g || !g.count) continue;
        const geo = g.build({ cell: key === 'gB' }); tris += geo.index.count / 3;
        geo.userData.shared = false;
        const mesh = new THREE.Mesh(geo, MAT[matName]); mesh.name = 'static:' + matName; mesh.castShadow = !!cast; mesh.receiveShadow = !!recv; mesh.matrixAutoUpdate = false;
        grp.add(mesh); c[key + 'M'] = mesh;
        if (key === 'gGr') c.grass = mesh;
      }
      // papan tanda
      for (const sg of c.sigs) {
        const mat = this.signMat(sg.text), pm = new THREE.Mesh(this._signGeo || (this._signGeo = new THREE.PlaneGeometry(1, 1)), mat);
        pm.scale.set(sg.w, sg.h, 1); pm.position.set(sg.x, sg.y, sg.z); pm.rotation.y = sg.ry; pm.matrixAutoUpdate = true; grp.add(pm);
        pm.userData.sign = true;
      }
      c.grpTris = tris;
    }
    this.chunks = [...chunks.values()];
    this.insts = {};
    for (const kind in IL) {
      const def = KINDS[kind], L = IL[kind], n = L.m.length / 16, mat = MAT[def.mat], geo0 = PR.geo(kind, 0), geo1 = def.far ? PR.geo(kind, 1) : null;
      if (!geo0.boundingSphere) geo0.computeBoundingSphere();
      const e = { kind, def, n, m: new Float32Array(L.m), c: new Float32Array(L.c), p: new Float32Array(L.p), r0: geo0.boundingSphere.radius, y0: geo0.boundingSphere.center.y };
      const mk = (geo, cast) => {
        const im = new THREE.InstancedMesh(geo, mat, n);
        im.instanceMatrix = new THREE.InstancedBufferAttribute(new Float32Array(n * 16), 16).setUsage(THREE.DynamicDrawUsage);
        im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
        im.frustumCulled = false; im.castShadow = !!cast; im.receiveShadow = def.mat !== 'glow'; im.matrixAutoUpdate = false; im.count = 0; im.name = 'inst:' + kind;
        wg.add(im); return im;
      };
      e.near = mk(geo0, def.cast); e.far = geo1 ? mk(geo1, false) : null; this.insts[kind] = e;
    }
    this._instKey = null;
    this.bushKinds = this.bushes;
    // rujukan untuk World
    this.snap = true; this.worldBuilt = true;
    this.buildMs = performance.now() - t0; this.buildTris = tris;
    this.player = this.bike = this.surfMon = this.fol = null;
  },
  // bahan papan tanda dengan teks
  signMat(text) {
    this._sm = this._sm || {};
    return this._sm[text] || (this._sm[text] = Object.assign(new THREE.MeshLambertMaterial({ map: TEX.sign(text) }), { userData: { keep: true } }));
  },
  splatTex(w, h, data) {
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  },
  // bahan rupa bumi: campuran atlas mengikut peta splat, dengan variasi makro
  terrainMat(sa, sb, off, size, tint) {
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const U = { uAtlas: { value: TEX.groundAtlas() }, uSA: { value: sa }, uSB: { value: sb }, uOff: { value: off }, uSize: { value: size }, uTint: { value: new THREE.Vector3(...tint) }, uTime: U3.uTime };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec2 vGP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vGP = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = `
uniform sampler2D uAtlas, uSA, uSB; uniform vec2 uOff, uSize; uniform vec3 uTint; varying vec2 vGP;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
vec3 atl(float i, vec2 p){
  vec2 cell = vec2(mod(i, 4.), floor(i / 4.));
  vec2 uv = (cell * 256. + 8. + fract(p) * 240.) / vec2(1024., 512.);
  vec2 k = 240. / vec2(1024., 512.);
  return textureGrad(uAtlas, uv, dFdx(p) * k, dFdy(p) * k).rgb;
}
` + sh.fragmentShader.replace('#include <map_fragment>', `
  vec2 wp = vGP;
  vec2 jit = vec2(vn(wp * 2.1), vn(wp * 2.1 + 17.3)) - .5;
  vec2 suv = ((wp + jit * .55) + uOff) / uSize;
  vec4 A = smoothstep(.28, .72, texture2D(uSA, suv));
  vec4 B = smoothstep(.28, .72, texture2D(uSB, suv));
  float sa = dot(A, vec4(1.)), sb = dot(B, vec4(1.));
  float sg = max(0., 1. - sa - sb);
  float macro = .86 + .28 * vn(wp * .31) + .06 * vn(wp * 1.3);
  vec2 q = wp * .5;
  vec3 col = sg * atl(0., q) * macro * vec3(1., 1.02, .96) * uTint
    + A.r * atl(1., q) + A.g * atl(2., q) + A.b * atl(3., q) + A.a * atl(4., q)
    + B.r * atl(5., q) + B.g * atl(6., q) + B.b * atl(7., q) * uTint + B.a * atl(3., q) * vec3(.34, .52, .56);
  col /= max(sg + sa + sb, .001);
  diffuseColor.rgb *= col;
`);
    };
    mat.customProgramCacheKey = () => 'tanah2'; mat.userData.tex = [sa, sb];
    return mat;
  },
  // ---------- air: gelombang, kedalaman, buih tepi pantai ----------
  buildWater(wg, cell, water, GW, GH, M) {
    this.water = null; if (!water.length) return;
    const wd = this._wd, hg = this.hg, VW = this.VW, W = this.W, H = this.H;
    const wdAt = (i, j) => (i < 0 || j < 0 || i >= GW || j >= GH) ? 3 : wd[j * GW + i];
    const near = (i, j) => { for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) if (wdAt(i + di, j + dj) >= 0 && !(i + di < 0 || j + dj < 0 || i + di >= GW || j + dj >= GH)) return true; return false; };
    const pos = [], bed = [], dep = [], idx = [];
    const dTile = (i, j) => { const d = wdAt(i, j); return d < 0 ? 0 : Math.min(d, 6); };
    const vert = (a, b) => { // bucu grid (setengah jubin)
      const i0 = a % 2 ? (a - 1) / 2 : a / 2 - 1, i1 = a % 2 ? i0 : i0 + 1, j0 = b % 2 ? (b - 1) / 2 : b / 2 - 1, j1 = b % 2 ? j0 : j0 + 1;
      pos.push(-M + a / 2, 0, -M + b / 2); bed.push(hg[b * VW + a]);
      dep.push(Math.min(1, (dTile(i0, j0) + dTile(i1, j0) + dTile(i0, j1) + dTile(i1, j1)) / 4 / 3.2));
      return pos.length / 3 - 1;
    };
    const cache = new Map(), V = (a, b) => { const k = b * 4096 + a; let v = cache.get(k); if (v === undefined) { v = vert(a, b); cache.set(k, v); } return v; };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      if (!near(i, j)) continue;
      const x = i - M, y = j - M, fine = x >= -2 && y >= -2 && x < W + 2 && y < H + 2;
      if (fine) for (let cb = 0; cb < 2; cb++) for (let ca = 0; ca < 2; ca++) {
        const a = i * 2 + ca, b = j * 2 + cb, v = [V(a, b), V(a + 1, b), V(a + 1, b + 1), V(a, b + 1)];
        if (Math.min(bed[v[0]], bed[v[1]], bed[v[2]], bed[v[3]]) > -.02) continue; // seluruh sel di atas air
        idx.push(v[0], v[2], v[1], v[0], v[3], v[2]);
      } else if (wdAt(i, j) >= 0) { const a = i * 2, b = j * 2, v = [V(a, b), V(a + 2, b), V(a + 2, b + 2), V(a, b + 2)]; idx.push(v[0], v[2], v[1], v[0], v[3], v[2]); }
    }
    if (!idx.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aDepth', new THREE.Float32BufferAttribute(dep, 1)); g.setAttribute('aBed', new THREE.Float32BufferAttribute(bed, 1)); g.setIndex(idx);
    g.computeBoundingSphere();
    const wm = new THREE.Mesh(g, this.waterMat()); wm.position.y = -.04; wm.frustumCulled = false; wm.renderOrder = 5; wm.matrixAutoUpdate = false; wm.updateMatrix();
    wg.add(wm); this.water = wm;
  },
  waterMat() {
    if (this._waterMat) return this._waterMat;
    const m = new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: U3.uTime, uShallow: { value: new THREE.Color('#5fd0d8') }, uDeep: { value: new THREE.Color('#1b6fc0') }, uSky: { value: new THREE.Color('#bfe4ff') }, uSunDir: { value: new THREE.Vector3(-.5, .8, .5) }, uSunCol: { value: new THREE.Color('#fff0d0') } }]),
      vertexShader: `attribute float aDepth; attribute float aBed; varying float vD; varying float vB; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){ vD = aDepth; vB = aBed; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        }`,
      fragmentShader: `uniform float uTime; uniform vec3 uShallow, uDeep, uSky, uSunDir, uSunCol; varying float vD; varying float vB; varying vec3 vW;
        #include <fog_pars_fragment>
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        void main(){
          vec2 p = vW.xz; float t = uTime;
          float n1 = vn(p * 1.7 + vec2(t * .35, t * .21)), n2 = vn(p * 3.1 - vec2(t * .28, t * .4)), n3 = vn(p * 6.3 + vec2(t * .6, -t * .5));
          vec2 g = vec2(n1 - .5 + (n3 - .5) * .5, n2 - .5 + (n3 - .5) * .4);
          vec3 N = normalize(vec3(g.x * .5, 1., g.y * .5));
          vec3 V = normalize(cameraPosition - vW);
          float fr = pow(1. - max(dot(N, V), 0.), 3.);
          float dep = max(vW.y - vB, 0.);
          float dd = clamp(max(dep / .5, vD), 0., 1.);
          vec3 base = mix(uShallow, uDeep, smoothstep(.05, .85, dd));
          vec3 col = mix(base, uSky, fr * .38);
          vec3 H = normalize(normalize(uSunDir) + V);
          col += uSunCol * pow(max(dot(N, H), 0.), 90.) * 1.3;
          float sp = pow(max(dot(N, H), 0.), 30.) * .12; col += uSunCol * sp;
          float wave = sin(dep * 60. - t * 2.2 + n1 * 4.) * .5 + .5;
          float foam = smoothstep(.055, .0, dep + (n2 - .5) * .035) * (.55 + .45 * wave);
          col = mix(col, vec3(1.), clamp(foam, 0., 1.) * .85);
          float alpha = mix(.35, .95, smoothstep(.0, .16, dep)); alpha = max(alpha, foam * .9);
          gl_FragColor = vec4(col, alpha);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
          #include <fog_fragment>
        }`,
      transparent: true, depthWrite: false, fog: true,
    });
    m.userData.keep = true; return (this._waterMat = m);
  },
  // ---------- ketinggian rupa bumi (bilinear pada grid bucu) + tangga/tebing/jambatan ----------
  terrainH(x, z) {
    const hg = this.hg; if (!hg) return 0;
    const u = (x + this.M) * 2, v = (z + this.M) * 2, VW = this.VW, VH = this.VH;
    let i = Math.floor(u), j = Math.floor(v); if (i < 0) i = 0; else if (i > VW - 2) i = VW - 2; if (j < 0) j = 0; else if (j > VH - 2) j = VH - 2;
    const fu = Math.min(1, Math.max(0, u - i)), fv = Math.min(1, Math.max(0, v - j)), k = j * VW + i;
    return (hg[k] * (1 - fu) + hg[k + 1] * fu) * (1 - fv) + (hg[k + VW] * (1 - fu) + hg[k + VW + 1] * fu) * fv;
  },
  hAt(x, z) {
    let h = this.terrainH(x, z);
    const tx = Math.floor(x), tz = Math.floor(z), g = this.grid;
    if (g && tx >= 0 && tz >= 0 && tx < this.W && tz < this.H) {
      const c = g[tz][tx];
      if (c === 'b') h = Math.max(h, .1); else if (c === 'k') h = Math.max(h, .12);
      else if (c === 'L') { h += ST.ledgeH(z - tz); }
      else if (c === 'p') h = Math.max(h, 0);
    }
    for (const s of this.stairs) if (x >= s.x0 && x <= s.x1 && z >= s.z0 && z <= s.z1) { const t = Math.min(1, Math.max(0, (s.z1 - z) / (s.z1 - s.z0))); h = Math.max(h, s.y1 + (s.y0 - s.y1) * t); }
    return h;
  },
  mkPortal(x, y, z) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.48, .07, 8, 28), new THREE.MeshBasicMaterial({ color: 0xf3c85a })); ring.position.y = .62;
    const core = new THREE.Mesh(new THREE.CircleGeometry(.44, 24), new THREE.MeshBasicMaterial({ color: 0xb088ff, transparent: true, opacity: .75, side: THREE.DoubleSide, depthWrite: false })); core.position.y = .62;
    const pad = new THREE.Mesh(new THREE.RingGeometry(.2, .5, 24), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false })); pad.rotation.x = -Math.PI / 2; pad.position.y = .03;
    g.add(ring, core, pad); g.userData.core = core; g.userData.ring = ring; this.wg.add(g); this.portals.push(g);
  },
  cutBush(x, y) {
    const r = this.bushes && this.bushes[x + ',' + y]; if (!r) return;
    const e = this.insts[r[0]]; if (!e) return;
    e.m.fill(0, r[1] * 16, r[1] * 16 + 16); this._instKey = null;
    this.P && this.burst(x + .5, this.hAt(x + .5, y + .5) + .3, y + .5, '#6ab048', 14);
  },
});
