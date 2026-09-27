// Tangkap skrin setiap peta: node tools/maps_shot.js [id...]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1500);
  const out = path.join(__dirname, '..', 'shots', 'maps');
  require('fs').mkdirSync(out, { recursive: true });
  const ids = process.argv.slice(2).length ? process.argv.slice(2) : await page.evaluate(() => Object.keys(MAPS));
  await page.evaluate(() => { S = newState(); S.party.push(makeMon('Percik', 20)); Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0; });
  for (const id of ids) {
    const r = await page.evaluate(id => {
      const m = MAPS[id];
      let p = m.fly ? { x: m.fly[0], y: m.fly[1] } : findTile(m, 'E') || findTile(m, '1');
      if (!p) { for (let y = 0; y < m.H && !p; y++) for (let x = 0; x < m.W; x++) if (WALK.has(m.base[y][x])) { p = { x, y }; break; } }
      World.load(id, p.x, p.y, 'down', m.template ? { o: {} } : null);
      return { W: m.W, H: m.H, p };
    }, id);
    await page.waitForTimeout(120);
    await page.screenshot({ path: `${out}/${id}.png`, clip: { x: 0, y: 0, width: 740, height: 500 } });
  }
  // peta penuh sebagai imej (canvas peta)
  const full = path.join(__dirname, '..', 'shots', 'full');
  require('fs').mkdirSync(full, { recursive: true });
  for (const id of ids) {
    const data = await page.evaluate(id => { const m = MAPS[id]; World.load(id, 0, 0, 'down', m.template ? { o: {} } : null); return World.canvas.toDataURL(); }, id);
    require('fs').writeFileSync(`${full}/${id}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  console.log(errors.slice(0, 40).join('\n') || 'tiada ralat');
  await browser.close();
})();
