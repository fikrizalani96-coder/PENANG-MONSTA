'use strict';
// ===== Model 3D gaya kartun: Monsta dibina daripada bentuk licin, watak chibi bermuka =====
// Semua model menghadap +z, kaki di y=0. Bayang sel (toon) + garis luar skrin supaya nampak seperti anime.
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const M3 = {
  _g: null,
  // geometri asas dikongsi; d = 1 butiran tinggi (pertarungan/pameran), d = 0 rendah (dunia terbuka: watak kecil di skrin)
  G(d = 1) {
    this._g = this._g || {};
    if (this._g[d]) return this._g[d];
    const S = d ? [28, 20, 14, 10, 20, 14, 40] : [12, 8, 8, 6, 10, 8, 20];
    const g = this._g[d] = {
      sph: new THREE.SphereGeometry(1, S[0], S[1]),
      sphLo: new THREE.SphereGeometry(1, S[2], S[3]),
      cone: new THREE.ConeGeometry(1, 1, S[4], 1),
      cyl: new THREE.CylinderGeometry(1, 1, 1, S[5], 1),
      tor: new THREE.TorusGeometry(1, .09, d ? 10 : 6, S[6]),
      dode: new THREE.DodecahedronGeometry(1, 0),
      ico: new THREE.IcosahedronGeometry(1, 1),
    };
    g.cone.translate(0, .5, 0); g.cyl.translate(0, .5, 0);
    g.wingBird = this.shapeGeo([[0, 0], [.3, .16], [.72, .16], [1, .02], [.9, -.1], [.8, -.05], [.7, -.2], [.56, -.13], [.44, -.28], [.3, -.2], [.14, -.26], [0, -.14]]);
    g.wingBat = this.shapeGeo([[0, .02], [.3, .3], [.68, .4], [1, .26], [.86, .08], [.72, .1], [.62, -.06], [.46, -.02], [.36, -.18], [.18, -.12], [0, -.12]]);
    g.leaf = this.shapeGeo([[0, 0], [.18, .12], [.5, .2], [.82, .14], [1, 0], [.82, -.14], [.5, -.2], [.18, -.12]], true);
    for (const k in g) g[k].userData.shared = true;
    return g;
  },
  // bentuk rata berbucu lembut (sayap/daun), menganjur ke +x, tebal pada z
  shapeGeo(pts, smooth) {
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    if (smooth) { for (let i = 1; i <= pts.length; i++) { const a = pts[i - 1], b = pts[i % pts.length]; s.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } }
    else for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: .03, bevelEnabled: true, bevelThickness: .025, bevelSize: .02, bevelSegments: 2, curveSegments: 6 });
    g.translate(0, 0, -.015); g.computeVertexNormals();
    return g;
  },
  _grad: null,
  grad() {
    if (this._grad) return this._grad;
    const d = new Uint8Array([120, 120, 120, 255, 190, 190, 190, 255, 255, 255, 255, 255]);
    const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
    t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
    return (this._grad = t);
  },
  // gabung geometri berindeks dengan warna bucu; balikkan susunan segi tiga jika dicerminkan
  merge(parts) {
    let nv = 0, ni = 0;
    for (const [g] of parts) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
    const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), col = new Float32Array(nv * 3), idx = new Uint32Array(ni);
    const v = V3(), n = V3(), nm = new THREE.Matrix3();
    let ov = 0, oi = 0;
    for (const [g, mtx, c] of parts) {
      const P = g.attributes.position, N = g.attributes.normal, cnt = P.count;
      nm.getNormalMatrix(mtx);
      for (let i = 0; i < cnt; i++) {
        v.fromBufferAttribute(P, i).applyMatrix4(mtx); n.fromBufferAttribute(N, i).applyMatrix3(nm).normalize();
        const k = (ov + i) * 3; pos[k] = v.x; pos[k + 1] = v.y; pos[k + 2] = v.z; nor[k] = n.x; nor[k + 1] = n.y; nor[k + 2] = n.z; col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b;
      }
      const flip = mtx.determinant() < 0, I = g.index;
      const m = I ? I.count : cnt;
      for (let i = 0; i < m; i += 3) {
        const a = I ? I.getX(i) : i, b = I ? I.getX(i + 1) : i + 1, d = I ? I.getX(i + 2) : i + 2;
        idx[oi++] = ov + a; idx[oi++] = ov + (flip ? d : b); idx[oi++] = ov + (flip ? b : d);
      }
      ov += cnt;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setIndex(new THREE.BufferAttribute(idx, 1)); geo.computeBoundingSphere();
    return geo;
  },
  _olvc: null,
  outlineVC() {
    return this._olvc || (this._olvc = new THREE.ShaderMaterial({
      uniforms: { uW: this.OW }, side: THREE.BackSide, vertexColors: true,
      vertexShader: 'uniform float uW; varying vec3 vC; void main(){ vC = color * .093; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vec4 n = projectionMatrix * vec4(normalMatrix * normal, 0.0); vec2 d = n.xy; float l = length(d); if (l > 1e-5) d /= l; p.xy += d * uW * p.w; gl_Position = p; }',
      fragmentShader: 'varying vec3 vC; void main(){ gl_FragColor = vec4(vC, 1.0); }',
    }));
  },
  toon(color, o = {}) { return new THREE.MeshToonMaterial(Object.assign({ color, gradientMap: this.grad() }, o)); },
  OW: { value: .0032 },
  _ol: {},
  outline(color) {
    const key = color;
    if (this._ol[key]) return this._ol[key];
    const c = new THREE.Color(typeof color === 'string' ? shade(color, -.66) : color);
    const m = new THREE.ShaderMaterial({
      uniforms: { uW: this.OW, uC: { value: c } }, side: THREE.BackSide,
      vertexShader: 'uniform float uW; void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vec4 n = projectionMatrix * vec4(normalMatrix * normal, 0.0); vec2 d = n.xy; float l = length(d); if (l > 1e-5) d /= l; p.xy += d * uW * p.w; gl_Position = p; }',
      fragmentShader: 'uniform vec3 uC; void main(){ gl_FragColor = vec4(uC, 1.0); }',
    });
    return (this._ol[key] = m);
  },
};

// ---------- Pembina model ----------
class Rig {
  constructor(detail = 1) { this.root = new THREE.Group(); this.mats = []; this.eyes = []; this.flames = []; this.wings = []; this.tails = []; this.G = M3.G(detail); }
  mat(color, mo) { const m = M3.toon(color, mo); m.userData.base = { color: m.color.clone(), emissive: m.emissive.clone() }; this.mats.push(m); return m; }
  add(geo, color, pos, scl, o = {}) {
    const m = new THREE.Mesh(geo, this.mat(color, o.mo));
    m.position.copy(pos.isVector3 ? pos : V3(...pos));
    if (typeof scl === 'number') m.scale.setScalar(scl); else m.scale.set(...scl);
    if (o.q) m.quaternion.copy(o.q); else if (o.rot) m.rotation.set(...o.rot);
    m.castShadow = o.shadow !== false; m.receiveShadow = false;
    (o.parent || this.root).add(m);
    if (o.ol !== false) { const ol = new THREE.Mesh(geo, M3.outline(color)); m.add(ol); }
    return m;
  }
  // orientasi: paksi-y tempatan ke arah dir, paksi-z mengikut petunjuk
  basis(dir, hint = V3(0, 0, 1)) {
    const y = dir.clone().normalize();
    let z = hint.clone().sub(y.clone().multiplyScalar(hint.dot(y)));
    if (z.lengthSq() < 1e-6) z = Math.abs(y.x) < .9 ? V3(1, 0, 0) : V3(0, 0, 1);
    z.normalize(); const x = V3().crossVectors(y, z);
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  }
  ell(c, r, color, o = {}) { return this.add(this.G.sph, color, c, typeof r === 'number' ? [r, r, r] : r, o); }
  // elipsoid memanjang dari a ke b (anggota badan)
  seg(a, b, r, color, o = {}) {
    const A = V3(...a), B = V3(...b), d = B.clone().sub(A), L = d.length();
    const rr = Array.isArray(r) ? r : [r, r];
    return this.add(this.G.sph, color, A.clone().add(B).multiplyScalar(.5), [rr[0], L / 2 + rr[0] * .35, rr[1]], Object.assign({ q: this.basis(d, o.hint ? V3(...o.hint) : undefined) }, o));
  }
  cone(a, b, r, color, o = {}) {
    const A = V3(...a), B = V3(...b), d = B.clone().sub(A);
    const rr = Array.isArray(r) ? r : [r, r];
    return this.add(this.G.cone, color, A, [rr[0], d.length(), rr[1]], Object.assign({ q: this.basis(d, o.hint ? V3(...o.hint) : undefined) }, o));
  }
  cyl(a, b, r, color, o = {}) {
    const A = V3(...a), B = V3(...b), d = B.clone().sub(A);
    return this.add(this.G.cyl, color, A, [r, d.length(), r], Object.assign({ q: this.basis(d) }, o));
  }
  // tiub tirus mengikut lengkung (ekor, leher, ular, sesungut)
  tube(pts, r0, r1, color, o = {}) {
    const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)));
    const T = o.seg || 28, R = 12;
    const g = new THREE.TubeGeometry(curve, T, 1, R, false);
    const pos = g.attributes.position, P = V3();
    for (let i = 0; i <= T; i++) {
      const t = i / T; curve.getPointAt(t, P);
      const r = r0 + (r1 - r0) * (o.ease ? o.ease(t) : t);
      for (let j = 0; j <= R; j++) { const k = i * (R + 1) + j; pos.setXYZ(k, P.x + (pos.getX(k) - P.x) * r, P.y + (pos.getY(k) - P.y) * r, P.z + (pos.getZ(k) - P.z) * r); }
    }
    g.computeBoundingSphere();
    const m = this.add(g, color, [0, 0, 0], 1, o);
    if (o.cap !== false) { this.ell(pts[0], r0, color, { parent: o.parent, ol: o.ol }); if (r1 > .015) this.ell(pts[pts.length - 1], r1, color, { parent: o.parent, ol: o.ol }); }
    m.userData.curve = curve;
    return m;
  }
  // titik pada permukaan elipsoid + normal
  surf(c, r, dir) {
    const d = V3(...dir).normalize();
    const k = 1 / Math.sqrt((d.x / r[0]) ** 2 + (d.y / r[1]) ** 2 + (d.z / r[2]) ** 2);
    const p = d.clone().multiplyScalar(k).add(V3(...c));
    const n = V3(d.x / r[0] ** 2, d.y / r[1] ** 2, d.z / r[2] ** 2).normalize();
    return [p, n];
  }
  // tampalan rata di permukaan (tompok, sisik, tanda)
  patch(c, r, dir, size, color, o = {}) {
    const [p, n] = this.surf(c, r, dir);
    const s = Array.isArray(size) ? size : [size, size];
    return this.ell(p.addScaledVector(n, -(o.sink || .35) * (s[2] || s[0] * .3)), [s[0], s[2] || s[0] * .3, s[1]], color, Object.assign({ q: this.basis(n, V3(0, 0, 1)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, o.spin || 0, 0))) }, o));
  }
  // mata anime: putih + anak mata + kilauan
  eye(c, r, dir, size, o = {}) {
    const [p, n] = this.surf(c, r, dir);
    const g = new THREE.Group(); g.position.copy(p).addScaledVector(n, -size * .12);
    g.quaternion.setFromUnitVectors(V3(0, 0, 1), n);
    (o.parent || this.root).add(g);
    const inner = new THREE.Group(); g.add(inner);
    this.add(this.G.sph, o.white || '#fbfbf4', [0, 0, 0], [size * .74, size, size * .34], { parent: inner, shadow: false });
    const fw = V3(0, 0, 1).applyQuaternion(g.quaternion.clone().invert());
    const px = fw.x * size * .22, py = fw.y * size * .12 - size * .04;
    this.add(this.G.sph, o.iris || '#1c1c26', [px, py, size * .14], [size * .52, size * .74, size * .28], { parent: inner, ol: false, shadow: false });
    if (o.iris) this.add(this.G.sph, '#141418', [px, py, size * .22], [size * .3, size * .46, size * .22], { parent: inner, ol: false, shadow: false });
    this.add(this.G.sphLo, '#ffffff', [px + size * .16, py + size * .3, size * .36], size * .17, { parent: inner, ol: false, shadow: false, mo: { emissive: 0x777777 } });
    this.eyes.push(inner);
    return g;
  }
  flame(p, s, o = {}) {
    const g = new THREE.Group(); g.position.set(...p); (o.parent || this.root).add(g);
    const em = c => ({ emissive: c, emissiveIntensity: .75 });
    this.add(this.G.sph, '#f07a26', [0, s * .2, 0], [s * .5, s * .5, s * .5], { parent: g, mo: em(0xd04a10), shadow: false });
    this.add(this.G.cone, '#f07a26', [0, s * .3, 0], [s * .46, s * 1.25, s * .46], { parent: g, mo: em(0xd04a10), shadow: false });
    this.add(this.G.sph, '#ffd84a', [0, s * .18, s * .12], [s * .3, s * .32, s * .3], { parent: g, ol: false, mo: em(0xe0a020), shadow: false });
    this.add(this.G.cone, '#ffd84a', [0, s * .25, s * .12], [s * .26, s * .8, s * .26], { parent: g, ol: false, mo: em(0xe0a020), shadow: false });
    this.flames.push(g);
    return g;
  }
  // daun/sirip rata: pangkal di a, menghala dir, rata mengikut 'flat' (normal permukaan)
  leaf(a, dir, len, wid, color, o = {}) {
    const g = this.G.leaf;
    const d = V3(...dir).normalize(), f = V3(...(o.flat || [0, 0, 1])).normalize();
    const x = d, z = f.clone().sub(d.clone().multiplyScalar(f.dot(d))).normalize(), y = V3().crossVectors(z, x);
    const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
    return this.add(g, color, a, [len, wid / .4, o.thick || 1], Object.assign({ q }, o));
  }
  wing(kind, side, pivot, o = {}) {
    const pg = new THREE.Group(); pg.position.set(...pivot); (o.parent || this.root).add(pg);
    const holder = new THREE.Group(); pg.add(holder);
    const w = this.add(kind === 'bat' ? this.G.wingBat : this.G.wingBird, o.color, [0, 0, 0], [o.size * side, o.size, 1], { parent: holder, mo: o.mo, ol: o.ol });
    holder.rotation.set(...(o.rot || [0, 0, 0]));
    if (side < 0) holder.rotation.y = -holder.rotation.y, holder.rotation.z = -holder.rotation.z;
    pg.userData = { side, base: holder.rotation.clone(), holder, amp: o.amp || .35 };
    this.wings.push(pg);
    return pg;
  }
  // gabungkan bahagian statik dalam setiap kumpulan kepada satu jaringan (kurangkan draw call)
  bake(node = this.root) {
    const kids = node.children.slice();
    const plain = m => m.isMesh && m.material.isMeshToonMaterial && !m.material.map && !m.material.transparent && m.material.emissive.getHex() === 0;
    const list = kids.filter(plain);
    for (const k of kids) if (!k.isMesh || !plain(k)) this.bake(k);
    if (list.length < 2) return;
    const parts = [], olParts = [];
    for (const m of list) {
      m.updateMatrix();
      const hasOl = m.children.some(c => c.material && c.material.isShaderMaterial);
      parts.push([m.geometry, m.matrix, m.material.color]);
      if (hasOl) olParts.push([m.geometry, m.matrix, m.material.color]);
      node.remove(m);
      const i = this.mats.indexOf(m.material); if (i >= 0) this.mats.splice(i, 1);
    }
    const mat = M3.toon('#ffffff', { vertexColors: true }); mat.userData.base = { color: mat.color.clone(), emissive: mat.emissive.clone() }; this.mats.push(mat);
    const mesh = new THREE.Mesh(M3.merge(parts), mat); mesh.castShadow = true; node.add(mesh);
    if (olParts.length) mesh.add(new THREE.Mesh(M3.merge(olParts), M3.outlineVC()));
  }
  finish(o = {}) {
    this.bake();
    const box = new THREE.Box3().setFromObject(this.root);
    const sz = box.getSize(V3());
    const scale = (o.size || 1.7) / Math.max(sz.y, sz.x * .8, sz.z * .55, .2);
    this.root.scale.setScalar(scale);
    this.root.position.set(-(box.min.x + box.max.x) / 2 * scale, -(o.hover ? box.min.y - o.hover : box.min.y) * scale, -(box.min.z + box.max.z) / 2 * scale * .5);
    return this.root;
  }
}

// ---------- Monsta ----------
const MonModel = {
  pal(sp) {
    const [m, s2, l, ex] = sp.c;
    return { M: m, S: s2, L: l, X: ex || s2, D: shade(m, -.26), SD: shade(s2, -.22), B: '#f1e8cf', Y: '#f8d848', O: '#f09838', R: '#e03838', K: '#2a2230' };
  },
  build(name, detail = 1) {
    const sp = SP[name];
    const r = new Rig(detail), P = this.pal(sp), F = new Set(sp.f || []);
    const plan = sp.b === 'raksasa' ? 'tegak' : sp.b;
    const info = (this.plans[plan] || this.plans.blob).call(this, r, P, F) || {};
    const inner = r.finish({ size: 1.75 * sp.k, hover: info.hover });
    const outer = new THREE.Group(); outer.add(inner);
    const baseInner = inner.position.clone(), baseScale = inner.scale.x;
    outer.userData = {
      name, inner, rig: r, hover: !!info.hover, phase: hash(sp.no, 3) * 6,
      setSize(s) { inner.scale.setScalar(baseScale * s); inner.position.copy(baseInner).multiplyScalar(s); },
      update(t) { MonModel.animate(this, t); },
      tint(mode) { if (this._tint === mode) return; this._tint = mode; for (const m of r.mats) { const b = m.userData.base; if (mode === 'white') { m.color.set(0xffffff); m.emissive.set(0xffffff); } else if (mode === 'ghost') { m.color.set(0x2a2238); m.emissive.set(0x0a0610); } else { m.color.copy(b.color); m.emissive.copy(b.emissive); } } },
    };
    return outer;
  },
  animate(u, t) {
    const r = u.rig, ph = u.phase;
    // kelip mata
    const bl = ((t + ph) % 3.6) < .12 ? .12 : 1;
    for (const e of r.eyes) e.scale.y = bl;
    for (const f of r.flames) { const k = 1 + Math.sin(t * 17 + f.id) * .08 + Math.sin(t * 29) * .05; f.scale.set(1 / k, k, 1 / k); }
    for (const w of r.wings) { const d = w.userData; d.holder.rotation.z = d.base.z + Math.sin(t * 5 + ph) * d.amp * d.side; }
    for (const tl of r.tails) tl.rotation.y = Math.sin(t * 2.4 + ph) * .18;
    if (u.hover) u.inner.position.y += (Math.sin(t * 2 + ph) * .04 - (u._hy || 0)), u._hy = Math.sin(t * 2 + ph) * .04;
  },
  plans: {
    // ----- berkaki empat -----
    kaki4(r, P, F) {
      const big = F.has('kepalabesar'), shell = F.has('tempurung');
      const legH = .24, bw = .33, bh = .29, bl = .44, by = legH + bh * .85;
      for (const [x, z] of [[-.19, .25], [.19, .25], [-.19, -.24], [.19, -.24]]) {
        r.seg([x, by - .04, z], [x * 1.08, .09, z + .02], .1, P.M);
        r.ell([x * 1.08, .06, z + .05], [.1, .065, .12], P.D);
      }
      // ekor
      if (F.has('ekorlebat')) {
        const t = new THREE.Group(); t.position.set(0, by + .05, -bl * .85); r.root.add(t); r.tails.push(t);
        r.seg([0, 0, 0], [0, .5, -.28], [.2, .17], P.S, { parent: t });
        r.ell([0, .52, -.26], [.14, .15, .13], P.L, { parent: t });
      } else if (!F.has('tanpaekor')) {
        const t = new THREE.Group(); t.position.set(0, by + .02, -bl * .88); r.root.add(t); r.tails.push(t);
        r.tube([[0, 0, 0], [0, .12, -.22], [0, .36, -.34], [0, .52, -.3]], .075, .04, shell ? P.M : P.S, { parent: t });
        if (F.has('api')) r.flame([0, .54, -.3], .2, { parent: t });
      }
      r.ell([0, by, 0], [bw, bh, bl], P.M);
      if (!shell) r.ell([0, by - .07, .12], [bw * .78, bh * .78, bl * .8], P.L);
      if (shell) {
        const sc = [0, by + .06, -.03], sr = [bw * 1.14, bh * .98, bl * 1.1];
        r.ell(sc, sr, P.S);
        r.add(r.G.tor, P.B, [0, by - .06, -.03], [bw * 1.12, bl * 1.08, .6], { rot: [Math.PI / 2, 0, 0] });
        for (const [dx, dz] of [[0, 0], [-.5, .45], [.5, .45], [-.5, -.45], [.5, -.45]]) r.patch(sc, sr, [dx, 1, dz], [.11, .11, .03], P.SD, { ol: false });
      }
      if (F.has('belang')) for (const z of [-.18, .02, .2]) { const f = Math.sqrt(1 - (z / bl) ** 2); r.add(r.G.tor, P.S, [0, by, z], [bw * f * 1.01, bh * f * 1.01, .7], { ol: false }); }
      if (F.has('bintik')) for (let i = 0; i < 6; i++) r.patch([0, by, 0], [bw, bh, bl], [(i % 2 ? .4 : -.4) + (i % 3 - 1) * .1, 1, -.6 + i * .24], .06, P.L, { ol: false });
      if (F.has('sisik')) for (let i = 0; i < 4; i++) for (const s of [-1, 0, 1]) r.patch([0, by, 0], [bw, bh, bl], [s * .6, 1, -.7 + i * .45], [.1, .12, .035], P.D, { spin: 0 });
      if (F.has('duri')) for (let i = 0; i < 5; i++) { const [p, n] = r.surf([0, by, 0], [bw, bh, bl], [0, 1, -.7 + i * .3]); r.cone(p.toArray(), p.clone().addScaledVector(n.add(V3(0, 0, -.5)).normalize(), .18).toArray(), [.06, .04], P.S, { hint: [1, 0, 0] }); }
      if (F.has('daun')) {
        const b = [0, by + bh * .85, -.06];
        r.cyl([0, by + bh * .7, -.06], [0, by + bh + .12, -.08], .03, P.SD);
        r.leaf(b, [.55, .75, -.25], .5, .2, P.S, { flat: [0, .4, 1] });
        r.leaf(b, [-.55, .75, -.25], .5, .2, P.S, { flat: [0, .4, 1] });
        r.ell([0, by + bh + .14, -.08], [.07, .1, .07], P.X);
      }
      if (F.has('bunga')) { const c = V3(0, by + bh + .06, -.04); for (let a = 0; a < 5; a++) { const ang = a / 5 * Math.PI * 2; r.ell([c.x + Math.cos(ang) * .13, c.y, c.z + Math.sin(ang) * .13], [.1, .045, .1], P.X); } r.ell(c.toArray(), [.07, .06, .07], P.Y); }
      if (F.has('sayap')) {
        r.wing('bird', 1, [bw * .55, by + bh * .55, .08], { color: P.S, size: .62, rot: [-.2, -.35, .5] });
        r.wing('bird', -1, [-bw * .55, by + bh * .55, .08], { color: P.S, size: .62, rot: [-.2, -.35, .5] });
      }
      // kepala
      const hr = big ? .35 : .29, hc = [0, by + bh * .5 + hr * .5, bl * .8], hR = [hr, hr * .92, hr * .95];
      if (F.has('surai')) for (let i = 0; i < 7; i++) { const a = -1.3 + i * .43; r.flame([Math.sin(a) * hr * .95, hc[1] + Math.cos(a) * hr * .7, hc[2] - hr * .55], .2 + (i % 2) * .05); }
      r.ell(hc, hR, P.M);
      r.ell([0, hc[1] - hr * .3, hc[2] + hr * .6], [hr * .5, hr * .38, hr * .44], P.L);
      r.ell([0, hc[1] - hr * .16, hc[2] + hr * 1.02], [hr * .13, hr * .09, hr * .08], P.K, { ol: false });
      const es = hr * (F.has('matabesar') ? .36 : .28);
      r.eye(hc, hR, [.43, .22, .87], es); r.eye(hc, hR, [-.43, .22, .87], es);
      if (F.has('telinga')) for (const s of [-1, 1]) {
        const b = [s * hr * .5, hc[1] + hr * .6, hc[2] - hr * .15], t = [s * hr * .95, hc[1] + hr * 1.5, hc[2] - hr * .3];
        r.cone(b, t, [hr * .3, hr * .16], P.M);
        r.cone([b[0], b[1] + .02, b[2] + .03], [t[0] * .95, t[1] - .06, t[2] + .03], [hr * .18, hr * .08], P.L, { ol: false });
      }
      if (F.has('telingabulat')) for (const s of [-1, 1]) { r.ell([s * hr * .72, hc[1] + hr * .62, hc[2] - hr * .1], [hr * .36, hr * .36, hr * .13], P.M); r.ell([s * hr * .72, hc[1] + hr * .62, hc[2] - hr * .02], [hr * .22, hr * .22, hr * .08], P.L, { ol: false }); }
      if (F.has('telingapanjang')) for (const s of [-1, 1]) r.seg([s * hr * .35, hc[1] + hr * .7, hc[2] - hr * .1], [s * hr * .6, hc[1] + hr * 2, hc[2] - hr * .4], [hr * .22, hr * .1], P.M);
      if (F.has('tanduk')) r.cone([0, hc[1] + hr * .75, hc[2] + hr * .2], [0, hc[1] + hr * 1.55, hc[2] + hr * .05], hr * .17, P.B);
      if (F.has('tandukbadak')) r.cone([0, hc[1] - hr * .05, hc[2] + hr * .85], [0, hc[1] + hr * .7, hc[2] + hr * 1.2], hr * .16, P.B);
      if (F.has('tandukkerbau')) for (const s of [-1, 1]) r.tube([[s * hr * .5, hc[1] + hr * .55, hc[2]], [s * hr * 1.15, hc[1] + hr * .75, hc[2] - hr * .1], [s * hr * 1.4, hc[1] + hr * 1.2, hc[2] - hr * .25]], hr * .15, hr * .04, P.B);
      if (F.has('misai')) for (const s of [-1, 1]) for (const dy of [-.02, .03]) r.tube([[s * hr * .35, hc[1] - hr * .3 + dy, hc[2] + hr * .85], [s * hr * .9, hc[1] - hr * .28 + dy * 2, hc[2] + hr * .75]], .012, .008, P.K, { ol: false, cap: false });
    },
    // ----- berdiri dua kaki -----
    tegak(r, P, F) {
      const big = F.has('kepalabesar'), legH = .2, bw = .29, bh = .33, by = legH + bh * .9;
      for (const s of [-1, 1]) { r.seg([s * .13, by - .15, 0], [s * .14, .1, .02], .11, P.M); r.ell([s * .14, .06, .07], [.11, .065, .14], P.D); }
      if (!F.has('tanpaekor')) {
        const t = new THREE.Group(); t.position.set(0, by - .12, -bw * .7); r.root.add(t); r.tails.push(t);
        const col = F.has('ekor2') ? P.S : P.M;
        r.tube([[0, 0, 0], [0, -.08, -.22], [0, .04, -.42], [0, .28, -.5]], .1, .045, col, { parent: t });
        if (F.has('api')) r.flame([0, .3, -.5], .22, { parent: t });
      }
      if (F.has('sayap')) {
        r.wing('bat', 1, [bw * .4, by + bh * .5, -bw * .6], { color: P.S, size: .75, rot: [.1, .5, .45] });
        r.wing('bat', -1, [-bw * .4, by + bh * .5, -bw * .6], { color: P.S, size: .75, rot: [.1, .5, .45] });
      }
      r.ell([0, by, 0], [bw, bh, bw * .9], P.M);
      r.ell([0, by - .05, .1], [bw * .72, bh * .78, bw * .68], P.L);
      if (F.has('bengkung')) r.add(r.G.tor, P.X, [0, by - .06, 0], [bw * 1.02, bw * .92, .6], { rot: [Math.PI / 2, 0, 0] });
      if (F.has('bulu')) for (let i = 0; i < 3; i++) r.cone([(i - 1) * .12, by + bh * .6, -bw * .5], [(i - 1) * .16, by + bh * .95, -bw * .75], .07, P.M);
      for (const s of [-1, 1]) {
        const sh = [s * bw * .82, by + bh * .45, .03];
        if (F.has('sabit')) {
          r.seg(sh, [s * bw * 1.2, by + .02, .12], .07, P.M);
          r.tube([[s * bw * 1.2, by + .02, .14], [s * bw * 1.35, by + .22, .32], [s * bw * 1.1, by + .5, .42]], .07, .01, P.B);
        } else {
          r.seg(sh, [s * bw * 1.25, by - .06, .13], .075, P.M);
          const glove = F.has('sarungtangan');
          r.ell([s * bw * 1.3, by - .12, .15], glove ? .12 : .085, glove ? P.X : P.M);
        }
      }
      const hr = big ? .37 : .31, hc = [0, by + bh * .75 + hr * .78, .04], hR = [hr, hr * .93, hr * .9];
      if (F.has('telinga')) for (const s of [-1, 1]) { const b = [s * hr * .5, hc[1] + hr * .55, hc[2] - hr * .1], t = [s * hr * .9, hc[1] + hr * 1.45, hc[2] - hr * .2]; r.cone(b, t, [hr * .3, hr * .15], P.M); r.cone([b[0], b[1] + .02, b[2] + .03], [t[0] * .95, t[1] - .06, t[2] + .03], [hr * .17, hr * .07], P.L, { ol: false }); }
      if (F.has('telingabulat')) for (const s of [-1, 1]) { r.ell([s * hr * .95, hc[1] + hr * .15, hc[2] - hr * .1], [hr * .14, hr * .3, hr * .28], P.S); r.ell([s * hr * .99, hc[1] + hr * .15, hc[2] - hr * .06], [hr * .08, hr * .18, hr * .16], P.L, { ol: false }); }
      r.ell(hc, hR, P.M);
      if (F.has('muka')) r.ell([0, hc[1] - hr * .1, hc[2] + hr * .32], [hr * .76, hr * .66, hr * .66], P.L);
      if (F.has('moncong')) { r.ell([0, hc[1] - hr * .32, hc[2] + hr * .68], [hr * .46, hr * .32, hr * .4], P.L); for (const s of [-1, 1]) r.ell([s * hr * .12, hc[1] - hr * .22, hc[2] + hr * 1.05], [hr * .05, hr * .04, hr * .03], P.K, { ol: false }); }
      else r.ell([0, hc[1] - hr * .42, hc[2] + hr * .86], [hr * .14, hr * .05, hr * .04], P.K, { ol: false });
      const es = hr * (F.has('matabesar') ? .38 : .27);
      r.eye(hc, hR, [.4, .12, .9], es); r.eye(hc, hR, [-.4, .12, .9], es);
      if (F.has('jambul')) r.leaf([0, hc[1] + hr * .75, hc[2] - hr * .1], [0, .6, -.8], hr * 1.3, hr * .5, P.S, { flat: [1, 0, 0] });
      if (F.has('tanduk')) for (const s of [-1, 1]) r.cone([s * hr * .38, hc[1] + hr * .72, hc[2] + hr * .05], [s * hr * .55, hc[1] + hr * 1.5, hc[2] - hr * .2], hr * .15, P.B);
      if (F.has('ikatkepala')) { r.add(r.G.tor, P.X, [0, hc[1] + hr * .3, hc[2]], [hr * .99, hr * .92, .6], { rot: [Math.PI / 2 + .15, 0, 0] }); r.leaf([0, hc[1] + hr * .3, hc[2] - hr * .92], [.3, -.3, -1], hr * .8, hr * .3, P.X, { flat: [1, 0, 0] }); }
    },
    // ----- burung -----
    burung(r, P, F) {
      const long = F.has('kakipanjang'), itik = F.has('itik'), bat = F.has('kelawar'), neck = F.has('leherpanjang');
      const legL = long ? .48 : itik ? .04 : .15, by = legL + .27;
      if (itik) for (const s of [-1, 1]) r.ell([s * .12, .04, .08], [.1, .04, .14], P.O);
      else for (const s of [-1, 1]) {
        r.cyl([s * .09, by - .18, 0], [s * .1, .03, .03], .03, P.O);
        for (const a of [-.5, 0, .5]) r.seg([s * .1, .025, .03], [s * .1 + Math.sin(a) * .1, .02, .03 + Math.cos(a) * .1], .022, P.O, { ol: false });
      }
      // ekor
      const tl = F.has('ekorpanjang') ? .75 : .32;
      const tg = new THREE.Group(); tg.position.set(0, by + .02, -.3); r.root.add(tg); r.tails.push(tg);
      const nf = F.has('ekorpanjang') ? 5 : 3;
      for (let i = 0; i < nf; i++) { const a = (i - (nf - 1) / 2) * .35; r.leaf([0, 0, 0], [Math.sin(a) * .6, .25, -1], tl, .16, i % 2 && P.X !== P.S ? P.X : P.S, { flat: [0, 1, .2], parent: tg }); }
      r.ell([0, by, 0], [.27, .27, .35], P.M);
      r.ell([0, by - .06, .1], [.2, .21, .27], P.L);
      // sayap
      if (bat) { for (const s of [-1, 1]) r.wing('bat', s, [s * .2, by + .1, -.02], { color: P.S, size: .78, rot: [0, .15, .35], amp: .5 }); }
      else if (F.has('sayapbuka')) { for (const s of [-1, 1]) r.wing('bird', s, [s * .2, by + .12, -.02], { color: P.S, size: .85, rot: [0, .2, .55], amp: .3 }); }
      else for (const s of [-1, 1]) { const w = r.ell([s * .25, by + .02, -.05], [.07, .19, .3], P.S, { rot: [.25, 0, s * -.15] }); }
      // leher & kepala
      const hr = .23 * (F.has('matabesar') ? 1.12 : 1);
      let hc = [0, by + .24 + hr * .45, .24];
      if (neck) { r.tube([[0, by + .12, .2], [0, by + .42, .28], [0, by + .68, .3]], .09, .07, P.M); hc = [0, by + .78, .36]; }
      const hR = [hr, hr * .95, hr * .95];
      if (F.has('telinga')) for (const s of [-1, 1]) r.cone([s * hr * .45, hc[1] + hr * .6, hc[2] - hr * .1], [s * hr * .8, hc[1] + hr * 1.35, hc[2] - hr * .2], [hr * .22, hr * .1], P.M);
      if (F.has('jambul')) { r.leaf([0, hc[1] + hr * .8, hc[2] - hr * .2], [0, .7, -.7], hr * 1.7, hr * .55, P.S, { flat: [1, 0, 0] }); if (P.X !== P.S) r.leaf([0, hc[1] + hr * .7, hc[2] - hr * .1], [0, .9, -.4], hr * 1.3, hr * .4, P.X, { flat: [1, 0, 0] }); }
      if (F.has('balung')) { for (let i = 0; i < 3; i++) r.ell([0, hc[1] + hr * .9, hc[2] + hr * (.3 - i * .3)], hr * .22, P.R); r.ell([0, hc[1] - hr * .7, hc[2] + hr * .75], [hr * .12, hr * .22, hr * .12], P.R); }
      r.ell(hc, hR, P.M);
      if (F.has('muka')) r.ell([0, hc[1] - hr * .05, hc[2] + hr * .35], [hr * .75, hr * .7, hr * .65], P.L);
      if (itik) r.ell([0, hc[1] - hr * .25, hc[2] + hr * .95], [hr * .48, hr * .14, hr * .5], P.O);
      else if (bat) { r.ell([0, hc[1] - hr * .25, hc[2] + hr * .9], [hr * .18, hr * .12, hr * .1], P.L); for (const s of [-1, 1]) r.cone([s * hr * .12, hc[1] - hr * .45, hc[2] + hr * .85], [s * hr * .1, hc[1] - hr * .72, hc[2] + hr * .88], hr * .06, '#ffffff', { ol: false }); }
      else r.cone([0, hc[1] - hr * .1, hc[2] + hr * .8], [0, hc[1] - hr * .22, hc[2] + hr * (F.has('paruhpanjang') ? 2.6 : 1.55)], [hr * .27, hr * .22], P.O);
      const es = hr * (F.has('matabesar') ? .42 : .27);
      const ed = F.has('matabesar') ? [.36, .2, .9] : [.55, .2, .8];
      r.eye(hc, hR, [ed[0], ed[1], ed[2]], es); r.eye(hc, hR, [-ed[0], ed[1], ed[2]], es);
      if (long) return { };
    },
    // ----- ikan -----
    ikan(r, P, F) {
      const dug = F.has('dugong'), cy = dug ? .4 : .46;
      const R = dug ? [.36, .33, .58] : [.23, .31, .5];
      const tg = new THREE.Group(); tg.position.set(0, cy, -R[2] * .85); r.root.add(tg); r.tails.push(tg);
      if (dug) for (const s of [-1, 1]) r.leaf([0, 0, 0], [s * .8, -.1, -.6], .38, .2, P.M, { flat: [0, 1, 0], parent: tg });
      else { r.leaf([0, 0, 0], [0, .6, -.8], .42, .22, P.S, { flat: [1, 0, 0], parent: tg }); r.leaf([0, 0, 0], [0, -.6, -.8], .42, .22, P.S, { flat: [1, 0, 0], parent: tg }); }
      r.ell([0, cy, 0], R, P.M);
      r.ell([0, cy - R[1] * .3, .06], [R[0] * .82, R[1] * .66, R[2] * .86], P.L);
      if (!dug) r.leaf([0, cy + R[1] * .82, -.02], [0, .55, -.8], .36, .2, P.S, { flat: [1, 0, 0] });
      for (const s of [-1, 1]) r.leaf([s * R[0] * .8, cy - R[1] * .3, R[2] * .25], [s * .8, -.4, -.4], dug ? .3 : .2, dug ? .16 : .12, dug ? P.M : P.S, { flat: [0, 1, 0] });
      if (dug) r.ell([0, cy - R[1] * .1, R[2] * .85], [R[0] * .5, R[1] * .42, R[2] * .3], P.L);
      if (F.has('belang')) for (const z of [-.2, 0, .2]) { const f = Math.sqrt(1 - (z / R[2]) ** 2); r.add(r.G.tor, P.S, [0, cy, z], [R[0] * f * 1.01, R[1] * f * 1.01, .7], { ol: false }); }
      if (F.has('bintik')) for (let i = 0; i < 6; i++) r.patch([0, cy, 0], R, [(i % 2 ? .6 : -.6), .6, -.5 + i * .2], .05, P.L, { ol: false });
      if (F.has('tanduk')) r.cone([0, cy + R[1] * .75, R[2] * .5], [0, cy + R[1] * 1.6, R[2] * .45], .07, P.B);
      if (F.has('duri')) for (let i = 0; i < 4; i++) r.cone([0, cy + R[1] * .88, .25 - i * .15], [0, cy + R[1] * 1.3, .18 - i * .15], .05, P.X);
      if (F.has('tempurung')) r.ell([0, cy + R[1] * .35, -.04], [R[0] * .9, R[1] * .6, R[2] * .7], P.S);
      if (F.has('misai')) for (const s of [-1, 1]) r.tube([[s * R[0] * .3, cy - R[1] * .2, R[2] * .92], [s * R[0] * .9, cy - R[1] * .45, R[2] * 1.05], [s * R[0] * 1.2, cy - R[1] * .9, R[2] * .95]], .016, .008, P.K, { ol: false, cap: false });
      const es = (F.has('matabesar') ? .13 : .1) * (dug ? 1.1 : 1);
      r.eye([0, cy, 0], R, [.6, .3, .75], es); r.eye([0, cy, 0], R, [-.6, .3, .75], es);
      r.ell([0, cy - R[1] * .15, R[2] * .98], [.06, .025, .03], P.K, { ol: false });
      return { hover: dug ? .05 : .12 };
    },
    kudalaut(r, P, F) {
      r.tube([[0, .42, -.02], [0, .2, .02], [0, .08, .16], [0, .14, .28], [0, .24, .22], [0, .22, .14]], .13, .04, P.M);
      r.ell([0, .6, 0], [.2, .27, .19], P.M);
      r.ell([0, .56, .08], [.14, .21, .13], P.L);
      for (let i = 0; i < 4; i++) r.add(r.G.tor, P.D, [0, .44 + i * .08, .02], [.17 - Math.abs(i - 1.5) * .02, .15, .4], { rot: [Math.PI / 2, 0, 0], ol: false });
      r.leaf([0, .6, -.16], [0, .1, -1], .3, .22, P.S, { flat: [1, 0, 0] });
      const hc = [0, .94, .04], hR = [.16, .15, .19];
      r.ell(hc, hR, P.M);
      r.tube([[0, .92, .16], [0, .9, .32], [0, .89, .44]], .06, .05, P.M);
      r.ell([0, .89, .46], [.055, .05, .02], P.D, { ol: false });
      for (let i = 0; i < 3; i++) r.cone([0, 1.04, .02 - i * .08], [0, 1.16 - i * .02, -.04 - i * .1], .04, P.S);
      if (F.has('duri')) for (let i = 0; i < 3; i++) r.cone([0, .75 - i * .12, -.16], [0, .72 - i * .12, -.32], .04, P.X);
      r.eye(hc, hR, [.6, .3, .6], .075); r.eye(hc, hR, [-.6, .3, .6], .075);
      return { hover: .05 };
    },
    // ----- ular -----
    ular(r, P, F) {
      const rock = F.has('batu');
      const pts = [[.3, .12, -.12], [.08, .12, -.4], [-.24, .12, -.32], [-.32, .12, .02], [-.12, .14, .24], [.1, .3, .22], [.12, .58, .12], [.05, .82, .12]];
      const hc = [.02, .96, .2];
      if (rock) {
        const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)));
        for (let i = 0; i < 11; i++) { const p = curve.getPointAt(i / 10); r.add(r.G.dode, i % 2 ? P.M : P.D, p, .1 + i * .008, { rot: [i, i * 2, 0] }); }
        r.add(r.G.dode, P.M, hc, [.2, .17, .22], { rot: [.3, .2, 0] });
        r.add(r.G.dode, P.D, [hc[0], hc[1] - .1, hc[2] + .12], [.14, .1, .14]);
      } else {
        r.tube(pts, .13, .1, P.M, { seg: 40, ease: t => t * t });
        const curve = new THREE.CatmullRomCurve3(pts.map(p => V3(...p)));
        for (let i = 0; i < 5; i++) { const t = .62 + i * .08, p = curve.getPointAt(Math.min(1, t)); r.ell([p.x, p.y, p.z + .075], [.075, .04, .035], P.L, { ol: false }); }
        if (F.has('sirip')) for (let i = 0; i < 4; i++) { const p = curve.getPointAt(.15 + i * .2); r.leaf([p.x, p.y + .09, p.z], [0, 1, -.3], .22, .14, P.S, { flat: [1, 0, 0] }); }
      }
      if (F.has('tudung')) { r.ell([hc[0], hc[1] - .2, hc[2] - .08], [.3, .3, .07], P.S); r.ell([hc[0], hc[1] - .22, hc[2] - .02], [.2, .22, .04], P.L, { ol: false }); for (const s of [-1, 1]) r.ell([hc[0] + s * .1, hc[1] - .24, hc[2] + .015], [.035, .025, .015], P.S, { ol: false }); }
      if (F.has('sayap')) for (const s of [-1, 1]) r.wing('bat', s, [s * .12, .6, 0], { color: P.S, size: .6, rot: [0, .3, .4] });
      const hR = [.17, .14, .22];
      if (!rock) { r.ell(hc, hR, P.M); r.ell([hc[0], hc[1] - .05, hc[2] + .08], [.13, .08, .16], P.L); }
      if (F.has('tanduk')) r.cone([hc[0], hc[1] + .1, hc[2] + .04], [hc[0], hc[1] + .34, hc[2] - .06], .05, P.B);
      if (F.has('sesungut')) for (const s of [-1, 1]) r.tube([[hc[0] + s * .08, hc[1] - .04, hc[2] + .18], [hc[0] + s * .3, hc[1] - .06, hc[2] + .22], [hc[0] + s * .42, hc[1] - .2, hc[2] + .1]], .02, .01, P.B, { ol: false });
      if (F.has('bulu')) for (const s of [-1, 1]) r.leaf([hc[0] + s * .14, hc[1] + .04, hc[2] - .08], [s * .9, .4, -.3], .24, .14, P.L, { flat: [0, 0, 1] });
      r.eye(hc, hR, [.62, .42, .62], .075); r.eye(hc, hR, [-.62, .42, .62], .075);
    },
    // ----- serangga -----
    serangga(r, P, F) {
      if (F.has('ulat')) {
        for (let i = 0; i < 5; i++) { const z = -.5 + i * .17, rr = .14 + i * .008; r.ell([0, rr, z], [rr, rr, rr * 1.05], i % 2 ? P.M : P.S); r.ell([0, .04, z], [.08, .04, .06], P.D, { ol: false }); }
        const hc = [0, .22, .38], hR = [.2, .19, .18];
        r.ell(hc, hR, P.M);
        if (F.has('sesungut')) for (const s of [-1, 1]) { r.tube([[s * .06, .38, .36], [s * .12, .52, .38], [s * .16, .58, .32]], .018, .014, P.O, { ol: false }); r.ell([s * .16, .59, .32], .035, P.O); }
        if (F.has('daun')) r.leaf([0, .28, -.52], [0, .7, -.7], .35, .2, P.X, { flat: [1, 0, 0] });
        r.eye(hc, hR, [.4, .25, .85], .07); r.eye(hc, hR, [-.4, .25, .85], .07);
        return;
      }
      if (F.has('kepompong')) {
        r.cyl([0, .88, 0], [0, 1.15, 0], .012, P.D, { ol: false });
        const c = [0, .55, 0], R = [.24, .4, .24];
        r.ell(c, R, P.M);
        for (let i = 0; i < 4; i++) { const y = .35 + i * .12, f = Math.sqrt(1 - ((y - .55) / .4) ** 2); r.add(r.G.tor, P.D, [0, y, 0], [.245 * f, .245 * f, .5], { rot: [Math.PI / 2, 0, 0], ol: false }); }
        r.ell([0, .72, .1], [.14, .12, .14], P.L);
        r.eye(c, R, [.3, .45, .85], .06, { iris: '#3a3a44' }); r.eye(c, R, [-.3, .45, .85], .06, { iris: '#3a3a44' });
        return { hover: .15 };
      }
      const ab = [0, .24, -.26], abR = [.19, .16, .26];
      r.ell(ab, abR, P.M);
      if (F.has('belang')) for (const z of [-.34, -.24, -.14]) { const f = Math.sqrt(Math.max(0, 1 - ((z - ab[2]) / abR[2]) ** 2)); r.add(r.G.tor, P.S, [0, ab[1], z], [abR[0] * f * 1.02, abR[1] * f * 1.02, .6], { ol: false }); }
      if (F.has('sengat')) r.cone([0, .24, -.5], [0, .22, -.66], .05, P.B);
      if (F.has('topi')) { r.ell([0, .38, -.22], [.32, .2, .36], P.X); r.ell([0, .3, -.22], [.3, .08, .34], P.B); for (let i = 0; i < 4; i++) r.patch([0, .38, -.22], [.32, .2, .36], [(i % 2 ? .5 : -.5), 1, i < 2 ? .5 : -.5], .06, '#ffffff', { ol: false }); }
      r.ell([0, .26, .04], [.13, .12, .12], F.has('topi') ? P.M : P.S);
      for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { const z = -.06 + i * .09; r.tube([[s * .09, .24, z], [s * .22, .22, z + (i - 1) * .05], [s * .26, .02, z + (i - 1) * .08]], .03, .022, P.D, { ol: false }); }
      if (F.has('sayap')) for (const s of [-1, 1]) r.ell([s * .15, .42, -.18], [.1, .03, .26], P.L, { rot: [.3, s * .25, s * -.4], mo: { transparent: true, opacity: .7 }, ol: false });
      const hc = [0, .32, .23], hR = [.16, .15, .15];
      r.ell(hc, hR, P.M);
      if (F.has('tanduk')) r.tube([[0, .38, .33], [0, .54, .44], [0, .7, .38], [0, .75, .28]], .06, .02, P.D);
      else for (const s of [-1, 1]) { r.tube([[s * .05, .44, .28], [s * .1, .54, .34], [s * .16, .58, .28]], .014, .01, P.D, { ol: false }); r.ell([s * .16, .58, .28], .022, P.D, { ol: false }); }
      if (F.has('sepit')) for (const s of [-1, 1]) r.cone([s * .06, .25, .35], [s * .02, .23, .47], .04, P.B);
      r.eye(hc, hR, [.6, .3, .7], .07); r.eye(hc, hR, [-.6, .3, .7], .07);
    },
    // ----- rama-rama / kunang -----
    rama(r, P, F) {
      const body = shade(P.M, -.6);
      r.seg([0, .38, -.12], [0, .58, .08], .07, body);
      if (F.has('cahaya')) r.ell([0, .34, -.16], [.1, .11, .12], P.Y, { mo: { emissive: 0xf0d040, emissiveIntensity: .9 } });
      for (const s of [-1, 1]) {
        const up = new THREE.Group(); up.position.set(s * .04, .56, -.02); r.root.add(up);
        const h = new THREE.Group(); up.add(h); h.rotation.set(0, s * -.25, s * .15);
        up.userData = { side: s, base: h.rotation.clone(), holder: h, amp: .5 }; r.wings.push(up);
        r.ell([s * .3, .12, 0], [.3, .24, .025], P.S, { parent: h });
        r.ell([s * .28, .13, .01], [.25, .19, .025], P.M, { parent: h, ol: false });
        r.ell([s * .34, .18, .025], [.08, .07, .015], P.L, { parent: h, ol: false });
        r.ell([s * .18, -.16, 0], [.19, .17, .025], P.S, { parent: h });
        r.ell([s * .18, -.16, .012], [.11, .1, .02], P.X, { parent: h, ol: false });
      }
      const hc = [0, .66, .13], hR = [.1, .1, .1];
      r.ell(hc, hR, body);
      for (const s of [-1, 1]) { r.tube([[s * .03, .74, .14], [s * .1, .88, .2], [s * .16, .96, .16]], .012, .01, body, { ol: false }); r.ell([s * .16, .96, .16], .03, body); }
      r.eye(hc, hR, [.6, .2, .75], .06, { iris: '#c83848' }); r.eye(hc, hR, [-.6, .2, .75], .06, { iris: '#c83848' });
      return { hover: .2 };
    },
    // ----- bulat (pelbagai) -----
    blob(r, P, F) {
      const floating = F.has('sesungut') || F.has('hantu') || F.has('asap') || F.has('mentol');
      let R = [.34, F.has('periuk') ? .4 : .31, .32];
      if (F.has('lumpur')) R = [.4, .28, .36];
      const cy = floating ? .7 : F.has('tikustanah') ? .3 : F.has('ais') ? .64 : R[1] + .02;
      const c = [0, cy, 0];
      let hover;
      if (F.has('sesungut')) for (let i = 0; i < 5; i++) { const a = (i - 2) * .5, x = Math.sin(a) * .22, z = Math.cos(a) * .05; r.tube([[x, cy - .18, z], [x * 1.3, cy - .45, z + .06], [x * 1.1, cy - .65, z - .02], [x * 1.4, cy - .78, z + .04]], .06, .02, P.S); }
      if (F.has('hantu')) r.tube([[0, cy - .15, -.1], [.05, cy - .4, -.25], [.2, cy - .55, -.32], [.3, cy - .5, -.42]], .22, .02, P.M, { ease: t => Math.sqrt(t) });
      if (F.has('asap')) for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; r.ell([Math.cos(a) * R[0] * 1.05, cy + Math.sin(a) * R[1] * .9, -.08 + Math.sin(i * 2) * .06], R[0] * (.36 + (i % 3) * .06), P.S); }
      if (F.has('lumpur')) { r.ell([0, .04, 0], [.62, .06, .55], P.M); for (const [x, z] of [[-.42, .3], [.45, .2], [.1, -.45]]) r.ell([x, .06, z], .09, P.M); }
      if (F.has('tikustanah')) r.ell([0, .05, 0], [.5, .16, .46], shade(P.S, -.25));
      if (F.has('batu')) for (const s of [-1, 1]) { r.seg([s * R[0] * .8, cy, 0], [s * R[0] * 1.35, cy - .08, .08], .09, P.D); r.add(r.G.dode, P.D, [s * R[0] * 1.45, cy - .12, .1], .13); }
      if (F.has('ais')) { r.cone([0, .44, 0], [0, .02, 0], .31, P.B); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; r.cyl([Math.cos(a) * .2, .1, Math.sin(a) * .2], [Math.cos(a) * .3, .43, Math.sin(a) * .3], .01, shade(P.B, -.12), { ol: false }); } }
      if (F.has('mentol')) { r.cyl([0, cy - R[1] - .22, 0], [0, cy - R[1] + .06, 0], .16, P.B); for (let i = 0; i < 3; i++) r.add(r.G.tor, P.S, [0, cy - R[1] - .15 + i * .07, 0], [.165, .165, .5], { rot: [Math.PI / 2, 0, 0], ol: false }); }
      // badan utama
      if (F.has('batu')) r.add(r.G.ico, P.M, c, R, { rot: [.2, .4, 0] });
      else if (F.has('mentol')) r.ell(c, R, P.L, { mo: { emissive: 0xfff4a0, emissiveIntensity: .35, transparent: true, opacity: .92 } });
      else if (F.has('cengkerang')) { r.ell([0, cy - .02, .02], [R[0] * .85, R[1] * .8, R[2] * .85], P.L); }
      else r.ell(c, R, P.M);
      if (F.has('cengkerang')) {
        r.ell([0, cy + .14, -.06], [R[0] * 1.25, R[1] * .5, R[2] * 1.15], P.S, { rot: [-.35, 0, 0] });
        r.ell([0, cy - .2, 0], [R[0] * 1.25, R[1] * .4, R[2] * 1.15], P.S);
        for (let i = -2; i <= 2; i++) r.patch([0, cy + .14, -.06], [R[0] * 1.25, R[1] * .5, R[2] * 1.15], [i * .3, 1, .2], [.03, .3, .02], P.SD, { ol: false });
        if (F.has('duri')) for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; r.cone([Math.cos(a) * R[0] * 1.1, cy + .12, Math.sin(a) * R[2] * 1 - .06], [Math.cos(a) * R[0] * 1.6, cy + .2, Math.sin(a) * R[2] * 1.5 - .06], .06, P.X); }
      }
      if (F.has('ais')) { const cols = [P.R, P.X, P.S, P.Y]; for (let i = 0; i < 5; i++) r.patch(c, R, [Math.cos(i * 1.3) * .6, 1, Math.sin(i * 1.3) * .6], [.13, .1, .05], cols[i % 4], { ol: false }); r.ell([0, cy + R[1] * .95, 0], .09, P.R); }
      if (F.has('periuk')) { r.add(r.G.tor, P.S, [0, cy + R[1] * .85, 0], [R[0] * .8, R[2] * .8, .7], { rot: [Math.PI / 2, 0, 0] }); r.ell([0, cy + R[1] * .88, 0], [R[0] * .7, .02, R[2] * .7], '#3a2020', { ol: false }); r.leaf([0, cy + R[1] * .9, -R[2] * .7], [0, .8, .35], .4, .3, P.S, { flat: [0, -.4, 1] }); r.cyl([0, cy - R[1], 0], [0, .0, 0], .05, P.SD); }
      const patchL = !F.has('ais') && !F.has('mentol') && !F.has('cengkerang') && !F.has('batu') && !F.has('lumpur');
      if (patchL) r.ell([0, cy - R[1] * .28, R[2] * .3], [R[0] * .7, R[1] * .6, R[2] * .75], P.L);
      if (F.has('batu')) for (let i = 0; i < 5; i++) r.patch(c, R, [Math.cos(i * 2) * .7, .5 + (i % 2) * .4, Math.sin(i * 2) * .7], [.09, .07, .05], P.D, { ol: false });
      if (F.has('bunga')) { const tc = [0, cy + R[1] * .95, 0]; for (let a = 0; a < 5; a++) { const ang = a / 5 * Math.PI * 2 + .3; r.ell([Math.cos(ang) * .2, tc[1] + .03, Math.sin(ang) * .2], [.17, .06, .15], P.X, { rot: [0, -ang, 0] }); r.ell([Math.cos(ang) * .24, tc[1] + .08, Math.sin(ang) * .24], .03, '#ffffff', { ol: false }); } r.ell([0, tc[1] + .06, 0], [.1, .07, .1], P.Y); }
      if (F.has('daun')) for (const [dx, dz] of [[.6, -.1], [-.6, -.1], [0, .5], [.25, -.7], [-.25, -.7]]) r.leaf([0, cy + R[1] * .9, 0], [dx, 1, dz], .38, .2, P.S, { flat: [-dz, 0, dx || 1] });
      if (F.has('cendawan')) { r.ell([0, cy + R[1] * .7, 0], [R[0] * 1.35, R[1] * .6, R[2] * 1.35], P.X); for (let i = 0; i < 4; i++) r.patch([0, cy + R[1] * .7, 0], [R[0] * 1.35, R[1] * .6, R[2] * 1.35], [Math.cos(i * 1.6) * .6, 1, Math.sin(i * 1.6) * .6], .06, '#ffffff', { ol: false }); }
      if (F.has('katak')) for (const s of [-1, 1]) { r.ell([s * R[0] * .55, cy + R[1] * .85, R[2] * .15], [.12, .12, .12], P.M); r.seg([s * R[0] * .85, cy - R[1] * .5, -.1], [s * R[0] * 1.05, .05, .1], .1, P.M); r.ell([s * R[0] * 1.05, .04, .16], [.1, .04, .12], P.D); }
      if (F.has('bintik')) for (let i = 0; i < 6; i++) r.patch(c, R, [Math.cos(i * 1.9) * .8, .6 + (i % 2) * .3, Math.sin(i * 1.9) * .5 - .3], .05, P.L, { ol: false });
      if (F.has('duri') && !F.has('cengkerang')) for (let i = 0; i < 5; i++) { const a = -2.2 + i * .45; const [p, n] = r.surf(c, R, [Math.cos(a) * .9, -Math.sin(a), -.3]); r.cone(p.toArray(), p.clone().addScaledVector(n, .2).toArray(), .07, P.S); }
      if (F.has('tanduk')) r.cone([0, cy + R[1] * .85, .05], [0, cy + R[1] * 1.55, 0], .08, P.B);
      if (F.has('tikustanah')) r.ell([0, cy + R[1] * .05, R[2] * .95], [.08, .065, .06], P.R);
      if (F.has('hantu')) { r.ell([0, cy - R[1] * .35, R[2] * .92], [.1, .06, .03], '#c02848', { ol: false }); }
      if (!floating && !F.has('lumpur') && !F.has('ais') && !F.has('tikustanah') && !F.has('katak')) for (const s of [-1, 1]) r.ell([s * R[0] * .5, .05, R[2] * .45], [.11, .06, .13], P.D);
      // mata
      const es = (F.has('matabesar') ? .13 : .095) * (R[0] / .34);
      if (F.has('katak')) { r.eye([-R[0] * .55, cy + R[1] * .85, R[2] * .15], [.12, .12, .12], [0, .2, 1], .09); r.eye([R[0] * .55, cy + R[1] * .85, R[2] * .15], [.12, .12, .12], [0, .2, 1], .09); r.ell([0, cy - .02, R[2] * .98], [.14, .015, .02], P.K, { ol: false }); }
      else if (F.has('satumata')) r.eye(c, R, [0, .15, 1], es * 1.7, { iris: P.S });
      else {
        const ed = F.has('cengkerang') ? [[.3, .05, .95], [-.3, .05, .95]] : [[.36, .2, .9], [-.36, .2, .9]];
        const ec = F.has('cengkerang') ? [0, cy - .02, .02] : c, eR = F.has('cengkerang') ? [R[0] * .85, R[1] * .8, R[2] * .85] : R;
        for (const d of ed) r.eye(ec, eR, d, es);
        if (!F.has('hantu') && !F.has('ais') && !F.has('mentol')) r.ell([0, cy - R[1] * .12, R[2] * .99], [.05, .02, .02], P.K, { ol: false });
      }
      if (floating) hover = .12;
      return { hover };
    },
    bintang(r, P, F) {
      const c = [0, .55, 0];
      const arms = (col, rot, z, s) => { for (let i = 0; i < 5; i++) { const a = rot + i / 5 * Math.PI * 2; r.cone([c[0], c[1], z], [c[0] + Math.sin(a) * .5 * s, c[1] + Math.cos(a) * .5 * s, z - .02], [.16 * s, .07 * s], col, { hint: [0, 0, 1] }); } r.ell([c[0], c[1], z], [.2 * s, .2 * s, .08 * s], col); };
      if (F.has('dua')) arms(P.S, Math.PI / 5, -.08, .9);
      arms(P.M, 0, 0, 1);
      r.add(r.G.tor, P.Y, [c[0], c[1], .06], [.12, .12, 1.2]);
      r.ell([c[0], c[1], .07], [.1, .1, .05], P.R, { mo: { emissive: 0xb01020, emissiveIntensity: .5 } });
      r.ell([c[0] + .03, c[1] + .04, .11], .025, '#ffffff', { ol: false, mo: { emissive: 0x888888 } });
      return { hover: .08 };
    },
    ketam(r, P, F) {
      const by = .3, R = [.4, .17, .3];
      for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const z = -.16 + i * .12; r.tube([[s * .3, by, z], [s * .52, by + .08, z - .03], [s * .64, .02, z - .06]], .045, .028, P.D); }
      if (F.has('ekortajam')) r.tube([[0, by - .05, -.28], [0, by - .08, -.55], [0, by - .06, -.85]], .04, .01, P.D);
      r.ell([0, by, 0], R, P.M);
      r.ell([0, by - .06, .04], [R[0] * .8, R[1] * .7, R[2] * .8], P.L);
      if (F.has('tempurung')) { r.ell([0, by + .06, -.03], [R[0] * 1.08, R[1] * .9, R[2] * 1.05], P.S); r.add(r.G.tor, P.B, [0, by + .01, -.03], [R[0] * 1.06, R[2] * 1.03, .5], { rot: [Math.PI / 2, 0, 0] }); }
      const cr = F.has('sepitbesar') ? .2 : .14;
      for (const s of [-1, 1]) {
        r.seg([s * .3, by + .04, .16], [s * .44, by + .14, .34], .06, P.M);
        const cc = [s * .46, by + .2, .44];
        r.ell(cc, [cr, cr * .8, cr * .95], P.S);
        r.cone([cc[0] - s * cr * .2, cc[1] + cr * .3, cc[2] + cr * .5], [cc[0] - s * cr * .4, cc[1] + cr * .45, cc[2] + cr * 1.6], [cr * .38, cr * .25], P.S);
        r.cone([cc[0] - s * cr * .2, cc[1] - cr * .2, cc[2] + cr * .5], [cc[0] - s * cr * .35, cc[1] - cr * .25, cc[2] + cr * 1.3], [cr * .3, cr * .2], P.S);
        r.cyl([s * .1, by + .12, .2], [s * .12, by + .3, .22], .03, P.M, { ol: false });
        const ec = [s * .12, by + .34, .22];
        r.ell(ec, .06, P.M);
        r.eye(ec, [.06, .06, .06], [0, .2, 1], .055);
      }
    },
  },
};

// ---------- Manusia chibi ----------
const HumanModel = {
  _face: {},
  HAT: { pakcik: 'songkok', datuk: 'songkok', kostum_emas: 'songkok', atuk: 'kopiah', nelayan: 'terendak', penjaga: 'terendak', lanun: 'bandana', lanunb: 'bandana', ketua5: 'bandana', pendekar: 'tengkolok', ketua1: 'terendak' },
  LONG: new Set(['gadis', 'ketua6', 'e4']),
  face(look) {
    if (this._face[look]) return this._face[look];
    const L = LOOKS[look] || LOOKS.budak;
    const [c, g] = mkCanvas(256, 128); g.imageSmoothingEnabled = true;
    g.fillStyle = L.hij || L.s; g.fillRect(0, 0, 256, 128);
    if (L.hij) { g.fillStyle = L.s; g.beginPath(); g.ellipse(64, 70, 27, 33, 0, 0, 7); g.fill(); }
    const cx = 64, ey = 66;
    const old = /atuk|pakcik|datuk|makcik|prof|kapten/.test(look);
    for (const s of [-1, 1]) {
      const x = cx + s * 12;
      g.fillStyle = '#231c24'; g.beginPath(); g.ellipse(x, ey, 4.2, old ? 4 : 7, 0, 0, 7); g.fill();
      if (!old) { g.fillStyle = '#5a3a2a'; g.beginPath(); g.ellipse(x, ey + 2.5, 3, 3.5, 0, 0, 7); g.fill(); }
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x + 1.4, ey - (old ? 1 : 3), 1.6, 0, 7); g.fill();
      g.strokeStyle = 'rgba(40,24,20,.8)'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(x - 5, ey - (old ? 7 : 10)); g.lineTo(x + 4, ey - (old ? 8 : 11)); g.stroke();
      g.fillStyle = 'rgba(240,120,120,.35)'; g.beginPath(); g.ellipse(x + s * 6, ey + 10, 5, 3, 0, 0, 7); g.fill();
    }
    g.strokeStyle = '#7a3a30'; g.lineWidth = 1.8; g.beginPath(); g.arc(cx, ey + 12, 3.5, .2 * Math.PI, .8 * Math.PI); g.stroke();
    if (look === 'pakcik' || look === 'datuk' || look === 'atuk') { g.fillStyle = look === 'atuk' ? '#e8e8e8' : '#2a2020'; g.beginPath(); g.ellipse(cx, ey + 9, 8, 2.2, 0, 0, 7); g.fill(); }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return (this._face[look] = t);
  },
  build(look, detail = 1) {
    const L = LOOKS[look] || LOOKS.budak;
    const r = new Rig(detail), G = r.G;
    const player = /^(pemain|kostum)/.test(look);
    const body = new THREE.Group(); r.root.add(body);
    const hair = L.h || '#2a1a12', skin = L.s, shirt = L.c, pants = L.p;
    const coat = look === 'prof' || look === 'saintis';
    // kaki
    const leg = s => { const p = new THREE.Group(); p.position.set(s * .085, .32, 0); body.add(p); r.seg([0, -.02, 0], [0, -.24, 0], .075, pants, { parent: p }); r.ell([0, -.27, .03], [.075, .05, .11], '#3a2e2a', { parent: p }); return p; };
    const lL = leg(-1), lR = leg(1);
    r.ell([0, .36, 0], [.17, .09, .13], pants, { parent: body });
    r.ell([0, .5, 0], [.18, .17, .14], shirt, { parent: body });
    if (coat) r.cone([0, .2, 0], [0, .64, 0], [.22, .17], shirt, { parent: body });
    if (player) { r.ell([0, .52, -.15], [.13, .15, .08], look === 'pemain2' ? '#e05a8a' : '#3a6ad4', { parent: body }); }
    const arm = s => { const p = new THREE.Group(); p.position.set(s * .2, .6, 0); body.add(p); r.seg([0, 0, 0], [s * .02, -.12, 0], .06, shirt, { parent: p }); r.seg([s * .02, -.1, 0], [s * .03, -.2, .01], .048, skin, { parent: p }); r.ell([s * .03, -.24, .01], .052, skin, { parent: p }); p.rotation.z = s * .12; return p; };
    const aL = arm(-1), aR = arm(1);
    // kepala
    const head = new THREE.Group(); head.position.set(0, .9, 0); body.add(head);
    const hm = new THREE.Mesh(G.sph, M3.toon('#ffffff', { map: this.face(look) }));
    hm.scale.set(.27, .255, .25); hm.castShadow = true; head.add(hm); hm.add(new THREE.Mesh(G.sph, M3.outline(L.hij || skin)));
    r.mats.push(hm.material); hm.material.userData.base = { color: hm.material.color.clone(), emissive: hm.material.emissive.clone() };
    const hat = L.hat && !L.hij ? (this.HAT[look] || 'cap') : null;
    if (L.hij) {
      r.cone([0, -.34, -.02], [0, .05, -.02], [.3, .27], L.hij, { parent: head });
    } else {
      r.add(this.capGeo(), hair, [0, .03, -.02], [.285, .27, .27], { parent: head });
      for (const [x, y, z, rz] of [[-.12, .1, .21, .5], [0, .13, .23, 0], [.12, .1, .21, -.5]]) r.ell([x, y, z], [.09, .06, .05], hair, { parent: head, rot: [0, 0, rz] });
      if (this.LONG.has(look)) { r.ell([0, -.1, -.14], [.24, .28, .14], hair, { parent: head }); }
    }
    if (hat === 'cap') { r.add(this.capGeo(.5), L.hat, [0, .07, -.01], [.29, .26, .28], { parent: head }); r.ell([0, .08, .22], [.19, .02, .14], L.hat, { parent: head, rot: [.25, 0, 0] }); r.ell([0, .28, .08], [.06, .04, .02], '#ffffff', { parent: head, ol: false, rot: [-.5, 0, 0] }); }
    if (hat === 'songkok') r.cyl([0, .06, -.02], [0, .32, -.05], .25, L.hat, { parent: head });
    if (hat === 'kopiah') r.cyl([0, .08, -.02], [0, .28, -.04], .245, L.hat, { parent: head });
    if (hat === 'terendak') { r.cone([0, .12, 0], [0, .38, 0], .44, L.hat, { parent: head }); }
    if (hat === 'bandana' || hat === 'tengkolok') { r.add(this.capGeo(.55), L.hat, [0, .06, -.02], [.29, .27, .28], { parent: head }); r.leaf([0, .08, -.26], [.3, -.5, -.8], .22, .1, L.hat, { parent: head, flat: [1, 0, 0] }); }
    r.bake();
    const g = new THREE.Group(); g.add(r.root);
    g.userData = { lL, lR, aL, aR, body, head, phase: 0, rig: r, tint: mode => { for (const m of r.mats) { const b = m.userData.base; if (mode === 'ghost') m.color.set(0x2a2238); else m.color.copy(b.color); } } };
    return g;
  },
  _cap: {},
  capGeo(cut = .58) {
    if (this._cap[cut]) return this._cap[cut];
    const g = new THREE.SphereGeometry(1, 24, 14, 0, Math.PI * 2, 0, Math.PI * cut);
    g.rotateX(-.42); g.userData.shared = true;
    return (this._cap[cut] = g);
  },
};
window.M3 = M3; window.MonModel = MonModel; window.HumanModel = HumanModel;
