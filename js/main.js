'use strict';
// ===== Skrin tajuk, permainan baru, tamat =====
const TITLE_MONS = ['Nagabara', 'Garuda', 'Meriampenyu', 'Jentayu', 'Sawahraja', 'Nagatasik', 'Tupaipetir', 'Kelembai', 'Nagaraja', 'Hulubalang'];
function titleText(y) {
  const big = PORTRAIT ? 120 : 150;
  ctx.save();
  setFont(big); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
  ctx.font = `800 ${Math.round(big * .86)}px ${FONT}`;
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillText('MONSTA', SW / 2 + 5, y + 7);
  const g = ctx.createLinearGradient(0, y, 0, y + big);
  g.addColorStop(0, '#fff6d0'); g.addColorStop(.5, '#f3c85a'); g.addColorStop(1, '#b8781e');
  ctx.fillStyle = g; ctx.fillText('MONSTA', SW / 2, y);
  ctx.lineWidth = 3; ctx.strokeStyle = '#5a2a10'; ctx.strokeText('MONSTA', SW / 2, y);
  ctx.restore();
  txt('SEBERANG PERAI', SW / 2, y + big * .92, { size: PORTRAIT ? 44 : 52, align: 'center', color: '#fff' });
  txt('JEJAK SEJARAH', SW / 2, y + big * .92 + (PORTRAIT ? 48 : 56), { size: 26, align: 'center', color: THEME.accent });
}
class TitleScene {
  constructor(res) { this.res = res; this.t = 0; this.k = 0; this.ready = false; }
  update(dt) {
    this.t += dt;
    if (this.t > 4.5) { this.t = 0; this.k = (this.k + 1) % TITLE_MONS.length; }
    if (!this.ready && (Input.pressed.a || Input.pressed.start)) { this.ready = true; Snd.sfx('beep'); this.res(); }
  }
  draw() {
    if (!(R3.ok && R3.drawShow(TITLE_MONS[this.k], { rot: Game.t * .5, y: PORTRAIT ? -1 : 1 }))) {
      screenBG('#3a2060', '#f89850');
      ctx.imageSmoothingEnabled = false; ctx.drawImage(monstaSprite(TITLE_MONS[this.k]), SW / 2 - 150, SH * .35, 300, 300); ctx.imageSmoothingEnabled = true;
    }
    titleText(PORTRAIT ? 120 : 34);
    if (!this.ready && Math.floor(Game.t * 2) % 2 === 0) txt(IS_TOUCH ? 'Sentuh butang A untuk mula' : 'Tekan Z / Enter untuk mula', SW / 2, SH - INSET.b - (PORTRAIT ? 90 : 80), { size: 34, align: 'center' });
    txt('© Monsta Seberang Perai · Versi 2.0', SW / 2, SH - INSET.b - 36, { size: 20, align: 'center', color: 'rgba(255,255,255,.55)' });
  }
}
class IntroScene {
  constructor() { this.show = null; this.a = 0; }
  update(dt) { this.a = Math.min(1, this.a + dt * 2); }
  draw() {
    const human = this.show === 'prof' || this.show === 'player' || this.show === 'rival';
    const look = this.show === 'prof' ? 'prof' : this.show === 'rival' ? 'johan' : S.look;
    if (R3.ok && this.show && R3.drawShow(human ? look : this.show, { human, y: PORTRAIT ? -1.2 : 0 })) return;
    screenBG('#2a2050', '#0a0818');
    ctx.globalAlpha = this.a; ctx.imageSmoothingEnabled = false;
    if (human) ctx.drawImage(personSprite(look, 'down', 0), SW / 2 - 110, SH * .2, 220, 220);
    else if (this.show) ctx.drawImage(monstaSprite(this.show), SW / 2 - 130, SH * .15, 260, 260);
    ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true;
  }
  set(s) { this.show = s; this.a = 0; }
}
async function newGame() {
  S = newState();
  const sc = new IntroScene();
  Game.push(sc);
  Snd.music('klinik');
  await fadeTo(0, 3);
  sc.set('prof');
  await say('Assalamualaikum dan selamat datang ke dunia MONSTA!');
  await say('Nama saya MERANTI. Orang ramai memanggil saya Profesor Monsta!');
  sc.set('Kancil');
  await say('Dunia ini dihuni oleh makhluk yang dipanggil MONSTA!');
  await say('Ada orang yang memelihara Monsta sebagai kawan. Ada juga yang menggunakannya untuk bertarung.');
  await say('Saya mengkaji Monsta... dan juga SEJARAH tanah air kita. Setiap batu dan sungai di Seberang Perai menyimpan cerita beribu tahun!');
  sc.set('player');
  const g = await UI.ask('Pertama sekali, kamu budak lelaki atau perempuan?', ['LELAKI', 'PEREMPUAN'], { cancel: null });
  S.look = g === 0 ? 'pemain' : 'pemain2';
  sc.set('player');
  const defs = g === 0 ? ['ALI', 'DANIAL', 'HARIS'] : ['AISYAH', 'NURUL', 'SOFEA'];
  let i = await UI.ask('Siapa nama kamu?', ['NAMA BARU', ...defs], { cancel: null, start: 1 });
  S.name = i === 0 ? await UI.askName('Siapa nama kamu?', defs[0]) : defs[i - 1];
  await say(`Baiklah, nama kamu ${S.name}!`);
  sc.set('rival');
  await say('Ini cucu saya. Dia pesaing kamu sejak kecil lagi.');
  i = await UI.ask('...Erm, apa nama dia ya?', ['NAMA BARU', 'JOHAN', 'HAKIM', 'FARID'], { cancel: null, start: 1 });
  S.rival = i === 0 ? await UI.askName('Nama pesaing kamu?', 'JOHAN') : ['JOHAN', 'HAKIM', 'FARID'][i - 1];
  await say(`Oh ya! Sekarang saya ingat! Nama dia ${S.rival}!`);
  sc.set('player');
  await say('{P}! Kisah legenda kamu akan bermula sekarang!');
  await say('Dunia MONSTA, dari Penaga hingga Nibong Tebal, sedang menanti kamu! Ayuh!');
  await fadeTo(1, 2);
  Game.pop(sc);
  World.load('rumah_pemain', 4, 5, 'up');
  Game.push(World.scene);
  await fadeTo(0, 2);
  if (window.Cloud) Cloud.flushPending();
  await UI.chapter('BAB 1', 'Pagi di Penaga');
}
async function continueGame(s) {
  S = Object.assign(newState(), s);
  const door = S.door && MAPS[S.door.m] ? (MAPS[S.door.m].doors || {})[S.door.d] : null;
  await fadeTo(1, 4);
  World.load(S.map, S.x, S.y, S.dir, door);
  Game.push(World.scene);
  if (window.Cloud) Cloud.flushPending();
  await fadeTo(0, 4);
}
async function titleFlow() {
  Game.scenes = [];
  let res;
  const p = new Promise(r => res = r);
  const t = new TitleScene(res);
  Game.push(t);
  Snd.music('tajuk');
  await fadeTo(0, 2);
  await p;
  while (true) {
    const save = window.Cloud ? await Cloud.bestSave() : loadGame();
    const opts = save ? ['SAMBUNG', 'PERMAINAN BARU', 'AKAUN GOOGLE'] : ['PERMAINAN BARU', 'AKAUN GOOGLE'];
    const R = dlgRect();
    const c = await UI.choose(opts, { cancel: null, x: SW / 2 - 220, y: SH - INSET.b - (PORTRAIT ? 470 : 320), w: 440 });
    const id = opts[c];
    if (id === 'AKAUN GOOGLE') { if (window.Cloud) await Cloud.openPanel(); continue; }
    if (id === 'SAMBUNG') {
      const h = Math.floor(save.time / 3600), m = Math.floor(save.time / 60) % 60;
      const ok = await UI.ask(`${save.name} · Lencana ${save.badges.length} · Masa ${h}:${String(m).padStart(2, '0')}${save._cloud ? ' · ☁ awan' : ''}. Teruskan?`, ['YA', 'TIDAK'], { cancel: 1 });
      if (ok !== 0) continue;
      await fadeTo(1, 3); Game.pop(t);
      return continueGame(save);
    }
    if (save) {
      const ok = await UI.ask('Permainan baru akan menggantikan simpanan lama apabila kamu menyimpan. Teruskan?', ['YA', 'TIDAK'], { cancel: 1 });
      if (ok !== 0) continue;
    }
    await fadeTo(1, 3); Game.pop(t);
    return newGame();
  }
}
// Dewan Kemasyhuran & kredit
async function hallOfFame() {
  const sc = {
    k: 0, draw() {
      const m = S.party[Math.floor(Game.t / 2.5) % S.party.length];
      if (!(R3.ok && R3.drawShow(m.sp, { rot: Game.t * .4, y: PORTRAIT ? -1.2 : 0 }))) screenBG('#201830', '#000');
      txt('DEWAN KEMASYHURAN', SW / 2, 30 + (IS_TOUCH ? 50 : 0), { size: 54, align: 'center', color: THEME.accent });
      txt(monName(m) + '  ·  Tp ' + m.lv, SW / 2, 96 + (IS_TOUCH ? 50 : 0), { size: 36, align: 'center' });
    }
  };
  Game.push(sc);
  Snd.music('tajuk');
  await say('Tahniah, {P}! Kamu dan Monsta kamu kini diabadikan dalam DEWAN KEMASYHURAN sebagai JUARA MONSTA SEBERANG PERAI!');
  Game.pop(sc);
  const cr = {
    y: SH, lines: ['MONSTA SEBERANG PERAI', '', 'Dari Penaga ke Nibong Tebal,', 'dari Kepala Batas ke Bukit Mertajam,', 'terima kasih kerana bermain!', '', 'Juara: ' + S.name, 'Pesaing: ' + S.rival, '', 'Monstadex: ' + dexCount()[1] + ' ditangkap', '', 'TAMAT BAHAGIAN PERTAMA', '', '...tetapi Batu Bersurat Cherok Tok Kun', 'mula bercahaya...', 'Sejarah Seberang Perai memanggil kamu!'],
    update(dt) { this.y -= dt * 60; if (Input.held.a) this.y -= dt * 200; },
    draw() { screenBG('#0a0818', '#000'); this.lines.forEach((l, i) => txt(l, SW / 2, this.y + i * 48, { size: 38, align: 'center', color: i === 0 ? THEME.accent : '#fff' })); }
  };
  Game.push(cr);
  while (cr.y > -cr.lines.length * 48) await wait(.1);
  Game.pop(cr);
  setFlag('juara');
  S.lastHeal = { map: 'rumah_pemain', x: 5, y: 5, ret: { map: 'penaga', x: 8, y: 5 } }; S.ret = { map: 'penaga', x: 8, y: 5 };
  World.load('rumah_pemain', 5, 5, 'up');
  saveGame();
  await say('Permainan telah disimpan.');
  await UI.chapter('BAB 12', 'Jejak Sejarah');
  await say('MAK: {P}! Profesor Meranti telefon tadi. Katanya Batu Bersurat di Bukit Mertajam tiba-tiba bercahaya! Dia mahu jumpa kamu di sana.');
}

// ---------- Mula ----------
function boot() {
  World.init();
  requestAnimationFrame(frame);
  Game.fade = 1;
  if (window.Monet) Monet.init();
  if (window.Cloud) Cloud.init();
  titleFlow();
}
window.addEventListener('error', e => { console.error('Ralat:', e.message); });
if (document.fonts && document.fonts.load) {
  Promise.race([Promise.all([document.fonts.load('600 32px "Baloo 2"'), document.fonts.load('16px "Press Start 2P"'), document.fonts.load('500 32px "Pixelify Sans"')]), new Promise(r => setTimeout(r, 1800))]).then(boot, boot);
} else boot();
