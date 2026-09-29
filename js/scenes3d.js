'use strict';
// ===== Arena pertempuran, skrin tajuk dan pameran: dibina daripada aset dunia yang sama (pokok, batu, bangunan, air) =====
Object.assign(R3, {
  attachPts(scene) { if (this.pts.parent !== scene) scene.add(this.pts); },
  // kumpulan instance statik dari senarai [jenis, x, y, z, skala, ry, tint, sy]; jenis jauh menggunakan geometri LOD 1
  instGroup(items, nearR = 14, cz = -4) {
    const g = new THREE.Group(), by = {};
    for (const it of items) { const def = KINDS[it[0]]; const far = def.far && Math.hypot(it[1], it[3] - cz) > nearR; (by[it[0] + (far ? 'F' : 'N')] = by[it[0] + (far ? 'F' : 'N')] || []).push(it); }
    const M4 = this.M4, Q = this.Q, E = this.E, V = this.V, SC = this.SC, C = this.C;
    for (const key in by) {
      const list = by[key], far = key.endsWith('F'), kind = key.slice(0, -1), def = KINDS[kind];
      const im = new THREE.InstancedMesh(PR.geo(kind, far ? 1 : 0), MAT[def.mat], list.length);
      list.forEach((it, i) => {
        E.set(0, it[5] || 0, 0); Q.setFromEuler(E); M4.compose(V.set(it[1], it[2], it[3]), Q, SC.set(it[4], it[7] === undefined ? it[4] : it[7], it[4]));
        im.setMatrixAt(i, M4);
        if (it[6] === undefined || it[6] === null) C.setRGB(1, 1, 1); else if (typeof it[6] === 'number') C.setRGB(it[6], it[6], it[6]); else { const t = rgb(it[6]); C.setRGB(t[0], t[1], t[2]); }
        im.setColorAt(i, C);
      });
      im.frustumCulled = false; im.castShadow = !far && !!def.cast; im.receiveShadow = def.mat !== 'glow'; im.matrixAutoUpdate = false;
      g.add(im);
    }
    return g;
  },
  // rupa bumi bulat untuk pentas (pantai/rumput/gua...): [x0..] splat 90x90; platform = [[x,z,r,saluran]]
  arenaGround(base, plats, opts = {}) {
    const GW = 90, GH = 90, ox = 45, oz = 60, A = new Uint8Array(GW * GH * 4), B = new Uint8Array(GW * GH * 4);
    const set = (i, c) => { if (!c) return; (c <= 4 ? A : B)[i * 4 + (c - 1) % 4] = 255; };
    for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
      const wx = i + .5 - ox, wz = j + .5 - oz; let c = base;
      for (const [px, pz, r, ch] of plats) if (Math.hypot(wx - px, wz - pz) < r) c = ch;
      if (opts.path && Math.abs(wx * .5) < 1.4 && wz > -3) c = opts.path;
      set(j * GW + i, c);
    }
    const N = 72, size = 90, P = new Float32Array((N + 1) * (N + 1) * 3), Nn = new Float32Array((N + 1) * (N + 1) * 3), Cc = new Float32Array((N + 1) * (N + 1) * 3), idx = [];
    const hh = (x, z) => { const r = Math.hypot(x, (z + 4) * .8); return opts.flat ? 0 : Math.max(0, (r - 14) / 22) ** 1.5 * (2.5 + N2.fbm(x * .1, z * .1, 3) * 4) * (z < 12 ? 1 : 0); };
    for (let b = 0; b <= N; b++) for (let a = 0; a <= N; a++) {
      const x = (a / N - .5) * size, z = (b / N - .5) * size - 15, k = b * (N + 1) + a, y = hh(x, z);
      P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z;
      const e = .6, dx = hh(x + e, z) - hh(x - e, z), dz = hh(x, z + e) - hh(x, z - e), l = Math.hypot(dx / (2 * e), 1, dz / (2 * e));
      Nn[k * 3] = -dx / (2 * e) / l; Nn[k * 3 + 1] = 1 / l; Nn[k * 3 + 2] = -dz / (2 * e) / l;
      const v = .94 + .12 * N2.vn(x * .3, z * .3, 6), t = Math.min(1, y / 4);
      Cc[k * 3] = v * (1 - t * .3); Cc[k * 3 + 1] = v * (1 - t * .15); Cc[k * 3 + 2] = v * (1 - t * .3);
    }
    for (let b = 0; b < N; b++) for (let a = 0; a < N; a++) { const i = b * (N + 1) + a; idx.push(i, i + N + 1, i + 1, i + 1, i + N + 1, i + N + 2); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); g.setIndex(idx);
    const m = new THREE.Mesh(g, this.terrainMat(this.splatTex(GW, GH, A), this.splatTex(GW, GH, B), new THREE.Vector2(ox, oz), new THREE.Vector2(GW, GH), opts.tint || [1, 1, 1]));
    m.receiveShadow = true; m.frustumCulled = false; m.matrixAutoUpdate = false; m.position.set(0, 0, 0);
    // terrain berpusat pada (0, -15): gunakan offset dunia supaya splat sejajar (splat: 1 teksel = 1 unit, asal (-ox,-oz))
    m.userData.arena = true;
    return m;
  },
  // platform Monsta: cakera bertepi dengan gelang
  platMesh(r, top, side, rim) {
    const g = new GB();
    g.lathe([[.001, .15], [r - .18, .15], [r - .1, .155], [r, .09], [r + .04, .0]], 30, top, { cols: [top, top, side, side, side] });
    g.push().t(0, .0, 0).cyl(r + .02, r + .05, .09, 30, side, { ao: [.6, 1] }).pop();
    g.push().t(0, .155, 0).cyl(r - .12, r - .12, .012, 30, rim, { cap: false }).pop();
    const m = new THREE.Mesh(g.build({ noUV: true }), MAT.rigid); m.receiveShadow = true; m.castShadow = false; m.matrixAutoUpdate = true; return m;
  },
  // ---------- arena ----------
  setupBattle() {
    if (this.bReady) return; this.bReady = true;
    this.lightsB = this.mkLights(this.battle); this.skyB = this.mkSky(this.battle);
    this.bbg = new THREE.Group(); this.battle.add(this.bbg);
    this.plats = [new THREE.Group(), new THREE.Group()];
    this.plats[0].position.set(-2.1, 0, 1.7); this.plats[1].position.set(2.4, 0, -2.4);
    for (const p of this.plats) this.battle.add(p);
    this.bball = new THREE.Group(); const bm = new THREE.Mesh(PR.geo('ball', 0), MAT.rigid); bm.scale.setScalar(1.35); bm.position.y = -.2; this.bball.add(bm); this.bball.visible = false; this.battle.add(this.bball); this.bball.userData.mesh = bm;
  },
  battleTheme(theme) {
    if (this.bthemeName === theme) return;
    this.bthemeName = theme; this.setupBattle();
    if (this.bgInst) { this.battle.remove(this.bbg); this.disposeGroup(this.bbg); this.bbg = new THREE.Group(); this.battle.add(this.bbg); }
    for (const p of this.plats) while (p.children.length) p.remove(p.children[0]);
    const hi = this.hi, R = (i, s) => hash(i, s, 333), items = [];
    const T = {
      rumput: { base: 0, plat: 1, kind: 'meadow', env: { sky: ['#4ea2ee', '#b0dcf6', '#f4f2dc'], fog: ['#d0e8ee', 24, 64], hemi: ['#cde6ff', '#78a04e', .85], sun: ['#ffe8c4', 1.8], dir: [-.5, .75, .6], clouds: 1 } },
      malam: { base: 0, plat: 1, kind: 'meadow', env: { sky: ['#070c26', '#1a2858', '#39457a'], fog: ['#141c3c', 18, 54], hemi: ['#6c7cc0', '#2c3560', .8], sun: ['#a8bcff', .9], dir: [-.5, .75, .6], clouds: .3, stars: 1, glare: .3 }, night: true },
      pantai: { base: 3, plat: 1, kind: 'beach', env: { sky: ['#3a9cf0', '#9ad6fa', '#fff0d0'], fog: ['#d4ecf6', 26, 70], hemi: ['#d0e8ff', '#a8a070', .85], sun: ['#fff0d0', 1.85], dir: [-.5, .75, .6], clouds: 1 } },
      air: { base: 3, plat: 3, kind: 'beach', sea: true, env: { sky: ['#3a94e8', '#a8d8fa', '#eaf6ff'], fog: ['#d8eef8', 26, 70], hemi: ['#d0e8ff', '#7a9aa0', .85], sun: ['#fff4e0', 1.8], dir: [-.5, .75, .6], clouds: 1 } },
      gua: { base: 4, plat: 1, kind: 'cave', env: { sky: ['#08060a', '#120e0a', '#1a140e'], fog: ['#120e0a', 12, 40], hemi: ['#c0a884', '#3a2c20', .9], sun: ['#ffd8a0', 1.1], dir: [-.4, .8, .6], clouds: 0 }, dim: true },
      masa: { base: 4, plat: 1, kind: 'cave', tint: 1, env: { sky: ['#1a0a2a', '#6a3a7a', '#f0a870'], fog: ['#4a2a5a', 14, 44], hemi: ['#b8a0d8', '#3a2a50', .9], sun: ['#d8b8ff', 1.1], dir: [-.4, .8, .6], clouds: 0, stars: .6 }, dim: true },
      dalam: { base: 5, plat: 6, kind: 'room', env: { sky: ['#1a1410', '#3a2e22', '#4a3c2c'], fog: null, hemi: ['#fff0d8', '#8a6a48', 1.0], sun: ['#fff0d0', 1.0], dir: [-.4, .85, .5], clouds: 0 }, dim: true },
      bandar: { base: 2, plat: 6, kind: 'city', env: { sky: ['#5a9ee0', '#b4d2ec', '#eee8dc'], fog: ['#d4e0ea', 24, 66], hemi: ['#d8e6f8', '#8a8a78', .85], sun: ['#fff0da', 1.75], dir: [-.5, .75, .6], clouds: 1 } },
      gim: { base: 6, plat: 6, kind: 'hall', env: { sky: ['#1a1030', '#4a3a7a', '#a898d8'], fog: ['#4a3a7a', 16, 48], hemi: ['#f0e4ff', '#8a70b0', 1.0], sun: ['#fff0e0', 1.2], dir: [-.4, .85, .5], clouds: 0 }, dim: true },
      liga: { base: 6, plat: 6, kind: 'hall', gold: true, env: { sky: ['#2a1206', '#8a4a1a', '#f0c070'], fog: ['#8a4a1a', 16, 48], hemi: ['#fff0d0', '#a88040', 1.0], sun: ['#ffe8b8', 1.2], dir: [-.4, .85, .5], clouds: 0 }, dim: true },
    }[theme] || null;
    const TH = T || { base: 0, plat: 1, kind: 'meadow', env: { sky: ['#4ea2ee', '#b0dcf6', '#f4f2dc'], fog: ['#d0e8ee', 24, 64], hemi: ['#cde6ff', '#78a04e', .85], sun: ['#ffe8c4', 1.8], dir: [-.5, .75, .6], clouds: 1 } };
    this.benv = TH.env; this.applyEnv(this.battle, this.lightsB, this.skyB, TH.env); this.tuneWaterFor(TH.env, theme);
    const pl = [[this.plats[0].position.x, this.plats[0].position.z, 2.0, TH.plat], [this.plats[1].position.x, this.plats[1].position.z, 1.85, TH.plat]];
    const g = this.arenaGround(TH.base, pl, { flat: TH.kind === 'room' || TH.kind === 'hall' || TH.kind === 'city', tint: theme === 'masa' ? [.8, .65, 1] : [1, 1, 1] });
    this.bbg.add(g);
    // platform bertepi
    const pc = TH.kind === 'hall' ? ['#e8e2f4', '#a8a0c8', TH.gold ? '#f0d060' : '#c8a0f0'] : TH.kind === 'cave' ? ['#b0906a', '#6a5238', '#e0c090'] : TH.kind === 'beach' ? ['#f0dfae', '#c8b078', '#fff4d0'] : ['#cba96a', '#8a6a3a', '#f0dc9c'];
    this.plats.forEach((p, k) => p.add(this.platMesh(k ? 1.85 : 2.0, pc[0], pc[1], pc[2])));
    const nearP = (x, z, r) => this.plats.some(p => Math.hypot(x - p.position.x, z - p.position.z) < r);
    const grass = new GB();
    const dens = hi ? 1 : .55;
    const FLW = ['#ffffff', '#fff1a0', '#ffa4b4', '#ffd24a', '#c8b4ff'];
    const tuftField = (n, x0, x1, z0, z1, o = {}) => { for (let i = 0; i < n * dens; i++) { const x = x0 + R(i, 1) * (x1 - x0), z = z0 + R(i, 2) * (z1 - z0); if (nearP(x, z, 2.1)) continue; PR.tuft(grass, x, this.arenaY(x, z), z, .9 + R(i, 3) * .8, i * 13, Object.assign({ n: hi ? 6 : 4, h: .3 }, o)); } };
    const flowers = (n, x0, x1, z0, z1) => { for (let i = 0; i < n * dens; i++) { const x = x0 + R(i, 5) * (x1 - x0), z = z0 + R(i, 6) * (z1 - z0); if (nearP(x, z, 2.2)) continue; PR.flower(grass, x, this.arenaY(x, z), z, 1.3, FLW[i % FLW.length], i * 5); } };
    const ring = (n, r0, r1, a0, a1, fn) => { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * R(i, 15), r = r0 + R(i, 16) * (r1 - r0); fn(Math.cos(a) * r * 1.3, Math.sin(a) * r - 4, i); } };
    const night = !!TH.night;
    if (TH.kind === 'meadow') {
      tuftField(1300, -22, 22, -34, 6); flowers(260, -20, 20, -30, 5);
      this.plats.forEach((p, k) => { const r0 = k ? 1.85 : 2.0; for (let i = 0; i < 42 * dens; i++) { const a = i / 42 * 6.283 + R(i + k * 50, 11) * .1, r = r0 + R(i, 12) * .25; PR.tuft(grass, p.position.x + Math.cos(a) * r, 0, p.position.z + Math.sin(a) * r, 1 + R(i, 13) * .5, i * 3 + k, { n: 5, h: .34 }); } });
      ring(hi ? 46 : 26, 14, 26, -Math.PI * .96, -Math.PI * .04, (x, z, i) => items.push(['tree', x, this.arenaY(x, z), z, 1.5 + R(i, 17) * 1, R(i, 18) * 6, 1 + (R(i, 19) - .5) * .2]));
      ring(hi ? 30 : 16, 8, 13, -Math.PI * .92, -Math.PI * .08, (x, z, i) => { if (!nearP(x, z, 3)) items.push(['bush', x, this.arenaY(x, z), z, 1.4 + R(i, 23) * 1.2, R(i, 24) * 6]); });
      ring(12, 6, 15, -Math.PI * .9, -Math.PI * .1, (x, z, i) => { if (!nearP(x, z, 2.8)) items.push(['rock', x, this.arenaY(x, z), z, .5 + R(i, 27) * .7, R(i, 28) * 6]); });
      for (let i = 0; i < 6; i++) { const x = -20 + i * 8 + R(i, 60) * 4; items.push(['palm', x, this.arenaY(x, -22), -22, 1.6, R(i, 61) * 6]); }
    } else if (TH.kind === 'beach') {
      tuftField(140, -18, 18, -20, 4, { c0: '#8a9a44', c1: '#d8e090' });
      ring(10, 10, 18, -Math.PI * .9, -Math.PI * .1, (x, z, i) => items.push(['palm', x, this.arenaY(x, z), z, 1.5 + R(i, 32) * .4, R(i, 33) * 6]));
      ring(14, 6, 15, -Math.PI * .9, -Math.PI * .1, (x, z, i) => { if (!nearP(x, z, 2.8)) items.push(['rock', x, this.arenaY(x, z), z, .5 + R(i, 35) * .6, R(i, 36) * 6, '#f4ece0']); });
      for (let i = 0; i < 3; i++) items.push(['umbrella', -9 + i * 7, 0, -9 - R(i, 70) * 3, 1.5, R(i, 71) * 6], ['lounger', -8 + i * 7, 0, -8 - R(i, 72) * 3, 1.3, R(i, 73) * 6]);
      const sea = new THREE.Mesh(new THREE.PlaneGeometry(240, 100), this.waterMat()); this.arenaSea(sea, TH.sea ? -46 : -54); this.bbg.add(sea);
    } else if (TH.kind === 'cave') {
      const cg = new GB();
      ring(hi ? 44 : 26, 10, 22, -Math.PI * 1.0, 0, (x, z, i) => items.push(['boulder', x, 0, z, 2 + R(i, 52) * 3, R(i, 54) * 6, theme === 'masa' ? '#b098c8' : null, 1 + R(i, 53)]));
      ring(20, 5, 14, -Math.PI * .95, -Math.PI * .05, (x, z, i) => { if (!nearP(x, z, 2.5)) items.push(['boulder', x, 0, z, .3 + R(i, 57) * .5, R(i, 58) * 6]); });
      ring(hi ? 14 : 8, 8, 16, -Math.PI * .9, -Math.PI * .1, (x, z, i) => { if (!nearP(x, z, 3)) items.push(['crystal', x, 0, z, 1.4 + R(i, 62) * 1.6, R(i, 63) * 6]); });
    } else if (TH.kind === 'room') {
      const P = ST.palette({ id: 'x' }), gb = new GB(), gr = new GB(), gg = new GB();
      for (let i = -8; i <= 8; i++) { const x = i * 1.5; gb.c(1).bx(x, 1.9, -9, 1.5, 3.8, .5, P.plaster, { uvs: 1, skip: '-y' }); gb.c(0).bx(x, .5, -8.7, 1.5, 1, .12, P.wain, { uvs: 1, skip: '-y' }); }
      gr.bx(0, .06, -8.66, 26, .12, .1, P.trim); gr.bx(0, 1.02, -8.65, 26, .07, .1, P.trim);
      for (const x of [-8, -1.5, 5, 10]) { gr.bx(x, 2.6, -8.72, 1.5, 1.4, .08, P.trim); gg.bx(x, 2.6, -8.66, 1.3, 1.2, .02, P.win); }
      for (let i = 0; i < 4; i++) { const q = new GB(); ST.f_Q({ gR: q, gB: q, gG: q }, { l: false, r: false }, i * .21); gr.push().t(-9 + i * 5.5, 0, -8.2).s(1.6, 1.6, 1.6).addGB(q).pop(); }
      this.bbg.add(new THREE.Mesh(gb.build({ cell: true }), MAT.bld), new THREE.Mesh(gr.build({ noUV: true }), MAT.rigid), new THREE.Mesh(gg.build({ noUV: true }), MAT.glow));
    } else if (TH.kind === 'city') {
      const gb = new GB(), gr = new GB(), gg = new GB(), types = 'BMBMHBP';
      for (let i = 0; i < 9; i++) {
        const t = types[i % types.length], w = 3 + Math.floor(R(i, 62) * 2), d = 3, S = BLD.make(t, w, d, [1], 100 + i);
        const x = -30 + i * 7.5 + R(i, 63) * 2, z = -19 - R(i, 64) * 6;
        gb.push().t(x, 0, z); gb.addGB(S.gB); gb.pop(); gr.push().t(x, 0, z); gr.addGB(S.gR); gr.pop(); gg.push().t(x, 0, z); gg.addGB(S.gG); gg.pop();
      }
      this.bbg.add(new THREE.Mesh(gb.build({ cell: true }), MAT.bld), new THREE.Mesh(gr.build({ noUV: true }), MAT.rigid), new THREE.Mesh(gg.build({ noUV: true }), MAT.glow));
      for (let i = 0; i < 10; i++) { const x = -20 + i * 4 + R(i, 62), z = -11; items.push(['tree', x, 0, z, 1.4, R(i, 65) * 6], ['lamp', x + 2, 0, z + 1, 1.1, 0], ['lampGlow', x + 2, 0, z + 1, 1.1, 0]); }
    } else if (TH.kind === 'hall') {
      const gr = new GB(), gg = new GB();
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI * (.05 + i / 11 * .9), r = 11, x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 3;
        gr.push().t(x, 0, z); gr.cyl(.5, .56, 5, 16, TH.gold ? '#f0d488' : '#dcd4f4', { ao: [.7, 1.1] }); gr.push().t(0, 5, 0).cyl(.7, .5, .3, 16, '#fff4d8', { cap: true }).pop(); gr.push().t(0, 0, 0).cyl(.7, .7, .3, 16, '#c8c0e0', { cap: true }).pop(); gr.pop();
        gg.push().t(x, 5.6, z).sph(.16, 8, 6, TH.gold ? '#ffd870' : '#d8b8ff').pop();
      }
      this.bbg.add(new THREE.Mesh(gr.build({ noUV: true }), MAT.rigid), new THREE.Mesh(gg.build({ noUV: true }), MAT.glow));
    }
    if (grass.count) { const gm = new THREE.Mesh(grass.build(), MAT.grass); gm.frustumCulled = false; gm.receiveShadow = true; this.bbg.add(gm); }
    if (items.length) this.bbg.add(this.instGroup(items));
    this.bgInst = true;
    this.bfly = night || TH.kind === 'cave';
  },
  arenaY(x, z) { const r = Math.hypot(x, (z + 4) * .8); return Math.max(0, (r - 14) / 22) ** 1.5 * (2.5 + N2.fbm(x * .1, z * .1, 3) * 4) * (z < 12 ? 1 : 0) * (this.bthemeName === 'dalam' || this.bthemeName === 'bandar' || this.bthemeName === 'gim' || this.bthemeName === 'liga' ? 0 : 1); },
  arenaSea(m, z) { m.rotation.x = -Math.PI / 2; m.position.set(0, -.04, z); m.renderOrder = 5; const n = 4; const dep = new Float32Array(m.geometry.attributes.position.count).fill(1); m.geometry.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1)); m.matrixAutoUpdate = true; },
  battleSet(bs) {
    this.bs = bs; this.setupBattle();
    this.battleTheme(bs.o.theme || 'rumput');
    for (const k of ['meM', 'foeM', 'meTrM', 'foeTrM']) if (this[k]) { this.battle.remove(this[k]); this[k] = null; }
    this.meName = this.foeName = null; this.bshake = 0; this.btime = 0; this.bflash = 0; this.prevVis = [false, false];
    this.meTrM = this.human(S.look, 1); this.meTrM.scale.setScalar(1.6); this.battle.add(this.meTrM);
    if (bs.tr) { this.foeTrM = this.human(bs.tr.look || 'budak', 1); this.foeTrM.scale.setScalar(1.6); this.battle.add(this.foeTrM); }
    this.P.life.fill(0);
  },
  // kesan zarah mengikut jenis serangan
  fx(type, side, big) {
    if (!this.ok || !this.bs) return;
    const tgt = side === 'me' ? this.plats[0].position : this.plats[1].position, col = TYPE_COLOR[type] || '#ffffff', x = tgt.x, z = tgt.z, k = big ? 1.5 : 1;
    const R = () => Math.random() - .5, cy = 1.0;
    const rad = (n, sp, o) => { for (let i = 0; i < n * k; i++) { const a = Math.random() * 6.283, s = sp * (.5 + Math.random() * .8); this.emit(x, cy + R() * .6, z, Object.assign({ vx: Math.cos(a) * s, vy: (Math.random() - .3) * s, vz: Math.sin(a) * s, life: .6 + Math.random() * .3, size: .16, color: col, grav: 0 }, o)); } };
    const ring = (r0, n, s, o) => { for (let i = 0; i < n; i++) { const a = i / n * 6.283; this.emit(x + Math.cos(a) * r0, cy * .5, z + Math.sin(a) * r0, Object.assign({ vx: Math.cos(a) * s, vy: .3, vz: Math.sin(a) * s, life: .55, size: .2, color: col, grav: 0 }, o)); } };
    switch (type) {
      case 'Api': for (let i = 0; i < 46 * k; i++) this.emit(x + R() * 1.1, .2 + Math.random() * .5, z + R() * 1.1, { vx: R() * .8, vy: 1.5 + Math.random() * 2.6, vz: R() * .8, life: .8 + Math.random() * .5, size: .28, grow: 1.4, grav: -.6, color: Math.random() < .5 ? '#ff9a3a' : '#ffd84a' }); break;
      case 'Air': for (let i = 0; i < 44 * k; i++) this.emit(x + R() * .8, 2 + Math.random() * 1.6, z + R() * .8, { vx: R() * 1.4, vy: -1 - Math.random() * 2, vz: R() * 1.4, life: .8, size: .14, grav: 7, color: Math.random() < .5 ? '#7ab0ff' : '#e8f4ff' }); ring(.3, 18, 2.4, { color: '#bfe0ff', size: .22 }); break;
      case 'Rumput': for (let i = 0; i < 36 * k; i++) { const a = Math.random() * 6.283; this.emit(x + Math.cos(a) * .3, .3, z + Math.sin(a) * .3, { vx: Math.cos(a + 1.4) * 1.6, vy: 1.4 + Math.random() * 1.6, vz: Math.sin(a + 1.4) * 1.6, life: 1, size: .2, grav: 1, color: Math.random() < .5 ? '#78c850' : '#b6e070' }); } break;
      case 'Elektrik': for (let i = 0; i < 22; i++) this.emit(x + R() * .5, 4.2 - i * .19, z + R() * .5, { vy: -.2, life: .3, size: .28, color: '#fff6a0', grav: 0 }); rad(30, 5, { size: .13, color: '#ffe040', life: .4 }); this.bflash = .25; break;
      case 'Ais': for (let i = 0; i < 40 * k; i++) this.emit(x + R() * 1.4, 2.4 + Math.random() * 1.2, z + R() * 1.4, { vx: R() * .8, vy: -1.5 - Math.random(), vz: R() * .8, life: 1, size: .16, grav: 3, color: Math.random() < .5 ? '#a0e8f0' : '#ffffff' }); rad(14, 2, { color: '#e8fcff', size: .2 }); break;
      case 'Lawan': ring(.2, 26, 4.2, { size: .22, color: '#ff8a4a' }); rad(22, 4, { size: .16, color: '#ffd0a0', life: .35 }); this.bshake = Math.max(this.bshake, .3); break;
      case 'Racun': for (let i = 0; i < 34 * k; i++) this.emit(x + R() * 1.1, .2 + Math.random() * .3, z + R() * 1.1, { vx: R() * .5, vy: .8 + Math.random() * 1.2, vz: R() * .5, life: 1.1, size: .2, grow: .6, grav: -.2, color: Math.random() < .5 ? '#b050c0' : '#7a3a98' }); break;
      case 'Tanah': for (let i = 0; i < 38 * k; i++) this.emit(x + R() * 1.2, .1, z + R() * 1.2, { vx: R() * 2.2, vy: 2 + Math.random() * 2.4, vz: R() * 2.2, life: .8, size: .16, grav: 8, color: Math.random() < .5 ? '#c8a048' : '#8a6a38' }); ring(.4, 16, 2, { color: '#d8c090', size: .3, grow: 1 }); break;
      case 'Terbang': for (let i = 0; i < 34 * k; i++) { const a = i / 34 * 12; this.emit(x + Math.cos(a) * .6, .3 + i * .05, z + Math.sin(a) * .6, { vx: Math.cos(a + 1.5) * 2.4, vy: .8, vz: Math.sin(a + 1.5) * 2.4, life: .8, size: .15, color: '#e0d8ff', grav: 0 }); } break;
      case 'Psikik': for (let r = 0; r < 3; r++) ring(.2 + r * .2, 22, 2.6 + r, { color: r % 2 ? '#ff9ac0' : '#ffd0e4', size: .18, life: .7 }); break;
      case 'Serangga': for (let i = 0; i < 30 * k; i++) this.emit(x + R() * 1.6, .4 + Math.random() * 1.6, z + R() * 1.6, { vx: R() * 3, vy: R() * 2, vz: R() * 3, life: .8, size: .1, color: Math.random() < .5 ? '#c4d840' : '#eef060', grav: 0 }); break;
      case 'Batu': for (let i = 0; i < 24 * k; i++) this.emit(x + R() * 1.6, 3.5 + Math.random() * 1.5, z + R() * 1.6, { vx: R() * .6, vy: -2, vz: R() * .6, life: .9, size: .22, grav: 9, color: Math.random() < .5 ? '#b8a860' : '#8a7a48' }); rad(10, 3, { color: '#d8c890', size: .2 }); break;
      case 'Hantu': for (let i = 0; i < 30 * k; i++) this.emit(x + R() * 1.2, .3 + Math.random() * 1.6, z + R() * 1.2, { vx: R() * 1.2, vy: .6 + Math.random(), vz: R() * 1.2, life: 1.2, size: .26, grow: .8, color: Math.random() < .5 ? '#8a68c8' : '#c8a8ff', grav: 0 }); break;
      case 'Naga': for (let i = 0; i < 44 * k; i++) { const a = i / 44 * 12.6; this.emit(x + Math.cos(a) * .7, .2 + i * .04, z + Math.sin(a) * .7, { vx: Math.cos(a + 1.5) * 2, vy: 1.4, vz: Math.sin(a + 1.5) * 2, life: 1, size: .25, grow: .8, color: i % 2 ? '#7a48ff' : '#4ac8ff', grav: 0 }); } break;
      default: rad(30, 3.4, { size: .17, color: '#ffffff', life: .5 }); ring(.2, 14, 3, { color: '#ffe8a0', size: .2 }); this.bshake = Math.max(this.bshake, .18);
    }
    this.bshake = Math.max(this.bshake, big ? .38 : .2);
  },
  drawBattle(bs) {
    if (!this.ok) return false;
    Game.used3d = true; this.activeCam = this.bcam;
    if (this.bs !== bs) this.battleSet(bs);
    U3.uHole.value.w = 0; U3.uTime.value += Math.min(Game.dt || .016, .08);
    const dt = Math.min(Game.dt || .016, .08); this.btime += dt;
    const t = this.btime, mePos = this.plats[0].position, foePos = this.plats[1].position;
    const want = (side, name) => {
      const k = side + 'M', nk = side + 'Name';
      if (this[nk] === name) return this[k];
      if (this[k]) this.battle.remove(this[k]);
      this[k] = name ? this.mon(name, side === 'me' ? 1.5 : 1.55, 1) : null; this[nk] = name;
      if (this[k]) this.battle.add(this[k]);
      return this[k];
    };
    const ghost = bs.o.ghost && !S.bag['Teropong Roh'];
    const meM = want('me', bs.me.mon ? bs.me.mon.sp : null), foeM = want('foe', bs.foe.mon ? bs.foe.mon.sp : null);
    if (meM) {
      meM.visible = bs.meVis && !(bs.meBlink > 0 && Math.floor(Game.t * 16) % 2);
      meM.position.set(mePos.x + bs.meX / 60, -bs.meY / 90 + Math.max(0, Math.sin(t * 2.2)) * .04, mePos.z);
      meM.rotation.y = Math.PI + .55; meM.userData.update(Game.t);
      const k = 1 + Math.sin(t * 2.2) * .018; meM.scale.set(k, 1 / k, k);
      if (bs.meVis && !this.prevVis[0]) this.burst(mePos.x, .3, mePos.z, '#ffffff', 26, { speed: 2.4, up: 2.4, size: .16, life: .7, grav: 2 });
    }
    if (foeM) {
      foeM.visible = bs.foeVis && !(bs.foeBlink > 0 && Math.floor(Game.t * 16) % 2);
      const sc = bs.foeScale, k = 1 + Math.sin(t * 2 + 1) * .018;
      foeM.position.set(foePos.x + bs.foeX / 60, -bs.foeY / 90 + Math.max(0, Math.sin(t * 2 + 1)) * .04, foePos.z);
      foeM.rotation.y = -.45; foeM.userData.update(Game.t); foeM.scale.set(sc * k, sc / k, sc * k);
      foeM.userData.tint(ghost ? 'ghost' : null);
      if (bs.foeVis && !this.prevVis[1]) this.burst(foePos.x, .3, foePos.z, ghost ? '#8a68c8' : '#ffffff', 26, { speed: 2.4, up: 2.4, size: .16, life: .7, grav: 2 });
    }
    this.prevVis[0] = !!bs.meVis; this.prevVis[1] = !!bs.foeVis;
    if (this.meTrM) { this.meTrM.visible = bs.meTr; this.meTrM.position.set(mePos.x - .3 + bs.meTrX / 60, 0, mePos.z + .2); this.meTrM.rotation.y = Math.PI * .8; this.poseHuman(this.meTrM, 0, false, dt, 0); }
    if (this.foeTrM) { this.foeTrM.visible = bs.foeTr; this.foeTrM.position.set(foePos.x + bs.foeTrX / 60, 0, foePos.z); this.foeTrM.rotation.y = -.4; this.poseHuman(this.foeTrM, 0, false, dt, 0); }
    if (bs.ball) {
      this.bball.visible = true;
      const k = bs.ball.k !== undefined ? bs.ball.k : 1, ty = foeM && bs.foeVis ? .3 : .25;
      const fx0 = mePos.x, fy0 = 1.2, fz0 = mePos.z, fx1 = foePos.x, fy1 = ty, fz1 = foePos.z;
      this.bball.position.set(fx0 + (fx1 - fx0) * k, fy0 + (fy1 - fy0) * k + Math.sin(k * Math.PI) * 2.2, fz0 + (fz1 - fz0) * k);
      this.bball.rotation.z = (bs.ball.wob || 0) * .6 + (k < 1 ? k * 12 : 0); this.bball.rotation.x = k < 1 ? k * 8 : 0;
    } else this.bball.visible = false;
    // suasana pentas: kunang-kunang gua/malam
    if (this.bfly && Math.random() < dt * 8) this.emit(Math.random() * 16 - 8, .4 + Math.random() * 2, -10 + Math.random() * 14, { vx: (Math.random() - .5) * .4, vy: .1, vz: (Math.random() - .5) * .4, life: 3, size: .13, grav: 0, color: this.bthemeName === 'masa' ? '#e0a0ff' : '#e8f890' });
    // kamera sinematik
    const por = PORTRAIT, intro = Math.max(0, 1 - t / 1.4), sway = Math.sin(t * .35) * .3;
    const base = por ? new THREE.Vector3(-3.8 + sway, 4.0, 10.8) : new THREE.Vector3(-5.4 + sway, 3.0, 8.6);
    const look = por ? new THREE.Vector3(.4, .9, -1.0) : new THREE.Vector3(.8, .85, -.9);
    const cp = base.add(new THREE.Vector3(intro * 6, intro * 3, intro * 4));
    if (this.bshake > 0) { this.bshake -= dt; cp.x += (Math.random() - .5) * this.bshake; cp.y += (Math.random() - .5) * this.bshake; }
    this.bcam.fov = por ? 58 : 40; this.bcam.updateProjectionMatrix();
    this.bcam.position.copy(cp); this.bcam.lookAt(look); this.bcam.updateMatrixWorld(true);
    this.skyB.position.copy(cp);
    if (this.bflash > 0) { this.bflash -= dt; this.lightsB.hemi.intensity = (this.benv.hemi[2] || .85) + 2 * Math.max(0, this.bflash * 3); } else this.lightsB.hemi.intensity = this.benv.hemi[2];
    this.updateShadow(this.lightsB, 0, .5, -1, 11);
    this.attachPts(this.battle); this.tickParticles(dt);
    this.render(this.battle, this.bcam);
    return true;
  },
  battleAnchor(side) { const p = side === 'me' ? this.plats[0].position : this.plats[1].position; return this.project(p.x, side === 'me' ? 2.6 : 2.4, p.z, this.bcam); },
  // ---------- skrin tajuk: padang Seberang Perai waktu senja ----------
  setupTitle() {
    const s = this.titleS, T = this.title = { s, R: (i, k) => hash(i, k, 77) };
    T.L = this.mkLights(s); T.sky = this.mkSky(s);
    const env = { sky: ['#1d1340', '#d0587a', '#ffc27a'], fog: ['#e89a86', 22, 90], hemi: ['#ffc8d8', '#3f6a34', .75], sun: ['#ffd6a8', 1.55], dir: [-.4, .55, .8], skyDir: [.1, .17, -.98], clouds: 1, glare: 1.4 };
    this.applyEnv(s, T.L, T.sky, env); this.tuneWaterFor(env, 'senja');
    const rim = new THREE.DirectionalLight(0xff9860, 1.3); rim.position.set(3, 5, -14); s.add(rim);
    const R = T.R, hi = this.hi, items = [], grass = new GB();
    const clear = (x, z) => Math.hypot(x * .8, z) < 2.8;
    const g = this.arenaGround(0, [[0, 0, 2.6, 1]], { tint: [1, .92, .88], path: 1, flat: true });
    s.add(g);
    for (let i = 0; i < (hi ? 1000 : 420); i++) { const x = (R(i, 1) - .5) * 44, z = 3 - R(i, 2) * 30; if (clear(x, z)) continue; PR.tuft(grass, x, 0, z, .9 + R(i, 3) * .8, i * 7, { n: hi ? 6 : 4, h: .32, c0: '#5a8a3a', c1: '#f0d8a0' }); }
    for (let i = 0; i < (hi ? 240 : 100); i++) { const x = (R(i, 5) - .5) * 40, z = 6 - R(i, 6) * 26; if (clear(x, z)) continue; PR.flower(grass, x, 0, z, 1.3, ['#fff1a0', '#ffa4b4', '#ffd24a', '#ffffff'][i % 4], i * 3); }
    for (let i = 0; i < 26; i++) { const side = i % 2 ? 1 : -1, x = side * (6 + R(i, 8) * 16), z = -3 - R(i, 9) * 18; items.push(['tree', x, 0, z, 1.5 + R(i, 10) * 1.2, R(i, 11) * 6, '#ffe6d4']); }
    for (let i = 0; i < 8; i++) { const side = i % 2 ? 1 : -1, x = side * (10 + R(i, 40) * 12), z = -6 - R(i, 41) * 14; items.push(['palm', x, 0, z, 1.7, R(i, 42) * 6, '#ffeedd']); }
    for (let i = 0; i < 12; i++) { const x = (i % 2 ? 1 : -1) * (4 + R(i, 13) * 4), z = -1 - R(i, 14) * 4; items.push(['bush', x, 0, z, 1.3 + R(i, 15), R(i, 16) * 6, '#ffe0d0']); }
    for (let i = 0; i < 8; i++) { const x = (i % 2 ? 1 : -1) * (3 + R(i, 17) * 5), z = 2 - R(i, 18) * 6; items.push(['rock', x, 0, z, .3 + R(i, 19) * .5, R(i, 20) * 6, '#ffe8e0']); }
    s.add(this.instGroup(items, 16, -4));
    s.add(Object.assign(new THREE.Mesh(grass.build(), MAT.grass), { frustumCulled: false, receiveShadow: true }));
    // laut senja di kaki langit + bukit jauh (Gunung Jerai)
    const sea = new THREE.Mesh(new THREE.PlaneGeometry(300, 90), this.waterMat()); this.arenaSea(sea, -80); s.add(sea);
    const mtn = new GB(); for (let i = 0; i < 9; i++) { const h = 8 + R(i, 1) * 12, w = 16 + R(i, 2) * 12; mtn.push().t(-70 + i * 17 + R(i, 3) * 6, -1, -74 - R(i, 4) * 12); mtn.cone(w * .5, h, 7, '#5a4a6a', { ao: [.6, 1.2], cap: false }); mtn.pop(); }
    const mm = new THREE.Mesh(mtn.build({ noUV: true }), MAT.rigid); s.add(mm);
    // wira: tiga Monsta pemula dan Jentayu
    T.heroes = [['Anakpadi', -2.1, .5, .35], ['Percik', 0, 0, 0], ['Penyucil', 2.1, .5, -.35]].map(([n, x, z, ry], k) => { const m = this.mon(n, 1.35, 1); m.position.set(x, 0, z); m.rotation.y = ry; m.userData.k = k; s.add(m); return m; });
    T.bird = this.mon('Jentayu', 1.5, 1); T.bird.position.set(-.3, 3.4, -6); s.add(T.bird);
    T.cam = new THREE.PerspectiveCamera(40, this.aspect || 16 / 9, .1, 400);
    this.title.built = true;
  },
  // intro: 0..1 (dolly kamera masuk)
  drawTitle(t, intro = 1) {
    if (!this.ok) return false;
    Game.used3d = true;
    if (!this.title) this.setupTitle();
    const T = this.title, dt = Math.min(Game.dt || .016, .08); this.activeCam = T.cam; U3.uHole.value.w = 0; U3.uTime.value += dt;
    T.heroes.forEach((m, k) => { const b = Math.max(0, Math.sin(t * 2.4 + k * 1.3)); m.position.y = b * .12; const q = 1 + b * .04; m.scale.set(1 / Math.sqrt(q), q, 1 / Math.sqrt(q)); m.rotation.y = [.35, 0, -.35][k] + Math.sin(t * .7 + k) * .12; m.userData.update(t); });
    T.bird.userData.update(t);
    if (PORTRAIT) T.bird.position.set(1.7, 2.35 + Math.sin(t * 1.3) * .2, -6.5); else T.bird.position.set(5.4, 1.95 + Math.sin(t * 1.3) * .25, -5.5);
    T.bird.scale.setScalar(PORTRAIT ? .85 : 1); T.bird.rotation.y = Math.sin(t * .4) * .3; T.bird.rotation.z = Math.sin(t * 1.3) * .05;
    if (Math.random() < dt * 22) this.emit((Math.random() - .5) * 20, Math.random() * 3, 3 - Math.random() * 16, { vx: (Math.random() - .5) * .3, vy: .25 + Math.random() * .3, vz: (Math.random() - .5) * .3, life: 4, size: .16, grav: 0, color: '#ffe8a0' });
    const por = PORTRAIT, e = 1 - Math.pow(1 - Math.min(1, intro), 3), cam = T.cam;
    cam.aspect = this.aspect; cam.fov = por ? 58 : 38; cam.updateProjectionMatrix();
    const a = Math.sin(t * .13) * .22, Rr = (por ? 13 : 11) + (1 - e) * 10;
    cam.position.set(Math.sin(a) * Rr, (por ? 2.6 : 2.3) + (1 - e) * 4, Math.cos(a) * Rr + .5);
    cam.lookAt(0, por ? .1 : 1.15, -1); cam.updateMatrixWorld(true);
    T.sky.position.copy(cam.position);
    this.updateShadow(T.L, 0, .5, -1, 10);
    this.attachPts(this.titleS); this.tickParticles(dt);
    this.render(this.titleS, cam);
    return true;
  },
  // ---------- pameran (evolusi, Monstadex, pemilihan pemula, prof) ----------
  setupShow() {
    const s = this.show; this.lightsS = this.mkLights(s); this.skyS = this.mkSky(s);
    this.applyEnv(s, this.lightsS, this.skyS, { sky: ['#1a1040', '#b0506a', '#f8c068'], fog: ['#b0506a', 16, 44], hemi: ['#fff0e0', '#402a60', .95], sun: ['#ffe0b0', 1.5], dir: [-.4, .8, .6], clouds: .6 });
    const g = new GB();
    g.cyl(2.3, 2.0, .4, 48, '#3a3060', { cap: true, ao: [.6, 1] }); g.push().t(0, .4, 0).cyl(2.05, 2.05, .03, 48, '#c99a3a', { cap: true }).pop(); g.push().t(0, .0, 0).cyl(2.4, 2.4, .06, 48, '#e9c46a').pop();
    const plat = new THREE.Mesh(g.build({ noUV: true }), MAT.rigid); plat.position.y = -.4; plat.receiveShadow = true; s.add(plat);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x1a1830 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.4; floor.receiveShadow = true; s.add(floor);
    const rk = new GB(); for (let i = 0; i < 30; i++) { const a = Math.PI * (1.02 + i / 30 * .96), r = 12 + hash(i, 4, 5) * 10, h = 2 + hash(i, 5, 5) * 7; rk.push().t(Math.cos(a) * r, -.4, Math.sin(a) * r - 6); rk.cone(2 + hash(i, 6, 5) * 2, h, 5, '#2a2450', { ao: [.6, 1.2], cap: false }); rk.pop(); }
    s.add(new THREE.Mesh(rk.build({ noUV: true }), MAT.rigid));
    // sinar lampu sorot
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.6, 9, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe8b0, transparent: true, opacity: .09, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    cone.position.set(0, 4.1, 0); cone.rotation.x = Math.PI; s.add(cone);
    this.scam = new THREE.PerspectiveCamera(40, this.aspect || 16 / 9, .1, 200);
  },
  drawShow(name, o = {}) {
    if (!this.ok) return false;
    Game.used3d = true; if (!this.scam) this.setupShow();
    this.activeCam = this.scam; U3.uHole.value.w = 0; const dt = Math.min(Game.dt || .016, .08); U3.uTime.value += dt;
    const key = (o.human ? 'h:' : '') + name;
    if (this.showName !== key) {
      if (this.showM) this.show.remove(this.showM);
      if (o.human) { this.showM = this.human(name, 1); this.showM.scale.setScalar(2.4); } else this.showM = this.mon(name, 1.5, 1);
      this.showName = key; this.show.add(this.showM);
      this.burst(0, .2, 0, '#ffe8a0', 26, { speed: 2, up: 2.2, size: .14, life: .9, grav: 1.5 });
    }
    const m = this.showM;
    m.rotation.y = o.rot !== undefined ? o.rot : Math.sin(Game.t * .6) * .7 - (o.human ? 0 : .3);
    m.position.y = o.human ? 0 : Math.sin(Game.t * 2) * .06;
    if (o.human) { this.poseHuman(m, 0, false, dt, 0); m.rotation.y = Math.sin(Game.t * .6) * .4; } else { m.userData.tint(o.white ? 'white' : null); m.userData.update(Game.t); }
    if (Math.random() < dt * 12) this.emit((Math.random() - .5) * 3.5, -.1, (Math.random() - .5) * 3.5, { vy: .6 + Math.random() * .6, life: 2, size: .12, grav: 0, color: '#ffe8a0' });
    const por = PORTRAIT, y0 = o.y !== undefined ? o.y : 0, cam = this.scam;
    cam.aspect = this.aspect; cam.fov = por ? 60 : 38; cam.position.set(0, 2.2 + (por ? 1.5 : 0), por ? 11 : 8.5); cam.lookAt(0, 1.3 + y0, 0); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    this.skyS.position.copy(cam.position);
    this.updateShadow(this.lightsS, 0, 1, 0, 6);
    this.attachPts(this.show); this.tickParticles(dt);
    this.render(this.show, cam);
    return true;
  },
});
R3.init();
