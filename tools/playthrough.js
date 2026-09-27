// Ujian main penuh automatik (cerita dari awal hingga Juara): node tools/playthrough.js
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const page = await browser.newPage({ viewport: { width: 760, height: 520 } });
  const errors = [];
  page.on('console', m => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('ERR_CERT')) errors.push(m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.join(__dirname, '..', 'index.html') + '?2d');
  await page.waitForTimeout(1200);
  const out = path.join(__dirname, '..', 'shots', 'play');
  require('fs').mkdirSync(out, { recursive: true });
  let shotN = 0;
  const shot = async name => page.screenshot({ path: `${out}/${String(++shotN).padStart(2, '0')}_${name}.png`, clip: { x: 0, y: 0, width: 740, height: 500 } });
  await page.evaluate(() => {
    window.DBG = { win: true };
    window.AUTO = { on: true, choice: null, log: [] };
    const origSay = UI.say.bind(UI);
    UI.say = (t, o) => { AUTO.log.push(Array.isArray(t) ? t.join(' ') : String(t)); if (AUTO.log.length > 400) AUTO.log.shift(); return origSay(t, o); };
    setInterval(() => {
      if (!AUTO.on) return;
      const t = Game.top(); if (!t) return;
      const n = t.constructor.name;
      if (n === 'Dialog') Input.pressed.a = true;
      else if (n === 'Choice') { if (AUTO.choice !== null && AUTO.choice < t.opts.length) t.i = AUTO.choice; Input.pressed.a = true; }
      else if (n === 'ActionMenu') { t.i = 0; Input.pressed.a = true; }
      else if (n === 'MoveMenu') { const k = t.bs.me.mon.moves.findIndex(m => m.pp > 0); t.i = Math.max(0, k); Input.pressed.a = true; }
      else if (n === 'PartyScene') { if (!t.busy) { const i = S.party.findIndex((m, k) => alive(m) && k !== t.o.cur); t.i = Math.max(0, i); Input.pressed.a = true; } }
      else if (n === 'ListScene') Input.pressed.b = true;
      else if (n === 'QtyScene') Input.pressed.a = true;
      else if (n === 'TitleScene') Input.pressed.a = true;
      else if (['CardScene', 'SummaryScene', 'DexScene'].includes(n)) Input.pressed.b = true;
      else if (t !== World.scene && t.t > .5) Input.pressed.a = true; // babak tajuk / serpihan sejarah
      Input.held.a = true;
    }, 20);
    window.TT = {
      idle: () => Game.top() === World.scene && !World.busy && !World.p.moving && Game.fade === 0,
      go(id, x, y, dir = 'up', doorOf) {
        let door = null;
        if (doorOf) { door = MAPS[doorOf[0]].doors[doorOf[1]]; S.door = { m: doorOf[0], d: doorOf[1] }; }
        World.load(id, x, y, dir, door);
      },
      talk(key) { const o = obj(key); if (!o) return 'TIADA ' + key; World.run(() => World.talk(o)); return 'ok'; },
      stepTo(x, y, d) { const [dx, dy] = DIRS[d]; World.load(World.map.id, x - dx, y - dy, d, World.ctx); World.tryMove(d); return World.p.moving ? 'ok' : 'blocked'; },
      use(item) { World.run(async () => { await useItemField(item); }); },
      f: () => Object.keys(S.flags).filter(k => !k.startsWith('tr:') && !k.startsWith('it:')),
    };
  });
  const idle = async (ms = 90000) => {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) { if (await page.evaluate(() => TT.idle())) return true; await page.waitForTimeout(150); }
    const st = await page.evaluate(() => ({ top: Game.top() && Game.top().constructor.name, busy: World.busy, map: World.map && World.map.id, log: AUTO.log.slice(-5) }));
    console.log('  !! TAMAT MASA', JSON.stringify(st));
    return false;
  };
  const ev = (fn, arg) => page.evaluate(fn, arg);
  const flags = () => ev(() => TT.f().join(','));
  const check = async (label, cond) => {
    const ok = await ev(cond);
    console.log((ok ? 'LULUS ' : 'GAGAL ') + label);
    if (!ok) { console.log('   log:', (await ev(() => AUTO.log.slice(-6))).join(' | ')); await shot('gagal_' + label.replace(/\W+/g, '_')); }
    return ok;
  };
  const talk = async key => { await ev(() => S.party.forEach(healMon)); const r = await ev(k => TT.talk(k), key); if (r !== 'ok') console.log('  ', r); await page.waitForTimeout(100); await idle(); };
  const step = async (x, y, d) => { await ev(([x, y, d]) => TT.stepTo(x, y, d), [x, y, d]); await page.waitForTimeout(400); await idle(); };
  const go = async (id, x, y, dir, doorOf) => { await ev(([id, x, y, dir, doorOf]) => TT.go(id, x, y, dir, doorOf), [id, x, y, dir, doorOf]); await page.waitForTimeout(100); };

  // --- Permainan baru ---
  await page.waitForTimeout(500);
  await idle(60000);
  await check('masuk rumah', () => World.map.id === 'rumah_pemain' && S.name === 'ALI');
  await shot('rumah');
  // Profesor menahan di Penaga
  await go('penaga', 10, 15, 'down');
  await step(10, 16, 'down');
  await check('prof bawa ke makmal', () => World.map.id === 'makmal' && S.flags.lab_intro);
  await talk('J');
  await check('dapat pemula', () => S.flags.starter && S.party.length === 1 && S.party[0].sp === 'Percik');
  await shot('pemula');
  await step(5, 8, 'down');
  await check('pesaing 1', () => S.flags.rival1);
  // Bungkusan
  await go('kedai', 4, 6, 'up', ['guarperahu', '4']);
  await talk('A');
  await check('bungkusan', () => S.flags.bungkusan && S.bag['Bungkusan']);
  await go('makmal', 5, 4, 'up');
  await talk('A');
  await check('monstadex', () => S.flags.dex && S.bag['Bola Tangkap'] === 5 && !S.bag['Bungkusan']);
  await go('guarperahu', 4, 8, 'left');
  await step(2, 8, 'left');
  await check('pesaing 2', () => S.flags.rival2);
  await shot('guarperahu');
  // naikkan tahap supaya munasabah
  await ev(() => { S.party[0] = makeMon('Bahang', 30); S.party.push(makeMon('Pipit', 12)); });
  // Gim 1
  await go('gim1', 5, 2, 'up');
  await talk('A');
  await check('lencana 1', () => S.badges.includes(0));
  // Guar Kepah fosil
  await go('guarkepah', 18, 13, 'down');
  await talk('U');
  await talk('J');
  await check('fosil', () => S.flags.fosil && S.bag['Fosil Siput']);
  await go('rumah', 3, 4, 'up', ['kepalabatas', '5']);
  await talk('A');
  await check('hidupkan fosil', () => S.party.some(m => m.sp === 'Siputpurba') || S.pc.some(m => m.sp === 'Siputpurba'));
  // Gim 2
  await go('gim2', 5, 2, 'up');
  await talk('A');
  await check('lencana 2', () => S.badges.includes(1));
  await go('kepalabatas', 25, 17, 'up');
  await talk('D');
  await check('lanun kepala batas', () => S.flags.lanun_kb);
  // Laluan 4
  await go('laluan4', 9, 23, 'up');
  await step(9, 22, 'up');
  await check('pesaing 3', () => S.flags.rival3);
  await go('rumah', 3, 4, 'up', ['laluan4', '1']);
  await talk('A');
  await check('tiket', () => S.bag['Tiket Kapal']);
  await go('laluan4', 9, 10, 'up');
  await talk('J');
  await check('hadiah jambatan', () => S.bag['Ketulan Emas'] && S.flags['tr:laluan4:J']);
  // Kapal
  await go('kapal', 7, 8, 'up');
  await step(7, 7, 'up');
  await check('pesaing 4', () => S.flags.rival4);
  await talk('A');
  await check('tebas', () => S.bag['CR01 Tebas'] && S.flags.kapal_pergi);
  // Gim 3
  await go('gim3', 5, 2, 'up');
  await talk('A');
  await check('lencana 3', () => S.badges.includes(2));
  // Ajar Tebas
  await ev(() => TT.use('CR01 Tebas')); await page.waitForTimeout(300); await idle();
  await check('belajar tebas', () => S.party[0].moves.some(m => m.id === 'tebas'));
  // Bertam: tebas semak dan gim 4
  await go('bertam', 6, 17, 'up');
  await ev(() => World.run(() => World.interact())); await page.waitForTimeout(300); await idle();
  await check('semak ditebas', () => World.tile(6, 16) === '.');
  await go('gim4', 5, 2, 'up');
  await talk('A');
  await check('lencana 4', () => S.badges.includes(3));
  // Kancil
  await go('rumah', 3, 4, 'up', ['bertam', '8']);
  await talk('A');
  await check('kancil', () => S.flags.kancil);
  // Markas
  await go('markas2', 7, 6, 'up');
  await talk('A');
  await check('teropong roh', () => S.bag['Teropong Roh'] && S.flags.markas_selesai);
  // Rumah Tinggal
  await go('rumahtinggal2', 1, 1, 'down');
  await step(1, 2, 'down');
  await check('pesaing 5', () => S.flags.rival5);
  await go('rumahtinggal3', 5, 6, 'up');
  await step(5, 5, 'up');
  await check('semangat seladang', () => S.flags.hantu_seladang);
  await go('rumahtinggal3', 5, 3, 'up');
  await talk('O'); await talk('N'); await talk('A');
  await check('tok wan & seruling', () => S.flags.tokwan && S.bag['Seruling']);
  await shot('seruling');
  // Beruang
  await go('laluan8', 10, 5, 'up');
  await ev(() => World.run(() => World.playFlute())); await page.waitForTimeout(300); await idle();
  await check('beruang', () => S.flags.beruang1);
  // Terbang
  await go('rumah', 3, 4, 'up', ['permatangpauh', '1']);
  await talk('A');
  await check('CR02', () => S.bag['CR02 Terbang']);
  // Pengawal
  await ev(() => giveItem('Air Tebu'));
  await go('laluan9', 10, 8, 'down');
  await talk('Z');
  await check('pengawal', () => S.flags.pengawal);
  // Menara
  await go('menara2', 2, 4, 'up'); await talk('A');
  await check('duyung', () => S.flags.duyung);
  await go('menara3', 2, 1, 'left'); await step(1, 2, 'down');
  await check('pesaing 6', () => S.flags.rival6);
  await go('menara4', 7, 5, 'up'); await talk('D');
  await check('menara selesai', () => S.flags.menara_selesai);
  await talk('A');
  await check('bola sakti', () => S.bag['Bola Sakti']);
  // Gelanggang
  await go('rumah', 3, 4, 'up', ['seberangjaya', '7']);
  await talk('A');
  await check('gelanggang', () => S.flags.gelanggang);
  // Gim 5 & 6
  await go('gim5', 5, 2, 'up'); await talk('A');
  await check('lencana 5', () => S.badges.includes(4));
  await go('gim6', 5, 2, 'up'); await talk('A');
  await check('lencana 6', () => S.badges.includes(5));
  // Ombak
  await go('rumah', 3, 4, 'up', ['bukitpanchor', '1']); await talk('A');
  await check('ombak', () => S.bag['CR03 Ombak']);
  await ev(() => { S.party[0].moves = S.party[0].moves.slice(0, 3); }); // ruang untuk jurus
  await ev(() => { S.party[1] = makeMon('Tempurung', 30); [S.party[0], S.party[1]] = [S.party[1], S.party[0]]; S.party[0].moves = S.party[0].moves.slice(0, 3); TT.use('CR03 Ombak'); }); await page.waitForTimeout(300); await idle();
  await check('belajar ombak', () => S.party.some(m => m.moves.some(x => x.id === 'ombak')));
  // Berenang
  await go('nibongtebal', 5, 7, 'left');
  await ev(() => World.run(() => World.interact())); await page.waitForTimeout(500); await idle();
  await check('berenang', () => S.surf);
  // Kunci Rahsia
  await go('kilanglama2', 3, 2, 'left'); await talk('I');
  await check('kunci rahsia', () => S.bag['Kunci Rahsia']);
  await go('gim7', 5, 2, 'up'); await talk('A');
  await check('lencana 7', () => S.badges.includes(6));
  await go('gim8', 5, 2, 'up'); await talk('A');
  await check('lencana 8', () => S.badges.includes(7) && S.flags.lanun_bubar);
  // Legenda
  await go('stesen', 15, 2, 'right'); await talk('Z');
  await check('jentayu', () => S.flags.jentayu);
  // Pesaing 7
  await go('bukitmertajam', 12, 4, 'up'); await step(12, 3, 'up');
  await check('pesaing 7', () => S.flags.rival7);
  // Liga
  for (let i = 1; i <= 5; i++) {
    await go('liga' + i, 5, 4, 'up'); await talk('A');
  }
  await check('menang juara', () => S.flags.juara_menang);
  await go('dewan', 4, 3, 'up'); await talk('A');
  await idle(120000);
  await check('JUARA', () => S.flags.juara && World.map.id === 'rumah_pemain');
  await shot('akhir');
  // Pasca: batu evolusi, PC, kedai, terbang
  await ev(() => { giveItem('Batu Api'); S.party.push(makeMon('Kancil', 30)); });
  await ev(() => TT.use('Batu Api')); await page.waitForTimeout(300); await idle();
  await check('evolusi batu', () => S.party.some(m => m.sp === 'Kancilapi' || m.sp === 'Musangraja' || m.sp === 'Bahang' || m.sp === 'Nagabara'));
  // --- Serpihan Sejarah & Muzium ---
  await go('guarkepah', 21, 13, 'right'); await talk('§1');
  await go('penaga', 5, 12, 'down'); await talk('§2');
  await go('perai', 25, 11, 'right'); await talk('§6');
  await check('3 serpihan', () => Sejarah.count() === 3);
  await go('butterworth', 14, 15, 'up'); await step(14, 14, 'up');
  await check('masuk muzium', () => World.map.id === 'muzium');
  await talk('A');
  await check('hadiah kurator', () => S.fragRewards && S.fragRewards[3]);
  // --- Jejak Sejarah: Lorong Masa ---
  await go('guabersurat', 9, 10, 'up'); await step(9, 9, 'up');
  await check('era bermula', () => S.flags.era_mula);
  await go('guabersurat', 11, 5, 'right'); await step(12, 5, 'right'); await page.waitForTimeout(400); await idle();
  await ev(() => World.tryMove('right')); await page.waitForTimeout(800); await idle();
  await check('portal ke lorong masa', () => World.map.id === 'lorongmasa');
  await go('lorongmasa', 4, 2, 'up'); await ev(() => World.tryMove('up')); await page.waitForTimeout(800); await idle();
  await check('masuk zaman 1', () => World.map.id === 'era1');
  for (let n = 1; n <= 6; n++) {
    await ev(n => { const p = findTile(MAPS['era' + n], '1'); World.load('era' + n, p.x, p.y, 'up'); }, n); await talk('Z');
    await check('zaman ' + n + ' dikunci sebelum panglima', new Function(`return !S.flags.era${n}`));
    await talk('D'); await talk('Z');
    await check('zaman ' + n + ' pulih', new Function(`return !!(S.flags.era${n} && S.flags.eraboss${n})`));
  }
  await go('lorongmasa', 10, 8, 'up'); await talk('N');
  await check('pendeta kelam', () => S.flags.kelam);
  await go('guabersurat', 9, 2, 'up'); await talk('Z');
  await check('kelembai', () => S.flags.kelembai);
  await check('bab', () => S.chapters && S.chapters['BAB 11']);
  // Simpan & muat
  await ev(() => saveGame());
  await check('simpan', () => !!localStorage.getItem(SAVE_KEY));
  const party = await ev(() => S.party.map(m => m.sp + ':' + m.lv).join(' '));
  console.log('Kumpulan akhir:', party);
  console.log('\nRALAT:', errors.length ? '\n' + errors.slice(0, 30).join('\n') : 'tiada');
  await browser.close();
})();
