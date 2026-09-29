'use strict';
// ===== Dunia hidup: kamera orbit bebas, watak berjalan/berlari, NPC yang menoleh, Monsta pengikut, zarah, kemas kini setiap bingkai =====
const _wrapA = a => { a = (a + Math.PI) % (Math.PI * 2); if (a < 0) a += Math.PI * 2; return a - Math.PI; };
Object.assign(R3, {
  burst(x, y, z, color, n = 10, o = {}) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283, s = (o.speed || 1.4) * (.4 + Math.random() * .8);
      this.emit(x + (Math.random() - .5) * .2, y, z + (Math.random() - .5) * .2, { vx: Math.cos(a) * s, vy: (o.up || 1.6) * (.4 + Math.random()), vz: Math.sin(a) * s, life: (o.life || .6) * (.6 + Math.random() * .6), size: o.size || .09, grow: o.grow || 0, grav: o.grav === undefined ? 5 : o.grav, color, alpha: o.alpha === undefined ? 1 : o.alpha });
    }
  },
  tuneWaterFor(env, th) {
    const w = this.waterMat(), u = w.uniforms;
    const P = { pantai: ['#33c4d0', '#1268b8'], air: ['#4cc0a4', '#146c92'], bandar: ['#38b8cc', '#1660b0'], malam: ['#1c3a6a', '#081840'], senja: ['#e08a90', '#8a3a7a'] }[th] || ['#36bccc', '#1668b8'];
    u.uShallow.value.set(P[0]); u.uDeep.value.set(P[1]); u.uSky.value.set(env.sky[1]); u.uSunDir.value.set(...(env.skyDir || env.dir)).normalize(); u.uSunCol.value.set(env.sun[0]);
    this._wenv = env;
  },
  // ---------- kamera orbit ----------
  updateCamera(dt, px, py, pz, vx, vz) {
    const por = PORTRAIT, ins = this.inside, cave = this.cave, cam = this.cam, top = Game.top() === World.scene && !World.busy;
    if (Game.top() === World.scene) {
      const yawFree = !ins;
      if (yawFree) {
        this.yawT -= Input.drag.x * .0058;
        if (Input.held.camL) this.yawT += dt * 1.7; if (Input.held.camR) this.yawT -= dt * 1.7;
        if (Input.pressed.camReset) { this.yawT = 0; this.userPitch = 0; this.userZoom = 1; }
      } else this.yawT = 0;
      this.userPitch = Math.max(-.32, Math.min(.42, this.userPitch + Input.drag.y * .0035));
      if (Input.wheel) this.userZoom = Math.max(.6, Math.min(1.7, this.userZoom * (1 + Input.wheel * .0011)));
    }
    if (this.snap) this.camYaw = this.yawT; else this.camYaw += _wrapA(this.yawT - this.camYaw) * (1 - Math.exp(-dt * (ins ? 6 : 9)));
    const pitch = Math.max(.42, Math.min(1.18, (ins ? 1.0 : cave ? .95 : .74) + this.userPitch));
    const dist = (ins ? (por ? 10.2 : 8.4) : cave ? (por ? 12 : 9.6) : (por ? 12.4 : 9.8)) * this.userZoom;
    const fov = por ? 47 : 38;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
    // sasaran kamera: pemain + ke hadapan sedikit; dalam potret pemain berada lebih tinggi supaya tidak terlindung kayu bedik
    const la = Math.min(1, Math.hypot(vx, vz) / 6) * .55, tx = px + (vx || 0) * .09 * la, tz = pz + (vz || 0) * .09 * la;
    const ty = py + .7 - (por ? .9 : .15);
    if (this.snap) { this.focus.set(tx, ty, tz); this.camTgtInit = true; }
    else { const k = 1 - Math.exp(-dt * 8); this.focus.x += (tx - this.focus.x) * k; this.focus.y += (ty - this.focus.y) * k; this.focus.z += (tz - this.focus.z) * k; }
    const hd = dist * Math.cos(pitch), vy = dist * Math.sin(pitch), yaw = this.camYaw;
    let cx = this.focus.x + Math.sin(yaw) * hd, cy = this.focus.y + vy, cz = this.focus.z + Math.cos(yaw) * hd;
    if (this.outdoor) cy = Math.max(cy, this.terrainH(cx, cz) + .9);
    cam.position.set(cx, cy, cz); cam.lookAt(this.focus);
    this.camPitch = pitch; this.camDist = dist;
    cam.updateMatrixWorld(true);
    this.pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); this.frustum.setFromProjectionMatrix(this.pv);
    this.skyW.position.copy(cam.position);
  },
  // sempadan bayang mengikut pemain dengan penyeragaman teksel (elak berkelip)
  updateShadow(L, cx, cy, cz, R) {
    const sun = L.sun; if (!sun.castShadow) return;
    const d = L.dir, sc = sun.shadow.camera;
    if (sc.right !== R) { sc.left = -R; sc.right = R; sc.top = R; sc.bottom = -R; sc.updateProjectionMatrix(); }
    const rt = this.V.set(0, 1, 0).cross(d).normalize(), up = this.V2.copy(d).cross(rt).normalize(), tex = R * 2 / sun.shadow.mapSize.x;
    const a = Math.round((cx * rt.x + cy * rt.y + cz * rt.z) / tex) * tex, b = Math.round((cx * up.x + cy * up.y + cz * up.z) / tex) * tex;
    const ca = cx * rt.x + cy * rt.y + cz * rt.z, cb = cx * up.x + cy * up.y + cz * up.z;
    const nx = cx + rt.x * (a - ca) + up.x * (b - cb), ny = cy + rt.y * (a - ca) + up.y * (b - cb), nz = cz + rt.z * (a - ca) + up.z * (b - cb);
    sun.target.position.set(nx, ny, nz); sun.position.set(nx + d.x * 45, ny + d.y * 45, nz + d.z * 45);
    sun.target.updateMatrixWorld();
  },
  // ---------- ketulan statik (rumput, bangunan): penapisan jarak; instance (pokok dll): LOD + frustum setiap contoh ----------
  updateChunks() {
    const fx = this.focus.x, fz = this.focus.z, hi = this.hi, farR = hi ? 64 : 44, grassR = hi ? 22 : 14;
    let vis = 0;
    for (const c of this.chunks) {
      const d = Math.hypot(c.x - fx, c.z - fz) - CS * .6;
      const v = d < farR && this.frustum.intersectsSphere(c.sph);
      c.group.visible = v; if (!v) continue; vis++;
      if (c.grass) c.grass.visible = d < grassR;
    }
    this.visChunks = vis;
    this.refreshInst();
  },
  refreshInst() {
    const fx = this.focus.x, fz = this.focus.z, cp = this.cam.position, hi = this.hi, k = hi ? 1 : .75, farR = hi ? 62 : 42, farR2 = farR * farR;
    const key = (fx * 3 | 0) * 7919 + (fz * 3 | 0) * 104729 + Math.round(this.camYaw * 60) * 31 + Math.round(this.camPitch * 60) * 977 + Math.round(this.camDist * 4) * 13;
    if (key === this._instKey) return; this._instKey = key;
    const P = this.frustum.planes;
    for (const kind in this.insts) {
      const e = this.insts[kind], def = e.def, near = e.near, far = e.far, n = e.n, nr = (def.near || 12) * k, nr2 = nr * nr;
      const nm = near.instanceMatrix.array, nc = near.instanceColor.array, fm = far ? far.instanceMatrix.array : null, fc = far ? far.instanceColor.array : null;
      const pad = def.cast ? 2.6 : 0.4;
      let a = 0, b = 0;
      for (let i = 0; i < n; i++) {
        const x = e.p[i * 4], y = e.p[i * 4 + 1], z = e.p[i * 4 + 2], r = e.r0 * e.p[i * 4 + 3] * 1.05 + pad, dx = x - fx, dz = z - fz, d2 = dx * dx + dz * dz;
        if (d2 > farR2) continue;
        const cy = y + e.y0 * e.p[i * 4 + 3];
        let out = false;
        for (let q = 0; q < 6; q++) { const pl = P[q]; if (pl.normal.x * x + pl.normal.y * cy + pl.normal.z * z + pl.constant < -r) { out = true; break; } }
        if (out) continue;
        if (e.m[i * 16] === 0 && e.m[i * 16 + 5] === 0) continue; // dibuang (semak ditebas)
        if (far && d2 >= nr2) { fm.set(e.m.subarray(i * 16, i * 16 + 16), b * 16); fc[b * 3] = e.c[i * 3]; fc[b * 3 + 1] = e.c[i * 3 + 1]; fc[b * 3 + 2] = e.c[i * 3 + 2]; b++; }
        else { nm.set(e.m.subarray(i * 16, i * 16 + 16), a * 16); nc[a * 3] = e.c[i * 3]; nc[a * 3 + 1] = e.c[i * 3 + 1]; nc[a * 3 + 2] = e.c[i * 3 + 2]; a++; }
      }
      near.count = a; near.instanceMatrix.needsUpdate = near.instanceColor.needsUpdate = true; near.instanceMatrix.updateRange = { offset: 0, count: a * 16 }; near.instanceColor.updateRange = { offset: 0, count: a * 3 };
      near.visible = a > 0;
      if (far) { far.count = b; far.instanceMatrix.needsUpdate = far.instanceColor.needsUpdate = true; far.instanceMatrix.updateRange = { offset: 0, count: b * 16 }; far.instanceColor.updateRange = { offset: 0, count: b * 3 }; far.visible = b > 0; }
    }
  },
  // ---------- entiti ----------
  mkBike() {
    const g = new THREE.Group(), L = c => new THREE.MeshLambertMaterial({ color: c }), tire = L(0x202226), red = L(0xd03a34), metal = L(0xc4c8d0), seat = L(0x2a2a30);
    const bar = (a, b, r, mat) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), 6), mat); m.position.copy(A).add(B).multiplyScalar(.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); m.castShadow = true; g.add(m); return m; };
    const wheel = z => {
      const w = new THREE.Group(), t = new THREE.Mesh(new THREE.TorusGeometry(.21, .035, 8, 22).rotateY(Math.PI / 2), tire); t.castShadow = true; w.add(t);
      for (let i = 0; i < 4; i++) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(.005, .005, .4, 4), metal); sp.rotation.x = i * Math.PI / 4; w.add(sp); }
      w.position.set(0, .22, z); g.add(w); return w;
    };
    g.userData.wf = wheel(.42); g.userData.wb = wheel(-.42);
    bar([0, .22, .42], [0, .5, .16], .022, red); bar([0, .5, .16], [0, .34, -.12], .022, red); bar([0, .34, -.12], [0, .22, -.42], .02, red); bar([0, .22, -.42], [0, .34, -.12], .02, red); bar([0, .5, .16], [0, .46, -.16], .02, red);
    bar([0, .5, .16], [0, .62, .28], .02, metal); bar([-.17, .66, .28], [.17, .66, .28], .016, metal);
    const s = new THREE.Mesh(new THREE.BoxGeometry(.11, .04, .2), seat); s.position.set(0, .56, -.16); g.add(s);
    return g;
  },
  humanEnt(look) { const g = this.human(look); const e = { g, kind: 'human', ang: 0, x: 0, z: 0, spd: 0, look: 0, lookT: Math.random() * 3, lookA: 0 }; if (!this.hi) g.add(this.blob(.45)); return e; },
  signEnt(text) {
    const g = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(.09, .62, .09), MAT.rigid); post.geometry = this._postG || (this._postG = (() => { const q = new GB(); q.bx(0, .31, 0, .09, .62, .09, '#7a4a24', { ao: [.6, 1] }); return q.build(); })()); post.castShadow = true;
    const board = new THREE.Mesh(this._boardG || (this._boardG = new THREE.BoxGeometry(.74, .46, .07)), [MAT.rigid, MAT.rigid, MAT.rigid, MAT.rigid, this.signMat(text), MAT.rigid]);
    // sisi kayu: gunakan bahan berwarna kayu
    const wood = this._woodM || (this._woodM = Object.assign(new THREE.MeshLambertMaterial({ color: 0x7a4a24 }), { userData: { keep: true } }));
    board.material = [wood, wood, wood, wood, this.signMat(text), wood]; board.position.y = .7; board.castShadow = true;
    g.add(post, board);
    return { g, kind: 'sign', ang: 0 };
  },
  itemEnt(kind) {
    const g = new THREE.Group();
    if (kind === 'ball') { const m = new THREE.Mesh(PR.geo('ball', 0), MAT.rigid); m.castShadow = true; g.add(m); }
    else if (kind === 'orb') {
      const geo = this._orbG || (this._orbG = (() => { const q = new GB(); q.sph(.24, 12, 8, '#ffe89a'); return q.build({ noUV: true }); })());
      const o = new THREE.Mesh(geo, MAT.glow); o.position.y = .6; g.add(o); g.userData.spin = o;
      const halo = new THREE.Mesh(new THREE.RingGeometry(.3, .5, 24), new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: .4, side: THREE.DoubleSide, depthWrite: false })); halo.rotation.x = -Math.PI / 2; halo.position.y = .03; g.add(halo);
    } else if (kind === 'frag') {
      const geo = this._fragG || (this._fragG = (() => { const q = new GB(); q.cyl(0, .2, .28, 6, '#f3c85a', { ao: [.8, 1.2] }); q.push().t(0, .28, 0).rx(Math.PI).cyl(0, .2, .28, 6, '#ffe08a', { ao: [.8, 1.2] }).pop(); return q.build({ noUV: true }); })());
      const o = new THREE.Mesh(geo, MAT.glow); o.position.y = .6; g.add(o); g.userData.spin = o;
      const glow = new THREE.Mesh(new THREE.RingGeometry(.2, .34, 20), new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: .5, side: THREE.DoubleSide, depthWrite: false })); glow.rotation.x = -Math.PI / 2; glow.position.y = .03; g.add(glow);
    } else if (kind === 'bar') {
      const geo = this._barG || (this._barG = (() => { const q = new GB(); for (let i = 0; i < 4; i++) q.bx(-.36 + i * .24, .55, 0, .06, 1.1, .06, '#8890a0', { ao: [.6, 1.1] }); q.bx(0, .8, 0, 1, .1, .08, '#e8c048'); q.bx(0, .4, 0, 1, .07, .06, '#8890a0'); return q.build(); })());
      g.add(new THREE.Mesh(geo, MAT.rigid));
    }
    g.traverse(o => { if (o.isMesh && o.material === MAT.rigid) o.castShadow = true; });
    if (!this.hi && kind !== 'orb') g.add(this.blob(.25));
    return { g, kind };
  },
  entFor(o) {
    const d = o.def;
    if (d.s) return this.humanEnt(d.s);
    if (d.sign) return this.signEnt(String(typeof d.sign === 'string' ? d.sign.split(/[.!?\n]/)[0] : 'PAPAN').slice(0, 26));
    if (d.ball === 'cahaya') return this.itemEnt('orb');
    if (d.item || d.ball) return this.itemEnt('ball');
    if (d.bar) return this.itemEnt('bar');
    if (d.mon) { const g = this.mon(d.mon, .7); const e = { g, kind: 'mon', ang: -.5, x: 0, z: 0, spd: 0 }; if (!this.hi) g.add(this.blob(.5)); return e; }
    if (d.frag) return this.itemEnt('frag');
    return null;
  },
  // matikan/hidupkan garis luar (kos draw call) mengikut jarak
  outline(g, on) {
    if (g.userData.olOn === on) return; g.userData.olOn = on;
    if (!g.userData.ols) { g.userData.ols = []; g.traverse(o => { if (o.isMesh && o.material && o.material.isShaderMaterial && o.material.side === THREE.BackSide) g.userData.ols.push(o); }); }
    for (const o of g.userData.ols) o.visible = on;
  },
  updateEnts(dt, px, py, pz, fx, fz) {
    const t = Game.t, p = World.p, seen = new Set(), hi = this.hi;
    // pemain
    if (!this.player || this.playerLook !== S.look) {
      if (this.player) this.world.remove(this.player);
      this.player = this.human(S.look); this.playerLook = S.look; this.world.add(this.player);
      if (!hi) this.player.add(this.blob(.45));
    }
    const pl = this.player, u = pl.userData, run = S.bike || (Input.held.b && p.speed > 3) || (Input.analog && p.speed > 5.5);
    const moving = p.speed > .3;
    let ly = 0;
    if (S.surf) ly = .28;
    if (S.bike) ly = .17;
    pl.position.set(px, py + ly + (p.jump || 0), pz);
    pl.rotation.y = p.ang;
    this.poseHuman(pl, S.bike ? 0 : p.speed, run && !S.bike, dt, undefined);
    if (S.bike) { // duduk di atas basikal: kaki melipat, tangan pada pemegang
      u.lL.rotation.x = -.85; u.lR.rotation.x = -.85; u.aL.rotation.x = -.9; u.aR.rotation.x = -.9; u.body.rotation.x = .12;
    }
    if (S.bike && !this.bike) { this.bike = this.mkBike(); this.world.add(this.bike); }
    if (!S.bike && this.bike) { this.world.remove(this.bike); this.bike = null; }
    if (this.bike) {
      this.bike.position.set(px, py + (p.jump || 0), pz); this.bike.rotation.y = p.ang;
      const rot = p.walk * .55; this.bike.userData.wf.rotation.x = rot; this.bike.userData.wb.rotation.x = rot;
    }
    const lead = S.surf ? (S.party.find(m => m.moves.some(q => q.id === 'ombak')) || S.party[0]) : null;
    if (lead && (!this.surfMon || this.surfMon.userData.name !== lead.sp)) { if (this.surfMon) this.world.remove(this.surfMon); this.surfMon = this.mon(lead.sp, .6); this.world.add(this.surfMon); }
    if (!lead && this.surfMon) { this.world.remove(this.surfMon); this.surfMon = null; }
    if (this.surfMon) { const sm = this.surfMon; sm.position.set(px, py - .12 + Math.sin(t * 3) * .03, pz); sm.rotation.y = p.ang; sm.userData.update(t); if (moving && Math.random() < dt * 14) this.burst(px - Math.sin(p.ang) * .3, py + .02, pz - Math.cos(p.ang) * .3, '#ffffff', 1, { speed: .5, up: .5, size: .12, life: .5, grav: 0 }); }
    // habuk kaki / percikan
    this.stepT = (this.stepT || 0) - dt;
    if (moving && this.stepT <= 0 && !S.surf) {
      const tt = World.tile(p.x, p.y), col = tt === 's' ? '#f4e6bc' : tt === ',' ? '#7cc84c' : '#c8b088';
      this.stepT = run ? .09 : .2;
      if (run || tt === ',' || tt === 's') this.burst(px - Math.sin(p.ang) * .15, py + .05, pz - Math.cos(p.ang) * .15, col, run ? 3 : 2, { speed: run ? 1 : .6, up: .7, size: run ? .1 : .07, life: .5, grav: 1.5, alpha: .7, grow: 1 });
    }
    // objek dunia
    for (const o of World.objs) {
      const d = o.def; if (d.trig || d.hid) continue;
      seen.add(o);
      let e = this.ents.get(o);
      if (!e) { e = this.entFor(o); if (!e) continue; this.ents.set(o, e); this.world.add(e.g); e.x = o.px / 16 + .5; e.z = o.py / 16 + .5; e.ang = angOfDir(o.dir); }
      const ox = o.px / 16 + .5, oz = o.py / 16 + .5, dd = Math.hypot(ox - fx, oz - fz);
      const near = dd < 30; e.g.visible = near; if (!near) { e.x = ox; e.z = oz; continue; }
      const oy = this.hAt(ox, oz);
      if (e.kind === 'human') {
        const dx = ox - e.x, dz = oz - e.z, sp = Math.hypot(dx, dz) / Math.max(dt, 1e-4); e.spd += (Math.min(sp, 6) - e.spd) * Math.min(1, dt * 12); e.x = ox; e.z = oz;
        const toP = Math.atan2(p.wx - ox, p.wz - oz), pd = Math.hypot(p.wx - ox, p.wz - oz);
        let want = angOfDir(o.dir);
        if (o.lookT > 0 || (pd < 2.2 && !o.moving && !o.def.still && o.def.t && !o.def.tr)) want = toP;
        if (o.moving && sp > .1) want = Math.atan2(dx, dz);
        e.ang = angLerp(e.ang, want, 1 - Math.exp(-dt * 11));
        e.g.position.set(ox, oy, oz); e.g.rotation.y = e.ang;
        // kepala menoleh ke pemain jika dekat, atau melihat sekeliling secara rawak
        e.lookT -= dt; if (e.lookT <= 0) { e.lookT = 1.5 + Math.random() * 3; e.lookA = Math.random() < .5 ? (Math.random() - .5) * 1.2 : 0; }
        let ly2 = e.lookA;
        if (pd < 4.5) ly2 = Math.max(-.9, Math.min(.9, _wrapA(toP - e.ang)));
        this.poseHuman(e.g, e.spd, false, dt, ly2);
        this.outline(e.g, dd < 14);
        const son = dd < 16 && this.hi; if (e.shadowOn !== son) { e.shadowOn = son; e.g.traverse(m => { if (m.isMesh) m.castShadow = son; }); }
      } else if (e.kind === 'mon') {
        e.g.position.set(ox, oy, oz); e.g.rotation.y = _wrapA(-.5 + Math.sin(t * .4 + ox) * .4); e.g.userData.update(t); this.outline(e.g, dd < 14);
      } else if (e.kind === 'ball') {
        e.g.position.set(ox, (d.u === 'K' ? .5 : oy) + .0 + Math.sin(t * 2.4 + ox * 3) * .025, oz); e.g.rotation.y = t * .8;
        if (dd < 8 && Math.random() < dt * .9) this.emit(ox + (Math.random() - .5) * .3, oy + .25 + Math.random() * .2, oz + (Math.random() - .5) * .3, { vy: .5, life: .8, size: .07, grav: 0, color: '#fff6c0' });
      } else if (e.kind === 'orb' || e.kind === 'frag') {
        e.g.position.set(ox, oy, oz); const s = e.g.userData.spin; s.rotation.y = t * 2; s.position.y = .6 + Math.sin(t * 3) * .08;
        if (dd < 9 && Math.random() < dt * 2.4) this.emit(ox + (Math.random() - .5) * .5, oy + .3 + Math.random() * .6, oz + (Math.random() - .5) * .5, { vy: .35, life: .9, size: .09, grav: 0, color: e.kind === 'orb' ? '#fff0a0' : '#ffd870' });
      } else if (e.kind === 'sign' || e.kind === 'bar') { e.g.position.set(ox, oy, oz); }
    }
    for (const [o, e] of this.ents) if (!seen.has(o)) { this.world.remove(e.g); this.ents.delete(o); }
    // Monsta pengikut
    const fm = World.followerMon(), F = World.fol;
    if (fm && F) {
      if (!this.fol || this.folName !== fm.sp) { if (this.fol) this.world.remove(this.fol); this.fol = this.mon(fm.sp, .38); this.folName = fm.sp; this.world.add(this.fol); if (!hi) this.fol.add(this.blob(.35)); this.fol.userData.hop = 0; }
      const g = this.fol, fy = this.hAt(F.x, F.z), hop = Math.abs(Math.sin(F.walk * Math.PI)) * Math.min(1, F.speed / 2) * .1;
      g.position.set(F.x, fy + hop, F.z); g.rotation.y = F.ang; g.rotation.z = Math.sin(F.walk * Math.PI) * .1 * Math.min(1, F.speed / 3); g.userData.update(t);
      g.visible = Math.hypot(F.x - fx, F.z - fz) < 40; this.outline(g, true);
    } else if (this.fol) { this.world.remove(this.fol); this.fol = null; this.folName = null; }
    // portal
    for (const pg of this.portals) { pg.userData.ring.rotation.z = t * 1.5; pg.userData.core.material.opacity = .55 + Math.sin(t * 3) * .2; if (Math.random() < dt * 5) this.emit(pg.position.x + (Math.random() - .5) * .8, pg.position.y + .3 + Math.random() * .7, pg.position.z + (Math.random() - .5) * .3, { vy: .3, life: 1, size: .08, grav: 0, color: '#d0b0ff' }); }
    // air: percikan tepi & riak bunga api
    if (this.water) this.water.visible = true;
  },
  // ---------- suasana: kunang-kunang malam/gua, daun & serangga siang ----------
  updateAmbient(dt, px, py, pz) {
    this.ambT = (this.ambT || 0) - dt; if (this.ambT > 0) return; this.ambT = .12;
    const env = this.env; if (!env) return;
    const R = 9;
    if (this.outdoor && !env.stars && this.hi && Math.random() < .35) { // kelopak/daun melayang
      const a = Math.random() * 6.283, r = 3 + Math.random() * R;
      this.emit(px + Math.cos(a) * r, py + 2.4 + Math.random() * 1.6, pz + Math.sin(a) * r, { vx: -.5 - Math.random() * .4, vy: -.35, vz: (Math.random() - .5) * .4, life: 5, size: .075, grav: 0, color: Math.random() < .5 ? '#ffd0e0' : '#e8f2a0', alpha: .8 });
    }
    if (env.stars || this.cave) { // kunang-kunang
      const a = Math.random() * 6.283, r = 1.5 + Math.random() * R;
      this.emit(px + Math.cos(a) * r, py + .4 + Math.random() * 1.8, pz + Math.sin(a) * r, { vx: (Math.random() - .5) * .4, vy: (Math.random() - .3) * .25, vz: (Math.random() - .5) * .4, life: 3.5, size: .13, grav: 0, color: this.cave ? '#9ad8ff' : '#e8f890', alpha: .95 });
    }
  },
  // ---------- lukis dunia ----------
  drawWorld() {
    if (!this.ok || !World.map || !this.worldBuilt || this.map !== World.map) return false;
    Game.used3d = true; this.activeCam = this.cam;
    const dt = Math.min(Game.dt || .016, .08), p = World.p;
    if (this._wenv !== this.env) this.tuneWaterFor(this.env, World.map.theme);
    U3.uTime.value += dt; U3.uWind.value = this.cave ? .35 : 1;
    const px = p.wx, pz = p.wz, py = this.hAt(px, pz);
    U3.uPlayer.value.set(px, py, pz);
    this.updateCamera(dt, px, py, pz, p.vx, p.vz);
    this.snap = false;
    this.updateEnts(dt, px, py, pz, this.focus.x, this.focus.z);
    this.updateAmbient(dt, px, py, pz);
    this.updateChunks();
    this.updateShadow(this.lightsW, this.focus.x, this.focus.y, this.focus.z, this.hi ? (this.inside ? 9 : 14) : 12);
    // lubang pandangan di sekeliling pemain untuk objek yang menghalang kamera
    const cam = this.cam, v = this.V.set(px, py + .75, pz).applyMatrix4(cam.matrixWorldInverse), depth = -v.z; v.applyMatrix4(cam.projectionMatrix);
    const bw = this.r.domElement.width, bh = this.r.domElement.height;
    U3.uHole.value.set((v.x * .5 + .5) * bw, (v.y * .5 + .5) * bh, depth, bh * (PORTRAIT ? .085 : .12));
    this.tickParticles(dt);
    if (!this.pts.parent) this.world.add(this.pts);
    this.render(this.world, cam);
    return true;
  },
});
