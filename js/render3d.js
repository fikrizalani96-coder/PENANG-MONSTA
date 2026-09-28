'use strict';
// ===== Pemapar 3D (Three.js): diorama dunia, watak chibi, Monsta plush, arena pertarungan =====
// Gaya: cahaya matahari hangat, bayang lembut, rumput & bunga, pokok bulat, kesan tilt-shift.

// ---------- pembantu geometri ----------
const G3 = {
  // hingar nilai 3D (untuk benjolan pokok/batu)
  vn3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const fx = x - xi, fy = y - yi, fz = z - zi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz);
    const h = (a, b, c) => hash(xi + a, yi + b, zi + c + 7);
    const l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h(0, 0, 0), h(1, 0, 0), sx), l(h(0, 1, 0), h(1, 1, 0), sx), sy), l(l(h(0, 0, 1), h(1, 0, 1), sx), l(h(0, 1, 1), h(1, 1, 1), sx), sy), sz);
  },
  flat(g) { return g.index ? g.toNonIndexed() : g; },
  // warna bucu melalui fungsi (x,y,z,warna)
  paint(g, fn) {
    const p = g.attributes.position, c = new Float32Array(p.count * 3), col = new THREE.Color();
    for (let i = 0; i < p.count; i++) { fn(p.getX(i), p.getY(i), p.getZ(i), col, i); c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
    g.setAttribute('color', new THREE.BufferAttribute(c, 3));
    return g;
  },
  merge(list) {
    let n = 0; for (const g of list) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), col = new Float32Array(n * 3);
    let o = 0;
    for (const g of list) {
      pos.set(g.attributes.position.array, o * 3); nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.color) col.set(g.attributes.color.array, o * 3); else col.fill(1, o * 3, (o + g.attributes.position.count) * 3);
      o += g.attributes.position.count;
    }
    const r = new THREE.BufferGeometry();
    r.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    r.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    r.setAttribute('color', new THREE.BufferAttribute(col, 3));
    r.computeBoundingSphere();
    return r;
  },
  // gumpalan sfera berbenjol (daun pokok, semak, batu)
  blob(spheres, detail, bump, freq, colorFn) {
    const parts = [];
    for (const [cx, cy, cz, r] of spheres) {
      const g = this.flat(new THREE.IcosahedronGeometry(r, detail));
      const p = g.attributes.position, nrm = g.attributes.normal;
      for (let i = 0; i < p.count; i++) {
        let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
        const l = Math.hypot(x, y, z) || 1; const nx = x / l, ny = y / l, nz = z / l;
        const d = (this.vn3((x + cx) * freq, (y + cy) * freq, (z + cz) * freq) - .5) * bump;
        p.setXYZ(i, x + nx * d + cx, y + ny * d + cy, z + nz * d + cz);
        nrm.setXYZ(i, nx, ny, nz);
      }
      parts.push(g);
    }
    const m = this.merge(parts);
    if (colorFn) this.paint(m, colorFn);
    return m;
  },
  // rumpun rumput: bilah melengkung (x0: lebar, h: tinggi, n: bilangan)
  tuft(n, h, w, lean, cBase, cTip, seed = 1) {
    const pos = [], nor = [], col = [];
    const a = new THREE.Color(cBase), b = new THREE.Color(cTip), c = new THREE.Color();
    for (let i = 0; i < n; i++) {
      const ang = (i / n) * Math.PI * 2 + hash(i, seed) * 1.2;
      const hh = h * (.65 + hash(i, seed, 2) * .5), ww = w * (.8 + hash(i, seed, 3) * .4), le = lean * (.5 + hash(i, seed, 4));
      const ox = Math.cos(ang) * w * 1.1 * hash(i, seed, 5), oz = Math.sin(ang) * w * 1.1 * hash(i, seed, 5);
      const dx = Math.cos(ang), dz = Math.sin(ang), px = -dz, pz = dx;
      const seg = 3, pts = [];
      for (let k = 0; k <= seg; k++) {
        const t = k / seg, off = le * t * t, wid = ww * (1 - t * .92) / 2;
        const cx = ox + dx * off, cy = hh * t * (1 - le * .15 * t), cz = oz + dz * off;
        pts.push([cx - px * wid, cy, cz - pz * wid, t], [cx + px * wid, cy, cz + pz * wid, t]);
      }
      for (let k = 0; k < seg; k++) {
        const q = [pts[k * 2], pts[k * 2 + 1], pts[k * 2 + 3], pts[k * 2 + 2]];
        for (const idx of [0, 1, 2, 0, 2, 3]) {
          const v = q[idx]; pos.push(v[0], v[1], v[2]);
          nor.push(dx * .25, .95, dz * .25);
          c.copy(a).lerp(b, Math.pow(v[3], .8)); col.push(c.r, c.g, c.b);
        }
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeBoundingSphere();
    return g;
  },
  // daun rata tersusun bulat (roset / pelepah)
  rosette(n, len, wid, up, cIn, cOut) {
    const parts = [];
    for (let i = 0; i < n; i++) {
      const g = this.flat(new THREE.SphereGeometry(1, 8, 4));
      g.scale(len / 2, .02, wid / 2); g.translate(len / 2, 0, 0); g.rotateZ(up); g.rotateY(i / n * Math.PI * 2 + i * .3);
      parts.push(g);
    }
    const m = this.merge(parts);
    const a = new THREE.Color(cIn), b = new THREE.Color(cOut);
    this.paint(m, (x, y, z, c) => c.copy(a).lerp(b, Math.min(1, Math.hypot(x, z) / len)));
    const nr = m.attributes.normal; for (let i = 0; i < nr.count; i++) nr.setXYZ(i, 0, 1, 0);
    return m;
  },
  flower(nPetal) {
    const parts = [];
    for (let i = 0; i < nPetal; i++) {
      const g = this.flat(new THREE.SphereGeometry(1, 8, 5)); g.scale(.05, .018, .032); g.translate(.045, 0, 0); g.rotateY(i / nPetal * Math.PI * 2);
      this.paint(g, (x, y, z, c) => c.setRGB(1, 1, 1)); parts.push(g);
    }
    const ctr = this.flat(new THREE.SphereGeometry(.026, 8, 5)); ctr.translate(0, .012, 0);
    this.paint(ctr, (x, y, z, c) => c.set('#f6c334')); parts.push(ctr);
    const stem = this.flat(new THREE.CylinderGeometry(.008, .01, .16, 4)); stem.translate(0, -.08, 0);
    this.paint(stem, (x, y, z, c) => c.set('#3f8a2c')); parts.push(stem);
    const m = this.merge(parts); m.translate(0, .16, 0);
    return m;
  },
};

const R3 = {
  ok: false, quality: 'tinggi',
  init() {
    if (!window.THREE) return;
    THREE.ColorManagement.legacyMode = false;
    // Lalai: 2D klasik. 3D hanya jika pemain memilihnya sendiri dalam PILIHAN → GRAFIK.
    this.quality = '2d';
    try { const q = localStorage.getItem('msp_grafik'); if (q && localStorage.getItem('msp_grafik_pilih') === '1') this.quality = q; } catch (e) { }
    if (this.quality === '2d' || /[?&]2d\b/.test(location.search)) return; // mod 2D klasik
    const c = document.getElementById('gl');
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: c, antialias: (devicePixelRatio || 1) < 2, powerPreference: 'high-performance' }); }
    catch (e) { console.warn('WebGL tiada, guna 2D', e); return; }
    this.r = r; this.canvas = c;
    this.gl2 = r.capabilities.isWebGL2;
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = .95;
    r.shadowMap.enabled = this.quality === 'tinggi';
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.world = new THREE.Scene(); this.battle = new THREE.Scene(); this.show = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 300);
    this.bcam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 300);
    this.box = new THREE.BoxGeometry(1, 1, 1);
    this.mats = {};
    this.ok = true;
    this.camPos = new THREE.Vector3(); this.camTgt = new THREE.Vector3();
    this.buildLibrary();
    if (this.gl2) this.atlas = this.makeAtlas();
    this.setupPost();
    this.setupWorldLights(); this.setupBattle(); this.setupShow();
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
  },
  get hi() { return this.quality === 'tinggi'; },
  setQuality(q) {
    this.quality = q; try { localStorage.setItem('msp_grafik', q); } catch (e) { }
    if (!this.ok) return;
    this.r.shadowMap.enabled = q === 'tinggi';
    for (const s of [this.world, this.battle, this.show]) s.traverse(o => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; });
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
    if (World.map && World.grid) { this.buildWorld(World.map, World.grid); this.snap = true; }
    this.bthemeName = null;
  },
  resize(w, h) {
    if (!this.ok) return;
    const pr = Math.min(devicePixelRatio || 1, this.hi ? 1.75 : 1);
    this.r.setPixelRatio(pr); this.r.setSize(w, h, false);
    this.aspect = w / h;
    for (const c of [this.cam, this.bcam]) { c.aspect = this.aspect; c.updateProjectionMatrix(); }
    if (this.post) { const W = Math.round(w * pr), H = Math.round(h * pr); this.post.a.setSize(W, H); this.post.b.setSize(W, H); this.post.px.set(1 / W, 1 / H); }
  },
  endFrame(used) { if (!this.ok) return; this.canvas.style.visibility = used ? 'visible' : 'hidden'; },
  mat(color, o = {}) {
    const key = color + JSON.stringify(o);
    if (!this.mats[key]) this.mats[key] = new THREE.MeshLambertMaterial(Object.assign({ color }, o));
    return this.mats[key];
  },
  smat(color, rough = .75) { // bahan lembut untuk watak
    const key = 's' + color + rough;
    if (!this.mats[key]) this.mats[key] = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 });
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
  // ---------- Pasca-proses: tilt-shift (kedalaman medan diorama) + gred warna ----------
  setupPost() {
    if (!this.gl2) { this.post = null; return; }
    const mk = (samples) => { const t = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples }); t.texture.generateMipmaps = false; return t; };
    const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
    const vs = 'varying vec2 vUv; void main(){ vUv = position.xy * .5 + .5; gl_Position = vec4(position.xy, 0., 1.); }';
    const fsBlur = (final) => `
      uniform sampler2D tSrc; uniform vec2 uDir; uniform vec2 uPx; uniform float uFocus; uniform float uBand; uniform float uAmt; varying vec2 vUv;
      void main(){
        float d = abs(vUv.y - uFocus);
        float k = smoothstep(uBand, uBand + .32, d) * uAmt;
        vec4 acc = texture2D(tSrc, vUv) * .2270270270;
        vec2 o1 = uDir * uPx * 1.3846153846 * k, o2 = uDir * uPx * 3.2307692308 * k;
        acc += (texture2D(tSrc, vUv + o1) + texture2D(tSrc, vUv - o1)) * .3162162162;
        acc += (texture2D(tSrc, vUv + o2) + texture2D(tSrc, vUv - o2)) * .0702702703;
        ${final ? `
        vec3 c = acc.rgb;
        float l = dot(c, vec3(.2126, .7152, .0722));
        c = mix(vec3(l), c, 1.12);
        c *= vec3(1.03, 1.0, .96);
        vec2 q = vUv - .5; c *= 1. - dot(q, q) * .38;
        gl_FragColor = vec4(c, 1.);
        #include <tonemapping_fragment>
        #include <encodings_fragment>` : 'gl_FragColor = acc;'}
      }`;
    const mkMat = final => new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: fsBlur(final), depthTest: false, depthWrite: false, uniforms: { tSrc: { value: null }, uDir: { value: new THREE.Vector2(1, 0) }, uPx: { value: new THREE.Vector2() }, uFocus: { value: .45 }, uBand: { value: .16 }, uAmt: { value: 2.2 } } });
    const mh = mkMat(false), mv = mkMat(true);
    mv.uniforms.uDir.value.set(0, 1);
    const px = new THREE.Vector2(); mh.uniforms.uPx.value = px; mv.uniforms.uPx.value = px;
    const scene = new THREE.Scene(), quad = new THREE.Mesh(tri, mh); quad.frustumCulled = false; scene.add(quad);
    this.post = { a: mk(4), b: mk(0), quadCam, scene, quad, mh, mv, px };
  },
  // render dengan tilt-shift jika kualiti tinggi
  // turunkan kualiti secara automatik jika peranti terlalu perlahan (sekali sahaja, kecuali pemain memilih sendiri)
  perfWatch() {
    if (this.quality !== 'tinggi' || this.perfDone) return;
    const dt = Game.dt || .016;
    this.pf = this.pf || { n: 0, t: 0 };
    if (Game.fade > 0) return;
    this.pf.n++; this.pf.t += dt;
    if (this.pf.n < 120) return;
    const fps = this.pf.n / this.pf.t; this.perfDone = true;
    let locked = false; try { locked = localStorage.getItem('msp_grafik_pilih') === '1'; } catch (e) { }
    if (fps < 38 && !locked) { this.setQuality('rendah'); if (window.Cloud) Cloud.toast('Grafik ditukar ke RENDAH supaya lebih lancar. Tukar di MENU → PILIHAN → GRAFIK.', 5000); }
  },
  present(scene, cam, focus = .45, band = .16, amt = 2.2) {
    this.perfWatch();
    const P = this.post;
    if (!P || !this.hi) { this.r.setRenderTarget(null); this.r.render(scene, cam); return; }
    const r = this.r;
    r.setRenderTarget(P.a); r.render(scene, cam);
    for (const m of [P.mh, P.mv]) { m.uniforms.uFocus.value = focus; m.uniforms.uBand.value = band; m.uniforms.uAmt.value = amt; }
    P.mh.uniforms.tSrc.value = P.a.texture; P.quad.material = P.mh;
    r.setRenderTarget(P.b); r.render(P.scene, P.quadCam);
    P.mv.uniforms.tSrc.value = P.b.texture; P.quad.material = P.mv;
    r.setRenderTarget(null); r.render(P.scene, P.quadCam);
  },
  // ---------- Perpustakaan geometri & bahan (dibina sekali) ----------
  buildLibrary() {
    const C = (h) => new THREE.Color(h);
    const L = this.lib = {};
    const hi = this.hi;
    const det = hi ? 2 : 1;
    // pokok bulat berbenjol
    const canopySph = [[0, .55, 0, .52], [.3, .42, .12, .36], [-.28, .45, .1, .36], [.05, .4, -.3, .36], [.02, .88, .02, .36], [-.12, .7, .26, .3], [.2, .72, -.18, .3]];
    const cd = C('#2c6a2a'), cm = C('#3f8f36'), cl = C('#8cc94a');
    L.canopy = G3.blob(canopySph, det, .12, 5.5, (x, y, z, c) => {
      const t = Math.min(1, Math.max(0, (y - .05) / 1.1)); c.copy(cd).lerp(cm, Math.min(1, t * 1.6));
      if (t > .55) c.lerp(cl, (t - .55) * 1.4 * (.6 + .4 * Math.max(0, x * .6 - z * .4 + .5)));
    });
    L.bushG = G3.blob([[0, .3, 0, .36], [.2, .25, .08, .26], [-.2, .26, .05, .26], [0, .45, .02, .24]], det, .08, 7, (x, y, z, c) => { const t = Math.min(1, y / .7); c.copy(cd).lerp(cl, t * t); });
    L.mangrove = G3.blob(canopySph.map(s => [s[0] * 1.1, s[1] * .8, s[2] * 1.1, s[3] * 1.05]), det, .1, 5, (x, y, z, c) => { const t = Math.min(1, y / 1); c.set('#1f5a3a').lerp(C('#5aa068'), t * t); });
    const trunk = new THREE.CylinderGeometry(.09, .15, .75, 8, 1); trunk.translate(0, .375, 0);
    L.trunk = G3.paint(G3.flat(trunk), (x, y, z, c) => c.set('#7a5232').lerp(C('#a07048'), y / .75));
    L.rock = G3.blob([[0, 0, 0, .5]], hi ? 2 : 1, .22, 2.4, (x, y, z, c) => c.set('#8a8e96').lerp(C('#c4c6cc'), Math.max(0, y + .3)));
    // rumput
    L.tuft = G3.tuft(13, .36, .075, .12, '#4a9a34', '#b0e470', 1);
    L.tuft2 = G3.tuft(10, .26, .085, .14, '#58a83c', '#c4ec8c', 2);
    L.tall = G3.tuft(11, .62, .13, .14, '#2c7424', '#78c248', 3);
    L.rice = G3.tuft(9, .72, .05, .1, '#6a9a34', '#e2d46a', 4);
    L.cane = G3.tuft(6, 1.25, .07, .06, '#5a8a3a', '#a8cc5a', 5);
    L.rosette = G3.rosette(7, .2, .08, .22, '#2f7a2c', '#5cae44');
    L.flower = G3.flower(5);
    // pelepah kelapa
    const frond = G3.flat(new THREE.SphereGeometry(1, 10, 4)); frond.scale(.45, .025, .09); frond.translate(.42, 0, 0); frond.rotateZ(-.35);
    L.frond = G3.paint(frond, (x, y, z, c) => c.set('#2c7a2c').lerp(C('#6cbc4c'), Math.min(1, x / .8)));
    const pt = new THREE.CylinderGeometry(.06, .1, 1.6, 7); pt.translate(0, .8, 0);
    L.ptrunk = G3.paint(G3.flat(pt), (x, y, z, c) => c.set((Math.floor(y * 8) % 2) ? '#8a6a40' : '#9e7c4c'));
    const bm = this.libMats = {};
    bm.veg = new THREE.MeshLambertMaterial({ vertexColors: true });
    bm.grass = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    bm.std = new THREE.MeshLambertMaterial({ vertexColors: true });
    // papan tanda (tekstur kayu dengan tulisan)
    const [sc, sg] = mkCanvas(128, 80);
    sg.fillStyle = '#c28a50'; sg.fillRect(0, 0, 128, 80);
    for (let i = 0; i < 40; i++) { sg.fillStyle = `rgba(90,50,20,${.08 + hash(i, 3) * .1})`; sg.fillRect(0, hash(i, 4) * 80, 128, 1 + hash(i, 5) * 2); }
    sg.fillStyle = '#6a4020'; for (let i = 0; i < 3; i++) sg.fillRect(22, 20 + i * 16, 84 - i * 14, 5);
    sg.strokeStyle = '#7a4a22'; sg.lineWidth = 6; sg.strokeRect(3, 3, 122, 74);
    this.signTex = this.canvasTex(sc);
  },
  // ---------- Atlas tekstur tanah (8 petak berulang, 240px + jidar 8px) ----------
  makeAtlas() {
    const [ac, ag] = mkCanvas(1024, 512); ag.imageSmoothingEnabled = true;
    const P = 240;
    const cell = (i, draw) => {
      const [c, g] = mkCanvas(P, P); g.imageSmoothingEnabled = true;
      // lukis dengan balutan (tileable)
      const wrap = (fn) => { for (const dx of [-P, 0, P]) for (const dy of [-P, 0, P]) { g.save(); g.translate(dx, dy); fn(g); g.restore(); } };
      draw(g, wrap, c);
      const cx = (i % 4) * 256, cy = Math.floor(i / 4) * 256;
      ag.save(); ag.beginPath(); ag.rect(cx, cy, 256, 256); ag.clip();
      for (const dx of [-P, 0, P]) for (const dy of [-P, 0, P]) ag.drawImage(c, cx + 8 + dx, cy + 8 + dy);
      ag.restore();
    };
    const R = (i, s) => hash(i, s, 91);
    const blobs = (g, wrap, n, cols, rmin, rmax, a, seed) => {
      for (let i = 0; i < n; i++) {
        const x = R(i, seed) * P, y = R(i, seed + 1) * P, r = rmin + R(i, seed + 2) * (rmax - rmin), col = cols[i % cols.length];
        wrap(g => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.globalAlpha = 1; });
      }
    };
    const specks = (g, wrap, n, cols, smin, smax, seed) => {
      for (let i = 0; i < n; i++) { const x = R(i, seed) * P, y = R(i, seed + 1) * P, s = smin + R(i, seed + 2) * (smax - smin); g.fillStyle = cols[i % cols.length]; wrap(g => g.fillRect(x, y, s, s)); }
    };
    const pebbles = (g, wrap, n, base, hi, seed) => {
      for (let i = 0; i < n; i++) {
        const x = R(i, seed) * P, y = R(i, seed + 1) * P, rx = 1.5 + R(i, seed + 2) * 3.5, ry = rx * (.6 + R(i, seed + 3) * .3);
        wrap(g => { g.fillStyle = 'rgba(60,40,20,.25)'; g.beginPath(); g.ellipse(x + 1, y + 1.2, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = base; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 7); g.fill(); g.fillStyle = hi; g.beginPath(); g.ellipse(x - rx * .3, y - ry * .35, rx * .45, ry * .35, 0, 0, 7); g.fill(); });
      }
    };
    // 0 rumput
    cell(0, (g, wrap) => {
      g.fillStyle = '#6cb445'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 40, ['#8ccc58', '#4f9636', '#7ec052'], 20, 60, .35, 1);
      const cols = ['#5a9e38', '#78c24c', '#93d462', '#4d8f30', '#a6dc70', '#68b040'];
      g.lineCap = 'round';
      for (let i = 0; i < 2600; i++) {
        const x = R(i, 11) * P, y = R(i, 12) * P, len = 3 + R(i, 13) * 6, a = -Math.PI / 2 + (R(i, 14) - .5) * 1.1;
        g.strokeStyle = cols[i % cols.length]; g.lineWidth = 1 + R(i, 15) * 1.2;
        wrap(g => { g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len); g.stroke(); });
      }
    });
    // 1 laluan tanah
    cell(1, (g, wrap) => {
      g.fillStyle = '#dcc08a'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#e8d2a0', '#c9a870', '#d6b882'], 16, 50, .5, 21);
      specks(g, wrap, 500, ['#c4a26c', '#ecd8ac', '#b8965e'], 1, 2.4, 22);
      pebbles(g, wrap, 34, '#b9a07a', '#efe0bc', 23);
    });
    // 2 jalan tar
    cell(2, (g, wrap) => {
      g.fillStyle = '#8a929b'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 26, ['#9aa2aa', '#7a828c'], 20, 60, .4, 31);
      specks(g, wrap, 2400, ['#737b85', '#a3aab2', '#6a727c', '#b8bec4'], 1, 2, 32);
    });
    // 3 pasir
    cell(3, (g, wrap) => {
      g.fillStyle = '#f0ddaa'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#f8ecc4', '#e2cc92'], 20, 60, .5, 41);
      for (let i = 0; i < 18; i++) { const y = R(i, 42) * P; g.strokeStyle = 'rgba(190,160,100,.18)'; g.lineWidth = 2; wrap(g => { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= P; x += 20) g.lineTo(x, y + Math.sin(x / 30 + i) * 4); g.stroke(); }); }
      specks(g, wrap, 700, ['#d8c088', '#fff6d8', '#c8ae78'], 1, 2, 43);
    });
    // 4 lantai gua / tanah
    cell(4, (g, wrap) => {
      g.fillStyle = '#a4845e'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 34, ['#b89870', '#8a6c4a', '#9c7c56'], 18, 56, .5, 51);
      specks(g, wrap, 600, ['#8e7050', '#c0a078'], 1, 2.5, 52);
      pebbles(g, wrap, 26, '#8c7458', '#c8b090', 53);
    });
    // 5 lantai kayu (6 baris papan setiap 240px = 2 petak)
    cell(5, (g, wrap) => {
      const rows = 6, rh = P / rows, cols = ['#d9a866', '#cf9a58', '#e2b272', '#c88f52', '#d4a260'];
      for (let r = 0; r < rows; r++) {
        let x = -R(r, 61) * 120;
        let k = 0;
        while (x < P) {
          const len = 100 + R(r * 9 + k, 62) * 110, col = cols[(r * 3 + k) % cols.length];
          wrap(g => {
            g.fillStyle = col; g.fillRect(x, r * rh, len, rh);
            const gr = g.createLinearGradient(0, r * rh, 0, r * rh + rh); gr.addColorStop(0, 'rgba(255,240,210,.22)'); gr.addColorStop(1, 'rgba(90,50,20,.18)');
            g.fillStyle = gr; g.fillRect(x, r * rh, len, rh);
            g.strokeStyle = 'rgba(120,72,30,.22)'; g.lineWidth = 1;
            for (let q = 0; q < 5; q++) { const yy = r * rh + 5 + R(r * 17 + k * 5 + q, 63) * (rh - 10); g.beginPath(); g.moveTo(x + 4, yy); g.bezierCurveTo(x + len * .3, yy - 2, x + len * .6, yy + 2, x + len - 4, yy); g.stroke(); }
            g.fillStyle = '#8a5a2e'; g.fillRect(x + len - 2, r * rh, 2, rh);
          });
          x += len; k++;
        }
        wrap(g => { g.fillStyle = '#8a5a2e'; g.fillRect(0, r * rh + rh - 2, P, 2); g.fillStyle = 'rgba(255,235,200,.35)'; g.fillRect(0, r * rh, P, 1); });
      }
    });
    // 6 jubin (gim/bangunan)
    cell(6, (g, wrap) => {
      g.fillStyle = '#b8b2c8'; g.fillRect(0, 0, P, P);
      const n = 4, s = P / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const gr = g.createLinearGradient(x * s, y * s, x * s + s, y * s + s); gr.addColorStop(0, '#ebe8f2'); gr.addColorStop(1, '#d4d0e0');
        g.fillStyle = gr; g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      }
    });
    // 7 sawah berlumpur
    cell(7, (g, wrap) => {
      g.fillStyle = '#7d8c4c'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#6f8f82', '#8c9a58', '#5f7a60'], 20, 60, .55, 71);
      specks(g, wrap, 500, ['#6a7a40', '#a4b070'], 1, 2, 72);
    });
    const t = new THREE.CanvasTexture(ac);
    t.encoding = THREE.sRGBEncoding; t.flipY = false;
    t.anisotropy = Math.min(8, this.r.capabilities.getMaxAnisotropy());
    t.minFilter = THREE.LinearMipMapLinearFilter;
    return t;
  },
  // bahan tanah: campuran atlas mengikut peta splat (1 teksel = 1/res petak)
  groundMat(sa, sb, off, size, res = 1, jit = .55) {
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const U = { uAtlas: { value: this.atlas }, uSA: { value: sa }, uSB: { value: sb }, uOff: { value: off }, uSize: { value: size }, uRes: { value: res }, uJit: { value: jit } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = 'varying vec2 vGP;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vGP = (modelMatrix * vec4(transformed, 1.0)).xz;');
      sh.fragmentShader = `
uniform sampler2D uAtlas, uSA, uSB; uniform vec2 uOff, uSize; uniform float uRes, uJit; varying vec2 vGP;
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
  vec2 suv = ((wp + jit * uJit) * uRes + uOff) / uSize;
  vec4 A = smoothstep(.28, .72, texture2D(uSA, suv));
  vec4 B = smoothstep(.28, .72, texture2D(uSB, suv));
  float sa = dot(A, vec4(1.)), sb = dot(B, vec4(1.));
  float sg = max(0., 1. - sa - sb);
  float macro = .88 + .24 * vn(wp * .31) ;
  vec2 q = wp * .5;
  vec3 col = sg * atl(0., q) * macro * vec3(1., 1.02, .96)
    + A.r * atl(1., q) + A.g * atl(2., q) + A.b * atl(3., q) + A.a * atl(4., q)
    + B.r * atl(5., q) + B.g * atl(6., q) + B.b * atl(7., q) + B.a * atl(3., q) * vec3(.34, .52, .56);
  col /= max(sg + sa + sb, .001);
  diffuseColor.rgb *= col;
`);
    };
    mat.customProgramCacheKey = () => 'tanah';
    return mat;
  },
  splatTex(w, h, data) {
    const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return t;
  },
  // ---------- Dunia ----------
  setupWorldLights() {
    const s = this.world;
    this.hemi = new THREE.HemisphereLight(0xcde6ff, 0x6f8a44, .7); s.add(this.hemi);
    const d = new THREE.DirectionalLight(0xffe4bc, 1.7);
    d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
    const sc = d.shadow.camera; sc.left = -17; sc.right = 17; sc.top = 17; sc.bottom = -17; sc.near = 1; sc.far = 70;
    d.shadow.bias = -0.0006; d.shadow.normalBias = .03; d.shadow.radius = 3;
    s.add(d); s.add(d.target); this.sun = d;
  },
  disposeGroup(g) {
    const lib = new Set(Object.values(this.lib || {}));
    const keep = new Set([...Object.values(this.mats), ...Object.values(this.libMats || {})]);
    g.traverse(o => {
      if (o.geometry && o.geometry !== this.box && !lib.has(o.geometry) && !o.geometry.userData.shared) o.geometry.dispose();
      if (o.material) for (const m of [].concat(o.material)) { if (keep.has(m)) continue; if (m.map && m.map !== this.signTex && m.map !== this.atlas) m.map.dispose(); m.dispose(); }
    });
  },
  // saluran splat: 1 laluan, 2 tar, 3 pasir, 4 tanah gua, 5 kayu, 6 jubin, 7 sawah, 8 dasar air
  chan(ch, m, inside) {
    switch (ch) {
      case '=': return 1; case '-': return 2; case 's': return 3; case 'c': case 'X': case 'x': return 4;
      case '_': case 'e': return 5; case 'j': return 6; case 'p': return 7;
      case '~': case 'w': case 'k': case 'b': return 8;
      case 'E': return inside ? (m.under === 'j' ? 6 : 5) : 4;
      default: return 0;
    }
  },
  buildWorld(m, grid) {
    if (!this.ok) return;
    if (this.wg) { this.world.remove(this.wg); this.disposeGroup(this.wg); }
    const wg = this.wg = new THREE.Group(); this.world.add(wg);
    this.portals = [];
    const W = m.W, H = m.H, hi = this.hi;
    const inside = !m.outdoor && !m.cave;
    const M = inside ? 2 : 12;
    const border = m.border || (m.outdoor ? 'T' : 'X');
    const cell = (x, y) => (x >= 0 && y >= 0 && x < W && y < H) ? grid[y][x] : border;
    this.grid = grid; this.map = m;
    const under = m.under || (m.outdoor ? '.' : '_');
    const groundOf = ch => {
      if ('TYtFrL'.includes(ch)) return '.';
      if (ch === '^') return m.cave || !m.outdoor ? 'c' : '.';
      if (ch === 'x') return 'c';
      if (ch === 'X') return 'X';
      if (ch === '#' || 'KCQnhzog|md'.includes(ch)) return inside ? under : 'c';
      if (BUILD.has(ch) || /\d/.test(ch)) return under;
      return ch;
    };
    // --- tanah ---
    const GW = W + 2 * M, GH = H + 2 * M;
    if (this.atlas) {
      const A = new Uint8Array(GW * GH * 4), B = new Uint8Array(GW * GH * 4);
      for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) {
        const c = this.chan(groundOf(cell(x, y)), m, inside); if (!c) continue;
        const i = ((y + M) * GW + (x + M)) * 4 + ((c - 1) % 4);
        (c <= 4 ? A : B)[i] = 255;
      }
      const mat = this.groundMat(this.splatTex(GW, GH, A), this.splatTex(GW, GH, B), new THREE.Vector2(M, M), new THREE.Vector2(GW, GH), 1);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), mat);
      ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true;
      wg.add(ground);
    } else { // WebGL1: tekstur piksel lama
      const P = 16, [gc, gg] = mkCanvas(GW * P, GH * P);
      for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) drawTile(gg, groundOf(cell(x, y)), (x + M) * P, (y + M) * P, x + 99, y + 99, m.tileTheme);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshLambertMaterial({ map: this.canvasTex(gc, true) }));
      ground.rotation.x = -Math.PI / 2; ground.position.set(W / 2, 0, H / 2); ground.receiveShadow = true;
      wg.add(ground);
    }
    // --- himpunan instance (dipecah mengikut ketulan 10x10 untuk pemotongan frustum) ---
    const I = this.instBuilder(), add = I.add;
    const water = [];
    const theme = m.tileTheme;
    const bushes = this.bushes = {};
    const outdoor = !!m.outdoor;
    const dens = hi ? 1 : .5;
    const FLW = [0xffffff, 0xfff1a0, 0xffa4b4, 0xff6a5a, 0xffd24a, 0xc8b4ff];
    const tint = (x, y, s, v = .12) => { const k = 1 + (hash(x, y, s) - .5) * v; return new THREE.Color(k, k, k).getHex(); };
    const walkable = c => WALK.has(c) || /\d/.test(c) || c === '~' || c === 'w';
    const nearWalk = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if ((dx || dy) && walkable(cell(x + dx, y + dy))) return true; return false; };
    const deco = (x, y, cx, cz, extra = 0) => {
      const n = Math.round((2 + extra) * dens + hash(x, y, 30));
      for (let i = 0; i < n; i++) {
        const ox = hash(x, y, i + 20) - .5, oz = hash(x, y, i + 25) - .5, s = .8 + hash(x, y, i + 35) * .6;
        add(i % 3 === 2 ? 'tuft2' : 'tuft', cx + ox * .95, 0, cz + oz * .95, s, s, s, tint(x, y, i + 40, .25), hash(x, y, i + 45) * 6);
      }
      const hf = hash(x, y, 50);
      if (hf < .1 * (hi ? 1 : .6)) { const nf = 1 + Math.floor(hash(x, y, 51) * 3); for (let i = 0; i < nf; i++) add('flower', cx + (hash(x, y, 52 + i) - .5) * .8, 0, cz + (hash(x, y, 55 + i) - .5) * .8, 1, .8 + hash(x, y, 58 + i) * .5, 1, FLW[Math.floor(hash(x, y, 60 + i) * FLW.length)], hash(x, y, 61 + i) * 6); }
      if (hash(x, y, 70) < .07) add('rosette', cx + (hash(x, y, 71) - .5) * .7, .01, cz + (hash(x, y, 72) - .5) * .7, 1, 1, 1, 0xffffff, hash(x, y, 73) * 6);
    };
    for (let y = -M; y < H + M; y++) for (let x = -M; x < W + M; x++) {
      const ch = cell(x, y), h = hash(x + 50, y + 50), cx = x + .5, cz = y + .5;
      const inMap = x >= 0 && y >= 0 && x < W && y < H;
      switch (ch) {
        case '.': if (outdoor) deco(x, y, cx, cz); break;
        case 'f': if (outdoor) {
          deco(x, y, cx, cz, -1);
          for (let i = 0; i < 5; i++) add('flower', cx + (hash(x, y, i + 90) - .5) * .85, 0, cz + (hash(x, y, i + 95) - .5) * .85, 1.1, .9 + hash(x, y, i + 99) * .5, 1.1, FLW[Math.floor(hash(x, y, i + 101) * FLW.length)], hash(x, y, i) * 6);
          add('rosette', cx, .01, cz, 1.2, 1, 1.2, 0xffffff, h * 6);
        } break;
        case 'T': {
          const s = nearWalk(x, y) ? .76 + h * .07 : .9 + h * .4;
          if (theme === 'bakau') {
            add('trunk', cx, 0, cz, 1.1, .9, 1.1, 0xb0a090);
            add('root', cx - .2, .15, cz, .5, .5, .5, 0x4a3420, h * 3, .6); add('root', cx + .2, .15, cz, .5, .5, .5, 0x4a3420, h * 3 + 2, -.6);
            add('mangrove', cx, .5, cz, s, s * .85, s, tint(x, y, 3), h * 6);
          } else {
            add('trunk', cx, 0, cz, 1, .8 + h * .3, 1, 0xffffff, h * 6);
            add('canopy', cx, .45 + h * .15, cz, s, s * (.95 + hash(x, y, 4) * .15), s, tint(x, y, 3, .18), h * 6);
          }
          if (outdoor && inMap) deco(x, y, cx, cz, -1);
          break;
        }
        case 'Y': {
          add('ptrunk', cx, 0, cz, 1, 1, 1, 0xffffff, 0, (h - .5) * .12);
          for (let i = 0; i < 7; i++) add('frond', cx, 1.55, cz, 1, 1, 1, tint(x, y, i, .2), i / 7 * Math.PI * 2 + h * 3);
          if (outdoor) deco(x, y, cx, cz, -1);
          break;
        }
        case 't': {
          const hd = add('bush', cx, 0, cz, 1.05, 1.15, 1.05, tint(x, y, 5), h * 5);
          if (inMap) bushes[x + ',' + y] = [hd];
          break;
        }
        case 'r': add('rock', cx, .25, cz, .9, .7, .85, 0xffffff, h * 6); if (outdoor) deco(x, y, cx, cz, -1); break;
        case '^': case 'x': {
          const cave = ch === 'x' || m.cave || !outdoor;
          const wall = c => c === 'x' || c === '^' || c === 'X';
          const edge = !wall(cell(x - 1, y)) || !wall(cell(x + 1, y)) || !wall(cell(x, y - 1)) || !wall(cell(x, y + 1));
          const hh = (ch === 'x' ? (inside ? 1.6 : 1.5) : 1.1) + hash(x, y, 9) * (edge ? .3 : .15);
          const c1 = cave ? (edge ? (h < .5 ? 0x7e6046 : 0x8a6a4e) : (h < .5 ? 0x4e3a2a : 0x56402e)) : (edge ? (h < .5 ? 0xb4a284 : 0xc2b090) : 0x9a8a6e);
          add('cube', cx, hh / 2, cz, 1.01, hh, 1.01, c1);
          if (edge) {
            add('rock', cx + (h - .5) * .2, hh - .06, cz + (hash(x, y, 4) - .5) * .2, 1.05, .32, 1.05, cave ? 0xb08a66 : 0xe0d6c4, h * 6);
          }
          break;
        }
        case 'X': add('cube', cx, .8, cz, 1, 1.6, 1, 0x07080c); break;
        case '#': {
          const low = y >= H - 1, hh = low ? .45 : 1.25;
          add('cube', cx, hh / 2, cz, 1, hh, 1, 0xf2ece0);
          add('cube', cx, hh + .04, cz, 1.04, .08, 1.04, 0xb07a44);
          add('cube', cx, .07, cz, 1.03, .14, 1.03, 0x9a6a3a);
          if (!low && (x + y) % 3 === 0) add('cube', cx, hh / 2 + .05, cz, .22, hh + .12, 1.08, 0xb98452);
          break;
        }
        case 'F': add('cube', cx - .4, .32, cz, .1, .64, .1, 0xa27248); add('cube', cx + .4, .32, cz, .1, .64, .1, 0xa27248); add('cube', cx, .46, cz, 1, .07, .06, 0xcf9e6c); add('cube', cx, .26, cz, 1, .07, .06, 0xcf9e6c); if (outdoor) deco(x, y, cx, cz, -1); break;
        case ',': {
          for (let i = 0; i < 4; i++) {
            const ox = (i % 2 - .5) * .5 + (hash(x, y, i) - .5) * .18, oz = (Math.floor(i / 2) - .5) * .5 + (hash(x, y, i + 9) - .5) * .18, s = .85 + hash(x, y, i + 3) * .35;
            add('tall', cx + ox, 0, cz + oz, s, s, s, tint(x, y, i + 6, .2), hash(x, y, i + 5) * 6);
          }
          break;
        }
        case 'p': {
          const tebu = theme === 'tebu';
          for (let i = 0; i < 4; i++) {
            const ox = (i % 2 - .5) * .5 + (hash(x, y, i) - .5) * .12, oz = (Math.floor(i / 2) - .5) * .5 + (hash(x, y, i + 9) - .5) * .12;
            add(tebu ? 'cane' : 'rice', cx + ox, 0, cz + oz, 1, .9 + hash(x, y, i + 3) * .25, 1, tint(x, y, i, .15), hash(x, y, i + 5) * 6);
          }
          break;
        }
        case 'L': {
          add('cube', cx, .15, cz + .28, 1.02, .3, .44, 0x9a6a3a);
          add('cube', cx, .31, cz + .25, 1.04, .05, .5, 0x6aae44);
          if (outdoor) deco(x, y, cx, cz - .2, -1);
          break;
        }
        case 'b': add('cube', cx, .06, cz, 1, .1, 1, 0xb07c4a); add('cube', cx - .47, .26, cz, .07, .34, 1, 0x7a4a26); add('cube', cx + .47, .26, cz, .07, .34, 1, 0x7a4a26); water.push([x, y]); break;
        case 'k': add('cube', cx, .06, cz, 1, .1, 1, 0xbf8f5c); add('cube', cx - .45, -.2, cz - .4, .1, .6, .1, 0x6a4a2a); add('cube', cx + .45, -.2, cz + .4, .1, .6, .1, 0x6a4a2a); water.push([x, y]); break;
        case '~': case 'w': water.push([x, y]); break;
        case 'K': add('cube', cx, .42, cz, .98, .08, .92, 0xb07a44); for (const [a, b] of [[-.4, -.36], [.4, -.36], [-.4, .36], [.4, .36]]) add('cube', cx + a, .2, cz + b, .08, .4, .08, 0x7a4e2a); break;
        case 'C': add('cube', cx, .46, cz, 1, .92, .8, 0x7c8cb0); add('cube', cx, .95, cz, 1.04, .07, .88, 0xd6e0ee); break;
        case 'Q': {
          add('cube', cx, .9, cz - .18, .98, 1.8, .5, 0x8a5a30);
          add('cube', cx, .9, cz - .1, .88, 1.66, .36, 0x5a3818);
          const BK = [0xd84848, 0x4a7ad8, 0x48a858, 0xe8c040, 0x9a5ac8, 0x3ab0b0, 0xe07a30];
          for (let r = 0; r < 3; r++) {
            add('cube', cx, .2 + r * .55, cz - .08, .9, .04, .4, 0x8a5a30);
            let bx = cx - .4;
            for (let b = 0; bx < cx + .38; b++) { const bw = .07 + hash(x * 7 + b, y * 5 + r) * .05, bh = .26 + hash(x + b, y + r, 3) * .16; add('cube', bx + bw / 2, .22 + r * .55 + bh / 2, cz - .04, bw - .01, bh, .3, BK[Math.floor(hash(x * 3 + b, y + r * 11) * BK.length)]); bx += bw; }
          }
          break;
        }
        case 'n': add('cube', cx, .38, cz, .9, .76, .7, 0xb07a44); add('cube', cx, .9, cz - .1, .62, .44, .08, 0x505868); add('screen', cx, .9, cz - .05, .52, .34, .04, 0x7fd0f4); add('cube', cx, .8, cz + .15, .5, .03, .22, 0x9098a8); break;
        case 'h': add('cube', cx, .5, cz, .95, 1, .8, 0xf0a0a8); add('cube', cx, 1.02, cz, .72, .06, .52, 0xfff4f6); for (let i = 0; i < 3; i++) add('ball', cx - .26 + i * .26, 1.1, cz, .18, .18, .18, 0xe04848); break;
        case 'z': add('cube', cx, .22, cz, .9, .44, .98, 0x8a5a30); add('cube', cx, .46, cz + .05, .84, .1, .86, 0x6a90e0); add('cube', cx, .52, cz - .32, .6, .12, .26, 0xfafafa); break;
        case 'o': add('pot', cx, .2, cz, .42, .4, .42, 0xc47a44); add('bush', cx, .36, cz, .75, .9, .75, 0xffffff, h * 6); break;
        case 'g': add('cube', cx, .15, cz, .8, .3, .8, 0x707080); add('cube', cx, .75, cz, .45, .9, .45, 0xa8a8b8); add('ball', cx, 1.35, cz, .45, .45, .45, 0xe04848); break;
        case '|': add('cube', cx - .35, .45, cz, .1, .9, .1, 0x606878); add('cube', cx + .35, .45, cz, .1, .9, .1, 0x606878); add('cube', cx, .6, cz, 1, .1, .06, 0xe8c048); break;
        case 'm': add('cube', cx, .55, cz, .92, 1.1, .92, 0x8a949e); add('screen', cx - .2, .8, cz + .47, .25, .2, .04, 0xe8c048); add('screen', cx + .2, .8, cz + .47, .25, .2, .04, 0x48e070); break;
        case 'd': add('cube', cx, .4, cz, .86, .8, .86, 0xb07838); add('cube', cx, .4, cz, .9, .12, .9, 0x8a5a28); add('cube', cx, .4, cz, .12, .82, .9, 0x8a5a28); break;
        case 'e': add('cube', cx, .012, cz, 1, .02, 1, 0xc84a4a); break;
        case 'E': if (inside) add('cube', cx, .012, cz, .86, .02, .62, 0xd24a44); break;
        case 'c': if (!inside && hash(x, y, 7) < .05) { const s = .15 + hash(x, y, 8) * .2; add('rock', cx + (h - .5) * .5, s * .3, cz, s * 1.3, s, s, 0xc4a080, h * 6); } break;
        case 's': if (outdoor && hash(x, y, 7) < .03) add('rock', cx, .05, cz, .2, .12, .16, 0xf0e8e0, h * 6); break;
      }
    }
    // tangga/pintu
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = grid[y][x];
      if (!/\d/.test(ch)) continue;
      const d = (m.doors || {})[ch] || {};
      const above = y > 0 ? grid[y - 1][x] : '';
      if (BUILD.has(above)) continue;
      const look = d.look || (m.outdoor ? 'gua' : 'tangga');
      if (look === 'tangga') for (let i = 0; i < 4; i++) add('cube', x + .5, .06 + i * .12, y + .2 + i * .18, .9, .12 + i * .24, .2, 0xc8a878);
      else if (look === 'gua') { add('rock', x + .5, .8, y + .15, 1, 1.8, .6, 0xb09070); add('cube', x + .5, .5, y + .42, .66, 1, .06, 0x0a0806); }
      else if (look === 'kapal') { add('cube', x + .5, .6, y + .1, 1, 1.2, .2, 0xe8e8e8); add('cube', x + .5, .5, y + .2, .6, .9, .1, 0x3a4a6a); }
      else if (look === 'portal') {
        const pg = new THREE.Group();
        const ring = new THREE.Mesh(new THREE.TorusGeometry(.48, .07, 10, 32), new THREE.MeshLambertMaterial({ color: 0xf3c85a, emissive: 0x8a5a10 }));
        const core = new THREE.Mesh(new THREE.CircleGeometry(.44, 28), new THREE.MeshBasicMaterial({ color: 0xb088ff, transparent: true, opacity: .75, side: THREE.DoubleSide }));
        const pad = new THREE.Mesh(new THREE.RingGeometry(.2, .5, 24), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .45, side: THREE.DoubleSide }));
        ring.position.y = core.position.y = .62; pad.rotation.x = -Math.PI / 2; pad.position.y = .03;
        pg.add(ring, core, pad); pg.position.set(x + .5, 0, y + .5);
        pg.userData.core = core; wg.add(pg); this.portals.push(pg);
      }
    }
    this.inst = I.build(wg);
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
      const wm = new THREE.Mesh(g, new THREE.MeshPhongMaterial({ color: 0x2f8ed8, transparent: true, opacity: .74, shininess: 110, specular: 0xe8f6ff }));
      wm.position.y = .02; wm.receiveShadow = true; wg.add(wm);
      this.water = { mesh: wm, base: Float32Array.from(pos) };
    }
    // --- bangunan ---
    this.buildBuildings(m, grid, wg);
    // --- langit, kabus & cahaya ---
    const night = m.theme === 'malam';
    const sky = m.sky ? m.sky : outdoor ? (night ? ['#101830', '#2a3460', '#40486a'] : ['#7ec0f4', '#cfe8f8', '#f4f0dc'])
      : m.cave ? ['#0a0806', '#1a140e', '#2a2016'] : ['#07070a', '#0c0c10', '#101014'];
    this.world.background = this.skyTex(...sky);
    this.world.fog = outdoor ? new THREE.Fog(new THREE.Color(sky[1]).getHex(), 26, 60) : m.sky ? new THREE.Fog(new THREE.Color(sky[0]).getHex(), 12, 30) : m.cave ? new THREE.Fog(0x120e0a, 10, 26) : null;
    this.hemi.intensity = outdoor ? (night ? .35 : .55) : m.sky ? .6 : m.cave ? .45 : .7;
    this.hemi.color.set(outdoor ? (night ? 0x8090c8 : 0xcde6ff) : 0xfff0d8);
    this.hemi.groundColor.set(outdoor ? 0x6f8a44 : 0x8a6a48);
    this.sun.intensity = outdoor ? (night ? .45 : 1.3) : m.cave ? .7 : .95;
    this.sun.color.set(night ? 0x9ab0ff : 0xffe4bc);
    this.inside = inside;
    // --- entiti: buang model dari peta sebelumnya (NPC, bola item, pemain, basikal) ---
    for (const e of (this.ents || new Map()).values()) this.world.remove(e);
    for (const k of ['player', 'bike', 'surfMon']) if (this[k]) { this.world.remove(this[k]); this[k] = null; }
    this.ents = new Map();
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
      H: { wall: '#d09a60', roof: '#b04a3c', wh: 1.4 }, P: { wall: '#f6f2ea', roof: '#e25a50', wh: 1.75 }, M: { wall: '#f6f2ea', roof: '#4a80d8', wh: 1.6 },
      G: { wall: '#e2dcf0', roof: '#8a64bc', wh: 2.1 }, B: { wall: '#eef0f3', roof: '#a4aab4', wh: 2.3 + Math.max(0, h - 4) * .75 }, W: { wall: '#c2ccd4', roof: '#8a98a4', wh: 1.9 },
      R: { wall: '#ece2c8', roof: '#6a8a5a', wh: 2.1 }
    }[ch];
    const d = h - .3, wh = spec.wh;
    // tekstur hadapan (64px setiap petak)
    const TP = 64;
    const [fc, fg] = mkCanvas(w * TP, Math.ceil(wh * TP)); fg.imageSmoothingEnabled = true;
    const FW = fc.width, FH = fc.height;
    const gr = fg.createLinearGradient(0, 0, 0, FH); gr.addColorStop(0, shade(spec.wall, .06)); gr.addColorStop(1, shade(spec.wall, -.08));
    fg.fillStyle = gr; fg.fillRect(0, 0, FW, FH);
    if (ch === 'H') { for (let i = 0; i < FH; i += 11) { fg.fillStyle = 'rgba(90,50,20,.22)'; fg.fillRect(0, i, FW, 2); fg.fillStyle = 'rgba(255,230,190,.18)'; fg.fillRect(0, i + 2, FW, 1); } }
    if (ch === 'W') { fg.fillStyle = shade(spec.wall, -.12); for (let i = 4; i < FW; i += 9) fg.fillRect(i, 0, 2, FH); }
    fg.fillStyle = shade(spec.wall, -.3); fg.fillRect(0, FH - 7, FW, 7);
    const glass = (wx, wy, ww, wh2, frame = '#fafcff') => {
      fg.fillStyle = 'rgba(40,50,70,.25)'; fg.fillRect(wx + 2, wy + 3, ww, wh2);
      fg.fillStyle = frame; fg.fillRect(wx - 3, wy - 3, ww + 6, wh2 + 6);
      const gg = fg.createLinearGradient(wx, wy, wx + ww, wy + wh2); gg.addColorStop(0, '#9ed2fa'); gg.addColorStop(.5, '#4f8fe0'); gg.addColorStop(1, '#3a6fc4');
      fg.fillStyle = gg; fg.fillRect(wx, wy, ww, wh2);
      fg.fillStyle = 'rgba(255,255,255,.55)'; fg.beginPath(); fg.moveTo(wx + ww * .15, wy + wh2); fg.lineTo(wx + ww * .45, wy); fg.lineTo(wx + ww * .6, wy); fg.lineTo(wx + ww * .3, wy + wh2); fg.fill();
    };
    if (ch === 'B') {
      const rows = Math.max(2, Math.floor((FH - 70) / 44));
      for (let r = 0; r < rows; r++) for (let c = 0; c < w * 2; c++) { const wx = 12 + c * (FW - 20) / (w * 2), wy = 14 + r * 44; if (wy + 30 > FH - 66) continue; glass(wx, wy, 20, 24); }
    }
    for (let i = 0; i < w; i++) {
      const cx = i * TP;
      if (doors.includes(i)) {
        if (ch === 'B' || ch === 'P' || ch === 'M' || ch === 'G') { // pintu kaca berkembar
          fg.fillStyle = '#c8ccd4'; fg.fillRect(cx + 6, FH - 62, 52, 62);
          glass(cx + 10, FH - 56, 21, 54, '#e8ecf2'); glass(cx + 33, FH - 56, 21, 54, '#e8ecf2');
        } else {
          const dc = ch === 'W' ? '#606a74' : '#7a4a26';
          fg.fillStyle = shade(dc, -.4); fg.fillRect(cx + 12, FH - 58, 40, 58);
          fg.fillStyle = dc; fg.fillRect(cx + 15, FH - 55, 34, 55);
          fg.fillStyle = shade(dc, .15); fg.fillRect(cx + 19, FH - 50, 11, 18); fg.fillRect(cx + 34, FH - 50, 11, 18);
          fg.fillStyle = '#f0c850'; fg.beginPath(); fg.arc(cx + 43, FH - 26, 3, 0, 7); fg.fill();
        }
      } else if (ch !== 'B' && ch !== 'W' && (i % 2 === 1 || w <= 3)) {
        glass(cx + 14, FH - 54, 36, 28, ch === 'H' ? '#f4e8d4' : '#ffffff');
        if (ch === 'H') { fg.fillStyle = '#6a8a3a'; fg.fillRect(cx + 5, FH - 57, 7, 34); fg.fillRect(cx + 52, FH - 57, 7, 34); }
      }
    }
    const sign = (bg, fgc, label) => {
      const sw = Math.min(FW - 12, 150), sx = (FW - sw) / 2, sy = 8;
      fg.fillStyle = 'rgba(0,0,0,.25)'; fg.fillRect(sx + 3, sy + 4, sw, 36);
      fg.fillStyle = bg; fg.fillRect(sx, sy, sw, 36);
      fg.fillStyle = fgc; fg.font = 'bold 24px sans-serif'; fg.textAlign = 'center'; fg.textBaseline = 'middle'; fg.fillText(label, FW / 2, sy + 19);
    };
    if (ch === 'P') sign('#fff', '#e03838', '✚ KLINIK');
    if (ch === 'M') sign('#2f5fc0', '#fff', 'KEDAI');
    if (ch === 'G') sign('#f0c848', '#40206a', 'GIM');
    const ftex = this.canvasTex(fc);
    const side = new THREE.MeshLambertMaterial({ color: shade(spec.wall, -.05) });
    const mats = [side, side, bm(spec.roof), side, new THREE.MeshLambertMaterial({ map: ftex }), side];
    const body = new THREE.Mesh(new THREE.BoxGeometry(w - .06, wh, d), mats);
    body.position.set(x + w / 2, wh / 2, y + d / 2); body.castShadow = body.receiveShadow = true;
    g.add(body);
    // tapak & anak tangga di hadapan pintu
    const base = new THREE.Mesh(this.box, bm(shade(spec.wall, -.25))); base.scale.set(w + .04, .1, d + .04); base.position.set(x + w / 2, .05, y + d / 2); base.receiveShadow = true; g.add(base);
    for (const i of doors) {
      const st = new THREE.Mesh(this.box, bm('#c8c4bc')); st.scale.set(.86, .08, .3); st.position.set(x + i + .5, .04, y + d + .13); st.receiveShadow = st.castShadow = true; g.add(st);
    }
    if (ch === 'B' || ch === 'W') { // bumbung rata dengan tembok pengadang
      const top = new THREE.Mesh(this.box, bm(spec.roof)); top.scale.set(w - .1, .06, d - .04); top.position.set(x + w / 2, wh + .03, y + d / 2); top.receiveShadow = true; g.add(top);
      const rim = bm(shade(spec.wall, .02));
      for (const [sx, sz, px, pz] of [[w - .02, .14, 0, -d / 2 + .07], [w - .02, .14, 0, d / 2 - .07], [.14, d, -w / 2 + .06, 0], [.14, d, w / 2 - .06, 0]]) {
        const r = new THREE.Mesh(this.box, rim); r.scale.set(sx, .22, sz); r.position.set(x + w / 2 + px, wh + .11, y + d / 2 + pz); r.castShadow = true; g.add(r);
      }
      const trim = new THREE.Mesh(this.box, bm('#9aa0aa')); trim.scale.set(w - .02, .06, .04); trim.position.set(x + w / 2, wh - .02, y + d + .005); g.add(trim);
      if (ch === 'W') for (let i = 0; i < Math.max(1, w / 3); i++) { const ac = new THREE.Mesh(this.box, bm('#c8ccd4')); ac.scale.set(.5, .35, .5); ac.position.set(x + .8 + i * 3, wh + .35, y + d / 2 - .4 + (i % 2) * .6); ac.castShadow = true; g.add(ac); }
    } else {
      const rh = ch === 'H' ? .6 + d * .3 : .45 + d * .22;
      const ov = .2, Lr = w + ov * 2, D = d + ov * 2;
      const shape = new THREE.Shape(); shape.moveTo(-D / 2, 0); shape.lineTo(D / 2, 0); shape.lineTo(0, rh); shape.lineTo(-D / 2, 0);
      const rg = new THREE.ExtrudeGeometry(shape, { depth: Lr, bevelEnabled: false });
      rg.rotateY(Math.PI / 2); rg.translate(-Lr / 2, 0, 0);
      const roof = new THREE.Mesh(rg, new THREE.MeshLambertMaterial({ color: spec.roof, flatShading: true }));
      roof.position.set(x + w / 2, wh, y + d / 2); roof.castShadow = true; roof.receiveShadow = true;
      g.add(roof);
      const eave = new THREE.Mesh(this.box, bm(shade(spec.roof, -.3))); eave.scale.set(Lr, .06, .06); eave.position.set(x + w / 2, wh + .01, y + d / 2 + D / 2); g.add(eave);
      if (ch === 'H') for (const px of [x + .15, x + w - .15]) { const p = new THREE.Mesh(this.box, bm('#6a4a2a')); p.scale.set(.12, .3, .12); p.position.set(px, .15, y + d + .02); g.add(p); }
    }
    return g;
  },
  cutBush(x, y) {
    if (!this.ok || !this.bushes) return;
    const b = this.bushes[x + ',' + y]; if (!b) return;
    const mtx = new THREE.Matrix4().makeScale(0, 0, 0);
    for (const [k, i] of b) { const m = this.inst[k]; if (m) { m.setMatrixAt(i, mtx); m.instanceMatrix.needsUpdate = true; } }
  },
  // ---------- Watak chibi ----------
  human(lookName) {
    const L = LOOKS[lookName] || LOOKS.budak;
    const player = /^(pemain|kostum)/.test(lookName);
    const g = new THREE.Group(); const body = new THREE.Group(); g.add(body);
    const G = this.hgeo || (this.hgeo = {
      head: new THREE.SphereGeometry(.27, 24, 18), hair: new THREE.SphereGeometry(.29, 24, 14, 0, Math.PI * 2, 0, Math.PI * .56),
      cap: new THREE.SphereGeometry(.3, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2), brim: new THREE.CylinderGeometry(.2, .2, .035, 20),
      eye: new THREE.SphereGeometry(.036, 10, 8), torso: new THREE.CapsuleGeometry(.16, .14, 6, 14), limb: new THREE.CapsuleGeometry(.055, .15, 4, 10),
      leg: new THREE.CapsuleGeometry(.07, .12, 4, 10), shoe: new THREE.SphereGeometry(.08, 12, 8), hand: new THREE.SphereGeometry(.055, 10, 8),
      pack: new THREE.CapsuleGeometry(.12, .1, 4, 12), veil: new THREE.ConeGeometry(.3, .34, 20, 1, true),
    });
    const part = (geo, col, x, y, z, parent = body, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, this.smat(col)); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; parent.add(m); return m; };
    const leg = (x) => { const p = new THREE.Group(); p.position.set(x, .3, 0); body.add(p); part(G.leg, L.p, 0, -.12, 0, p); part(G.shoe, '#3a2e28', 0, -.25, .03, p, 1, .7, 1.35); return p; };
    const arm = (x) => { const p = new THREE.Group(); p.position.set(x, .6, 0); body.add(p); part(G.limb, L.c, 0, -.1, 0, p); part(G.hand, L.s, 0, -.22, 0, p); p.rotation.z = x < 0 ? -.12 : .12; return p; };
    const lL = leg(-.085), lR = leg(.085);
    part(G.torso, L.c, 0, .5, 0, body, 1, 1, .85);
    const aL = arm(-.2), aR = arm(.2);
    if (player) { part(G.pack, '#3a6ad4', 0, .52, -.16, body, 1.05, 1, .6); part(this.box, '#2a4ea8', -.09, .55, -.03, body, .03, .3, .3); part(this.box, '#2a4ea8', .09, .55, -.03, body, .03, .3, .3); }
    const head = new THREE.Group(); head.position.set(0, .93, 0); body.add(head);
    part(G.head, L.s, 0, 0, 0, head);
    part(G.eye, '#1a1a22', -.095, .0, .235, head, .8, 1.25, .6); part(G.eye, '#1a1a22', .095, .0, .235, head, .8, 1.25, .6);
    part(G.eye, '#ffffff', -.085, .02, .258, head, .25, .3, .2); part(G.eye, '#ffffff', .105, .02, .258, head, .25, .3, .2);
    if (L.hij) {
      part(G.hair, L.hij, 0, .01, -.01, head, 1.06, 1.08, 1.06).rotation.x = -.5;
      const v = part(G.veil, L.hij, 0, -.2, -.02, head); v.material = this.smat(L.hij); v.material.side = THREE.DoubleSide;
    } else {
      const hr = part(G.hair, L.h, 0, .02, -.01, head); hr.rotation.x = -.42;
      if (L.hat) { part(G.cap, L.hat, 0, .05, -.01, head).rotation.x = -.12; part(G.brim, L.hat, 0, .07, .24, head, 1, 1, .95).rotation.x = .1; part(G.eye, '#ffffff', 0, .2, .25, head, 1.3, 1.1, .5); }
    }
    g.userData = { lL, lR, aL, aR, body, head, phase: 0 };
    return g;
  },
  poseHuman(g, dir, moving, dt, speed = 1) {
    const u = g.userData;
    g.rotation.y = { down: 0, up: Math.PI, left: -Math.PI / 2, right: Math.PI / 2 }[dir] || 0;
    if (moving) u.phase += dt * 12 * speed; else u.phase = 0;
    const s = Math.sin(u.phase) * (moving ? .8 : 0);
    u.lL.rotation.x = s; u.lR.rotation.x = -s; u.aL.rotation.x = -s * .9; u.aR.rotation.x = s * .9;
    u.body.position.y = moving ? Math.abs(Math.sin(u.phase)) * .05 : Math.sin(Game.t * 2 + g.id) * .006;
    if (u.head) u.head.rotation.z = moving ? Math.sin(u.phase) * .05 : 0;
  },
  // ---------- Monsta plush (dikembungkan daripada sprite) ----------
  plushCache: {},
  plushGeo(name) {
    if (this.plushCache[name]) return this.plushCache[name];
    const src = monstaSprite(name), S0 = 64, K = 2, N = S0 * K;
    const d0 = src.getContext('2d').getImageData(0, 0, S0, S0).data;
    // naikkan resolusi 2x dengan interpolasi bilinear (tepi licin)
    const al = new Float32Array(N * N), col = new Float32Array(N * N * 3);
    const px0 = (x, y) => { x = Math.max(0, Math.min(S0 - 1, x)); y = Math.max(0, Math.min(S0 - 1, y)); return (y * S0 + x) * 4; };
    for (let Y = 0; Y < N; Y++) for (let X = 0; X < N; X++) {
      const sx = (X + .5) / K - .5, sy = (Y + .5) / K - .5, x0 = Math.floor(sx), y0 = Math.floor(sy), fx = sx - x0, fy = sy - y0;
      let a = 0, r = 0, g = 0, b = 0, wsum = 0;
      for (const [dx, dy, w] of [[0, 0, (1 - fx) * (1 - fy)], [1, 0, fx * (1 - fy)], [0, 1, (1 - fx) * fy], [1, 1, fx * fy]]) {
        const inb = x0 + dx >= 0 && y0 + dy >= 0 && x0 + dx < S0 && y0 + dy < S0;
        const i = px0(x0 + dx, y0 + dy), aa = inb && d0[i + 3] > 10 ? 1 : 0;
        a += aa * w; if (aa) { r += d0[i] * w; g += d0[i + 1] * w; b += d0[i + 2] * w; wsum += w; }
      }
      const k = Y * N + X; al[k] = a;
      if (wsum) { col[k * 3] = r / wsum / 255; col[k * 3 + 1] = g / wsum / 255; col[k * 3 + 2] = b / wsum / 255; }
    }
    const on = (x, y) => x >= 0 && y >= 0 && x < N && y < N && al[y * N + x] > .5;
    // jarak chamfer ke tepi
    const INF = 1e4, dist = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) dist[y * N + x] = on(x, y) ? INF : 0;
    const D = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : dist[y * N + x];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!dist[i]) continue; dist[i] = Math.min(dist[i], D(x - 1, y) + 1, D(x, y - 1) + 1, D(x - 1, y - 1) + 1.414, D(x + 1, y - 1) + 1.414); }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (!dist[i]) continue; dist[i] = Math.min(dist[i], D(x + 1, y) + 1, D(x, y + 1) + 1, D(x + 1, y + 1) + 1.414, D(x - 1, y + 1) + 1.414); }
    // buang garis luar gelap supaya kelihatan seperti anak patung kain
    const lum = i => col[i * 3] * .3 + col[i * 3 + 1] * .59 + col[i * 3 + 2] * .11;
    for (let pass = 0; pass < 4; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const i = y * N + x; if (!on(x, y) || dist[i] > 3.2 || lum(i) > .3) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const j = (y + dy) * N + x + dx; if (on(x + dx, y + dy) && dist[j] > dist[i] && lum(j) > .3) { r += col[j * 3]; g += col[j * 3 + 1]; b += col[j * 3 + 2]; n++; } }
      if (n) { col[i * 3] = r / n; col[i * 3 + 1] = g / n; col[i * 3 + 2] = b / n; }
    }
    // tinggi bulat (profil bulatan), dilicinkan
    const R = 7.5 * K; let hp = new Float32Array(N * N);
    for (let i = 0; i < N * N; i++) { if (!dist[i]) continue; const t = Math.min(dist[i], R); hp[i] = Math.sqrt(Math.max(0, t * (2 * R - t))) * .9 + .6; }
    for (let it = 0; it < 7; it++) { const o = new Float32Array(N * N); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!dist[i]) continue; let s = 0, n = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (on(x + dx, y + dy)) { s += hp[(y + dy) * N + x + dx]; n++; } o[i] = s / n; } hp = o; }
    let maxY = 0; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (on(x, y)) maxY = Math.max(maxY, y);
    // bucu di sudut piksel, depan & belakang
    const V = N + 1, vid = new Int32Array(V * V).fill(-1);
    const pos = [], clr = [], rimF = [], idx = [];
    const c = new THREE.Color();
    for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
      let n = 0, s = 0, rim = false, r = 0, gg = 0, b = 0;
      for (const [dx, dy] of [[-1, -1], [0, -1], [-1, 0], [0, 0]]) { const x = i + dx, y = j + dy; if (on(x, y)) { const k = y * N + x; n++; s += hp[k]; r += col[k * 3]; gg += col[k * 3 + 1]; b += col[k * 3 + 2]; } else rim = true; }
      if (!n) continue;
      const z = rim ? 0 : s / n;
      c.setRGB(r / n, gg / n, b / n).convertSRGBToLinear();
      vid[j * V + i] = pos.length / 3;
      pos.push(i, j, z, i, j, -z);
      clr.push(c.r, c.g, c.b, c.r * .9, c.g * .9, c.b * .9);
      rimF.push(rim ? 1 : 0);
    }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (!on(x, y)) continue;
      const a = vid[y * V + x], b = vid[y * V + x + 1], cc = vid[(y + 1) * V + x + 1], dd = vid[(y + 1) * V + x];
      idx.push(a, dd, cc, a, cc, b);
      idx.push(a + 1, cc + 1, dd + 1, a + 1, b + 1, cc + 1);
    }
    // licinkan permukaan (Laplacian): garis bentuk dilicinkan dalam xy, permukaan dalam xyz
    const nv = pos.length / 6;
    const nb = []; for (let k = 0; k < nv; k++) nb.push([]);
    for (let j = 0; j < V; j++) for (let i = 0; i < V; i++) {
      const v = vid[j * V + i]; if (v < 0) continue; const k = v / 2;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) { const ii = i + dx, jj = j + dy; if (ii < 0 || jj < 0 || ii >= V || jj >= V) continue; const u = vid[jj * V + ii]; if (u < 0) continue; if (rimF[k] && !rimF[u / 2]) continue; nb[k].push(u / 2); }
    }
    for (let it = 0; it < 14; it++) {
      const nx = new Float32Array(nv), ny = new Float32Array(nv), nz = new Float32Array(nv);
      for (let k = 0; k < nv; k++) {
        const L = nb[k]; let sx = 0, sy = 0, sz = 0;
        for (const u of L) { sx += pos[u * 6]; sy += pos[u * 6 + 1]; sz += pos[u * 6 + 2]; }
        const n = L.length, w = .5;
        nx[k] = n ? pos[k * 6] * (1 - w) + sx / n * w : pos[k * 6];
        ny[k] = n ? pos[k * 6 + 1] * (1 - w) + sy / n * w : pos[k * 6 + 1];
        nz[k] = rimF[k] || !n ? pos[k * 6 + 2] : pos[k * 6 + 2] * (1 - w) + sz / n * w;
      }
      for (let k = 0; k < nv; k++) { pos[k * 6] = pos[k * 6 + 3] = nx[k]; pos[k * 6 + 1] = pos[k * 6 + 4] = ny[k]; pos[k * 6 + 2] = nz[k]; pos[k * 6 + 5] = -nz[k]; }
    }
    const sc = 1 / (32 * K), zs = sc * 1.15;
    const P = new Float32Array(pos.length);
    for (let k = 0; k < pos.length; k += 3) { P[k] = (pos[k] - 32 * K) * sc; P[k + 1] = (maxY + 1 - pos[k + 1]) * sc; P[k + 2] = pos[k + 2] * zs; }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(clr, 3));
    geo.setIndex(idx); geo.computeVertexNormals(); geo.computeBoundingSphere();
    geo.userData.shared = true;
    return (this.plushCache[name] = geo);
  },
  voxel(name, scale = 1) { // nama lama dikekalkan: kini model plush lembut
    const mesh = new THREE.Mesh(this.plushGeo(name), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .92, metalness: 0 }));
    mesh.castShadow = true; mesh.receiveShadow = true;
    mesh.scale.setScalar(scale);
    const g = new THREE.Group(); g.add(mesh); g.userData.mesh = mesh;
    return g;
  },
  // ---------- Pembina instance (dikongsi dunia & arena) ----------
  instBuilder() {
    const L = {};
    const add = (k, x, y, z, sx, sy, sz, col, ry = 0, rx = 0) => {
      const key = k + ':' + Math.floor(x / 10) + ',' + Math.floor(z / 10);
      const list = (L[key] = L[key] || []); list.push([x, y, z, sx, sy, sz, col, ry, rx]);
      return [key, list.length - 1];
    };
    const build = (parent, out = {}) => {
      const lb = this.lib, lm = this.libMats, hi = this.hi;
      const GEO = {
        cube: [this.box, null], canopy: [lb.canopy, lm.veg], bush: [lb.bushG, lm.veg], mangrove: [lb.mangrove, lm.veg], trunk: [lb.trunk, lm.veg],
        rock: [lb.rock, lm.veg], tuft: [lb.tuft, lm.grass], tuft2: [lb.tuft2, lm.grass], tall: [lb.tall, lm.grass], rice: [lb.rice, lm.grass], cane: [lb.cane, lm.grass],
        rosette: [lb.rosette, lm.grass], flower: [lb.flower, lm.veg], frond: [lb.frond, lm.veg], ptrunk: [lb.ptrunk, lm.veg],
        screen: [this.box, 'screen'], pot: [this.potGeo || (this.potGeo = new THREE.CylinderGeometry(.5, .38, 1, 12)), null],
        ball: [this.ballGeo || (this.ballGeo = new THREE.SphereGeometry(.5, 14, 10)), null], root: [this.rootGeo || (this.rootGeo = new THREE.CylinderGeometry(.03, .05, .5, 5)), null],
        pillar: [this.pillarGeo || (this.pillarGeo = new THREE.CylinderGeometry(.5, .56, 1, 16)), null],
      };
      const noShadow = { tuft: 1, tuft2: 1, rosette: 1, flower: 1, screen: 1, tall: !hi, rice: 1, cane: !hi };
      const mtx = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), col = new THREE.Color(), v = new THREE.Vector3(), sv = new THREE.Vector3();
      for (const key in L) {
        const list = L[key], [kind, ck] = key.split(':'), [gx, gz] = ck.split(',').map(Number);
        const [geo0, mat0] = GEO[kind];
        const geo = new THREE.BufferGeometry();
        for (const a in geo0.attributes) geo.setAttribute(a, geo0.attributes[a]);
        if (geo0.index) geo.setIndex(geo0.index);
        geo.userData.shared = true;
        geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(gx * 10 + 5, 2, gz * 10 + 5), 12);
        const mat = mat0 === 'screen' ? this.mat('#ffffff', { emissive: 0x3a6a88 }) : mat0 || this.mat('#ffffff');
        const mesh = new THREE.InstancedMesh(geo, mat, list.length);
        list.forEach((it, i) => {
          const [x, y, z, sx, sy, sz, c, ry, rx] = it;
          e.set(rx || 0, ry || 0, 0); q.setFromEuler(e);
          mtx.compose(v.set(x, y, z), q, sv.set(sx, sy, sz));
          mesh.setMatrixAt(i, mtx); mesh.setColorAt(i, col.setHex(c));
        });
        mesh.castShadow = !noShadow[kind]; mesh.receiveShadow = true;
        mesh.instanceMatrix.needsUpdate = true; if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        parent.add(mesh); out[key] = mesh;
      }
      return out;
    };
    return { add, build, L };
  },
  signEnt() {
    const e = new THREE.Group();
    const wood = this.smat('#7a4a24', .9);
    const face = this.signFace || (this.signFace = new THREE.MeshStandardMaterial({ map: this.signTex, roughness: .9 }));
    const board = new THREE.Mesh(this.box, [wood, wood, wood, wood, face, wood]); board.scale.set(.72, .46, .07); board.position.y = .68;
    const post = new THREE.Mesh(this.box, wood); post.scale.set(.09, .6, .09); post.position.y = .3;
    board.castShadow = post.castShadow = true; e.add(post, board);
    return e;
  },
  // ---------- Kemas kini dunia setiap bingkai ----------
  drawWorld() {
    if (!this.ok || !World.map) return false;
    Game.used3d = true;
    const dt = Game.dt || .016;
    const p = World.p;
    if (!this.player || this.playerLook !== S.look) {
      if (this.player) this.world.remove(this.player);
      this.player = this.human(S.look); this.playerLook = S.look; this.world.add(this.player);
      this.bike = null; this.surfMon = null;
    }
    const px = p.px / 16 + .5, pz = p.py / 16 + .5;
    this.player.position.set(px, (p.jumpY ? -p.jumpY / 16 : 0) + (S.surf ? .15 : 0), pz);
    this.poseHuman(this.player, p.dir, !!p.moving && !S.bike, dt, Input.held.b ? 1.6 : 1);
    if (S.bike && !this.bike) { this.bike = new THREE.Group(); for (const z of [-.25, .25]) { const w = new THREE.Mesh(new THREE.TorusGeometry(.16, .04, 8, 16), this.mat('#202020')); w.rotation.y = Math.PI / 2; w.position.set(0, .18, z); this.bike.add(w); } const fr = new THREE.Mesh(this.box, this.mat('#d03030')); fr.scale.set(.06, .06, .5); fr.position.y = .3; this.bike.add(fr); this.world.add(this.bike); }
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
        else if (d.sign) e = this.signEnt();
        else if (d.ball === 'cahaya') { e = new THREE.Group(); const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(.26, 2), new THREE.MeshLambertMaterial({ color: 0xffe89a, emissive: 0xc08a20 })); orb.position.y = .6; const halo = new THREE.Mesh(new THREE.RingGeometry(.3, .5, 24), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .4, side: THREE.DoubleSide })); halo.rotation.x = -Math.PI / 2; halo.position.y = .03; e.add(orb, halo); e.userData.frag = orb; }
        else if (d.item || d.ball) { e = new THREE.Group(); const top = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), this.smat('#e03838', .4)); const bot = new THREE.Mesh(new THREE.SphereGeometry(.17, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.smat('#f4f4f4', .4)); const band = new THREE.Mesh(new THREE.CylinderGeometry(.175, .175, .03, 16), this.mat('#202020')); const btn = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .03, 12), this.smat('#ffffff', .3)); btn.rotation.x = Math.PI / 2; btn.position.z = .17; top.castShadow = bot.castShadow = true; e.add(top, bot, band, btn); e.userData.ball = true; }
        else if (d.bar) { e = new THREE.Group(); for (let i = 0; i < 4; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(.04, .04, 1.1, 8), this.mat('#8890a0')); b.position.set(-.36 + i * .24, .55, 0); e.add(b); } const t = new THREE.Mesh(this.box, this.mat('#e8c048')); t.scale.set(1, .1, .08); t.position.y = .7; e.add(t); }
        else if (d.mon) { e = this.voxel(d.mon, .7); e.userData.mon = true; }
        else if (d.frag) { e = new THREE.Group(); const gem = new THREE.Mesh(new THREE.OctahedronGeometry(.22, 0), new THREE.MeshLambertMaterial({ color: 0xf3c85a, emissive: 0x7a5010, flatShading: true })); gem.castShadow = true; gem.position.y = .55; const glow = new THREE.Mesh(new THREE.RingGeometry(.2, .34, 20), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .5, side: THREE.DoubleSide })); glow.rotation.x = -Math.PI / 2; glow.position.y = .03; e.add(gem, glow); e.userData.frag = gem; }
        else continue;
        this.ents.set(o, e); this.world.add(e);
      }
      const ox = o.px / 16 + .5, oz = o.py / 16 + .5;
      e.position.set(ox, e.userData.ball ? (d.u === 'K' ? .63 : .17) : 0, oz); // bola di atas meja
      if (d.s) this.poseHuman(e, o.dir, !!o.moving, dt);
      if (d.mon) { e.position.y = Math.sin(Game.t * 2) * .05; e.rotation.y = -.5; }
      if (d.frag || d.ball === 'cahaya') { e.userData.frag.rotation.y = Game.t * 2; e.userData.frag.position.y = .55 + Math.sin(Game.t * 3) * .08; }
      if (d.sign) e.rotation.y = 0;
      e.visible = true;
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
    if (this.water) {
      const a = this.water.mesh.geometry.attributes.position, b = this.water.base;
      for (let i = 0; i < a.count; i++) a.array[i * 3 + 1] = Math.sin(Game.t * 1.6 + b[i * 3] * .9 + b[i * 3 + 2] * .7) * .04;
      a.needsUpdate = true;
    }
    // kamera diorama
    const por = PORTRAIT, ins = this.inside;
    const off = ins ? (por ? [0, 12, 7.6] : [0, 9.2, 6.6]) : (por ? [0, 14.5, 9.4] : [0, 10.6, 8.6]);
    this.cam.fov = por ? 50 : 40; this.cam.updateProjectionMatrix();
    const tx = px, tz = pz + (por ? .6 : 0);
    const tgt = new THREE.Vector3(tx, .4, tz), pos = new THREE.Vector3(tx + off[0], off[1], tz + off[2]);
    if (this.snap || this.camPos.distanceTo(pos) > 6) { this.camPos.copy(pos); this.camTgt.copy(tgt); this.snap = false; }
    else { const k = 1 - Math.pow(.0005, dt); this.camPos.lerp(pos, k); this.camTgt.lerp(tgt, k); }
    this.cam.position.copy(this.camPos); this.cam.lookAt(this.camTgt);
    this.sun.position.set(this.camTgt.x - 7, 15, this.camTgt.z + 5); this.sun.target.position.copy(this.camTgt);
    const fy = 1 - this.project(px, .6, pz)[1] / SH;
    this.present(this.world, this.cam, fy, ins ? .24 : .19, ins ? 1 : 1.7);
    return true;
  },
  project(x, y, z, cam = this.cam) {
    const v = new THREE.Vector3(x, y, z).project(cam);
    return [(v.x + 1) / 2 * SW, (1 - v.y) / 2 * SH];
  },
  // ---------- Arena pertarungan ----------
  setupBattle() {
    const s = this.battle;
    this.bhemi = new THREE.HemisphereLight(0xd8eeff, 0x6f8a44, .75); s.add(this.bhemi);
    const d = new THREE.DirectionalLight(0xffe6c0, 1.7); d.position.set(-6, 12, 7); d.castShadow = true; d.shadow.mapSize.set(2048, 2048);
    const sc = d.shadow.camera; sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12; sc.far = 50; d.shadow.bias = -.0006; d.shadow.normalBias = .03;
    s.add(d); this.bsun = d;
    this.bg = new THREE.Group(); s.add(this.bg);
    this.plats = [new THREE.Group(), new THREE.Group()];
    this.plats[0].position.set(-2.1, 0, 1.7); this.plats[1].position.set(2.4, 0, -2.4);
    for (const p of this.plats) s.add(p);
    this.parts = []; this.partGeo = new THREE.IcosahedronGeometry(.07, 0);
    this.bball = new THREE.Group();
    const top = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xe03838, roughness: .35 }));
    const bot = new THREE.Mesh(new THREE.SphereGeometry(.22, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), this.smat('#f4f4f4', .35));
    const band = new THREE.Mesh(new THREE.CylinderGeometry(.225, .225, .04, 20), this.mat('#202020'));
    this.bball.add(top, bot, band); this.bball.userData.top = top; this.bball.visible = false; s.add(this.bball);
    // awan
    const [cc, cg] = mkCanvas(256, 128); cg.imageSmoothingEnabled = true;
    for (let i = 0; i < 9; i++) { const x = 50 + i * 20 + hash(i, 1) * 20, y = 70 - Math.sin(i / 8 * Math.PI) * 30, r = 26 + hash(i, 2) * 22; const gr = cg.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(.7, 'rgba(255,255,255,.8)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = gr; cg.beginPath(); cg.arc(x, y, r, 0, 7); cg.fill(); }
    this.cloudTex = this.canvasTex(cc);
  },
  battleTheme(theme) {
    if (this.bthemeName === theme) return;
    this.bthemeName = theme;
    const T = {
      rumput: { base: 0, plat: 1, sky: ['#6cb8f0', '#c4e8f8', '#f4f2dc'], props: 'meadow' },
      malam: { base: 0, plat: 1, sky: ['#0a0e20', '#262c50', '#40486a'], props: 'meadow', night: true },
      pantai: { base: 3, plat: 1, sky: ['#5aaef0', '#bfe6fa', '#fff6dc'], props: 'beach' },
      air: { base: 3, plat: 3, sky: ['#4a9ae8', '#b0dcfa', '#e8f6ff'], props: 'beach', sea: true },
      gua: { base: 4, plat: 1, sky: ['#0c0a08', '#2a2016', '#3a2c1c'], props: 'cave', dim: true },
      masa: { base: 4, plat: 1, sky: ['#1a0a2a', '#6a3a7a', '#f0a870'], props: 'cave', dim: true },
      dalam: { base: 5, plat: 6, sky: ['#1a1410', '#3a2e22', '#4a3c2c'], props: 'room', dim: true },
      bandar: { base: 2, plat: 6, sky: ['#6aa8e8', '#c8dcf0', '#f0ece0'], props: 'city' },
      gim: { base: 6, plat: 1, sky: ['#2a1a4a', '#6a4a9a', '#c8b0e8'], props: 'hall', dim: true },
      liga: { base: 6, plat: 1, sky: ['#2a1206', '#8a4a1a', '#f0c070'], props: 'hall', dim: true },
    }[theme] || { base: 0, plat: 1, sky: ['#6cb8f0', '#c4e8f8', '#f4f2dc'], props: 'meadow' };
    const s = this.battle;
    s.background = this.skyTex(...T.sky);
    s.fog = new THREE.Fog(new THREE.Color(T.sky[1]).getHex(), T.dim ? 14 : 22, T.dim ? 34 : 56);
    this.bhemi.intensity = T.night ? .35 : T.dim ? .5 : .58; this.bsun.intensity = T.night ? .5 : T.dim ? .95 : 1.3;
    this.bsun.color.set(T.night ? 0x9ab0ff : 0xffe6c0);
    if (this.bgInst) { this.disposeGroup(this.bg); }
    while (this.bg.children.length) this.bg.remove(this.bg.children[0]);
    for (const p of this.plats) while (p.children.length) p.remove(p.children[0]);
    // tanah: splat 2 teksel/unit meliputi x[-45,45], z[-60,30]
    const res = 2, GW = 180, GH = 180, ox = 45, oz = 60;
    if (this.atlas) {
      const A = new Uint8Array(GW * GH * 4), B = new Uint8Array(GW * GH * 4);
      const setC = (i, c) => { if (!c) return; (c <= 4 ? A : B)[i * 4 + (c - 1) % 4] = 255; };
      for (let j = 0; j < GH; j++) for (let i = 0; i < GW; i++) {
        const wx = (i + .5) / res - ox, wz = (j + .5) / res - oz;
        const inPlat = this.plats.some((p, k) => Math.hypot(wx - p.position.x, wz - p.position.z) < (k ? 1.85 : 2.0));
        setC(j * GW + i, inPlat ? T.plat : T.base);
      }
      const gm = this.groundMat(this.splatTex(GW, GH, A), this.splatTex(GW, GH, B), new THREE.Vector2(ox * res, oz * res), new THREE.Vector2(GW, GH), res, .22);
      const ground = new THREE.Mesh(new THREE.PlaneGeometry(90, 90), gm);
      ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -15); ground.receiveShadow = true; this.bg.add(ground);
    } else {
      const ground = new THREE.Mesh(new THREE.CircleGeometry(60, 48), this.mat(T.props === 'meadow' ? '#7cc060' : '#c8b088'));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; this.bg.add(ground);
      for (const p of this.plats) { const c = new THREE.Mesh(new THREE.CircleGeometry(1.9, 40), this.mat('#d8b884')); c.rotation.x = -Math.PI / 2; c.position.y = .01; c.receiveShadow = true; p.add(c); }
    }
    // hiasan
    const I = this.instBuilder(), add = I.add, hi = this.hi;
    const R = (i, s) => hash(i, s, 333);
    const FLW = [0xffffff, 0xfff1a0, 0xffa4b4, 0xffffff, 0xffd24a];
    const nearPlat = (x, z, r) => this.plats.some(p => Math.hypot(x - p.position.x, z - p.position.z) < r);
    const inView = (x, z) => z < 6 && z > -40 && Math.abs(x) < 40;
    if (T.props === 'meadow' || T.props === 'beach') {
      const grassy = T.props === 'meadow';
      const nT = grassy ? (hi ? 1400 : 600) : 120;
      for (let i = 0; i < nT; i++) {
        const x = (R(i, 1) - .5) * 44, z = 6 - R(i, 2) * 34; if (nearPlat(x, z, 2.05)) continue;
        const s = .9 + R(i, 3) * .8; add(i % 3 ? 'tuft' : 'tuft2', x, 0, z, s, s, s, 0xffffff, R(i, 4) * 6);
      }
      if (grassy) {
        for (let i = 0; i < (hi ? 220 : 90); i++) { const x = (R(i, 5) - .5) * 40, z = 5 - R(i, 6) * 30; if (nearPlat(x, z, 2.1)) continue; add('flower', x, 0, z, 1.3, 1.1, 1.3, FLW[i % FLW.length], R(i, 7) * 6); }
        for (let i = 0; i < 70; i++) { const x = (R(i, 8) - .5) * 40, z = 5 - R(i, 9) * 30; if (nearPlat(x, z, 2.2)) continue; add('rosette', x, .01, z, 1.5, 1, 1.5, 0xffffff, R(i, 10) * 6); }
        // tepi rumput di sekeliling pelantar
        this.plats.forEach((p, k) => { const r0 = k ? 1.85 : 2.0; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2 + R(i + k * 50, 11) * .1, r = r0 + R(i + k * 50, 12) * .2; const s = 1 + R(i, 13) * .5; add(i % 2 ? 'tuft' : 'tuft2', p.position.x + Math.cos(a) * r, 0, p.position.z + Math.sin(a) * r, s, s, s, 0xffffff, R(i, 14) * 6); } });
        // barisan pokok & semak di belakang
        for (let i = 0; i < 44; i++) {
          const a = -Math.PI * (.04 + R(i, 15) * .92), r = 14 + R(i, 16) * 12;
          const x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 4;
          const s = 1.8 + R(i, 17) * 1.2;
          add('trunk', x, 0, z, s, s, s, 0xffffff, R(i, 18) * 6); add('canopy', x, .45 * s, z, s, s, s, new THREE.Color(1 + (R(i, 19) - .5) * .2, 1 + (R(i, 19) - .5) * .2, 1).getHex(), R(i, 20) * 6);
        }
        for (let i = 0; i < 26; i++) { const a = -Math.PI * (.08 + R(i, 21) * .84), r = 8 + R(i, 22) * 5, x = Math.cos(a) * r * 1.4, z = Math.sin(a) * r - 3; if (nearPlat(x, z, 3)) continue; const s = 1.6 + R(i, 23) * 1.2; add('bush', x, 0, z, s, s * .9, s, 0xffffff, R(i, 24) * 6); }
        for (let i = 0; i < 14; i++) { const x = (R(i, 25) - .5) * 30, z = 3 - R(i, 26) * 22; if (nearPlat(x, z, 2.6)) continue; const s = .3 + R(i, 27) * .6; add('rock', x, s * .25, z, s * 1.3, s, s * 1.1, 0xffffff, R(i, 28) * 6); }
      } else {
        for (let i = 0; i < 10; i++) { const a = -Math.PI * (.1 + R(i, 30) * .8), r = 10 + R(i, 31) * 8, x = Math.cos(a) * r * 1.4, z = Math.sin(a) * r - 2; add('ptrunk', x, 0, z, 1.6, 1.6, 1.6, 0xffffff, 0, (R(i, 32) - .5) * .2); for (let k = 0; k < 7; k++) add('frond', x, 2.5, z, 1.6, 1.6, 1.6, 0xffffff, k / 7 * Math.PI * 2 + i); }
        for (let i = 0; i < 12; i++) { const x = (R(i, 33) - .5) * 30, z = 2 - R(i, 34) * 16; if (nearPlat(x, z, 2.6)) continue; const s = .3 + R(i, 35) * .5; add('rock', x, s * .25, z, s * 1.3, s, s, 0xfff4e8, R(i, 36) * 6); }
        const sea = new THREE.Mesh(new THREE.PlaneGeometry(200, 80), new THREE.MeshPhongMaterial({ color: 0x3fa6e6, shininess: 100, specular: 0xffffff, transparent: true, opacity: .9 }));
        sea.rotation.x = -Math.PI / 2; sea.position.set(0, .03, T.sea ? -50 : -58); this.bg.add(sea);
      }
      // awan
      for (let i = 0; i < 9; i++) { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: this.cloudTex, transparent: true, depthWrite: false, fog: false, opacity: T.night ? .15 : .9 })); const s = 10 + R(i, 40) * 12; sp.scale.set(s, s / 2, 1); sp.position.set((R(i, 41) - .5) * 90, 11 + R(i, 42) * 10, -45 - R(i, 43) * 15); this.bg.add(sp); }
    } else if (T.props === 'cave') {
      for (let i = 0; i < 40; i++) { const a = -Math.PI * (R(i, 50) * 1.0), r = 9 + R(i, 51) * 12, x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 3; const s = 2 + R(i, 52) * 3; add('rock', x, s * .3, z, s * 1.2, s * (1 + R(i, 53)), s, theme === 'masa' ? 0xb098c8 : 0xb08a66, R(i, 54) * 6); }
      for (let i = 0; i < 20; i++) { const x = (R(i, 55) - .5) * 24, z = 3 - R(i, 56) * 14; if (nearPlat(x, z, 2.4)) continue; const s = .2 + R(i, 57) * .4; add('rock', x, s * .25, z, s * 1.3, s, s, 0xc0a080, R(i, 58) * 6); }
    } else if (T.props === 'room') {
      for (let i = -6; i <= 6; i++) { add('cube', i * 2.4, 1.6, -9, 2.4, 3.2, .5, 0xf2ece0); add('cube', i * 2.4, .1, -8.7, 2.4, .2, .2, 0x9a6a3a); add('cube', i * 2.4 + 1.2, 1.6, -8.8, .3, 3.3, .7, 0xb98452); }
      for (let i = 0; i < 4; i++) add('cube', -7 + i * 4.5, .9, -8.4, 1.6, 1.8, .5, 0x8a5a30);
    } else if (T.props === 'city') {
      for (let i = 0; i < 18; i++) { const x = -26 + i * 3.2, z = -16 - R(i, 60) * 8, h = 3 + R(i, 61) * 7; add('cube', x, h / 2, z, 2.8, h, 2.8, [0xdfe6ee, 0xc8d0dc, 0xe8dcc8, 0xb8c4d0][i % 4]); }
      for (let i = 0; i < 10; i++) { const x = -18 + i * 4 + R(i, 62), z = -9; add('trunk', x, 0, z, 1.4, 1.4, 1.4, 0xffffff); add('canopy', x, .6, z, 1.4, 1.4, 1.4, 0xffffff, i); }
    } else if (T.props === 'hall') {
      for (let i = 0; i < 12; i++) { const a = -Math.PI * (.05 + i / 11 * .9), r = 11, x = Math.cos(a) * r * 1.3, z = Math.sin(a) * r - 3; add('pillar', x, 2.5, z, 1, 5, 1, theme === 'liga' ? 0xf0d080 : 0xd8d0f0); add('cube', x, 5.1, z, 1.4, .3, 1.4, 0xfff4d8); }
    }
    this.bgInst = I.build(this.bg);
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
    const want = (side, name) => {
      const k = side + 'M', nk = side + 'Name';
      if (this[nk] === name) return this[k];
      if (this[k]) this.battle.remove(this[k]);
      this[k] = name ? this.voxel(name, side === 'me' ? 1.5 : 1.55) : null; this[nk] = name;
      if (this[k]) this.battle.add(this[k]);
      return this[k];
    };
    const ghost = bs.o.ghost && !S.bag['Teropong Roh'];
    const meM = want('me', bs.me.mon ? bs.me.mon.sp : null);
    const foeM = want('foe', bs.foe.mon ? bs.foe.mon.sp : null);
    if (meM) {
      meM.visible = bs.meVis && !(bs.meBlink > 0 && Math.floor(Game.t * 16) % 2);
      meM.position.set(mePos.x + bs.meX / 60, -bs.meY / 90 + Math.max(0, Math.sin(t * 2.2)) * .04, mePos.z);
      meM.rotation.y = Math.PI + .55;
      const k = 1 + Math.sin(t * 2.2) * .018; meM.scale.set(k, 1 / k, k);
    }
    if (foeM) {
      foeM.visible = bs.foeVis && !(bs.foeBlink > 0 && Math.floor(Game.t * 16) % 2);
      const sc = bs.foeScale, k = 1 + Math.sin(t * 2 + 1) * .018;
      foeM.position.set(foePos.x + bs.foeX / 60, -bs.foeY / 90 + Math.max(0, Math.sin(t * 2 + 1)) * .04, foePos.z);
      foeM.rotation.y = -.45;
      foeM.scale.set(sc * k, sc / k, sc * k);
      foeM.userData.mesh.material.color.set(ghost ? 0x221a30 : 0xffffff);
    }
    if (this.meTrM) { this.meTrM.visible = bs.meTr; this.meTrM.position.set(mePos.x - .3 + bs.meTrX / 60, 0, mePos.z + .2); this.meTrM.rotation.y = Math.PI * .8; }
    if (this.foeTrM) { this.foeTrM.visible = bs.foeTr; this.foeTrM.position.set(foePos.x + bs.foeTrX / 60, 0, foePos.z); this.foeTrM.rotation.y = -.4; }
    if (bs.ball) {
      this.bball.visible = true;
      const k = bs.ball.k !== undefined ? bs.ball.k : 1;
      const from = new THREE.Vector3(mePos.x, 1.2, mePos.z), to = new THREE.Vector3(foePos.x, .25, foePos.z);
      this.bball.position.lerpVectors(from, to, k); this.bball.position.y += Math.sin(k * Math.PI) * 2.2;
      this.bball.rotation.z = (bs.ball.wob || 0) * .6 + (k < 1 ? k * 12 : 0);
      this.bball.userData.top.material.color.set(bs.ball.col || '#e03838');
    } else this.bball.visible = false;
    for (let i = this.parts.length - 1; i >= 0; i--) {
      const p = this.parts[i]; p.life -= dt;
      if (p.life <= 0) { this.battle.remove(p.m); p.m.material.dispose(); this.parts.splice(i, 1); continue; }
      p.v.y -= p.g * dt; p.m.position.addScaledVector(p.v, dt); p.m.rotation.x += dt * 6; p.m.material.opacity = Math.min(1, p.life * 2);
    }
    // kamera sinematik (di belakang Monsta pemain)
    const por = PORTRAIT;
    const intro = Math.max(0, 1 - t / 1.4);
    const sway = Math.sin(t * .35) * .3;
    const base = por ? new THREE.Vector3(-3.8 + sway, 4.0, 10.8) : new THREE.Vector3(-5.4 + sway, 3.0, 8.6);
    const look = por ? new THREE.Vector3(.4, .9, -1.0) : new THREE.Vector3(.8, .85, -.9);
    const cp = base.clone().add(new THREE.Vector3(intro * 6, intro * 3, intro * 4));
    if (this.bshake > 0) { this.bshake -= dt; cp.x += (Math.random() - .5) * this.bshake; cp.y += (Math.random() - .5) * this.bshake; }
    this.bcam.fov = por ? 58 : 40; this.bcam.updateProjectionMatrix();
    this.bcam.position.copy(cp); this.bcam.lookAt(look);
    this.bsun.target.position.set(0, 0, -1); this.bsun.position.set(-6, 12, 7);
    this.present(this.battle, this.bcam, .38, .27, 1.6);
    return true;
  },
  battleAnchor(side) {
    const p = side === 'me' ? this.plats[0].position : this.plats[1].position;
    return this.project(p.x, side === 'me' ? 2.6 : 2.4, p.z, this.bcam);
  },
  // ---------- Pameran (skrin tajuk, evolusi, Monstadex) ----------
  setupShow() {
    const s = this.show;
    s.add(new THREE.HemisphereLight(0xfff0e0, 0x402a60, .9));
    const d = new THREE.DirectionalLight(0xffe0b0, 1.5); d.position.set(-4, 8, 6); d.castShadow = true; d.shadow.mapSize.set(1024, 1024); s.add(d);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, .4, 48), new THREE.MeshStandardMaterial({ color: 0x3a3060, roughness: .6 })); plat.position.y = -.2; plat.receiveShadow = true; s.add(plat);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.05, .06, 8, 64), new THREE.MeshBasicMaterial({ color: 0xe9c46a })); ring.rotation.x = Math.PI / 2; s.add(ring);
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
    this.present(this.show, this.scam, por ? .5 : .4, .3, 1.4);
    return true;
  }
};
window.R3 = R3;
R3.init();
