// Ujian berjalan sebenar merentasi semua peta luar: node tools/walk.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    window.DBG = { win: true };
    setInterval(() => {
      const t = Game.top(); if (!t) return;
      const n = t.constructor.name;
      if (n === 'Dialog' || n === 'Choice' || n === 'TitleScene' || n === 'QtyScene') Input.pressed.a = true;
      else if (n === 'ActionMenu') { t.i = 0; Input.pressed.a = true; }
      else if (n === 'MoveMenu') { t.i = Math.max(0, t.bs.me.mon.moves.findIndex(m => m.pp > 0)); Input.pressed.a = true; }
      else if (n === 'PartyScene') { if (!t.busy) { t.i = Math.max(0, S.party.findIndex((m, k) => alive(m) && k !== t.o.cur)); Input.pressed.a = true; } }
      else if (n === 'ListScene') Input.pressed.b = true;
    }, 20);
    // BFS dalam peta semasa
    window.TT = {
      idle: () => Game.top() === World.scene && !World.busy && !World.p.moving && Game.fade === 0,
      bfs(goal, allowWater) {
        const W = World.W, H = World.H, p = World.p;
        const key = (x, y) => y * W + x;
        const prev = new Map(); prev.set(key(p.x, p.y), null);
        const q = [[p.x, p.y]];
        const ok = (x, y) => {
          const t = World.tile(x, y); if (t === null) return false;
          if (World.objAt(x, y, true)) return false;
          if (/\d/.test(t) || t === 'E') return false;
          if (World.objs.some(o => o.def.trig && o.x === x && o.y === y && (!o.def.if || o.def.if()))) return false;
          return isWalkTile(t) || (allowWater && isWater(t));
        };
        while (q.length) {
          const [x, y] = q.shift();
          if (goal(x, y)) { const path = []; let k = key(x, y); while (prev.get(k)) { const [px, py, d] = prev.get(k); path.unshift(d); k = key(px, py); } return path; }
          for (const d of ['up', 'down', 'left', 'right']) {
            const [dx, dy] = DIRS[d]; let nx = x + dx, ny = y + dy;
            const t = World.tile(nx, ny);
            if (t === 'L') { if (d !== 'down') continue; ny++; if (!ok(nx, ny)) continue; }
            else if (!ok(nx, ny)) continue;
            const k = key(nx, ny); if (prev.has(k)) continue;
            prev.set(k, [x, y, d]); q.push([nx, ny]);
          }
        }
        return null;
      },
      edge(dir) {
        const W = World.W, H = World.H;
        return (x, y) => (dir === 'up' && y === 0) || (dir === 'down' && y === H - 1) || (dir === 'left' && x === 0) || (dir === 'right' && x === W - 1);
      },
      // satu langkah ke arah tepi peta tertentu; kembali status
      stepToward(dir) {
        if (!TT.idle()) return 'busy';
        const conn = { up: 'n', down: 's', left: 'w', right: 'e' }[dir];
        const goal = TT.edge(dir);
        const p = World.p;
        if (goal(p.x, p.y)) { p.dir = dir; World.tryMove(dir); return 'exit'; }
        let path = TT.bfs(goal, S.surf);
        let water = false;
        if (!path) { path = TT.bfs(goal, true); water = true; }
        if (!path || !path.length) return 'nopath';
        const d = path[0];
        const [dx, dy] = DIRS[d];
        const t = World.tile(p.x + dx, p.y + dy);
        if (isWater(t) && !S.surf) { p.dir = d; World.run(() => World.interact()); return 'surf'; }
        p.dir = d; World.tryMove(d);
        return 'step';
      }
    };
    S = newState(); S.name = 'UJI'; S.flags = { starter: 1, dex: 1, rival1: 1, rival2: 1, rival3: 1, rival4: 1, rival5: 1, rival6: 1, rival7: 1, lanun_kb: 1, pengawal: 1, beruang1: 1, markas_selesai: 1, menara_selesai: 1, tokwan: 1 };
    S.badges = [0, 1, 2, 3, 4, 5, 6, 7];
    const m = makeMon('Nagabara', 60); m.moves = [{ id: 'lidahapi', pp: 15 }, { id: 'terbang', pp: 15 }, { id: 'tebas', pp: 30 }, { id: 'cakarnaga', pp: 15 }];
    const m2 = makeMon('Meriampenyu', 60); m2.moves = [{ id: 'ombak', pp: 15 }, { id: 'gigit', pp: 25 }];
    S.party = [m, m2]; S.repel = 99999;
    Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0;
    World.load('penaga', 10, 12, 'down');
  });
  const route = [
    ['penaga', 'down'], ['laluan1', 'down'], ['guarperahu', 'left'], ['laluan2', 'down'], ['hutanbakau', 'down'], ['telukayertawar', 'right'],
    ['laluan3', 'right'], ['guarkepah', 'right'], ['kepalabatas', 'up'], ['laluan4', 'down'], ['kepalabatas', 'down'], ['laluan5', 'down'],
    ['bertam', 'right'], ['laluan6', 'right'], ['tasekgelugor', 'down'], ['laluan8', 'down'], ['permatangpauh', 'down'], ['laluan9', 'down'],
    ['seberangjaya', 'left'], ['laluan11', 'left'], ['perai', 'up'], ['laluan10', 'up'], ['butterworth', 'up'], ['laluan7', 'up'], ['bertam', 'up'],
    ['laluan5', 'up'], ['kepalabatas', 'left'], ['guarkepah', 'left'], ['laluan3', 'left'], ['telukayertawar', 'up'], ['hutanbakau', 'up'],
    ['laluan2', 'right'], ['guarperahu', 'up'], ['laluan1', 'up'], ['penaga', null],
  ];
  const route2 = [
    ['permatangpauh', 'right'], ['laluan12', 'down'], ['bukittambun', 'down'], ['laluan13', 'down'], ['nibongtebal', 'right'], ['bukitpanchor', 'left'],
    ['nibongtebal', 'left'], ['sungaijawi', 'left'], ['batukawan', 'right'], ['sungaijawi', 'right'], ['nibongtebal', 'up'], ['laluan13', 'up'], ['bukittambun', 'up'],
    ['laluan12', 'left'], ['permatangpauh', null],
  ];
  const route3 = [
    ['seberangjaya', 'right'], ['laluan15', 'right'], ['bukitmertajam', 'right'], ['empangan', 'left'], ['bukitmertajam', 'up'], ['laluankemenangan', 'up'], ['puncak', 'down'],
    ['laluankemenangan', 'down'], ['bukitmertajam', 'left'], ['laluan15', 'left'], ['seberangjaya', null],
  ];
  let fails = 0;
  const run = async (rt, start) => {
    if (start) await page.evaluate(([id, x, y]) => { S.surf = false; World.load(id, x, y, 'down'); }, start);
    for (let i = 0; i < rt.length; i++) {
      const [id, dir] = rt[i];
      const cur = await page.evaluate(() => World.map.id);
      if (cur !== id) { console.log(`GAGAL: dijangka di ${id}, sebenarnya di ${cur}`); fails++; return; }
      if (!dir) { console.log('SAMPAI', id); return; }
      let steps = 0, last = '';
      while (true) {
        const r = await page.evaluate(d => TT.stepToward(d), dir);
        await page.waitForTimeout(r === 'busy' ? 60 : 10);
        if (r === 'nopath') { const p = await page.evaluate(() => [World.p.x, World.p.y, S.surf]); console.log(`GAGAL: tiada laluan di ${id} ke ${dir} dari ${p}`); fails++; return; }
        const now = await page.evaluate(() => World.map.id);
        if (now !== id) { console.log(`  ${id} -> ${now} (${steps} langkah)`); break; }
        if (++steps > 1500) { console.log('GAGAL: terlalu banyak langkah di', id); fails++; return; }
      }
    }
  };
  await run(route);
  await run(route2, ['permatangpauh', 10, 10]);
  await run(route3, ['seberangjaya', 10, 15]);
  console.log(fails ? `${fails} kegagalan` : 'SEMUA LALUAN OK');
  console.log(errors.slice(0, 20).join('\n') || 'tiada ralat');
  await browser.close();
})();
