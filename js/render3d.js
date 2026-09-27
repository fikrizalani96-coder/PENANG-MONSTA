'use strict';
// ===== Pemapar 3D (Three.js): dunia, watak, Monsta voksel, arena pertarungan =====
const R3 = {
  ok: false, quality: 'tinggi',
  init() {
    if (!window.THREE) return;
    THREE.ColorManagement.legacyMode = false;
    try { const q = localStorage.getItem('msp_grafik'); if (q) this.quality = q; } catch (e) { }
    if (this.quality === '2d' || /[?&]2d\b/.test(location.search)) return; // mod 2D klasik
    const c = document.getElementById('gl');
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: c, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' }); }
    catch (e) { console.warn('WebGL tiada, guna 2D', e); return; }
    this.r = r; this.canvas = c;
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .92;
    r.shadowMap.enabled = this.quality === 'tinggi';
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.world = new THREE.Scene(); this.battle = new THREE.Scene(); this.show = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 300);
    this.bcam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 300);
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.mats = {};
    this.ok = true;
    this.camPos = new THREE.Vector3(); this.camTgt = new THREE.Vector3();
    this.setupWorldLights(); this.setupBattle(); this.setupShow();
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
  },
  setQuality(q) {
    this.quality = q; try { localStorage.setItem('msp_grafik', q); } catch (e) { }
    if (!this.ok) return;
    this.r.shadowMap.enabled = q === 'tinggi';
    this.world.traverse(o => { if (o.material) o.material.needsUpdate = true; });
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
  },
  resize(w, h) {
    if (!this.ok) return;
    const pr = Math.min(devicePixelRatio || 1, this.quality === 'tinggi' ? 1.75 : 1);
    this.r.setPixelRatio(pr); this.r.setSize(w, h, false);
    this.aspect = w / h;
    for (const c of [this.cam, this.bcam]) { c.aspect = this.aspect; c.updateProjectionMatrix(); }
  },
  endFrame(used) { if (!this.ok) return; this.canvas.style.visibility = used ? 'visible' : 'hidden'; },
  mat(color, o = {}) {
    const key = color + JSON.stringify(o);
    if (!this.mats[key]) this.mats[key] = new THREE.MeshLambertMaterial(Object.assign({ color }, o));
    return this.mats[key];
  },
  canvasTex(cnv, nearest) {
    const t = new THREE.CanvasTexture(cnv);
    t.encoding = THREE.sRGBEncoding;
    if (nearest) { t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipMapLinearFilter; }
    t.anisotropy = Math.min(8, this.r.capabilities.getMaxAnisotropy());
    return t;
  },
  skyTex(top, mid, bot) {
    const [c, g] = mkCanvas(2, 256);
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, top); gr.addColorStop(.55, mid); gr.addColorStop(1, bot);
    g.fillStyle = gr; g.fillRect(0, 0, 2, 256);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  },
  // ---------- Dunia ----------
  setupWorldLights() {
    const s = this.world;
    this.hemi = new THREE.HemisphereLight(0xcfe8ff, 0x5a7a3a, .75); s.add(this.hemi);
    const d = new THREE.DirectionalLight(0xfff2d8, 1.15);
    d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
    const sc = d.shadow.camera; sc.left = -18; sc.right = 18; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 60;
    d.shadow.bias = -0.0008; d.shadow.normalBias = .02;
    s.add(d); s.add(d.target); this.sun = d;
  },
  disposeGroup(g) {
    g.traverse(o => {
      if (o.geometry && o.geometry !== this.box) o.geometry.dispose();
      if (o.material) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); if (!Object.values(this.mats).includes(m)) m.dispose(); }
    });
  },
  buildWorld(m, grid) {
    if (!this.ok) return;
    if (this.wg) { this.world.remove(this.wg); this.disposeGroup(this.wg); }
    const wg = this.wg = new THREE.Group(); this.world.add(wg);
    this.portals = [];
    const W = m.W, H = m.H;
    const inside = !m.outdoor && !m.cave;
    const M = inside ? 2 : 12;
    const border = m.border || (m.outdoor ? 'T' : 'X');
    const cell = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? grid[y][x] : border;
    this.grid = grid; this.map = m;
    // --- tanah (tekstur) ---
    const GW = W + 2 * M, GH = H + 2 * M, P = 16;
    const [gc, gg] = mkCanvas(GW * P, GH * P);
    const under = m.under || (m.outdoor ? '.' : '_');
    const groundOf = ch => {
      if ('TYtFrL'.includes(ch)) return '.';
      if (ch === '^') return m.cave || !m.outdoor ? 'c' : '.';
      if (ch === 'x') return 'c';
      if (ch === 'X') return 'X';
      if (ch === '#' || 'KCQnhzog|md'.includes(ch)) return inside ? under : 'c';
      if (BUILD.has(ch) || /\d/.test(ch)) return under;
      if (ch === 'w') return '~';
      return ch;
    };
    for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) {
      const ch = groundOf(cell(x, y));
      drawTile(gg, ch, (x + M) * P, (y + M) * P, x + 99, y + 99, m.tileTheme);
    }
    // bayang lembut di tepi jalan/air disimpan ringkas
    const gtex = this.canvasTex(gc, true);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshLambertMaterial({ map: gtex }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true;
    wg.add(ground);
    // --- himpunan instance ---
    const L = {};
    const add = (k, x, y, z, sx, sy, sz, col, ry = 0, rx = 0) => { (L[k] = L[k] || []).push([x, y, z, sx, sy, sz, col, ry, rx]); };
    const water = [];
    const theme = m.tileTheme;
    const bushes = this.bushes = {};
    for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) {
      const ch = cell(x, y), h = hash(x + 50, y + 50), cx = x + .5, cz = y + .5;
      const inMap = x >= 0 && y >= 0 && x < W && y < H;
      if (!inMap && (Math.abs(x - W / 2) > W / 2 + M - 1 || Math.abs(y - H / 2) > H / 2 + M - 1)) { }
      switch (ch) {
        case 'T': {
          const s = .85 + h * .35;
          if (theme === 'bakau') {
            add('trunk', cx, .35, cz, .9, 1, .9, 0x5a4028);
            add('root', cx - .18, .12, cz, .5, .5, .5, 0x4a3420, h * 3, .5); add('root', cx + .18, .12, cz, .5, .5, .5, 0x4a3420, h * 3 + 2, -.5);
            add('leaf', cx, .95 + h * .2, cz, s * 1.05, s * .75, s * 1.05, h < .5 ? 0x2d6e4a : 0x3a8052, h * 6);
          } else {
            add('trunk', cx, .35, cz, 1, 1, 1, 0x7a5232);
            add('leaf', cx, .95 + h * .25, cz, s, s * .9, s, h < .33 ? 0x2f7d3a : h < .66 ? 0x3c8f42 : 0x2a6e34, h * 6);
            add('leaf', cx + (h - .5) * .2, 1.45 + h * .25, cz - .05, s * .62, s * .6, s * .62, 0x4aa54c, h * 9);
          }
          break;
        }
        case 'Y': {
          add('ptrunk', cx, .8, cz, 1, 1, 1, 0x8a6a40, 0, (h - .5) * .15);
          for (let i = 0; i < 6; i++) add('frond', cx + Math.cos(i * 1.05 + h) * .38, 1.55, cz + Math.sin(i * 1.05 + h) * .38, 1, 1, 1, i % 2 ? 0x3a9a3a : 0x2c7a2c, -(i * 1.05 + h), .5);
          break;
        }
        case 't': { if (inMap) (bushes[x + ',' + y] = []); const idx = (L.bush || []).length; add('bush', cx, .32, cz, .9, .8, .9, 0x3f9a3a, h * 5); if (inMap) bushes[x + ',' + y].push(['bush', idx]); break; }
        case 'r': add('rock', cx, .28, cz, .9, .7, .85, 0x8c8c94, h * 6); break;
        case '^': { const hh = 1.1 + h * .8; add('cube', cx, hh / 2, cz, 1, hh, 1, h < .5 ? 0x8f7f60 : 0x9b8a68); add('rock', cx + (h - .5) * .3, hh + .05, cz, .6, .35, .6, 0x7d6f52, h * 4); break; }
        case 'x': { const hh = m.inside || inside ? 1.6 : 1.5 + h * .7; add('cube', cx, hh / 2, cz, 1, hh, 1, h < .5 ? 0x4e4032 : 0x5a4a3a); break; }
        case 'X': add('cube', cx, .8, cz, 1, 1.6, 1, 0x07080c); break;
        case '#': { const low = y >= H - 1; const hh = low ? .35 : 1.7; add('cube', cx, hh / 2, cz, 1, hh, 1, 0xe7ddc7); if (!low) add('cube', cx, .1, cz + .01, 1.02, .2, 1.02, 0x8a7a60); break; }
        case 'F': add('cube', cx - .38, .3, cz, .12, .6, .12, 0xa07048); add('cube', cx, .42, cz, 1, .08, .08, 0xc89868); add('cube', cx, .24, cz, 1, .08, .08, 0xc89868); break;
        case ',': case 'p': {
          const tebu = theme === 'tebu', pad = ch === 'p';
          const n = pad ? 5 : 4;
          for (let i = 0; i < n; i++) {
            const ox = hash(x, y, i) - .5, oz = hash(x, y, i + 9) - .5;
            const hgt = pad ? (tebu ? .95 : .42) : .38 + hash(x, y, i + 3) * .18;
            const col = pad ? (tebu ? 0x6aa040 : (i % 2 ? 0xc8c858 : 0xa8c048)) : (i % 2 ? 0x4e9a40 : 0x3e8a38);
            add('blade', cx + ox * .8, hgt / 2, cz + oz * .8, 1, hgt, 1, col, hash(x, y, i + 5) * 3, (hash(x, y, i + 7) - .5) * .4);
          }
          break;
        }
        case 'L': add('cube', cx, .07, cz + .38, 1, .14, .26, 0x4a7a3a); break;
        case 'b': case 'k': add('cube', cx, .04, cz, 1, .08, 1, ch === 'b' ? 0xa87848 : 0xb88858); if (ch === 'b') { add('cube', cx - .47, .22, cz, .06, .3, 1, 0x6a4222); add('cube', cx + .47, .22, cz, .06, .3, 1, 0x6a4222); } break;
        case '~': case 'w': water.push([x, y]); break;
        case 'K': add('cube', cx, .38, cz, .96, .08, .9, 0xa06a3a); add('cube', cx, .17, cz, .12, .34, .12, 0x704a28); break;
        case 'C': add('cube', cx, .45, cz, 1, .9, .8, 0x7888a8); add('cube', cx, .92, cz, 1.02, .06, .86, 0xc0d0e8); break;
        case 'Q': add('shelf', cx, .9, cz - .1, .96, 1.8, .7, 0x6a4020); break;
        case 'n': add('cube', cx, .35, cz, .8, .7, .7, 0x8890a0); add('screen', cx, .95, cz - .05, .7, .5, .1, 0x70c0e8); break;
        case 'h': add('cube', cx, .5, cz, .95, 1, .8, 0xe89098); add('cube', cx, 1.02, cz, .7, .06, .5, 0xfff0f4); break;
        case 'z': add('cube', cx, .25, cz, .9, .5, .98, 0x5878c8); add('cube', cx, .52, cz - .3, .7, .12, .3, 0xf8f8f8); break;
        case 'o': add('pot', cx, .2, cz, .5, .4, .5, 0xb86a38); add('leaf', cx, .62, cz, .45, .5, .45, 0x3c9a3c); break;
        case 'g': add('cube', cx, .15, cz, .8, .3, .8, 0x707080); add('cube', cx, .75, cz, .45, .9, .45, 0xa0a0b0); add('ball', cx, 1.35, cz, .45, .45, .45, 0xe04848); break;
        case '|': add('cube', cx - .35, .45, cz, .1, .9, .1, 0x606878); add('cube', cx + .35, .45, cz, .1, .9, .1, 0x606878); add('cube', cx, .6, cz, 1, .1, .06, 0xe8c048); break;
        case 'm': add('cube', cx, .55, cz, .92, 1.1, .92, 0x8a949e); add('screen', cx - .2, .8, cz + .47, .25, .2, .04, 0xe8c048); add('screen', cx + .2, .8, cz + .47, .25, .2, .04, 0x48e070); break;
        case 'd': add('cube', cx, .4, cz, .86, .8, .86, 0xb07838); add('cube', cx, .4, cz, .9, .12, .9, 0x8a5a28); break;
      }
    }
    // tangga/pintu dalam
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (!/\d/.test(ch)) continue;
      const d = (m.doors || {})[ch] || {};
      const above = y > 0 ? grid[y - 1][x] : '';
      if (BUILD.has(above)) continue;
      const look = d.look || (m.outdoor ? 'gua' : 'tangga');
      if (look === 'tangga') for (let i = 0; i < 4; i++) add('cube', x + .5, .06 + i * .12, y + .2 + i * .18, .9, .12 + i * .24, .2, 0xc8b8a0);
      else if (look === 'gua') { add('cube', x + .5, .7, y + .1, 1.1, 1.4, .3, 0x3a2e22); add('cube', x + .5, .5, y + .3, .7, 1, .1, 0x0a0806); }
      else if (look === 'kapal') { add('cube', x + .5, .6, y + .1, 1, 1.2, .2, 0xe8e8e8); add('cube', x + .5, .5, y + .2, .6, .9, .1, 0x3a4a6a); }
      else if (look === 'portal') {
        const pg = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.48, .07, 8, 28), new THREE.MeshLambertMaterial({ color: 0xf3c85a, emissive: 0x8a5a10 }));
        const core = new THREE.Mesh(new THREE.CircleGeometry(.44, 28), new THREE.MeshBasicMaterial({ color: 0xb088ff, transparent: true, opacity: .75, side: THREE.DoubleSide }));
        const pad = new THREE.Mesh(new THREE.RingGeometry(.2, .5, 24), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .45, side: THREE.DoubleSide }));
        ring.position.y = core.position.y = .62; pad.rotation.x = -Math.PI / 2; pad.position.y = .03;
        pg.add(ring, core, pad); pg.position.set(x + .5, 0, y + .5);
        pg.userData.core = core; wg.add(pg); this.portals.push(pg);
      }
    }
    const geo = {
      cube: this.box, trunk: new THREE.CylinderGeometry(.1, .14, .7, 6), leaf: new THREE.IcosahedronGeometry(.55, 0),
      ptrunk: new THREE.CylinderGeometry(.07, .1, 1.6, 6), frond: new THREE.BoxGeometry(.7, .04, .2), bush: new THREE.IcosahedronGeometry(.36, 0),
      rock: new THREE.DodecahedronGeometry(.4, 0), blade: new THREE.BoxGeometry(.05, 1, .05), shelf: this.box, screen: this.box,
      pot: new THREE.CylinderGeometry(.5, .38, 1, 8), ball: new THREE.SphereGeometry(.5, 10, 8), root: new THREE.CylinderGeometry(.03, .05, .5, 4)
    };
    geo.frond.translate(.35, 0, 0);
    const flat = { leaf: 1, bush: 1, rock: 1, frond: 1 };
    this.inst = {};
    const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color();
    for (const k in L) {
      const list = L[k];
      const matOpts = flat[k] ? { flatShading: true } : {};
      if (k === 'screen') matOpts.emissive = 0x223344;
      const mesh = new THREE.InstancedMesh(geo[k], new THREE.MeshLambertMaterial(matOpts), list.length);
      list.forEach((it, i) => {
        const [x, y, z, sx, sy, sz, c, ry, rx] = it;
        e.set(rx || 0, ry || 0, 0); q.setFromEuler(e);
        mtx.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz));
        mesh.setMatrixAt(i, mtx); mesh.setColorAt(i, col.setHex(c));
      });
      mesh.castShadow = k !== 'blade' && k !== 'screen'; mesh.receiveShadow = true;
      mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      wg.add(mesh); this.inst[k] = mesh;
    }
    // --- air ---
    this.water = null;
    if (water.length) {
      const pos = [], idx = [];
      for (const [x, y] of water) {
        const b = pos.length / 3;
        pos.push(x, 0, y, x + 1, 0, y, x + 1, 0, y + 1, x, 0, y + 1);
        idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
      const wm = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: 0x3a8ae0, transparent: true, opacity: .55, shininess: 90, specular: 0xbfe6ff }));
      wm.position.y = .03; wm.receiveShadow = true; wg.add(wm);
      this.water = { mesh: wm, base: Float32Array.from(pos) };
    }
    // --- bangunan ---
    this.buildBuildings(m, grid, wg);
    // --- langit & kabus ---
    const sky = m.sky ? m.sky : m.outdoor ? (m.theme === 'malam' ? ['#101830', '#2a3460', '#40486a'] : ['#6fb2ff', '#bfe2ff', '#f6f0d8'])
      : m.cave ? ['#0a0806', '#1a140e', '#2a2016'] : ['#000', '#000', '#000'];
    this.world.background = this.skyTex(...sky);
    this.world.fog = m.outdoor ? new THREE.Fog(new THREE.Color(sky[1]).getHex(), 22, 48) : m.sky ? new THREE.Fog(new THREE.Color(sky[0]).getHex(), 10, 26) : m.cave ? new THREE.Fog(0x120e0a, 8, 22) : null;
    this.hemi.intensity = m.outdoor ? (m.theme === 'malam' ? .5 : .75) : m.sky ? .65 : m.cave ? .45 : .7;
    this.hemi.color.set(m.outdoor ? 0xcfe8ff : 0xfff0d8);
    this.sun.intensity = m.outdoor ? 1.15 : m.cave ? .55 : .7;
    this.inside = inside;
    // --- entiti ---
    this.ents = new Map();
    this.player = null;
  },
  buildBuildings(m, grid, wg) {
    const W = m.W, H = m.H, seen = new Set();
    this.blds = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (!BUILD.has(ch) || seen.has(x + ',' + y)) continue;
      let w = 0; while (x + w < W && (grid[y][x + w] === ch || /\d/.test(grid[y][x + w]) && y > 0 && grid[y - 1][x + w] === ch)) w++;
      let h = 0;
      while (y + h < H) { let ok = true; for (let i = 0; i < w; i++) { const c = grid[y + h][x + i]; if (!(c === ch || (/\d/.test(c) && h > 0))) { ok = false; break; } } if (!ok) break; h++; }
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) seen.add((x + i) + ',' + (y + j));
      const doors = []; for (let i = 0; i < w; i++) if (/\d/.test(grid[y + h - 1][x + i])) doors.push(i);
      const bg = this.building(ch, x, y, w, h, doors, m); bg.userData.fp = [x, y, w, h]; this.blds.push(bg); wg.add(bg);
    }
  },
  building(ch, x, y, w, h, doors, m) {
    const g = new THREE.Group();
    const bm = c => new THREE.MeshLambertMaterial({ color: c });
    const spec = {
      H: { wall: '#c89058', roof: '#a8483a', wh: 1.35 }, P: { wall: '#f4efe4', roof: '#e05048', wh: 1.7 }, M: { wall: '#f4efe4', roof: '#4878d0', wh: 1.55 },
      G: { wall: '#dcd4ec', roof: '#8860b8', wh: 2.1 }, B: { wall: '#dfe6ee', roof: '#9aa4b0', wh: 2.2 + Math.max(0, h - 4) * .8 }, W: { wall: '#b8c4cc', roof: '#8a98a4', wh: 1.9 },
      R: { wall: '#e8dcc0', roof: '#6a8a5a', wh: 2.1 }
    }[ch];
    const d = h - .3;
    const wh = spec.wh;
    // tekstur hadapan
    const TP = 48;
    const [fc, fg] = mkCanvas(w * TP, Math.ceil(wh * TP));
    const FH = fc.height;
    fg.fillStyle = spec.wall; fg.fillRect(0, 0, fc.width, FH);
    if (ch === 'H') { fg.fillStyle = shade(spec.wall, -.15); for (let i = 6; i < fc.width; i += 9) fg.fillRect(i, 0, 2, FH); }
    if (ch === 'W') { fg.fillStyle = shade(spec.wall, -.12); for (let i = 4; i < fc.width; i += 7) fg.fillRect(i, 0, 2, FH); }
    fg.fillStyle = shade(spec.wall, -.35); fg.fillRect(0, FH - 5, fc.width, 5);
    if (ch === 'B') {
      for (let r = 8; r < FH - 40; r += 26) for (let c = 8; c < fc.width - 12; c += 24) { fg.fillStyle = '#5a8ac8'; fg.fillRect(c, r, 16, 16); fg.fillStyle = '#b8dcf8'; fg.fillRect(c, r, 6, 6); }
    }
    for (let i = 0; i < w; i++) {
      const cx = i * TP;
      if (doors.includes(i)) {
        const dc = ch === 'B' ? '#78a8d8' : ch === 'W' ? '#606a74' : '#5a3a20';
        fg.fillStyle = shade(dc, -.45); fg.fillRect(cx + 8, FH - 44, 32, 44);
        fg.fillStyle = dc; fg.fillRect(cx + 11, FH - 41, 26, 41);
        if (ch !== 'B') { fg.fillStyle = '#e8c048'; fg.fillRect(cx + 31, FH - 22, 3, 4); } else { fg.fillStyle = '#c0e0f8'; fg.fillRect(cx + 14, FH - 36, 8, 16); }
      } else if (ch !== 'B' && ch !== 'W' && (i % 2 === 1 || w <= 3)) {
        fg.fillStyle = shade(spec.wall, -.45); fg.fillRect(cx + 9, FH - 40, 30, 24);
        fg.fillStyle = '#78b0e0'; fg.fillRect(cx + 12, FH - 37, 24, 18);
        fg.fillStyle = '#c0e0f8'; fg.fillRect(cx + 12, FH - 37, 8, 6);
      }
    }
    const sign = (bg, fgc, label) => {
      const sw = Math.min(fc.width - 10, 110), sx = (fc.width - sw) / 2, sy = 6;
      fg.fillStyle = '#0006'; fg.fillRect(sx + 3, sy + 3, sw, 30);
      fg.fillStyle = bg; fg.fillRect(sx, sy, sw, 30);
      fg.fillStyle = fgc; fg.font = 'bold 20px sans-serif'; fg.textAlign = 'center'; fg.textBaseline = 'middle'; fg.fillText(label, fc.width / 2, sy + 16);
    };
    if (ch === 'P') sign('#fff', '#e03838', '✚ KLINIK');
    if (ch === 'M') sign('#2f5fc0', '#fff', 'KEDAI');
    if (ch === 'G') sign('#f0c848', '#40206a', 'GIM');
    const ftex = this.canvasTex(fc);
    const side = new THREE.MeshLambertMaterial({ color: shade(spec.wall, -.06) });
    const mats = [side, side, new THREE.MeshLambertMaterial({ color: spec.roof }), side, new THREE.MeshLambertMaterial({ map: ftex }), side];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w - .06, wh, d), mats);
    body.position.set(x + w / 2, wh / 2, y + d / 2); body.castShadow = body.receiveShadow = true;
    g.add(body);
    // bumbung
    if (ch === 'B') {
      const top = new THREE.Mesh(new THREE.BoxGeometry(w + .1, .18, d + .1), bm(spec.roof));
      top.position.set(x + w / 2, wh + .09, y + d / 2); top.castShadow = true; g.add(top);
      for (let i = 0; i < Math.max(1, w / 3); i++) { const ac = new THREE.Mesh(this.box, bm('#c8ccd4')); ac.scale.set(.5, .35, .5); ac.position.set(x + .8 + i * 3, wh + .35, y + d / 2 - .4 + (i % 2) * .6); ac.castShadow = true; g.add(ac); }
    } else {
      const rh = ch === 'H' ? .6 + d * .3 : .45 + d * .22;
      const ov = .18, L = w + ov * 2, D = d + ov * 2;
      const shape = new THREE.Shape(); shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0); shape.lineTo(0, rh); shape.lineTo(-D / 2, 0);
      const rg = new THREE.ExtrudeGeometry(shape, { depth: L, bevelEnabled: false });
      rg.rotateY(Math.PI / 2); rg.translate(-L / 2, 0, 0);
      const roof = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ color: spec.roof, flatShading: true }));
      roof.position.set(x + w / 2, wh, y + d / 2); roof.castShadow = true; roof.receiveShadow = true;
      g.add(roof);
      if (ch === 'H') { // tiang rumah kampung & tangga
        for (const px of [x + .15, x + w - .15]) { const p = new THREE.Mesh(this.box, bm('#6a4a2a')); p.scale.set(.12, .3, .12); p.position.set(px, .15, y + d + .02); g.add(p); }
      }
    }
    return g;
  },
  cutBush(x, y) {
    if (!this.ok || !this.bushes) return;
    const b = this.bushes[x + ',' + y]; if (!b) return;
    const mtx = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const [k, i] of b) { const m = this.inst[k]; if (m) { m.setMatrixAt(i, mtx); m.instanceMatrix.needsUpdate = true; } }
  },
  // ---------- Watak manusia 3D ----------
  human(lookName) {
    const L = LOOKS[lookName] || LOOKS.budak;
    const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
    const part = (col, sx, sy, sz, x, y, z, parent = body) => { const m = new THREE.Mesh(this.box, this.mat(col)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
    const leg = (x) => { const p = new THREE.Group(); p.position.set(x, .42, 0); body.add(p); part(L.p, .15, .4, .16, 0, -.2, 0, p); part('#403028', .16, .08, .2, 0, -.39, .02, p); return p; };
    const arm = (x) => { const p = new THREE.Group(); p.position.set(x, .8, 0); body.add(p); part(L.c, .11, .34, .12, 0, -.15, 0, p); part(L.s, .1, .08, .1, 0, -.34, 0, p); return p; };
    const lL = leg(-.09), lR = leg(.09);
    part(L.c, .42, .4, .24, 0, .63, 0);
    if (L.hij) part(L.hij, .44, .16, .26, 0, .82, 0);
    const aL = arm(-.27), aR = arm(.27);
    const head = new THREE.Group(); head.position.set(0, 1.03, 0); body.add(head);
    part(L.s, .34, .32, .3, 0, 0, 0, head);
    part('#1a1a22', .05, .06, .02, -.08, .02, .155, head); part('#1a1a22', .05, .06, .02, .08, .02, .155, head);
    if (L.hij) { part(L.hij, .38, .2, .34, 0, .1, -.01, head); part(L.hij, .06, .3, .32, -.18, -.05, -.02, head); part(L.hij, .06, .3, .32, .18, -.05, -.02, head); part(L.hij, .36, .34, .06, 0, -.03, -.17, head); }
    else {
      part(L.h, .36, .1, .32, 0, .19, -.01, head); part(L.h, .36, .22, .06, 0, .06, -.16, head);
      if (L.hat) { part(L.hat, .38, .1, .34, 0, .25, 0, head); part(shade(L.hat, -.2), .36, .03, .14, 0, .19, .2, head); }
    }
    g.userData = { lL, lR, aL, aR, body, phase: 0 };
    return g;
  },
  poseHuman(g, dir, moving, dt, speed = 1) {
    const u = g.userData;
    g.rotation.y = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[dir] || 0;
    if (moving) u.phase += dt * 12 * speed; else u.phase = 0;
    const s = Math.sin(u.phase) * (moving ? .7 : 0);
    u.lL.rotation.x = s; u.lR.rotation.x = -s; u.aL.rotation.x = -s * .8; u.aR.rotation.x = s * .8;
    u.body.position.y = moving ? Math.abs(Math.sin(u.phase)) * .04 : 0;
  },
  // ---------- Monsta voksel ----------
  voxCache: {},
  voxData(name) {
    if (this.voxCache[name]) return this.voxCache[name];
    const src = monstaSprite(name), N = 64;
    const d = src.getContext('2d').getImageData(0, 0, N, N).data;
    const filled = (x, y) => x >= 0 && y >= 0 && x < N && y < N && d[(y * N + x) * 4 + 3] > 10;
    const dist = new Int16Array(N * N).fill(-1); const q = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (filled(x, y) && (!filled(x - 1, y) || !filled(x + 1, y) || !filled(x, y - 1) || !filled(x, y + 1))) { dist[y * N + x] = 0; q.push(x, y); }
    for (let i = 0; i < q.length; i += 2) {
      const x = q[i], y = q[i + 1], dv = dist[y * N + x];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (filled(nx, ny) && dist[ny * N + nx] < 0) { dist[ny * N + nx] = dv + 1; q.push(nx, ny); } }
    }
    const vox = [];
    let minY = N;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!filled(x, y)) continue;
      const k = (y * N + x) * 4;
      const dv = dist[y * N + x];
      const depth = 1 + Math.sqrt(Math.min(dv, 9)) * 2.4;
      vox.push([x, y, depth, d[k], d[k + 1], d[k + 2]]);
      if (y < minY) minY = y;
    }
    let maxY = 0; for (const v of vox) maxY = Math.max(maxY, v[1]);
    return (this.voxCache[name] = { vox, maxY });
  },
  voxel(name, scale = 1) {
    const { vox, maxY } = this.voxData(name);
    const s = scale / 32;
    const mesh = new THREE.InstancedMesh(this.box, new THREE.MeshLambertMaterial(), vox.length);
    const mtx = new THREE.Matrix4(), c = new THREE.Color();
    vox.forEach((v, i) => {
      mtx.makeScale(s, s, s * v[2]); mtx.setPosition((v[0] - 31.5) * s, (maxY - v[1] + .5) * s, 0);
      mesh.setMatrixAt(i, mtx);
      c.setRGB(v[3] / 255, v[4] / 255, v[5] / 255); c.convertSRGBToLinear();
      mesh.setColorAt(i, c);
    });
    mesh.castShadow = true;
    const g = new THREE.Group(); g.add(mesh); g.userData.mesh = mesh;
    return g;
  },
  // ---------- Kemas kini dunia setiap bingkai ----------
  drawWorld() {
    if (!this.ok || !World.map) return false;
    Game.used3d = true;
    const dt = Game.dt || .016;
    const p = World.p;
    // pemain
    if (!this.player || this.playerLook !== S.look) {
      if (this.player) this.world.remove(this.player);
      this.player = this.human(S.look); this.playerLook = S.look; this.world.add(this.player);
      this.bike = null; this.surfMon = null;
    }
    const px = p.px / 16 + .5, pz = p.py / 16 + .5;
    this.player.position.set(px, (p.jumpY ? -p.jumpY / 16 : 0) + (S.surf ? .15 : 0), pz);
    this.poseHuman(this.player, p.dir, !!p.moving && !S.bike, dt, Input.held.b ? 1.6 : 1);
    // basikal / berenang
    if (S.bike && !this.bike) { this.bike = new THREE.Group(); for (const z of [-.25, .25]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.16, .04, 6, 12), this.mat('#202020')); w.rotation.y = Math.PI / 2; w.position.set(0, .18, z); this.bike.add(w); } const fr = new THREE.Mesh(this.box, this.mat('#d03030')); fr.scale.set(.06, .06, .5); fr.position.y = .3; this.bike.add(fr); this.world.add(this.bike); }
    if (!S.bike && this.bike) { this.world.remove(this.bike); this.bike = null; }
    if (this.bike) { this.bike.position.set(px, 0, pz); this.bike.rotation.y = this.player.rotation.y; this.player.position.y += .15; }
    const lead = S.surf ? (S.party.find(m => m.moves.some(q => q.id === 'ombak')) || S.party[0]) : null;
    if (lead && (!this.surfMon || this.surfMon.userData.name !== lead.sp)) { if (this.surfMon) this.world.remove(this.surfMon); this.surfMon = this.voxel(lead.sp, .55); this.surfMon.userData.name = lead.sp; this.world.add(this.surfMon); }
    if (!lead && this.surfMon) { this.world.remove(this.surfMon); this.surfMon = null; }
    if (this.surfMon) { this.surfMon.position.set(px, -.1 + Math.sin(Game.t * 3) * .04, pz); this.surfMon.rotation.y = this.player.rotation.y + Math.PI / 2; }
    // objek
    const alive = new Set();
    for (const o of World.objs) {
      const d = o.def; if (d.trig || d.hid) continue;
      alive.add(o);
      let e = this.ents.get(o);
      if (!e) {
        if (d.s) e = this.human(d.s);
        else if (d.sign) { e = new THREE.Group(); const post = new THREE.Mesh(this.box, this.mat('#6a4222')); post.scale.set(.08, .6, .08); post.position.y = .3; const bd = new THREE.Mesh(this.box, this.mat('#c8985a')); bd.scale.set(.7, .42, .07); bd.position.set(0, .66, 0); post.castShadow = bd.castShadow = true; e.add(post, bd); }
        else if (d.ball === 'cahaya') { e = new THREE.Group(); const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.26, 1), new THREE.MeshLambertMaterial({ color: 0xffe89a, emissive: 0xc08a20, flatShading: true })); orb.position.y = .6; const halo = new THREE.Mesh(new THREE.RingGeometry(.3, .5, 24), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .4, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = .03; e.add(orb, halo); e.userData.frag = orb; }
        else if (d.item || d.ball) { e = new THREE.Group(); const top = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), this.mat('#e03838')); const bot = new THREE.Mesh(new THREE.SphereGeometry(.17, 12, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.mat('#f4f4f4')); const band = new THREE.Mesh(new THREE.CylinderGeometry(.175, .175, .03, 12), this.mat('#202020')); top.castShadow = true; e.add(top, bot, band); e.userData.ball = true; }
        else if (d.bar) { e = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.1, 6), this.mat('#8890a0')); b.position.set(-.36 + i * .24, .55, 0); e.add(b); } const t = new THREE.Mesh(this.box, this.mat('#e8c048')); t.scale.set(1, .1, .08); t.position.y = .7; e.add(t); }
        else if (d.mon) { e = this.voxel(d.mon, .7); e.userData.mon = true; }
        else if (d.frag) { e = new THREE.Group(); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), new THREE.MeshLambertMaterial({ color: 0xf3c85a, emissive: 0x7a5010, flatShading: true })); gem.castShadow = true; gem.position.y = .55; const glow = new THREE.Mesh(new THREE.RingGeometry(.2, .34, 20), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .5, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = .03; e.add(gem, glow); e.userData.frag = gem; }
        else continue;
        this.ents.set(o, e); this.world.add(e);
      }
      const ox = o.px / 16 + .5, oz = o.py / 16 + .5;
      e.position.set(ox, e.userData.ball ? .17 : 0, oz);
      if (d.s) this.poseHuman(e, o.dir, !!o.moving, dt);
      if (d.mon) { e.position.y = Math.sin(Game.t * 2) * .05; e.rotation.y = -.5; }
      if (d.frag || d.ball === 'cahaya') { e.userData.frag.rotation.y = Game.t * 2; e.userData.frag.position.y = .55 + Math.sin(Game.t * 3) * .08; }
      if (d.sign) e.rotation.y = 0;
      e.visible = true;
      if (o.bang) this.bangAt = [ox, oz]; else if (this.bangAt && this.bangAt[0] === ox && this.bangAt[1] === oz) this.bangAt = null;
    }
    for (const [o, e] of this.ents) if (!alive.has(o)) { this.world.remove(e); this.ents.delete(o); }
    // bangunan di hadapan pemain menjadi lut sinar
    for (const b of this.blds || []) {
      const [bx, by, bw, bh] = b.userData.fp;
      const hide = px > bx - .3 && px < bx + bw + .3 && pz < by + bh - .3 && pz > by - 3.5;
      if (b.userData.hidden !== hide) {
        b.userData.hidden = hide;
        b.traverse(o => { if (o.material) for (const mm of [].concat(o.material)) { mm.transparent = hide; mm.opacity = hide ? .28 : 1; mm.depthWrite = !hide; } });
      }
    }
    for (const pg of this.portals || []) { pg.children[0].rotation.z = Game.t * 1.5; pg.userData.core.material.opacity = .55 + Math.sin(Game.t * 3) * .2; }
    // air bergelombang
    if (this.water) {
      const a = this.water.mesh.geometry.attributes.position, b = this.water.base;
      for (let i = 0; i < a.count; i++) a.array[i * 3 + 1] = Math.sin(Game.t * 1.6 + b[i * 3] * .9 + b[i * 3 + 2] * .7) * .05;
      a.needsUpdate = true;
    }
    // kamera
    const por = PORTRAIT;
    const ins = this.inside;
    const off = ins ? (por ? [0, 12.5, 8.2] : [0, 9.5, 7.4]) : (por ? [0, 15.5, 9.8] : [0, 11.5, 9.6]);
    this.cam.fov = por ? 52 : 40; this.cam.updateProjectionMatrix();
    const tx = px, tz = pz + (por ? .6 : 0);
    const tgt = new THREE.Vector3(tx, .4, tz), pos = new THREE.Vector3(tx + off[0], off[1], tz + off[2]);
    if (this.snap || this.camPos.distanceTo(pos) > 6) { this.camPos.copy(pos); this.camTgt.copy(tgt); this.snap = false; }
    else { const k = 1 - Math.pow(.0005, dt); this.camPos.lerp(pos, k); this.camTgt.lerp(tgt, k); }
    this.cam.position.copy(this.camPos); this.cam.lookAt(this.camTgt);
    this.sun.position.set(this.camTgt.x - 6, 14, this.camTgt.z + 4); this.sun.target.position.copy(this.camTgt);
    this.r.render(this.world, this.cam);
    return true;
  },
  // skrin ke dunia (untuk tanda '!' di atas NPC)
  project(x, y, z, cam = this.cam) {
    const v = new THREE.Vector3(x, y, z).project(cam);
    return [(v.x + 1) / 2 * SW, (1 - v.y) / 2 * SH];
  },
  // ---------- Arena pertarungan ----------
  setupBattle() {
    const s = this.battle;
    this.bhemi = new THREE.HemisphereLight(0xdfefff, 0x6a7a4a, .8); s.add(this.bhemi);
    const d = new THREE.DirectionalLight(0xfff0d0, 1.2); d.position.set(-5, 10, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
    const sc = d.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; s.add(d); this.bsun = d;
    this.bg = new THREE.Group(); s.add(this.bg);
    this.plats = [];
    for (let i = 0; i < 2; i++) {
      const p = new THREE.Group();
      const c = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.85, .25, 36), this.mat('#8cc070')); c.position.y = -.12; c.receiveShadow = true;
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.72, .05, 6, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .5 })); ring.rotation.x = Math.PI / 2; ring.position.y = .02;
      p.add(c, ring); s.add(p); this.plats.push(p);
    }
    this.plats[0].position.set(-2.1, 0, 1.7); this.plats[1].position.set(2.3, 0, -2.2);
    this.parts = []; this.partGeo = new THREE.BoxGeometry(.12, .12, .12);
    this.bball = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: 0xe03838 }));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(.22, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.mat('#f4f4f4'));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.225, .225, .04, 16), this.mat('#202020'));
    this.bball.add(top, bot, band); this.bball.userData.top = top; this.bball.visible = false; s.add(this.bball);
  },
  battleTheme(theme) {
    if (this.bthemeName === theme) return;
    this.bthemeName = theme;
    const T = {
      rumput: { sky: ['#5ea8ff', '#bfe4ff', '#f8f0d0'], ground: '#7cc060', plat: '#9ad07c', prop: 'pokok' },
      pantai: { sky: ['#4aa0f0', '#b8e4ff', '#fff4d0'], ground: '#f0dca0', plat: '#f8e8b8', prop: 'laut' },
      gua: { sky: ['#0c0a08', '#2a2016', '#3a2c1c'], ground: '#7a6448', plat: '#a08868', prop: 'batu' },
      dalam: { sky: ['#1a1410', '#4a3a2a', '#6a5440'], ground: '#c8a878', plat: '#e0c898', prop: 'dinding' },
      bandar: { sky: ['#6aa8e8', '#c8dcf0', '#f0ece0'], ground: '#9098a4', plat: '#b8c0cc', prop: 'bangunan' },
      gim: { sky: ['#2a1a4a', '#6a4a9a', '#c8b0e8'], ground: '#b8a8d8', plat: '#e8d860', prop: 'tiang' },
      air: { sky: ['#3a88e0', '#a8d8ff', '#e0f4ff'], ground: '#4a90e0', plat: '#88c0f0', prop: 'laut' },
      malam: { sky: ['#0a0e20', '#262c50', '#40486a'], ground: '#3a4458', plat: '#5a6480', prop: 'pokok' },
      liga: { sky: ['#2a1206', '#8a4a1a', '#f0c070'], ground: '#c89858', plat: '#f0d080', prop: 'tiang' },
      masa: { sky: ['#1a0a2a', '#6a3a7a', '#f0a870'], ground: '#8a7a6a', plat: '#d8b890', prop: 'batu' },
    }[theme] || null;
    const t = T || { sky: ['#5ea8ff', '#bfe4ff', '#f8f0d0'], ground: '#7cc060', plat: '#9ad07c', prop: 'pokok' };
    const s = this.battle;
    s.background = this.skyTex(...t.sky);
    s.fog = new THREE.Fog(new THREE.Color(t.sky[1]).getHex(), 16, 42);
    while (this.bg.children.length) this.bg.remove(this.bg.children[0]);
    const [gc, gg] = mkCanvas(256, 256);
    gg.fillStyle = t.ground; gg.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 900; i++) { gg.fillStyle = shade(t.ground, (hash(i, 1) - .5) * .25); gg.fillRect(hash(i, 2) * 256, hash(i, 3) * 256, 3, 3); }
    const gt = this.canvasTex(gc); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; gt.repeat.set(10, 10);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.MeshLambertMaterial({ map: gt }));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -.25; ground.receiveShadow = true; this.bg.add(ground);
    for (const p of this.plats) p.children[0].material = this.mat(t.plat);
    const rng = i => hash(i, 77);
    for (let i = 0; i < 46; i++) {
      const a = i / 46 * Math.PI * 2 + rng(i) * .1, r = 13 + rng(i + 5) * 9;
      const x = Math.cos(a) * r, z = Math.sin(a) * r - 4;
      let m;
      if (t.prop === 'pokok') { m = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2 + rng(i) * .8, 0), new THREE.MeshLambertMaterial({ color: rng(i + 1) < .5 ? 0x2f7d3a : 0x3c8f42, flatShading: true })); m.position.set(x, 1.4 + rng(i) * .6, z); }
      else if (t.prop === 'batu') { m = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2 + rng(i) * 1.4, 0), new THREE.MeshLambertMaterial({ color: shade(t.ground, -.2), flatShading: true })); m.position.set(x, .8, z); }
      else if (t.prop === 'bangunan') { const h = 2 + rng(i) * 6; m = new THREE.Mesh(this.box, this.mat(rng(i + 2) < .5 ? '#c8d0dc' : '#a8b4c4')); m.scale.set(2 + rng(i) * 2, h, 2); m.position.set(x, h / 2, z); }
      else if (t.prop === 'tiang') { m = new THREE.Mesh(new THREE.CylinderGeometry(.35, .4, 5, 8), this.mat(t.plat)); m.position.set(x * .8, 2.3, z * .8); if (i % 2) continue; }
      else if (t.prop === 'dinding') { if (i % 3) continue; m = new THREE.Mesh(this.box, this.mat('#8a6a48')); m.scale.set(3, 4, .6); m.position.set(x, 2, z); m.lookAt(0, 2, -4); }
      else if (t.prop === 'laut') { if (i > 0) continue; m = new THREE.Mesh(new THREE.PlaneGeometry(120, 60), new THREE.MeshPhongMaterial({ color: 0x3a90e0, shininess: 80, specular: 0xffffff })); m.rotation.x = -Math.PI / 2; m.position.set(0, -.2, -40); }
      if (m) { m.castShadow = true; this.bg.add(m); }
    }
  },
  battleSet(bs) {
    this.bs = bs;
    this.battleTheme(bs.o.theme || 'rumput');
    for (const k of ['meM', 'foeM', 'meTrM', 'foeTrM']) if (this[k]) { this.battle.remove(this[k]); this[k] = null; }
    this.meName = this.foeName = null; this.bshake = 0; this.btime = 0;
    for (const p of this.parts) this.battle.remove(p.m); this.parts = [];
    this.meTrM = this.human(S.look); this.meTrM.scale.setScalar(1.6); this.battle.add(this.meTrM);
    if (bs.tr) { this.foeTrM = this.human(bs.tr.look || 'budak'); this.foeTrM.scale.setScalar(1.6); this.battle.add(this.foeTrM); }
  },
  fx(type, side, big) {
    if (!this.ok || !this.bs) return;
    const col = new THREE.Color(TYPE_COLOR[type] || '#ffffff');
    const tgt = side === 'me' ? this.plats[0].position : this.plats[1].position;
    const n = big ? 60 : 36;
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(this.partGeo, new THREE.MeshBasicMaterial({ color: col.clone().offsetHSL(0, 0, (Math.random() - .5) * .3), transparent: true }));
      m.position.set(tgt.x, 1 + Math.random() * .8, tgt.z);
      const a = Math.random() * Math.PI * 2, sp = 2 + Math.random() * 3;
      const up = type === 'Api' ? 3 : type === 'Air' ? 2 : 1.5;
      this.battle.add(m);
      this.parts.push({ m, v: new THREE.Vector3(Math.cos(a) * sp, up + Math.random() * 2, Math.sin(a) * sp), life: .6 + Math.random() * .4, g: type === 'Api' ? -1 : 6 });
    }
    this.bshake = big ? .35 : .2;
  },
  drawBattle(bs) {
    if (!this.ok) return false;
    Game.used3d = true;
    if (this.bs !== bs) this.battleSet(bs);
    const dt = Game.dt || .016; this.btime += dt;
    const t = this.btime;
    const mePos = this.plats[0].position, foePos = this.plats[1].position;
    // Monsta
    const want = (side, name) => {
      const k = side + 'M', nk = side + 'Name';
      if (this[nk] === name) return this[k];
      if (this[k]) this.battle.remove(this[k]);
      this[k] = name ? this.voxel(name, side === 'me' ? 1.25 : 1.1) : null; this[nk] = name;
      if (this[k]) this.battle.add(this[k]);
      return this[k];
    };
    const ghost = bs.o.ghost && !S.bag['Teropong Roh'];
    const meM = want('me', bs.me.mon ? bs.me.mon.sp : null);
    const foeM = want('foe', bs.foe.mon ? bs.foe.mon.sp : null);
    if (meM) {
      meM.visible = bs.meVis && !(bs.meBlink > 0 && Math.floor(Game.t * 16) % 2);
      meM.position.set(mePos.x + bs.meX / 60, -bs.meY / 90 + Math.sin(t * 2.2) * .03, mePos.z);
      meM.rotation.y = Math.PI + .5;
      const k = 1 + Math.sin(t * 2.2) * .015; meM.scale.set(k, 1 / k, k);
    }
    if (foeM) {
      foeM.visible = bs.foeVis && !(bs.foeBlink > 0 && Math.floor(Game.t * 16) % 2);
      const sc = bs.foeScale;
      foeM.position.set(foePos.x + bs.foeX / 60, -bs.foeY / 90 + Math.sin(t * 2 + 1) * .03, foePos.z);
      foeM.rotation.y = -.35;
      foeM.scale.setScalar(sc);
      foeM.userData.mesh.material.color.set(ghost ? 0x221a30 : 0xffffff);
    }
    if (this.meTrM) { this.meTrM.visible = bs.meTr; this.meTrM.position.set(mePos.x - .3 + bs.meTrX / 60, 0, mePos.z + .2); this.meTrM.rotation.y = Math.PI * .8; }
    if (this.foeTrM) { this.foeTrM.visible = bs.foeTr; this.foeTrM.position.set(foePos.x + bs.foeTrX / 60, 0, foePos.z); this.foeTrM.rotation.y = -.4; }
    // bola
    if (bs.ball) {
      this.bball.visible = true;
      const k = bs.ball.k !== undefined ? bs.ball.k : 1;
      const from = new THREE.Vector3(mePos.x, 1.2, mePos.z), to = new THREE.Vector3(foePos.x, .25, foePos.z);
      this.bball.position.lerpVectors(from, to, k); this.bball.position.y += Math.sin(k * Math.PI) * 2.2;
      this.bball.rotation.z = (bs.ball.wob || 0) * .6 + (k < 1 ? k * 12 : 0);
      this.bball.userData.top.material.color.set(bs.ball.col || '#e03838');
    } else this.bball.visible = false;
    // zarah
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life -= dt;
      if (p.life <= 0) { this.battle.remove(p.m); p.m.material.dispose(); this.parts.splice(i, 1); continue; }
      p.v.y -= p.g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 6; p.m.material.opacity = Math.min(1, p.life * 2);
    }
    // kamera sinematik
    const por = PORTRAIT;
    const intro = Math.max(0, 1 - t / 1.4);
    const sway = Math.sin(t * .35) * .35;
    const base = por ? new THREE.Vector3(-3.4 + sway, 3.4, 9.6) : new THREE.Vector3(-4.4 + sway, 2.7, 7);
    const look = por ? new THREE.Vector3(.4, 1.1, -.8) : new THREE.Vector3(.8, 1.05, -.6);
    const cp = base.clone().add(new THREE.Vector3(intro * 6, intro * 3, intro * 4));
    if (this.bshake > 0) { this.bshake -= dt; cp.x += (Math.random() - .5) * this.bshake; cp.y += (Math.random() - .5) * this.bshake; }
    this.bcam.fov = por ? 58 : 40; this.bcam.updateProjectionMatrix();
    this.bcam.position.copy(cp); this.bcam.lookAt(look);
    this.bsun.target.position.set(0, 0, 0);
    this.r.render(this.battle, this.bcam);
    return true;
  },
  // kedudukan skrin Monsta (untuk kad info)
  battleAnchor(side) {
    const p = side === 'me' ? this.plats[0].position : this.plats[1].position;
    return this.project(p.x, side === 'me' ? 2.6 : 2.4, p.z, this.bcam);
  },
  // ---------- Pameran (skrin tajuk, evolusi, Monstadex) ----------
  setupShow() {
    const s = this.show;
    s.add(new THREE.HemisphereLight(0xfff0e0, 0x402a60, .9));
    const d = new THREE.DirectionalLight(0xffe0b0, 1.3); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); s.add(d);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, .4, 40), new THREE.MeshLambertMaterial({ color: 0x3a3060 })); plat.position.y = -.2; plat.receiveShadow = true; s.add(plat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, .06, 8, 60), new THREE.MeshBasicMaterial({ color: 0xe9c46a })); ring.rotation.x = Math.PI / 2; s.add(ring);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(40, 40), new THREE.MeshLambertMaterial({ color: 0x1a1830 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.4; floor.receiveShadow = true; s.add(floor);
    for (let i = 0; i < 30; i++) {
      const a = Math.PI * (1.02 + i / 30 * .96), r = 12 + hash(i, 4) * 10, h = 2 + hash(i, 5) * 7;
      const m = new THREE.Mesh(new THREE.ConeGeometry(2 + hash(i, 6) * 2, h, 5), new THREE.MeshLambertMaterial({ color: 0x2a2450, flatShading: true }));
      m.position.set(Math.cos(a) * r, h / 2 - .4, Math.sin(a) * r - 6); s.add(m);
    }
    s.background = this.skyTex('#1a1040', '#b0506a', '#f8c068');
    s.fog = new THREE.Fog(0xb0506a, 14, 40);
    this.scam = new THREE.PerspectiveCamera(40, 1, .1, 200);
  },
  drawShow(name, o = {}) {
    if (!this.ok) return false;
    Game.used3d = true;
    const key = (o.human ? 'h:' : '') + name;
    if (this.showName !== key) {
      if (this.showM) this.show.remove(this.showM);
      if (o.human) { this.showM = this.human(name); this.showM.scale.setScalar(2.4); }
      else this.showM = this.voxel(name, 1.5);
      this.showName = key; this.show.add(this.showM);
    }
    const m = this.showM;
    m.rotation.y = o.rot !== undefined ? o.rot : Math.sin(Game.t * .6) * .7 - (o.human ? 0 : .3);
    m.position.y = o.human ? 0 : Math.sin(Game.t * 2) * .06;
    if (o.human) this.poseHuman(m, 'down', false, 0); else {
      m.userData.mesh.material.emissive = new THREE.Color(o.white ? 0xffffff : 0x000000);
      m.userData.mesh.material.color.set(o.white ? 0x000000 : 0xffffff);
    }
    if (o.human) m.rotation.y = Math.sin(Game.t * .6) * .4;
    const por = PORTRAIT;
    this.scam.aspect = this.aspect; this.scam.fov = por ? 60 : 38;
    const y0 = o.y !== undefined ? o.y : 0;
    this.scam.position.set(0, 2.2 + (por ? 1.5 : 0), por ? 11 : 8.5); this.scam.lookAt(0, 1.3 + y0, 0);
    this.scam.updateProjectionMatrix();
    this.r.render(this.show, this.scam);
    return true;
  }
};
R3.init();
