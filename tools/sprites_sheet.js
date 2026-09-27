// Lembaran semua sprite Monsta: node tools/sprites_sheet.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1000);
  const out = path.join(__dirname, '..', 'shots');
  for (let part = 0; part < 2; part++) {
    const data = await page.evaluate(part => {
      const names = DEX.slice(1).slice(part * 64, part * 64 + 64);
      const c = document.createElement('canvas'); c.width = 8 * 140; c.height = 8 * 150;
      const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
      g.fillStyle = '#e8ecf0'; g.fillRect(0, 0, c.width, c.height);
      names.forEach((n, i) => {
        const x = (i % 8) * 140, y = Math.floor(i / 8) * 150;
        g.drawImage(monstaSprite(n), x + 6, y, 128, 128);
        g.fillStyle = '#222'; g.font = '14px monospace'; g.fillText(SP[n].no + ' ' + n, x + 4, y + 142);
      });
      return c.toDataURL();
    }, part);
    require('fs').writeFileSync(`${out}/sprites_${part}.png`, Buffer.from(data.split(',')[1], 'base64'));
  }
  await browser.close();
})();
