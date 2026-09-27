'use strict';
// ===== Peta selatan: Jalan Juru, Bukit Tambun, Simpang Ampat, Nibong Tebal, Bukit Panchor, Sungai Jawi, Batu Kawan =====
MAPS.laluan12 = {
  name: 'Laluan 12 — Jalan Juru', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTT',
    'TT....,,,,,,,,,,,,....TT',
    'TT..A.,,,,,,,,,,,,..I.TT',
    '======================TT',
    'TT..................=.TT',
    'TT,,,,,,,,,,,,,,,,..=.TT',
    'TT,,,,,,,,,,,,,,,,..=.TT',
    'TT..D...........,,..=.TT',
    'TT..................=.TT',
    'TTTTTTTTTTTTTTTT....=.TT',
    'TT,,,,,,,,,,,,,,....=.TT',
    'TT,,,,,,,,,,,,,,..N.=.TT',
    'TT..................=.TT',
    'TT..=================.TT',
    'TT..=.....,,,,,,,,,,..TT',
    'TT..=..O..,,,,,,,,,,..TT',
    'TT..=.....,,,,,,,,,,..TT',
    'TT..=..............a..TT',
    'TTTT=TTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'permatangpauh', s: 'bukittambun' },
  enc: { grass: [['Pesilat', 26, 29, 18], ['Beruk', 26, 28, 12], ['Biawak', 26, 29, 20], ['Tedung', 27, 29, 12], ['Anakular', 25, 27, 18], ['Kerbau', 26, 28, 20]] },
  o: {
    a: sign('LALUAN 12 — JALAN JURU\nPermatang Pauh — Bukit Tambun'),
    A: trainer('pendekar', 'down', 'Ahli Silat', 'Hamdan', [['Pesilat', 27], ['Monyet', 27]], 'Langkah silat pertama: bertarung dengan hormat!', 'Aku tunduk hormat.', 'Pesilat boleh berevolusi dua kali!'),
    I: trainer('gadis', 'down', 'Gadis', 'Qistina', [['Biawak', 28], ['Kudapi', 27]], 'Biawak aku suka berjemur. Tapi hari ni dia nak bertarung!', 'Biawak aku masuk longkang...', 'Biawak berevolusi jadi Biawakraja pada tahap 32.'),
    D: trainer('pakcik', 'right', 'Petani', 'Osman', [['Kerbau', 28], ['Kerbau', 28]], 'Dua ekor kerbau pak cik. Kuat membajak, kuat berlawan!', 'Kerbau pak cik penat...', 'Juru dulu kampung, sekarang dah jadi kawasan perindustrian.'),
    N: trainer('budak2', 'left', 'Pemburu Serangga', 'Adli', [['Tebuan', 28], ['Cendawanraja', 29]], 'Serangga aku dah berevolusi! Kuat tau!', 'Ooh, kuatnya kamu!', 'Serangga kuat melawan RUMPUT dan PSIKIK.'),
    O: trainer('pendaki', 'up', 'Pendaki', 'Latif', [['Batuhidup', 29], ['Ularbatu', 29]], 'Bukit Juru tak tinggi, tapi batunya keras!', 'Batu aku retak!', 'Selatan sana ada Bukit Tambun, syurga makanan laut!'),
  }
};
MAPS.bukittambun = {
  name: 'Bukit Tambun', outdoor: true, theme: 'pantai', surfMap: true,
  tiles: [
    'TTTT=TTTTTTTTTTTTTTTTTTT',
    'TT..=.............ss~~~T',
    'TT..=..HHHH.......ss~~~T',
    'TT..=..HHHH.......ssk~~T',
    'TT..=..HH1H...a...sskk~T',
    'TT..=.............ssk~~T',
    'TT..==============ss~~~T',
    'TT..PPPPP..MMMM...ss~~~T',
    'TT..PPPPP..MMMM...ss~~~T',
    'TT..PP2PP..MM3M...ss~~~T',
    'TT................ss~~~T',
    'TT..HHHH...N......ss~~~T',
    'TT..HHHH..........ss~~~T',
    'TT..HH4H..........ss~~~T',
    'TT................ss~~~T',
    'TTTTTTTT==TTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan12', s: 'laluan13' },
  fly: [6, 10],
  enc: { water: [['Ketam', 25, 30, 30], ['Oborobor', 25, 30, 25], ['Kepah', 25, 30, 25], ['Tapaksulaiman', 25, 30, 20]], fish: [['Ketam', 20, 28, 35], ['Kepah', 20, 28, 30], ['Bilis', 15, 25, 20], ['Kudalaut', 20, 28, 15]] },
  doors: {
    1: {
      to: 'rumah', o: {
        A: {
          s: 'nelayan', d: 'down', run: async () => {
            if (flag('mutiara')) { await say('NELAYAN: Mutiara tu boleh dijual dengan harga tinggi di kedai.'); return; }
            await say('NELAYAN: Pagi tadi pak cik jumpa MUTIARA dalam kepah! Pak cik dah ada banyak. Ambillah satu!');
            setFlag('mutiara'); await give('Mutiara', 2);
          }
        },
        I: npc('makcik', 'up', 'Ikan bakar dan udang galah Bukit Tambun paling sedap di Seberang Perai!'),
      }
    },
    2: KLINIK,
    3: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Hiper', 'Ubat Super', 'Semangat', 'Penawar Penuh', 'Ubat Nyamuk Super', 'Tali Keluar']),
    4: house({ A: npc('atuk', 'down', 'Di selatan ada Nibong Tebal, di tepi Sungai Kerian. Sungai itu sempadan Seberang Perai.'), D: npc('budak', 'left', 'Monsta Ketam suka sembunyi bawah batu di pantai.') }),
  },
  o: {
    a: sign('BUKIT TAMBUN\nSyurga makanan laut Seberang Perai!'),
    N: npc('nelayan', 'down', 'Ikan bakar Bukit Tambun paling sedap! Monsta Ketam pun suka datang sini.', { move: 'wander' }),
  }
};
MAPS.laluan13 = {
  name: 'Laluan 13 — Simpang Ampat', outdoor: true,
  tiles: [
    'TTTTTTTT==TTTTTTTTTT',
    'TT......==........TT',
    'TTpppp..==..ppppppTT',
    'TTpppp..==..ppppppTT',
    'TTpppp..==..A.....TT',
    'TT......==........TT',
    'TT..I...==..pppp..TT',
    'TT......==..pppp..TT',
    'TTLLLLL.==.LLLLLLLTT',
    'TT......==........TT',
    'TTpppppp==....D...TT',
    'TTpppppp==........TT',
    'TT......==..pppppTTT',
    'TT..a...==..pppppTTT',
    'TT......==...N....TT',
    'TTTTTTTT==TTTTTTTTTT',
  ],
  conn: { n: 'bukittambun', s: 'nibongtebal' },
  enc: { grass: [['Kerbau', 27, 30, 18], ['Bangau', 28, 30, 15], ['Itik', 27, 30, 15], ['Kudapi', 27, 30, 12], ['Pungguk', 26, 29, 15], ['Biawak', 27, 29, 20], ['Punggukbulan', 29, 31, 5]] },
  o: {
    a: sign('LALUAN 13 — SIMPANG AMPAT\nBukit Tambun — Nibong Tebal'),
    A: trainer('gadis2', 'left', 'Gadis', 'Balqis', [['Bangau', 29], ['Itik', 29]], 'Burung-burung aku terbang bebas di sawah!', 'Terbang pergi...', 'Simpang Ampat ni persimpangan penting di selatan.'),
    I: trainer('pakcik', 'right', 'Petani', 'Yusof', [['Kerbau', 30], ['Kudapi', 29]], 'Padi dah menguning. Masa untuk berlawan!', 'Hasil tuaian tahun ni teruk...', 'Nibong Tebal di selatan. Ketua gim di sana pendekar silat!'),
    D: trainer('budak', 'left', 'Budak Sekolah', 'Hariz', [['Pungguk', 29], ['Biawak', 30]], 'Pungguk aku rindukan bulan!', 'Bulan pun tak datang tolong...', 'Pungguk selalu keluar waktu malam.'),
    N: trainer('budak2', 'left', 'Penunggang Basikal', 'Mukhriz', [['Tikusraya', 30], ['Ayamserama', 31]], 'Kring kring! Tepi sikit!', 'Tayar pancit!', 'Basikal sangat laju di jalan raya.'),
  }
};
MAPS.nibongtebal = {
  name: 'Nibong Tebal', outdoor: true, surfMap: true,
  tiles: [
    'TTTTTTTTTTTTTT==TTTTTTTTTTTTTT',
    'T~~~~s........==............TT',
    'T~~~~s..HHHH..==..GGGGGG....TT',
    'T~~~~s..HHHH..==..GGGGGG....TT',
    'T~~~~s..HH1H..==..GGGGGG....TT',
    'T~~~~s........==..GGG2GG....TT',
    'T~~~~s..a.....==.......q......',
    '~~~~~s........================',
    'T~~~~s..PPPPP..==.MMMM.....TTT',
    'T~~~~s..PPPPP..==.MMMM.....TTT',
    'T~~~~s..PP3PP..==.MM4M..N..TTT',
    'T~~~~s.........==.........TTTT',
    'T~~~~s..HHHH...==...HHHH..TTTT',
    'T~~~~s..HHHH...==...HHHH..TTTT',
    'T~~~~s..HH5H...==...HH6H..TTTT',
    'T~~~~s.........==.......y.TTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan13', e: 'bukitpanchor', w: 'sungaijawi' },
  fly: [10, 11],
  enc: { water: [['Anakbuaya', 28, 33, 30], ['Haruan', 28, 33, 30], ['Memerang', 28, 32, 25], ['Sepat', 25, 30, 15]], fish: [['Sepat', 20, 28, 35], ['Haruan', 25, 30, 35], ['Anakbuaya', 25, 30, 30]] },
  doors: {
    1: house({ A: npc('makcik2', 'down', 'Sungai Kerian di barat sana sempadan antara Seberang Perai dengan negeri jiran.'), I: npc('budak', 'up', 'Pendekar Harun boleh hilang dan muncul macam bayang-bayang!') }),
    2: { to: 'gim5' }, 3: KLINIK,
    4: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Hiper', 'Ubat Super', 'Semangat', 'Penawar Penuh', 'Penawar', 'Ubat Nyamuk Super', 'Tali Keluar']),
    5: house({ A: npc('atuk', 'down', 'Nibong Tebal terkenal dengan sawah padi dan sungainya. Dulu ada kilang gula juga, di Byram.'), D: npc('pelajar', 'left', 'Taman Rimba Bukit Panchor di timur. Banyak Monsta jarang di sana!') }),
    6: house({ A: npc('gadis', 'down', 'Buaya di Sungai Kerian besar-besar! Jangan berenang sorang-sorang.') }),
  },
  o: {
    a: sign('NIBONG TEBAL\nBandar di tebing Sungai Kerian, pintu selatan Seberang Perai.'),
    q: sign('GIM NIBONG TEBAL\nKetua: PENDEKAR HARUN\n"Racun di hujung keris!"'),
    y: sign('Timur: Taman Rimba Bukit Panchor. Barat: Sungai Jawi ke Batu Kawan.'),
    N: npc('pakcik', 'down', 'Kalau nak ke Batu Kawan, kena berenang ikut Sungai Jawi. Perlukan jurus OMBAK.', { move: 'wander' }),
  }
};
MAPS.gim5 = gymMap('Gim Nibong Tebal', '|', {
  A: gymLeader(4, {
    s: 'ketua5', name: 'PENDEKAR HARUN',
    pre: 'PENDEKAR HARUN: Hmph! Budak mentah berani masuk gelanggang aku? Aku PENDEKAR HARUN! Ilmu silat dan racun aku diwarisi turun-temurun. Racun di hujung keris aku akan melemahkan kamu!',
    team: [['Tedung', 37], ['Asap', 37], ['Tebuan', 38], ['Jerebu', 43]], items: ['Ubat Hiper'],
    lose: 'PENDEKAR HARUN: Hmm! Kamu berilmu tinggi! Terimalah LENCANA KERIS!',
    badgeText: 'PENDEKAR HARUN: LENCANA KERIS membolehkan kamu menggunakan OMBAK di luar pertarungan. Seberangilah sungai dan laut!',
    after: 'PENDEKAR HARUN: Ilmu tanpa adab ibarat keris tanpa sarung. Ingat itu.', reward: ['Ubat Penuh', 1]
  }),
  I: trainer('pendekar', 'down', 'Ahli Silat', 'Kudin', [['Anakular', 33], ['Tedung', 34]], 'Langkah pertama... tangkis!', 'Langkah aku sumbang!', 'Dinding halimunan di gim ini mengelirukan, kan?'),
  J: trainer('pendekar', 'right', 'Ahli Silat', 'Johari', [['Selut', 34], ['Asap', 34]], 'Racun aku menunggu kamu!', 'Penawar! Aku perlukan penawar!', 'Jenis TANAH dan PSIKIK sangat berkesan melawan RACUN.'),
  N: trainer('pendekar', 'left', 'Ahli Silat', 'Megat', [['Keluang', 35], ['Tebuan', 35]], 'Aku murid kanan Pendekar Harun!', 'Guru, maafkan aku!', 'Guru kami sangat pantas.'),
  U: gymGuide('Racun', 'Pendekar Harun guna Monsta jenis RACUN. Gunakan jenis TANAH dan PSIKIK! Bawa PENAWAR yang cukup!'),
});
MAPS.bukitpanchor = {
  name: 'Taman Rimba Bukit Panchor', outdoor: true, surfMap: true, music: 'gua',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT,,,,,,,,TTTTTTTT,,,,,,,,TT',
    'TT,,,,,,,,TTTTTTTT,,,,A,,,TT',
    'TT,,,,,,,,,,,,,,,,,,,,,,,,TT',
    'TT....TTTTTT....TTTTT.....TT',
    'TT....TTTTTT..a.TTTTT.....TT',
    '==========.......,,,,,,...TT',
    '==========.......,,,,,,...TT',
    'TT.......HHHH....,,,,,,...TT',
    'TT.......HHHH....TTTTTT...TT',
    'TT.......HH1H....TTTTTT...TT',
    'TT...................I....TT',
    'TT,,,,,,..~~~~~~~~~..,,,,,TT',
    'TT,,,,,,..~~~~~~~~~..,,,,,TT',
    'TT,,,,,,..~~~sss~~~..,,,,,TT',
    'TT,,,,,,..~~~sJs~~~..,,,,,TT',
    'TT,,,,,,..~~~~~~~~~..,,,,,TT',
    'TT..D.....~~~~~~~~~.....N.TT',
    'TT...........O............TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'nibongtebal' },
  doors: {
    1: {
      to: 'rumah', o: {
        A: {
          s: 'penjaga', d: 'down', run: async () => {
            if (flag('ombak_dapat')) { await say('RENJER: Jaga alam sekitar ya! Hutan ini rumah kepada ramai Monsta.'); return; }
            await say('RENJER: Selamat datang ke TAMAN RIMBA BUKIT PANCHOR! Aku renjer yang menjaga hutan simpan ini.');
            await say('RENJER: Kamu datang jauh dari utara? Hebat! Kamu nampak seperti jurulatih yang menyayangi alam.');
            await say('RENJER: Ambil CAKERA RAHSIA ini. Ia mengajar OMBAK. Dengan jurus ini kamu boleh berenang merentasi tasik dan sungai!');
            setFlag('ombak_dapat'); await give('CR03 Ombak');
            await say('RENJER: Ingat, kamu perlukan LENCANA KERIS dari Nibong Tebal untuk menggunakan OMBAK di luar pertarungan.');
          }
        },
        I: npc('penjaga', 'up', 'Tasik di taman ini ada Monsta NAGA kecil. Tapi jarang sangat nampak!'),
      }
    }
  },
  enc: {
    grass: [['Seladang', 30, 34, 8], ['Badak', 30, 34, 10], ['Kumbang', 30, 33, 8], ['Belalang', 30, 33, 8], ['Pungguk', 28, 32, 15], ['Tenggiling', 28, 32, 13], ['Keluang', 30, 33, 10], ['Biawak', 28, 32, 15], ['Kancil', 30, 32, 3], ['Pepatung', 29, 32, 10]],
    water: [['Memerang', 30, 35, 35], ['Anaknaga', 25, 30, 8], ['Haruan', 30, 35, 32], ['Anakbuaya', 28, 33, 25]],
    fish: [['Sepat', 25, 30, 40], ['Haruan', 28, 32, 45], ['Anaknaga', 20, 25, 15]]
  },
  o: {
    a: sign('TAMAN RIMBA BUKIT PANCHOR\nHutan simpan dan tasik. Pelbagai Monsta jarang ditemui di sini!'),
    A: trainer('penjaga', 'down', 'Renjer', 'Hafizi', [['Seladang', 33], ['Kumbang', 33]], 'Kamu jaga kebersihan hutan ni? Bagus! Tapi kena lawan aku dulu!', 'Hebat!', 'Seladang liar kadang-kadang muncul di rumput tinggi.'),
    D: trainer('pendaki', 'right', 'Pendaki', 'Anuar', [['Badak', 34], ['Tenggiraja', 34]], 'Aku mendaki Bukit Panchor setiap minggu!', 'Kaki aku kejang!', 'Pemandangan dari atas bukit sangat cantik.'),
    N: trainer('gadis', 'left', 'Gadis', 'Hazwani', [['Belalang', 35], ['Pungguk', 33]], 'Belalang sembah aku pantas macam angin!', 'Dia berdoa untuk kemenangan... tapi tak dimakbulkan.', 'Belalang dan Kumbang sangat jarang dijumpai!'),
    I: trainer('budak2', 'left', 'Pemburu Serangga', 'Ikhwan', [['Kumbang', 34], ['Tebuan', 34], ['Cendawanraja', 34]], 'Hutan ni syurga pemburu serangga!', 'Koleksi aku...', 'Kumbang tanduk boleh angkat benda 50 kali berat badannya!'),
    J: item('Batu Air'), O: item('Ubat Hiper'),
  }
};
MAPS.sungaijawi = {
  name: 'Sungai Jawi', outdoor: true, surfMap: true, theme: 'air',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TTTTTsssTTTTTTTTTTTTsssTTTTTTT',
    'TTT~~sAs~~~~~~~~~~~~sIs~~~~~TT',
    'TT~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    'TT~~~~~~~~ssDss~~~~~~~~~~~~~TT',
    'TT~~~~~~~~sssss~~~~~~~~~~~~~TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { e: 'nibongtebal', w: 'batukawan' },
  enc: { water: [['Oborobor', 28, 33, 15], ['Memerang', 28, 32, 20], ['Anakbuaya', 28, 32, 20], ['Sepat', 28, 32, 15], ['Haruan', 30, 33, 15], ['Kudalaut', 28, 32, 15]], fish: [['Sepat', 25, 30, 40], ['Haruan', 28, 32, 35], ['Anakbuaya', 25, 30, 25]] },
  o: {
    A: trainer('nelayan', 'down', 'Nelayan', 'Rashid', [['Haruan', 33], ['Memerang', 32]], 'Ikan haruan sungai ni besar-besar!', 'Terlepas!', 'Batu Kawan di hujung barat sungai ini.'),
    I: trainer('budak', 'down', 'Perenang', 'Firdaus', [['Oborraja', 33]], 'Berenang di sungai sangat menyegarkan!', 'Aku tenggelam!', 'Hati-hati dengan buaya!'),
    D: trainer('gadis', 'up', 'Perenang', 'Izzati', [['Kudalaut', 32], ['Nagalaut', 33]], 'Aku berenang dari Nibong Tebal ke sini setiap hari!', 'Letih...', 'Kilang lama di Batu Kawan tu menyeramkan.'),
  }
};
MAPS.batukawan = {
  name: 'Batu Kawan', outdoor: true, surfMap: true, theme: 'pantai',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT......................TT',
    'TT.WWWWWWWW.....HHHH....TT',
    'TT.WWWWWWWW.....HHHH....TT',
    'TT.WWWW1WWW.....HH2H....TT',
    'TT..............ssss~~~~~~',
    'TT..a...........ss~~~~~~TT',
    'TT..PPPPP..MMMM.ss~~~~~~TT',
    'TT..PPPPP..MMMM.ss~~~~~~TT',
    'TT..PP3PP..MM4M.ss~~~~~~TT',
    'TT..............ss~~~~~~TT',
    'TT..HHHH....N...ss~~~~~~TT',
    'TT..HHHH........ss~~~~~~TT',
    'TT..HH5H........ss~~~~~~TT',
    'TT..............ss~~~~~~TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { e: 'sungaijawi' },
  fly: [6, 10],
  enc: { water: [['Tapaksulaiman', 30, 35, 30], ['Kudalaut', 30, 34, 30], ['Oborobor', 30, 35, 25], ['Kepah', 30, 34, 15]], fish: [['Kepah', 25, 30, 40], ['Kudalaut', 25, 30, 30], ['Tapaksulaiman', 25, 30, 30]] },
  doors: {
    1: { to: 'kilanglama1' },
    2: house({ A: npc('pakcik', 'down', 'Batu Kawan dulu kawasan ladang dan paya. Sekarang dah jadi bandar baharu!'), I: npc('budak2', 'up', 'Kilang lama tu terbakar dulu. Ada orang kata ada Monsta pelik tinggal di situ.') }),
    3: KLINIK,
    4: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Hiper', 'Ubat Penuh', 'Semangat', 'Penawar Penuh', 'Ubat Bakar', 'Ubat Cair Ais', 'Ubat Nyamuk Super']),
    5: house({ A: npc('makcik', 'down', 'Di kilang lama tu ada diari saintis. Mereka kaji Monsta legenda...') }),
  },
  o: {
    a: sign('BATU KAWAN\nBandar baharu di selatan Seberang Perai.'),
    N: npc('saintis', 'down', 'Kilang lama tu terbakar bertahun-tahun dulu. Ada penyelidik pernah mengkaji Monsta di dalamnya...', { move: 'wander' }),
  }
};
MAPS.kilanglama1 = {
  name: 'Kilang Lama', inside: true, cave: true, escape: true, music: 'gua', theme: 'gua',
  tiles: [
    '################',
    '#1_____m_____dd#',
    '#______m_______#',
    '#_mm___m__u____#',
    '#______________#',
    '#_dd_____mmmm__#',
    '#_dd___O_______#',
    '#______________#',
    '#__a_______I___#',
    '#______________#',
    '#______________#',
    '#######E########',
  ],
  doors: { 1: { to: 'kilanglama2', at: '1' } },
  enc: { cave: [['Kudapi', 32, 36, 20], ['Musangapi', 32, 35, 15], ['Selut', 32, 35, 20], ['Asap', 32, 35, 20], ['Aiskepal', 32, 34, 15], ['Jerebu', 35, 37, 5], ['Lumpurbisa', 36, 38, 5]], crate: .08 },
  o: {
    u: sign('Diari lama: "5 Julai. Kami menemui batu bersurat di lereng Bukit Mertajam. Tulisannya menyebut tentang makhluk sakti..."'),
    a: sign('Diari lama: "10 Ogos. Makhluk itu dipanggil SANG KELEMBAI. Kata-katanya boleh menukar apa sahaja menjadi batu!"'),
    O: trainer('saintis', 'down', 'Saintis', 'Akmal', [['Asap', 34], ['Mentol', 34], ['Selut', 34]], 'Kilang ini tempat kajian rahsia! Keluar!', 'Eksperimen gagal!', 'Kami cuba mencipta semula Sang Kelembai... tetapi gagal.'),
    I: item('Ubat Hiper'),
  }
};
MAPS.kilanglama2 = {
  name: 'Kilang Lama 2F', inside: true, cave: true, escape: true, music: 'gua', theme: 'gua',
  tiles: [
    '################',
    '#_____ddd______#',
    '#_I_______N____#',
    '#______________#',
    '#mmmm____mmmm__#',
    '#______________#',
    '#__u_____O_____#',
    '#______________#',
    '#dd_________dd_#',
    '#______________#',
    '#1_____________#',
    '################',
  ],
  doors: { 1: { to: 'kilanglama1', at: '1' } },
  enc: { cave: [['Kudapi', 33, 36, 20], ['Musangapi', 33, 36, 15], ['Selut', 33, 36, 20], ['Asap', 33, 36, 20], ['Aiskepal', 33, 35, 10], ['Jerebu', 35, 37, 8], ['Lumpurbisa', 36, 38, 7]], crate: .08 },
  o: {
    u: sign('Diari lama: "1 September. Sang Kelembai terlalu kuat. Kami tidak dapat mengawalnya... Ia melarikan diri ke gua di Bukit Mertajam."'),
    I: item('Kunci Rahsia'),
    N: trainer('saintis', 'left', 'Saintis', 'Wan', [['Mentol', 35], ['Neonraja', 36]], 'Data kajian ini sulit! Jangan baca!', 'Data aku...', 'Kunci gim Pak Bahar? Rasanya ada di bilik ini.'),
    O: lanun('up', [['Jerebu', 36], ['Kudapi', 35]], 'Geng Lanun cari harta dalam kilang ni. Blah!', 'Tak guna!', 'Bos kami dah balik ke Guar Perahu...'),
  }
};
