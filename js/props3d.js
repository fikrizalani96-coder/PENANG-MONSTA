'use strict';
// ===== Aset dunia 3D: tumbuhan, batu dan perabot (jaringan sebenar dibina dengan GB, tiada sprite) =====
// Setiap fungsi g_<nama>(lod) menghasilkan satu BufferGeometry yang dikongsi oleh semua contoh (instancing).
// lod 0 = dekat (butiran penuh), lod 1 = jauh (kurang segi tiga).
const PC = {
  bark: '#7c5535', bark2: '#5a3c24', leafD: '#2a6a2c', leafM: '#3f9038', leafL: '#8fcb4c', leafY: '#c4e26a', leafDeep: '#1f5a30',
  palm: '#2f8a34', palmTip: '#8ccc50', trunkP: '#a88450', trunkP2: '#7e6034', rock: '#83878f', rockL: '#c2c5cb', moss: '#6b9a48',
  soil: '#8a6644', sand: '#e8d6a0', wood: '#b98452', woodD: '#7a4e2a', cream: '#f2ece0', stone: '#a8a8b4',
};
const PR = {
  hi: true, _c: {},
  geo(name, lod = 0) {
    const k = name + ':' + lod + ':' + (this.hi ? 1 : 0);
    if (!this._c[k]) this._c[k] = this['g_' + name](lod);
    return this._c[k];
  },
  // ---------- pembina generik ----------
  // pelepah/daun melengkung sepanjang +x (lipatan V): panjang len, lebar wid, naik rise, jatuh droop; teeth = daun bergerigi
  frond(g, len, wid, rise, droop, c0, c1, o = {}) {
    const N = o.n || 7, fold = o.fold === undefined ? .4 : o.fold, a = rgb(c0), b = rgb(c1);
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = t * len, y = rise * t - droop * t * t;
      let w = wid * Math.pow(Math.sin(Math.PI * (.1 + .9 * t) * (o.blunt ? .85 : 1)), o.blunt ? .55 : .8) * (o.teeth && i % 2 ? .62 : 1);
      if (i === N) w = o.blunt ? w : 0;
      const k = (o.dark || 0) * (1 - t), col = [a[0] + (b[0] - a[0]) * t - k, a[1] + (b[1] - a[1]) * t - k, a[2] + (b[2] - a[2]) * t - k];
      pts.push({ x, y, w, col });
    }
    for (let i = 0; i < N; i++) {
      const p = pts[i], q = pts[i + 1];
      const L0 = [p.x, p.y - p.w * fold, p.w], R0 = [p.x, p.y - p.w * fold, -p.w], M0 = [p.x, p.y, 0];
      const L1 = [q.x, q.y - q.w * fold, q.w], R1 = [q.x, q.y - q.w * fold, -q.w], M1 = [q.x, q.y, 0];
      g.tri3(L0, M0, L1, p.col, p.col, q.col); g.tri3(M0, M1, L1, p.col, q.col, q.col);
      g.tri3(R0, R1, M0, p.col, q.col, p.col); g.tri3(M0, R1, M1, p.col, q.col, q.col);
    }
    return g;
  },
  // sekumpulan bilah rumput
  tuft(g, x, y, z, s, seed, o = {}) {
    const n = o.n || 6, h0 = o.h || .3, w0 = o.w || .06, c0 = o.c0 || '#3d7d2b', c1 = o.c1 || '#a8dc64';
    for (let i = 0; i < n; i++) {
      const r = hash(seed, i, 3), a = hash(seed, i, 4) * 6.283, d = hash(seed, i, 5) * .09 * s * (o.spread || 1), h = h0 * s * (.65 + hash(seed, i, 6) * .7);
      const la = a + (hash(seed, i, 7) - .5) * 2, lean = h * (.25 + hash(seed, i, 8) * .55);
      g.blade(x + Math.cos(a) * d, y, z + Math.sin(a) * d, w0 * s * (.8 + r * .5), h, Math.cos(la) * lean, Math.sin(la) * lean, la + 1.57, rgbMul(c0, .85 + hash(seed, i, 9) * .3), rgbMul(c1, .85 + hash(seed, i, 10) * .3));
    }
  },
  flower(g, x, y, z, s, col, seed) {
    const h = (.2 + hash(seed, 1, 60) * .12) * s, lean = (hash(seed, 2, 60) - .5) * .06;
    g.blade(x, y, z, .022 * s, h, lean, lean * .7, hash(seed, 3, 60) * 3, '#3a7a2a', '#5aa03a');
    const cx = x + lean, cy = y + h, cz = z + lean * .7, r = .055 * s, pc = rgb(col), ce = rgb('#f6cf3a');
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * 6.283 + hash(seed, 4, 60), b = a + 1.256;
      g.tri3([cx, cy, cz], [cx + Math.cos(a) * r, cy + .012, cz + Math.sin(a) * r], [cx + Math.cos(b) * r, cy + .012, cz + Math.sin(b) * r], ce, pc, pc);
    }
  },
  // peti kayu 0.48 (berpusat pada tapak)
  crate(g) {
    g.bx(0, .24, 0, .48, .48, .48, PC.wood, { ao: [.7, 1.05] });
    for (const s of [-1, 1]) { g.bx(s * .225, .24, 0, .05, .5, .5, PC.woodD); g.bx(0, .24, s * .225, .5, .5, .05, PC.woodD); }
    g.bx(0, .5, 0, .5, .04, .5, PC.woodD);
    return g;
  },
  // bola Monsta (separuh merah, separuh putih, jalur hitam dan butang di hadapan +z)
  ball(g, r, top = '#e03838', bot = '#f6f6f6', open = false) {
    const prof = [], cols = [], n = 4;
    for (let i = 0; i <= n; i++) { const th = Math.PI * (i / n) / 2; prof.push([Math.max(.002, Math.sin(th) * r), -Math.cos(th) * r]); cols.push(bot); }
    for (let i = 0; i <= n; i++) { const th = Math.PI / 2 + Math.PI * (i / n) / 2; prof.push([Math.max(.002, Math.sin(th) * r), -Math.cos(th) * r]); cols.push(top); }
    g.lathe(prof, 12, '#ffffff', { cols, ao: [.82, 1.05] });
    g.push().t(0, -r * .07, 0).cyl(r * 1.015, r * 1.015, r * .14, 14, '#262626').pop();
    g.push().t(0, 0, r * .96).rx(Math.PI / 2).cyl(r * .2, r * .2, r * .09, 10, '#262626').pop();
    g.push().t(0, 0, r * 1.02).rx(Math.PI / 2).cyl(r * .13, r * .13, r * .06, 10, '#ffffff', { cap: true }).pop();
    return g;
  },
  // ---------- pokok berdaun lebar (pokok hujan) ----------
  g_tree(lod) {
    const g = new GB(), hi = this.hi && lod === 0, dark = rgb(PC.leafM), lite = rgb(PC.leafY);
    g.tube([[0, 0, 0], [.04, .35, .02], [-.02, .78, -.01], [.0, 1.1, 0]], .13, .065, hi ? 6 : 5, PC.bark, { ao: [.55, 1.05], band: (t, s) => s % 2 ? .88 : 1, steps: hi ? 5 : 2, cap: false });
    if (lod === 0) {
      for (let i = 0; i < 3; i++) { g.push().ry(i * 2.1 + .4).t(.05, .02, 0).rz(-1.2).cyl(.018, .07, .26, 5, PC.bark2, { ao: [.6, 1] }).pop(); }
      g.tube([[0, .82, 0], [.14, 1.0, .04], [.3, 1.2, .1]], .045, .025, 4, PC.bark, { steps: 2 });
      g.tube([[0, .86, 0], [-.14, 1.06, .0], [-.28, 1.22, .06]], .04, .022, 4, PC.bark, { steps: 2 });
    }
    const L = lod === 0 ? [[0, 1.3, 0, .6], [.36, 1.06, .12, .44], [-.34, 1.1, .1, .44], [.04, 1.62, .0, .42]]
      : [[0, 1.3, 0, .66], [.02, 1.7, 0, .42]];
    L.forEach((l, i) => {
      g.push().t(l[0], l[1], l[2]).ry(i * 1.7).s(1, .9, 1);
      g.sph(l[3], hi ? 8 : 6, hi ? 5 : 4, dark, { ao: [.58, 1.08], c2: lite, m0: .4, mp: 1.4, disp: (x, y, z) => 1 + (N2.vn3(x * 2.6 + i * 3.1, y * 2.6, z * 2.6) - .5) * .34, cv: (x, y, z) => .88 + N2.vn3(x * 3.2 + i, y * 3.2, z * 3.2) * .26 });
      g.pop();
    });
    return g.build();
  },
  // pokok bakau: akar sanggah melengkung
  g_mangrove(lod) {
    const g = new GB(), hi = this.hi && lod === 0;
    g.tube([[0, .35, 0], [.02, .7, .01], [0, .95, 0]], .09, .06, 5, PC.bark, { ao: [.6, 1], steps: 2 });
    const n = lod === 0 ? 5 : 3;
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.283 + hash(i, 1, 80) * .5, r = .42 + hash(i, 2, 80) * .14;
      g.tube([[Math.cos(a) * .04, .6, Math.sin(a) * .04], [Math.cos(a) * r * .55, .78, Math.sin(a) * r * .55], [Math.cos(a) * r, .3, Math.sin(a) * r], [Math.cos(a) * (r + .05), -.02, Math.sin(a) * (r + .05)]], .035, .02, 4, '#8a5a3a', { steps: lod === 0 ? 4 : 2, ao: [.6, 1] });
    }
    const dark = rgb('#3c8f54'), lite = rgb('#a4dc80');
    const L = lod === 0 ? [[0, 1.2, 0, .62], [.34, .98, .1, .42], [-.32, 1.0, .12, .42], [0, 1.56, 0, .38]] : [[0, 1.2, 0, .68], [0, 1.6, 0, .4]];
    L.forEach((l, i) => { g.push().t(l[0], l[1], l[2]).s(1, .8, 1); g.sph(l[3], lod === 0 ? 8 : 6, lod === 0 ? 5 : 4, dark, { ao: [.66, 1.1], c2: lite, m0: .3, disp: (x, y, z) => 1 + (N2.vn3(x * 2.4 + i * 5, y * 2.4, z * 2.4) - .5) * .3 }); g.pop(); });
    return g.build();
  },
  // kelapa: batang melengkung bercincin, pelepah bergerigi, buah kelapa
  g_palm(lod) {
    const g = new GB(), hi = this.hi && lod === 0, top = [.24, 2.05, -.03];
    g.tube([[0, 0, 0], [.1, .7, .02], [.2, 1.4, -.01], top], .105, .06, hi ? 6 : 4, PC.trunkP, { ao: [.55, 1.1], band: (t, s) => s % 2 ? .82 : 1.02, steps: hi ? 10 : 4, cap: false });
    g.push().t(0, 0, 0);
    for (let i = 0; i < (hi ? 5 : 3); i++) g.push().ry(i * 1.3).t(.06, .0, 0).rz(-1.1).cyl(.02, .07, .22, 4, PC.trunkP2).pop();
    g.pop();
    g.push().t(top[0], top[1], top[2]);
    const nf = lod === 0 ? 9 : 6;
    for (let i = 0; i < nf; i++) {
      const a = i / nf * 6.283 + hash(i, 1, 81) * .4, up = hash(i, 2, 81);
      g.push().ry(a).rz(.25 + (i % 2) * .22);
      this.frond(g, .95 + up * .25, .16, .2 + up * .2, .8 + up * .25, PC.palm, PC.palmTip, { n: hi ? 8 : 4, teeth: hi, dark: .12 });
      g.pop();
    }
    // buah kelapa
    for (let i = 0; i < 3; i++) g.push().t(Math.cos(i * 2.1) * .1, -.1, Math.sin(i * 2.1) * .1).sph(.075, 6, 4, i % 2 ? '#6a8a3a' : '#7a5a2a', { ao: [.7, 1.05] }).pop();
    g.pop();
    return g.build();
  },
  g_banana(lod) {
    const g = new GB(), hi = lod === 0;
    g.cyl(.07, .1, .8, 7, '#a6c46a', { ao: [.6, 1.05], cap: true });
    g.push().t(0, .78, 0);
    const n = hi ? 6 : 4;
    for (let i = 0; i < n; i++) {
      g.push().ry(i / n * 6.283 + .4).rz(.55 + (i % 2) * .3);
      this.frond(g, .95 + (i % 3) * .1, .21, .3, .75 + (i % 2) * .2, '#3d9a3a', '#8ed058', { n: 6, blunt: true, fold: .25 });
      g.pop();
    }
    g.pop();
    return g.build();
  },
  g_bush(lod) {
    const g = new GB(), hi = this.hi && lod === 0, dark = rgb('#2f7a2c'), lite = rgb('#86c650');
    const L = [[0, .3, 0, .36], [.24, .24, .08, .27], [-.24, .26, .05, .27], [.02, .46, .0, .24], [.08, .22, -.26, .22]];
    (lod === 0 ? L : L.slice(0, 3)).forEach((l, i) => { g.push().t(l[0], l[1], l[2]); g.sph(l[3], hi ? 8 : 5, hi ? 5 : 3, dark, { ao: [.55, 1.08], c2: lite, m0: .3, disp: (x, y, z) => 1 + (N2.vn3(x * 2.4 + i * 9, y * 2.4, z * 2.4) - .5) * .3, cv: (x, y, z) => .9 + N2.vn3(x * 3 + i, y * 3, z * 3) * .22 }); g.pop(); });
    return g.build();
  },
  // semak berduri yang boleh ditebas: jalinan pucuk + bunga merah jambu
  g_thorn(lod) {
    const g = new GB(), hi = this.hi && lod === 0, dark = rgb('#335a26'), lite = rgb('#7aa640');
    [[0, .26, 0, .34], [.22, .22, .1, .26], [-.22, .22, .06, .26], [0, .42, -.06, .22]].forEach((l, i) => { g.push().t(l[0], l[1], l[2]); g.sph(l[3], hi ? 7 : 5, hi ? 5 : 3, dark, { ao: [.5, 1.05], c2: lite, m0: .4, disp: (x, y, z) => 1 + (N2.vn3(x * 3 + i * 4, y * 3, z * 3) - .5) * .4 }); g.pop(); });
    if (lod === 0) {
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.283; g.tube([[Math.cos(a) * .12, .22, Math.sin(a) * .12], [Math.cos(a) * .3, .5, Math.sin(a) * .3], [Math.cos(a + .5) * .42, .36 + (i % 3) * .07, Math.sin(a + .5) * .42]], .018, .008, 4, '#4a3a22', { steps: 4 }); }
      for (let i = 0; i < 9; i++) { const a = hash(i, 1, 82) * 6.283, r = .2 + hash(i, 2, 82) * .2, y = .3 + hash(i, 3, 82) * .25; g.push().t(Math.cos(a) * r, y, Math.sin(a) * r).sph(.045, 5, 3, i % 2 ? '#f070a0' : '#ffb0c8').pop(); }
    }
    return g.build();
  },
  g_fern(lod) {
    const g = new GB(), n = lod === 0 ? 7 : 4;
    for (let i = 0; i < n; i++) { g.push().ry(i / n * 6.283 + hash(i, 1, 83) * .5).rz(.35 + hash(i, 2, 83) * .2); this.frond(g, .38, .07, .08, .26, '#2a7a30', '#6cbc4c', { n: 4, teeth: true }); g.pop(); }
    return g.build();
  },
  // gugusan batu bergelugus
  g_rock(lod) {
    const g = new GB(), hi = this.hi && lod === 0, c = rgb(PC.rock), c2 = rgb(PC.rockL);
    const R = [[0, .3, 0, .44, .78], [.4, .16, .2, .26, .8], [-.36, .14, .28, .24, .7]];
    (lod === 0 ? R : R.slice(0, 1)).forEach((r, i) => {
      g.push().t(r[0], r[1], r[2]).ry(i * 1.9).s(1, r[4], .92);
      g.sph(r[3], hi ? 8 : 5, hi ? 6 : 4, c, { ao: [.62, 1.12], c2, m0: .3, mp: 1.1, disp: (x, y, z) => 1 + (N2.vn3(x * 2 + i * 7, y * 2, z * 2) - .5) * .42, cv: (x, y, z) => .88 + N2.vn3(x * 4, y * 4 + i, z * 4) * .2 });
      g.pop();
    });
    if (lod === 0) { g.push().t(.02, .55, -.02).sph(.2, 6, 4, PC.moss, { ao: [.8, 1.1], disp: (x, y, z) => y < 0 ? 0.2 : 1 + (N2.vn3(x * 3, y * 3, z * 3) - .5) * .3 }).pop(); }
    return g.build();
  },
  g_pebble(lod) {
    const g = new GB(), c = rgb('#a8a8ae');
    g.push().t(0, .06, 0).s(1, .55, .8).sph(.11, 5, 3, c, { ao: [.7, 1.1], c2: rgb('#d8d8dc'), disp: (x, y, z) => 1 + (N2.vn3(x * 3, y * 3, z * 3) - .5) * .4 }).pop();
    return g.build();
  },
  // batu sederhana untuk pinggir gunung dan gua
  g_boulder(lod) {
    const g = new GB(), c = rgb('#8a8d94'), c2 = rgb('#c8c6c0');
    g.push().t(0, .4, 0).s(1, .82, 1);
    g.sph(.62, lod === 0 && this.hi ? 9 : 6, lod === 0 && this.hi ? 7 : 4, c, { ao: [.55, 1.12], c2, m0: .35, disp: (x, y, z) => 1 + (N2.vn3(x * 1.9 + 11, y * 1.9, z * 1.9) - .5) * .5, cv: (x, y, z) => .85 + N2.vn3(x * 5, y * 5, z * 5) * .28 });
    g.pop();
    return g.build();
  },
  // kawah kristal gua yang berkilau (menggunakan bahan glow)
  g_crystal(lod) {
    const g = new GB();
    [[0, 0, 0, .1, .5, 0], [.12, 0, .05, .07, .32, .3], [-.11, 0, .04, .07, .36, -.3], [.02, 0, -.11, .06, .28, .5]].forEach(([x, y, z, r, h, t], i) => {
      g.push().t(x, y, z).rz(t * .5).ry(i * 1.3).cyl(.0, r, h, 5, ['#9ad8ff', '#c8a0ff', '#8affd8', '#ffd28a'][i], { ao: [.75, 1.3] }).pop();
      g.push().t(x, y + h * .0, z).rz(t * .5).ry(i * 1.3).cyl(r, r * .96, h * .4, 5, ['#7ac0f0', '#a888f0', '#68e8c0', '#f0b868'][i], { ao: [.6, .95] }).pop();
    });
    return g.build();
  },
  // ---------- pokok lampu jalan dan hiasan ----------
  // jisim kanopi hutan dalam (blob rendah poligon)
  g_mass(lod) {
    const g = new GB();
    g.sph(1, 6, 3, '#2f7f30', { ao: [.55, 1.05], c2: rgb('#7cb84a'), m0: .5, disp: (x, y, z) => 1 + (N2.vn3(x * 2.2, y * 2.2, z * 2.2) - .5) * .35, cv: (x, y, z) => .85 + N2.vn3(x * 3, y * 3, z * 3) * .3 });
    return g.build();
  },
  g_ball(lod) {
    const g = new GB(); g.push().t(0, .16, 0); this.ball(g, .16); g.pop(); return g.build();
  },
  g_lamp(lod) {
    const g = new GB();
    g.cyl(.08, .11, .12, 8, '#3a3f48', { cap: true });
    g.cyl(.03, .05, 1.55, 8, '#4a505a', { ao: [.7, 1.1] });
    g.push().t(0, 1.5, 0).tube([[0, 0, 0], [0, .1, 0], [.1, .16, 0], [.22, .14, 0]], .028, .022, 6, '#4a505a', { steps: 4 }).pop();
    g.push().t(.22, 1.6, 0).cyl(.13, .05, .1, 8, '#2f343c', { cap: true }).pop();
    return g.build();
  },
  g_lampGlow(lod) {
    const g = new GB();
    g.push().t(.22, 1.52, 0).sph(.075, 8, 5, '#fff2b0').pop();
    return g.build({ noUV: true });
  },
  g_bench(lod) {
    const g = new GB();
    g.bx(0, .26, 0, .78, .05, .28, PC.wood, { ao: [.8, 1] });
    g.bx(0, .5, -.12, .78, .05, .05, PC.wood); g.bx(0, .4, -.12, .78, .05, .05, PC.wood);
    for (const s of [-1, 1]) { g.bx(s * .32, .13, 0, .05, .26, .24, '#4a4a52'); g.bx(s * .32, .34, -.12, .04, .46, .04, '#4a4a52'); }
    return g.build();
  },
  g_bin(lod) {
    const g = new GB();
    g.cyl(.14, .11, .44, 10, '#3f8a5a', { ao: [.65, 1.05], cap: true, ct: '#2a5a3a' });
    g.push().t(0, .44, 0).cyl(.15, .15, .04, 10, '#2a6a44', { cap: true }).pop();
    return g.build();
  },
  g_barrel(lod) {
    const g = new GB();
    g.lathe([[.15, 0], [.18, .1], [.19, .3], [.18, .5], [.15, .58]], 10, '#c0493a', { ao: [.6, 1.05] });
    g.push().t(0, .58, 0).cyl(.15, .15, .01, 10, '#7a2a20', { cap: true }).pop();
    for (const y of [.14, .44]) g.push().t(0, y, 0).cyl(.195, .195, .03, 10, '#8a2a20').pop();
    return g.build();
  },
  g_crate(lod) { const g = new GB(); this.crate(g); return g.build(); },
  // payung pantai + kerusi rehat
  g_umbrella(lod) {
    const g = new GB(), hi = lod === 0;
    g.cyl(.018, .022, 1.3, 6, '#e8e0d0');
    const n = hi ? 8 : 6;
    for (let i = 0; i < n; i++) {
      const a0 = i / n * 6.283, a1 = (i + 1) / n * 6.283, c = i % 2 ? '#f8f4ea' : '#e0483a';
      g.tri3([0, 1.42, 0], [Math.cos(a0) * .58, 1.15, Math.sin(a0) * .58], [Math.cos(a1) * .58, 1.15, Math.sin(a1) * .58], c, c, c);
    }
    return g.build();
  },
  g_lounger(lod) {
    const g = new GB();
    g.push().t(0, .16, .05).rx(-.06).box(.34, .05, .62, '#f8f4ea', { ao: [.8, 1] }).pop();
    g.push().t(0, .3, -.26).rx(.7).box(.34, .05, .34, '#f8f4ea', { ao: [.8, 1] }).pop();
    for (const [x, z] of [[-.15, .3], [.15, .3], [-.15, -.14], [.15, -.14]]) g.bx(x, .08, z, .035, .16, .035, '#c8c0b0');
    g.bx(0, .19, .05, .36, .015, .5, '#4aa0d8');
    return g.build();
  },
};
