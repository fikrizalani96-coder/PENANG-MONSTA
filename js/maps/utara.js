'use strict';
// ===== Peta utara: Penaga, Guar Perahu, Hutan Bakau, Teluk Ayer Tawar, Guar Kepah, Kepala Batas =====
MAPS.penaga = {
  name: 'Penaga', outdoor: true, theme: 'pantai', border: 'T',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTT',
    'T~~~s...............TT',
    'T~~~s..HHHH...HHHH..TT',
    'T~~~s..HHHH...HHHH..TT',
    'T~~~s..H1HH...HH2H..TT',
    'T~~~s..a.........q..TT',
    'T~~~s...............TT',
    'T~~~s..ff......ff...TT',
    'T~~~s...BBBBBBB.....TT',
    'T~~~s...BBBBBBB.....TT',
    'T~~~s...BBBBBBB..N..TT',
    'T~~~s...BBB3BBB.....TT',
    'T~~~s.......y.......TT',
    'T~~~ss..............TT',
    'T~~~ss..A...........TT',
    'T~~~ss.fff....fff...TT',
    'TTTTTTTTTTZZTTTTTTTTTT',
    'TTTTTTTTTT==TTTTTTTTTT',
  ],
  conn: { s: 'laluan1' },
  fly: [8, 5],
  doors: { 1: { to: 'rumah_pemain' }, 2: { to: 'rumah_johan' }, 3: { to: 'makmal' } },
  enc: { water: [['Oborobor', 30, 40, 60], ['Tapaksulaiman', 30, 40, 40]], fish: [['Bilis', 5, 10, 60], ['Kepah', 8, 12, 20], ['Sepat', 5, 10, 20]] },
  o: {
    a: sign('RUMAH {P}'),
    q: sign('RUMAH {R}'),
    y: sign('MAKMAL MONSTA PROFESOR MERANTI'),
    N: sign('PENAGA\nPekan yang tenang di hujung utara Seberang Perai.'),
    A: npc('gadis', 'down', 'Teknologi sungguh hebat! Kita boleh menyimpan Monsta dalam komputer di Klinik Monsta!', { move: 'wander' }),
    Z: {
      u: '=', if: () => !flag('starter'), trig: async () => {
        await say('???: Hei! Tunggu! Jangan pergi!');
        await walk('P', 'u');
        await say('PROF. MERANTI: Fuh... Nasib baik sempat! Bahaya! Monsta liar tinggal di dalam rumput tinggi di luar pekan!');
        await say('PROF. MERANTI: Kamu perlukan Monsta sendiri untuk melindungi diri. Ikut atuk ke makmal!');
        await fadeTo(1, 4);
        S.ret = { map: 'penaga', x: 11, y: 12 };
        World.load('makmal', 5, 4, 'up');
        await fadeTo(0, 4);
        await say('{R}: Atuk! Saya dah bosan menunggu!');
        await say('PROF. MERANTI: {R}? Oh ya, atuk suruh kamu datang tadi. Tunggu sebentar!');
        await say('PROF. MERANTI: {P}, ada tiga Monsta di atas meja itu. Semuanya tersimpan dalam BOLA TANGKAP.');
        await say('PROF. MERANTI: Atuk dah tua, jadi atuk tak bertarung lagi. Kamu boleh ambil satu. Pilihlah!');
        await say('{R}: Hei! Atuk! Saya pun nak juga!');
        await say('PROF. MERANTI: Bersabar, {R}! Kamu pun boleh pilih nanti.');
        setFlag('lab_intro');
      }
    }
  }
};

MAPS.laluan1 = {
  name: 'Laluan 1', outdoor: true,
  tiles: [
    'TTTTTTTTT..TTTTTTTTT',
    'TT.......==.......TT',
    'TT.,,,,..==..,,,,.TT',
    'TT.,,,,..==..,,,,.TT',
    'TT.,,,,..==..,,,,.TT',
    'TT.......==.......TT',
    'TTLLLLLLL==LLLL...TT',
    'TT.......==.......TT',
    'TT..A....==....,,,TT',
    'TT,,,....==....,,,TT',
    'TT,,,....==....,,,TT',
    'TT,,,....==....,,,TT',
    'TT.......==.......TT',
    'TTTTT....==....TTTTT',
    'TT,,,,...==...,,,,TT',
    'TT,,,,...==...,,,,TT',
    'TT.......==.......TT',
    'TT...LLLL==LLLLLLLTT',
    'TT.......==.......TT',
    'TT..,,,,.==.,,,,..TT',
    'TT..,,,,.==.,,,,..TT',
    'TT..,,,,.==.,,,,..TT',
    'TT.......==....a..TT',
    'TTTT.....==.....TTTT',
    'TT.......==.......TT',
    'TT.,,,...==...,,,.TT',
    'TT.,,,...==...,,,.TT',
    'TT.......==.......TT',
    'TTLLLLL..==..LLLLLTT',
    'TT.......==.......TT',
    'TT.......==.......TT',
    'TTTTTTTTT..TTTTTTTTT',
  ],
  conn: { n: 'penaga', s: 'guarperahu' },
  enc: { grass: [['Pipit', 2, 5, 45], ['Mencit', 2, 4, 35], ['Cicak', 3, 4, 15], ['Ulatdaun', 3, 3, 5]] },
  o: {
    a: sign('LALUAN 1\nPenaga — Guar Perahu'),
    A: {
      s: 'peniaga', d: 'down', run: async () => {
        if (flag('sampel')) { await say('Kedai Monsta di Guar Perahu ada jual BOLA TANGKAP dan UBAT. Singgahlah!'); return; }
        await say('Hai! Saya bekerja di KEDAI MONSTA Guar Perahu.');
        await say('Kami ada promosi! Ambil sampel percuma ini!');
        setFlag('sampel'); await give('Ubat');
      }
    }
  }
};

MAPS.guarperahu = {
  name: 'Guar Perahu', outdoor: true,
  tiles: [
    'TTTTTTTTTTT..TTTTTTTTTTTTT',
    'TT.........==...........TT',
    'TT.HHHH....==....GGGGGG.TT',
    'TT.HHHH....==....GGGGGG.TT',
    'TT.HH1H....==....GGGGGG.TT',
    'TT.........==....GG3GGG.TT',
    'TT...a.....==.......q...TT',
    'TTT........==...........TT',
    '.DV==========...........TT',
    'TTT.J......==...........TT',
    'TTTT.....PPPPP..MMMM....TT',
    'TTTT.....PPPPP..MMMM....TT',
    'TTTT.....PPPPP..MM4M....TT',
    'TTTT.....PP2PP..........TT',
    'TTTT.......==...........TT',
    'TTTT.ff....==.....HHHH..TT',
    'TTTT.......==.....HHHH..TT',
    'TTTT...y...==.....HH5H..TT',
    'TTTT.......==..N........TT',
    'TTTT..fff..==..fff......TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan1', w: 'laluan2' },
  fly: [11, 14],
  doors: {
    1: house({ A: npc('makcik', 'down', 'Budak-budak zaman sekarang semua nak jadi jurulatih Monsta. Zaman mak cik dulu, kami main congkak je!'), I: npc('budak', 'up', 'Saya nak jadi macam Ketua Gim! Tapi gim Guar Perahu selalu tutup...') }),
    2: KLINIK,
    3: { to: 'gim8', lock: () => badges() < 7, lockText: 'Pintu gim berkunci. Ada nota: "Ketua Gim sedang berurusan di luar."' },
    4: Object.assign(shop(['Bola Tangkap', 'Ubat', 'Penawar', 'Ubat Lumpuh', 'Ubat Bakar']), { parcel: true }),
    5: house({ A: npc('pakcik', 'right', 'Kamu tahu? Monsta boleh jadi lebih kuat melalui evolusi. Ada yang berevolusi dengan naik tahap, ada yang perlukan batu khas.'), D: npc('gadis', 'left', 'Kalau Monsta kamu keracunan, gunakan PENAWAR ya!') }),
  },
  o: {
    a: sign('GUAR PERAHU\nKampung hijau di persimpangan jalan.'),
    q: sign('GIM MONSTA GUAR PERAHU\nKetua: ???'),
    y: sign('PETUA: Tekan ENTER (atau butang MENU) untuk membuka menu. Simpan permainan selalu!'),
    N: npc('budak2', 'down', 'Dengar cerita, ketua gim Guar Perahu ni orang kaya. Tapi tak pernah ada orang nampak dia!', { move: 'wander' }),
    D: npc('atuk', 'right', 'TOK ABU: Hoi! Jalan ni tempat Tok berehat! Tok belum minum kopi pagi ni, jadi Tok tak benarkan sesiapa lalu. Hmph!', { u: '=', show: () => !flag('dex') }),
    J: {
      s: 'atuk', d: 'down', show: () => flag('dex'), run: async () => {
        await say('TOK ABU: Ahh, Tok dah minum kopi. Segar rasanya! Maaf pasal tadi ya.');
        if (await UI.yes('TOK ABU: Kamu nak Tok ajar cara menangkap Monsta?')) {
          await say('TOK ABU: Mula-mula, lemahkan Monsta liar dengan bertarung. Jangan sampai ia pengsan!');
          await say('TOK ABU: Kemudian buka BEG dan baling BOLA TANGKAP. Lebih rendah HP-nya, lebih mudah ditangkap.');
          await say('TOK ABU: Monsta yang tidur atau lumpuh pun lebih senang ditangkap. Faham?');
        } else await say('TOK ABU: Hah, orang muda sekarang semua dah pandai!');
      }
    },
    V: {
      u: '=', if: () => flag('dex') && !flag('rival2'), trig: async () => {
        await say('{R}: Hei! {P}! Kamu nak ke Hutan Bakau juga?');
        await say('{R}: Aku dah tangkap Monsta baru. Mari aku tunjuk betapa hebatnya aku!');
        const r = await Story.rivalFight(2, null, '{R}: Apa?! Tak mungkin! Kamu cuma bernasib baik!');
        if (r === 'win') {
          await say('{R}: Hmph! Aku dengar ada GIM di Teluk Ayer Tawar. Aku akan dapat lencana dulu daripada kamu! Tata!');
          setFlag('rival2');
        }
      }
    }
  }
};

MAPS.gim8 = gymMap('Gim Guar Perahu', 'r', {
  A: gymLeader(7, {
    s: 'datuk', name: 'DATUK GARANG',
    pre: 'DATUK GARANG: Hahaha! Akhirnya kamu sampai juga, budak! Ya, akulah KETUA GIM GUAR PERAHU... dan juga ketua GENG LANUN!',
    team: [['Badak', 45], ['Pengorek', 42], ['Tenggiraja', 44], ['Buaya', 45], ['Badakbesi', 50]], items: ['Ubat Hiper', 'Ubat Hiper'],
    lose: 'DATUK GARANG: Ha! Pertarungan yang hebat. Aku kalah... Kamu layak menerima LENCANA BUMI.',
    badgeText: 'DATUK GARANG: Dengan LENCANA BUMI, kamu kini mempunyai lapan lencana. Laluan Kemenangan di Bukit Mertajam sedang menunggu kamu.',
    after: 'DATUK GARANG: Geng Lanun sudah dibubarkan. Aku akan mengembara dan berlatih semula... seorang diri.',
    won: async () => {
      await say('DATUK GARANG: Tiga kali aku kalah dengan kamu. Mungkin aku sudah lupa... bahawa Monsta bukan barang dagangan.');
      await say('DATUK GARANG: Mulai hari ini, GENG LANUN dibubarkan! Aku akan mengembara untuk mencari semula erti sebenar jurulatih Monsta.');
      setFlag('lanun_bubar');
    }
  }),
  I: trainer('ahli', 'down', 'Jurulatih Cekap', 'Rahim', [['Biawakraja', 40], ['Tenggiraja', 40]], 'Kamu sampai ke gim terakhir? Hebat. Tapi berhenti di sini!', 'Tak sangka!', 'Ketua gim ini ada rahsia besar...'),
  J: trainer('lanun', 'right', 'Lanun', 'Kanan', [['Buaya', 41], ['Pengorek', 41]], 'Kamu budak yang musnahkan rancangan Bos?!', 'Bos... maafkan saya.', 'Bos tunggu kamu di hujung gim.', { tr: { lanun: true } }),
  N: trainer('ahli', 'left', 'Jurulatih Cekap', 'Norman', [['Gunungbatu', 42], ['Badakbesi', 42]], 'Tanah bergegar di bawah kaki kamu!', 'Gempa!', 'Jenis AIR, RUMPUT dan AIS berkesan melawan TANAH.'),
  U: gymGuide('Tanah', 'Ketua gim ini guna Monsta jenis TANAH. Serangan AIR, RUMPUT dan AIS sangat berkesan. Monsta ELEKTRIK tak berguna di sini!'),
});

MAPS.laluan2 = {
  name: 'Laluan 2', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TTT....,,,,,,,....TT',
    'TT.....,,,,,,,....TT',
    'TT..=============...',
    'TT..=....,,,,,....TT',
    'TT..=....,,,,,..a.TT',
    'TT,,=,,..,,,,,....TT',
    'TT,,=,,...........TT',
    'TT,,=,,..TTTTTTTTTTT',
    'TT..=....TTTTTTTTTTT',
    'TTLL=LLLLTTTTTTTTTTT',
    'TT..=....TTTTTTTTTTT',
    'TT..=.,,,TTTTTTTTTTT',
    'TT..=.,,,TTTTTTTTTTT',
    'TT,,=....TTTTTTTTTTT',
    'TT,,=..A.TTTTTTTTTTT',
    'TT..=....TTTTTTTTTTT',
    'TTTT==TTTTTTTTTTTTTT',
  ],
  conn: { e: 'guarperahu', s: 'hutanbakau' },
  enc: { grass: [['Pipit', 3, 5, 30], ['Mencit', 3, 5, 30], ['Kerengga', 3, 5, 15], ['Ulatdaun', 3, 5, 15], ['Cicak', 4, 5, 10]] },
  o: {
    a: sign('LALUAN 2\nGuar Perahu — Hutan Bakau'),
    A: npc('pendaki', 'up', 'Hutan Bakau di selatan sana sangat redup. Ramai Pemburu Serangga suka berkumpul di situ.')
  }
};

MAPS.hutanbakau = {
  name: 'Hutan Bakau', outdoor: true, tileTheme: 'bakau', music: 'gua', theme: 'rumput',
  tiles: [
    'TTTT..TTTTTTTTTTTTTTTT',
    'TTTT..,,,,,,,,,,,,TTTT',
    'TTa...,,,,,,,,,,,,TTTT',
    'TT..TTTTTTTTTTT,,,TTTT',
    'TT..T.......A.T,,,TTTT',
    'TT..T.TTTTTTT.T,,,TTTT',
    'TT,,T.T,,,,,T.T...TTTT',
    'TT,,T.T,,I,,T.TTT.TTTT',
    'TT,,T.T,,,,,T.....TTTT',
    'TT,,T.TTT,TTT.TTTTTTTT',
    'TT,,T.....,...TTTTTTTT',
    'TT,,TTTTTTTT..TTTTTTTT',
    'TT,,,,,,,,,T..,,,,,,TT',
    'TT,,,,,,,,,T..,,,,,,TT',
    'TTTTTTT,,,,T..,,TT,,TT',
    'TT..D..,,,,...,,TT,,TT',
    'TT.TTTTTTTTTTTTTTT,,TT',
    'TT.T..,,,,,,,,,,,,,,TT',
    'TT.T..,,,,,,,,,,,,,,TT',
    'TT.T..TTTTTTTTTTTTTTTT',
    'TT.T..T,,,,,,,,,,,TTTT',
    'TT.T..T,,N,,,,,,,,TTTT',
    'TT.T..T,,,,,,TTT,,TTTT',
    'TT....T,,,,,,T.J,,TTTT',
    'TTTT..T,,,,,,T..,,TTTT',
    'TTTT..........T.,,TTTT',
    'TTTT..,,,,,,..T....TTT',
    'TTTTTTTTTTTT..T....TTT',
    'TTTTTTTTTTTT..q...TTTT',
    'TTTTTTTTTTTTTTTT..TTTT',
  ],
  conn: { n: 'laluan2', s: 'telukayertawar' },
  enc: { grass: [['Ulatdaun', 3, 5, 25], ['Kepompong', 4, 6, 15], ['Kerengga', 3, 5, 25], ['Tupaikilat', 3, 5, 5], ['Kelip', 4, 6, 10], ['Pipit', 4, 6, 15], ['Cicak', 4, 5, 5]] },
  o: {
    a: sign('HUTAN BAKAU\nJaga kebersihan hutan paya bakau. Ia rumah kepada Monsta!'),
    q: sign('Teluk Ayer Tawar di hadapan.'),
    A: trainer('budak2', 'left', 'Pemburu Serangga', 'Amir', [['Ulatdaun', 6], ['Kerengga', 6]], 'Hei! Kamu ada Monsta! Jom bertarung!', 'Alamak! Monsta serangga saya kalah!', 'Monsta serangga membesar dengan cepat. Tunggulah nanti!'),
    D: trainer('budak2', 'right', 'Pemburu Serangga', 'Hakimi', [['Kerengga', 7], ['Kepompong', 7], ['Kerengga', 7]], 'Hutan ni tempat terbaik untuk tangkap serangga! Tengok koleksi aku!', 'Oh tidak! Koleksi aku...', 'Aku akan tangkap lebih banyak serangga!'),
    N: trainer('budak2', 'down', 'Pemburu Serangga', 'Syafiq', [['Kelip', 8], ['Ulatdaun', 8]], 'Kelip-kelip aku bercahaya di waktu malam! Cantik kan?', 'Cahayanya malap...', 'Kelip suka tempat yang lembap macam hutan bakau.'),
    I: item('Ubat'),
    J: item('Bola Tangkap', 2),
  }
};

MAPS.telukayertawar = {
  name: 'Teluk Ayer Tawar', outdoor: true, theme: 'pantai',
  tiles: [
    'TTTTTTTTTT..TTTTTTTTTTTTTT',
    'T~~~~sss..==...........TTT',
    'T~~~~sss..==...GGGGGG..TTT',
    'T~~~~sss..==...GGGGGG..TTT',
    'T~~~~sss..==...GGGGGG..TTT',
    'T~~~~sss..==...GG1GGG..TTT',
    'T~~kkkss.a==.......q...TTT',
    'T~~Nkkss..=============D==',
    'T~~~~sss..==...........TTT',
    'T~~~~sss..==..HHHH.....TTT',
    'T~~~~sss..==..HHHH.....TTT',
    'T~~~~sss..==..HH4H.....TTT',
    'T~~~~sss..==...........TTT',
    'T~~~~sss..==.PPPPP.MMMM.TT',
    'T~~~~sss..==.PPPPP.MMMM.TT',
    'T~~~~sss..==.PPPPP.MM3M.TT',
    'T~~~~sss..==.PP2PP......TT',
    'T~~~~sss..==...........TTT',
    'T~~~~sss..HHHH..y......TTT',
    'T~~~~sss..HHHH.........TTT',
    'T~~~~sss..HH5H...A.....TTT',
    'T~~~~sss...............TTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'hutanbakau', e: 'laluan3' },
  fly: [15, 17],
  doors: {
    1: { to: 'gim1' }, 2: KLINIK,
    3: shop(['Bola Tangkap', 'Ubat', 'Ubat Nyamuk', 'Tali Keluar', 'Penawar', 'Ubat Bangun', 'Ubat Lumpuh']),
    4: house({ A: npc('nelayan', 'down', 'Dulu Teluk Ayer Tawar terkenal dengan ikan dan udang. Sekarang ramai jurulatih datang nak cabar Abang Kamal!'), I: npc('budak', 'up', 'Abang Kamal tu kuat! Monsta batu dia keras gila!') }),
    5: house({ A: npc('makcik2', 'right', 'Kalau kamu nak ke Kepala Batas, ikut Laluan 3 ke timur. Tapi kena lalu Tapak Arkeologi Guar Kepah dulu.'), D: npc('atuk', 'left', 'Di Guar Kepah, orang jumpa rangka manusia berusia 5,000 tahun! Tapi Tok dengar ada penjahat menggali di sana sekarang...') }),
  },
  enc: { water: [['Oborobor', 20, 30, 50], ['Tapaksulaiman', 20, 30, 30], ['Kudalaut', 20, 28, 20]], fish: [['Bilis', 5, 12, 50], ['Sepat', 5, 12, 25], ['Kepah', 8, 14, 15], ['Ketam', 8, 14, 10]] },
  o: {
    a: sign('TELUK AYER TAWAR\nKampung nelayan di tepi Selat.'),
    q: sign('GIM TELUK AYER TAWAR\nKetua: ABANG KAMAL\n"Jurulatih sekeras batu karang!"'),
    y: sign('PETUA: Monsta jenis AIR dan RUMPUT sangat berkesan melawan jenis BATU!'),
    A: npc('makcik', 'down', 'Abang Kamal tu dulu nelayan. Sekarang dia kumpul Monsta batu dari pantai.', { move: 'wander' }),
    D: npc('budak', 'left', 'Kamu nak ke Laluan 3? Kalahkan dulu ABANG KAMAL di gim! Itu peraturan kampung ini!', { u: '=', show: () => !S.badges.includes(0) }),
    N: {
      s: 'nelayan', d: 'left', u: 'k', run: async () => {
        if (flag('joran')) { await say('NELAYAN: Kalau jumpa air, cubalah memancing guna JORAN BURUK dari BEG kamu!'); return; }
        await say('NELAYAN: Hari ni ikan tak makan umpan langsung... Hmm, kamu jurulatih Monsta ya?');
        await say('NELAYAN: Ambillah joran lama pak cik ni. Monsta air suka makan umpan!');
        setFlag('joran'); await give('Joran Buruk');
      }
    }
  }
};
MAPS.gim1 = gymMap('Gim Teluk Ayer Tawar', 'r', {
  A: gymLeader(0, {
    s: 'ketua1', name: 'ABANG KAMAL',
    pre: 'ABANG KAMAL: Selamat datang! Aku Abang Kamal, Ketua Gim Teluk Ayer Tawar. Aku percaya pada pertahanan yang teguh seperti batu karang! Monsta jenis BATU aku tak akan tumbang dengan mudah. Mari!',
    team: [['Kerikil', 12], ['Ularbatu', 14]], items: ['Ubat'],
    lose: 'ABANG KAMAL: Aku silap menilai kamu. Kamu memang layak menerima LENCANA KERANG!',
    badgeText: 'ABANG KAMAL: Dengan LENCANA KERANG, Monsta kamu akan lebih yakin. Teruskan ke Kepala Batas di timur!',
    after: 'ABANG KAMAL: Dunia Monsta sangat luas. Masih ramai jurulatih kuat di Seberang Perai!', reward: ['Ubat Super', 2]
  }),
  I: trainer('pendaki', 'down', 'Pendaki', 'Aman', [['Kerikil', 9], ['Tenggiling', 9]], 'Berhenti! Kamu masih jauh untuk mencabar Abang Kamal!', 'Batu aku pecah...', 'Abang Kamal lebih kuat daripada aku. Hati-hati!'),
  U: gymGuide('Batu', 'Abang Kamal guna Monsta jenis BATU. Serangan jenis AIR dan RUMPUT sangat berkesan! Jenis API dan TERBANG pula kurang berkesan.'),
});

MAPS.laluan3 = {
  name: 'Laluan 3', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT,,,,,,....TTTTTT....,,,,,,,,..TTTT',
    'TT,,,,,,..A.TTTTTT..D.,,,,,,,,..TTTT',
    'TT,,,,,,....TTTTTT....,,,,,,,,..TTTT',
    'TT..........TTTTTT..........,,...TTT',
    'TTLLLLLL.......................a..TT',
    '......==============================',
    'TT..........,,,,,,....I.....,,,,..TT',
    'TT..N.......,,,,,,..........,,,,..TT',
    'TT,,,,,,....,,,,,,..TTTT....,,,,..TT',
    'TT,,,,,,..J.......q.TTTT..O.....,,TT',
    'TT,,,,,,..........,.TTTT.......,,,TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'telukayertawar', e: 'guarkepah' },
  enc: { grass: [['Pipit', 6, 9, 25], ['Mencit', 6, 9, 20], ['Anakular', 6, 9, 15], ['Tenggiling', 7, 9, 15], ['Pakma', 7, 9, 10], ['Comel', 7, 9, 10], ['Cicak', 7, 9, 5]] },
  o: {
    a: sign('LALUAN 3\nTeluk Ayer Tawar — Tapak Arkeologi Guar Kepah'),
    A: trainer('budak', 'down', 'Budak Sekolah', 'Amin', [['Mencit', 11], ['Anakular', 11]], 'Cikgu kata jangan bercakap dengan orang asing. Tapi bertarung boleh!', 'Aduh, kalah pula!', 'Esok aku nak ponteng sekolah untuk berlatih. Eh, jangan bagitau cikgu!'),
    D: trainer('gadis', 'down', 'Gadis', 'Mira', [['Pipit', 10], ['Comel', 10]], 'Hai! Monsta aku comel, tapi jangan pandang rendah!', 'Comelnya pun tak menolong...', 'Nanti aku nak tangkap Monsta yang lebih comel!'),
    I: trainer('budak2', 'up', 'Pemburu Serangga', 'Hafiz', [['Kerengga', 10], ['Kepompong', 10], ['Ulatdaun', 10]], 'Serangga aku dah bersedia!', 'Serangga aku semua pengsan!', 'Kepompong akan jadi Ramarama yang cantik nanti.'),
    N: trainer('budak', 'right', 'Budak Sekolah', 'Irfan', [['Tenggiling', 11], ['Mencit', 11]], 'Hei! Pandang aku ke tu? Jom lawan!', 'Tak adil!', 'Tenggiling aku akan lebih keras lepas ni!'),
    J: trainer('gadis2', 'up', 'Gadis', 'Farah', [['Pakma', 12], ['Cicak', 12]], 'Bunga Pakma aku mekar hari ini. Jom bertarung!', 'Layu...', 'Pakma suka keluar waktu malam.'),
    O: trainer('budak2', 'left', 'Pemburu Serangga', 'Zul', [['Ramarama', 11], ['Tebuan', 11]], 'Sayap Ramarama aku berkilat! Terima serbuknya!', 'Wah, hebatnya kamu!', 'Serangga yang berevolusi lebih cepat daripada Monsta lain.'),
    q: item('Ubat')
  }
};

MAPS.guarkepah = {
  name: 'Tapak Arkeologi Guar Kepah', cave: true, theme: 'gua', tileTheme: 'gali', border: 'x', under: 'c', escape: true, music: 'gua',
  tiles: [
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxcccccxxx',
    'xxxxxxxxxxxxxxxxxxxxxxccccNxxx',
    'xxxccccccxxxxxxxxccccccccccccc',
    'xxxcccIccxxxxxxxxcccxxxxxxxxxx',
    'xxxccccccxxxxxxxxcccxxxxxxxxxx',
    'xxxxxcccxxxxxxxxxcDcxxxxxxxxxx',
    'xxxxxcccxxxxxxxxxcccxxxxxxxxxx',
    'xxxxxccccccccccccccccccccxxxxx',
    'xxxxxcccxxxxxxxxxxxxxxxxcxxxxx',
    'ccccccccxxxxxxxxxxxxxxxxcxxxxx',
    'xxaxxxcAxxxxxxxxxxxxxxxxcxxxxx',
    'xxxxxxcccccclcccxxxxxxxxcxxxxx',
    'xxxxxxxxxxxxxxcccccccccccxxxxx',
    'xxxxxxxxxxxxxxcccJcOcccxxxxxxx',
    'xxxxxxxxxxxxxxccccUccccxxxxxxx',
    'xxxxxxxxxxxxxxcccccccccxxxxxxx',
    'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
  ],
  conn: { w: 'laluan3', e: 'kepalabatas' },
  enc: { cave: [['Kelawar', 8, 11, 35], ['Kerikil', 8, 11, 25], ['Korek', 8, 10, 10], ['Tenggiling', 8, 10, 15], ['Toyol', 9, 11, 5], ['Mencit', 8, 10, 10]] },
  o: {
    a: sign('TAPAK ARKEOLOGI GUAR KEPAH\nDi sini ditemui rangka manusia berusia 5,000 tahun, bersama timbunan kulit kepah. Jangan ganggu tapak!'),
    A: lanun('up', [['Kelawar', 11], ['Mencit', 11]], 'Kami GENG LANUN! Kami sedang menggali fosil di sini! Pergi sebelum aku marah!', 'Tak guna! Budak kecil pun boleh kalahkan aku?', 'Fosil boleh dijual dengan harga mahal. Bos pasti gembira!'),
    D: lanun('down', [['Anakular', 12], ['Kelawar', 12]], 'Apa? Ada budak menceroboh? Geng Lanun tak suka penyibuk!', 'Arghh! Kalah!', 'Kami cari fosil Monsta purba. Bos kata ia sangat bernilai!'),
    N: lanun('down', [['Tenggiling', 13], ['Kerikil', 13], ['Kelawar', 13]], 'Berhenti! Jalan ke Kepala Batas ni dikawal oleh Geng Lanun!', 'Okey, okey! Kamu boleh lalu!', 'Bos kami akan balas dendam nanti. Ingat tu!', { tr: { sight: 2 } }),
    U: {
      s: 'saintis', d: 'up', tr: {
        cls: 'Saintis', name: 'Dr. Lokman', team: [['Selut', 12], ['Mentol', 12], ['Asap', 12]], sight: 2,
        pre: 'DR. LOKMAN: Hei! Jangan dekat! Dua fosil ini aku yang jumpa dulu! Kalau nak, lawan aku dulu!',
        lose: 'DR. LOKMAN: Okey! Okey! Kita kongsi!', after: 'DR. LOKMAN: Satu fosil untuk kamu, satu untuk aku. Bawa fosil kamu ke Pusat Kajian di Kepala Batas.'
      }
    },
    J: { item: undefined, ball: 'fosil', show: () => !flag('fosil'), run: o => pickFossil('Fosil Siput') },
    O: { item: undefined, ball: 'fosil', show: () => !flag('fosil'), run: o => pickFossil('Fosil Belangkas') },
    I: item('Tali Keluar'),
    l: item('Ubat Super'),
  }
};
async function pickFossil(f) {
  if (!flag('tr:guarkepah:U')) { await say('DR. LOKMAN: Hoi! Jangan sentuh! Itu fosil aku!'); return; }
  if (await UI.yes(`Kamu mahu ${f.toUpperCase()}?`)) {
    await give(f);
    setFlag('fosil');
    await say(`DR. LOKMAN: Baiklah, aku ambil ${f === 'Fosil Siput' ? 'FOSIL BELANGKAS' : 'FOSIL SIPUT'}. Pusat Kajian di Kepala Batas boleh menghidupkan semula fosil itu!`);
  }
}

MAPS.kepalabatas = {
  name: 'Kepala Batas', outdoor: true, theme: 'bandar',
  tiles: [
    'TTTTTTTTTTTTTT..TTTTTTTTTTTTTT',
    'TT~~~~~~~~~~~~bb~~~~~~~~~~~~TT',
    'TT............==............TT',
    '===========================TTT',
    'TT.HHHH.....==....GGGGGG....TT',
    'TT.HHHH.....==....GGGGGG....TT',
    'TT.HH1H.....==....GGGGGG....TT',
    'TT.....a....==....GG2GGG....TT',
    'TT..........==.......q......TT',
    'TT..PPPPP...==...MMMM...BBBBTT',
    'TT..PPPPP...==...MMMM...BBBBTT',
    'TT..PPPPP...==...MM4M...BBBBTT',
    'TT..PP3PP...==..........BB5BTT',
    'TT..........==..............TT',
    'TT..HHHH....==.....HHHH.....TT',
    'TT..HHHH....==.....HHHH.....TT',
    'TT..HH6H....==.....HH7H..D..TT',
    'TT..........==..........y...TT',
    'TT.....N....==..............TT',
    'TTTTTTTTTTTTOTTTTTTTTTTTTTTTTT',
    'TTTTTTTTTTTT=TTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'guarkepah', n: 'laluan4', s: 'laluan5' },
  fly: [6, 13],
  enc: { fish: [['Bilis', 8, 15, 50], ['Sepat', 10, 15, 30], ['Berudu', 10, 15, 20]], water: [['Berudu', 20, 28, 50], ['Memerang', 20, 28, 30], ['Sepat', 20, 28, 20]] },
  doors: {
    1: {
      to: 'rumah', o: {
        A: {
          s: 'peniaga', d: 'down', run: async () => {
            if (S.bag['Basikal']) { await say('PEKEDAI: Macam mana basikal tu? Laju kan?'); return; }
            if (S.bag['Baucar Basikal']) {
              await say('PEKEDAI: Oh! Itu BAUCAR BASIKAL! Tukar dengan basikal percuma!');
              takeItem('Baucar Basikal'); await give('Basikal');
              await say('PEKEDAI: Guna BASIKAL dari BEG untuk bergerak dua kali lebih laju!');
              return;
            }
            await say('PEKEDAI: Selamat datang ke KEDAI BASIKAL KEPALA BATAS! Basikal lipat terbaru, hanya RM1,000,000!');
            await say('PEKEDAI: Apa? Tak cukup duit? Hmm... Kalau ada BAUCAR BASIKAL, bolehlah dapat percuma.');
          }
        },
        I: npc('budak', 'up', 'Satu juta ringgit untuk basikal?! Mahalnya!')
      }
    },
    2: { to: 'gim2' }, 3: KLINIK,
    4: shop(['Bola Tangkap', 'Ubat', 'Ubat Super', 'Ubat Nyamuk', 'Tali Keluar', 'Penawar', 'Ubat Bakar', 'Ubat Bangun', 'Ubat Lumpuh']),
    5: {
      to: 'rumah', o: {
        A: {
          s: 'saintis', d: 'down', run: async () => {
            const f = S.bag['Fosil Siput'] ? 'Fosil Siput' : S.bag['Fosil Belangkas'] ? 'Fosil Belangkas' : null;
            if (!f) { await say('SAINTIS: Selamat datang ke PUSAT KAJIAN ARKEOLOGI! Kami mengkaji fosil dari Guar Kepah. Jika jumpa fosil, bawa ke sini. Kami boleh menghidupkannya semula!'); return; }
            await say(`SAINTIS: Wah! Itu ${f.toUpperCase()}! Saya boleh hidupkan semula Monsta purba daripadanya!`);
            if (!(await UI.yes('Serahkan fosil itu?'))) return;
            takeItem(f);
            await say('SAINTIS: Tunggu sebentar... Mesin penghidup sedang berfungsi...');
            Snd.sfx('evo'); await wait(1.5);
            await giveMon(f === 'Fosil Siput' ? 'Siputpurba' : 'Belangkas', 30);
            await say('SAINTIS: Berjaya! Monsta purba yang hidup 5,000 tahun dahulu kini hidup semula!');
          }
        },
        I: npc('saintis', 'up', 'Tapak Guar Kepah membuktikan manusia sudah tinggal di Seberang Perai sejak zaman prasejarah!'),
      }
    },
    6: house({ A: npc('makcik', 'down', 'Kak Mawar tu cantik dan garang. Monsta air dia sangat hebat!'), D: npc('pelajar', 'left', 'Monsta jenis ELEKTRIK dan RUMPUT sangat berkesan melawan Monsta AIR.') }),
    7: house({ A: npc('pakcik', 'down', () => flag('lanun_kb') ? 'PAK CIK HASSAN: Terima kasih kerana menghalau Lanun itu! Kamu memang berani!' : 'PAK CIK HASSAN: Tolong! Lanun pecah masuk rumah pak cik! Dia lari ikut pintu belakang!') }),
  },
  o: {
    a: sign('KEPALA BATAS\nBandar yang maju di utara Seberang Perai.'),
    q: sign('GIM KEPALA BATAS\nKetua: KAK MAWAR\n"Srikandi Monsta jenis air!"'),
    y: sign('Rumah Pak Cik Hassan'),
    N: npc('pelajar', 'down', 'Dengar cerita, ada penyelidik Monsta tinggal di hujung jambatan di utara. Namanya Abang Ijat.', { move: 'wander' }),
    O: npc('polis', 'up', () => S.badges.includes(1) ? 'POLIS: Penjenayah itu masih bersembunyi di belakang rumah Pak Cik Hassan! Tolong kami tangkap dia!' : 'POLIS: Maaf, jalan ke Bertam ditutup sementara. Ada kes pecah rumah di bandar ini.', { u: '=', show: () => !flag('lanun_kb') }),
    D: {
      s: 'lanun', d: 'left', show: () => S.badges.includes(1) && !flag('lanun_kb'), tr: {
        cls: 'Lanun', name: 'Anak Buah', team: [['Mencit', 17], ['Tedung', 16]], lanun: true, id: 'lanun_kb_tr',
        pre: 'LANUN: Hei! Kamu nampak aku ke? Aku tak curi apa-apa! Pergi!',
        lose: 'LANUN: Alamak! Kantoi!',
        win: async () => {
          await say('LANUN: Okey, okey! Ambil balik barang curian ni! Jangan panggil polis!');
          await give('Bola Hebat', 3);
          await say('Lanun itu melarikan diri!');
          setFlag('lanun_kb');
          await say('POLIS: Terima kasih! Jalan ke Bertam dibuka semula!');
        }
      }
    }
  }
};
MAPS.gim2 = gymMap('Gim Kepala Batas', '~', {
  A: gymLeader(1, {
    s: 'ketua2', name: 'KAK MAWAR',
    pre: 'KAK MAWAR: Hai! Kamu datang untuk mencabar Kak Mawar? Monsta jenis AIR kakak mengalir deras seperti Sungai Muda! Bersedialah untuk basah!',
    team: [['Tapaksulaiman', 18], ['Bintanglaut', 21]], items: ['Ubat Super'],
    lose: 'KAK MAWAR: Wah! Kamu memang hebat! Baiklah, ambil LENCANA OMBAK ini!',
    badgeText: 'KAK MAWAR: LENCANA OMBAK membolehkan kamu menggunakan TEBAS di luar pertarungan, jika Monsta kamu mempelajarinya.',
    after: 'KAK MAWAR: Kamu tahu? Kakak dengar Geng Lanun buat onar di bandar ini. Hati-hati!', reward: ['Bola Hebat', 2]
  }),
  I: trainer('gadis', 'down', 'Perenang', 'Aina', [['Kudalaut', 16], ['Sepat', 16]], 'Nak jumpa Kak Mawar? Berenang melepasi aku dulu!', 'Aku tenggelam...', 'Kak Mawar sangat kuat. Bintanglaut dia pantas!'),
  J: trainer('budak', 'right', 'Perenang', 'Luqman', [['Itik', 17], ['Kepah', 17]], 'Splash! Hari yang sesuai untuk berenang!', 'Glup glup...', 'Monsta ELEKTRIK sangat berkesan melawan air, tau!'),
  U: gymGuide('Air', 'Kak Mawar guna Monsta jenis AIR. Gunakan Monsta jenis ELEKTRIK atau RUMPUT untuk menang dengan mudah!'),
});

MAPS.laluan4 = {
  name: 'Laluan 4', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TTTTT..........TTTTT',
    'TTTTT.HHHH.....TTTTT',
    'TTTTT.HHHH..a..TTTTT',
    'TTTTT.HH1H.....TTTTT',
    'TTTTT..........TTTTT',
    'TT,,,,,,..,,,,,,,,TT',
    'TT,,,,,,..,,,,,,,,TT',
    'TT,,,,,,..,,,,,,,,TT',
    'TT......J.........TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT~~~~~~bI~~~~~~~~TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT~~~~~~Nb~~~~~~~~TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT~~~~~~bO~~~~~~~~TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT~~~~~~Ub~~~~~~~~TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT~~~~~~bD~~~~~~~~TT',
    'TT~~~~~~bb~~~~~~~~TT',
    'TT......bZ........TT',
    'TT......VV........TT',
    'TT......==.......ATT',
    'TTTTTTTT==TTTTTTTTTT',
  ],
  conn: { s: 'kepalabatas' },
  doors: {
    1: {
      to: 'rumah', o: {
        A: {
          s: 'saintis', d: 'down', run: async () => {
            if (flag('tiket')) { await say('ABANG IJAT: Kapal SERI PERAI berlabuh di Pelabuhan Butterworth. Kaptennya kawan abang. Kirim salam!'); return; }
            await say('ABANG IJAT: Oh, hai! Abang IJAT, penyelidik Monsta. Abang yang cipta sistem simpanan PC di klinik tu!');
            await say('ABANG IJAT: Kamu jurulatih ya? Tengok MONSTADEX kamu... Wah, mengagumkan!');
            await say('ABANG IJAT: Sebenarnya abang dijemput ke majlis di atas kapal SERI PERAI di Butterworth. Tapi abang terlalu sibuk dengan kajian abang.');
            await say('ABANG IJAT: Kamu pergilah menggantikan abang! Ambil tiket ini!');
            setFlag('tiket'); await give('Tiket Kapal');
            await say('ABANG IJAT: Kapal itu penuh dengan jurulatih yang kuat. Mesti seronok!');
          }
        },
        I: npc('budak2', 'up', 'Abang Ijat tu genius! Dia buat PC untuk simpan Monsta!'),
      }
    }
  },
  enc: { grass: [['Pakma', 13, 16, 20], ['Periuk', 13, 16, 20], ['Monyet', 13, 15, 15], ['Kukang', 12, 14, 10], ['Pipit', 13, 15, 20], ['Comel', 13, 15, 15]], water: [['Berudu', 20, 28, 50], ['Sepat', 20, 28, 50]], fish: [['Bilis', 8, 15, 60], ['Sepat', 10, 15, 40]] },
  o: {
    a: sign('RUMAH ABANG IJAT\nPenyelidik Monsta'),
    A: sign('LALUAN 4\nJambatan Cabaran: Kalahkan 5 jurulatih dan menang hadiah!'),
    I: trainer('budak', 'left', 'Budak Sekolah', 'Aiman', [['Mencit', 14], ['Anakular', 14]], 'Ini JAMBATAN CABARAN! Kalahkan kami berlima untuk dapat hadiah!', 'Satu dah kalah!', 'Empat lagi!', { tr: { sight: 1 } }),
    N: trainer('gadis', 'right', 'Gadis', 'Hani', [['Pakma', 14], ['Periuk', 14]], 'Aku yang kedua! Jangan harap nak menang!', 'Dua dah kalah!', 'Tiga lagi!', { tr: { sight: 1 } }),
    O: trainer('budak2', 'left', 'Pemburu Serangga', 'Danish', [['Kerengga', 14], ['Ramarama', 15]], 'Aku yang ketiga! Serangga aku tak kenal erti takut!', 'Tiga dah kalah!', 'Dua lagi!', { tr: { sight: 1 } }),
    U: trainer('pelajar', 'right', 'Pelajar', 'Wafi', [['Kukang', 15], ['Monyet', 15]], 'Aku yang keempat! Aku pelajar terbaik di sekolah!', 'Empat dah kalah!', 'Seorang lagi!', { tr: { sight: 1 } }),
    D: trainer('pendaki', 'left', 'Pendaki', 'Ramli', [['Kerikil', 15], ['Tenggiling', 16]], 'Aku yang terakhir! Tak siapa boleh lepasi aku!', 'Wah! Kamu kalahkan kami semua!', 'Pergi ambil hadiah kamu di hujung jambatan!', { tr: { sight: 1 } }),
    J: {
      s: 'lanun', d: 'down', tr: { cls: 'Lanun', name: 'Perekrut', team: [['Anakular', 15], ['Kelawar', 15]], lanun: true, nosight: true, lose: 'LANUN: Wah! Kamu memang hebat. Bos pasti mahu kamu...', after: 'LANUN: Kalau kamu ubah fikiran, Geng Lanun sentiasa terbuka untuk jurulatih hebat!' },
      run: async o => {
        if (flag(World.trFlag(o))) { await say(o.def.tr.after); return; }
        if (!flag('hadiah_jambatan')) {
          await say('???: Tahniah! Kamu kalahkan kelima-lima jurulatih! Ini hadiah kamu!');
          setFlag('hadiah_jambatan'); await give('Ketulan Emas');
        }
        await say('???: Sebenarnya... aku ahli GENG LANUN. Kami perlukan jurulatih kuat macam kamu. Sertai kami!');
        await UI.ask(null, ['TIDAK', 'TAK NAK'], { cancel: 0 });
        await say('LANUN: Apa?! Kamu tolak tawaran Geng Lanun? Kalau begitu, rasakan!');
        await World.trainerFight(o);
      }
    },
    Z: { s: 'johan', d: 'down', u: 'b', show: () => !flag('rival3') },
    V: {
      u: '=', if: () => !flag('rival3'), trig: async () => {
        const r = obj('Z');
        await say('{R}: Hei! {P}! Kamu pun datang ke sini?');
        if (r) { faceP(r); turnP(OPP[r.dir]); if (Math.abs(r.x - World.p.x) + Math.abs(r.y - World.p.y) > 1) await approach(r); turnP(OPP[r.dir]); }
        await say('{R}: Aku dah dapat lencana di Teluk Ayer Tawar. Monsta aku pun dah bertambah! Tengok ni!');
        const res = await Story.rivalFight(3, null, '{R}: Hah? Aku kalah lagi?');
        if (res !== 'win') return;
        await say('{R}: Hmph... Aku dengar Abang Ijat yang cipta PC Monsta tinggal di hujung jambatan ni. Pergilah jumpa dia. Aku dah jumpa pun. Bye!');
        setFlag('rival3');
      }
    }
  }
};
