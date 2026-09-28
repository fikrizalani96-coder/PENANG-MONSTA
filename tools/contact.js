// Helaian kenalan tangkapan skrin: node tools/contact.js <folder> <keluar.png> [lajur] [lebar]
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const [dir, out, cols = 4, width = 1600] = process.argv.slice(2);
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.png')).sort();
  const html = `<html><body style="margin:0;background:#222;font:12px sans-serif;color:#ddd;display:grid;grid-template-columns:repeat(${cols},1fr);gap:4px">` +
    files.map(f => `<figure style="margin:0"><img style="width:100%;display:block" src="file://${path.resolve(dir, f)}"><figcaption>${f}</figcaption></figure>`).join('') + '</body></html>';
  const tmp = path.join(require('os').tmpdir(), 'contact.html'); fs.writeFileSync(tmp, html);
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: +width, height: 800 } });
  await p.goto('file://' + tmp); await p.waitForTimeout(800);
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();
