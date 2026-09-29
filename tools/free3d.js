// Ujian pergerakan bebas + kamera orbit dalam 3D sebenar (GPU perisian, kualiti rendah): node tools/free3d.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
  await page.addInitScript(() => { try { localStorage.setItem('msp_grafik', 'rendah'); localStorage.setItem('msp_grafik_pilih', '1'); } catch (e) { } });
  const errors = [];
  page.on('console', m => { const t = m.text(); if ((m.type() === 'error' || m.type() === 'warning') && !/ERR_CERT|ERR_NAME|fonts|Failed to load resource/.test(t)) errors.push(t.slice(0, 300)); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?dyn=0');
  await page.waitForTimeout(1500);
  let fails = 0;
  const ok = (c, label) => { console.log((c ? 'LULUS ' : 'GAGAL ') + label); if (!c) fails++; };
  await page.evaluate(() => {
    window.DBG = { win: true, ff: 6 };
    S = newState(); S.flags = { starter: 1, dex: 1, rival1: 1, rival2: 1, lab_intro: 1 }; S.party = [makeMon('Percik', 20)]; S.name = 'UJI'; S.repel = 999999; S.chapters = {}; for (const c of CHAPTERS) S.chapters[c[0]] = 1;
    Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0;
    window.T = {
      hold(keys, ms) { return new Promise(r => { for (const k of keys) Input.press(k); setTimeout(() => { for (const k of keys) Input.release(k); r(); }, ms); }); },
      pos: () => ({ x: +World.p.wx.toFixed(2), z: +World.p.wz.toFixed(2), y: +R3.hAt(World.p.wx, World.p.wz).toFixed(2), map: World.map.id, busy: World.busy, yaw: +R3.camYaw.toFixed(2), sp: +World.p.speed.toFixed(2) }),
    };
  });
  const hold = (keys, ms) => page.evaluate(([k, m]) => T.hold(k, m), [keys, ms]);
  const pos = () => page.evaluate(() => T.pos());
  const load = (id, x, y) => page.evaluate(([id, x, y]) => { World.load(id, x, y, 'down'); }, [id, x, y]);
  ok(await page.evaluate(() => R3.ok && R3.quality === 'rendah'), '3D aktif (kualiti rendah)');
  await load('laluan1', 9, 10); await page.waitForTimeout(600);
  let a = await pos(); await hold(['up'], 1200); let b = await pos();
  ok(b.z < a.z - .8, `jalan ke atas skrin: z ${a.z} → ${b.z}`);
  // kamera berputar dengan Q: yaw berubah dan arah "atas" mengikut kamera
  await hold(['camL'], 1500); await page.waitForTimeout(500); let c = await pos();
  ok(await page.evaluate(() => Math.abs(R3.yawT) > .1), `kamera berputar (Q): yaw ${c.yaw}`);
  await load('laluan1', 9, 10); await page.waitForTimeout(300); a = await pos();
  await page.evaluate(() => { R3.yawT = Math.PI / 2; R3.camYaw = Math.PI / 2; });
  await hold(['up'], 700); b = await pos();
  ok(Math.abs(b.x - a.x) > .8 && Math.abs(b.z - a.z) < .8, `dengan yaw 90°, "atas" bergerak sepanjang paksi x: dx=${(b.x - a.x).toFixed(2)} dz=${(b.z - a.z).toFixed(2)}`);
  // seret tetikus memutar kamera
  await page.evaluate(() => { R3.yawT = 0; R3.camYaw = 0; Input.drag.x = -80; });
  await page.waitForTimeout(700);
  ok(await page.evaluate(() => Math.abs(R3.yawT) > .2), 'seret memutar kamera');
  await page.evaluate(() => { Input.wheel = 400; }); await page.waitForTimeout(500);
  ok(await page.evaluate(() => R3.userZoom > 1.1), 'roda tetikus zum kamera');
  await hold(['camReset'], 120); await page.waitForTimeout(500);
  ok(await page.evaluate(() => R3.userZoom === 1 && R3.yawT === 0), 'C menetapkan semula kamera');
  // dalam bangunan kamera dikunci
  await load('rumah_pemain', 4, 5); await page.waitForTimeout(600);
  await hold(['camL'], 500);
  ok(await page.evaluate(() => R3.yawT === 0), 'yaw dikunci di dalam bangunan');
  // ketinggian rupa bumi: pemain tidak tenggelam, ada tanah sebenar
  await load('penaga', 10, 12); await page.waitForTimeout(600);
  const hs = await page.evaluate(() => { let mn = 9, mx = -9; for (let x = 2; x < World.W - 2; x += 1.3) for (let z = 2; z < World.H - 2; z += 1.3) { const t = World.tile(Math.floor(x), Math.floor(z)); if (t === '.') { const h = R3.hAt(x, z); mn = Math.min(mn, h); mx = Math.max(mx, h); } } return [mn, mx]; });
  ok(hs[1] - hs[0] > .05 && hs[0] > -.5 && hs[1] < 1, `rupa bumi berbukit lembut: ${hs[0].toFixed(2)}..${hs[1].toFixed(2)}`);
  // rendering kekal sihat semasa berjalan: draw call dan segi tiga munasabah
  await hold(['right'], 800); await page.waitForTimeout(600);
  const inf = await page.evaluate(() => ({ calls: R3.r.info.render.calls, tris: R3.r.info.render.triangles, scale: R3.scale }));
  ok(inf.calls < 260 && inf.tris < 220000, `beban lukisan (rendah): ${inf.calls} panggilan, ${Math.round(inf.tris / 1000)}k segi tiga`);
  ok(await page.evaluate(() => World.p.wx > 0 && !isNaN(World.p.wx) && !isNaN(R3.camYaw)), 'kedudukan sah');
  console.log(errors.length ? 'RALAT:\n' + errors.slice(0, 10).join('\n') : 'RALAT: tiada');
  await browser.close();
  process.exit(fails || errors.length ? 1 : 0);
})();
