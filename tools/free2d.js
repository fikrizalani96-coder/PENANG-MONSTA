// Ujian pergerakan bebas (mod 2D, tanpa GPU): node tools/free2d.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?2d');
  await page.waitForTimeout(1200);
  let fails = 0;
  const ok = (c, label) => { console.log((c ? 'LULUS ' : 'GAGAL ') + label); if (!c) fails++; };
  const dbg = async l => console.log('   ..', l, JSON.stringify(await page.evaluate(() => ({ p: T.pos(), gt: +Game.t.toFixed(2), v: [+World.p.vx.toFixed(2), +World.p.vz.toFixed(2)], ax: [Input.axis.x, Input.axis.y], top: Game.top() && Game.top().constructor.name }))));
  await page.evaluate(() => {
    window.DBG = { win: true };
    S = newState(); S.flags = { starter: 1, dex: 1, rival1: 1, rival2: 1, lab_intro: 1 }; S.party = [makeMon('Percik', 20)]; S.name = 'UJI'; S.repel = 999999; S.chapters = {}; for (const c of CHAPTERS) S.chapters[c[0]] = 1;
    Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0;
    window.T = {
      hold(keys, ms) { return new Promise(r => { for (const k of keys) Input.press(k); setTimeout(() => { for (const k of keys) Input.release(k); r(); }, ms); }); },
      pos: () => ({ x: +World.p.wx.toFixed(2), z: +World.p.wz.toFixed(2), tx: World.p.x, ty: World.p.y, map: World.map.id, dir: World.p.dir, busy: World.busy }),
    };
  });
  const hold = (keys, ms) => page.evaluate(([k, m]) => T.hold(k, m), [keys, ms]);
  const pos = () => page.evaluate(() => T.pos());
  const load = (id, x, y, d) => page.evaluate(([id, x, y, d]) => { World.load(id, x, y, d || 'down'); }, [id, x, y, d]);

  // 1. bergerak bebas dan halaju
  await load('laluan1', 9, 10);
  let a = await pos();
  await hold(['right'], 500);
  let b = await pos();
  ok(b.x - a.x > 1.2 && b.x - a.x < 3.2, `jalan ke kanan 0.5s: ${(b.x - a.x).toFixed(2)} jubin`);
  await hold(['up', 'right'], 400);
  let c = await pos();
  ok(c.z < b.z - .8 && c.x > b.x + .8, 'pergerakan serong');
  // 2. larian lebih laju
  await load('laluan1', 9, 10);
  a = await pos(); await hold(['down'], 400); b = await pos(); const walkD = b.z - a.z;
  await load('laluan1', 9, 10);
  a = await pos(); await hold(['down', 'b'], 400); b = await pos(); const runD = b.z - a.z;
  ok(runD > walkD * 1.3, `lari lebih laju (${runD.toFixed(2)} vs ${walkD.toFixed(2)})`);
  // 3. dinding pepejal: pokok di tepi kiri laluan1 (x=0..1)
  await load('laluan1', 5, 10);
  await hold(['left'], 1800);
  b = await pos();
  ok(b.x >= 2.15 && b.x <= 3.2, `tidak menembusi pokok sempadan: x=${b.x}`);
  // 4. slide di sepanjang dinding: tekan serong ke dinding mesti menggelongsor
  await dbg('sebelum slide'); a = await pos(); await hold(['left', 'down'], 600); b = await pos();
  await dbg('selepas slide'); ok(b.z > a.z + .8 && b.x >= 2.15, 'menggelongsor di sepanjang dinding');
  // 5. bangunan pepejal: rumah di penaga
  await load('penaga', 10, 6);
  await hold(['down'], 1500);
  b = await pos();
  ok(b.z < 8.3 && b.map === 'penaga', `bangunan menghalang: z=${b.z}`);
  // 6. pintu: masuk rumah pemain
  await load('penaga', 9, 6);   // 1 = pintu rumah pemain di (9,4)? cari
  const door = await page.evaluate(() => { const m = MAPS.penaga; for (let y = 0; y < m.H; y++) for (let x = 0; x < m.W; x++) if (m.base[y][x] === '1') return { x, y }; });
  await load('penaga', door.x, door.y + 2, 'up');
  await hold(['up'], 900);
  await page.waitForTimeout(700);
  b = await pos();
  ok(b.map === 'rumah_pemain', `masuk pintu -> ${b.map}`);
  // 7. keluar dengan tikar E
  await page.evaluate(() => { const e = findTile(MAPS.rumah_pemain, 'E'); World.load('rumah_pemain', e.x, e.y - 1, 'down'); });
  await page.waitForTimeout(200);
  await hold(['down'], 700);
  await page.waitForTimeout(900);
  b = await pos();
  ok(b.map === 'penaga', `keluar melalui tikar -> ${b.map}`);
  // 8. sempadan peta: laluan1 ke penaga (utara)
  await load('laluan1', 9, 2, 'up');
  await hold(['up'], 1500);
  await page.waitForTimeout(900);
  b = await pos();
  ok(b.map === 'penaga', `sempadan utara -> ${b.map} (${b.x},${b.z})`);
  await hold(['down'], 1800);
  await page.waitForTimeout(900);
  b = await pos();
  ok(b.map === 'laluan1' || b.map === 'guarperahu', `kembali/ke selatan -> ${b.map}`);
  // 9. NPC menghalang
  await page.evaluate(() => { S.flags.starter = 1; World.load('makmal', 5, 7, 'up'); });
  await page.waitForTimeout(200);
  const prof = await page.evaluate(() => { const o = obj('A'); return { x: o.x, y: o.y }; });
  await hold(['up'], 1600);
  b = await pos();
  ok(b.z > prof.y + .5 + .55, `NPC pepejal: z=${b.z} prof.y=${prof.y}`);
  // 10. interaksi A: bercakap dengan Prof
  await page.evaluate(() => { window.AUTO = true; setInterval(() => { const t = Game.top(); if (t && t.constructor.name === 'Dialog') Input.pressed.a = true; }, 30); });
  const before = await page.evaluate(() => AutoLog = 0);
  await page.evaluate(() => { window._said = 0; const o = UI.say.bind(UI); UI.say = (t, opt) => { window._said++; return o(t, opt); }; });
  await page.evaluate(() => Input.press('a')); await page.waitForTimeout(80); await page.evaluate(() => Input.release('a'));
  await page.waitForTimeout(1500);
  const said = await page.evaluate(() => window._said);
  ok(said > 0, 'A berinteraksi dengan NPC di hadapan (dialog: ' + said + ')');
  // 11. tebing: melompat ke bawah
  await page.evaluate(() => { const m = MAPS.laluan1; World.load('laluan1', 4, 5, 'down'); });
  await page.waitForTimeout(150);
  a = await pos();
  await hold(['down'], 900);
  await page.waitForTimeout(600);
  b = await pos();
  ok(b.z > a.z + 2, `lompat tebing ke bawah: z ${a.z} -> ${b.z}`);
  await load('laluan1', 4, 8, 'up');
  a = await pos(); await hold(['up'], 900); b = await pos();
  ok(b.z > 7.2, `tebing menghalang dari selatan: z=${b.z}`);
  console.log(fails ? fails + ' kegagalan' : 'SEMUA LULUS');
  console.log(errors.slice(0, 10).join('\n') || 'tiada ralat');
  await browser.close();
})();
