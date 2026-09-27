// Tangkapan 3D pantas: node tools/shot3d.js [peta] [x] [y] [w] [h]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [map = 'penaga', x = 10, y = 8, w = 1280, h = 720] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT') && !m.text().includes('fonts')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1500);
  const info = await page.evaluate(([map, x, y]) => {
    S = newState(); S.party.push(makeMon('Nagabara', 30));
    Game.scenes = [World.scene]; Game.fade = 0; Game.fadeTarget = 0;
    World.load(map, +x, +y, 'down');
    return { ok: R3.ok, SW, SH };
  }, [map, x, y]);
  await page.waitForTimeout(1500);
  require('fs').mkdirSync(path.join(__dirname, '..', 'shots'), { recursive: true });
  await page.screenshot({ path: path.join(__dirname, '..', 'shots', `3d_${map}_${w}x${h}.png`) });
  console.log(JSON.stringify(info));
  console.log(errors.slice(0, 10).join('\n') || 'tiada ralat');
  await browser.close();
})();
