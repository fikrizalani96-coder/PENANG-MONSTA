'use strict';
// ===== Bangunan 3D bergaya Malaysia: rumah kampung bertiang, klinik, rumah kedai Pulau Pinang, dewan gim, menara, gudang, rumah agam =====
// Setiap bangunan dibina daripada kotak/silinder/tiub/poligon ekstrusi sebenar: tiang, lantai, dinding berbingkai, tingkap berdaun,
// bumbung berjuntai, tiang serambi, tangga. Koordinat tempatan: asal = sudut barat laut tapak, +x timur, +z selatan (hadapan), +y atas.
// Hasil: { gB (atlas), gR (warna bucu), gG (bercahaya), signs, stairs, top }.
const BLD = {
  pick(a, seed, k = 0) { return a[Math.floor(hash(seed, k, 500) * a.length) % a.length]; },
  make(ch, w, h, doors, seed) {
    const S = { gB: new GB(), gR: new GB(), gG: new GB(), w, h, d: h - .1, zf: h - .06, seed, doors, signs: [], stairs: [], top: 2, ch };
    this['b_' + ch](S);
    return S;
  },
  // ----- perkakas -----
  box(g, cell, x, y, z, sx, sy, sz, col, o) { g.c(cell).bx(x, y, z, sx, sy, sz, col, o); },
  // Tingkap menghadap +z pada permukaan dinding di (cx,cy). o: frame, w, h, cross, sill, shutter (warna), ac
  win(S, cx, cy, o = {}) {
    const { gB, gR } = S, w = o.w || .36, h = o.h || .42, t = .035, dp = .05, fr = o.frame || '#f6efe0';
    gB.push().t(cx, cy, 0);
    if (o.glow) { // kaca bercahaya (tingkap bilik dalam): siang = langit cerah, malam = biru tua berbintang
      S.gG.push().t(cx, cy, 0);
      S.gG.quad([-w / 2, h / 2, .008], [-w / 2, -h / 2, .008], [w / 2, -h / 2, .008], [w / 2, h / 2, .008], o.glow, 1, [0, 0, 1]);
      if (o.night) for (let i = 0; i < 4; i++) S.gG.bx((hash(cx, i, 620) - .5) * w * .8, (hash(cx, i, 621) - .5) * h * .8, .012, .025, .025, .005, '#fff4c0');
      else S.gG.bx(-w * .18, h * .12, .012, w * .22, h * .1, .004, '#ffffff');
      S.gG.pop();
    } else gB.c(5).quad([-w / 2, h / 2, .006], [-w / 2, -h / 2, .006], [w / 2, -h / 2, .006], [w / 2, h / 2, .006], '#ffffff', Math.max(w, h), [0, 0, 1]);
    gB.c(7);
    gB.bx(0, h / 2 + t / 2, dp / 2, w + t * 2, t, dp, fr, { skip: '-z-y' }); gB.bx(0, -h / 2 - t / 2, dp / 2, w + t * 2, t, dp, fr, { skip: '-z' });
    gB.bx(-w / 2 - t / 2, 0, dp / 2, t, h, dp, fr, { skip: '-z' }); gB.bx(w / 2 + t / 2, 0, dp / 2, t, h, dp, fr, { skip: '-z' });
    if (o.cross) { gB.bx(0, 0, dp / 2, w, .022, .03, fr, { skip: '-z' }); gB.bx(0, 0, dp / 2, .022, h, .03, fr, { skip: '-z' }); }
    if (o.sill !== false) gB.bx(0, -h / 2 - t - .015, dp / 2 + .03, w + .14, .03, dp + .06, o.sillCol || '#d8cfc0', { skip: '-z' });
    if (o.shutter) {
      for (const s of [-1, 1]) {
        gB.push().t(s * (w / 2 + t), 0, .02).ry(-s * (o.open === undefined ? .75 : o.open)).t(s * w / 4, 0, 0).c(0).box(w / 2 - .005, h + .04, .025, o.shutter, { skip: '-z' }).pop();
      }
    }
    gB.pop();
  },
  // pintu berpanel pada satah semasa
  doorLeaf(S, cx, w, hgt, col, o = {}) {
    const { gB } = S;
    gB.push().t(cx, 0, 0);
    gB.c(0).bx(0, hgt / 2, 0, w, hgt, .045, col, { skip: '-z' });
    if (!o.glass) {
      for (const s of [-1, 1]) gB.c(7).bx(s * w * .24, hgt * .68, .028, w * .38, hgt * .32, .012, rgbMul(col, 1.18), { skip: '-z' });
      for (const s of [-1, 1]) gB.c(7).bx(s * w * .24, hgt * .27, .028, w * .38, hgt * .32, .012, rgbMul(col, 1.18), { skip: '-z' });
    } else {
      for (const s of [-1, 1]) gB.c(5).quad([s * w * .48 - w * .02 * s, hgt * .92, .03], [s * w * .48 - w * .02 * s, hgt * .06, .03], [s * .02 * w, hgt * .06, .03], [s * .02 * w, hgt * .92, .03], '#ffffff', hgt, [0, 0, 1]);
      gB.c(7).bx(0, hgt / 2, .03, .03, hgt, .03, '#9aa0aa', { skip: '-z' });
    }
    gB.c(7).bx(w * .38, hgt * .48, .06, .03, .03, .04, '#e6c65a', { skip: '-z' }); // tombol
    gB.pop();
  },
  // dinding hadapan berlekuk pintu (alcove): kembalikan senarai [x0,x1] lekuk. o: { y0, hw, col, cell, alc, doorH, lintel, uvs }
  front(S, o) {
    const { gB, w, zf } = S, alc = o.alc === undefined ? .48 : o.alc, y0 = o.y0 || 0, hw = o.hw, z0 = o.z0 === undefined ? .03 : o.z0, cell = o.cell === undefined ? 1 : o.cell, doorH = o.doorH || .8;
    const doors = S.doors.slice().sort((a, b) => a - b), cuts = [];
    let xa = .03;
    const seg = (x0, x1) => { if (x1 - x0 > .01) gB.c(cell).bx((x0 + x1) / 2, y0 + hw / 2, (z0 + zf) / 2, x1 - x0, hw, zf - z0, o.col, { skip: '-z-y', uvs: o.uvs || 1 }); };
    for (const i of doors) {
      const dx0 = i + .06, dx1 = i + .94;
      seg(xa, dx0);
      gB.c(cell).bx((dx0 + dx1) / 2, y0 + hw / 2, (z0 + zf - alc) / 2, dx1 - dx0, hw, zf - alc - z0, o.col, { skip: '-z-y', uvs: o.uvs || 1 });
      if (hw > doorH) gB.c(cell).bx((dx0 + dx1) / 2, y0 + doorH + (hw - doorH) / 2, (zf - alc + zf) / 2, dx1 - dx0, hw - doorH, alc, o.col, { skip: '-z-y', uvs: o.uvs || 1 });
      cuts.push([dx0, dx1, zf - alc]);
      xa = dx1;
    }
    seg(xa, S.w - .03);
    return cuts;
  },
  // bumbung pelana (rabung sepanjang x). Kembalikan { top }. o: yE (tinggi cucur), rh, ov, col, cell, uvs
  gable(S, o) {
    const { gR, gB } = S, ov = o.ov === undefined ? .26 : o.ov, x0 = -ov, x1 = S.w + ov, zc = S.d / 2 + .03, half = S.d / 2 + ov, rh = o.rh, yE = o.yE, cell = o.cell === undefined ? 2 : o.cell;
    const col = o.col, dk = rgbMul(col, .62), lt = rgbMul(col, 1.15);
    for (const s of [-1, 1]) {
      const ze = zc + s * half, yr = yE + rh;
      gB.c(cell).quad([x0, yr, zc], [x1, yr, zc], [x1, yE, ze], [x0, yE, ze], col, o.uvs || 1.1, [0, 1, s]);
      // papan cucur + tebal bumbung
      gB.c(7).bx((x0 + x1) / 2, yE - .025, ze, x1 - x0, .07, .05, dk, { skip: '' });
    }
    // rabung
    gB.c(7).bx((x0 + x1) / 2, yE + rh + .02, zc, x1 - x0 + .04, .07, .16, dk, { skip: '-y' });
    return { top: yE + rh };
  },
  // segi tiga pelana di hujung (poligon ekstrusi menghadap sisi)
  gableEnds(S, yE, rh, col, cell = 0) {
    const { gB } = S, zc = S.d / 2 + .03;
    for (const x of [.035, S.w - .035]) {
      gB.push().t(x, yE, zc).ry(Math.PI / 2).c(cell).poly([[-S.d / 2, 0], [S.d / 2, 0], [0, rh * .985]], .05, col, { uvs: 1 }).pop();
    }
  },
  // bumbung sisi empat (hip): 4 permukaan dari rabung pendek
  hip(S, o) {
    const { gB } = S, ov = o.ov === undefined ? .28 : o.ov, x0 = -ov, x1 = S.w + ov, z0 = -ov + .03, z1 = S.d + ov + .03, yE = o.yE, rh = o.rh, cell = o.cell === undefined ? 2 : o.cell, col = o.col;
    const inx = Math.min((x1 - x0) * .4, (z1 - z0) * .45), rx0 = x0 + inx, rx1 = x1 - inx, rz = (z0 + z1) / 2, yr = yE + rh;
    const dk = rgbMul(col, .62);
    gB.c(cell);
    gB.quad([rx0, yr, rz], [rx1, yr, rz], [x1, yE, z1], [x0, yE, z1], col, o.uvs || 1.1, [0, 1, 1]);
    gB.quad([rx1, yr, rz], [rx0, yr, rz], [x0, yE, z0], [x1, yE, z0], col, o.uvs || 1.1, [0, 1, -1]);
    gB.triuv([rx0, yr, rz], [x0, yE, z1], [x0, yE, z0], col, o.uvs || 1.1, [-1, 1, 0]);
    gB.triuv([rx1, yr, rz], [x1, yE, z0], [x1, yE, z1], col, o.uvs || 1.1, [1, 1, 0]);
    gB.c(7);
    gB.bx((x0 + x1) / 2, yE - .03, z1, x1 - x0, .07, .05, dk); gB.bx((x0 + x1) / 2, yE - .03, z0, x1 - x0, .07, .05, dk);
    gB.bx(x0, yE - .03, rz, .05, .07, z1 - z0, dk); gB.bx(x1, yE - .03, rz, .05, .07, z1 - z0, dk);
    gB.bx((rx0 + rx1) / 2, yr + .02, rz, rx1 - rx0 + .08, .06, .1, dk);
    return { top: yr };
  },
  // tiang bulat dengan tapak dan kepala
  column(S, x, z, hgt, r, col, o = {}) {
    const g = S.gR;
    g.push().t(x, 0, z);
    g.cyl(r, r * 1.06, hgt, 10, col, { ao: [.7, 1.05], cap: true });
    g.bx(0, .04, 0, r * 2.8, .08, r * 2.8, rgbMul(col, .9)); g.bx(0, hgt - .03, 0, r * 2.6, .06, r * 2.6, rgbMul(col, 1.05));
    if (o.cap) g.bx(0, hgt + .02, 0, r * 3.4, .05, r * 3.4, rgbMul(col, .95));
    g.pop();
  },
  sign(S, text, x, y, z, w, h, ry = 0) { S.signs.push({ text, x, y, z, w, h, ry }); },
  // AC dinding kecil
  acUnit(S, x, y, z) { S.gR.bx(x, y, z, .22, .13, .14, '#e8ecef', { ao: [.85, 1] }); S.gR.bx(x, y, z + .075, .18, .09, .01, '#7a8088'); },

  // ================= H: rumah kampung bertiang =================
  b_H(S) {
    const { gB, gR, w, d, zf, seed } = S, L = .38, Hw = 1.05, yE = L + Hw;
    const wall = this.pick(['#c98f5a', '#b9a06a', '#a87c50', '#d9c090', '#93b0a0', '#c0a080'], seed), roof = this.pick(['#b04a3c', '#5a7a94', '#5a8a5a', '#8a5a3c', '#a05a44'], seed, 1);
    const zinc = hash(seed, 7, 500) < .6;
    const trim = rgbMul(wall, .68);
    // tiang & lantai
    const nx = Math.max(2, Math.round(w) + 1);
    for (let i = 0; i < nx; i++) for (const z of [.14, d - .08]) { const x = .12 + i * (w - .24) / (nx - 1); gR.push().t(x, 0, z); gR.cyl(.055, .065, L, 8, '#7a5a3a', { ao: [.6, 1] }); gR.bx(0, .035, 0, .17, .07, .17, '#8a8a8a'); gR.pop(); }
    gB.c(0).bx(w / 2, L - .04, d / 2 + .03, w + .04, .08, d + .05, '#7a5030', { skip: '-y', uvs: 1 });
    // dinding
    gB.c(0).bx(w / 2, L + .07, d / 2 + .03, w - .02, .14, d - .02, rgbMul(wall, .72), { skip: '-y', uvs: 1 });
    const cuts = this.front(S, { y0: L, hw: Hw, col: wall, cell: 0, alc: .5, doorH: .82 });
    gB.c(0).bx(w / 2, L + Hw / 2, .04 + .02, w - .08, Hw, .05, wall, { skip: '-y', uvs: 1 });
    for (const x of [.035, w - .035]) gB.c(0).bx(x, L + Hw / 2, d / 2 + .03, .07, Hw, d - .02, wall, { skip: '-y', uvs: 1 });
    // pita dinding atas + alur tengah
    gB.c(7).bx(w / 2, yE - .03, zf - .01, w - .02, .06, .05, trim, { skip: '-y' });
    gB.c(7).bx(w / 2, L + .17, zf - .0, w + .0, .04, .05, trim, { skip: '-y' });
    // pintu + tangga
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, L, zr).c(0); this.doorLeaf({ gB, gR }, cx, .66, .78, '#7a4a26'); gB.pop();
      // lantai serambi + tangga kayu (tinggi pemain mengikut S.stairs)
      gB.c(0).bx(cx, L - .04, (zr + zf) / 2, dx1 - dx0, .08, zf - zr, '#8a5a32', { skip: '-y' });
      for (let k = 0; k < 3; k++) gB.c(0).bx(cx, (k + 1) * L / 6, zf + .093 + (2 - k) * .187, .84, (k + 1) * L / 3, .187, '#9a6a3c', { skip: '-y' });
      S.stairs.push({ x0: dx0, x1: dx1, z0: zf, z1: S.h + .5, y0: L, y1: 0 });
      for (const s of [-1, 1]) { gR.bx(cx + s * .44, L + .22, zf + .18, .04, .04, .55, '#6a4424'); gR.bx(cx + s * .44, L + .0, zf + .43, .045, L + .16, .045, '#6a4424'); gR.bx(cx + s * .44, L + .18, zr + .04, .045, .44, .045, '#6a4424'); }
    }
    // tingkap dengan daun tingkap terbuka
    for (let i = 0; i < w; i++) {
      if (S.doors.includes(i)) continue;
      gB.push().t(0, 0, zf); this.win(S, i + .5, L + .64, { w: .34, h: .44, frame: '#f2e6cc', shutter: rgbMul(wall, .8), cross: true }); gB.pop();
    }
    for (const [x, ry] of [[.035, -Math.PI / 2], [w - .035, Math.PI / 2]]) { gB.push().t(x, 0, d / 2 + .03).ry(ry); this.win(S, 0, L + .64, { w: .34, h: .44, frame: '#f2e6cc', shutter: rgbMul(wall, .8), cross: true }); gB.pop(); }
    // bumbung
    const rh = .5 + d * .12, R = this.gable(S, { yE, rh, ov: .3, col: roof, cell: zinc ? 3 : 2, uvs: zinc ? 1.2 : 1.1 });
    this.gableEnds(S, yE, rh, wall, 0);
    gR.push().t(0, 0, 0);
    for (const x of [-.06, w + .06]) { // hiasan tebar layar di rabung
      for (const s of [-1, 1]) gR.push().t(x, yE + rh + .14, S.d / 2 + .03).rz(s * .55).bx(0, 0, 0, .025, .32, .03, trim).pop();
    }
    gR.bx(w / 2, yE + rh * .42, S.d + .09, .18, .14, .02, '#3a2818'); // lubang angin belakang
    gR.pop();
    // bumbung kecil di atas serambi
    if (S.doors.length) for (const i of S.doors) { gB.c(zinc ? 3 : 2); gB.quad([i + .0, yE - .1, zf - .55], [i + 1, yE - .1, zf - .55], [i + 1, yE - .38, zf + .32], [i, yE - .38, zf + .32], roof, 1.1, [0, 1, 1]); gB.c(7).bx(i + .5, yE - .4, zf + .32, 1, .05, .05, rgbMul(roof, .6)); }
    if (hash(seed, 5, 500) < .5) { gR.push().t(w - .2, yE + rh * .4, S.d * .4); gR.cyl(.05, .05, .5, 8, '#c8c8c8'); gR.pop(); } // pengering/ventilasi
    S.top = R.top + .1;
  },

  // ================= P: klinik kesihatan =================
  b_P(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, wh = 1.72, plinth = .24;
    const white = '#f6f3ec', teal = '#3aa39c';
    gB.c(1).bx(w / 2, wh / 2, d / 2 + .03, w - .04, wh, d, white, { skip: '-y' });
    // plinth
    gB.c(7).bx(w / 2, plinth / 2, d / 2 + .03, w + .04, plinth, d + .06, teal, { skip: '-y', uvs: 1.4 });
    const cuts = this.front(S, { y0: 0, hw: wh, col: white, cell: 1, alc: .46, doorH: .95 });
    gB.c(7).bx(w / 2, plinth / 2, zf + .03, w + .04, plinth, .06, teal, { skip: '-y' });
    // jalur teal di atas dinding
    gB.c(1).bx(w / 2, wh - .12, zf + .02, w + .04, .18, .1, teal, { skip: '-y' });
    gB.c(1).bx(w / 2, wh - .04, zf + .02, w + .1, .05, .13, '#ffffff', { skip: '-y' });
    // pintu kaca berkembar + portico
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, 0, zr); this.doorLeaf({ gB, gR }, cx, .78, .92, '#dfe6ee', { glass: true }); gB.pop();
      gB.c(7).bx(cx, .02, (zr + zf) / 2 + .1, dx1 - dx0 + .2, .04, zf - zr + .2, '#d8d4cc', { skip: '-y' });
      // atap portico + tiang
      gB.c(1).bx(cx, 1.16, zf + .1, 1.16, .07, .38, '#ffffff', { skip: '-y' });
      gB.c(7).bx(cx, 1.2, zf + .1, 1.2, .025, .42, teal, { skip: '-y' });
      // lambang palang merah
      gR.bx(cx, wh - .38, zf + .08, .34, .34, .03, '#ffffff'); gR.bx(cx, wh - .38, zf + .1, .24, .075, .02, '#e0353a'); gR.bx(cx, wh - .38, zf + .1, .075, .24, .02, '#e0353a');
      this.sign(S, 'KLINIK', cx, wh - .1, zf + .09, .82, .24, 0);
    }
    for (let i = 0; i < w; i++) {
      if (S.doors.includes(i)) continue;
      gB.push().t(0, 0, zf + .0); this.win(S, i + .5, .95, { w: .58, h: .5, frame: '#ffffff', cross: true, sillCol: '#ffffff' }); gB.pop();
      if (hash(seed, i, 501) < .5) this.acUnit({ gB, gR }, i + .5, .5, zf + .05);
    }
    for (const [x, ry] of [[.035, -Math.PI / 2], [w - .035, Math.PI / 2]]) for (let k = 0; k < Math.max(1, Math.floor(d / 1.6)); k++) { gB.push().t(x, 0, .5 + (k + .5) * (d - .5) / Math.max(1, Math.floor(d / 1.6)) + .0).ry(ry); this.win(S, 0, .95, { w: .5, h: .48, frame: '#ffffff', cross: true, sillCol: '#ffffff' }); gB.pop(); }
    const R = this.hip(S, { yE: wh, rh: .5 + d * .09, ov: .3, col: '#d0503f', cell: 2 });
    gR.bx(w * .7, R.top + .1, S.d / 2, .14, .3, .14, '#ffffff'); // corong asap
    S.top = R.top + .3;
  },

  // ================= M: rumah kedai Pulau Pinang =================
  b_M(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, wh = 2.15, gf = 1.0;
    const wall = this.pick(['#f0c84c', '#eb96a6', '#7fc8bb', '#f2e4c4', '#eaa86c', '#9dbae0', '#e6b8d8'], seed), trim = '#fbf6ea', accent = this.pick(['#3f7a5a', '#a03a3a', '#2f5a9a', '#6a3a7a'], seed, 2);
    gB.c(1).bx(w / 2, wh / 2, d / 2 + .03, w - .04, wh, d, wall, { skip: '-y' });
    const cuts = this.front(S, { y0: 0, hw: wh, col: wall, cell: 1, alc: .44, doorH: .9 });
    // kaki lima: tiang segi empat menyokong tingkat atas + dinding bawah dengan tingkap kedai
    gB.c(1).bx(w / 2, wh - .08, zf + .04, w + .06, .16, .14, trim, { skip: '-y' }); // korniche
    gB.c(1).bx(w / 2, gf + .05, zf + .03, w + .04, .1, .11, trim, { skip: '-y' });    // jalur antara tingkat
    gB.c(7).bx(w / 2, .09, zf + .03, w + .04, .18, .1, rgbMul(wall, .7), { skip: '-y' });
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, 0, zr); this.doorLeaf({ gB, gR }, cx, .74, .86, '#9a3a30', { glass: false }); gB.pop();
      gB.c(7).bx(cx, .02, (zr + zf) / 2 + .0, .9, .04, zf - zr + .1, '#cfc8bb', { skip: '-y' });
      this.sign(S, this.pick(['KEDAI', 'KEDAI RUNCIT', 'KOPITIAM', 'KEDAI KOPI', 'BARANG'], seed, 3), cx, gf + .38, zf + .09, .9, .3, 0);
      // tanglung merah
      for (const s of [-1, 1]) { gG.push().t(cx + s * .5, .86, zf + .18); gG.sph(.075, 8, 6, '#ff4a3a'); gG.pop(); gR.bx(cx + s * .5, .95, zf + .18, .012, .1, .012, '#3a2a20'); }
    }
    for (let i = 0; i < w; i++) {
      // tingkap kedai bawah (kaca lebar) dan tingkap atas berdaun hijau
      if (!S.doors.includes(i)) { gB.push().t(0, 0, zf + .02); this.win(S, i + .5, .5, { w: .6, h: .5, frame: '#5a4636', cross: true, sillCol: '#c8c0b0' }); gB.pop(); }
      gB.push().t(0, 0, zf + .02); this.win(S, i + .5, gf + .72, { w: .3, h: .56, frame: trim, shutter: accent, open: .9, sillCol: trim }); gB.pop();
      gR.bx(i + .5, gf + .72 + .36, zf + .06, .5, .06, .1, trim); // kepala tingkap melengkung
      gR.push().t(i + .5, gf + 1.14, zf + .04); gR.cyl(.05, .05, .02, 10, rgbMul(wall, .8)); gR.pop();
      if (hash(seed, i, 502) < .35) this.acUnit({ gB, gR }, i + .5, gf + .32, zf + .1);
    }
    // sisi
    for (const [x, ry] of [[.035, -Math.PI / 2], [w - .035, Math.PI / 2]]) { gB.push().t(x, 0, d / 2 + .03).ry(ry); this.win(S, 0, gf + .72, { w: .3, h: .56, frame: trim, shutter: accent, open: .9 }); this.win(S, .0, .55, { w: .4, h: .4, frame: trim }); gB.pop(); }
    // bumbung genting di belakang parapet
    const rh = .45 + d * .1;
    const R = this.gable(S, { yE: wh - .02, rh, ov: .1, col: '#b8503a', cell: 2 });
    this.gableEnds(S, wh - .02, rh, wall, 1);
    // dinding parapet + gables hiasan
    gB.c(1);
    gB.push().t(w / 2, wh, zf - .02).poly([[-w / 2 + .03, 0], [w / 2 - .03, 0], [w / 2 - .03, .1], [w * .3, .18], [w * .16, .3], [0, .38], [-w * .16, .3], [-w * .3, .18], [-w / 2 + .03, .1]], .08, wall, { uvs: 1 }).pop();
    gR.push().t(w / 2, wh + .16, zf + .03); gR.cyl(.09, .09, .02, 12, '#f0e6cc'); gR.pop();
    // awning berjalur
    const stripes = Math.max(4, Math.round(w * 4)), sc = this.pick([['#e0483a', '#fbf6ea'], ['#2f6ac0', '#fbf6ea'], ['#2f9a5a', '#fbf6ea']], seed, 4);
    for (let i = 0; i < stripes; i++) {
      const x0 = .02 + (w - .04) * i / stripes, x1 = .02 + (w - .04) * (i + 1) / stripes, c = sc[i % 2];
      gR.quad([x0, gf - .1, zf + .0], [x1, gf - .1, zf + .0], [x1, gf - .34, zf + .42], [x0, gf - .34, zf + .42], c, 1, [0, 1, 1]);
      gR.bx((x0 + x1) / 2, gf - .4, zf + .42, x1 - x0, .07, .02, c);
    }
    S.top = R.top + .4;
  },

  // ================= G: dewan gim =================
  b_G(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, wh = 1.9, pod = .14;
    const wall = '#ebe5f5', pur = '#7c56b8', gold = '#e8c458';
    gB.c(7).bx(w / 2, pod / 2, d / 2 + .03, w + .1, pod, d + .12, '#c9c4d6', { skip: '-y', uvs: 1.4 });
    gB.c(1).bx(w / 2, pod + wh / 2, d / 2 + .0, w - .3, wh, d - .1, wall, { skip: '-y' });
    const cuts = this.front(S, { y0: pod, hw: wh, col: wall, cell: 1, alc: .4, doorH: 1.0, z0: .15 });
    // tiang hadapan
    const n = Math.max(2, Math.round(w) + 1);
    for (let i = 0; i < n; i++) { const x = .18 + i * (w - .36) / (n - 1); if (S.doors.some(dd => Math.abs(x - (dd + .5)) < .58)) continue; this.column(S, x, zf + .08, wh + pod, .085, '#fbf7ee', { cap: true }); }
    gR.bx(w / 2, wh + pod - .02, zf + .08, w, .12, .3, '#fbf7ee'); gR.bx(w / 2, wh + pod + .1, zf + .08, w + .04, .06, .34, pur);
    // pedimen segi tiga dengan lambang
    gR.push().t(w / 2, wh + pod + .12, zf + .07).poly([[-w / 2 + .05, 0], [w / 2 - .05, 0], [0, .4]], .09, '#f4effa').pop();
    gG.push().t(w / 2, wh + pod + .25, zf + .13); gG.cyl(.11, .11, .02, 20, gold, { cap: true }); gG.pop();
    gR.push().t(w / 2, wh + pod + .25, zf + .12).rx(Math.PI / 2).cyl(.13, .13, .02, 20, pur, { cap: true }).pop();
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, pod, zr); this.doorLeaf({ gB, gR }, cx, .82, 1.0, '#5a3a86', { glass: false }); gB.pop();
      gR.bx(cx, pod + 1.08, zr + .02, .96, .1, .06, gold);
      for (const s of [-1, 1]) { // sepanduk + obor
        gR.bx(cx + s * .62, pod + .82, zf + .16, .16, .58, .012, s > 0 ? '#c8383a' : '#3a66c8'); gR.bx(cx + s * .62, pod + 1.12, zf + .16, .2, .03, .03, gold);
        gR.bx(cx + s * .62, pod + .35, zf + .16, .035, .5, .035, '#6a4a2a'); gG.push().t(cx + s * .62, pod + .66, zf + .16); gG.cone(.045, .13, 6, '#ffb040', { cap: false }); gG.pop();
      }
      // tangga marmar
      for (let k = 0; k < 2; k++) gB.c(7).bx(cx, pod * .5 * (2 - k) - .0, zf + .12 + k * .12, 1.1, .07 * (2 - k), .16, '#d8d4de', { skip: '-y' });
    }
    for (let i = 0; i < w; i++) { if (S.doors.includes(i)) continue; gB.push().t(0, 0, zf - .0); this.win(S, i + .5, pod + .95, { w: .3, h: .7, frame: '#ffffff', sillCol: '#ffffff' }); gB.pop(); }
    const R1 = this.hip(S, { yE: wh + pod + .1, rh: .32, ov: .42, col: pur, cell: 2 });
    // tingkat kedua bumbung (kecil dan tinggi)
    gB.push().t(w * .12, R1.top - .02, d * .12);
    gB.c(1).bx(w * .38, .12, d * .38, w * .76, .24, d * .76, wall, { skip: '-y' });
    gB.pop();
    gB.push().t(w * .12, R1.top + .1, d * .12);
    const R2 = this.hip({ gB, w: w * .76, d: d * .76 }, { yE: 0, rh: .34, ov: .26, col: '#6a44a4', cell: 2 });
    gB.pop();
    // hujung bumbung terjungkit (hiasan)
    for (const [x, z] of [[-.4, -.4 + .03], [w + .4, -.4 + .03], [-.4, S.d + .4 + .03], [w + .4, S.d + .4 + .03]]) gR.push().t(x, wh + pod + .14, z).rz(x < 0 ? .5 : -.5).bx(0, .08, 0, .06, .2, .06, gold).pop();
    S.top = R1.top + .55;
  },

  // ================= B: menara pejabat =================
  b_B(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, lobby = .78, hgt = 2.3 + Math.max(0, S.h - 4) * .75 + w * .05;
    const body = this.pick(['#e6ecf2', '#dfe6ee', '#eef0f3'], seed);
    // lobi kaca
    gB.c(6).bx(w / 2, lobby / 2, d / 2 + .03, w + .02, lobby, d + .02, '#ffffff', { skip: '-y', uvs: 1.3 });
    gB.c(7).bx(w / 2, .05, d / 2 + .03, w + .06, .1, d + .06, '#8a8f98', { skip: '-y' });
    const cuts = this.front(S, { y0: 0, hw: lobby, col: '#ffffff', cell: 6, alc: .42, doorH: .78, uvs: 1.3 });
    // badan menara: tirai kaca
    const bw = w - .2, bd = d - .2;
    gB.c(6).bx(w / 2, lobby + (hgt - lobby) / 2, d / 2 + .03, bw, hgt - lobby, bd, '#ffffff', { skip: '-y', uvs: 1.45 });
    // tulang tegak & jalur tingkat
    for (let i = 0; i <= Math.round(bw * 2); i++) gR.bx(.1 + i * bw / Math.round(bw * 2), lobby + (hgt - lobby) / 2, d / 2 + .03 + bd / 2 + .01, .03, hgt - lobby, .03, '#c8ced6');
    for (let y = lobby + .3; y < hgt; y += .4) gR.bx(w / 2, y, d / 2 + .03 + bd / 2 + .005, bw, .022, .03, '#c8ced6');
    // bumbung + peralatan
    gR.bx(w / 2, hgt + .03, d / 2 + .03, bw + .06, .06, bd + .06, '#9aa0aa', { skip: '-y' });
    gR.bx(w / 2, hgt + .12, d / 2 + .03, bw + .1, .12, .07, '#c4cad2');
    gR.push().t(w * .3, hgt + .06, d * .35); gR.cyl(.22, .22, .42, 14, '#6aa0d8', { cap: true, ao: [.75, 1.05] }); gR.pop();
    gR.bx(w * .7, hgt + .22, d * .5, .5, .34, .42, '#dfe3e8'); gR.bx(w * .7, hgt + .4, d * .5, .4, .04, .34, '#b8c0c8');
    gR.push().t(w * .55, hgt + .06, d * .7); gR.cyl(.02, .03, 1.1, 6, '#a8b0b8'); gR.pop();
    gG.push().t(w * .55, hgt + 1.18, d * .7); gG.sph(.05, 6, 4, '#ff3a3a'); gG.pop();
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, 0, zr); this.doorLeaf({ gB, gR }, cx, .78, .74, '#dfe6ee', { glass: true }); gB.pop();
      gB.c(7).bx(cx, .74, zf + .18, 1.2, .05, .5, '#3a4a68', { skip: '-y' });
      for (const s of [-1, 1]) gR.bx(cx + s * .5, .38, zf + .42, .03, .76, .03, '#c0c6ce');
      this.sign(S, this.pick(['MENARA', 'PEJABAT', 'PLAZA'], seed, 5), cx, lobby + .13, zf + .05, .9, .24, 0);
    }
    S.top = hgt + 1.2;
  },

  // ================= W: gudang =================
  b_W(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, wh = 1.5, wall = this.pick(['#b9c3cc', '#a8b8c4', '#c4c0b0', '#9db4a8'], seed), roof = this.pick(['#8a98a4', '#7a8a96'], seed, 1);
    gB.c(3).bx(w / 2, wh / 2, d / 2 + .03, w - .04, wh, d, wall, { skip: '-y', uvs: 1 });
    gB.c(7).bx(w / 2, .09, d / 2 + .03, w + .04, .18, d + .04, '#8a8f96', { skip: '-y' });
    const cuts = this.front(S, { y0: 0, hw: wh, col: wall, cell: 3, alc: .3, doorH: .95 });
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      // pintu penggelek
      gB.c(3).bx(cx, .48, zr + .02, dx1 - dx0 - .1, .96, .05, '#7c8a96', { skip: '-y' });
      for (let k = 1; k < 8; k++) gR.bx(cx, k * .12, zr + .055, dx1 - dx0 - .12, .014, .015, '#4a525a');
      gR.bx(cx, .98, zr + .04, dx1 - dx0 + .04, .06, .08, '#d8a838');
      gB.c(7).bx(cx, .1, (zr + zf) / 2 + .1, dx1 - dx0, .2, zf - zr + .3, '#9a9aa0', { skip: '-y' });
      gG.push().t(cx, 1.12, zr + .09); gG.sph(.04, 6, 4, '#ffe08a'); gG.pop();
    }
    for (let i = 0; i < w; i++) if (!S.doors.includes(i) && i % 2 === 0) { gB.push().t(0, 0, zf); this.win(S, i + .5, 1.0, { w: .42, h: .18, frame: '#5a6068', sill: false }); gB.pop(); }
    gR.bx(w / 2, .62, zf + .06, w - .1, .05, .05, '#c8a838'); // jalur amaran
    const rh = .3 + d * .06, R = this.gable(S, { yE: wh, rh, ov: .12, col: roof, cell: 3, uvs: 1.2 });
    this.gableEnds(S, wh, rh, wall, 3);
    for (let i = 0; i < Math.max(1, Math.floor(w / 3)); i++) { gR.push().t(.9 + i * 2.6, R.top - .1, S.d / 2 + .03); gR.cyl(.1, .1, .22, 10, '#a8b0b8', { cap: true }); gR.bx(0, .26, 0, .3, .04, .3, '#7a828a'); gR.pop(); }
    gR.push().t(w - .2, .0, S.d * .3); gR.cyl(.04, .04, wh + .1, 6, '#5a6068'); gR.pop(); // paip
    S.top = R.top + .3;
  },

  // ================= R: rumah agam kolonial =================
  b_R(S) {
    const { gB, gR, gG, w, d, zf, seed } = S, wh = 2.0, lvl = .95, wall = this.pick(['#efe6cf', '#e8dcc0', '#f2ead8'], seed), shut = '#4a7a58', roof = '#6a8a5a';
    gB.c(7).bx(w / 2, .09, d / 2 + .03, w + .08, .18, d + .08, '#c8bfaa', { skip: '-y' });
    gB.c(1).bx(w / 2, wh / 2 + .1, d / 2 + .03, w - .3, wh - .1, d - .1, wall, { skip: '-y' });
    const cuts = this.front(S, { y0: .18, hw: wh - .18, col: wall, cell: 1, alc: .42, doorH: .95, z0: .15 });
    // beranda: tiang tinggi, lantai, susur tangan, balkoni
    const n = Math.max(3, Math.round(w) + 1);
    gB.c(7).bx(w / 2, .11, zf + .04, w - .04, .07, .3, '#d6cdb8', { skip: '-y' });
    for (let i = 0; i < n; i++) { const x = .16 + i * (w - .32) / (n - 1); if (S.doors.some(dd => Math.abs(x - (dd + .5)) < .58)) continue; this.column(S, x, zf + .06, wh - .05, .075, '#fbf7ee', { cap: true }); }
    gR.bx(w / 2, wh - .02, zf + .06, w - .1, .09, .28, '#fbf7ee'); gR.bx(w / 2, lvl + .14, zf + .06, w - .1, .04, .28, '#f2ebdb');
    for (let i = 0; i < Math.round(w * 5); i++) { const x = .16 + i * (w - .32) / (Math.round(w * 5) - 1); if (S.doors.some(dd => Math.abs(x - (dd + .5)) < .5)) continue; gR.bx(x, lvl + .26, zf + .17, .025, .22, .025, '#fbf7ee'); }
    gR.bx(w / 2, lvl + .38, zf + .17, w - .16, .035, .04, '#fbf7ee');
    for (const [dx0, dx1, zr] of cuts) {
      const cx = (dx0 + dx1) / 2;
      gB.push().t(0, .18, zr); this.doorLeaf({ gB, gR }, cx, .78, .9, '#3f6a4c'); gB.pop();
      gR.bx(cx, 1.12, zr + .02, .96, .07, .08, '#f2ebdb');
      gR.push().t(cx, wh + .05, zf + .06).poly([[-.7, 0], [.7, 0], [0, .3]], .12, '#f4efe2').pop();
      for (let k = 0; k < 3; k++) gB.c(7).bx(cx, .03 + k * .03, zf + .3 + (2 - k) * .1, 1.0, .06, .12, '#d8d0c0', { skip: '-y' });
      gG.push().t(cx, wh + .2, zf + .13); gG.sph(.07, 8, 6, '#f8d060'); gG.pop();
    }
    for (let i = 0; i < w; i++) { if (S.doors.includes(i)) continue; for (const y of [.62, lvl + .55]) { gB.push().t(0, 0, zf - .0); this.win(S, i + .5, y, { w: .3, h: .5, frame: '#ffffff', shutter: shut, open: .85, sillCol: '#ffffff' }); gB.pop(); } }
    for (const [x, ry] of [[.16, -Math.PI / 2], [w - .16, Math.PI / 2]]) for (const y of [.62, lvl + .55]) { gB.push().t(x, 0, d / 2 + .03).ry(ry); this.win(S, 0, y, { w: .3, h: .5, frame: '#ffffff', shutter: shut, open: .85 }); gB.pop(); }
    const R = this.hip(S, { yE: wh + .08, rh: .5 + d * .1, ov: .34, col: roof, cell: 2 });
    gR.bx(w * .78, R.top - .05, d * .45, .2, .5, .2, '#b4553a'); gR.bx(w * .78, R.top + .22, d * .45, .27, .05, .27, '#8a4030'); // serombong
    S.top = R.top + .4;
  },
};
