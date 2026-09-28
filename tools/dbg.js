// Nyahpepijat: node tools/dbg.js "<kod JS>" [nama.png] [w] [h] [tunggu-ms]
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [code, shotName, w = 1280, h = 720, waitMs = 1500] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage({ viewport: { width: +w, height: +h } });
  if (process.env.G3) await page.addInitScript(q => { try { localStorage.setItem('msp_grafik', q); localStorage.setItem('msp_grafik_pilih', '1'); } catch (e) { } }, process.env.G3);
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning' || m.type() === 'log') errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n').slice(0, 3).join(' | ')));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + (process.env.Q || ''));
  await page.waitForTimeout(1500);
  const r = await page.evaluate(code => { try { return JSON.stringify(eval(code)); } catch (e) { return 'ERR ' + e.message + e.stack; } }, code);
  await page.waitForTimeout(+waitMs);
  if (shotName) { require('fs').mkdirSync(path.join(__dirname, '..', 'shots'), { recursive: true }); await page.screenshot({ path: path.join(__dirname, '..', 'shots', shotName) }); }
  console.log(r);
  console.log(errors.slice(0, 80).join('\n'));
  await browser.close();
})();
