// Ujian asap Playwright: node tools/smoke.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT')) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + '\n' + e.stack));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?2d');
  await page.waitForTimeout(2000);
  const out = path.join(__dirname, '..', 'shots');
  require('fs').mkdirSync(out, { recursive: true });
  let n = 0;
  const shot = async name => page.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}_${name}.png`, clip: { x: 0, y: 0, width: 740, height: 500 } });
  const press = async (k, times = 1, d = 150) => { for (let i = 0; i < times; i++) { await page.keyboard.down(k); await page.waitForTimeout(50); await page.keyboard.up(k); await page.waitForTimeout(d); } };
  const hold = async (k, ms) => { await page.keyboard.down(k); await page.waitForTimeout(ms); await page.keyboard.up(k); await page.waitForTimeout(100); };
  const st = () => page.evaluate(() => ({ map: World.map && World.map.id, x: World.p.x, y: World.p.y, busy: World.busy, scenes: Game.scenes.map(s => s.constructor.name) }));
  const mash = async (times, d = 200) => { for (let i = 0; i < times; i++) await press('KeyZ', 1, d); };
  // hingga tidak sibuk
  const until = async (fn, max = 80) => { for (let i = 0; i < max; i++) { if (await page.evaluate(fn)) return true; await press('KeyZ', 1, 200); } return false; };
  await shot('title');
  await press('KeyZ'); await page.waitForTimeout(600);
  await until(() => World.map && Game.top() === World.scene && !World.busy);
  await shot('house'); console.log('1', JSON.stringify(await st()));
  await page.waitForFunction(() => Game.scenes.length === 1 && Game.top() === World.scene, null, { timeout: 15000 }); // tunggu sepanduk BAB 1
  for (let i = 0; i < 6 && await page.evaluate(() => World.map.id !== 'penaga'); i++) { await hold('ArrowDown', 1200); await hold('ArrowRight', 300); await hold('ArrowDown', 900); await hold('ArrowLeft', 300); }
  await shot('house2'); console.log('2', JSON.stringify(await st()));
  await until(() => World.map && World.map.id === 'penaga' && Game.top() === World.scene, 5);
  console.log('3', JSON.stringify(await st()));
  await shot('penaga');
  // walk to exit: go down
  await page.evaluate(() => { World.p.x = 10; World.p.y = 14; World.p.px = 160; World.p.py = 224; });
  await hold('ArrowDown', 900);
  await shot('prof');
  console.log('4', JSON.stringify(await st()));
  await until(() => World.map.id === 'makmal' && Game.top() === World.scene && !World.busy, 40);
  await shot('makmal'); console.log('5', JSON.stringify(await st()));
  // pick ball: move to (6,4) facing up
  await hold('ArrowRight', 250); await page.waitForTimeout(300);
  console.log('6', JSON.stringify(await st()));
  await hold('ArrowUp', 120);
  await press('KeyZ'); await page.waitForTimeout(700); await shot('choose');
  await until(() => Game.top() === World.scene && !World.busy, 30);
  console.log('7', JSON.stringify(await st()), await page.evaluate(() => S.party.map(m => m.sp + m.lv)));
  await hold('ArrowDown', 1500);
  await page.waitForTimeout(500); await shot('rival');
  for (let i = 0; i < 60; i++) {
    const t = await page.evaluate(() => Game.scenes.map(s => s.constructor.name).join(','));
    if (t.includes('ActionMenu')) { await press('KeyZ', 1, 300); await press('KeyZ', 1, 300); }
    else await press('KeyZ', 1, 250);
    if (i === 6) await shot('battle');
    if (await page.evaluate(() => Game.top() === World.scene && !World.busy)) break;
  }
  await shot('afterbattle');
  console.log('8', JSON.stringify(await st()), await page.evaluate(() => S.party.map(m => m.sp + ' Tp' + m.lv + ' ' + m.hp + '/' + maxHp(m) + ' exp' + m.exp)));
  console.log(errors.slice(0, 30).join('\n'));
  await browser.close();
})();
