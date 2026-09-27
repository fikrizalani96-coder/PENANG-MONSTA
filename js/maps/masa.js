'use strict';
// ===== Jejak Sejarah: Muzium, Lorong Masa dan enam zaman Seberang Perai =====
MAPS.muzium = {
  name: 'Muzium Sejarah Seberang Perai', inside: true, music: 'klinik',
  tiles: [
    '##############',
    '#QQ_g__g__g_Q#',
    '#____________#',
    '#_a__A____q__#',
    '#____________#',
    '#_KK__g___KK_#',
    '#____________#',
    '#_y________i_#',
    '#____________#',
    '######E#######',
  ],
  statue: 'Replika artifak sejarah. Tertulis: "Warisan untuk generasi akan datang."',
  shelf: 'Buku-buku sejarah: "Sejarah Kedah Tua", "Province Wellesley", "Kemerdekaan Tanah Melayu".',
  o: {
    A: { s: 'saintis', d: 'down', run: () => Sejarah.curator() },
    a: sign('PAMERAN 1: Replika rangka manusia prasejarah Guar Kepah, bersama timbunan kulit kepah berusia ribuan tahun.'),
    q: sign('PAMERAN 2: Peta lama "Province Wellesley" — nama Seberang Perai selepas tahun 1800.'),
    y: sign('PAMERAN 3: Keratan akhbar 31 Ogos 1957 — "MERDEKA!"'),
    i: npc('pelajar', 'up', 'Saya datang dengan kelas sejarah. Cikgu kata sejarah membuat kita lebih menghargai tanah air!'),
  }
};

// ---------- Lorong Masa (hab) ----------
const ERA_NAMES = ['', 'Guar Kepah · 5,000 Tahun Dahulu', 'Muara Sungai Muda · Zaman Kedah Tua', 'Kuala Perai · Tahun 1800', 'Ladang Tebu · Abad ke-19', 'Butterworth · Disember 1941', 'Bukit Mertajam · 31 Ogos 1957'];
function eraDoor(n) {
  return { to: 'era' + n, at: '1', look: 'portal', lock: () => !flag('era_mula') || (n > 1 && !flag('era' + (n - 1))), lockText: () => !flag('era_mula') ? 'Portal ini belum aktif.' : `Portal ini masih kabur. Pulihkan zaman ${ERA_NAMES[n - 1]} dahulu.` };
}
MAPS.lorongmasa = {
  name: 'Lorong Masa', cave: true, music: 'gua', theme: 'masa', under: 'c', border: 'X', escape: true,
  sky: ['#1a0a2a', '#4a2a6a', '#8a5a9a'],
  tiles: [
    'XXXXXXXXXXXXXXXXXXXX',
    'X^^^1^^^^2^^^^3^^^^X',
    'X^cccccccccccccccc^X',
    'X^cccccccccccccccc^X',
    'X^cccc^cccccc^cccc^X',
    'X7ccccccccAccccccc^X',
    'X^cccccccccccccccc^X',
    'X^cccc^cccNcc^cccc^X',
    'X^cccccccccccccccc^X',
    'X^cccccccccccccccc^X',
    'X^^^4^^^^5^^^^6^^^^X',
    'XXXXXXXXXXXXXXXXXXXX',
  ],
  doors: { 1: eraDoor(1), 2: eraDoor(2), 3: eraDoor(3), 4: eraDoor(4), 5: eraDoor(5), 6: eraDoor(6), 7: { to: 'guabersurat', at: [12, 5], look: 'portal', dir: 'left', keepRet: true } },
  o: {
    A: {
      s: 'prof', d: 'down', run: async () => {
        const done = [1, 2, 3, 4, 5, 6].filter(n => flag('era' + n)).length;
        if (flag('kelam')) { await say('PROF. MERANTI: Sejarah kita selamat. Terima kasih, {P}. Sang Kelembai kini menanti di hujung gua Batu Bersurat.'); return; }
        if (done === 6) { await say('PROF. MERANTI: Keenam-enam Cahaya Sejarah sudah pulih! Tapi lihat... Pendeta Kelam muncul di tengah lorong!'); return; }
        await say(`PROF. MERANTI: Kamu sudah memulihkan ${done} daripada 6 zaman. Masuk portal seterusnya dan rampas semula CAHAYA SEJARAH daripada Bayangan Masa!`);
        await say('PROF. MERANTI: Ingat, orang-orang di zaman itu tidak boleh melihat Bayangan Masa. Hanya kita yang datang dari masa depan boleh menghalang mereka.');
      }
    },
    N: {
      s: 'e3', d: 'down', show: () => flag('era6') && !flag('kelam'), run: async () => {
        await say('PENDETA KELAM: Jadi kamulah budak yang menggagalkan rancanganku di setiap zaman...');
        await say('PENDETA KELAM: Tanpa ingatan sejarah, manusia mudah dibentuk sesuka hati. Aku mahu memadamkan masa lalu supaya aku sahaja yang menulis masa depan!');
        await say('PENDETA KELAM: Tetapi kamu... kamu membawa Cahaya Sejarah kembali. Mari kita tentukan siapa yang benar!');
        Snd.music('ketua');
        const r = await fightTrainer({
          cls: 'Ketua Bayangan', name: 'PENDETA KELAM', look: 'e3', theme: 'masa', music: 'ketua', pay: 150, items: ['Ubat Penuh', 'Ubat Penuh', 'Pulih Penuh'],
          team: [['Jembalang', 70], ['Mahakukang', 70], ['Badakbesi', 71], ['Hulubalang', 71], ['Nagasura', 72], ['Nagaraja', 74]],
          lose: 'PENDETA KELAM: Mustahil... cahaya ini terlalu terang...'
        }, 'e3');
        if (r !== 'win') return;
        await say('PENDETA KELAM: Aku... aku faham sekarang. Sejarah bukan untuk dipadam atau diubah. Ia untuk dipelajari, supaya kita tidak mengulangi kesilapan.');
        await say('PENDETA KELAM: Aku akan pergi dan belajar semula dari awal. Maafkan aku...');
        setFlag('kelam');
        await say('Pendeta Kelam lenyap bersama kabus Bayangan Masa.');
        await say('PROF. MERANTI: Syabas, {P}! Kamu telah menyelamatkan sejarah Seberang Perai! Gua Batu Bersurat kini terang benderang...');
        await say('PROF. MERANTI: Dan lihat! Sesuatu sedang terjaga di hujung gua. SANG KELEMBAI, penjaga batu bersurat itu sendiri!');
        await give('Semangat Maks', 3);
        await UI.chapter('TAMAT', 'Sejarah Terpelihara');
      }
    },
  }
};

// ---------- Penjana peta zaman ----------
function eraMap(n, m) {
  const base = {
    name: ERA_NAMES[n], outdoor: true, era: n, music: 'laluan', nobike: true,
    doors: { 1: { to: 'lorongmasa', at: String(n), look: 'portal', dir: 'down' } },
    enter: async () => {
      if (!flag('eramasuk' + n)) { setFlag('eramasuk' + n); await UI.chapter('ZAMAN ' + n, ERA_NAMES[n]); if (m.intro) await say(m.intro); }
    },
  };
  const bossFlag = 'eraboss' + n;
  m.o = Object.assign({
    D: {
      s: 'e3', d: m.bossDir || 'down', show: () => !flag(bossFlag), run: async () => {
        await say(m.bossPre);
        const r = await fightTrainer({ cls: 'Panglima Bayangan', name: m.boss, look: 'e3', theme: 'masa', music: 'ketua', team: m.bossTeam, pay: 120, items: ['Ubat Hiper', 'Ubat Hiper'], lose: m.bossLose }, 'e3');
        if (r === 'win') { setFlag(bossFlag); await say('Panglima Bayangan itu lenyap menjadi kabus...'); }
      }
    },
    Z: {
      ball: 'cahaya', frag: undefined, show: () => !flag('era' + n), run: async () => {
        if (!flag(bossFlag)) { await say('Cahaya keemasan berdenyut... tetapi kabus hitam Bayangan Masa menyelubunginya. Kalahkan panglima mereka dahulu!'); return; }
        if (m.onOrb) await m.onOrb();
        Snd.sfx('catch');
        await say('{P} memulihkan CAHAYA SEJARAH zaman ini!');
        setFlag('era' + n);
        if (m.reward) await give(m.reward[0], m.reward[1]);
        await say('Cahaya itu terbang kembali ke Lorong Masa. Portal seterusnya kini terbuka.');
      }
    },
  }, m.o);
  return Object.assign(base, m);
}
const bay = (d, team, pre, lose, after) => ({ s: 'lanunb', d, tr: { cls: 'Bayangan', name: 'Masa', team, pre, lose, after, lanun: true, pay: 60, theme: 'masa' } });

MAPS.era1 = eraMap(1, {
  theme: 'pantai',
  intro: 'Kamu tiba di pesisir purba. Tiada bangunan, tiada jalan... hanya pondok, laut dan timbunan kulit kepah.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T~~~~sss.....,,,,,,,TT',
    'T~~~~sss.HHH.,,,,,,,TT',
    'T~~~~sss.HHH..a..rr.TT',
    'T~~~~sss..........r.TT',
    'T~~~~sss..A.....N...TT',
    'T~~~~sss............TT',
    'T~~~~sss..rr....I...TT',
    'T~~~~sss..rr........TT',
    'T~~~~sss...,,,,,....TT',
    'T~~~~sss...,,J,,.D..TT',
    'T~~~~sss...,,,,,..Z.TT',
    'T~~~~sss............TT',
    'T~~~~ssss1..........TT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: { grass: [['Siputpurba', 55, 58, 20], ['Belangkas', 55, 58, 20], ['Kepah', 55, 58, 20], ['Kerikil', 55, 58, 15], ['Korek', 55, 58, 15], ['Kelawar', 55, 58, 10]] },
  boss: 'KABUT', bossTeam: [['Amonit', 60], ['Belangkasraja', 60], ['Gunungbatu', 61]],
  bossPre: 'KABUT: Hah! Budak dari masa depan! Aku akan curi Cahaya Sejarah zaman ini. Biar manusia lupa asal-usul mereka!',
  bossLose: 'KABUT: Arghh! Kabutku tersingkap!', reward: ['Gula Ajaib', 2],
  o: {
    a: sign('Timbunan kulit kepah dan kerang ini kelak akan dikenali sebagai GUAR KEPAH.'),
    A: npc('nelayan', 'down', 'PENDUDUK: Setiap hari kami kutip kepah dan kerang di pantai. Kulitnya kami longgokkan sehingga menjadi bukit kecil!'),
    N: npc('pakcik', 'left', 'PENDUDUK: Kapak batu ini kami asah pada batu sungai. Dengannya kami menebang kayu untuk membina pondok.'),
    I: bay('left', [['Kerikil', 56], ['Siputpurba', 56]], 'BAYANGAN: Kau nampak aku? Mustahil! Orang zaman ini tak nampak kami!', 'Kabur... kabur...', 'Pendeta Kelam akan padam semua sejarah!'),
    J: bay('up', [['Belangkas', 57], ['Korek', 57], ['Kelawar', 57]], 'BAYANGAN: Tanpa sejarah, tiada siapa ingat siapa diri mereka!', 'Tidak!', 'Sejarah... sangat kuat...'),
  }
});
MAPS.era2 = eraMap(2, {
  theme: 'pantai',
  intro: 'Kapal-kapal dagang berlabuh di muara sungai. Bau rempah dan kayu gaharu memenuhi udara.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T~~~~~~~~~kk....^^^.TT',
    'T~~~~~~~~~kk....^^^.TT',
    'T~~~~~~~~~kkA...^^^.TT',
    'T~~~~~~~~~kk.....a..TT',
    'T~~~~~~~~~kk........TT',
    'T~~~~~~kkkkk..N.....TT',
    'T~~~~~~~~~kk....I...TT',
    'T~~~~~~~~~kk........TT',
    'T~~~~~~~~~ss..HHH...TT',
    'T~~~~~~~~~ss..HHH.J.TT',
    'T~~~~~~~~~ss........TT',
    'T~~~~~~~~~ss...D..Z.TT',
    'T~~~~~~~~~ss1.......TT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: { water: [['Duyung', 55, 58, 10], ['Kudalaut', 56, 60, 30], ['Oborraja', 56, 60, 30], ['Nagasura', 56, 58, 10], ['Tapaksulaiman', 56, 60, 20]] },
  boss: 'LESAP', bossTeam: [['Oborraja', 62], ['Nagalaut', 62], ['Serati', 62]],
  bossPre: 'LESAP: Pelabuhan Kedah Tua ini terlalu makmur. Kalau aku padamkan ia dari sejarah, tiada siapa akan tahu betapa hebatnya nenek moyang kamu!',
  bossLose: 'LESAP: Aku... lesap...', reward: ['Bola Ultra', 5],
  o: {
    a: sign('Di hulu Sungai Muda terdapat candi-candi LEMBAH BUJANG, bukti pengaruh Hindu-Buddha di Kedah Tua.'),
    A: npc('peniaga', 'right', 'PEDAGANG DARI INDIA: Kami belayar mengikut angin monsun ke pelabuhan Kedah untuk berdagang kain dan manik.'),
    N: npc('saintis', 'down', 'PEDAGANG DARI CHINA: Kami membawa tembikar dan sutera, dan membeli hasil hutan seperti damar dan gaharu.'),
    I: bay('left', [['Kudalaut', 58], ['Oborobor', 58]], 'BAYANGAN: Kapal-kapal ini akan tenggelam dalam lupa!', 'Karam!', 'Tuan Lesap ada di tepi pantai.'),
    J: bay('left', [['Serati', 59], ['Kepahgergasi', 59]], 'BAYANGAN: Berani kau ganggu kami!', 'Aduh!', 'Pendeta Kelam tak akan berhenti.'),
  }
});
MAPS.era3 = eraMap(3, {
  theme: 'pantai',
  intro: 'Kuala Perai, tahun 1800. Sebuah kapal berlabuh. Pegawai-pegawai sedang berbincang tentang sebuah perjanjian.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TT..HHHH......~~~~~~~T',
    'TT..HHHH..a...~~~~~~~T',
    'TT..........kkk~~~~~~T',
    'TT..A.......kkkddd~~~T',
    'TT..........kkk~~~~~~T',
    'TT.....N....ss~~~~~~~T',
    'TT..........ss~~~~~~~T',
    'TT..,,,,,...ss~~~~~~~T',
    'TT..,,I,,...ss~~~~~~~T',
    'TT..,,,,,..Jss~~~~~~~T',
    'TT......D...ss~~~~~~~T',
    'TT.....Z....ss~~~~~~~T',
    'TT1.........ss~~~~~~~T',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: { grass: [['Musangraja', 58, 60, 20], ['Kucingraja', 58, 60, 20], ['Helang', 58, 61, 20], ['Tedung', 58, 60, 20], ['Biawakraja', 58, 60, 20]] },
  boss: 'SURAM', bossTeam: [['Helang', 63], ['Tedung', 63], ['Musangraja', 64]], bossDir: 'up',
  bossPre: 'SURAM: Tahun 1800 ialah titik penting sejarah Seberang Perai. Kalau aku padamkannya, tiada siapa tahu bagaimana tanah ini bermula!',
  bossLose: 'SURAM: Suram... menjadi terang...', reward: ['Ubat Penuh', 3],
  o: {
    a: sign('KUALA PERAI, 1800. Selepas perjanjian ini, jalur tanah besar ini dinamakan PROVINCE WELLESLEY.'),
    A: npc('pakcik', 'down', 'PEGAWAI KEDAH: Menurut perjanjian tahun 1800, jalur tanah ini diserahkan kepada Syarikat Hindia Timur Inggeris. Kelak ia dikenali sebagai Seberang Perai.'),
    N: npc('nelayan', 'left', 'NELAYAN: Siapa pun yang memerintah, kami tetap turun ke laut setiap pagi. Laut inilah nyawa kampung kami.'),
    I: bay('right', [['Tedung', 60], ['Helang', 60]], 'BAYANGAN: Koyakkan perjanjian! Padamkan tarikh!', 'Tidak jadi...', 'Sejarah tak boleh dikoyak rupanya.'),
    J: bay('left', [['Biawakraja', 61], ['Kucingraja', 61]], 'BAYANGAN: Hei! Kembali ke zaman kau!', 'Uhh...', 'Tuan Suram di selatan.'),
  }
});
MAPS.era4 = eraMap(4, {
  theme: 'rumput', tileTheme: 'tebu',
  intro: 'Ladang tebu terbentang luas. Asap naik dari cerobong kilang gula. Pekerja pelbagai kaum sibuk menuai.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TTpppppp..WWWWW..pppTT',
    'TTpppppp..WWWWW..pppTT',
    'TTpppppp..WWWWW..pppTT',
    'TT.........A......a.TT',
    'TTpppp..........ppppTT',
    'TTpppp..HHH..N..ppppTT',
    'TTpppp..HHH.....ppppTT',
    'TT..........I.......TT',
    'TTpppppp....pppppp..TT',
    'TTpppppp..J.pppppp..TT',
    'TT..........D....Z..TT',
    'TT..................TT',
    'TT........1.........TT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: { grass: [['Periukkera', 60, 63, 20], ['Bungabangkai', 60, 63, 20], ['Tikusraya', 60, 62, 20], ['Belalang', 60, 62, 15], ['Kumbang', 60, 62, 15], ['Seladang', 60, 62, 10]] },
  boss: 'KELABU', bossTeam: [['Periukkera', 65], ['Belalang', 65], ['Seladang', 66]],
  bossPre: 'KELABU: Kalau kisah ladang ini dilupakan, tiada siapa ingat bagaimana masyarakat pelbagai kaum di sini bermula!',
  bossLose: 'KELABU: Warnanya kembali...', reward: ['Batu Api', 1],
  o: {
    a: sign('Tebu dari ladang ini diproses menjadi gula di kilang. Industri gula pernah menjadi nadi ekonomi Seberang Perai.'),
    A: npc('pakcik', 'down', 'PEKERJA LADANG: Tebu dipotong, diikat dan dibawa ke kilang. Di sana ia diperah dan dimasak menjadi gula.'),
    N: npc('makcik', 'down', 'PEKERJA LADANG: Di sini kami bekerja bersama: orang Melayu, Cina dan India. Susah senang kita kongsi bersama.'),
    I: bay('down', [['Bungabangkai', 62], ['Tikusraya', 62]], 'BAYANGAN: Kilang ini akan hilang dari ingatan!', 'Manisnya kemenangan kau...', 'Tuan Kelabu berhampiran.'),
    J: bay('up', [['Kumbang', 63], ['Belalang', 63]], 'BAYANGAN: Aku sembunyi dalam ladang tebu! Hehe!', 'Kena tangkap!', 'Pendeta Kelam...'),
  }
});
MAPS.era5 = eraMap(5, {
  theme: 'malam',
  intro: 'Butterworth, Disember 1941. Siren berbunyi. Langit merah. Penduduk bergegas mencari perlindungan.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TT.HHHH..HHHH..HHHH.TT',
    'TT.HHHH..HHHH..HHHH.TT',
    'TT......A......a....TT',
    'TT------------------TT',
    'TT..r.....N....dd...TT',
    'TT..rr.........d....TT',
    'TT.......I..........TT',
    'TT.BBBB......BBBB...TT',
    'TT.BBBB..J...BBBB...TT',
    'TT..........D.......TT',
    'TT......r......Z....TT',
    'TT..................TT',
    'TT.1................TT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: {},
  boss: 'GELAP', bossTeam: [['Jerebu', 66], ['Keluang', 66], ['Pelesit', 66], ['Lumpurbisa', 67]],
  bossPre: 'GELAP: Dalam kekacauan perang, mudah untuk aku curi cahaya sejarah. Biar tiada siapa ingat betapa tabahnya rakyat!',
  bossLose: 'GELAP: Cahaya... terlalu terang...', reward: ['Semangat Maks', 2],
  o: {
    a: sign('BUTTERWORTH, DISEMBER 1941. Lapangan terbang dibom ketika tentera Jepun menyerang Tanah Melayu.'),
    A: npc('jururawat', 'down', 'JURURAWAT: Cepat, ke tempat perlindungan! Bawa kanak-kanak dan orang tua dahulu!'),
    N: npc('pakcik', 'right', 'PENDUDUK: Masa ini sangat sukar. Tapi kita akan saling membantu. Kita pasti dapat melaluinya bersama.'),
    I: bay('down', [['Jerebu', 64], ['Asap', 64]], 'BAYANGAN: Kabus perang ialah tempat kami bersembunyi!', 'Kabus tersingkap!', 'Tuan Gelap di tengah pekan.'),
    J: bay('right', [['Pelesit', 65], ['Keluang', 65]], 'BAYANGAN: Kau tak patut berada di sini!', 'Arghh!', 'Kau tak akan menang melawan Pendeta!'),
  }
});
MAPS.era6 = eraMap(6, {
  theme: 'bandar',
  intro: 'Bukit Mertajam, 31 Ogos 1957. Bendera berkibar. Penduduk berkumpul di padang, menanti siaran radio yang bersejarah.',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'TT.HHHH..HHHH..HHHH.TT',
    'TT.HHHH..HHHH..HHHH.TT',
    'TT..................TT',
    'TT..A...ffffff...N..TT',
    'TT......f....f......TT',
    'TT..O...f.Z..f..U...TT',
    'TT......f....f......TT',
    'TT..i...ffffff...l..TT',
    'TT.........D........TT',
    'TT...I.........J....TT',
    'TT..................TT',
    'TT..................TT',
    'TT........1.........TT',
    'TTTTTTTTTTTTTTTTTTTTTT',
  ],
  enc: {},
  boss: 'SENYAP', bossTeam: [['Mahakukang', 68], ['Hulubalang', 68], ['Nagaserpa', 68], ['Badakbesi', 69]], bossDir: 'up',
  bossPre: 'SENYAP: Aku telah memotong wayar radio itu! Tiada siapa akan mendengar laungan kemerdekaan. Biar hari ini dilupakan!',
  bossLose: 'SENYAP: Suara... mereka... terlalu kuat...', reward: ['Gula Ajaib', 3],
  onOrb: async () => {
    await say('{P} menyambung semula wayar radio...');
    await wait(.6);
    Snd.sfx('level');
    await say('RADIO: "...Merdeka! Merdeka! Merdeka! Merdeka! Merdeka! Merdeka! Merdeka!"');
    await say('PENDUDUK: MERDEKA! MERDEKA! MERDEKA!');
    await say('Seluruh padang bergema dengan sorakan. Hari itu, 31 Ogos 1957, Persekutuan Tanah Melayu mencapai kemerdekaan.');
  },
  o: {
    A: npc('pakcik', 'down', 'PENDUDUK: Cepat, berkumpul dekat radio! Hari ini Tunku Abdul Rahman akan mengisytiharkan kemerdekaan di Kuala Lumpur!'),
    N: npc('pelajar', 'down', 'GURU: Kemerdekaan dicapai melalui rundingan dan perpaduan semua kaum. Itulah pengajaran paling penting untuk kamu, anak-anak.'),
    O: npc('makcik', 'right', 'Mak cik dah jahit bendera baharu semalam! Tengok, berkibar indah!'),
    U: npc('budak', 'left', 'Ayah kata lepas hari ini, kita tentukan masa depan kita sendiri!'),
    i: npc('atuk', 'up', 'Atuk tak sangka dapat hidup sampai hari bersejarah ini...'),
    l: npc('gadis2', 'up', 'Radio senyap! Kenapa radio senyap?!', { show: () => !flag('era6') }),
    I: bay('up', [['Hulubalang', 66], ['Kerbausakti', 66]], 'BAYANGAN: Senyap! Semua orang mesti senyap!', 'Suara aku hilang...', 'Tuan Senyap di tengah padang.'),
    J: bay('up', [['Mahakukang', 67], ['Jembalang', 67]], 'BAYANGAN: Laungan itu tak boleh kedengaran!', 'Tidakkk!', 'Radio itu... tak boleh dibiarkan berbunyi!'),
  }
});
