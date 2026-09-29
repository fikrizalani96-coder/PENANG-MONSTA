'use strict';
// ===== Perkakas 3D: pembina jaringan (GB), hingar, tekstur prosedur dan tampalan shader =====
// Semua model dunia dibina daripada geometri sebenar (kotak, silinder, lathe, tiub, pejal ekstrusi) dengan warna bucu,
// digabungkan menjadi sedikit jaringan besar. Tiada sprite 2D atau papan iklan.

const KC = new THREE.Color();
// Warna → [r,g,b] linear (untuk warna bucu). Menerima #hex, nombor, THREE.Color atau [r,g,b].
const _rgbCache = new Map();
function rgb(c) {
  if (Array.isArray(c)) return c;
  if (c && c.isColor) return [c.r, c.g, c.b];
  const key = c;
  let v = _rgbCache.get(key);
  if (!v) { KC.set(c); v = [KC.r, KC.g, KC.b]; _rgbCache.set(key, v); }
  return v;
}
const rgbMul = (c, k) => { const a = rgb(c); return [a[0] * k, a[1] * k, a[2] * k]; };
const rgbMix = (a, b, t) => { a = rgb(a); b = rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };

// ---------- Hingar nilai 2D ----------
const N2 = {
  vn(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = hash(xi, yi, 11 + s), b = hash(xi + 1, yi, 11 + s), c = hash(xi, yi + 1, 11 + s), d = hash(xi + 1, yi + 1, 11 + s);
    return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
  },
  vn3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), fx = x - xi, fy = y - yi, fz = z - zi;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy), sz = fz * fz * (3 - 2 * fz), h = (a, b, c) => hash(xi + a, yi + b, zi + c + 7), l = (a, b, t) => a + (b - a) * t;
    return l(l(l(h(0, 0, 0), h(1, 0, 0), sx), l(h(0, 1, 0), h(1, 1, 0), sx), sy), l(l(h(0, 0, 1), h(1, 0, 1), sx), l(h(0, 1, 1), h(1, 1, 1), sx), sy), sz);
  },
  fbm(x, y, o = 3, s = 0) { let a = .5, f = 1, t = 0; for (let i = 0; i < o; i++) { t += a * this.vn(x * f, y * f, s + i * 7); f *= 2.03; a *= .5; } return t / (1 - Math.pow(.5, o)) * .5; }
};

// ---------- Pembina geometri ----------
class GB {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.K = []; this.I = []; this.m = new THREE.Matrix4(); this.nm = new THREE.Matrix3(); this.st = []; this.tmp = new THREE.Matrix4(); this.cell = 7; this._q = new THREE.Quaternion(); this._a = new THREE.Vector3(); this._b = new THREE.Vector3(0, 1, 0); }
  get count() { return this.P.length / 3; }
  push() { this.st.push(this.m.clone()); return this; }
  pop() { this.m.copy(this.st.pop()); return this; }
  t(x, y, z) { this.m.multiply(this.tmp.makeTranslation(x, y, z)); return this; }
  rx(a) { this.m.multiply(this.tmp.makeRotationX(a)); return this; }
  ry(a) { this.m.multiply(this.tmp.makeRotationY(a)); return this; }
  rz(a) { this.m.multiply(this.tmp.makeRotationZ(a)); return this; }
  s(x, y = x, z = x) { this.m.multiply(this.tmp.makeScale(x, y, z)); return this; }
  reset() { this.m.identity(); this.st.length = 0; return this; }
  // putar supaya +y menghala ke (dx,dy,dz)
  align(dx, dy, dz) {
    this._a.set(dx, dy, dz).normalize();
    this._q.setFromUnitVectors(this._b, this._a);
    this.m.multiply(this.tmp.makeRotationFromQuaternion(this._q)); return this;
  }
  // set jubin atlas tekstur bangunan untuk primitif seterusnya
  c(k) { this.cell = k; return this; }
  // segi tiga dengan warna berasingan setiap bucu (daun, gradien); normal dari geometri, hadap ke atas jika up=true
  tri3(p0, p1, p2, c0, c1, c2, up = true) {
    this._np();
    const ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    if (up && ny < 0) { nx = -nx; ny = -ny; nz = -nz; }
    const a = rgb(c0), b = rgb(c1 || c0), c = rgb(c2 || c0);
    const i0 = this._v(p0[0], p0[1], p0[2], nx, ny, nz, a, 0, 0), i1 = this._v(p1[0], p1[1], p1[2], nx, ny, nz, b, 1, 0), i2 = this._v(p2[0], p2[1], p2[2], nx, ny, nz, c, .5, 1);
    this.I.push(i0, i1, i2);
    return this;
  }
  // laksanakan fn dengan matriks sementara (translasi, putaran Y, skala)
  at(x, y, z, ry, fn) { this.push().t(x, y, z); if (ry) this.ry(ry); fn(this); return this.pop(); }
  _np() { this.nm.getNormalMatrix(this.m); }
  _v(x, y, z, nx, ny, nz, c, u, w) {
    const e = this.m.elements, q = this.nm.elements;
    this.P.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const X = q[0] * nx + q[3] * ny + q[6] * nz, Y = q[1] * nx + q[4] * ny + q[7] * nz, Z = q[2] * nx + q[5] * ny + q[8] * nz;
    const l = Math.sqrt(X * X + Y * Y + Z * Z) || 1;
    this.N.push(X / l, Y / l, Z / l); this.C.push(c[0], c[1], c[2]); this.U.push(u, w); this.K.push(this.cell);
    return this.P.length / 3 - 1;
  }
  // segi tiga: a b c (indeks)
  tri(a, b, c) { this.I.push(a, b, c); }
  // segi empat sisi condong: titik p0..p3 (lawan jam dari luar), warna c, uv skala uvs
  // out = arah luar yang dijangka [x,y,z]: jika normal menghala sebaliknya, susunan dibalikkan
  quad(p0, p1, p2, p3, col, uvs = 1, out) {
    this._np();
    const c = rgb(col), ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p3[0] - p0[0], vy = p3[1] - p0[1], vz = p3[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let flip = false;
    if (out) { const o = this._o || (this._o = new THREE.Vector3()); o.set(out[0], out[1], out[2]).transformDirection(this.m); flip = nx * o.x + ny * o.y + nz * o.z < 0; }
    const w = Math.hypot(ux, uy, uz) / uvs, h = Math.hypot(vx, vy, vz) / uvs;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const a = this._v(p0[0], p0[1], p0[2], nx, ny, nz, c, 0, 0), b = this._v(p1[0], p1[1], p1[2], nx, ny, nz, c, w, 0),
      d = this._v(p2[0], p2[1], p2[2], nx, ny, nz, c, w, h), e = this._v(p3[0], p3[1], p3[2], nx, ny, nz, c, 0, h);
    flip ? this.I.push(a, d, b, a, e, d) : this.I.push(a, b, d, a, d, e);
    return this;
  }
  // kotak berpusat pada asal. o: { ao:[bawah,atas] faktor warna menegak, uvs, nb (tiada muka bawah), ct (warna atas), skip:'+x-z' }
  box(sx, sy, sz, col, o = {}) {
    this._np();
    const hx = sx / 2, hy = sy / 2, hz = sz / 2, uvs = o.uvs || 1, ao = o.ao, sk = o.skip || '';
    const base = rgb(col), top = o.ct ? rgb(o.ct) : base;
    const cv = (c, y) => { if (!ao) return c; const k = ao[0] + (ao[1] - ao[0]) * ((y + hy) / (sy || 1)); return [c[0] * k, c[1] * k, c[2] * k]; };
    const face = (nx, ny, nz, pts, c, uw, uh) => {
      const ids = pts.map((p, i) => this._v(p[0], p[1], p[2], nx, ny, nz, cv(c, p[1]), i === 1 || i === 2 ? uw / uvs : 0, i >= 2 ? uh / uvs : 0));
      this.I.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
    };
    if (!sk.includes('+z')) face(0, 0, 1, [[-hx, -hy, hz], [hx, -hy, hz], [hx, hy, hz], [-hx, hy, hz]], base, sx, sy);
    if (!sk.includes('-z')) face(0, 0, -1, [[hx, -hy, -hz], [-hx, -hy, -hz], [-hx, hy, -hz], [hx, hy, -hz]], base, sx, sy);
    if (!sk.includes('+x')) face(1, 0, 0, [[hx, -hy, hz], [hx, -hy, -hz], [hx, hy, -hz], [hx, hy, hz]], base, sz, sy);
    if (!sk.includes('-x')) face(-1, 0, 0, [[-hx, -hy, -hz], [-hx, -hy, hz], [-hx, hy, hz], [-hx, hy, -hz]], base, sz, sy);
    if (!sk.includes('+y')) face(0, 1, 0, [[-hx, hy, hz], [hx, hy, hz], [hx, hy, -hz], [-hx, hy, -hz]], top, sx, sz);
    if (!o.nb && !sk.includes('-y')) face(0, -1, 0, [[-hx, -hy, -hz], [hx, -hy, -hz], [hx, -hy, hz], [-hx, -hy, hz]], base, sx, sz);
    return this;
  }
  // kotak dengan pusat (x,y,z)
  bx(x, y, z, sx, sy, sz, col, o) { this.push().t(x, y, z); this.box(sx, sy, sz, col, o); return this.pop(); }
  // silinder/kon tirus sepanjang +y dari y=0 hingga h. o: { cap (atas), capB (bawah), ao, smooth:true, uvs, ct (warna atas) }
  cyl(rt, rb, h, seg, col, o = {}) {
    this._np();
    const c = rgb(col), ao = o.ao, uvs = o.uvs || 1, sl = (rb - rt) / (h || 1), nl = Math.hypot(1, sl);
    const ring = [];
    for (let j = 0; j <= 1; j++) {
      const y = j * h, r = j ? rt : rb, k = ao ? ao[0] + (ao[1] - ao[0]) * j : 1, cc = [c[0] * k, c[1] * k, c[2] * k];
      const row = [];
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        row.push(this._v(cs * r, y, sn * r, cs / nl, sl / nl, sn / nl, cc, i / seg * (Math.PI * 2 * Math.max(rt, rb) / uvs), y / uvs));
      }
      ring.push(row);
    }
    for (let i = 0; i < seg; i++) { const a = ring[0][i], b = ring[0][i + 1], d = ring[1][i], e = ring[1][i + 1]; this.I.push(a, d, b, b, d, e); }
    const cap = (y, r, ny, cc) => {
      if (r < 1e-4) return;
      const ctr = this._v(0, y, 0, 0, ny, 0, cc, .5, .5), ids = [];
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2; ids.push(this._v(Math.cos(a) * r, y, Math.sin(a) * r, 0, ny, 0, cc, .5 + Math.cos(a) * r / uvs, .5 + Math.sin(a) * r / uvs)); }
      for (let i = 0; i < seg; i++) ny > 0 ? this.I.push(ctr, ids[i + 1], ids[i]) : this.I.push(ctr, ids[i], ids[i + 1]);
    };
    if (o.cap) cap(h, rt, 1, o.ct ? rgb(o.ct) : (ao ? [c[0] * ao[1], c[1] * ao[1], c[2] * ao[1]] : c));
    if (o.capB) cap(0, rb, -1, ao ? [c[0] * ao[0], c[1] * ao[0], c[2] * ao[0]] : c);
    return this;
  }
  cone(r, h, seg, col, o = {}) { return this.cyl(0, r, h, seg, col, o); }
  // sfera/elipsoid berpusat pada asal (skala menerusi matriks). o: { ao, disp(fn nx,ny,nz)=>k, hs }
  sph(r, ws, hs, col, o = {}) {
    this._np();
    const c = rgb(col), ao = o.ao, ids = [];
    for (let j = 0; j <= hs; j++) {
      const v = j / hs, th = v * Math.PI, sy = Math.cos(th), sr = Math.sin(th);
      for (let i = 0; i <= ws; i++) {
        const u = i / ws, ph = u * Math.PI * 2, nx = sr * Math.cos(ph), nz = sr * Math.sin(ph);
        const k = o.disp ? o.disp(nx, sy, nz) : 1, hh = sy * .5 + .5, kk = ao ? ao[0] + (ao[1] - ao[0]) * hh : 1;
        let cc = c;
        if (o.cv) { const kv = o.cv(nx, sy, nz); cc = [c[0] * kv, c[1] * kv, c[2] * kv]; }
        if (o.c2) { const tt = Math.pow(Math.max(0, hh - (o.m0 || .25)) / (1 - (o.m0 || .25)), o.mp || 1.3); cc = [cc[0] + (o.c2[0] - cc[0]) * tt, cc[1] + (o.c2[1] - cc[1]) * tt, cc[2] + (o.c2[2] - cc[2]) * tt]; }
        ids.push(this._v(nx * r * k, sy * r * k, nz * r * k, nx, sy, nz, [cc[0] * kk, cc[1] * kk, cc[2] * kk], u * 2, v));
      }
    }
    const W = ws + 1;
    for (let j = 0; j < hs; j++) for (let i = 0; i < ws; i++) {
      const a = ids[j * W + i], b = ids[j * W + i + 1], d = ids[(j + 1) * W + i], e = ids[(j + 1) * W + i + 1];
      if (j > 0) this.I.push(a, d, b);
      if (j < hs - 1) this.I.push(b, d, e);
    }
    return this;
  }
  // benda putar: profil [[jejari, y], ...] dari bawah ke atas; o: { ao, uvs, cols: [warna per segmen] }
  lathe(prof, seg, col, o = {}) {
    this._np();
    const c = rgb(col), uvs = o.uvs || 1, ids = [];
    let acc = 0;
    for (let k = 0; k < prof.length; k++) {
      const p = prof[k], q0 = prof[Math.max(0, k - 1)], q1 = prof[Math.min(prof.length - 1, k + 1)];
      const tx = q1[0] - q0[0], ty = q1[1] - q0[1], l = Math.hypot(tx, ty) || 1; // tangen
      const nr = ty / l, ny = -tx / l;
      if (k) acc += Math.hypot(p[0] - prof[k - 1][0], p[1] - prof[k - 1][1]);
      const cc = o.cols ? rgb(o.cols[Math.min(o.cols.length - 1, k)]) : c, kk = o.ao ? o.ao[0] + (o.ao[1] - o.ao[0]) * (k / (prof.length - 1)) : 1;
      const row = [];
      for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a); row.push(this._v(cs * p[0], p[1], sn * p[0], cs * nr, ny, sn * nr, [cc[0] * kk, cc[1] * kk, cc[2] * kk], i / seg * (Math.PI * 2 * Math.max(p[0], .05) / uvs), acc / uvs)); }
      ids.push(row);
    }
    for (let k = 0; k < prof.length - 1; k++) for (let i = 0; i < seg; i++) {
      const a = ids[k][i], b = ids[k][i + 1], d = ids[k + 1][i], e = ids[k + 1][i + 1];
      this.I.push(a, d, b, b, d, e);
    }
    return this;
  }
  // tiub melalui titik-titik (Catmull-Rom); r0→r1; o: { cap, ao, ease(t) }
  tube(pts, r0, r1, seg, col, o = {}) {
    this._np();
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
    const n = o.steps || Math.max(6, pts.length * 4), c = rgb(col);
    const frames = curve.computeFrenetFrames(n, false);
    const P = new THREE.Vector3(), rows = [];
    for (let s = 0; s <= n; s++) {
      const t = s / n; curve.getPointAt(t, P);
      const e = o.ease ? o.ease(t) : t, r = r0 + (r1 - r0) * e, kk = (o.ao ? o.ao[0] + (o.ao[1] - o.ao[0]) * t : 1) * (o.band ? o.band(t, s) : 1);
      const N = frames.normals[s], B = frames.binormals[s], row = [];
      for (let i = 0; i <= seg; i++) {
        const a = i / seg * Math.PI * 2, cs = Math.cos(a), sn = Math.sin(a);
        const nx = N.x * cs + B.x * sn, ny = N.y * cs + B.y * sn, nz = N.z * cs + B.z * sn;
        row.push(this._v(P.x + nx * r, P.y + ny * r, P.z + nz * r, nx, ny, nz, [c[0] * kk, c[1] * kk, c[2] * kk], i / seg * 2, t * curve.getLength() / (o.uvs || 1)));
      }
      rows.push(row);
    }
    for (let s = 0; s < n; s++) for (let i = 0; i < seg; i++) { const a = rows[s][i], b = rows[s][i + 1], d = rows[s + 1][i], e = rows[s + 1][i + 1]; this.I.push(a, b, d, b, e, d); }
    if (o.cap) { // tutup hujung dengan segi tiga kipas
      for (const [s, sign] of [[0, -1], [n, 1]]) {
        const ctr = curve.getPointAt(s / n), tan = curve.getTangentAt(s / n), cid = this._v(ctr.x, ctr.y, ctr.z, tan.x * sign, tan.y * sign, tan.z * sign, c, .5, .5);
        for (let i = 0; i < seg; i++) sign > 0 ? this.I.push(cid, rows[s][i], rows[s][i + 1]) : this.I.push(cid, rows[s][i + 1], rows[s][i]);
      }
    }
    return this;
  }
  // pejal ekstrusi poligon (titik [x,y] dalam satah XY, lawan jam) sepanjang +z sedalam d, berpusat pada z=0
  poly(pts, d, col, o = {}) {
    this._np();
    const c = rgb(col), uvs = o.uvs || 1, z0 = -d / 2, z1 = d / 2, n = pts.length;
    // muka depan (+z) dan belakang (-z) dengan kipas segi tiga (jaringan cembung sahaja)
    for (const [z, nz] of [[z1, 1], [z0, -1]]) {
      const ids = pts.map(p => this._v(p[0], p[1], z, 0, 0, nz, c, p[0] / uvs, p[1] / uvs));
      for (let i = 1; i < n - 1; i++) nz > 0 ? this.I.push(ids[0], ids[i], ids[i + 1]) : this.I.push(ids[0], ids[i + 1], ids[i]);
    }
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], ex = b[0] - a[0], ey = b[1] - a[1], l = Math.hypot(ex, ey) || 1, nx = ey / l, ny = -ex / l;
      const v0 = this._v(a[0], a[1], z0, nx, ny, 0, c, 0, 0), v1 = this._v(b[0], b[1], z0, nx, ny, 0, c, l / uvs, 0), v2 = this._v(b[0], b[1], z1, nx, ny, 0, c, l / uvs, d / uvs), v3 = this._v(a[0], a[1], z1, nx, ny, 0, c, 0, d / uvs);
      this.I.push(v0, v1, v2, v0, v2, v3);
    }
    return this;
  }
  // segi tiga rata dengan uv unjuran (u sepanjang p0→p1); out = arah luar yang dijangka
  triuv(p0, p1, p2, col, uvs = 1, out) {
    this._np();
    const c = rgb(col), ux = p1[0] - p0[0], uy = p1[1] - p0[1], uz = p1[2] - p0[2], vx = p2[0] - p0[0], vy = p2[1] - p0[1], vz = p2[2] - p0[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    let flip = false;
    if (out) { const o = this._o || (this._o = new THREE.Vector3()); o.set(out[0], out[1], out[2]).transformDirection(this.m); flip = nx * o.x + ny * o.y + nz * o.z < 0; }
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    const lu = Math.hypot(ux, uy, uz) || 1, e1 = [ux / lu, uy / lu, uz / lu], dv = vx * e1[0] + vy * e1[1] + vz * e1[2];
    const pv = [vx - e1[0] * dv, vy - e1[1] * dv, vz - e1[2] * dv], lv = Math.hypot(pv[0], pv[1], pv[2]) || 1;
    const a = this._v(p0[0], p0[1], p0[2], nx, ny, nz, c, 0, 0), b = this._v(p1[0], p1[1], p1[2], nx, ny, nz, c, lu / uvs, 0), d = this._v(p2[0], p2[1], p2[2], nx, ny, nz, c, dv / uvs, lv / uvs);
    flip ? this.I.push(a, d, b) : this.I.push(a, b, d);
    return this;
  }
  // bilah rumput dua-sisi: pangkal (x,y,z), lebar w, tinggi h, condong (lx,lz) di hujung, arah bilah ang; warna pangkal→hujung; uv.y = tinggi relatif 0..1
  blade(x, y, z, w, h, lx, lz, ang, c0, c1) {
    this._np();
    const ca = Math.cos(ang) * w / 2, sa = Math.sin(ang) * w / 2, a = rgb(c0), b = rgb(c1), m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
    let nx = -Math.sin(ang) * .45, nz = Math.cos(ang) * .45; const nl = Math.hypot(nx, 1, nz); nx /= nl; nz /= nl; const ny = 1 / nl;
    const v0 = this._v(x - ca, y, z - sa, nx, ny, nz, a, 0, 0), v1 = this._v(x + ca, y, z + sa, nx, ny, nz, a, 0, 0),
      v2 = this._v(x + lx * .4 - ca * .72, y + h * .55, z + lz * .4 - sa * .72, nx, ny, nz, m, 0, .55), v3 = this._v(x + lx * .4 + ca * .72, y + h * .55, z + lz * .4 + sa * .72, nx, ny, nz, m, 0, .55),
      v4 = this._v(x + lx, y + h, z + lz, nx, ny, nz, b, 0, 1);
    this.I.push(v0, v1, v3, v0, v3, v2, v2, v3, v4);
    return this;
  }
  // gabungkan geometri sedia ada (BufferGeometry berindeks dengan position/normal/color?) di bawah matriks semasa
  add(geo, col) {
    this._np();
    const P = geo.attributes.position, N = geo.attributes.normal, Cc = geo.attributes.color, U = geo.attributes.uv, base = this.count, c = col ? rgb(col) : null;
    for (let i = 0; i < P.count; i++) {
      const cc = c || (Cc ? [Cc.getX(i), Cc.getY(i), Cc.getZ(i)] : [1, 1, 1]);
      this._v(P.getX(i), P.getY(i), P.getZ(i), N.getX(i), N.getY(i), N.getZ(i), cc, U ? U.getX(i) : 0, U ? U.getY(i) : 0);
    }
    if (geo.index) for (let i = 0; i < geo.index.count; i++) this.I.push(base + geo.index.getX(i)); else for (let i = 0; i < P.count; i++) this.I.push(base + i);
    return this;
  }
  // salin semua bucu dari GB lain di bawah matriks semasa (untuk penggunaan semula komponen)
  addGB(o) {
    this._np(); const base = this.count;
    for (let i = 0; i < o.P.length; i += 3) { this.cell = o.K[i / 3]; this._v(o.P[i], o.P[i + 1], o.P[i + 2], o.N[i], o.N[i + 1], o.N[i + 2], [o.C[i], o.C[i + 1], o.C[i + 2]], o.U[i / 3 * 2], o.U[i / 3 * 2 + 1]); }
    for (const i of o.I) this.I.push(base + i);
    return this;
  }
  build(opt = {}) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    if (!opt.noColor) g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    if (!opt.noUV) g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    if (opt.cell) g.setAttribute('aCell', new THREE.Float32BufferAttribute(this.K, 1));
    const big = this.count > 65535;
    g.setIndex(big ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    g.userData.shared = true;
    return g;
  }
}

// ---------- Tekstur prosedur (dikongsi; kelabu cerah supaya boleh diwarnakan oleh warna bucu) ----------
const TEX = {
  _c: {}, aniso: 4,
  get(name) { return this._c[name] || (this._c[name] = this['mk_' + name]()); },
  _tex(cnv, srgb = true) {
    const t = new THREE.CanvasTexture(cnv);
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = this.aniso;
    return t;
  },
  _canvas(w, h, fn) { const [c, g] = mkCanvas(w, h); g.imageSmoothingEnabled = true; fn(g, w, h); return this._tex(c); },
  // papan kayu menegak
  mk_plank() {
    return this._canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#c9c9c9'; g.fillRect(0, 0, w, h);
      const n = 8, pw = w / n;
      for (let i = 0; i < n; i++) {
        const b = 200 + hash(i, 1, 4) * 40;
        g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(i * pw + 1, 0, pw - 2, h);
        for (let k = 0; k < 9; k++) { const x = i * pw + 3 + hash(i, k, 5) * (pw - 6); g.strokeStyle = `rgba(90,90,90,${.10 + hash(i, k, 6) * .12})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 2, h * .3, x - 2, h * .6, x + 1, h); g.stroke(); }
        g.fillStyle = 'rgba(40,40,40,.55)'; g.fillRect(i * pw, 0, 1.6, h);
        for (let k = 0; k < 2; k++) { const y = hash(i, k, 8) * h; g.fillStyle = 'rgba(70,70,70,.16)'; g.beginPath(); g.ellipse(i * pw + pw / 2, y, 2.6, 5, 0, 0, 7); g.fill(); }
      }
    });
  },
  mk_plaster() {
    return this._canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#e8e8e8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 700; i++) { const b = 195 + hash(i, 2, 3) * 55; g.fillStyle = `rgba(${b},${b},${b},.5)`; g.fillRect(hash(i, 4, 3) * w, hash(i, 5, 3) * h, 1 + hash(i, 6, 3) * 2, 1 + hash(i, 7, 3) * 2); }
      for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(140,140,140,.06)'; g.beginPath(); g.ellipse(hash(i, 1, 9) * w, hash(i, 2, 9) * h, 14 + hash(i, 3, 9) * 20, 8 + hash(i, 4, 9) * 12, 0, 0, 7); g.fill(); }
    });
  },
  // genting tanah liat berbaris (arah ke bawah cerun = +v)
  mk_roof() {
    return this._canvas(128, 128, (g, w, h) => {
      const rows = 6, rh = h / rows, cols = 6, cw = w / cols;
      for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) {
        const off = r % 2 ? cw / 2 : 0, x = c * cw + off, y = r * rh, b = 205 + hash(c + 9, r, 2) * 45;
        const gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, `rgb(${b + 14},${b + 14},${b + 14})`); gr.addColorStop(.7, `rgb(${b},${b},${b})`); gr.addColorStop(1, `rgb(${b - 70},${b - 70},${b - 70})`);
        g.fillStyle = gr; g.fillRect(x + 1, y, cw - 2, rh);
        g.fillStyle = 'rgba(30,30,30,.55)'; g.fillRect(x, y, 1.4, rh); g.fillRect(x, y + rh - 1.6, cw, 1.6);
      }
    });
  },
  // zink beralun (alun menegak)
  mk_zinc() {
    return this._canvas(128, 128, (g, w, h) => {
      const n = 10, cw = w / n;
      for (let i = 0; i < n; i++) {
        const gr = g.createLinearGradient(i * cw, 0, (i + 1) * cw, 0); gr.addColorStop(0, '#f0f0f0'); gr.addColorStop(.5, '#a8a8a8'); gr.addColorStop(1, '#d4d4d4');
        g.fillStyle = gr; g.fillRect(i * cw, 0, cw, h);
      }
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(90,60,40,${.03 + hash(i, 1, 12) * .06})`; g.fillRect(hash(i, 2, 12) * w, hash(i, 3, 12) * h, 3 + hash(i, 4, 12) * 8, 8 + hash(i, 5, 12) * 30); }
    });
  },
  mk_brick() {
    return this._canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, w, h);
      const rows = 8, bh = h / rows, bw = w / 4;
      for (let r = 0; r < rows; r++) for (let c = -1; c < 4; c++) { const x = c * bw + (r % 2 ? bw / 2 : 0), b = 190 + hash(c + 5, r, 15) * 60; g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(x + 1.5, r * bh + 1.5, bw - 3, bh - 3); }
    });
  },
  // kaca tingkap: kecerunan langit + pantulan
  mk_glass() {
    return this._canvas(64, 64, (g, w, h) => {
      const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#dff0ff'); gr.addColorStop(.45, '#7db4e6'); gr.addColorStop(1, '#3d6fb0');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(w * .1, h); g.lineTo(w * .42, 0); g.lineTo(w * .62, 0); g.lineTo(w * .3, h); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(w * .55, h); g.lineTo(w * .85, 0); g.lineTo(w * .93, 0); g.lineTo(w * .63, h); g.fill();
    });
  },
  // dinding tingkat (bangunan tinggi): grid tingkap gelap
  mk_curtain() {
    return this._canvas(128, 128, (g, w, h) => {
      g.fillStyle = '#e4e8ee'; g.fillRect(0, 0, w, h);
      const cols = 4, rows = 4, cw = w / cols, rh = h / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = c * cw + 5, y = r * rh + 6, ww = cw - 10, hh = rh - 12;
        const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#a9d4f7'); gr.addColorStop(1, '#3f78bb');
        g.fillStyle = 'rgba(60,70,90,.4)'; g.fillRect(x + 1.5, y + 2, ww, hh);
        g.fillStyle = gr; g.fillRect(x, y, ww, hh);
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x + ww * .1, y + hh); g.lineTo(x + ww * .4, y); g.lineTo(x + ww * .6, y); g.lineTo(x + ww * .3, y + hh); g.fill();
      }
    });
  },
  // jubin lantai (bilik dalam) besar
  mk_noise() {
    return this._canvas(64, 64, (g, w, h) => {
      const id = g.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { const v = 200 + hash(i % w, (i / w) | 0, 21) * 55; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
      g.putImageData(id, 0, 0);
    });
  },
  // kulit pokok (jalur menegak)
  mk_bark() {
    return this._canvas(64, 128, (g, w, h) => {
      g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, w, h);
      for (let i = 0; i < 26; i++) { const x = hash(i, 1, 30) * w, b = 120 + hash(i, 2, 30) * 100; g.strokeStyle = `rgba(${b - 90},${b - 90},${b - 90},.55)`; g.lineWidth = 1 + hash(i, 3, 30) * 2; g.beginPath(); g.moveTo(x, 0); for (let y = 0; y <= h; y += 16) g.lineTo(x + Math.sin(y * .1 + i) * 2, y); g.stroke(); }
    });
  },
  // awan lembut untuk langit (alfa)
  mk_cloud() {
    const [c, g] = mkCanvas(256, 128); g.imageSmoothingEnabled = true;
    for (let i = 0; i < 12; i++) {
      const x = 40 + i * 15 + hash(i, 1, 40) * 26, y = 76 - Math.sin(i / 11 * Math.PI) * 34 + hash(i, 2, 40) * 10, r = 20 + hash(i, 3, 40) * 22;
      const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.96)'); gr.addColorStop(.65, 'rgba(255,255,255,.75)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  },
  // cahaya bulat lembut (zarah, matahari, bayang blob)
  mk_glow() {
    const [c, g] = mkCanvas(64, 64); g.imageSmoothingEnabled = true;
    const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  },
  mk_blob() { // bayang bulat
    const [c, g] = mkCanvas(64, 64); g.imageSmoothingEnabled = true;
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 30); gr.addColorStop(0, 'rgba(20,24,10,.55)'); gr.addColorStop(.6, 'rgba(20,24,10,.32)'); gr.addColorStop(1, 'rgba(20,24,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
  },
  // papan tanda dengan teks (dicache)
  sign(text) {
    const key = 'sign:' + text;
    if (this._c[key]) return this._c[key];
    const [c, g] = mkCanvas(256, 160); g.imageSmoothingEnabled = true;
    g.fillStyle = '#c99658'; g.fillRect(0, 0, 256, 160);
    for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(90,50,20,${.06 + hash(i, 3, 50) * .1})`; g.fillRect(0, hash(i, 4, 50) * 160, 256, 1 + hash(i, 5, 50) * 2.4); }
    g.strokeStyle = '#7a4a22'; g.lineWidth = 9; g.strokeRect(4, 4, 248, 152);
    g.fillStyle = '#4a2a10'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const lines = String(text).split('\n'), title = lines[0].toUpperCase();
    let fs = 44; g.font = `800 ${fs}px "Baloo 2", "Trebuchet MS", sans-serif`;
    while (g.measureText(title).width > 216 && fs > 18) { fs -= 2; g.font = `800 ${fs}px "Baloo 2", "Trebuchet MS", sans-serif`; }
    if (lines.length > 1) { g.fillText(title, 128, 56); g.font = '600 20px "Baloo 2", sans-serif'; g.fillStyle = '#5a3a1a'; const sub = lines[1].length > 30 ? lines[1].slice(0, 28) + '…' : lines[1]; g.fillText(sub, 128, 112); }
    else g.fillText(title, 128, 80);
    const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; t.anisotropy = 4;
    return (this._c[key] = t);
  },
};

// ---------- Atlas tekstur (petak 256px, 240px digunakan + jidar 8px supaya mipmap tidak bocor) ----------
function makeAtlas(painters, rows = 2) {
  const [ac, ag] = mkCanvas(1024, 256 * rows); ag.imageSmoothingEnabled = true;
  const P = 240, R = (i, s) => hash(i, s, 91);
  const cell = (i, draw) => {
    const [c, g] = mkCanvas(P, P); g.imageSmoothingEnabled = true;
    const wrap = fn => { for (const dx of [-P, 0, P]) for (const dy of [-P, 0, P]) { g.save(); g.translate(dx, dy); fn(g); g.restore(); } };
    draw(g, wrap, c);
    const cx = (i % 4) * 256, cy = Math.floor(i / 4) * 256;
    ag.save(); ag.beginPath(); ag.rect(cx, cy, 256, 256); ag.clip();
    for (const dx of [-P, 0, P]) for (const dy of [-P, 0, P]) ag.drawImage(c, cx + 8 + dx, cy + 8 + dy);
    ag.restore();
  };
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
  painters({ cell, blobs, specks, pebbles, R, P });
  const t = new THREE.CanvasTexture(ac);
  t.encoding = THREE.sRGBEncoding; t.flipY = false; t.anisotropy = TEX.aniso; t.minFilter = THREE.LinearMipMapLinearFilter;
  return t;
}
TEX.groundAtlas = function () {
  return this._c.ground || (this._c.ground = makeAtlas(({ cell, blobs, specks, pebbles, R, P }) => {
    cell(0, (g, wrap) => { // rumput
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
    cell(1, (g, wrap) => { // laluan tanah
      g.fillStyle = '#dcc08a'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#e8d2a0', '#c9a870', '#d6b882'], 16, 50, .5, 21);
      specks(g, wrap, 500, ['#c4a26c', '#ecd8ac', '#b8965e'], 1, 2.4, 22);
      pebbles(g, wrap, 34, '#b9a07a', '#efe0bc', 23);
    });
    cell(2, (g, wrap) => { // jalan tar
      g.fillStyle = '#8a929b'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 26, ['#9aa2aa', '#7a828c'], 20, 60, .4, 31);
      specks(g, wrap, 2400, ['#737b85', '#a3aab2', '#6a727c', '#b8bec4'], 1, 2, 32);
    });
    cell(3, (g, wrap) => { // pasir
      g.fillStyle = '#f0ddaa'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#f8ecc4', '#e2cc92'], 20, 60, .5, 41);
      for (let i = 0; i < 18; i++) { const y = R(i, 42) * P; g.strokeStyle = 'rgba(190,160,100,.18)'; g.lineWidth = 2; wrap(g => { g.beginPath(); g.moveTo(0, y); for (let x = 0; x <= P; x += 20) g.lineTo(x, y + Math.sin(x / 30 + i) * 4); g.stroke(); }); }
      specks(g, wrap, 700, ['#d8c088', '#fff6d8', '#c8ae78'], 1, 2, 43);
    });
    cell(4, (g, wrap) => { // lantai gua / tanah
      g.fillStyle = '#a4845e'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 34, ['#b89870', '#8a6c4a', '#9c7c56'], 18, 56, .5, 51);
      specks(g, wrap, 600, ['#8e7050', '#c0a078'], 1, 2.5, 52);
      pebbles(g, wrap, 26, '#8c7458', '#c8b090', 53);
    });
    cell(5, (g, wrap) => { // lantai kayu
      const rows = 6, rh = P / rows, cols = ['#d9a866', '#cf9a58', '#e2b272', '#c88f52', '#d4a260'];
      for (let r = 0; r < rows; r++) {
        let x = -R(r, 61) * 120, k = 0;
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
    cell(6, (g, wrap) => { // jubin
      g.fillStyle = '#b8b2c8'; g.fillRect(0, 0, P, P);
      const n = 4, s = P / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const gr = g.createLinearGradient(x * s, y * s, x * s + s, y * s + s); gr.addColorStop(0, '#ebe8f2'); gr.addColorStop(1, '#d4d0e0');
        g.fillStyle = gr; g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4);
      }
    });
    cell(7, (g, wrap) => { // sawah berlumpur
      g.fillStyle = '#7d8c4c'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 30, ['#6f8f82', '#8c9a58', '#5f7a60'], 20, 60, .55, 71);
      specks(g, wrap, 500, ['#6a7a40', '#a4b070'], 1, 2, 72);
    });
  }));
};
// Atlas bangunan: kelabu cerah supaya warna bucu memberi rona (kecuali kaca yang berwarna sendiri)
TEX.buildAtlas = function () {
  return this._c.build || (this._c.build = makeAtlas(({ cell, blobs, specks, R, P }) => {
    cell(0, (g, wrap) => { // papan kayu menegak (4 papan setiap petak)
      g.fillStyle = '#d8d8d8'; g.fillRect(0, 0, P, P);
      const n = 6, pw = P / n;
      for (let i = 0; i < n; i++) {
        const b = 205 + R(i, 1) * 40; g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(i * pw + 1, 0, pw - 2, P);
        for (let k = 0; k < 14; k++) { const x = i * pw + 3 + R(i * 20 + k, 2) * (pw - 6); g.strokeStyle = `rgba(80,80,80,${.10 + R(i * 20 + k, 3) * .14})`; g.lineWidth = 1; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 2, P * .3, x - 2, P * .6, x + 1, P); g.stroke(); }
        g.fillStyle = 'rgba(30,30,30,.6)'; g.fillRect(i * pw, 0, 2, P);
        for (let k = 0; k < 2; k++) { const y = R(i * 4 + k, 4) * P; g.fillStyle = 'rgba(70,70,70,.2)'; g.beginPath(); g.ellipse(i * pw + pw / 2, y, 3, 7, 0, 0, 7); g.fill(); }
      }
    });
    cell(1, (g, wrap) => { // plaster dinding dengan tompokan lembap
      g.fillStyle = '#efefef'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 22, ['#ffffff', '#e2e2e2', '#ececec'], 24, 70, .3, 11);
      specks(g, wrap, 700, ['#dadada', '#fafafa'], 1, 2, 12);
      for (let i = 0; i < 8; i++) { const x = R(i, 13) * P; const gr = g.createLinearGradient(0, 0, 0, P); wrap(g => { g.fillStyle = 'rgba(100,100,100,.05)'; g.fillRect(x, 0, 6 + R(i, 14) * 14, P); }); }
    });
    cell(2, (g, wrap) => { // genting tanah liat bersisik
      g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, P, P);
      const rows = 8, rh = P / rows, cols = 6, cw = P / cols;
      for (let r = 0; r < rows; r++) for (let c = -1; c <= cols; c++) {
        const off = r % 2 ? cw / 2 : 0, x = c * cw + off, y = r * rh, b = 205 + R(c + 9 + r * 7, 5) * 48;
        wrap(g => {
          const gr = g.createLinearGradient(0, y, 0, y + rh); gr.addColorStop(0, `rgb(${b + 6},${b + 6},${b + 6})`); gr.addColorStop(.62, `rgb(${b - 8},${b - 8},${b - 8})`); gr.addColorStop(1, `rgb(${b - 88},${b - 88},${b - 88})`);
          g.fillStyle = gr; g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + cw - 1, y); g.lineTo(x + cw - 2, y + rh * .8); g.quadraticCurveTo(x + cw / 2, y + rh * 1.12, x + 2, y + rh * .8); g.fill();
          g.fillStyle = 'rgba(20,20,20,.5)'; g.fillRect(x, y, 1.5, rh);
        });
      }
    });
    cell(3, (g, wrap) => { // zink beralun
      g.fillStyle = '#d0d0d0'; g.fillRect(0, 0, P, P);
      const n = 12, cw = P / n;
      for (let i = 0; i < n; i++) {
        const gr = g.createLinearGradient(i * cw, 0, (i + 1) * cw, 0); gr.addColorStop(0, '#f6f6f6'); gr.addColorStop(.5, '#a0a0a0'); gr.addColorStop(1, '#dcdcdc');
        g.fillStyle = gr; g.fillRect(i * cw, 0, cw, P);
      }
      for (let i = 0; i < 60; i++) wrap(g => { g.fillStyle = `rgba(80,60,40,${.03 + R(i, 21) * .08})`; g.fillRect(R(i, 22) * P, R(i, 23) * P, 3 + R(i, 24) * 9, 10 + R(i, 25) * 44); });
      g.fillStyle = 'rgba(40,40,40,.35)'; for (let y = 30; y < P; y += 100) g.fillRect(0, y, P, 2);
    });
    cell(4, (g, wrap) => { // bata
      g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, P, P);
      const rows = 10, bh = P / rows, bw = P / 5;
      for (let r = 0; r < rows; r++) for (let c = -1; c < 5; c++) { const x = c * bw + (r % 2 ? bw / 2 : 0), b = 190 + R(c + 5 + r * 9, 31) * 62; wrap(g => { g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(x + 2, r * bh + 2, bw - 4, bh - 4); }); }
      specks(g, wrap, 500, ['rgba(60,60,60,.3)', 'rgba(255,255,255,.2)'], 1, 2, 32);
    });
    cell(5, (g) => { // kaca dengan pantulan langit
      const gr = g.createLinearGradient(0, 0, P, P); gr.addColorStop(0, '#e2f2ff'); gr.addColorStop(.45, '#84b8e8'); gr.addColorStop(1, '#3c6eb0');
      g.fillStyle = gr; g.fillRect(0, 0, P, P);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.beginPath(); g.moveTo(P * .1, P); g.lineTo(P * .42, 0); g.lineTo(P * .64, 0); g.lineTo(P * .32, P); g.fill();
      g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(P * .56, P); g.lineTo(P * .86, 0); g.lineTo(P * .94, 0); g.lineTo(P * .64, P); g.fill();
    });
    cell(6, (g, wrap) => { // dinding tirai kaca (menara)
      g.fillStyle = '#e6eaf0'; g.fillRect(0, 0, P, P);
      const cols = 4, rows = 4, cw = P / cols, rh = P / rows;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        const x = c * cw + 8, y = r * rh + 10, ww = cw - 16, hh = rh - 20;
        const gr = g.createLinearGradient(x, y, x + ww, y + hh); gr.addColorStop(0, '#b4dafa'); gr.addColorStop(1, '#3f78bb');
        g.fillStyle = 'rgba(50,60,80,.4)'; g.fillRect(x + 2, y + 3, ww, hh);
        g.fillStyle = gr; g.fillRect(x, y, ww, hh);
        g.fillStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(x + ww * .1, y + hh); g.lineTo(x + ww * .4, y); g.lineTo(x + ww * .6, y); g.lineTo(x + ww * .3, y + hh); g.fill();
      }
    });
    cell(7, (g, wrap) => { // jubin seramik putih (klinik) dengan sambungan
      g.fillStyle = '#b0b0b0'; g.fillRect(0, 0, P, P);
      const n = 6, s = P / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const b = 236 + R(x + y * 7, 41) * 19; g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(x * s + 2, y * s + 2, s - 4, s - 4); }
    });
    cell(8, (g, wrap) => { // batu berlapis (tebing gunung/gua): lapisan mendatar, rekahan dan kesan cuaca
      g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, P, P);
      blobs(g, wrap, 40, ['#e6e6e6', '#a8a8a8', '#d0d0d0', '#b8b8b8'], 16, 60, .55, 51);
      for (let i = 0; i < 26; i++) { const y = R(i, 52) * P, hh = 4 + R(i, 53) * 16, b = 150 + R(i, 54) * 90; wrap(g => { const gr = g.createLinearGradient(0, y, 0, y + hh); gr.addColorStop(0, `rgba(${b},${b},${b},.0)`); gr.addColorStop(.5, `rgba(${b},${b},${b},.35)`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, y, P, hh); g.fillStyle = 'rgba(40,40,40,.18)'; g.fillRect(0, y, P, 1.5); }); }
      g.lineCap = 'round';
      for (let i = 0; i < 16; i++) { const x = R(i, 55) * P, y = R(i, 56) * P; g.strokeStyle = 'rgba(30,30,30,.35)'; g.lineWidth = 1 + R(i, 57) * 1.5; wrap(g => { g.beginPath(); g.moveTo(x, y); let cx = x, cy = y; for (let k = 0; k < 5; k++) { cx += (R(i * 9 + k, 58) - .5) * 26; cy += 8 + R(i * 9 + k, 59) * 16; g.lineTo(cx, cy); } g.stroke(); }); }
      specks(g, wrap, 900, ['#8a8a8a', '#eeeeee', '#7a7a7a'], 1, 2.6, 60);
    });
    cell(9, (g, wrap) => { // batu granit/jubin lantai kasar (tapak bangunan, tangga)
      g.fillStyle = '#a8a8a8'; g.fillRect(0, 0, P, P);
      const n = 3, s = P / n;
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const b = 205 + R(x + y * 5, 71) * 40; g.fillStyle = `rgb(${b},${b},${b})`; g.fillRect(x * s + 3, y * s + 3, s - 6, s - 6); }
      specks(g, wrap, 900, ['rgba(80,80,80,.3)', 'rgba(255,255,255,.3)'], 1, 2.4, 72);
    });
  }, 4));
};

// ---------- Tampalan shader ----------
// Uniform dikongsi: masa, kedudukan pemain (rumput tunduk), angin, lubang pandangan (uHole = x,y piksel, kedalaman pemain, jejari piksel)
const U3 = { uTime: { value: 0 }, uPlayer: { value: new THREE.Vector3(0, 0, 0) }, uWind: { value: 1 }, uHole: { value: new THREE.Vector4(0, 0, 0, 0) } };
const HOLE_FS = `
  if (uHole.w > .5) {
    float vd = 1.0 / gl_FragCoord.w;
    if (vd < uHole.z - .5) {
      float dh = length((gl_FragCoord.xy - uHole.xy) * vec2(1.0, .78));
      float kh = smoothstep(uHole.w * .55, uHole.w, dh);
      float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
      if (kh < ign) discard;
    }
    if (vd < 2.6) { float ign2 = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715)))); if ((vd - 1.0) / 1.6 < ign2) discard; }
  }`;
// Tampalan bahan dunia. o: { wind (kekuatan), bend (rumput tunduk), uvh (tinggi dari uv.y), hole (lubang pandangan), atlas (tekstur), tag }
function worldPatch(mat, o = {}) {
  const wind = (o.wind || 0).toFixed(3), bend = (o.bend || 0).toFixed(3), key = ['wp', wind, bend, o.uvh ? 1 : 0, o.hole ? 1 : 0, o.atlas ? 1 : 0, o.ss ? 1 : 0, o.tag || ''].join('_');
  mat.onBeforeCompile = sh => {
    sh.uniforms.uTime = U3.uTime; sh.uniforms.uPlayer = U3.uPlayer; sh.uniforms.uWind = U3.uWind; sh.uniforms.uHole = U3.uHole;
    if (o.atlas) sh.uniforms.uAtlas = { value: o.atlas };
    let vs = sh.vertexShader, fs = sh.fragmentShader;
    vs = 'uniform float uTime; uniform vec3 uPlayer; uniform float uWind;\n' + (o.atlas ? 'attribute float aCell; varying float vCell; varying vec2 vTU;\n' : '') + vs;
    if (o.wind || o.bend) {
      vs = vs.replace('#include <begin_vertex>', `#include <begin_vertex>
      {
        #ifdef USE_INSTANCING
          vec3 iP = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
        #else
          vec3 iP = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif
        float hh = ${o.uvh ? 'uv.y * uv.y * 2.2' : 'max(transformed.y, 0.0)'};
        float ph = uTime * 1.6 + iP.x * .7 + iP.z * .55;
        transformed.x += (sin(ph) + sin(ph * 2.3 + 1.7) * .4) * hh * .05 * ${wind} * uWind;
        transformed.z += (cos(ph * .83) + sin(ph * 1.9) * .3) * hh * .04 * ${wind} * uWind;
        transformed.x += sin(uTime * 3.1 + position.x * 5.0 + position.z * 3.0) * hh * .012 * ${wind} * uWind;
        #if ${o.bend ? 1 : 0}
          vec2 dp = iP.xz - uPlayer.xz; float dl = length(dp);
          float fb = (1.0 - smoothstep(0.0, 1.1, dl)) * hh * ${bend} * .55;
          transformed.xz += dp / max(dl, .05) * fb;
          transformed.y -= fb * .5;
        #endif
      }`);
    }
    if (o.atlas) vs = vs.replace('#include <begin_vertex>', '#include <begin_vertex>\n vCell = aCell; vTU = uv;');
    fs = 'uniform vec4 uHole;\n' + (o.atlas ? 'uniform sampler2D uAtlas; varying float vCell; varying vec2 vTU;\n' : '') + fs;
    if (o.hole) fs = fs.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n' + HOLE_FS);
    if (o.atlas) fs = fs.replace('#include <map_fragment>', `
      vec2 acl = vec2(floor(mod(vCell + .5, 4.0)), floor((vCell + .5) / 4.0));
      vec2 ak = vec2(240.0 / 1024.0);
      vec2 auv = (acl * 256.0 + 8.0) / 1024.0 + fract(vTU) * ak;
      diffuseColor *= textureGrad(uAtlas, auv, dFdx(vTU) * ak, dFdy(vTU) * ak);`);
    if (o.ss) fs = fs.split('gl_FrontFacing').join('true'); // daun dua-sisi: cahaya sama pada kedua-dua muka
    sh.vertexShader = vs; sh.fragmentShader = fs;
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}

// ---------- Bahan dikongsi ----------
const MAT = {
  ready: false,
  init(gl2) {
    if (this.ready) return;
    this.ready = true; this.gl2 = gl2;
    const L = o => new THREE.MeshLambertMaterial(Object.assign({ vertexColors: true }, o));
    this.rigid = worldPatch(L(), { hole: 1, tag: 'rigid' });
    this.veg = worldPatch(L(), { wind: .9, hole: 1, tag: 'veg' });
    this.leaf = worldPatch(L({ side: THREE.DoubleSide }), { wind: 1.7, hole: 1, ss: 1, tag: 'leaf' });
    this.grass = worldPatch(L({ side: THREE.DoubleSide }), { wind: 1.5, bend: 1, uvh: 1, ss: 1, tag: 'grass' });
    this.bld = gl2 ? worldPatch(L(), { hole: 1, atlas: TEX.buildAtlas(), tag: 'bld' }) : worldPatch(L(), { hole: 1, tag: 'bld0' });
    this.glow = new THREE.MeshBasicMaterial({ vertexColors: true, fog: true });
    this.sign = new THREE.MeshLambertMaterial({ map: null });
  },
  isShared(m) { return m === this.rigid || m === this.veg || m === this.leaf || m === this.grass || m === this.bld || m === this.glow || m === this.sign; },
};
