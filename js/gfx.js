'use strict';
// ===== Grafik: jubin, bangunan, watak, sprite Monsta =====
function hash(x, y, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; return [c, g]; }
function shade(hex, f) { // f<0 gelap, f>0 cerah
  const n = parseInt(hex.slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (f < 0) { r *= 1 + f; g *= 1 + f; b *= 1 + f; } else { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; }
  return '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
}

// ---------- Jubin ----------
const WALK = new Set(['.', ',', 'p', '=', '-', 's', 'f', 'b', 'k', 'c', '_', 'e', 'E', 'j', 'L']);
const BUILD = new Set(['H', 'P', 'M', 'G', 'B', 'W', 'R']);
const TILE_BASE = { '.': 1, ',': 1, 'f': 1, 'T': 1, 'Y': 1, 't': 1, 'F': 1, 'L': 1, 'r': 1 }; // atas rumput
const PAL = {
  g: '#8ad06c', gd: '#6cb454', gl: '#a8e088', tg: '#4e9a40', tgd: '#3a7a32',
  path: '#e2cc94', pathd: '#c8ae70', tar: '#8a929c', tard: '#747c86', sand: '#f0e0a8', sandd: '#dcc88a',
  wat: '#4a90e0', watl: '#88c0f8', watd: '#3470c0', tree: '#2c7a3a', treel: '#4ca44c', treed: '#1c5a2a', trunk: '#7a5230',
  roofH: '#a8483a', wallH: '#c89058', roofP: '#e05048', roofM: '#4878d0', roofG: '#8860b8', wallW: '#f4efe4'
};
function px(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
function drawGrassBase(g, x, y, tx, ty) {
  px(g, x, y, 16, 16, PAL.g);
  for (let i = 0; i < 3; i++) {
    const hx = Math.floor(hash(tx, ty, i) * 14), hy = Math.floor(hash(tx, ty, i + 7) * 14);
    px(g, x + hx, y + hy, 1, 2, PAL.gd); px(g, x + hx + 1, y + hy + 1, 1, 1, PAL.gd);
  }
}
function drawTile(g, ch, x, y, tx, ty, theme) {
  const h = hash(tx, ty);
  if (TILE_BASE[ch]) drawGrassBase(g, x, y, tx, ty);
  switch (ch) {
    case '.': break;
    case ',': // rumput tinggi
      px(g, x, y, 16, 16, PAL.tg);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        const bx = x + c * 8, by = y + r * 8;
        px(g, bx + 1, by + 2, 2, 6, PAL.tgd); px(g, bx + 3, by + 1, 2, 7, '#5cb04c'); px(g, bx + 5, by + 3, 2, 5, PAL.tgd);
        px(g, bx + 3, by + 1, 1, 1, '#88d070');
      }
      break;
    case 'p': // sawah padi
      px(g, x, y, 16, 16, '#7a9a4a');
      px(g, x, y + 13, 16, 3, '#6a8a8a');
      for (let c = 0; c < 4; c++) {
        const bx = x + c * 4 + 1;
        px(g, bx, y + 3, 1, 11, '#b8c850'); px(g, bx + 1, y + 1, 1, 12, '#d8d868'); px(g, bx + 2, y + 4, 1, 9, '#98b040');
        px(g, bx + 1, y + 1, 1, 2, '#e8d070');
      }
      break;
    case '=':
      px(g, x, y, 16, 16, PAL.path);
      if (h < .5) px(g, x + Math.floor(h * 28), y + Math.floor(hash(tx, ty, 3) * 14), 2, 1, PAL.pathd);
      if (hash(tx, ty, 5) < .5) px(g, x + Math.floor(hash(tx, ty, 6) * 14), y + Math.floor(hash(tx, ty, 8) * 14), 1, 1, PAL.pathd);
      break;
    case '-':
      px(g, x, y, 16, 16, PAL.tar);
      if (h < .4) px(g, x + Math.floor(h * 38), y + Math.floor(hash(tx, ty, 3) * 14), 1, 1, PAL.tard);
      if (hash(tx, ty, 2) < .3) px(g, x + Math.floor(hash(tx, ty, 4) * 14), y + Math.floor(hash(tx, ty, 9) * 14), 1, 1, '#a0a8b0');
      break;
    case 's':
      px(g, x, y, 16, 16, PAL.sand);
      px(g, x + Math.floor(h * 14), y + Math.floor(hash(tx, ty, 2) * 14), 1, 1, PAL.sandd);
      px(g, x + Math.floor(hash(tx, ty, 4) * 14), y + Math.floor(hash(tx, ty, 5) * 14), 1, 1, PAL.sandd);
      break;
    case 'f': {
      const cols = ['#f05050', '#f8e048', '#f8f8f8', '#f080c0'];
      for (let i = 0; i < 3; i++) {
        const fx = x + 2 + Math.floor(hash(tx, ty, i * 3) * 11), fy = y + 2 + Math.floor(hash(tx, ty, i * 3 + 1) * 11);
        const c = cols[Math.floor(hash(tx, ty, i * 3 + 2) * 4)];
        px(g, fx - 1, fy, 3, 1, c); px(g, fx, fy - 1, 1, 3, c); px(g, fx, fy, 1, 1, '#f8c030');
      }
      break;
    }
    case 'T': {
      const alt = theme === 'bakau';
      const c1 = alt ? '#2a6a48' : PAL.tree, c2 = alt ? '#3a8a5a' : PAL.treel, c3 = alt ? '#1a4a30' : PAL.treed;
      if (alt) { px(g, x + 4, y + 11, 1, 5, PAL.trunk); px(g, x + 11, y + 11, 1, 5, PAL.trunk); px(g, x + 7, y + 11, 2, 5, PAL.trunk); }
      else px(g, x + 6, y + 11, 4, 5, PAL.trunk);
      px(g, x + 2, y + 1, 12, 11, c1); px(g, x + 1, y + 3, 14, 7, c1); px(g, x + 4, y, 8, 1, c1);
      px(g, x + 3, y + 2, 5, 3, c2); px(g, x + 9, y + 5, 3, 2, c2); px(g, x + 4, y + 9, 8, 2, c3); px(g, x + 1, y + 8, 3, 2, c3);
      break;
    }
    case 'Y': // pokok kelapa/sawit
      px(g, x + 7, y + 6, 2, 10, '#8a6a40'); px(g, x + 7, y + 9, 2, 1, '#6a4a28'); px(g, x + 7, y + 13, 2, 1, '#6a4a28');
      px(g, x + 1, y + 3, 6, 2, '#3a9a3a'); px(g, x + 9, y + 3, 6, 2, '#3a9a3a'); px(g, x + 3, y + 1, 10, 2, '#4cb04c');
      px(g, x, y + 5, 3, 2, '#2c7a2c'); px(g, x + 13, y + 5, 3, 2, '#2c7a2c'); px(g, x + 6, y + 4, 4, 3, '#2c7a2c');
      px(g, x + 6, y + 6, 2, 2, '#a07030'); px(g, x + 8, y + 6, 2, 2, '#906020');
      break;
    case 't': // semak boleh tebas
      px(g, x + 3, y + 3, 10, 11, '#3c9a3c'); px(g, x + 2, y + 5, 12, 7, '#3c9a3c');
      px(g, x + 4, y + 4, 4, 3, '#6cc860'); px(g, x + 5, y + 11, 6, 2, '#2a7a2a'); px(g, x + 7, y + 13, 2, 3, PAL.trunk);
      break;
    case '~': case 'w': {
      px(g, x, y, 16, 16, PAL.wat);
      const o = Math.floor(h * 8);
      px(g, x + o, y + 4, 5, 1, PAL.watl); px(g, x + (o + 7) % 12, y + 11, 4, 1, PAL.watl);
      px(g, x + (o + 3) % 12, y + 8, 3, 1, PAL.watd);
      break;
    }
    case 'b': // jambatan
      px(g, x, y, 16, 16, '#a87848');
      for (let i = 0; i < 16; i += 4) px(g, x, y + i + 3, 16, 1, '#7a5230');
      px(g, x, y, 1, 16, '#6a4222'); px(g, x + 15, y, 1, 16, '#6a4222');
      break;
    case 'k': // jeti kayu
      px(g, x, y, 16, 16, '#b88858');
      for (let i = 0; i < 16; i += 4) px(g, x + i + 3, y, 1, 16, '#8a6038');
      break;
    case 'F':
      px(g, x + 1, y + 4, 2, 10, '#a07048'); px(g, x + 13, y + 4, 2, 10, '#a07048');
      px(g, x, y + 6, 16, 2, '#c89868'); px(g, x, y + 10, 16, 2, '#c89868');
      px(g, x + 1, y + 4, 2, 1, '#e0b888'); px(g, x + 13, y + 4, 2, 1, '#e0b888');
      break;
    case 'L': // tebing
      px(g, x, y + 10, 16, 3, '#6a9a4a'); px(g, x, y + 13, 16, 3, '#4a7a3a');
      px(g, x, y + 10, 16, 1, '#b0d890');
      break;
    case 'r':
      px(g, x + 2, y + 4, 12, 10, '#8a8a90'); px(g, x + 3, y + 3, 10, 12, '#8a8a90');
      px(g, x + 4, y + 4, 5, 3, '#b0b0b8'); px(g, x + 4, y + 12, 9, 2, '#6a6a70');
      break;
    case '^': { // bukit batu
      px(g, x, y, 16, 16, '#9a8a6a');
      px(g, x + Math.floor(h * 8), y + 2, 6, 2, '#b8a888'); px(g, x + 2, y + 9, 5, 2, '#7a6a4a'); px(g, x + 9, y + 12, 5, 2, '#7a6a4a');
      px(g, x + 10, y + 5, 3, 1, '#b8a888');
      break;
    }
    case 'c': // lantai gua / tanah
      px(g, x, y, 16, 16, theme === 'gali' ? '#c8a878' : '#a88a68');
      px(g, x + Math.floor(h * 14), y + Math.floor(hash(tx, ty, 2) * 14), 2, 1, '#8a6c50');
      px(g, x + Math.floor(hash(tx, ty, 3) * 14), y + Math.floor(hash(tx, ty, 4) * 14), 1, 1, '#c8aa88');
      break;
    case 'x': // dinding gua
      px(g, x, y, 16, 16, '#5a4a3a'); px(g, x, y, 16, 3, '#7a6450');
      px(g, x + Math.floor(h * 10), y + 6, 5, 2, '#4a3a2a'); px(g, x + 2, y + 11, 6, 2, '#6a5642');
      break;
    case '_':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x, y + 7, 16, 1, '#c09860'); px(g, x, y + 15, 16, 1, '#c09860');
      px(g, x + (ty % 2 ? 4 : 11), y, 1, 7, '#c09860'); px(g, x + (ty % 2 ? 11 : 4), y + 8, 1, 7, '#c09860');
      break;
    case 'e':
      px(g, x, y, 16, 16, '#c85858'); px(g, x + 1, y + 1, 14, 14, '#d86868');
      px(g, x + 6, y + 6, 4, 4, '#e8c060');
      break;
    case 'j':
      px(g, x, y, 16, 16, theme === 'gim' ? '#c8c0d8' : '#d0d0d8');
      px(g, x, y, 16, 1, '#b0a8c0'); px(g, x, y, 1, 16, '#b0a8c0');
      break;
    case '#':
      px(g, x, y, 16, 16, '#e8e0cc'); px(g, x, y + 12, 16, 4, '#8a7a60'); px(g, x, y + 11, 16, 1, '#a89878');
      px(g, x + 4, y + 3, 1, 8, '#ddd4c0'); px(g, x + 11, y + 3, 1, 8, '#ddd4c0');
      break;
    case 'K':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x, y + 2, 16, 10, '#a06a3a'); px(g, x, y + 2, 16, 2, '#c08a5a'); px(g, x + 1, y + 12, 2, 4, '#704a28'); px(g, x + 13, y + 12, 2, 4, '#704a28');
      break;
    case 'C':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x, y + 3, 16, 13, '#7888a8'); px(g, x, y + 3, 16, 3, '#b0c0d8'); px(g, x, y + 14, 16, 2, '#58688a');
      break;
    case 'Q':
      px(g, x, y, 16, 16, '#8a5a30'); px(g, x + 1, y + 1, 14, 14, '#6a4020');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) {
        const cc = ['#d05050', '#5070d0', '#50a050', '#d0b040'][Math.floor(hash(tx * 7 + c, ty * 5 + r) * 4)];
        px(g, x + 2 + c * 2 + (c > 2 ? 1 : 0), y + 2 + r * 5, 2, 4, cc);
      }
      break;
    case 'n':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x + 2, y + 1, 12, 10, '#505868'); px(g, x + 3, y + 2, 10, 7, '#70c0e8'); px(g, x + 4, y + 3, 3, 2, '#b8e8f8');
      px(g, x + 1, y + 11, 14, 4, '#8890a0');
      break;
    case 'h':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x + 1, y + 2, 14, 13, '#e89098'); px(g, x + 1, y + 2, 14, 3, '#f8c0c8');
      for (let i = 0; i < 3; i++) { px(g, x + 3 + i * 4, y + 7, 3, 3, '#f8f8f8'); px(g, x + 4 + i * 4, y + 8, 1, 1, '#e04040'); }
      break;
    case 'z':
      px(g, x, y, 16, 16, '#d8b47c');
      px(g, x + 1, y, 14, 16, '#5878c8'); px(g, x + 2, y + 1, 12, 5, '#f8f8f8'); px(g, x + 1, y + 7, 14, 1, '#4060a8');
      break;
    case 'o':
      px(g, x, y, 16, 16, theme === 'gim' ? '#c8c0d8' : '#d8b47c');
      px(g, x + 4, y + 9, 8, 6, '#b86a38'); px(g, x + 3, y + 9, 10, 2, '#d88a58');
      px(g, x + 3, y + 2, 10, 7, '#3c9a3c'); px(g, x + 5, y + 1, 6, 3, '#5cb85c');
      break;
    case 'g':
      px(g, x, y, 16, 16, '#c8c0d8');
      px(g, x + 3, y + 11, 10, 5, '#707080'); px(g, x + 5, y + 2, 6, 9, '#a0a0b0'); px(g, x + 4, y + 1, 8, 5, '#b8b8c8');
      px(g, x + 6, y + 3, 4, 2, '#e04848');
      break;
    case '|':
      px(g, x, y, 16, 16, '#c8c0d8');
      px(g, x + 2, y + 1, 3, 15, '#606878'); px(g, x + 11, y + 1, 3, 15, '#606878'); px(g, x, y + 5, 16, 3, '#e8c048'); px(g, x, y + 10, 16, 3, '#303038');
      break;
    case 'E':
      px(g, x, y, 16, 16, theme === 'gua' ? '#a88a68' : '#d8b47c');
      px(g, x + 2, y + 5, 12, 9, '#c84848'); px(g, x + 3, y + 6, 10, 7, '#e06060');
      break;
    case 'X': px(g, x, y, 16, 16, '#101014'); break;
    case 'm': // mesin / jentera kilang
      px(g, x, y, 16, 16, '#707880'); px(g, x + 1, y + 1, 14, 14, '#8a949e'); px(g, x + 3, y + 3, 4, 4, '#e8c048'); px(g, x + 9, y + 3, 4, 4, '#48a848');
      px(g, x + 2, y + 10, 12, 3, '#505860');
      break;
    case 'd': // peti/kotak kargo
      px(g, x, y, 16, 16, theme === 'gua' ? '#a88a68' : '#c8c0b0');
      px(g, x + 1, y + 1, 14, 14, '#b07838'); px(g, x + 1, y + 1, 14, 2, '#d09858'); px(g, x + 7, y + 1, 2, 14, '#8a5a28');
      break;
    default:
      px(g, x, y, 16, 16, '#ff00ff');
  }
}

// Bangunan: kumpul blok segi empat dan lukis bumbung + dinding
function drawBuildings(g, grid, W, H) {
  const seen = new Set();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const ch = grid[y][x];
    if (!BUILD.has(ch) || seen.has(x + ',' + y)) continue;
    // cari lebar dan tinggi blok
    let w = 0; while (x + w < W && (grid[y][x + w] === ch || /\d/.test(grid[y][x + w]) && y > 0 && grid[y - 1][x + w] === ch)) w++;
    let h = 0;
    while (y + h < H) {
      let ok = true;
      for (let i = 0; i < w; i++) { const c = grid[y + h][x + i]; if (!(c === ch || (/\d/.test(c) && h > 0))) { ok = false; break; } }
      if (!ok) break; h++;
    }
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) seen.add((x + i) + ',' + (y + j));
    drawBuilding(g, ch, x * 16, y * 16, w, h, grid, x, y);
  }
}
function drawBuilding(g, ch, X, Y, w, h, grid, tx, ty) {
  const W = w * 16, Hh = h * 16;
  const wallRows = ch === 'B' ? Math.max(1, h - 1) : (h >= 5 ? 2 : 1);
  const roofH = (h - wallRows) * 16, wallY = Y + roofH;
  const roofC = { H: PAL.roofH, P: PAL.roofP, M: PAL.roofM, G: PAL.roofG, B: '#9aa4b0', W: '#8a98a4', R: '#6a8a5a' }[ch];
  const wallC = { H: PAL.wallH, P: PAL.wallW, M: PAL.wallW, G: '#dcd4ec', B: '#dfe6ee', W: '#b8c4cc', R: '#e8dcc0' }[ch];
  // dinding
  px(g, X, wallY, W, Hh - roofH, wallC);
  if (ch === 'H') for (let i = 3; i < W; i += 4) px(g, X + i, wallY, 1, Hh - roofH, shade(wallC, -.15));
  if (ch === 'W') for (let i = 2; i < W; i += 3) px(g, X + i, wallY, 1, Hh - roofH, shade(wallC, -.12));
  px(g, X, Y + Hh - 2, W, 2, shade(wallC, -.3));
  // tingkap
  if (ch === 'B') {
    for (let r = wallY + 3; r < Y + Hh - 14; r += 8) for (let c = X + 3; c < X + W - 6; c += 8) { px(g, c, r, 5, 5, '#6a9ad0'); px(g, c, r, 2, 2, '#a8d0f0'); }
  } else if (ch !== 'W') {
    for (let i = 0; i < w; i++) {
      const c = grid[ty + h - 1][tx + i];
      if (/\d/.test(c)) continue;
      if (i % 2 === 1 || w <= 2) { const wx = X + i * 16 + 4, wy = Y + Hh - 13; px(g, wx - 1, wy - 1, 10, 8, shade(wallC, -.4)); px(g, wx, wy, 8, 6, '#78b0e0'); px(g, wx, wy, 3, 2, '#c0e0f8'); }
    }
  }
  // bumbung
  if (ch === 'B') {
    px(g, X, Y, W, Math.max(6, roofH), roofC); px(g, X, Y, W, 2, shade(roofC, .3));
  } else if (roofH > 0) {
    px(g, X - 1, Y, W + 2, roofH + 2, roofC);
    for (let r = Y + 3; r < Y + roofH; r += 3) px(g, X - 1, r, W + 2, 1, shade(roofC, -.18));
    px(g, X - 1, Y, W + 2, 2, shade(roofC, .25));
    px(g, X - 1, Y + roofH, W + 2, 2, shade(roofC, -.45));
    if (ch === 'H') { // hujung bumbung kampung
      px(g, X - 2, Y + roofH - 2, 3, 4, shade(roofC, -.3)); px(g, X + W - 1, Y + roofH - 2, 3, 4, shade(roofC, -.3));
    }
  }
  // papan tanda
  const cx = X + W / 2;
  if (ch === 'P') { px(g, cx - 7, Y + roofH - 12, 14, 10, '#fafafa'); px(g, cx - 1.5, Y + roofH - 11, 3, 8, '#e04040'); px(g, cx - 5, Y + roofH - 8, 10, 2.5, '#e04040'); }
  if (ch === 'M') { px(g, cx - 8, Y + roofH - 12, 16, 10, '#fafafa'); drawMiniText(g, 'KDI', cx - 6, Y + roofH - 10, '#2850a0'); }
  if (ch === 'G') { px(g, cx - 8, Y + roofH - 12, 16, 10, '#f8e060'); drawMiniText(g, 'GIM', cx - 6, Y + roofH - 10, '#503080'); }
}
const MINIFONT = {
  K: ['101', '110', '100', '110', '101'], D: ['110', '101', '101', '101', '110'], I: ['111', '010', '010', '010', '111'],
  G: ['011', '100', '101', '101', '011'], M: ['101', '111', '111', '101', '101']
};
function drawMiniText(g, s, x, y, c) {
  for (let k = 0; k < s.length; k++) {
    const f = MINIFONT[s[k]]; if (!f) continue;
    for (let r = 0; r < 5; r++) for (let q = 0; q < 3; q++) if (f[r][q] === '1') px(g, x + k * 4 + q, y + r, 1, 1, c);
  }
}
function drawWarpTile(g, look, x, y, above) {
  if (look === 'pintu') {
    const bc = above === 'B' ? '#78a8d8' : above === 'W' ? '#707880' : '#5a3a20';
    px(g, x + 3, y + 2, 10, 14, shade(bc, -.4)); px(g, x + 4, y + 3, 8, 13, bc);
    if (above === 'B') { px(g, x + 7, y + 3, 1, 13, '#3a5a80'); px(g, x + 5, y + 4, 2, 4, '#c0e0f8'); }
    else px(g, x + 10, y + 9, 1, 2, '#e8c048');
  } else if (look === 'gua') {
    px(g, x, y, 16, 16, '#9a8a6a'); px(g, x + 2, y + 3, 12, 13, '#302418'); px(g, x + 4, y + 1, 8, 3, '#302418');
  } else if (look === 'tangga') {
    px(g, x, y, 16, 16, '#9a8a78');
    for (let i = 0; i < 4; i++) { px(g, x + 1, y + i * 4, 14, 3, '#c8b8a0'); px(g, x + 1, y + i * 4 + 3, 14, 1, '#6a5a48'); }
  } else if (look === 'lubang') {
    px(g, x, y, 16, 16, '#a88a68'); px(g, x + 2, y + 2, 12, 12, '#201810'); px(g, x + 3, y + 3, 10, 2, '#403020');
  } else if (look === 'tikar') {
    px(g, x, y, 16, 16, '#d8b47c'); px(g, x + 2, y + 5, 12, 9, '#c84848');
  } else if (look === 'kapal') {
    px(g, x, y, 16, 16, '#b88858'); px(g, x + 3, y, 10, 16, '#e8e8e8'); px(g, x + 4, y + 2, 8, 12, '#5878a8');
  }
}

// ---------- Watak manusia (16x16) ----------
const P_DOWN = [
  '................', '.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhhhhho...',
  '...ohssssssho...', '...osesssseso...', '....osssssso....', '...ojjccccjjo...', '..osccccccccso..',
  '..osccccccccso..', '...oppppppppo...', '...oppppppppo...', '....opp..ppo....', '....okk..kko....', '....ooo..ooo....'];
const P_UP = P_DOWN.map((r, i) => i === 5 ? '...ohhhhhhhho...' : i === 6 ? '...ohhhhhhhho...' : i === 7 ? '....ohhhhhho....' : r);
const P_LEFT = [
  '................', '......ooooo.....', '.....ohhhhho....', '....ohhhhhhho...', '....ohhhhhhho...',
  '...ossshhhhho...', '...oesshhhhho...', '....osssssso....', '....ojcccjjo....', '....occcscco....',
  '....occcscco....', '....opppppo.....', '....opppppo.....', '.....oppo.......', '.....okko.......', '.....oooo.......'];
function legFrames(base, f, side) {
  const b = base.slice();
  if (side) {
    if (f === 1) { b[13] = '....op..po......'; b[14] = '...okk..kko.....'; b[15] = '...ooo..ooo.....'; }
    return b;
  }
  if (f === 1) { b[14] = '....okk..ooo....'; b[15] = '....ooo.........'; }
  if (f === 2) { b[14] = '....ooo..kko....'; b[15] = '.........ooo....'; }
  return b;
}
const LOOKS = {
  pemain: { h: '#3a2418', hat: '#d83830', s: '#f0c8a0', c: '#3a78d0', p: '#303848' },
  pemain2: { h: '#3a2418', hij: '#e05a8a', s: '#f0c8a0', c: '#3a78d0', p: '#303848' },
  johan: { h: '#8a5a28', s: '#f0c8a0', c: '#8050b0', p: '#404050' },
  prof: { h: '#b8b8b8', s: '#f0c8a0', c: '#f8f8f8', p: '#806040' },
  mak: { hij: '#e07898', s: '#f0c8a0', c: '#f0a0b8', p: '#a04868' },
  makcik: { hij: '#58a8a0', s: '#e0b890', c: '#78c0b8', p: '#406868' },
  makcik2: { hij: '#a878c8', s: '#e0b890', c: '#c8a0e0', p: '#584070' },
  pakcik: { h: '#d8d8d8', hat: '#303030', s: '#d8a878', c: '#e8e0c8', p: '#505060' },
  atuk: { h: '#f0f0f0', hat: '#f8f8f8', s: '#d8a878', c: '#c8b890', p: '#706850' },
  budak: { h: '#202020', s: '#e8b888', c: '#f0d040', p: '#3050a0' },
  budak2: { h: '#202020', hat: '#40a040', s: '#e8b888', c: '#f8f8f8', p: '#40a040' },
  gadis: { h: '#402010', s: '#f0c8a0', c: '#f8a040', p: '#e06030' },
  gadis2: { hij: '#304890', s: '#f0c8a0', c: '#f8f8f8', p: '#304890' },
  jururawat: { hij: '#f8f8f8', s: '#f0c8a0', c: '#f890a8', p: '#f8f8f8' },
  peniaga: { h: '#302018', s: '#e0b890', c: '#4878d0', p: '#303848' },
  lanun: { h: '#202020', hat: '#c02828', s: '#e0b890', c: '#282830', p: '#282830' },
  lanunb: { h: '#202020', hat: '#7a2020', s: '#e0b890', c: '#d8c050', p: '#202028' },
  datuk: { h: '#303030', hat: '#202020', s: '#d8a878', c: '#383848', p: '#282830' },
  nelayan: { h: '#302018', hat: '#e8d8a0', s: '#c89060', c: '#e06030', p: '#405070' },
  pendaki: { h: '#503018', hat: '#a86030', s: '#d8a070', c: '#6a8a40', p: '#806040' },
  askar: { h: '#202020', hat: '#3a5ab0', s: '#d8a878', c: '#3a5ab0', p: '#2a3a70' },
  polis: { h: '#202020', hat: '#18204a', s: '#d8a878', c: '#2a3a8a', p: '#18204a' },
  pendekar: { h: '#202020', hat: '#c89020', s: '#d8a070', c: '#202020', p: '#202020' },
  pelajar: { h: '#202020', s: '#f0c8a0', c: '#f8f8f8', p: '#2a5a3a' },
  saintis: { h: '#606060', s: '#f0c8a0', c: '#e8f0f8', p: '#5070a0' },
  ahli: { h: '#1a1a1a', s: '#e0b890', c: '#c02850', p: '#303030' },
  penjaga: { h: '#302018', hat: '#6a7a3a', s: '#d8a070', c: '#8a9a4a', p: '#5a5a30' },
  kapten: { h: '#e0e0e0', hat: '#f8f8f8', s: '#e0b890', c: '#1a2a5a', p: '#1a2a5a' },
  hantu: { h: '#e8e8f0', s: '#d8d8e8', c: '#c8c8e0', p: '#b0b0d0' },
  ketua1: { h: '#302018', hat: '#8a6a3a', s: '#c89060', c: '#907858', p: '#504030' },
  ketua2: { hij: '#40a8e8', s: '#f0c8a0', c: '#40a8e8', p: '#2878b8' },
  ketua3: { h: '#202020', hat: '#3a5ab0', s: '#c89060', c: '#6a7a4a', p: '#4a5a3a' },
  ketua4: { hij: '#58b858', s: '#f0c8a0', c: '#f8c8d8', p: '#58b858' },
  ketua5: { h: '#202020', hat: '#a82020', s: '#c89060', c: '#202020', p: '#a82020' },
  ketua6: { h: '#281830', s: '#f0c8a0', c: '#c050a0', p: '#502860' },
  ketua7: { h: '#f0f0f0', s: '#d8a070', c: '#e05030', p: '#603020' },
  e1: { hij: '#90d0e8', s: '#f0c8a0', c: '#d0f0f8', p: '#5898b8' },
  e2: { h: '#101010', s: '#a87048', c: '#383838', p: '#202020' },
  e3: { h: '#d8d8d8', s: '#d8a878', c: '#604878', p: '#403050' },
  e4: { h: '#a02020', s: '#e0b890', c: '#3a2a6a', p: '#202040' },
};
const _pcache = {};
function personSprite(look, dir, f) {
  const key = look + dir + f;
  if (_pcache[key]) return _pcache[key];
  const L = typeof look === 'string' ? LOOKS[look] || LOOKS.budak : look;
  const side = dir === 'left' || dir === 'right';
  let rows = legFrames(dir === 'up' ? P_UP : side ? P_LEFT : P_DOWN, f, side);
  if (dir === 'right') rows = rows.map(r => r.split('').reverse().join(''));
  const [c, g] = mkCanvas(16, 16);
  const col = {
    o: '#282830', s: L.s, e: '#202028', c: L.c, p: L.p, k: '#403028',
    h: L.hij || L.h, j: L.hij || L.c
  };
  rows.forEach((r, y) => {
    for (let x = 0; x < 16; x++) {
      const ch = r[x]; if (ch === '.') continue;
      let cc = col[ch];
      if (L.hat && ch === 'h' && y <= 3) cc = L.hat;
      g.fillStyle = cc; g.fillRect(x, y, 1, 1);
    }
  });
  if (L.hat && !L.hij) { // birai topi
    g.fillStyle = shade(L.hat, -.25);
    if (dir === 'down') g.fillRect(4, 4, 8, 1);
    else if (dir === 'left') g.fillRect(3, 4, 5, 1);
    else if (dir === 'right') g.fillRect(8, 4, 5, 1);
  }
  if (L.hij) { // tudung sampai bahu
    g.fillStyle = L.hij;
    if (dir !== 'up') { g.fillRect(4, 7, 1, 2); g.fillRect(11, 7, 1, 2); }
    else { g.fillRect(4, 8, 8, 2); }
  }
  _pcache[key] = c;
  return c;
}
function ballSprite(col = '#e03838') {
  const [c, g] = mkCanvas(16, 16);
  g.fillStyle = '#282830'; g.beginPath(); g.arc(8, 9, 6, 0, 7); g.fill();
  g.fillStyle = col; g.beginPath(); g.arc(8, 9, 5, Math.PI, 0); g.fill();
  g.fillStyle = '#f8f8f8'; g.beginPath(); g.arc(8, 9, 5, 0, Math.PI); g.fill();
  g.fillStyle = '#282830'; g.fillRect(3, 8, 10, 2); g.fillStyle = '#f8f8f8'; g.fillRect(7, 8, 2, 2);
  g.fillStyle = '#ffffff99'; g.fillRect(5, 5, 2, 1);
  return c;
}
function signSprite() {
  const [c, g] = mkCanvas(16, 16);
  px(g, 7, 9, 2, 7, '#6a4222'); px(g, 1, 2, 14, 9, '#6a4222'); px(g, 2, 3, 12, 7, '#c8985a');
  px(g, 4, 5, 8, 1, '#8a6038'); px(g, 4, 7, 6, 1, '#8a6038');
  return c;
}
function barSprite() {
  const [c, g] = mkCanvas(16, 16);
  px(g, 0, 0, 16, 16, '#505868'); for (let i = 1; i < 16; i += 4) px(g, i, 0, 2, 16, '#a0a8b8');
  px(g, 0, 6, 16, 3, '#e8c048');
  return c;
}

// ---------- Sprite Monsta prosedur ----------
const _mcache = {};
function monstaSprite(name, back) {
  const key = name + (back ? 'b' : '');
  if (_mcache[key]) return _mcache[key];
  const sp = SP[name];
  const N = 64, buf = new Uint8Array(N * N);
  const set = (x, y, c) => { x = Math.floor(x); y = Math.floor(y); if (x >= 0 && y >= 0 && x < N && y < N) buf[y * N + x] = c; };
  const get = (x, y) => (x < 0 || y < 0 || x >= N || y >= N) ? 0 : buf[y * N + x];
  const ell = (cx, cy, rx, ry, c) => {
    rx = Math.max(rx, .6); ry = Math.max(ry, .6);
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + .5 - cx) / rx, dy = (y + .5 - cy) / ry; if (dx * dx + dy * dy <= 1) set(x, y, c);
    }
  };
  const rect = (x, y, w, h, c) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(x + i, y + j, c); };
  const tri = (ax, ay, bx, by, qx, qy, c) => {
    const minx = Math.floor(Math.min(ax, bx, qx)), maxx = Math.ceil(Math.max(ax, bx, qx));
    const miny = Math.floor(Math.min(ay, by, qy)), maxy = Math.ceil(Math.max(ay, by, qy));
    const d = (bx - ax) * (qy - ay) - (qx - ax) * (by - ay); if (Math.abs(d) < .01) return;
    for (let y = miny; y <= maxy; y++) for (let x = minx; x <= maxx; x++) {
      const px_ = x + .5, py = y + .5;
      const w1 = ((bx - px_) * (qy - py) - (qx - px_) * (by - py)) / d;
      const w2 = ((qx - px_) * (ay - py) - (ax - px_) * (qy - py)) / d;
      const w3 = 1 - w1 - w2;
      if (w1 >= 0 && w2 >= 0 && w3 >= 0) set(x, y, c);
    }
  };
  const line = (x0, y0, x1, y1, t, c) => {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) * 2) + 1;
    for (let i = 0; i <= n; i++) { const k = i / n; ell(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, t / 2, t / 2, c); }
  };
  const eye = (x, y, r = 2, look = -1) => {
    ell(x, y, r + .6, r + .8, 4); ell(x + look * r * .35, y + .3, r * .55, r * .7, 5); set(x + look * r * .35 - 1, y - 1, 4);
  };
  // 1 main 2 second 3 light 4 white 5 black 6 extra 12 dark main 13 bone 14 yellow 15 beak/orange 16 red
  const k = sp.k, F = new Set(sp.f || []);
  const G = 60;
  const plans = {
    kaki4() {
      const legH = 9 * k, bry = 9.5 * k, brx = 15 * k, bcx = 35, bcy = G - legH - bry * .55;
      const hr = (F.has('kepalabesar') ? 10.5 : 8.5) * k, hx = bcx - brx * .85, hy = bcy - bry * .95;
      if (F.has('ekorlebat')) { ell(bcx + brx * 1.1, bcy - bry * 1.2, 7 * k, 12 * k, 2); ell(bcx + brx * 1.1, bcy - bry * 1.2 - 3 * k, 4 * k, 7 * k, 3); }
      else if (!F.has('tanpaekor')) line(bcx + brx * .8, bcy - 1, bcx + brx * 1.35, bcy - bry * 1.3, 3.2 * k, F.has('tempurung') ? 1 : 2);
      if (F.has('api')) { const tx = bcx + brx * 1.35, ty = bcy - bry * 1.3; ell(tx, ty - 3 * k, 4 * k, 6 * k, 15); ell(tx, ty - 2 * k, 2.5 * k, 3.5 * k, 14); }
      // kaki jauh
      rect(bcx - brx * .35, bcy, 4 * k, G - bcy, 12); rect(bcx + brx * .45, bcy, 4 * k, G - bcy, 12);
      if (F.has('sayap')) { tri(bcx, bcy - bry * .5, bcx + brx * 1.2, bcy - bry * 3.2, bcx + brx * .9, bcy - bry * .3, 2); tri(bcx - 2, bcy - bry * .4, bcx + brx * .5, bcy - bry * 3.4, bcx + brx * .4, bcy - bry * .2, 3); }
      ell(bcx, bcy, brx, bry, 1);
      if (F.has('tempurung')) { ell(bcx + 2, bcy - bry * .35, brx * .95, bry * 1.05, 2); for (let i = -1; i <= 1; i++) ell(bcx + 2 + i * brx * .5, bcy - bry * .5, 3 * k, 3 * k, 10); line(bcx - brx * .8, bcy + bry * .4, bcx + brx * .9, bcy + bry * .4, 1.5, 13); }
      else ell(bcx - 2, bcy + bry * .4, brx * .7, bry * .45, 3);
      if (F.has('belang')) for (let i = -1; i <= 2; i++) rect(bcx + i * brx * .35 - 1, bcy - bry * .9, 2 * k, bry * 1.2, 2);
      if (F.has('bintik')) for (let i = 0; i < 5; i++) ell(bcx - brx * .5 + i * brx * .28, bcy - bry * .3 + (i % 2) * 3, 1.5 * k, 1.5 * k, 3);
      if (F.has('sisik')) for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) ell(bcx - brx * .6 + i * brx * .38 + j * 2, bcy - bry * .55 + j * bry * .6, 2.5 * k, 1.5 * k, 12);
      if (F.has('duri')) for (let i = 0; i < 4; i++) tri(bcx - brx * .5 + i * brx * .35, bcy - bry * .8, bcx - brx * .3 + i * brx * .35, bcy - bry * .8, bcx - brx * .4 + i * brx * .35, bcy - bry * 1.6, 2);
      if (F.has('daun')) { tri(bcx - 2 * k, bcy - bry * .8, bcx + 8 * k, bcy - bry * .8, bcx + 4 * k, bcy - bry * 2.4, 2); tri(bcx + 2 * k, bcy - bry * .9, bcx + 12 * k, bcy - bry * .6, bcx + 13 * k, bcy - bry * 2, 6); }
      if (F.has('bunga')) { const fx = bcx + 2, fy = bcy - bry * 1.3; for (let a = 0; a < 5; a++) ell(fx + Math.cos(a * 1.26) * 5 * k, fy + Math.sin(a * 1.26) * 4 * k, 3.5 * k, 3 * k, 6); ell(fx, fy, 2.5 * k, 2.5 * k, 14); }
      if (F.has('surai')) for (let i = 0; i < 4; i++) { ell(hx + 4 * k + i * 4 * k, hy - hr * .3 + i * 2 * k, 3 * k, 4 * k, 15); ell(hx + 4 * k + i * 4 * k, hy - hr * .1 + i * 2 * k, 1.6 * k, 2.2 * k, 14); }
      // kaki dekat
      rect(bcx - brx * .65, bcy, 4.5 * k, G - bcy, 1); rect(bcx + brx * .2, bcy, 4.5 * k, G - bcy, 1);
      rect(bcx - brx * .65 - 1, G - 2, 6 * k, 2, 12); rect(bcx + brx * .2 - 1, G - 2, 6 * k, 2, 12);
      // kepala
      if (F.has('telinga')) { tri(hx - hr * .2, hy - hr * .6, hx + hr * .6, hy - hr * .5, hx + hr * .4, hy - hr * 1.7, 1); tri(hx + hr * .15, hy - hr * .4, hx + hr * .45, hy - hr * .45, hx + hr * .35, hy - hr * 1.2, 3); }
      if (F.has('telingabulat')) { ell(hx + hr * .3, hy - hr * .9, hr * .45, hr * .45, 1); ell(hx + hr * .3, hy - hr * .9, hr * .25, hr * .25, 3); }
      if (F.has('telingapanjang')) { ell(hx + hr * .4, hy - hr * 1.3, hr * .3, hr * .9, 1); ell(hx + hr * .4, hy - hr * 1.3, hr * .15, hr * .6, 3); }
      ell(hx, hy, hr, hr * .9, 1);
      if (F.has('surai')) { ell(hx + hr * .6, hy - hr * .6, 3.5 * k, 5 * k, 15); ell(hx + hr * .6, hy - hr * .5, 2 * k, 3 * k, 14); }
      ell(hx - hr * .75, hy + hr * .25, hr * .5, hr * .4, 3);
      set(hx - hr * 1.2, hy + hr * .1, 5);
      if (F.has('tanduk')) { tri(hx - hr * .3, hy - hr * .6, hx + hr * .2, hy - hr * .7, hx - hr * .1, hy - hr * 2, 13); }
      if (F.has('tandukbadak')) { tri(hx - hr * 1.1, hy - hr * .1, hx - hr * .6, hy - hr * .1, hx - hr * 1.2, hy - hr * 1.3, 13); }
      if (F.has('tandukkerbau')) { line(hx - hr * .1, hy - hr * .6, hx - hr * 1.2, hy - hr * 1.2, 2.5 * k, 13); line(hx + hr * .5, hy - hr * .6, hx + hr * 1.3, hy - hr * 1.3, 2.5 * k, 13); }
      eye(hx - hr * .3, hy - hr * .2, F.has('matabesar') ? 2.6 * k : 1.8 * k);
      if (F.has('misai')) { line(hx - hr * 1.1, hy + hr * .35, hx - hr * 1.7, hy + hr * .1, 1, 5); line(hx - hr * 1.1, hy + hr * .45, hx - hr * 1.7, hy + hr * .6, 1, 5); }
    },
    tegak() {
      const legH = 10 * k, bry = 12 * k, brx = 10 * k, bcx = 33, bcy = G - legH - bry * .75;
      const hr = (F.has('kepalabesar') ? 11 : 9) * k, hx = bcx - 2 * k, hy = bcy - bry - hr * .45;
      if (F.has('sayap')) { tri(bcx + brx * .3, bcy - bry * .5, bcx + brx * 2.4, bcy - bry * 1.9, bcx + brx * 1.8, bcy + bry * .2, 2); tri(bcx + brx * .3, bcy - bry * .3, bcx + brx * 1.8, bcy - bry * 1.3, bcx + brx * 1.4, bcy + bry * .1, 3); }
      if (!F.has('tanpaekor')) {
        line(bcx + brx * .6, bcy + bry * .5, bcx + brx * 1.7, bcy + bry * .1, 3.5 * k, F.has('ekor2') ? 2 : 1);
        line(bcx + brx * 1.7, bcy + bry * .1, bcx + brx * 2, bcy - bry * .6, 3 * k, F.has('ekor2') ? 2 : 1);
        if (F.has('api')) { const tx = bcx + brx * 2, ty = bcy - bry * .7; ell(tx, ty - 3 * k, 4 * k, 6 * k, 15); ell(tx, ty - 2 * k, 2.5 * k, 3.5 * k, 14); }
      }
      rect(bcx + 1 * k, bcy + bry * .4, 5 * k, G - bcy - bry * .4, 12);
      line(bcx + brx * .5, bcy - bry * .4, bcx + brx * 1.1, bcy + bry * .1, 3.5 * k, 12);
      ell(bcx, bcy, brx, bry, 1);
      ell(bcx - 2 * k, bcy + bry * .15, brx * .65, bry * .7, 3);
      if (F.has('bengkung')) rect(bcx - brx, bcy + bry * .2, brx * 2, 2.5 * k, 6);
      if (F.has('bulu')) for (let i = 0; i < 3; i++) tri(bcx - brx + i * brx * .7, bcy - bry * .75, bcx - brx * .4 + i * brx * .7, bcy - bry * .8, bcx - brx * .7 + i * brx * .7, bcy - bry * 1.25, 1);
      rect(bcx - 6 * k, bcy + bry * .4, 5 * k, G - bcy - bry * .4, 1);
      ell(bcx - 4.5 * k, G - 1.5, 4.5 * k, 2.2, 12); ell(bcx + 3.5 * k, G - 1.5, 4 * k, 2, 12);
      if (F.has('sabit')) { tri(bcx - brx * .5, bcy - bry * .4, bcx - brx * 2.3, bcy - bry * 1.3, bcx - brx * 1.2, bcy - bry * .1, 13); tri(bcx - brx * .4, bcy - bry * .1, bcx - brx * 2.1, bcy - bry * .4, bcx - brx * 1.1, bcy + bry * .2, 13); }
      else { line(bcx - brx * .6, bcy - bry * .4, bcx - brx * 1.35, bcy + bry * .15, 3.5 * k, 1); ell(bcx - brx * 1.4, bcy + bry * .2, 2.4 * k, 2.4 * k, F.has('sarungtangan') ? 6 : 1); }
      if (F.has('telinga')) { tri(hx - hr * .6, hy - hr * .5, hx - hr * .1, hy - hr * .8, hx - hr * .6, hy - hr * 1.6, 1); tri(hx + hr * .2, hy - hr * .8, hx + hr * .7, hy - hr * .5, hx + hr * .6, hy - hr * 1.6, 1); }
      if (F.has('telingabulat')) { ell(hx - hr * .8, hy - hr * .2, hr * .4, hr * .45, 2); ell(hx + hr * .8, hy - hr * .2, hr * .4, hr * .45, 2); }
      ell(hx, hy, hr, hr * .92, 1);
      if (F.has('muka')) ell(hx - hr * .2, hy + hr * .15, hr * .7, hr * .6, 3);
      if (F.has('jambul')) { tri(hx - hr * .3, hy - hr * .7, hx + hr * .5, hy - hr * .8, hx + hr * .3, hy - hr * 1.8, 2); }
      if (F.has('tanduk')) { tri(hx - hr * .5, hy - hr * .6, hx - hr * .1, hy - hr * .8, hx - hr * .5, hy - hr * 1.8, 13); tri(hx + hr * .2, hy - hr * .8, hx + hr * .6, hy - hr * .6, hx + hr * .5, hy - hr * 1.8, 13); }
      if (F.has('ikatkepala')) rect(hx - hr, hy - hr * .5, hr * 2, 2 * k, 6);
      const er = F.has('matabesar') ? 3.2 * k : 2 * k;
      eye(hx - hr * .45, hy - hr * .05, er); eye(hx + hr * .25, hy - hr * .05, er);
      if (F.has('moncong')) { ell(hx - hr * .9, hy + hr * .35, hr * .45, hr * .35, 3); set(hx - hr * 1.3, hy + hr * .2, 5); }
      else rect(hx - hr * .35, hy + hr * .45, 3 * k, 1, 5);
    },
    burung() {
      const long = F.has('kakipanjang'), itik = F.has('itik');
      const bcx = 34, bcy = long ? 32 : itik ? 44 : 40, brx = 13 * k, bry = 10 * k;
      const hr = 7.5 * k;
      let hx = bcx - brx * .8, hy = bcy - bry * 1.05;
      if (F.has('leherpanjang')) { line(bcx - brx * .6, bcy - bry * .5, bcx - brx * .9, bcy - bry * 2.2, 4 * k, 1); hy = bcy - bry * 2.4; hx = bcx - brx * 1.0; }
      // kaki
      if (!itik) { const ly = bcy + bry * .8; line(bcx - 3, ly - 2, bcx - 4, G, 1.6, 15); line(bcx + 3, ly - 2, bcx + 2, G, 1.6, 15); rect(bcx - 7, G - 1, 5, 2, 15); rect(bcx - 1, G - 1, 5, 2, 15); }
      else { ell(bcx - 4, G - 2, 4, 2, 15); ell(bcx + 4, G - 2, 4, 2, 15); }
      tri(bcx + brx * .7, bcy - 3 * k, bcx + brx * .7, bcy + 3 * k, bcx + brx * (F.has('ekorpanjang') ? 2.3 : 1.6), bcy - bry * .3, 2);
      if (F.has('sayapbuka') || F.has('kelawar')) {
        tri(bcx - brx * .1, bcy - bry * .4, bcx + brx * 1.6, bcy - bry * 2.8, bcx + brx * 1.1, bcy + bry * .2, F.has('kelawar') ? 2 : 2);
        tri(bcx - brx * .4, bcy - bry * .5, bcx - brx * .9, bcy - bry * 3.2, bcx + brx * .3, bcy - bry * .2, 12);
        if (F.has('kelawar')) { line(bcx + brx * .2, bcy - bry * .4, bcx + brx * 1.5, bcy - bry * 2.7, 1, 12); line(bcx + brx * .3, bcy - bry * .2, bcx + brx * 1.3, bcy - bry * 1.3, 1, 12); }
      }
      ell(bcx, bcy, brx, bry, 1);
      ell(bcx - brx * .3, bcy + bry * .35, brx * .6, bry * .5, 3);
      if (!F.has('sayapbuka') && !F.has('kelawar')) { ell(bcx + brx * .2, bcy - bry * .1, brx * .65, bry * .55, 2); tri(bcx + brx * .3, bcy - bry * .4, bcx + brx * .5, bcy + bry * .3, bcx + brx * 1.3, bcy + bry * .1, 2); }
      if (F.has('balung')) { ell(hx - hr * .1, hy - hr * .9, 2.5 * k, 2.5 * k, 16); ell(hx + hr * .4, hy - hr * .8, 2.5 * k, 2.5 * k, 16); ell(hx - hr * .9, hy + hr * .6, 1.5 * k, 2.5 * k, 16); }
      if (F.has('jambul')) { tri(hx + hr * .1, hy - hr * .7, hx + hr * .7, hy - hr * .5, hx + hr * 1.6, hy - hr * 1.9, 2); tri(hx - hr * .2, hy - hr * .8, hx + hr * .3, hy - hr * .8, hx + hr * .5, hy - hr * 2.1, 6); }
      if (F.has('telinga')) { tri(hx - hr * .6, hy - hr * .5, hx - hr * .1, hy - hr * .8, hx - hr * .4, hy - hr * 1.7, 1); tri(hx + hr * .2, hy - hr * .8, hx + hr * .7, hy - hr * .5, hx + hr * .6, hy - hr * 1.7, 1); }
      ell(hx, hy, hr, hr * .9, 1);
      if (F.has('muka')) ell(hx - hr * .2, hy, hr * .7, hr * .6, 3);
      if (F.has('kelawar')) { tri(hx - hr * .7, hy + hr * .4, hx - hr * .4, hy + hr * .4, hx - hr * .55, hy + hr * .9, 4); }
      else if (itik) ell(hx - hr * 1.2, hy + hr * .25, hr * .7, hr * .32, 15);
      else tri(hx - hr * .75, hy - hr * .25, hx - hr * .75, hy + hr * .35, hx - hr * (F.has('paruhpanjang') ? 2.6 : 1.7), hy + hr * .1, 15);
      eye(hx - hr * .3, hy - hr * .2, (F.has('matabesar') ? 2.8 : 1.8) * k);
      if (F.has('matabesar')) eye(hx + hr * .45, hy - hr * .2, 2.8 * k);
    },
    ikan() {
      const cx = 30, cy = F.has('dugong') ? 42 : 38, rx = (F.has('dugong') ? 19 : 17) * k, ry = (F.has('dugong') ? 11 : 9) * k;
      tri(cx + rx * .8, cy, cx + rx * 1.45, cy - ry * 1.1, cx + rx * 1.45, cy + ry * 1.1, 2);
      if (!F.has('dugong')) tri(cx - rx * .3, cy - ry * .8, cx + rx * .4, cy - ry * .8, cx + rx * .2, cy - ry * 1.8, 2);
      ell(cx, cy, rx, ry, 1);
      ell(cx - rx * .1, cy + ry * .5, rx * .8, ry * .4, 3);
      tri(cx - rx * .1, cy + ry * .3, cx + rx * .3, cy + ry * .3, cx + rx * .15, cy + ry * 1.5, 2);
      if (F.has('belang')) for (let i = 0; i < 3; i++) rect(cx - rx * .3 + i * rx * .4, cy - ry * .8, 2 * k, ry * 1.2, 2);
      if (F.has('bintik')) for (let i = 0; i < 5; i++) ell(cx - rx * .4 + i * rx * .3, cy - ry * .3 + (i % 2) * 3, 1.3, 1.3, 3);
      if (F.has('tanduk')) tri(cx - rx * .7, cy - ry * .6, cx - rx * .4, cy - ry * .8, cx - rx * .9, cy - ry * 2, 13);
      if (F.has('duri')) for (let i = 0; i < 4; i++) tri(cx - rx * .3 + i * 5, cy - ry * .9, cx - rx * .1 + i * 5, cy - ry * .9, cx - rx * .2 + i * 5, cy - ry * 1.7, 6);
      eye(cx - rx * .6, cy - ry * .25, (F.has('matabesar') ? 3 : 2) * k);
      rect(cx - rx * .98, cy + ry * .2, 3 * k, 1, 5);
      if (F.has('misai')) { line(cx - rx * .9, cy + ry * .1, cx - rx * 1.4, cy + ry * .8, 1, 5); line(cx - rx * .85, cy + ry * .3, cx - rx * 1.2, cy + ry * 1.2, 1, 5); }
      if (F.has('dugong')) { ell(cx - rx * .3, cy + ry * .9, 5 * k, 2.5 * k, 12); ell(cx - rx * .9, cy + ry * .15, 4 * k, 3.5 * k, 3); }
      if (F.has('tempurung')) { ell(cx + rx * .1, cy - ry * .6, rx * .6, ry * .6, 2); for (let i = -1; i <= 1; i++) ell(cx + rx * .1 + i * rx * .3, cy - ry * .7, 2, 2, 10); }
    },
    kudalaut() {
      const cx = 32;
      line(cx + 4, 50, cx + 10, 56, 4 * k, 1); ell(cx + 12, 55, 4 * k, 3 * k, 1); ell(cx + 12, 55, 2 * k, 1.5 * k, 3);
      ell(cx + 2, 40, 9 * k, 13 * k, 1); ell(cx - 1, 42, 5 * k, 10 * k, 3);
      for (let i = 0; i < 4; i++) rect(cx - 5, 34 + i * 5, 10 * k, 1, 12);
      tri(cx + 8 * k, 32, cx + 8 * k, 46, cx + 17 * k, 38, 2);
      ell(cx - 2, 22, 7 * k, 6 * k, 1); line(cx - 6, 24, cx - 16 * k, 26, 3.5 * k, 1);
      tri(cx, 16, cx + 6, 17, cx + 6, 10, 2);
      eye(cx - 3, 21, 2 * k);
    },
    ular() {
      const t = 6.5 * k;
      const rock = F.has('batu');
      const pts = [];
      for (let i = 0; i <= 14; i++) { const a = i / 14; pts.push([48 - 22 * a + Math.sin(a * 6) * 4 * k, G - 5 - (a < .5 ? 0 : (a - .5) * 2 * 30 * k) - Math.cos(a * 5) * 2]); }
      if (F.has('sayap')) { tri(36, 40, 58, 14, 50, 44, 2); tri(34, 38, 48, 12, 44, 40, 3); }
      if (F.has('sirip')) for (let i = 2; i < 12; i += 3) tri(pts[i][0] - 3, pts[i][1] - t * .5, pts[i][0] + 3, pts[i][1] - t * .5, pts[i][0] + 2, pts[i][1] - t * 1.5, 2);
      for (let i = 0; i < pts.length; i++) {
        const [x, y] = pts[i], r = t * (.6 + .5 * (i / pts.length));
        if (rock) rect(x - r, y - r, r * 2, r * 2, i % 2 ? 1 : 12); else ell(x, y, r, r, 1);
        if (!rock) ell(x - 1, y + r * .4, r * .6, r * .4, 3);
      }
      const [hx, hy] = pts[pts.length - 1];
      if (F.has('tudung')) { ell(hx + 3, hy + 2, 9 * k, 11 * k, 2); ell(hx + 3, hy + 3, 5 * k, 7 * k, 3); }
      if (rock) { rect(hx - 9 * k, hy - 7 * k, 16 * k, 13 * k, 1); rect(hx - 12 * k, hy - 2 * k, 6 * k, 7 * k, 1); }
      else ell(hx - 3, hy - 2, 8 * k, 6.5 * k, 1);
      if (F.has('tanduk')) { tri(hx, hy - 5 * k, hx + 4, hy - 5 * k, hx + 5, hy - 15 * k, 13); }
      if (F.has('sesungut')) { line(hx - 8, hy + 2, hx - 16, hy + 6, 1, 13); line(hx - 8, hy + 1, hx - 16, hy - 4, 1, 13); }
      if (F.has('bulu')) tri(hx + 2, hy - 6, hx + 10, hy - 4, hx + 12, hy - 14, 2);
      eye(hx - 5 * k, hy - 3 * k, 2 * k);
      rect(hx - 10 * k, hy + 1, 5 * k, 1, 5);
    },
    serangga() {
      const ulat = F.has('ulat');
      if (ulat) {
        for (let i = 0; i < 6; i++) { ell(46 - i * 5 * k, G - 7 * k - (i === 5 ? 4 * k : 0), 6 * k, 6 * k, i % 2 ? 1 : 2); rect(45 - i * 5 * k, G - 2, 2, 2, 12); }
        const hx = 46 - 6 * 5 * k, hy = G - 14 * k;
        ell(hx, hy, 7.5 * k, 7 * k, 1);
        if (F.has('sesungut')) { line(hx, hy - 6 * k, hx - 3, hy - 13 * k, 1.2, 15); line(hx + 3, hy - 6 * k, hx + 6, hy - 12 * k, 1.2, 15); }
        if (F.has('daun')) tri(46, G - 12 * k, 54, G - 14 * k, 50, G - 26 * k, 6);
        eye(hx - 3 * k, hy - 1, 2 * k); eye(hx + 2 * k, hy - 1, 2 * k);
        return;
      }
      if (F.has('kepompong')) {
        line(34, 4, 34, 14, 1, 12);
        ell(33, 36, 11 * k, 20 * k, 1); for (let i = 0; i < 5; i++) rect(24, 24 + i * 6, 18 * k, 1, 12);
        ell(30, 30, 4 * k, 6 * k, 3);
        eye(28, 26, 1.8); eye(34, 26, 1.8); return;
      }
      const acx = 40, acy = G - 16 * k, arx = 12 * k, ary = 9 * k;
      const tcx = 28, tcy = G - 17 * k, hcx = 17, hcy = G - 20 * k;
      for (let i = 0; i < 3; i++) { line(tcx - 4 + i * 5, tcy + 3, tcx - 8 + i * 6, G - 4, 1.8, 12); line(tcx - 8 + i * 6, G - 4, tcx - 11 + i * 6, G, 1.5, 12); }
      if (F.has('sayap')) { ell(acx - 2, acy - ary * 1.4, arx * .9, ary * .8, 3); ell(acx + 4, acy - ary * 1.1, arx * .8, ary * .6, 14); }
      if (F.has('sengat')) tri(acx + arx * .8, acy - 2, acx + arx * .8, acy + 3, acx + arx * 1.6, acy + 1, 13);
      ell(acx, acy, arx, ary, 1);
      if (F.has('belang')) for (let i = 0; i < 3; i++) rect(acx - arx * .4 + i * arx * .4, acy - ary * .9, 2.5 * k, ary * 1.8, 2);
      ell(tcx, tcy, 7 * k, 6 * k, F.has('topi') ? 1 : 2);
      if (F.has('topi')) { ell(acx - 2, acy - ary * .6, arx * 1.2, ary * 1, 6); rect(acx - arx * 1.3, acy - ary * .5, arx * 2.6, ary * 1.2, 0); ell(acx - 2, acy - ary * .7, arx * 1.2, ary * .4, 6); for (let i = 0; i < 3; i++) ell(acx - arx * .6 + i * arx * .6, acy - ary * 1.1, 1.8, 1.4, 4); }
      ell(hcx, hcy, 7 * k, 6.5 * k, 1);
      if (F.has('tanduk')) { line(hcx - 2, hcy - 5 * k, hcx - 6, hcy - 18 * k, 3 * k, 12); line(hcx - 6, hcy - 18 * k, hcx - 1, hcy - 22 * k, 2 * k, 12); }
      else { line(hcx - 2, hcy - 5 * k, hcx - 8, hcy - 14 * k, 1, 12); line(hcx + 2, hcy - 5 * k, hcx + 3, hcy - 15 * k, 1, 12); }
      if (F.has('sepit')) { ell(hcx - 8 * k, hcy + 5 * k, 4 * k, 3 * k, 13); }
      eye(hcx - 3 * k, hcy - 1, 2 * k);
    },
    rama() {
      const cx = 32, cy = 34;
      const glow = F.has('cahaya');
      if (glow) { ell(cx, cy + 16 * k, 8 * k, 8 * k, 14); }
      ell(cx - 11 * k, cy - 7 * k, 11 * k, 10 * k, 1); ell(cx + 11 * k, cy - 7 * k, 11 * k, 10 * k, 1);
      ell(cx - 9 * k, cy + 7 * k, 8 * k, 7 * k, 2); ell(cx + 9 * k, cy + 7 * k, 8 * k, 7 * k, 2);
      ell(cx - 12 * k, cy - 8 * k, 4 * k, 4 * k, 3); ell(cx + 12 * k, cy - 8 * k, 4 * k, 4 * k, 3);
      ell(cx - 10 * k, cy + 8 * k, 2.5 * k, 2.5 * k, 6); ell(cx + 10 * k, cy + 8 * k, 2.5 * k, 2.5 * k, 6);
      ell(cx, cy + 3, 3.5 * k, 12 * k, 12);
      if (glow) ell(cx, cy + 13 * k, 4 * k, 4 * k, 14);
      ell(cx, cy - 12 * k, 5 * k, 5 * k, 12);
      line(cx - 2, cy - 16 * k, cx - 8, cy - 26 * k, 1, 12); line(cx + 2, cy - 16 * k, cx + 8, cy - 26 * k, 1, 12);
      ell(cx - 8, cy - 26 * k, 1.5, 1.5, 12); ell(cx + 8, cy - 26 * k, 1.5, 1.5, 12);
      ell(cx - 2.5 * k, cy - 12 * k, 2 * k, 2.2 * k, 16); ell(cx + 2.5 * k, cy - 12 * k, 2 * k, 2.2 * k, 16);
    },
    blob() {
      const floating = F.has('sesungut') || F.has('hantu') || F.has('asap');
      const rx = 15 * k, ry = (F.has('periuk') ? 17 : 14) * k, cx = 32;
      const cy = floating ? 30 : G - ry;
      if (F.has('sesungut')) for (let i = 0; i < 5; i++) { const x0 = cx - rx * .7 + i * rx * .35; line(x0, cy + ry * .5, x0 + Math.sin(i) * 4, G - 2 - (i % 2) * 4, 2.2 * k, 2); }
      if (F.has('hantu')) { tri(cx - rx * .3, cy + ry * .5, cx + rx * .9, cy + ry * .4, cx + rx * 1.4, cy + ry * 2, 1); ell(cx + rx * 1.3, cy + ry * 1.9, 3, 3, 1); }
      if (F.has('asap')) { for (let i = 0; i < 6; i++) ell(cx + Math.cos(i * 1.05) * rx * .9, cy + Math.sin(i * 1.05) * ry * .8, rx * .45, ry * .45, 2); }
      if (F.has('cengkerang')) { ell(cx, cy - ry * .45, rx * 1.3, ry * .8, 2); ell(cx, cy + ry * .5, rx * 1.3, ry * .7, 2); for (let i = -2; i <= 2; i++) line(cx + i * rx * .3, cy - ry * 1.1, cx + i * rx * .45, cy - ry * .1, 1.2, 10); }
      if (F.has('batu')) { ell(cx - rx * 1.3, cy + ry * .1, 5 * k, 5 * k, 12); ell(cx + rx * 1.3, cy + ry * .1, 5 * k, 5 * k, 12); line(cx - rx * .8, cy, cx - rx * 1.25, cy + ry * .1, 4 * k, 12); line(cx + rx * .8, cy, cx + rx * 1.25, cy + ry * .1, 4 * k, 12); }
      if (F.has('mentol')) { rect(cx - 6 * k, cy + ry * .7, 12 * k, 8 * k, 13); for (let i = 0; i < 3; i++) rect(cx - 6 * k, cy + ry * .7 + 2 + i * 2.5 * k, 12 * k, 1, 12); }
      if (F.has('ais')) { tri(cx - rx * 1.2, cy + ry * .2, cx + rx * 1.2, cy + ry * .2, cx, cy + ry * 1.1, 13); ell(cx, cy + ry * .25, rx * 1.2, ry * .25, 12); }
      if (F.has('periuk')) { ell(cx, cy - ry * .95, rx * .9, ry * .25, 2); line(cx + rx * .6, cy - ry * .9, cx + rx * 1.4, cy - ry * 1.3, 2, 2); }
      if (F.has('lumpur')) { ell(cx, G - 4, rx * 1.5, 5 * k, 1); }
      if (F.has('tikustanah')) { ell(cx, G - 2, rx * 1.4, 6, 12); }
      if (F.has('lumpur')) ell(cx, cy + ry * .2, rx * 1.1, ry * .85, 1);
      else ell(cx, cy, rx, ry, F.has('cengkerang') ? 3 : 1);
      if (F.has('ais')) { ell(cx, cy - ry * .2, rx * .95, ry * .9, 3); ell(cx - rx * .4, cy - ry * .6, 3 * k, 2 * k, 16); ell(cx + rx * .3, cy - ry * .75, 3 * k, 2 * k, 6); ell(cx + rx * .1, cy - ry * .2, 2.5 * k, 2 * k, 2); ell(cx - rx * .5, cy + ry * .05, 2 * k, 1.5 * k, 14); ell(cx, cy - ry * .95, 3 * k, 2.5 * k, 16); }
      if (F.has('mentol')) { ell(cx, cy, rx * .75, ry * .75, 3); line(cx - 4, cy + 3, cx, cy - 4, 1, 14); line(cx, cy - 4, cx + 4, cy + 3, 1, 14); }
      if (!F.has('ais') && !F.has('mentol') && !F.has('cengkerang') && !F.has('batu')) ell(cx - 1, cy + ry * .35, rx * .65, ry * .45, 3);
      if (F.has('batu')) { for (let i = 0; i < 4; i++) ell(cx - rx * .5 + (i % 2) * rx * .9, cy - ry * .5 + Math.floor(i / 2) * ry * .9, 3 * k, 2.5 * k, 12); }
      if (F.has('bunga')) { const fx = cx, fy = cy - ry * 1.05; for (let a = 0; a < 5; a++) ell(fx + Math.cos(a * 1.26 - 1.57) * 6 * k, fy + Math.sin(a * 1.26 - 1.57) * 5 * k, 4.5 * k, 4 * k, 6); ell(fx, fy, 3 * k, 3 * k, 14); for (let a = 0; a < 5; a++) ell(fx + Math.cos(a * 1.26 - 1.57) * 6 * k, fy + Math.sin(a * 1.26 - 1.57) * 5 * k, 1.2, 1.2, 4); }
      if (F.has('daun')) { tri(cx - 2, cy - ry * .8, cx - 12 * k, cy - ry * 1.9, cx - 4 * k, cy - ry * 1.9, 2); tri(cx + 2, cy - ry * .8, cx + 12 * k, cy - ry * 1.8, cx + 4 * k, cy - ry * 2.0, 2); tri(cx - 1, cy - ry * .8, cx + 1, cy - ry * .8, cx, cy - ry * 2.2, 2); }
      if (F.has('cendawan')) { ell(cx, cy - ry * .7, rx * 1.3, ry * .7, 6); rect(cx - rx * 1.4, cy - ry * .5, rx * 2.8, ry * .6, 0); ell(cx, cy - ry * .5, rx, ry * .25, 1); for (let i = 0; i < 3; i++) ell(cx - rx * .7 + i * rx * .7, cy - ry * 1.0, 2.2, 1.8, 4); }
      if (F.has('katak')) { ell(cx - rx * .55, cy - ry * .85, 4.5 * k, 4.5 * k, 1); ell(cx + rx * .35, cy - ry * .85, 4.5 * k, 4.5 * k, 1); }
      if (F.has('duri')) for (let i = 0; i < 5; i++) { const a = -2.6 + i * .5; tri(cx + Math.cos(a) * rx * .9 - 2, cy + Math.sin(a) * ry * .9, cx + Math.cos(a) * rx * .9 + 2, cy + Math.sin(a) * ry * .9, cx + Math.cos(a) * rx * 1.4, cy + Math.sin(a) * ry * 1.4, 2); }
      if (F.has('tanduk')) { tri(cx - 4, cy - ry * .85, cx + 2, cy - ry * .9, cx - 3, cy - ry * 1.6, 13); }
      if (!floating && !F.has('lumpur') && !F.has('ais') && !F.has('tikustanah') && !F.has('mentol')) { ell(cx - rx * .5, G - 1.5, 4.5 * k, 2.2, 12); ell(cx + rx * .5, G - 1.5, 4.5 * k, 2.2, 12); }
      const ey = F.has('katak') ? cy - ry * .85 : cy - ry * .2;
      const ex1 = F.has('katak') ? cx - rx * .55 : cx - rx * .4, ex2 = F.has('katak') ? cx + rx * .35 : cx + rx * .2;
      const er = (F.has('matabesar') ? 3.2 : 2.3) * k;
      if (F.has('satumata')) eye(cx - 2, ey, er * 1.5);
      else { eye(ex1, ey, er); eye(ex2, ey, er); }
      if (F.has('hantu')) { tri(cx - rx * .5, cy + ry * .2, cx + rx * .1, cy + ry * .2, cx - rx * .2, cy + ry * .5, 16); }
      else if (!F.has('ais')) rect(cx - 5 * k, ey + er * 1.8, 5 * k, 1, 5);
      if (F.has('periuk')) { ell(cx, cy - ry * .95, rx * .7, ry * .12, 5); }
      if (F.has('tikustanah')) { ell(cx - rx * .9, cy + ry * .15, 3 * k, 2.5 * k, 16); }
    },
    bintang() {
      const cx = 32, cy = 36, R = 21 * k, r = 9 * k;
      const pts = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr_ = i % 2 ? r : R; pts.push([cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_]); }
      for (let i = 0; i < 10; i++) tri(cx, cy, pts[i][0], pts[i][1], pts[(i + 1) % 10][0], pts[(i + 1) % 10][1], 1);
      if (F.has('dua')) { for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + Math.PI / 5 + i * Math.PI / 5, rr_ = i % 2 ? r : R * .85; pts[i] = [cx + Math.cos(a) * rr_, cy + Math.sin(a) * rr_]; } for (let i = 0; i < 10; i++) tri(cx, cy, pts[i][0], pts[i][1], pts[(i + 1) % 10][0], pts[(i + 1) % 10][1], 2); }
      ell(cx, cy, 5 * k, 5 * k, 3); ell(cx, cy, 3.5 * k, 3.5 * k, 16); set(cx - 1, cy - 1, 4);
    },
    ketam() {
      const cx = 32, cy = 42, rx = 15 * k, ry = 9 * k;
      for (let i = 0; i < 3; i++) { line(cx - rx * .5 + i * 4, cy + 3, cx - rx * 1.1 + i * 3, G, 1.8, 12); line(cx + rx * .5 - i * 4, cy + 3, cx + rx * 1.1 - i * 3, G, 1.8, 12); }
      line(cx - rx * .7, cy - 2, cx - rx * 1.1, cy - ry * 1.5, 3 * k, 1); line(cx + rx * .7, cy - 2, cx + rx * 1.1, cy - ry * 1.5, 3 * k, 1);
      const cr = (F.has('sepitbesar') ? 9 : 6.5) * k;
      ell(cx - rx * 1.15, cy - ry * 1.9, cr, cr * .85, 2); ell(cx + rx * 1.15, cy - ry * 1.9, cr, cr * .85, 2);
      tri(cx - rx * 1.15, cy - ry * 1.9, cx - rx * 1.15 - cr * 1.2, cy - ry * 1.9 - cr * .7, cx - rx * 1.15 - cr * .3, cy - ry * 1.9 - cr * 1.2, 0);
      tri(cx + rx * 1.15, cy - ry * 1.9, cx + rx * 1.15 + cr * 1.2, cy - ry * 1.9 - cr * .7, cx + rx * 1.15 + cr * .3, cy - ry * 1.9 - cr * 1.2, 0);
      ell(cx, cy, rx, ry, 1); ell(cx, cy + ry * .4, rx * .7, ry * .4, 3);
      if (F.has('tempurung')) { ell(cx, cy - ry * .2, rx * .9, ry * .8, 2); line(cx - rx * .8, cy - ry * .1, cx + rx * .8, cy - ry * .1, 1, 10); }
      if (F.has('ekortajam')) line(cx + rx * .9, cy, cx + rx * 1.8, cy + ry * .6, 1.6, 12);
      line(cx - 4, cy - ry * .8, cx - 5, cy - ry * 1.8, 1.2, 12); line(cx + 4, cy - ry * .8, cx + 5, cy - ry * 1.8, 1.2, 12);
      eye(cx - 5, cy - ry * 1.9, 2 * k, 0); eye(cx + 5, cy - ry * 1.9, 2 * k, 0);
    },
    raksasa() { // makhluk mitos besar (Kelembai / Garuda)
      plans.tegak();
    }
  };
  (plans[sp.b] || plans.blob)();
  // palet
  const [m, s2, l, ex] = sp.c;
  const colors = {
    1: m, 2: s2, 3: l, 4: '#fbfbfb', 5: '#181820', 6: ex || s2, 10: shade(s2, -.3), 12: shade(m, -.28), 13: '#efe6cc',
    14: '#f8e050', 15: '#f09838', 16: '#e03838'
  };
  const outline = shade(m, -.7);
  const [c, g] = mkCanvas(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = buf[y * N + x];
    if (v) {
      let col = colors[v] || m;
      if (v !== 4 && v !== 5) {
        if (!get(x + 1, y + 1) || !get(x, y + 2)) col = shade(col, -.2);
        else if (!get(x - 1, y - 1) || !get(x, y - 2)) col = shade(col, .22);
      }
      g.fillStyle = col; g.fillRect(x, y, 1, 1);
    } else if (get(x - 1, y) || get(x + 1, y) || get(x, y - 1) || get(x, y + 1)) {
      g.fillStyle = outline; g.fillRect(x, y, 1, 1);
    }
  }
  let out = c;
  if (back) { const [c2, g2] = mkCanvas(N, N); g2.translate(N, 0); g2.scale(-1, 1); g2.drawImage(c, 0, 0); out = c2; }
  _mcache[key] = out;
  return out;
}
function silhouette(name) {
  const src = monstaSprite(name);
  const [c, g] = mkCanvas(64, 64);
  g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#383040'; g.fillRect(0, 0, 64, 64);
  return c;
}
