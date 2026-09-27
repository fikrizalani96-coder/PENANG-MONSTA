// Tangkap skrin UI: node tools/ui_shots.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const mobile = process.argv.includes('--mobile');
  const page = await browser.newPage(mobile ? { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } : { viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_CERT')) errors.push(m.text()); });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html'));
  await page.waitForTimeout(1500);
  const out = path.join(__dirname, '..', 'shots', mobile ? 'mobile' : 'ui');
  require('fs').mkdirSync(out, { recursive: true });
  const shot = async name => mobile ? page.screenshot({ path: `${out}/${name}.png` }) : page.screenshot({ path: `${out}/${name}.png`, clip: { x: 0, y: 0, width: 740, height: 500 } });
  const key = async (k, d = 180) => { await page.keyboard.down(k); await page.waitForTimeout(40); await page.keyboard.up(k); await page.waitForTimeout(d); };
  await shot('00_title');
  await page.evaluate(() => {
    S = newState(); S.flags.dex = 1; S.flags.starter = 1; S.name = 'AISYAH'; S.look = 'pemain2';
    S.party = [makeMon('Nagabara', 38), makeMon('Tupaipetir', 30), makeMon('Kerbausakti', 40), makeMon('Kancil', 22), makeMon('Toyol', 20), makeMon('Belangkas', 33)];
    S.party[1].status = 'lumpuh'; S.party[3].hp = 5;
    S.badges = [0, 1, 2, 3]; S.money = 12345;
    ['Ubat', 'Ubat Super', 'Bola Tangkap', 'Bola Hebat', 'Air Tebu', 'Batu Api', 'Basikal', 'Seruling', 'CR01 Tebas'].forEach(n => giveItem(n, 3));
    for (const n of Object.keys(SP).slice(0, 60)) { S.dex.seen[n] = 1; if (Math.random() < .6) S.dex.caught[n] = 1; }
    Game.scenes = []; World.load('kepalabatas', 12, 13, 'down'); Game.scenes.push(World.scene); Game.fade = 0; Game.fadeTarget = 0;
  });
  await page.waitForTimeout(300);
  await shot('01_overworld');
  await key('Enter'); await shot('02_startmenu'); await key('KeyX'); await page.waitForTimeout(200);
  const open = async (fn, name, extra) => { await page.evaluate(fn); await page.waitForTimeout(300); if (extra) await extra(); await shot(name); for (let i = 0; i < 4; i++) { if (await page.evaluate(() => Game.top() === World.scene && !World.busy)) break; await key('KeyX', 150); } };
  await open(() => { World.run(() => Menus.party({ mode: 'field' })); }, '03_party');
  await open(() => { World.run(() => Menus.summary(2)); }, '05_summary');
  await open(() => { World.run(() => Menus.bag({})); }, '06_bag');
  await open(() => { World.run(() => Menus.dex()); }, '07_dex');
  await open(() => { World.run(() => Menus.dex()); }, '08_dex_detail', async () => { await key('KeyZ'); });
  await open(() => { World.run(() => Menus.card()); }, '09_card');
  // pertarungan liar sebenar
  await page.evaluate(() => { World.run(() => wildBattle('Tedung', 30)); });
  await page.waitForTimeout(2500);
  await shot('10_battle_intro');
  for (let i = 0; i < 4; i++) await key('KeyZ', 400);
  await shot('11_battle_menu');
  await key('KeyZ'); await shot('12_battle_moves');
  await key('KeyZ', 1500); await shot('13_battle_attack');
  for (let i = 0; i < 30; i++) {
    const top = await page.evaluate(() => Game.top().constructor.name);
    if (top === 'ActionMenu') break;
    await key('KeyZ', 300);
  }
  // cuba tangkap
  await key('ArrowRight'); await key('KeyZ'); await page.waitForTimeout(300); await shot('14_battle_bag');
  await key('KeyX');
  await key('ArrowDown'); await key('KeyZ'); await page.waitForTimeout(300); await shot('15_battle_party');
  await key('KeyX'); await page.waitForTimeout(300);
  await page.evaluate(() => { window.DBG = { win: true }; });
  for (let i = 0; i < 40; i++) {
    const top = await page.evaluate(() => Game.top() === World.scene && !World.busy);
    if (top) break;
    await page.evaluate(() => { const t = Game.top(); if (t instanceof ActionMenu) t.i = 0; });
    await key('KeyZ', 250);
  }
  await page.evaluate(() => { window.DBG = null; });
  // kedai
  await page.evaluate(() => { World.load('kedai', 4, 6, 'up', MAPS.kepalabatas.doors[4]); World.run(() => clerk()); return 1; });
  await page.waitForTimeout(300);
  await key('KeyZ', 400); await key('KeyZ', 400); await shot('16_shop');
  await key('KeyZ', 300); await shot('17_shop_list');
  await key('KeyX'); await key('KeyX'); await key('ArrowDown'); await key('ArrowDown'); await key('KeyZ'); await key('KeyZ');
  // evolusi
  await page.evaluate(() => { World.load('kepalabatas', 12, 13, 'down'); World.run(() => evolve(S.party[3], 'Kancilpetir')); return 1; });
  await page.waitForTimeout(600); await key('KeyZ', 300); await page.waitForTimeout(1500); await shot('18_evolve');
  for (let i = 0; i < 10; i++) await key('KeyZ', 300);
  // pertarungan jurulatih (ketua)
  await page.evaluate(() => { World.run(() => fightTrainer({ cls: 'Ketua Gim', name: 'KAK MAWAR', team: [['Tapaksulaiman', 18], ['Bintanglaut', 21]] }, 'ketua2')); });
  await page.waitForTimeout(1800); await shot('19_trainer_intro');
  await key('KeyZ', 1500); await shot('20_trainer_send');
  console.log(errors.join('\n') || 'tiada ralat');
  await browser.close();
})();
