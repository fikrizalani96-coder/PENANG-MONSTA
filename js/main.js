'use strict';
// ===== Skrin tajuk, permainan baru, tamat =====
const TITLE_MONS = ['Nagabara', 'Meriampenyu', 'Sawahraja', 'Tupaipetir', 'Garuda', 'Jentayu', 'Nagatasik', 'Kancil', 'Nagaraja', 'Hulubalang'];
class TitleScene {
  constructor(res) { this.res = res; this.t = 0; this.k = 0; this.ready = false; }
  update(dt) {
    this.t += dt;
    if (this.t > 3.5) { this.t = 0; this.k = (this.k + 1) % TITLE_MONS.length; }
    if (!this.ready && (Input.pressed.a || Input.pressed.start)) { this.ready = true; Snd.sfx('beep'); this.res(); }
  }
  draw() {
    const g = ctx.createLinearGradient(0, 0, 0, SH);
    g.addColorStop(0, '#f8c860'); g.addColorStop(.55, '#f89850'); g.addColorStop(1, '#6a5aa8');
    ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    // matahari & bukit
    ctx.fillStyle = '#fff4c0'; ctx.beginPath(); ctx.arc(560, 250, 70, 0, 7); ctx.fill();
    ctx.fillStyle = '#4a3a78'; ctx.beginPath(); ctx.moveTo(0, 330); ctx.quadraticCurveTo(200, 250, 380, 320); ctx.quadraticCurveTo(560, 260, 720, 330); ctx.lineTo(720, 480); ctx.lineTo(0, 480); ctx.fill();
    ctx.fillStyle = '#2a2458'; ctx.fillRect(0, 380, SW, 100);
    for (let i = 0; i < 12; i++) { ctx.fillStyle = '#3a3470'; ctx.fillRect((i * 70 + Game.t * 20) % SW, 400 + (i % 3) * 20, 40, 3); }
    txt('MONSTA', SW / 2, 26, { size: 110, align: 'center', color: '#fff8e0', shadow: '#8a2a20' });
    txt('SEBERANG PERAI', SW / 2, 124, { size: 44, align: 'center', color: '#3a2060', shadow: '#f8e0a0' });
    const img = monstaSprite(TITLE_MONS[this.k]);
    const bob = Math.sin(Game.t * 2) * 6;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, SW / 2 - 110, 170 + bob, 220, 220);
    if (!this.ready && Math.floor(Game.t * 2) % 2 === 0) txt('Tekan A / Z untuk mula', SW / 2, 404, { size: 34, align: 'center', color: '#fff', shadow: '#000' });
    txt('Pengembaraan Monsta di Penaga, Kepala Batas, Butterworth, Nibong Tebal dan seluruh Seberang Perai', SW / 2, 448, { size: 20, align: 'center', color: '#c8c0f0' });
  }
}
class IntroScene {
  constructor() { this.show = null; this.a = 0; }
  update(dt) { this.a = Math.min(1, this.a + dt * 2); }
  draw() {
    ctx.fillStyle = '#f0f0f8'; ctx.fillRect(0, 0, SW, SH);
    ctx.fillStyle = '#d8d8e8'; ctx.beginPath(); ctx.ellipse(SW / 2, 290, 160, 30, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = this.a;
    ctx.imageSmoothingEnabled = false;
    if (this.show === 'prof' || this.show === 'player' || this.show === 'rival') {
      const look = this.show === 'prof' ? 'prof' : this.show === 'rival' ? 'johan' : S.look;
      ctx.drawImage(personSprite(look, 'down', 0), SW / 2 - 96, 106, 192, 192);
    } else if (this.show) {
      ctx.drawImage(monstaSprite(this.show), SW / 2 - 110, 80, 220, 220);
    }
    ctx.globalAlpha = 1;
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
  await say('Saya pula... saya mengkaji Monsta sebagai profesion saya di Penaga, Seberang Perai.');
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
}
async function continueGame(s) {
  S = Object.assign(newState(), s);
  const door = S.door && MAPS[S.door.m] ? (MAPS[S.door.m].doors || {})[S.door.d] : null;
  await fadeTo(1, 4);
  World.load(S.map, S.x, S.y, S.dir, door);
  Game.push(World.scene);
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
  const save = loadGame();
  let choice = 1;
  if (save) {
    const h = Math.floor(save.time / 3600), m = Math.floor(save.time / 60) % 60;
    choice = await UI.choose(['SAMBUNG', 'PERMAINAN BARU'], { cancel: null, x: SW / 2 - 150, y: 300, w: 300 });
    if (choice === 0) {
      const ok = await UI.ask(`${save.name} · Lencana ${save.badges.length} · Masa ${h}:${String(m).padStart(2, '0')}. Teruskan?`, ['YA', 'TIDAK'], { cancel: 1 });
      if (ok !== 0) { Game.pop(t); return titleFlow(); }
    } else {
      const ok = await UI.ask('Permainan baru akan memadam simpanan lama apabila kamu menyimpan. Teruskan?', ['YA', 'TIDAK'], { cancel: 1 });
      if (ok !== 0) { Game.pop(t); return titleFlow(); }
    }
  }
  await fadeTo(1, 3);
  Game.pop(t);
  if (save && choice === 0) await continueGame(save);
  else await newGame();
}
// Dewan Kemasyhuran & kredit
async function hallOfFame() {
  const sc = { t: 0, draw() {
    ctx.fillStyle = '#201830'; ctx.fillRect(0, 0, SW, SH);
    txt('DEWAN KEMASYHURAN', SW / 2, 20, { size: 48, align: 'center', color: '#f8d860' });
    S.party.forEach((m, k) => {
      const x = 70 + (k % 3) * 200, y = 90 + Math.floor(k / 3) * 180;
      ctx.drawImage(monstaSprite(m.sp), x, y, 140, 140);
      txt(monName(m) + ' Tp' + m.lv, x + 70, y + 136, { size: 26, align: 'center', color: '#fff' });
    });
  } };
  Game.push(sc);
  Snd.music('tajuk');
  await say('Tahniah, {P}! Kamu dan Monsta kamu kini diabadikan dalam DEWAN KEMASYHURAN sebagai JUARA MONSTA SEBERANG PERAI!');
  Game.pop(sc);
  const cr = {
    y: SH, lines: ['MONSTA SEBERANG PERAI', '', 'Dari Penaga ke Nibong Tebal,', 'dari Kepala Batas ke Bukit Mertajam,', 'terima kasih kerana bermain!', '', 'Juara: ' + S.name, 'Pesaing: ' + S.rival, '', 'Monstadex: ' + dexCount()[1] + ' ditangkap', '', 'Cerita, grafik & muzik', 'dijana untuk permainan ini', '', 'TAMAT', '', '...tetapi pengembaraan belum selesai!', 'Ada Monsta legenda yang masih bersembunyi', 'di Batu Bersurat Cherok Tok Kun...'],
    update(dt) { this.y -= dt * 60; if (Input.held.a) this.y -= dt * 200; },
    draw() { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, SW, SH); this.lines.forEach((l, i) => txt(l, SW / 2, this.y + i * 44, { size: 36, align: 'center', color: i === 0 ? '#f8d860' : '#fff' })); }
  };
  Game.push(cr);
  while (cr.y > -cr.lines.length * 44) await wait(.1);
  Game.pop(cr);
  setFlag('juara');
  S.lastHeal = { map: 'rumah_pemain', x: 5, y: 5, ret: { map: 'penaga', x: 8, y: 5 } }; S.ret = { map: 'penaga', x: 8, y: 5 };
  World.load('rumah_pemain', 5, 5, 'up');
  saveGame();
  await say('Permainan telah disimpan. Kamu boleh terus meneroka Seberang Perai!');
}

// ---------- Mula ----------
function boot() {
  World.init();
  requestAnimationFrame(frame);
  Game.fade = 1;
  titleFlow();
}
window.addEventListener('error', e => { console.error('Ralat:', e.message); });
if (document.fonts && document.fonts.load) {
  Promise.race([document.fonts.load('32px VT323'), new Promise(r => setTimeout(r, 1500))]).then(boot, boot);
} else boot();
