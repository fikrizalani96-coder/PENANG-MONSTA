'use strict';
// ===== Peta dalaman =====
// ---------- Templat ----------
MAPS.klinik = {
  name: 'Klinik Monsta', inside: true, template: true, pc: true, music: 'klinik',
  tiles: [
    '###########',
    '#QhA_Q_Q_n#',
    '#CCCCCCC__#',
    '#_________#',
    '#o_______o#',
    '#_KK______#',
    '#_KK___D__#',
    '#####E#####',
  ],
  o: {
    A: { s: 'jururawat', d: 'down', run: nurse },
    D: { s: 'budak', d: 'left', move: 'spin', t: 'PC di sudut itu boleh menyimpan Monsta kamu. Sangat berguna!' }
  }
};
MAPS.kedai = {
  name: 'Kedai Monsta', inside: true, template: true,
  tiles: [
    '#########',
    '#QQ__QQQ#',
    '#_C_____#',
    '#AC_____#',
    '#_C__KK_#',
    '#_C__KK_#',
    '#_____D_#',
    '####E####',
  ],
  o: {
    A: { s: 'peniaga', d: 'right', run: clerk },
    D: { s: 'makcik', d: 'up', move: 'spin', t: 'Ubat Nyamuk sangat berguna kalau kamu tak mahu diganggu Monsta liar yang lemah.' }
  }
};
MAPS.rumah = {
  name: 'Rumah', inside: true, template: true,
  tiles: [
    '########',
    '#QQ__n_#',
    '#______#',
    '#_A__KK#',
    '#____KK#',
    '#z___D_#',
    '#z__I__#',
    '###E####',
  ],
  o: {}
};

// ---------- Penaga ----------
MAPS.rumah_pemain = {
  name: 'Rumah {P}', inside: true,
  tiles: [
    '#########',
    '#Qn__QQ_#',
    '#_____I_#',
    '#__KK___#',
    '#__KKA__#',
    '#z______#',
    '#z______#',
    '####E####',
  ],
  o: {
    A: {
      s: 'mak', d: 'left', run: async () => {
        if (!flag('starter')) {
          await say('MAK: Pagi, {P}! Semua budak akan meninggalkan rumah suatu hari nanti.');
          await say('MAK: Profesor Meranti di makmal sebelah sedang mencari kamu. Pergilah jumpa dia!');
          return;
        }
        await say('MAK: {P}! Kamu nampak penat. Rehatlah sekejap.');
        Snd.sfx('heal'); await heal(true); await wait(1);
        S.lastHeal = { map: 'rumah_pemain', x: 5, y: 5, ret: { map: 'penaga', x: 8, y: 5 } };
        await say('MAK: Ha, dah segar! Mak bangga dengan kamu. Jaga diri baik-baik ya!');
      }
    },
    I: item('Ubat')
  },
  shelf: 'Penuh dengan komik Monsta kegemaran {P}.'
};
MAPS.rumah_johan = {
  name: 'Rumah {R}', inside: true,
  tiles: [
    '#########',
    '#QQ_n_QQ#',
    '#_______#',
    '#_KK__A_#',
    '#_KK____#',
    '#_______#',
    '#o_____o#',
    '####E####',
  ],
  o: {
    A: {
      s: 'gadis2', d: 'down', run: async () => {
        if (!flag('dex')) { await say('KAK SITI: Hai {P}! {R} tiada di rumah. Dia di makmal Atuk.'); return; }
        await say('KAK SITI: Atuk suruh kamu kumpul data semua Monsta? Wah, hebatnya!');
        await say('KAK SITI: Nasihat kakak: Monsta akan lebih kuat jika sering bertarung. Tukar-tukar Monsta dalam kumpulan kamu supaya semua dapat EXP.');
      }
    }
  }
};
MAPS.makmal = {
  name: 'Makmal Monsta', inside: true,
  tiles: [
    '###########',
    '#QQQ_n_QQQ#',
    '#____A____#',
    '#_____IJN_#',
    '#_D_______#',
    '#____O____#',
    '#Q_______Q#',
    '#_________#',
    '#VVVVVVVVV#',
    '#####E#####',
  ],
  shelf: 'Buku-buku tebal tentang kajian Monsta. "Monsta dan Ekosistem Seberang Perai".',
  o: {
    A: {
      s: 'prof', d: 'down', run: async () => {
        if (!flag('starter')) { await say('PROF. MERANTI: Pilihlah salah satu Monsta dalam Bola Tangkap di atas meja itu, {P}!'); return; }
        if (flag('bungkusan') && !flag('dex')) { await deliverParcel(); return; }
        if (!flag('dex')) { await say('PROF. MERANTI: Jika Monsta liar muncul, biarkan Monsta kamu bertarung supaya ia bertambah kuat!'); return; }
        const [seen, caught] = dexCount();
        await say(`PROF. MERANTI: Mari atuk lihat MONSTADEX kamu. Kamu telah melihat ${seen} Monsta dan menangkap ${caught} Monsta.`);
        await say(caught < 10 ? 'Masih banyak lagi yang perlu kamu cari! Teruskan usaha!' : caught < 40 ? 'Bagus! Kamu semakin rajin. Teruskan!' : caught < 80 ? 'Hebat! Kamu jurulatih yang berdedikasi!' : caught < 120 ? 'Luar biasa! Hampir lengkap!' : 'Tahniah! MONSTADEX kamu lengkap! Kamu memenuhi impian atuk!');
      }
    },
    I: { u: 'K', item: null, ball: 'Anakpadi', show: () => !flag('starter') || (S.rivalStarter !== 'Anakpadi' && S.starter !== 'Anakpadi'), run: o => chooseStarter(o, 'Anakpadi') },
    J: { u: 'K', item: null, ball: 'Percik', show: () => !flag('starter') || (S.rivalStarter !== 'Percik' && S.starter !== 'Percik'), run: o => chooseStarter(o, 'Percik') },
    N: { u: 'K', item: null, ball: 'Penyucil', show: () => !flag('starter') || (S.rivalStarter !== 'Penyucil' && S.starter !== 'Penyucil'), run: o => chooseStarter(o, 'Penyucil') },
    D: { s: 'johan', d: 'up', show: () => !flag('rival1'), t: '{R}: Hmph! Monsta aku lebih hebat daripada kamu punya!' },
    O: { s: 'johan', d: 'up', show: () => flag('bungkusan') && !flag('dex') && flag('rival1'), t: '{R}: Apa yang Atuk nak ni?' },
    V: {
      trig: async () => {
        const r = obj('D');
        if (!r) return;
        await say('{R}: Tunggu, {P}! Jom kita uji Monsta kita!');
        await approach(r); turnP(OPP[r.dir]);
        await say('{R}: Mari! Aku akan lawan kamu!');
        const res = await Story.rivalFight(1, null, '{R}: Apa? Tak guna! Aku pilih Monsta yang salah!', { canLose: true, loseText: '{R}: Yeay! Aku memang hebat!' });
        await say('{R}: Okey! Aku akan keluar dan latih Monsta aku. Atuk! Selamat tinggal! {P}, jumpa lagi!');
        World.objs = World.objs.filter(q => q !== r);
        Snd.sfx('door');
        setFlag('rival1');
        for (const m of S.party) healMon(m);
      }, if: () => flag('starter') && !flag('rival1')
    }
  }
};
// Objek bola pemula: lukis sebagai bola
for (const k of ['I', 'J', 'N']) MAPS.makmal.o[k].item = undefined;
async function chooseStarter(o, sp) {
  if (flag('starter')) { await say('Itu Bola Tangkap Profesor Meranti.'); return; }
  if (!flag('lab_intro')) { await say('PROF. MERANTI: Eh, jangan sentuh dulu!'); return; }
  const desc = { Anakpadi: 'jenis RUMPUT', Percik: 'jenis API', Penyucil: 'jenis AIR' }[sp];
  const pic = new PicScene(sp); Game.push(pic);
  const ok = await UI.yes(`Jadi, kamu mahu ${sp.toUpperCase()}, Monsta ${desc}?`);
  Game.pop(pic);
  if (!ok) return;
  S.starter = sp; S.rivalStarter = RIVAL_PICK[sp];
  const m = makeMon(sp, 5); S.party.push(m); catchMon(sp);
  setFlag('starter');
  Snd.sfx('catch');
  await say(`PROF. MERANTI: Monsta ini sangat bertenaga!`);
  await say(`{P} menerima ${sp.toUpperCase()} daripada Profesor Meranti!`);
  const r = obj('D');
  await say('{R}: Kalau macam tu, aku ambil yang ini!');
  const target = obj({ Anakpadi: 'I', Percik: 'J', Penyucil: 'N' }[S.rivalStarter]);
  if (r && target) {
    await moveObj(r, 'down');
    while (r.x < target.x) await moveObj(r, 'right');
    await moveObj(r, 'up'); r.dir = 'up';
  }
  World.objs = World.objs.filter(q => q !== target);
  Snd.sfx('item');
  await say(`{R} menerima ${S.rivalStarter.toUpperCase()} daripada Profesor Meranti!`);
}
async function deliverParcel() {
  await say('PROF. MERANTI: Oh, {P}! Bagaimana Monsta kamu? Nampaknya ia semakin sayang pada kamu.');
  await say('Apa? Ada bungkusan untuk atuk? Oh! Ini barang yang atuk tempah! Terima kasih!');
  takeItem('Bungkusan');
  await say('{R}: Atuk! Kenapa panggil saya?');
  await say('PROF. MERANTI: Oh ya! Atuk ada permintaan untuk kamu berdua.');
  await say('PROF. MERANTI: Di atas meja ini ialah MONSTADEX. Ia ensiklopedia berteknologi tinggi yang merekod data setiap Monsta yang kamu jumpa atau tangkap secara automatik!');
  Snd.sfx('item');
  await say('{P} menerima MONSTADEX daripada Profesor Meranti!');
  setFlag('dex');
  await say('PROF. MERANTI: Mustahil untuk mengumpul data semua Monsta di Seberang Perai dalam sekelip mata. Tapi atuk sudah tua...');
  await say('PROF. MERANTI: Jadi atuk mahu kamu berdua memenuhi impian atuk! Jelajahlah seluruh Seberang Perai, dari Penaga hingga Nibong Tebal!');
  await say('PROF. MERANTI: Ini satu tugas besar dalam sejarah Monsta!');
  await say('{R}: Baiklah, Atuk! Serahkan pada saya! {P}, aku tak akan kalah dengan kamu! Selamat tinggal!');
  const r = obj('O');
  if (r) { for (let i = 0; i < 4; i++) await moveObj(r, 'down'); World.objs = World.objs.filter(q => q !== r); Snd.sfx('door'); }
  await say('PROF. MERANTI: Untuk menangkap Monsta liar, gunakan BOLA TANGKAP. Ambil ini!');
  await give('Bola Tangkap', 5);
  await say('PROF. MERANTI: Lemahkan Monsta liar dahulu sebelum membaling bola. Semoga berjaya!');
}
class PicScene {
  constructor(sp) { this.sp = sp; this.transparent = true; }
  draw() {
    panel(SW / 2 - 110, 40, 220, 220, true);
    ctx.drawImage(monstaSprite(this.sp), SW / 2 - 96, 54, 192, 192);
  }
}

// ---------- Gim (penjana) ----------
function gymMap(name, decor, o, extra = {}) {
  const base = extra.tiles || [
    '###########',
    '#o___A___o#',
    '#_________#',
    '#_XX___XX_#',
    '#_XX_I_XX_#',
    '#_________#',
    '#J_______N#',
    '#_XX___XX_#',
    '#_XX___XX_#',
    '#_________#',
    '#___U_____#',
    '#g_______g#',
    '#___O_____#',
    '#####E#####',
  ];
  return Object.assign({
    name, inside: true, theme: 'gim', under: 'j', tileTheme: 'gim', music: 'bandar',
    tiles: base.map(r => r.replace(/X/g, decor).replace(/_/g, 'j').replace(/[A-Za-z]/g, ch => (MARKERS.has(ch) && !o[ch]) ? 'j' : ch)), o
  }, extra.m || {});
}
