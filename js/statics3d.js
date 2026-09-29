'use strict';
// ===== Binaan statik dunia: dinding bilik, perabot dalaman, batu gunung/gua, pagar, tebing, jambatan, pintu khas =====
// Menulis ke tiga GB: gB (bahan atlas bangunan), gR (warna bucu), gG (bercahaya). Koordinat dunia (unit = 1 jubin, y = atas).
const ST = {
  // palet bilik mengikut peta
  palette(m) {
    const id = m.id || '', th = m.theme;
    if (th === 'gim') return { plaster: '#e6def6', wain: '#7a5cb0', trim: '#e8c458', cap: '#5a3c8a', win: '#d8c8ff', h: 1.5 };
    if (th === 'liga') return { plaster: '#f6e6c0', wain: '#a86a28', trim: '#f0d060', cap: '#7a4a1a', win: '#ffe0a0', h: 1.5 };
    if (th === 'malam') return { plaster: '#d6c4a8', wain: '#7a5a3c', trim: '#5a3c26', cap: '#6a4a2c', win: '#26305a', h: 1.4, night: true };
    if (/klinik|makmal/.test(id)) return { plaster: '#f6f8fa', wain: '#4aaaa4', trim: '#ffffff', cap: '#cfd8dc', win: '#cfeaff', h: 1.4 };
    if (/menara|stesen|pasaraya/.test(id)) return { plaster: '#eef0f3', wain: '#8a94a4', trim: '#c4cad4', cap: '#a0a8b4', win: '#cfeaff', h: 1.4 };
    if (/kapal/.test(id)) return { plaster: '#d0c8b0', wain: '#7a5a3a', trim: '#4a3220', cap: '#5a4028', win: '#9ad0ff', h: 1.4 };
    return { plaster: '#f2e8d4', wain: '#b98452', trim: '#8a5a30', cap: '#a8743c', win: '#cfeaff', h: 1.4 };
  },
  // ---------- dinding bilik dalam (#) ----------
  wall(X, x, y, nb, hs) {
    const { gB, gR, gG } = X, P = X.pal, low = y >= X.H - 1, hh = low ? .2 : P.h;
    // penutup atas
    gR.quad([x, hh + .03, y], [x + 1, hh + .03, y], [x + 1, hh + .03, y + 1], [x, hh + .03, y + 1], P.cap, 1, [0, 1, 0]);
    const dirs = [[0, 1, 0, nb.d], [1, 0, Math.PI / 2, nb.r], [0, -1, Math.PI, nb.u], [-1, 0, -Math.PI / 2, nb.l]]; // dx,dz, sudut, jiran pepejal
    for (const [dx, dz, th, solid] of dirs) {
      const nx = x + dx, ny = y + dz, inMap = nx >= 0 && ny >= 0 && nx < X.W && ny < X.H;
      if (!inMap) continue;
      let y0 = 0;
      if (solid) { const nl = ny >= X.H - 1; y0 = nl ? .5 : P.h; if (hh <= y0 + .01) continue; }
      const ww = Math.min(hh, .58);
      gB.push().t(x + .5, 0, y + .5).ry(th);
      const zf = .5;
      if (y0 < ww) gB.c(0).quad([-.5, ww, zf], [.5, ww, zf], [.5, Math.max(.07, y0), zf], [-.5, Math.max(.07, y0), zf], P.wain, 1, [0, 0, 1]);
      if (hh > ww + .02) gB.c(1).quad([-.5, hh, zf], [.5, hh, zf], [.5, Math.max(ww + .04, y0), zf], [-.5, Math.max(ww + .04, y0), zf], P.plaster, 1, [0, 0, 1]);
      if (!solid || y0 < .1) {
        gR.bx(0, .04, zf + .012, 1, .08, .028, P.trim, { skip: '-z-y' });
        if (hh > ww) gR.bx(0, ww + .02, zf + .014, 1, .05, .03, P.trim, { skip: '-z' });
      }
      gR.bx(0, hh + .015, zf - .0, 1.0, .05, .07, P.trim, { skip: '-y' });
      gB.pop();
    }
    // hiasan dinding utara: tingkap, lukisan, lampu
    if (y === 0 && !nb.d && x > 0 && x < X.W - 1 && !low) {
      const r = hash(x, y, 610 + X.seed);
      if (x % 3 === 1 || r < .18) {
        gR.push().t(x + .5, 0, y + 1.0);
        BLD.win({ gB, gR, gG }, 0, .92, { w: .42, h: .5, frame: P.trim, sill: true, sillCol: P.trim, cross: true, glow: P.win, night: P.night });
        gR.pop();
      } else if (r < .5) {
        gR.push().t(x + .5, 0, y + 1.0);
        const fc = ['#c84a4a', '#3a78c8', '#48a858', '#e0a030'][Math.floor(hash(x, y, 611) * 4)];
        gR.bx(0, .95, .02, .5, .38, .04, P.trim, { skip: '-z' }); gR.bx(0, .95, .046, .42, .3, .012, '#f4ead0'); gR.bx(-.06, .98, .054, .16, .16, .01, fc); gR.bx(.1, .92, .054, .14, .1, .01, rgbMul(fc, .7));
        gR.pop();
      } else if (r < .62) {
        gG.push().t(x + .5, 1.02, y + 1.03); gG.sph(.06, 6, 4, '#ffe6a0'); gG.pop(); gR.bx(x + .5, 1.02, y + 1.015, .04, .12, .03, P.trim);
      }
    }
  },
  // ---------- jisim batu (gunung ^, dinding gua x, kekosongan X) ----------
  rockH(wx, wz, base, amp, X) {
    let h = base + (N2.fbm(wx * .8 + 3, wz * .8 + 7, 3) - .32) * amp + (N2.vn(wx * 3.1, wz * 3.1, 5) - .5) * amp * .18;
    if (X) { // bucu di tepi jisim direndahkan supaya bucu bulat, bukan tembok rata
      let low = false;
      for (const dx of [-.01, .01]) for (const dz of [-.01, .01]) { const c = X.cell(Math.floor(wx + dx), Math.floor(wz + dz)); if (c !== 'x' && c !== '^' && c !== 'X') low = true; }
      if (low) h -= amp * .55 + .12;
    }
    return h;
  },
  rock(X, x, y, nb, kind) {
    const gR = X.gB || X.gR;
    const cave = kind === 'x' || X.cave || !X.outdoor, void_ = kind === 'X';
    const base = void_ ? 1.6 : kind === 'x' ? (X.inside ? 1.0 : 1.05) : 1.35, amp = void_ ? 0 : kind === 'x' ? .55 : 1.0;
    const c0 = void_ ? [.02, .02, .03] : cave ? rgb('#7a604a') : rgb('#b0a080'), c1 = void_ ? [.03, .03, .04] : cave ? rgb('#c0a07a') : rgb('#d8ccb0'), c2 = cave ? rgb('#e6c898') : rgb('#f0e8d4');
    const S = 2, rh = (wx, wz) => this.rockH(wx, wz, base, amp, X), H = (a, b) => rh(x + a / S, y + b / S), UV = .36;
    const vN = (wx, wz) => { const e = .12, hx = rh(wx + e, wz) - rh(wx - e, wz), hz = rh(wx, wz + e) - rh(wx, wz - e); const l = Math.hypot(hx / (2 * e), 1, hz / (2 * e)); return [-hx / (2 * e) / l, 1 / l, -hz / (2 * e) / l]; };
    gR.push(); gR.m.identity(); gR._np(); gR.c(8);
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) {
      const ids = [];
      for (const [a, b] of [[i, j], [i + 1, j], [i + 1, j + 1], [i, j + 1]]) {
        const wx = x + a / S, wz = y + b / S, h = H(a, b), n = vN(wx, wz), t = Math.min(1, Math.max(0, (h - base + amp * .4) / (amp * 1.1 || 1)));
        const k = .86 + N2.vn(wx * 2.7, wz * 2.7, 9) * .28;
        const col = [(c1[0] + (c2[0] - c1[0]) * t * .6) * k, (c1[1] + (c2[1] - c1[1]) * t * .6) * k, (c1[2] + (c2[2] - c1[2]) * t * .6) * k];
        ids.push(gR._v(wx, h, wz, n[0], n[1], n[2], void_ ? c0 : col, wx * UV, wz * UV));
      }
      gR.I.push(ids[0], ids[3], ids[1], ids[1], ids[3], ids[2]);
    }
    const lines = [[0, 1, 1, 1, 0, 1], [1, 1, 1, 0, 1, 0], [1, 0, 0, 0, 0, -1], [0, 0, 0, 1, -1, 0]];
    lines.forEach((ln, si) => {
      const solid = [nb.d, nb.r, nb.u, nb.l][si]; if (solid) return;
      const [a0, b0, a1, b1, nx, nz] = ln, rows = 2, segs = S, grid = [];
      for (let r = 0; r <= rows; r++) {
        const row = [];
        for (let s = 0; s <= segs; s++) {
          const t = s / segs, wx = x + a0 + (a1 - a0) * t, wz = y + b0 + (b1 - b0) * t, top = rh(wx, wz), f = r / rows;
          const bulge = (N2.vn(wx * 2.3 + 5, wz * 2.3 + f * 4, 21) - .4) * .16 * Math.sin(Math.PI * f) * (void_ ? 0 : 1);
          const py = top * (1 - f);
          const col = void_ ? c0 : (() => { const k = (.6 + .4 * (1 - f) ** .8) * (.86 + N2.vn(wx * 3, py * 5, 30) * .28); return [c1[0] * k * .95, c1[1] * k * .95, c1[2] * k * .95]; })();
          row.push(gR._v(wx + nx * bulge, py, wz + nz * bulge, nx, .12, nz, col, (wx * Math.abs(nz) + wz * Math.abs(nx)) * UV, py * UV));
        }
        grid.push(row);
      }
      for (let r = 0; r < rows; r++) for (let s = 0; s < segs; s++) {
        const a = grid[r][s], b = grid[r][s + 1], c = grid[r + 1][s + 1], d = grid[r + 1][s];
        gR.I.push(a, c, b, a, d, c);
      }
    });
    gR.pop();
  },

  // ---------- perabot dalam ----------
  furn(X, ch, x, y, nb, hs) {
    const th = nb.u ? 0 : nb.l ? Math.PI / 2 : nb.r ? -Math.PI / 2 : nb.d ? Math.PI : 0;
    // jiran sama jenis di kiri/kanan tempatan (untuk kaunter berterusan)
    const ex = Math.round(Math.cos(th)), ez = Math.round(-Math.sin(th));
    const same = (dx, dz) => X.cell(x + dx, y + dz) === ch;
    const conn = { l: same(-ex, -ez), r: same(ex, ez) };
    for (const g of [X.gB, X.gR, X.gG]) g.push().t(x + .5, 0, y + .5).ry(th);
    const f = this['f_' + ch]; if (f) f.call(this, X, conn, hs, x, y);
    for (const g of [X.gB, X.gR, X.gG]) g.pop();
  },
  f_K(X, c, hs) { // meja makan
    const g = X.gR;
    g.bx(0, .44, 0, .96, .06, .84, '#b98452', { ao: [.85, 1.05] }); g.bx(0, .39, 0, .9, .05, .78, '#8a5a30', { skip: '+y' });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.bx(sx * .4, .2, sz * .34, .07, .4, .07, '#7a4e2a', { ao: [.6, 1] });
    const k = Math.floor(hs * 3);
    if (k === 0) { g.bx(0, .475, 0, .5, .01, .3, '#c84a4a'); g.push().t(0, .48, 0).lathe([[.001, 0], [.05, .01], [.06, .06], [.05, .12], [.03, .14]], 10, '#f4f0e8').pop(); g.push().t(0, .62, 0).sph(.05, 6, 4, '#e0483a').pop(); }
    else if (k === 1) { for (const [a, b] of [[-.2, .12], [.16, -.1]]) { g.push().t(a, .47, b).lathe([[.001, 0], [.07, .012], [.09, .05], [.1, .06], [.088, .06], [.07, .03]], 10, '#3a78c8').pop(); } g.push().t(0, .49, .05).sph(.06, 6, 4, '#f0a030').pop(); }
    else { g.push().t(.0, .47, 0).lathe([[.001, 0], [.05, .0], [.06, .05], [.04, .12], [.05, .17], [.06, .17]], 10, '#8ab0d0').pop(); g.push().t(0, .68, 0).s(1, .8, 1).sph(.09, 7, 5, '#e05a8a').pop(); }
  },
  f_C(X, c, hs) { // kaunter
    const g = X.gR, L = c.l ? .5 : .5, R = c.r ? .5 : .5;
    const x0 = c.l ? -.5 : -.46, x1 = c.r ? .5 : .46;
    g.bx((x0 + x1) / 2, .45, .04, x1 - x0, .9, .66, '#8a5f3a', { ao: [.6, 1.05], skip: (c.l ? '-x' : '') + (c.r ? '+x' : '') });
    g.bx((x0 + x1) / 2, .92, .04, x1 - x0 + .02, .06, .76, '#e6e0d4', { ao: [.9, 1.05], skip: (c.l ? '-x' : '') + (c.r ? '+x' : '') });
    g.bx((x0 + x1) / 2, .08, .38, x1 - x0, .16, .04, '#3a2a1c', { skip: '-y' });
    for (let i = 0; i < 4; i++) g.bx(x0 + (i + .5) * (x1 - x0) / 4, .5, .375, .015, .55, .012, '#6a4626');
    const r = hash(hs * 991, 3, 33);
    if (r < .5) { g.bx(-.1, .995, .0, .32, .18, .26, '#d8dde4'); g.bx(-.1, 1.13, -.06, .24, .16, .03, '#3a3f48'); X.gG.bx(-.1, 1.13, -.043, .2, .12, .01, '#6ad0f0'); g.bx(.2, .96, .14, .18, .03, .12, '#e0483a'); }
    else { g.push().t(.15, .95, .0).sph(.07, 8, 6, '#d8b048').pop(); g.bx(-.2, .96, .05, .22, .02, .18, '#3a78c8'); g.bx(-.2, .985, .05, .2, .03, .16, '#f0e6d0'); }
  },
  f_Q(X, c, hs) { // rak buku
    const g = X.gR, BK = ['#d84848', '#4a7ad8', '#48a858', '#e8c040', '#9a5ac8', '#3ab0b0', '#e07a30', '#f0e8d8', '#8a3a3a'];
    g.bx(0, .9, -.22, .98, 1.8, .42, '#6a4626', { skip: '+z-y' });
    g.bx(-.47, .9, -.2, .05, 1.8, .44, '#8a5a30'); g.bx(.47, .9, -.2, .05, 1.8, .44, '#8a5a30');
    g.bx(0, 1.83, -.19, 1.02, .06, .48, '#8a5a30'); g.bx(0, .04, -.19, .98, .08, .44, '#5a3818');
    for (let r = 0; r < 4; r++) {
      const y = .08 + r * .43;
      g.bx(0, y, -.17, .9, .035, .38, '#8a5a30');
      let bx = -.42;
      for (let b = 0; bx < .4; b++) {
        const bw = .05 + hash(hs * 13 + b, r, 700) * .045, bh = .24 + hash(hs * 7 + b, r, 701) * .12, col = BK[Math.floor(hash(hs * 5 + b, r * 3, 702) * BK.length)];
        if (hash(b, r, hs + 703) < .12) { bx += .09; continue; }
        g.push().t(bx + bw / 2, y + .02 + bh / 2, -.13).rz((hash(b, r, 704) - .5) * .06).box(bw - .008, bh, .28, col, { skip: '-y-z', ao: [.8, 1.05] }); g.pop();
        bx += bw;
      }
    }
  },
  f_n(X, c, hs) { // komputer atau mesin layan diri
    const g = X.gR, G = X.gG;
    if (X.vend) {
      g.bx(0, .8, -.08, .86, 1.6, .64, '#d8383a', { ao: [.65, 1.05] }); g.bx(0, .04, -.05, .9, .08, .7, '#3a3f48');
      G.bx(-.06, .95, .245, .56, .96, .012, '#cfeaff');
      for (let r = 0; r < 5; r++) for (let k = 0; k < 4; k++) { const col = ['#e04a3a', '#4aa0e0', '#f0c040', '#48b868', '#e07ab0'][(r + k * 2) % 5]; g.bx(-.24 + k * .14, .62 + r * .19, .225, .085, .13, .06, col, { skip: '-z' }); g.bx(-.24 + k * .14, .545 + r * .19, .225, .1, .015, .08, '#f4f4f4'); }
      g.bx(.32, .95, .245, .16, .8, .03, '#2a2d34'); G.bx(.32, 1.15, .262, .1, .06, .01, '#48e070'); g.bx(.32, .95, .262, .08, .1, .012, '#9098a8'); g.bx(0, .16, .26, .6, .16, .03, '#2a2d34');
      G.bx(0, 1.68, .0, .8, .1, .5, '#ffe89a');
      return;
    }
    g.bx(0, .38, -.04, .92, .06, .66, '#b07a44', { ao: [.85, 1.05] }); for (const sx of [-1, 1]) g.bx(sx * .42, .19, -.04, .06, .38, .6, '#8a5a30');
    g.bx(0, .32, -.34, .92, .3, .04, '#8a5a30');
    g.bx(-.02, .55, -.14, .56, .36, .05, '#2a2d34', { ao: [.8, 1] }); G.bx(-.02, .55, -.114, .5, .3, .01, '#6ad0f0');
    for (let i = 0; i < 3; i++) G.bx(-.16 + i * .1, .5 + (i % 2) * .05, -.108, .06, .16 - i * .02, .01, ['#e8f6ff', '#4a8ac8', '#fff2b0'][i]);
    g.bx(-.02, .42, -.14, .1, .06, .1, '#3a3f48'); g.bx(-.02, .435, .12, .4, .02, .13, '#e8ecef'); g.bx(.3, .435, .12, .06, .02, .09, '#cfd6dc');
    g.bx(.36, .58, -.1, .18, .4, .34, '#d8d0c0', { ao: [.85, 1] }); G.bx(.36, .7, .075, .04, .03, .01, '#48e070');
  },
  f_h(X, c, hs) { // mesin pemulihan Monsta
    const g = X.gR, G = X.gG;
    g.bx(0, .26, .0, .96, .52, .72, '#f0a0a8', { ao: [.65, 1.05] }); g.bx(0, .54, .0, .98, .05, .76, '#fff4f6');
    g.bx(0, .16, .37, .9, .2, .03, '#d8808a'); g.bx(0, .8, -.3, .96, .55, .1, '#f8e4e8');
    G.bx(0, .82, -.245, .7, .34, .012, '#ffd0dc'); G.bx(0, .82, -.238, .12, .3, .012, '#ffffff'); G.bx(0, .82, -.238, .3, .1, .012, '#ffffff');
    for (let i = 0; i < 3; i++) { g.push().t(-.26 + i * .26, .6, .04); PR.ball(g, .1, '#e04848'); g.pop(); g.push().t(-.26 + i * .26, .56, .04).cyl(.11, .12, .03, 12, '#c8c8d0').pop(); }
    G.push().t(0, .56, .04).s(1, .1, 1).sph(.5, 10, 6, '#ffe6f0').pop();
    for (const s of [-1, 1]) { g.bx(s * .45, .95, -.28, .05, .8, .06, '#e0808c'); G.push().t(s * .45, 1.4, -.28); G.sph(.05, 6, 4, '#ff7a90'); G.pop(); }
  },
  f_z(X, c, hs) { // katil
    const g = X.gR;
    g.bx(0, .17, 0, .92, .16, .98, '#8a5a30', { ao: [.6, 1] }); g.bx(0, .33, .04, .84, .14, .88, '#f4f0e8', { ao: [.85, 1.05] });
    const bl = ['#4a78d0', '#d05a6a', '#48a878'][Math.floor(hs * 3) % 3];
    g.bx(0, .42, .18, .86, .06, .62, bl, { ao: [.8, 1.05] }); g.bx(0, .445, .12, .86, .025, .06, rgbMul(bl, 1.35)); g.bx(0, .445, .3, .86, .025, .06, rgbMul(bl, 1.35));
    g.push().t(0, .44, -.3).s(1, .55, .7).sph(.28, 8, 6, '#ffffff', { ao: [.8, 1.05] }).pop();
    g.bx(0, .5, -.48, .94, .56, .05, '#7a4e2a'); g.bx(0, .26, .5, .94, .3, .04, '#7a4e2a');
    for (const s of [-1, 1]) { g.bx(s * .46, .68, -.48, .07, .1, .07, '#6a4424'); }
  },
  f_o(X, c, hs) { // pasu tumbuhan
    const g = X.gR;
    g.push().lathe([[.001, 0], [.13, 0], [.16, .06], [.2, .28], [.22, .32], [.19, .32], [.17, .28]], 12, '#c47a44', { ao: [.65, 1.05] }).pop();
    g.push().t(0, .3, 0).cyl(.17, .17, .02, 10, '#5a3a20', { cap: true }).pop();
    const dark = rgb('#2f7a2c'), lite = rgb('#86c650');
    for (let i = 0; i < 4; i++) { const a = i * 1.6 + hs * 5; g.push().t(Math.cos(a) * .1, .5 + (i % 2) * .1, Math.sin(a) * .1).sph(.15, 7, 5, dark, { ao: [.6, 1.1], c2: lite, m0: .3 }).pop(); }
    for (let i = 0; i < 6; i++) { g.push().t(0, .32, 0).ry(i / 6 * 6.283 + hs).rz(.5 + (i % 2) * .3); PR.frond(g, .34, .06, .1, .16, '#2a7a30', '#6cbc4c', { n: 4 }); g.pop(); }
  },
  f_g(X, c, hs) { // patung gim
    const g = X.gR, G = X.gG;
    g.bx(0, .07, 0, .82, .14, .82, '#8a8a9a', { ao: [.7, 1.05] }); g.bx(0, .19, 0, .62, .1, .62, '#a8a8b8'); g.bx(0, .27, 0, .5, .06, .5, '#c8c8d4');
    g.push().t(0, .3, 0).cyl(.15, .2, .5, 10, '#b8b8c8', { ao: [.7, 1.05] }).pop();
    g.push().t(0, .84, 0).cyl(.24, .16, .06, 12, '#e8c458', { cap: true }).pop();
    g.push().t(0, 1.12, 0); PR.ball(g, .22, '#e04848'); g.pop();
    G.push().t(0, .9, 0).s(1, .05, 1).sph(.3, 10, 6, '#ffe89a').pop();
  },
  'f_|'(X, c, hs) { // tiang hiasan gim
    const g = X.gR, G = X.gG;
    g.bx(0, .06, 0, .56, .12, .56, '#5a6274'); g.bx(0, .16, 0, .44, .08, .44, '#7a8496');
    g.push().t(0, .2, 0).cyl(.17, .19, 1.15, 12, '#6a7488', { ao: [.65, 1.08], cap: false }).pop();
    for (const y of [.42, .9, 1.28]) g.push().t(0, y, 0).cyl(.2, .2, .05, 12, '#e8c458').pop();
    g.bx(0, 1.4, 0, .5, .1, .5, '#5a6274'); g.push().t(0, 1.45, 0).cyl(.16, .1, .1, 8, '#3a3f48', { cap: true }).pop();
    G.push().t(0, 1.56, 0).cone(.09, .2, 6, '#ffb040').pop();
  },
  f_m(X, c, hs) { // mesin besar
    const g = X.gR, G = X.gG;
    g.bx(0, .55, -.02, .9, 1.1, .8, '#8a949e', { ao: [.6, 1.05] }); g.bx(0, 1.12, -.02, .96, .07, .86, '#5a626c'); g.bx(0, .04, 0, .96, .08, .86, '#3a3f48');
    g.bx(0, .75, .385, .84, .5, .02, '#6a727c');
    G.bx(-.2, .85, .4, .26, .16, .012, '#f0c848'); G.bx(.2, .85, .4, .26, .16, .012, '#48e070');
    for (let i = 0; i < 5; i++) g.bx(0, .3 + i * .05, .4, .6, .02, .012, '#3a3f48');
    g.push().t(.3, .6, .4).rx(Math.PI / 2).cyl(.07, .07, .04, 10, '#2a2d34', { cap: true }).pop();
    g.push().t(-.44, 1.12, -.2).tube([[0, 0, 0], [0, .25, 0], [.2, .38, .05], [.4, .3, .1]], .04, .04, 6, '#5a626c', { steps: 6 }).pop();
    g.push().t(.2, 1.16, -.1).cyl(.16, .16, .05, 12, '#2a2d34', { cap: true }).pop();
  },
  f_d(X, c, hs) { // peti kayu bertindan
    const g = X.gR;
    g.push().ry(hs * 6).s(1.7, 1.7, 1.7); PR.crate(g); g.pop();
    g.push().t(.06, .82, -.02).ry(hs * 9).s(.9, .9, .9); PR.crate(g); g.pop();
  },
  f_e(X) { // permaidani
    const g = X.gR;
    g.bx(0, .012, 0, .98, .024, .98, '#b83a3a', { skip: '-y' }); g.bx(0, .026, 0, .86, .012, .86, '#e8c060', { skip: '-y' }); g.bx(0, .034, 0, .78, .012, .78, '#c84a4a', { skip: '-y' });
    g.push().t(0, .042, 0).ry(Math.PI / 4).box(.36, .012, .36, '#e8c060', { skip: '-y' }).pop();
  },
  f_E(X) { // tikar & bingkai pintu keluar
    const g = X.gR;
    g.bx(0, .012, .05, .88, .024, .62, '#8a2a2a', { skip: '-y' }); g.bx(0, .026, .05, .8, .012, .54, '#f0e4c8', { skip: '-y' }); g.bx(0, .034, .05, .68, .012, .42, '#a83a3a', { skip: '-y' });
    for (const s of [-1, 1]) g.bx(s * .5, .55, .42, .1, 1.1, .12, '#8a5a30', { ao: [.7, 1.05] });
    g.bx(0, 1.1, .42, 1.1, .1, .14, '#8a5a30');
  },
  // ---------- pagar, tebing, jambatan, jeti ----------
  fence(X, x, y) {
    const g = X.gR;
    for (const s of [-1, 1]) g.bx(x + .5 + s * .44, .32, y + .5, .09, .64, .09, '#a27248', { ao: [.7, 1.05] });
    for (const yy of [.48, .26]) g.bx(x + .5, yy, y + .5, 1, .07, .06, '#cf9e6c');
    for (let i = 0; i < 4; i++) g.bx(x + .12 + i * .25, .3, y + .5 + .04, .07, .58, .03, '#b98452', { ao: [.7, 1] });
  },
  // profil tebing sepanjang z (0 utara → 1 selatan): naik landai di utara, jatuh curam di selatan
  ledgeH(t) { return t < .14 ? t / .14 * .3 : t < .3 ? .3 + (t - .14) / .16 * .12 : t < .68 ? .42 + Math.sin((t - .3) / .38 * Math.PI) * .03 : t < .9 ? .42 * (1 - (t - .68) / .22) ** 1.4 : 0; },
  ledge(X, x, y, hs) {
    const g = X.gR, S = 6, N = 12;
    for (let i = 0; i < S; i++) {
      const u0 = i / S, u1 = (i + 1) / S;
      for (let k = 0; k < N; k++) {
        const t0 = k / N, t1 = (k + 1) / N, tm = (t0 + t1) / 2, wob = u => (N2.vn((x + u) * 4, y * 3 + k, 12) - .5) * .05;
        const top = tm > .1 && tm < .72, south = tm >= .72;
        const gn = .85 + N2.vn((x + u0) * 5, y * 5 + k, 13) * .3;
        const col = rgbMul(top || tm <= .1 ? '#5aa63a' : '#8a5a30', gn);
        const P = [[x + u0, this.ledgeH(t0) + wob(u0), y + t0], [x + u1, this.ledgeH(t0) + wob(u1), y + t0], [x + u1, this.ledgeH(t1) + wob(u1), y + t1], [x + u0, this.ledgeH(t1) + wob(u0), y + t1]];
        g.quad(P[0], P[1], P[2], P[3], col, 1, south ? [0, .4, 1] : [0, 1, 0]);
      }
    }
    // batu dan rumput di puncak
    for (let i = 0; i < 4; i++) { const r = hash(x, i, 40); g.push().t(x + .12 + i * .25, .43, y + .35 + r * .25).s(1, .6, 1).sph(.06 + r * .04, 5, 3, '#8a8e96', { ao: [.7, 1.1] }).pop(); }
  },
  bridge(X, x, y, nb, water) { // nb: {l,r,u,d} jiran air
    const g = X.gR, gB = X.gB, alongX = !(nb.l && nb.r), h = .08;
    gB.c(0).bx(x + .5, h, y + .5, 1.0, .07, 1.0, '#b98452', { skip: '-y', uvs: 1 });
    for (const s of [-1, 1]) { if (alongX) g.bx(x + .5, h + .3, y + .5 + s * .46, 1.02, .05, .05, '#7a4a26'); else g.bx(x + .5 + s * .46, h + .3, y + .5, .05, .05, 1.02, '#7a4a26'); }
    for (const s of [-1, 1]) { const px = alongX ? x + .5 : x + .5 + s * .46, pz = alongX ? y + .5 + s * .46 : y + .5; g.bx(px, h + .13, pz, .06, .32, .06, '#6a4424'); g.bx(px, h - .3, pz, .07, .7, .07, '#5a3a20'); }
    if (alongX) for (const s of [-1, 1]) g.bx(x + .5 + s * .3, h - .3, y + .5, .07, .7, .07, '#5a3a20');
  },
  jetty(X, x, y) {
    const g = X.gR, gB = X.gB;
    gB.c(0).bx(x + .5, .1, y + .5, 1.0, .06, 1.0, '#c69460', { skip: '-y', uvs: 1 });
    for (const [a, b] of [[.12, .12], [.88, .12], [.12, .88], [.88, .88]]) g.bx(x + a, -.15, y + b, .1, .5, .1, '#5a3c22', { ao: [.6, 1] });
  },
  // pintu khas di luar bangunan / dalam bilik
  doorProp(X, x, y, look, above) {
    const g = X.gR, gB = X.gB, G = X.gG;
    if (look === 'tangga') {
      for (let i = 0; i < 4; i++) gB.c(7).bx(x + .5, .07 + i * .12, y + .18 + i * .16, .92, .14 + i * .24, .17, '#c8a878', { skip: '-y', uvs: 1.3 });
      for (const s of [-1, 1]) { g.bx(x + .5 + s * .48, .55, y + .5, .05, .06, .8, '#8a5a30'); g.bx(x + .5 + s * .48, .3, y + .16, .05, .6, .05, '#8a5a30'); g.bx(x + .5 + s * .48, .55, y + .85, .05, .3, .05, '#8a5a30'); }
    } else if (look === 'gua') {
      const dk = '#0a0806';
      g.push().t(x + .5, 0, y + .5);
      g.bx(-.5, .7, -.18, .32, 1.4, .7, '#a89070', { ao: [.6, 1.05] }); g.bx(.5, .7, -.18, .32, 1.4, .7, '#a89070', { ao: [.6, 1.05] });
      g.bx(0, 1.45, -.18, 1.34, .5, .7, '#9a8262', { ao: [.6, 1.05] });
      g.push().t(0, 1.75, -.2).s(1, .5, 1).sph(.6, 8, 6, '#b8a484', { ao: [.7, 1.1] }).pop();
      G.push().t(0, .6, -.05).box(.7, 1.2, .02, '#0a0806').pop();
      g.pop();
    } else if (look === 'kapal') {
      g.bx(x + .5, .6, y + .12, 1, 1.2, .2, '#e8e8e8'); g.bx(x + .5, .5, y + .24, .62, .9, .1, '#3a4a6a');
      gB.c(0).bx(x + .5, .06, y + .62, .7, .05, .9, '#a07040', { skip: '-y', uvs: 1 });
    } else if (look === 'portal') {
      g.push().t(x + .5, 0, y + .5);
      g.cyl(.52, .55, .06, 24, '#8a8ea0', { cap: true });
      for (const s of [-1, 1]) g.bx(s * .5, .45, 0, .1, .9, .1, '#e8c458');
      g.pop();
    }
  },
};
