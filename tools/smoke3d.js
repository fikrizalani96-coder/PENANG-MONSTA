// Ujian asap 3D: bina semua model Monsta & watak, muat setiap peta, mula satu pertarungan. node tools/smoke3d.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 480, height: 270 } });
  await page.addInitScript(() => { try { localStorage.setItem('msp_grafik', 'rendah'); localStorage.setItem('msp_grafik_pilih', '1'); } catch (e) { } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  page.on('console', m => { if (m.type() === 'error' && !/ERR_|fonts/.test(m.text())) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const out = { ok: R3.ok, mons: 0, humans: 0, maps: 0, bad: [] };
    for (const row of MONSTA_RAW) { try { const m = R3.voxel(row[1], 1); m.userData.update(1); m.userData.tint('white'); m.userData.tint(null); out.mons++; } catch (e) { out.bad.push(row[1] + ': ' + e.message); } }
    for (const k of Object.keys(LOOKS)) { try { R3.poseHuman(R3.human(k), 'left', true, .1); out.humans++; } catch (e) { out.bad.push(k + ': ' + e.message); } }
    S = newState(); S.party.push(makeMon('Percik', 12));
    Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0;
    for (const id in MAPS) { if (MAPS[id].template) continue; try { const m = MAPS[id]; const p = findTile(m, 'E') || m.marks[0] || { x: 1, y: 1 }; World.load(id, p.x, p.y, 'down'); R3.drawWorld(); out.maps++; } catch (e) { out.bad.push(id + ': ' + e.message); } }
    return out;
  });
  await page.evaluate(() => { World.load('laluan1', 9, 8, 'down'); World.run(() => wildBattle('Tedung', 10)); });
  await page.waitForTimeout(8000);
  const b = await page.evaluate(() => { const bs = Game.scenes.find(s => s instanceof BattleScene); return bs ? 'battle ok' : 'no battle'; });
  console.log(JSON.stringify(r), b);
  console.log(errors.slice(0, 20).join('\n') || 'tiada ralat');
  await browser.close();
})();
