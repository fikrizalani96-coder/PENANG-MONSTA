// Ujian fail simpanan: eksport, fail rosak ditolak, import dari skrin tajuk. node tools/savefile_test.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), os = require('os');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await browser.newContext({ acceptDownloads: true, viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  const url = 'file://' + path.join(__dirname, '..', 'index.html') + '?2d';
  let ok = true;
  const check = (label, cond) => { console.log((cond ? 'LULUS ' : 'GAGAL ') + label); if (!cond) ok = false; };

  // 1) main sebentar, kemudian eksport melalui menu FAIL SIMPANAN
  await page.goto(url); await page.waitForTimeout(1200);
  await page.evaluate(() => {
    S = newState(); S.name = 'AISYAH'; S.flags.dex = 1; S.badges = [0, 1]; S.money = 4321; S.time = 3725;
    S.party = [makeMon('Nagabara', 21), makeMon('Kancil', 12)];
    Game.scenes = []; World.load('kepalabatas', 12, 13, 'down'); Game.scenes.push(World.scene); Game.fade = 0; Game.fadeTarget = 0;
    SaveFile.open('game');
  });
  await page.waitForTimeout(300);
  check('butang eksport kelihatan dalam permainan', await page.isVisible('#btnExport'));
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('#btnExport')]);
  const file = path.join(os.tmpdir(), dl.suggestedFilename());
  await dl.saveAs(file);
  const pack = JSON.parse(fs.readFileSync(file, 'utf8'));
  check('nama fail ' + dl.suggestedFilename(), /^monsta-aisyah-\d{8}-\d{4}\.json$/.test(dl.suggestedFilename()));
  check('kandungan fail', pack.format === 'monsta-seberang-perai-save' && pack.data.name === 'AISYAH' && pack.data.map === 'kepalabatas' && pack.data.money === 4321);

  // 2) fail diubah suai ditolak
  const bad = JSON.parse(JSON.stringify(pack)); bad.data.money = 999999;
  const badFile = path.join(os.tmpdir(), 'rosak.json'); fs.writeFileSync(badFile, JSON.stringify(bad));
  const junkFile = path.join(os.tmpdir(), 'bukan.json'); fs.writeFileSync(junkFile, '{"hello":1}');

  // 3) pelayar baharu (tiada simpanan) → skrin tajuk → IMPORT SIMPANAN
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(url); await page.waitForTimeout(1500);
  await page.keyboard.press('Enter'); await page.waitForTimeout(500);
  const opts = await page.evaluate(() => Game.top().opts);
  check('pilihan tajuk ada IMPORT SIMPANAN: ' + opts.join(', '), opts.includes('IMPORT SIMPANAN'));
  await page.evaluate(() => { const t = Game.top(); t.i = t.opts.indexOf('IMPORT SIMPANAN'); });
  await page.keyboard.press('KeyZ'); await page.waitForTimeout(400);
  check('tetingkap fail simpanan dibuka (tanpa butang eksport)', await page.isVisible('#saveBox') && !(await page.isVisible('#btnExport')));
  await page.setInputFiles('#saveInput', badFile); await page.waitForTimeout(300);
  let note = await page.textContent('#saveNote');
  check('fail diubah ditolak: ' + note, /rosak|diubah/.test(note) && !(await page.isVisible('#importPreview')));
  await page.setInputFiles('#saveInput', junkFile); await page.waitForTimeout(300);
  note = await page.textContent('#saveNote');
  check('fail bukan simpanan ditolak: ' + note, /bukan fail simpanan/.test(note));
  await page.setInputFiles('#saveInput', file); await page.waitForTimeout(300);
  check('ringkasan dipaparkan: ' + await page.textContent('#importInfo'), /AISYAH · 2 lencana · 2 Monsta · 1:02/.test(await page.textContent('#importInfo')));
  await page.click('#btnImportOk');
  await page.waitForFunction(() => window.S && World.map && World.map.id === 'kepalabatas' && Game.top() === World.scene, null, { timeout: 15000 }).catch(() => { });
  const st = await page.evaluate(() => ({ map: World.map && World.map.id, name: S && S.name, money: S && S.money, badges: S && S.badges.length, stored: !!localStorage.getItem(SAVE_KEY) }));
  check('permainan diimport dan disambung: ' + JSON.stringify(st), st.map === 'kepalabatas' && st.name === 'AISYAH' && st.money === 4321 && st.badges === 2 && st.stored);
  check('tiada ralat halaman', errors.length === 0);
  if (errors.length) console.log(errors.join('\n'));
  await browser.close();
  process.exit(ok ? 0 : 1);
})();
