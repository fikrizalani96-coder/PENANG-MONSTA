'use strict';
// ===== Enjin 3D permainan (Three.js): teras, cahaya, langit, zarah, kamera bebas dan entiti hidup =====
// Dunia sebenar (rupa bumi berketinggian, model tumbuhan/bangunan, air, bayang) dibina dalam world3d.js.
// Arena pertempuran, tajuk dan pameran dalam scenes3d.js. Tiada pasca-proses: satu laluan render sahaja, resolusi dinamik.
const R3 = {
  ok: false, quality: 'tinggi', camYaw: 0, camPitch: .74, camDist: 9.5, yawT: 0, userPitch: 0, userZoom: 1, yawOut: 0,
  hAt() { return 0; },
  get hi() { return this.quality === 'tinggi'; },
  init() {
    if (!window.THREE) return;
    THREE.ColorManagement.legacyMode = false;
    this.quality = 'tinggi';
    try { const q = localStorage.getItem('msp_grafik'); if (q && localStorage.getItem('msp_grafik_pilih') === '1') this.quality = q; } catch (e) { }
    if (this.quality === '2d' || /[?&]2d\b/.test(location.search)) return; // mod 2D klasik
    const c = document.getElementById('gl'), dpr = window.devicePixelRatio || 1;
    let r;
    try { r = new THREE.WebGLRenderer({ canvas: c, antialias: dpr < 2, powerPreference: 'high-performance', stencil: false }); }
    catch (e) { console.warn('WebGL tiada, guna 2D', e); return; }
    this.r = r; this.canvas = c; this.gl2 = r.capabilities.isWebGL2;
    r.outputEncoding = THREE.sRGBEncoding;
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.02;
    r.shadowMap.enabled = this.hi; r.shadowMap.type = THREE.PCFShadowMap;
    r.info.autoReset = false;
    TEX.aniso = Math.min(8, r.capabilities.getMaxAnisotropy());
    PR.hi = this.hi; MAT.init(this.gl2);
    this.dynamic = !navigator.webdriver && !/[?&]dyn=0\b/.test(location.search);
    this.scale = 1; this.ema = 16; this.frames = 0; this.slow = 0; this.fast = 0; this.lastT = performance.now();
    this.stats = /[?&]stats\b/.test(location.search) ? this.mkStats() : null;
    this.world = new THREE.Scene(); this.battle = new THREE.Scene(); this.show = new THREE.Scene(); this.titleS = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 400);
    this.bcam = new THREE.PerspectiveCamera(40, 16 / 9, .1, 400);
    this.frustum = new THREE.Frustum(); this.pv = new THREE.Matrix4();
    this.camPos = new THREE.Vector3(); this.camTgt = new THREE.Vector3(); this.focus = new THREE.Vector3();
    this.V = new THREE.Vector3(); this.V2 = new THREE.Vector3(); this.M4 = new THREE.Matrix4(); this.Q = new THREE.Quaternion(); this.E = new THREE.Euler(); this.SC = new THREE.Vector3(); this.C = new THREE.Color();
    this.ok = true;
    this.lightsW = this.mkLights(this.world); this.skyW = this.mkSky(this.world);
    this.blobTex = TEX.get('blob'); this.mkParticles();
    this.ents = new Map();
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
  },
  mkStats() {
    const d = document.createElement('pre');
    d.style.cssText = 'position:fixed;left:6px;top:6px;z-index:99;margin:0;padding:6px 8px;background:rgba(0,0,0,.6);color:#9f9;font:11px/1.35 monospace;pointer-events:none;white-space:pre';
    document.body.appendChild(d); return d;
  },
  setQuality(q) {
    this.quality = q; try { localStorage.setItem('msp_grafik', q); } catch (e) { }
    if (!this.ok) return;
    PR.hi = this.hi; PR._c = {};
    this.r.shadowMap.enabled = this.hi;
    this.lightsW.sun.castShadow = this.hi;
    for (const s of [this.world, this.battle, this.show, this.titleS]) s.traverse(o => { if (o.material) for (const m of [].concat(o.material)) m.needsUpdate = true; });
    const b = stage.getBoundingClientRect(); this.resize(b.width, b.height);
    if (World.map && World.grid) { this.buildWorld(World.map, World.grid); this.snap = true; }
    this.bthemeName = null; this.title = null;
  },
  get basePR() { const dpr = window.devicePixelRatio || 1; return Math.min(dpr, this.hi ? (IS_TOUCH ? 1.6 : 2) : 1); },
  resize(w, h) {
    if (!this.ok) return;
    this.cssW = w; this.cssH = h;
    this.applyScale();
    this.aspect = w / h;
    for (const c of [this.cam, this.bcam, this.title && this.title.cam, this.scam]) if (c) { c.aspect = this.aspect; c.updateProjectionMatrix(); }
  },
  applyScale() {
    const pr = this.basePR * this.scale;
    this.r.setPixelRatio(pr); this.r.setSize(this.cssW, this.cssH, false);
  },
  endFrame(used) { if (!this.ok) return; this.canvas.style.visibility = used ? 'visible' : 'hidden'; },
  // ---------- resolusi dinamik + statistik ----------
  render(scene, cam) {
    const r = this.r, t = performance.now(), dtm = Math.min(200, t - this.lastT); this.lastT = t;
    r.info.reset();
    r.render(scene, cam);
    if (document.hidden) return;
    this.ema += (dtm - this.ema) * .06; this.frames++;
    if (this.dynamic && this.frames > 40 && !Game.fade) {
      if (this.ema > 25) { this.slow++; this.fast = 0; } else if (this.ema < 15.5) { this.fast++; this.slow = 0; } else { this.slow = 0; this.fast = 0; }
      if (this.slow > 50 && this.scale > .55) { this.scale = Math.max(.55, this.scale - .1); this.slow = 0; this.applyScale(); }
      else if (this.fast > 300 && this.scale < 1) { this.scale = Math.min(1, this.scale + .05); this.fast = 0; this.applyScale(); }
      else if (this.slow > 400 && this.scale <= .56 && this.hi) { // sangat perlahan: turun ke kualiti rendah sekali
        this.slow = 0; let locked = false; try { locked = localStorage.getItem('msp_grafik_pilih') === '1'; } catch (e) { }
        if (!locked) { this.setQuality('rendah'); if (window.Cloud) Cloud.toast('Grafik ditukar ke RENDAH supaya lebih lancar. Tukar di MENU → PILIHAN → GRAFIK.', 5000); }
      }
    }
    if (this.stats && this.frames % 15 === 0) {
      const i = r.info;
      this.stats.textContent = `${(1000 / Math.max(1, this.ema)).toFixed(0)} fps  ${this.ema.toFixed(1)} ms\ndraw ${i.render.calls}  tri ${(i.render.triangles / 1000).toFixed(1)}k\ngeo ${i.memory.geometries}  tex ${i.memory.textures}\nskala ${this.scale.toFixed(2)}  ${this.quality}`;
    }
  },
  // ---------- cahaya, langit, kabus ----------
  mkLights(scene) {
    const hemi = new THREE.HemisphereLight(0xcde6ff, 0x7a9a52, .8); scene.add(hemi);
    const sun = new THREE.DirectionalLight(0xffe8c4, 1.7);
    sun.castShadow = this.hi; sun.shadow.mapSize.set(this.hi ? (IS_TOUCH ? 1536 : 2048) : 512, this.hi ? (IS_TOUCH ? 1536 : 2048) : 512);
    const sc = sun.shadow.camera; sc.left = -15; sc.right = 15; sc.top = 15; sc.bottom = -15; sc.near = 1; sc.far = 90;
    sun.shadow.bias = -.0005; sun.shadow.normalBias = .035; sun.shadow.radius = 2.2;
    scene.add(sun, sun.target);
    return { hemi, sun, dir: new THREE.Vector3(-.5, .8, .55).normalize(), R: 15 };
  },
  mkSky(scene) {
    const geo = new THREE.SphereGeometry(300, 24, 14);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uTop: { value: new THREE.Color() }, uMid: { value: new THREE.Color() }, uBot: { value: new THREE.Color() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color() }, uTime: U3.uTime, uClouds: { value: 1 }, uStars: { value: 0 }, uSun: { value: 1 } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }',
      fragmentShader: `uniform vec3 uTop, uMid, uBot, uSunDir, uSunCol; uniform float uTime, uClouds, uStars, uSun; varying vec3 vDir;
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
        float fbm(vec2 p){ float a = .5, t = 0.; for (int i = 0; i < 4; i++){ t += a * vn(p); p = p * 2.03 + 11.7; a *= .5; } return t; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = h > 0. ? mix(uMid, uTop, pow(clamp(h, 0., 1.), .5)) : mix(uMid, uBot, clamp(-h * 4., 0., 1.));
          float sd = max(dot(d, uSunDir), 0.);
          col += uSunCol * (pow(sd, 6.) * .22 + pow(sd, 40.) * .35 + step(.9993, sd) * 2.2 * uSun);
          if (h > .01 && uClouds > 0.) {
            vec2 uv = d.xz / (h + .28) * 1.7 + vec2(uTime * .012, uTime * .004);
            float c = fbm(uv); c = smoothstep(.48, .82, c) * uClouds * smoothstep(.01, .22, h);
            float lit = clamp(dot(normalize(vec3(d.x, .3, d.z)), uSunDir) * .5 + .6, .6, 1.);
            col = mix(col, mix(uMid, vec3(1.), .75) * lit, c * .85);
          }
          if (uStars > 0. && h > 0.) { vec2 sp = d.xz / (h + .15) * 46.; float s = step(.992, h21(floor(sp))) * (.5 + .5 * sin(uTime * 3. + h21(floor(sp) + 3.) * 20.)); col += vec3(1., .96, .8) * s * uStars * smoothstep(.05, .3, h); }
          gl_FragColor = vec4(col, 1.);
          #include <tonemapping_fragment>
          #include <encodings_fragment>
        }`,
      side: THREE.BackSide, depthWrite: false, fog: false, toneMapped: true,
    });
    const m = new THREE.Mesh(geo, mat); m.renderOrder = -100; m.frustumCulled = false; scene.add(m);
    return m;
  },
  // env: { sky:[top,mid,bot], fog:[hex,near,far], hemi:[sky,ground,int], sun:[hex,int], dir:[x,y,z], clouds, stars, exp }
  applyEnv(scene, L, sky, env) {
    const u = sky.material.uniforms;
    u.uTop.value.set(env.sky[0]); u.uMid.value.set(env.sky[1]); u.uBot.value.set(env.sky[2]);
    L.dir.set(...env.dir).normalize(); u.uSunDir.value.set(...(env.skyDir || env.dir)).normalize(); u.uSunCol.value.set(env.sun[0]).multiplyScalar(env.glare === undefined ? .5 : env.glare);
    u.uClouds.value = env.clouds === undefined ? 1 : env.clouds; u.uStars.value = env.stars || 0; u.uSun.value = env.stars ? 0 : 1;
    scene.fog = env.fog ? new THREE.Fog(new THREE.Color(env.fog[0]), env.fog[1], env.fog[2]) : null;
    L.hemi.color.set(env.hemi[0]); L.hemi.groundColor.set(env.hemi[1]); L.hemi.intensity = env.hemi[2];
    L.sun.color.set(env.sun[0]); L.sun.intensity = env.sun[1];
    this.r.toneMappingExposure = env.exp || 1.02;
  },
  // ---------- zarah (habuk, percikan, kilauan, kunang-kunang): satu Points, satu draw call ----------
  mkParticles() {
    const N = 420, g = new THREE.BufferGeometry();
    this.P = { N, n: 0, a0: new Float32Array(N), pos: new Float32Array(N * 3), col: new Float32Array(N * 3), size: new Float32Array(N), alpha: new Float32Array(N), vel: new Float32Array(N * 3), life: new Float32Array(N), max: new Float32Array(N), grav: new Float32Array(N), grow: new Float32Array(N), s0: new Float32Array(N), next: 0 };
    g.setAttribute('position', new THREE.BufferAttribute(this.P.pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aCol', new THREE.BufferAttribute(this.P.col, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aSize', new THREE.BufferAttribute(this.P.size, 1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('aAlpha', new THREE.BufferAttribute(this.P.alpha, 1).setUsage(THREE.DynamicDrawUsage));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
    this.pMat = new THREE.ShaderMaterial({
      uniforms: { uPx: { value: 600 }, uMap: { value: TEX.get('glow') } },
      vertexShader: 'attribute vec3 aCol; attribute float aSize; attribute float aAlpha; varying vec3 vC; varying float vA; uniform float uPx; void main(){ vC = aCol; vA = aAlpha; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = clamp(aSize * uPx / max(-mv.z, .1), 1.0, 160.0); }',
      fragmentShader: 'uniform sampler2D uMap; varying vec3 vC; varying float vA;\nvoid main(){ vec4 t = texture2D(uMap, gl_PointCoord); gl_FragColor = vec4(vC, t.a * vA);\n#include <encodings_fragment>\n}',
      transparent: true, depthWrite: false, depthTest: true, fog: false,
    });
    this.pts = new THREE.Points(g, this.pMat); this.pts.frustumCulled = false; this.pts.renderOrder = 20;
    this.pDraw = 0;
    for (let i = 0; i < N; i++) this.P.life[i] = 0;
  },
  // pancar zarah: { x,y,z, vx,vy,vz, life, size, grow, grav, color, alpha }
  emit(x, y, z, o) {
    const P = this.P, i = P.next; P.next = (P.next + 1) % P.N;
    P.pos[i * 3] = x; P.pos[i * 3 + 1] = y; P.pos[i * 3 + 2] = z;
    P.vel[i * 3] = o.vx || 0; P.vel[i * 3 + 1] = o.vy || 0; P.vel[i * 3 + 2] = o.vz || 0;
    P.life[i] = P.max[i] = o.life || 1; P.s0[i] = o.size || .12; P.grow[i] = o.grow || 0; P.grav[i] = o.grav || 0;
    const c = this.C.set(o.color || '#ffffff'); P.col[i * 3] = c.r; P.col[i * 3 + 1] = c.g; P.col[i * 3 + 2] = c.b;
    P.alpha[i] = o.alpha === undefined ? 1 : o.alpha; P.size[i] = P.s0[i]; P.a0[i] = P.alpha[i];
  },
  tickParticles(dt) {
    const P = this.P; let any = false;
    for (let i = 0; i < P.N; i++) {
      if (P.life[i] <= 0) { P.size[i] = 0; continue; }
      P.life[i] -= dt; any = true;
      if (P.life[i] <= 0) { P.size[i] = 0; P.alpha[i] = 0; continue; }
      const k = P.life[i] / P.max[i];
      P.vel[i * 3 + 1] -= P.grav[i] * dt;
      P.pos[i * 3] += P.vel[i * 3] * dt; P.pos[i * 3 + 1] += P.vel[i * 3 + 1] * dt; P.pos[i * 3 + 2] += P.vel[i * 3 + 2] * dt;
      P.size[i] = P.s0[i] * (1 + (1 - k) * P.grow[i]);
      P.alpha[i] = Math.min(1, k * 3, (1 - k) * 12) * P.a0[i];
    }
    const g = this.pts.geometry;
    g.attributes.position.needsUpdate = g.attributes.aCol.needsUpdate = g.attributes.aSize.needsUpdate = g.attributes.aAlpha.needsUpdate = true;
    this.pMat.uniforms.uPx.value = this.r.domElement.height / (2 * Math.tan(this.activeCam.fov * Math.PI / 360));
    return any;
  },
  // ---------- projek titik dunia ke skrin (koordinat logik UI), null jika di belakang kamera ----------
  project(x, y, z, cam = this.cam) {
    const v = this.V.set(x, y, z).applyMatrix4(cam.matrixWorldInverse);
    if (v.z > -.05) return null;
    v.applyMatrix4(cam.projectionMatrix);
    return [(v.x + 1) / 2 * SW, (1 - v.y) / 2 * SH];
  },
  disposeGroup(g) {
    g.traverse(o => {
      if (o.isInstancedMesh) o.dispose();
      if (o.geometry && !(o.geometry.userData && o.geometry.userData.shared)) o.geometry.dispose();
      if (o.material) for (const m of [].concat(o.material)) { if (m.userData && m.userData.keep) continue; if (m.map && !m.map.userData.keep) m.map.dispose(); if (m.userData && m.userData.tex) for (const t of m.userData.tex) t.dispose(); if (!MAT.isShared(m)) m.dispose(); }
    });
  },
  // ---------- pembina entiti (model hidup) ----------
  human(look, detail = 0) { const g = HumanModel.build(look, detail); g.traverse(o => { if (o.isMesh) o.castShadow = true; }); return g; },
  mon(name, size = 1, detail = 0) { const g = MonModel.build(name, detail); g.userData.setSize(size); return g; },
  voxel(name, size = 1) { return this.mon(name, size); }, // nama lama
  blob(r = .4) {
    const m = new THREE.Mesh(this._blobGeo || (this._blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)), this._blobMat || (this._blobMat = new THREE.MeshBasicMaterial({ map: this.blobTex, transparent: true, depthWrite: false, fog: true, polygonOffset: true, polygonOffsetFactor: -2 })));
    m.scale.set(r * 2.6, 1, r * 2.6); m.position.y = .03; m.renderOrder = 2; m.userData.blob = true; return m;
  },
  // pose anggota manusia: kelajuan (unit/saat), berlari, penonton
  poseHuman(g, speed, run, dt, look) {
    const u = g.userData, amp = Math.min(1, speed / 3.6), t = Game.t;
    if (speed > .15) u.phase += dt * (5.5 + speed * 1.7); else u.phase *= Math.exp(-dt * 10);
    const s = Math.sin(u.phase) * (run ? 1.05 : .82) * amp;
    u.lL.rotation.x = s; u.lR.rotation.x = -s;
    u.aL.rotation.x = -s * (run ? 1.3 : .9); u.aR.rotation.x = s * (run ? 1.3 : .9);
    if (run) { u.aL.rotation.z = -.55 * amp - .12; u.aR.rotation.z = .55 * amp + .12; } else { u.aL.rotation.z = -.12; u.aR.rotation.z = .12; }
    u.body.position.y = Math.abs(Math.sin(u.phase)) * (run ? .07 : .045) * amp + (amp < .05 ? Math.sin(t * 2 + g.id) * .005 : 0);
    u.body.rotation.x += ((run ? .16 * amp : 0) - u.body.rotation.x) * Math.min(1, dt * 10);
    u.body.rotation.z = Math.sin(u.phase) * .04 * amp;
    if (u.head) {
      const ty = look === undefined ? 0 : Math.max(-.9, Math.min(.9, look));
      u.head.rotation.y += (ty - u.head.rotation.y) * Math.min(1, dt * 8);
      u.head.rotation.x = amp < .05 ? Math.sin(t * 1.3 + g.id) * .02 : 0;
    }
  },
};
window.R3 = R3;
