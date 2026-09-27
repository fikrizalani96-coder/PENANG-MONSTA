'use strict';
// ===== Peta tengah: Bertam, Tasek Gelugor, Butterworth, Permatang Pauh, Seberang Jaya, Perai, Bukit Mertajam, Liga =====
const STOK_BERTAM = ['Bola Hebat', 'Bola Tangkap', 'Ubat Super', 'Ubat Hiper', 'Semangat', 'Penawar', 'Ubat Bakar', 'Ubat Lumpuh', 'Ubat Bangun', 'Ubat Cair Ais'];
function pengawal() {
  return {
    s: 'askar', d: 'down', u: '=', show: () => !flag('pengawal'), run: async () => {
      const drink = ['Air Tebu', 'Teh Tarik', 'Air Kelapa'].find(n => S.bag[n]);
      if (!drink) {
        await say('PENGAWAL: Fuh... panasnya hari ini. Tekak aku kering...');
        await say('PENGAWAL: Maaf, Seberang Jaya ditutup buat sementara. Aku terlalu haus untuk bertugas...');
        return;
      }
      await say(`PENGAWAL: Fuh... panasnya hari ini... Eh? Kamu ada ${drink.toUpperCase()}?`);
      if (!(await UI.yes(`Beri ${drink.toUpperCase()} kepada pengawal?`))) { await say('PENGAWAL: Ahh... hausnya...'); return; }
      takeItem(drink);
      await say('PENGAWAL: Glup glup glup... Aahhh! Segarnya! Terima kasih!');
      await say('PENGAWAL: Kamu boleh masuk ke Seberang Jaya. Aku akan beritahu pengawal lain juga!');
      setFlag('pengawal');
    }
  };
}

MAPS.laluan5 = {
  name: 'Laluan 5', outdoor: true,
  tiles: [
    'TTTTTTTTT=TTTTTTTTTT',
    'TT.......=........TT',
    'TT.,,,,..=..,,,,,.TT',
    'TT.,,,,..=..,,,,,.TT',
    'TT.,,,,..=..,,,,,.TT',
    'TT.......=.....A..TT',
    'TTTTTTT..=..TTTTTTTT',
    'TT,,,,,..=........TT',
    'TT,,,,,..=..I.....TT',
    'TT,,,,,..=........TT',
    'TT.......=...,,,,,TT',
    'TT..D....=...,,,,,TT',
    'TT.......=...,,,,,TT',
    'TTLLLLLL.=.LLLLLLLTT',
    'TT.......=........TT',
    'TT,,,,...=...,,,,,TT',
    'TT,,,,...=...,,,,,TT',
    'TT,,,,...=.N.,,,,,TT',
    'TT.......=........TT',
    'TTTTT....=....TTTTTT',
    'TT.......=..a.....TT',
    'TT..YY...=...YY...TT',
    'TT..YY...=...YY...TT',
    'TT.......=........TT',
    'TTTTTTTTT=TTTTTTTTTT',
  ],
  conn: { n: 'kepalabatas', s: 'bertam' },
  enc: { grass: [['Pakma', 13, 16, 18], ['Periuk', 13, 16, 18], ['Monyet', 14, 16, 15], ['Kukang', 13, 15, 10], ['Merbah', 15, 17, 14], ['Comel', 14, 16, 12], ['Mencit', 14, 16, 13]] },
  o: {
    a: sign('LALUAN 5\nKepala Batas — Bertam'),
    A: trainer('pelajar', 'left', 'Pelajar', 'Nadia', [['Kukang', 16], ['Pakma', 16]], 'Aku baru balik dari kelas. Jom uji apa yang aku belajar!', 'Aku perlu belajar lagi...', 'Kukang boleh berpindah tempat dengan kuasa minda!'),
    I: trainer('budak', 'left', 'Budak Sekolah', 'Adam', [['Mencit', 15], ['Pipit', 15], ['Anakular', 15]], 'Tiga lawan satu? Tak, tak... satu satu!', 'Kalah lagi!', 'Aku nak pergi Bertam beli batu evolusi.'),
    D: trainer('pendaki', 'right', 'Pendaki', 'Hisham', [['Monyet', 17], ['Kerikil', 17]], 'Aku baru turun dari Bukit Mertajam. Kaki aku masih kuat!', 'Aduh... penat...', 'Bukit Mertajam di tenggara. Dewan Liga ada di puncaknya!'),
    N: trainer('gadis', 'left', 'Gadis', 'Aida', [['Comel', 18], ['Periuk', 18]], 'Periuk aku lapar! Jom bertarung!', 'Periuk aku kenyang dengan kekalahan...', 'Bertam penuh dengan ladang kelapa sawit.'),
  }
};

MAPS.bertam = {
  name: 'Bertam', outdoor: true, border: 'Y',
  tiles: [
    'YYYYYYYYYYYYY=YYYYYYYYYYYYYYYY',
    'YY...........=..............YY',
    'YY.HHHH......=....BBBBBBBB..YY',
    'YY.HHHH......=....BBBBBBBB..YY',
    'YY.HH1H......=....BBBBBBBB..YY',
    'YY...........=....BBB2BBBB..YY',
    'YY....a......=..............YY',
    'YY..PPPPP....=.....q........YY',
    'YY..PPPPP....=================',
    'YY..PP3PP....=.............YYY',
    'YY...........=..............YY',
    'YY.GGGGGG....=...WWWWWWW....YY',
    'YY.GGGGGG....=...WWWWWWW....YY',
    'YY.GGGGGG....=...WWWWWWW..D.YY',
    'YY.GGG4GG....=...WWW5WWW....YY',
    'YY...F.F.....=..............YY',
    'YY...FtF.....=....i.........YY',
    'YY...........=..............YY',
    'YY.HHHH..YY..=..HHHHHH......YY',
    'YY.HHHH..YY..=..HHHHHH......YY',
    'YY.HH7H......=..HHH8HH..N...YY',
    'YY....y......=..............YY',
    'YY..YY...YY..=..YY...YY.....YY',
    'YY...........=..............YY',
    'YYYYYYYYYYYYY=YYYYYYYYYYYYYYYY',
  ],
  conn: { n: 'laluan5', e: 'laluan6', s: 'laluan7' },
  fly: [6, 10],
  doors: {
    1: house({ A: npc('pakcik', 'down', 'Bertam dulu terkenal dengan ladang tebu. Sekarang ladang kelapa sawit di mana-mana!'), I: npc('gadis', 'up', 'Pasar Raya Bertam jual BATU EVOLUSI. Mahal, tapi berbaloi!') }),
    2: { to: 'pasaraya' }, 3: KLINIK, 4: { to: 'gim4' }, 5: { to: 'markas1' },
    7: house({ A: npc('makcik2', 'down', 'Di Tasek Gelugor ada rumah lama yang berhantu. Mak cik dengar Geng Lanun buat onar di sana.'), D: npc('budak', 'left', 'Hantu tak boleh dilihat dengan mata biasa. Kena ada alat khas!') }),
    8: {
      to: 'rumah', o: {
        A: {
          s: 'budak2', d: 'down', run: async () => {
            if (flag('kancil')) { await say('Jaga Kancil itu baik-baik ya! Ia boleh berevolusi dengan BATU API, BATU AIR atau BATU PETIR!'); return; }
            await say('Hai! Aku ada banyak KANCIL di rumah agam ni. Mak aku suruh aku berikan seekor kepada jurulatih yang baik.');
            if (S.party.length >= 6 && S.pc.length > 200) { await say('Eh, kumpulan dan PC kamu penuh!'); return; }
            if (!(await UI.yes('Kamu nak seekor KANCIL?'))) { await say('Oh... tak apalah.'); return; }
            setFlag('kancil');
            await giveMon('Kancil', 25);
          }
        },
        I: npc('makcik', 'up', 'Anak mak cik sayang sangat Monsta Kancil. Sang Kancil memang bijak!'),
      }
    },
  },
  o: {
    a: sign('BERTAM\nBandar ladang kelapa sawit dan tebu.'),
    q: sign('PASAR RAYA BERTAM\nSegala keperluan jurulatih!'),
    y: sign('PETUA: Batu evolusi dijual di Pasar Raya Bertam. Sesetengah Monsta hanya berevolusi dengan batu!'),
    i: npc('pakcik', 'down', 'Gim Bertam dikelilingi semak. Kena ada Monsta yang tahu TEBAS untuk masuk.', { move: 'wander' }),
    N: npc('makcik2', 'left', 'Rumah agam tu... ada budak lelaki bela banyak KANCIL. Pergilah jenguk.'),
    D: npc('lanun', 'left', 'LANUN: Jangan dekat dengan kilang lama tu! Err... maksud aku, tiada apa-apa di situ!', { show: () => !flag('markas_selesai') }),
  }
};
MAPS.pasaraya = {
  name: 'Pasar Raya Bertam', inside: true, vending: ['Air Kelapa', 'Teh Tarik', 'Air Tebu'],
  tiles: [
    '##############',
    '#nnn___A__I__#',
    '#______CC_CC_#',
    '#____________#',
    '#_KK____KK___#',
    '#_KK____KK_D_#',
    '#____________#',
    '#QQ______QQ__#',
    '#____________#',
    '######E#######',
  ],
  o: {
    A: { s: 'peniaga', d: 'down', run: () => Menus.shop(STOK_BERTAM) },
    I: { s: 'gadis2', d: 'down', run: () => Menus.shop(['Batu Api', 'Batu Air', 'Batu Petir', 'Ubat Nyamuk', 'Ubat Nyamuk Super', 'Tali Keluar', 'Penawar Penuh']) },
    D: npc('gadis', 'up', 'Mesin layan diri di sudut sana jual minuman sejuk. Pengawal di Seberang Jaya pun suka minuman!'),
  }
};
MAPS.gim4 = gymMap('Gim Bertam', 'o', {
  A: gymLeader(3, {
    s: 'ketua4', name: 'CIK MELUR',
    pre: 'CIK MELUR: Selamat datang ke Gim Bertam. Saya CIK MELUR. Saya suka bunga dan tumbuhan... Monsta jenis RUMPUT saya berakar kuat seperti pokok di ladang!',
    team: [['Periukkera', 29], ['Cendawanraja', 24], ['Bungabangkai', 29]], items: ['Ubat Super'],
    lose: 'CIK MELUR: Oh! Saya kalah... Kamu sangat hebat. Ambillah LENCANA PADI ini.',
    badgeText: 'CIK MELUR: LENCANA PADI membuktikan kekuatan kamu. Semoga kamu terus mekar!',
    after: 'CIK MELUR: Taman bunga saya sentiasa terbuka untuk kamu.', reward: ['Ubat Hiper', 1]
  }),
  I: trainer('gadis', 'down', 'Gadis', 'Suraya', [['Pakma', 23], ['Periuk', 23]], 'Hai! Suka bunga? Bunga saya berduri!', 'Bunga saya layu...', 'Monsta jenis API sangat berkesan melawan RUMPUT.'),
  J: trainer('gadis2', 'right', 'Gadis', 'Salmah', [['Cendawan', 24], ['Pakma', 24]], 'Cendawan tumbuh selepas hujan. Jom bertarung!', 'Cendawan saya kecut!', 'Cik Melur sangat lembut, tapi Monsta dia garang!'),
  N: trainer('gadis', 'left', 'Gadis', 'Ros', [['Bungabangkai', 26]], 'Bau bunga saya boleh buat kamu pengsan!', 'Busuknya kekalahan ini...', 'Jenis TERBANG juga bagus melawan RUMPUT.'),
  U: gymGuide('Rumput', 'Cik Melur guna Monsta jenis RUMPUT. Monsta jenis API, AIS, TERBANG dan RACUN sangat sesuai! Jangan guna jenis AIR atau TANAH!'),
});
MAPS.markas1 = {
  name: 'Kilang Sawit Lama', inside: true, cave: true, theme: 'gua', music: 'lanun', escape: true,
  tiles: [
    '################',
    '#1_______dd____#',
    '#____A_________#',
    '#_dd_____dd__N_#',
    '#_dd_____dd____#',
    '#______O_______#',
    '#mmm____mmm____#',
    '#______________#',
    '#__I_______dd__#',
    '#______D_______#',
    '#______________#',
    '#######E########',
  ],
  doors: { 1: { to: 'markas2', at: '1' } },
  o: {
    A: lanun('down', [['Tikusraya', 22], ['Tedung', 22]], 'Macam mana kamu jumpa MARKAS kami?! Tak boleh dibiarkan!', 'Tak guna!', 'Bos ada di tingkat bawah. Kamu takkan menang!'),
    O: lanun('left', [['Keluang', 23], ['Selut', 22]], 'Penceroboh! Penceroboh!', 'Aduh!', 'Kami kumpul Monsta untuk dijual. Untung besar!'),
    N: lanun('down', [['Asap', 23], ['Asap', 23], ['Mencit', 22]], 'Jangan harap kamu dapat turun ke bawah!', 'Kalah pula...', 'Bos kami sangat kuat. Dia pakai Monsta jenis TANAH.'),
    D: lanun('up', [['Tedung', 24], ['Kelawar', 23]], 'Hei! Budak! Kamu salah masuk ni!', 'Ugh!', 'Datuk Garang akan hancurkan kamu!'),
    I: item('Ubat Super'),
  }
};
MAPS.markas2 = {
  name: 'Markas Geng Lanun', inside: true, cave: true, theme: 'gua', music: 'lanun', escape: true,
  tiles: [
    '################',
    '#1_____________#',
    '#_mmmm____mmmm_#',
    '#______N_______#',
    '#_dd________dd_#',
    '#______A_______#',
    '#____dd__dd____#',
    '#__O________U__#',
    '#______________#',
    '#_____I____J___#',
    '#______________#',
    '################',
  ],
  doors: { 1: { to: 'markas1', at: '1' } },
  o: {
    N: lanun('down', [['Keluang', 24], ['Tikusraya', 24]], 'Jangan ganggu mesyuarat Bos!', 'Aduhai!', 'Bos... maafkan saya...'),
    O: lanun('right', [['Tedung', 25], ['Selut', 24]], 'Siapa benarkan kamu masuk?!', 'Hmph!', 'Kami akan balas dendam!'),
    U: lanun('left', [['Jerebu', 25]], 'Asap Jerebu aku akan butakan mata kamu!', 'Uhuk uhuk!', 'Semua Monsta kami untuk dijual ke luar negara.'),
    A: {
      s: 'datuk', d: 'down', show: () => !flag('markas_selesai'), run: async o => {
        await say('DATUK GARANG: Jadi, kamu budak yang mengganggu urusan Geng Lanun di Guar Kepah dan Kepala Batas?');
        await say('DATUK GARANG: Aku DATUK GARANG, ketua GENG LANUN! Kami kumpul Monsta dan jualnya untuk keuntungan!');
        await say('DATUK GARANG: Kamu fikir kamu boleh halang aku? Budak mentah! Mari aku ajar kamu!');
        const r = await fightTrainer({ cls: 'Ketua Lanun', name: 'DATUK GARANG', team: [['Ularbatu', 25], ['Badak', 24], ['Seladang', 29]], lanun: true, pay: 100, music: 'ketua', lose: 'DATUK GARANG: Apa?! Aku kalah?!' }, 'datuk');
        if (r !== 'win') return;
        await say('DATUK GARANG: Hmph... Nampaknya aku terlalu memandang rendah kamu. Markas ini sudah tidak selamat.');
        await say('DATUK GARANG: Ambil benda ni. Aku tak perlukannya lagi. Tapi ingat, kita akan bertemu lagi!');
        await give('Teropong Roh');
        await say('Datuk Garang melarikan diri!');
        setFlag('markas_selesai');
        await say('TEROPONG ROH boleh mengenal pasti HANTU. Mungkin berguna di Tasek Gelugor...');
      }
    },
    I: item('Bola Ultra'), J: item('Semangat'),
  }
};

MAPS.laluan6 = {
  name: 'Laluan 6', outdoor: true, border: 'Y',
  tiles: [
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
    'YY,,,,,,......YYYY.......,,,,,..YY',
    'YY,,,,,,..A...YYYY...I...,,,,,..YY',
    'YY,,,,,,......YYYY.......,,,,,..YY',
    'YY.......................,,,,,..YY',
    '==================================',
    'YY......,,,,,,.......D......,,,,YY',
    'YY..a...,,,,,,..............,,,,YY',
    'YY......,,,,,,....YYYY......,,,,YY',
    'YY.N....,,,,,,....YYYY..O...,,,,YY',
    'YYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYYY',
  ],
  conn: { w: 'bertam', e: 'tasekgelugor' },
  enc: { grass: [['Ayam', 17, 20, 20], ['Comel', 17, 20, 15], ['Musangapi', 17, 20, 15], ['Merbah', 18, 20, 20], ['Tikusraya', 18, 20, 20], ['Kudapi', 18, 20, 10]] },
  o: {
    a: sign('LALUAN 6\nBertam — Tasek Gelugor'),
    A: trainer('budak', 'down', 'Budak Sekolah', 'Hazim', [['Ayam', 19], ['Mencit', 19], ['Comel', 19]], 'Ayam aku berkokok kuat pagi tadi. Hari bertuah!', 'Tak bertuah rupanya...', 'Ayam boleh berevolusi jadi Ayamserama!'),
    I: trainer('gadis', 'down', 'Gadis', 'Syaza', [['Musangapi', 20], ['Pakma', 20]], 'Musang aku berbulu api! Hati-hati!', 'Apinya padam...', 'BATU API boleh buat Musangapi berevolusi.'),
    D: trainer('pakcik', 'up', 'Petani', 'Samad', [['Kerbau', 21], ['Ayam', 21]], 'Kerbau pak cik kuat membajak sawah. Kuat juga bertarung!', 'Aduh, kerbau pak cik penat.', 'Kerbau lambat tapi sabar.'),
    N: trainer('gadis2', 'up', 'Pelajar', 'Amira', [['Kukangsakti', 21]], 'Kukangsakti aku boleh baca fikiran kamu!', 'Tak sangka!', 'Kuasa minda sangat hebat melawan jenis LAWAN dan RACUN.'),
    O: trainer('pendaki', 'up', 'Pendaki', 'Faizal', [['Batuhidup', 21], ['Monyet', 20]], 'Batu aku berguling laju!', 'Batu aku tergolek...', 'Jenis AIR hancurkan batu aku.'),
  }
};

MAPS.tasekgelugor = {
  name: 'Tasek Gelugor', outdoor: true, music: 'gua',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT......................TT',
    'TT.RRRRRR.......HHHH....TT',
    'TT.RRRRRR.......HHHH....TT',
    'TT.RRRRRR.......HH2H....TT',
    'TT.RRR1RR...............TT',
    '===.........a...........TT',
    'TT......................TT',
    'TT..PPPPP....MMMM.......TT',
    'TT..PPPPP....MMMM...N...TT',
    'TT..PP3PP....MM4M.......TT',
    'TT......................TT',
    'TT.HHHH.......HHHH..q...TT',
    'TT.HHHH.......HHHH......TT',
    'TT.HH5H.......HH6H......TT',
    'TT...........i..........TT',
    'TTTTTTTTTT==TTTTTTTTTTTTTT',
  ],
  conn: { w: 'laluan6', s: 'laluan8' },
  fly: [6, 11],
  doors: {
    1: { to: 'rumahtinggal1' },
    2: {
      to: 'rumah', o: {
        A: {
          s: 'atuk', d: 'down', show: () => flag('tokwan'), run: async () => {
            if (!flag('seruling')) {
              await say('TOK WAN: Terima kasih kerana menyelamatkan Tok. Geng Lanun mahu mencuri Monsta yatim di sini...');
              await say('TOK WAN: Tok nak beri kamu sesuatu. Ini SERULING buluh Tok.');
              setFlag('seruling'); await give('Seruling');
              await say('TOK WAN: Lagunya boleh membangunkan Monsta yang tidur. Ada Monsta besar tidur di jalan ke Permatang Pauh...');
              return;
            }
            await say('TOK WAN: Monsta, seperti manusia, perlukan kasih sayang. Jagalah Monsta kamu baik-baik.');
          }
        },
        I: npc('budak', 'up', () => flag('tokwan') ? 'Tok Wan dah balik! Terima kasih!' : 'Tok Wan hilang! Geng Lanun bawa dia ke rumah tinggal!'),
      }
    },
    3: KLINIK,
    4: shop(['Bola Hebat', 'Bola Tangkap', 'Ubat Super', 'Semangat', 'Penawar', 'Ubat Bakar', 'Ubat Cair Ais', 'Ubat Nyamuk', 'Tali Keluar']),
    5: house({ A: npc('gadis2', 'down', 'Monsta Seladang saya... dia pergi mempertahankan anaknya daripada Lanun... dan tak pernah pulang.'), D: npc('makcik', 'left', 'Kasihan budak tu. Semangat Seladang ibu tu masih berkeliaran di rumah tinggal.') }),
    6: house({ A: npc('atuk', 'down', 'Nama Tasek Gelugor datang daripada tasik dan pokok asam gelugor yang banyak di sini dulu.') }),
  },
  o: {
    a: sign('TASEK GELUGOR\nPekan yang tenang... tetapi rumah lama itu menyeramkan.'),
    q: sign('Laluan 8 ke selatan: Permatang Pauh'),
    N: npc('makcik', 'down', 'Rumah tinggal tu berhantu! Ada orang nampak HANTU di tingkat atas.', { move: 'wander' }),
    i: npc('budak', 'up', () => flag('tokwan') ? 'Tok Wan dah selamat! Kamu hero!' : 'Geng Lanun culik Tok Wan dan bawa dia ke rumah tinggal!'),
  }
};
MAPS.rumahtinggal1 = {
  name: 'Rumah Tinggal', inside: true, music: 'gua', theme: 'malam',
  tiles: [
    '############',
    '#Q_______1_#',
    '#__________#',
    '#_o____A___#',
    '#__________#',
    '#__________#',
    '#__________#',
    '#o________o#',
    '#__________#',
    '#####E######',
  ],
  doors: { 1: { to: 'rumahtinggal2', at: '1' } },
  o: { A: npc('makcik2', 'down', 'Rumah ini tempat Monsta yatim berteduh. Semangat seekor Seladang ibu masih berkeliaran di tingkat atas...') }
};
MAPS.rumahtinggal2 = {
  name: 'Rumah Tinggal 2F', inside: true, music: 'gua', theme: 'malam', ghostEnc: true, escape: true,
  tiles: [
    '############',
    '#1V_______3#',
    '#V_________#',
    '#__dd__dd__#',
    '#__dd__dd__#',
    '#____D_____#',
    '#__dd__dd__#',
    '#__________#',
    '#_I______J_#',
    '############',
  ],
  doors: { 1: { to: 'rumahtinggal1', at: '1' }, 3: { to: 'rumahtinggal3', at: '1' } },
  enc: { cave: [['Toyol', 19, 23, 60], ['Pelesit', 22, 24, 8], ['Kelawar', 20, 23, 32]], crate: .1 },
  o: {
    D: { s: 'johan', d: 'up', show: () => !flag('rival5') },
    V: {
      if: () => !flag('rival5'), trig: async () => {
        const r = obj('D');
        await say('{R}: Hei, {P}! Apa kamu buat di sini? Monsta kamu belum mati pun!');
        if (r) await approach(r);
        if (r) turnP(OPP[r.dir]);
        await say('{R}: Aku datang melawat kubur Monsta... eh, tak apalah. Jom lawan! Aku tunjuk betapa kuatnya aku sekarang!');
        const res = await Story.rivalFight(5, null, '{R}: Apa?! Kamu memang menjengkelkan!');
        if (res !== 'win') return;
        await say('{R}: Hmph! Ada HANTU di tingkat atas. Monsta aku tak boleh kenal pasti. Kamu pun tak boleh, kan? Hahaha! Jumpa lagi!');
        if (r) World.objs = World.objs.filter(q => q !== r);
        setFlag('rival5');
      }
    },
    I: item('Semangat'), J: item('Ubat Super'),
  }
};
MAPS.rumahtinggal3 = {
  name: 'Rumah Tinggal 3F', inside: true, music: 'gua', theme: 'malam', ghostEnc: true, escape: true,
  tiles: [
    '############',
    '#_____A____#',
    '#____O_N___#',
    '#__________#',
    '#####Z######',
    '#____V_____#',
    '#__________#',
    '#__dd__dd__#',
    '#1_______I_#',
    '############',
  ],
  doors: { 1: { to: 'rumahtinggal2', at: '3' } },
  enc: { cave: [['Toyol', 20, 24, 55], ['Pelesit', 22, 25, 15], ['Kelawar', 21, 24, 30]], crate: .1 },
  o: {
    Z: { u: '_', trig: async () => { }, show: () => false },
    V: {
      if: () => !flag('hantu_seladang'), trig: async () => {
        if (!S.bag['Teropong Roh']) {
          await say('Pergi... pergi dari sini...');
          const r0 = await wildBattle('Seladang', 30, { ghost: true, nocatch: true, intro: 'HANTU muncul!' });
          if (r0 === 'lose') return;
          await say('HANTU itu menghalang laluan!');
          await walk('P', 'd');
          return;
        }
        await say('TEROPONG ROH mengenal pasti HANTU itu!');
        await say('Ia SEMANGAT SELADANG... ibu yang dibunuh oleh Geng Lanun!');
        const r = await wildBattle('Seladang', 30, { ghost: true, nocatch: true, intro: 'SEMANGAT SELADANG muncul!' });
        if (r === 'win') {
          await say('Semangat Seladang itu kelihatan tenang... Ia sudah boleh berehat dengan aman.');
          await say('Semangat itu hilang perlahan-lahan...');
          setFlag('hantu_seladang');
        } else if (r !== 'lose') await walk('P', 'd');
      }
    },
    O: lanun('down', [['Keluang', 25], ['Tedung', 25]], 'Hah?! Macam mana kamu lepasi hantu tu?!', 'Aduh!', 'Kami cuma nak Monsta yatim tu!', { show: () => !flag('tokwan') }),
    N: lanun('down', [['Tikusraya', 25], ['Selut', 26]], 'Orang tua ni degil sangat! Jangan masuk campur!', 'Ugh!', 'Lepaskan dia? Tak mungkin!', { show: () => !flag('tokwan') }),
    A: {
      s: 'atuk', d: 'down', show: () => !flag('tokwan'), run: async () => {
        if (!flag('tr:rumahtinggal3:O') || !flag('tr:rumahtinggal3:N')) { await say('TOK WAN: Tolong! Lanun-lanun ini mahu mencuri Monsta yatim Tok!'); return; }
        await say('TOK WAN: Hmm... Kamu yang menghalau Lanun-lanun itu? Terima kasih, anak muda.');
        await say('TOK WAN: Tok TOK WAN. Tok jaga Monsta yatim di Tasek Gelugor. Mari, ikut Tok balik ke rumah.');
        setFlag('tokwan');
        await fadeTo(1, 3);
        S.ret = { map: 'tasekgelugor', x: 18, y: 5 };
        S.door = { m: 'tasekgelugor', d: '2' };
        World.load('rumah', 3, 4, 'up', MAPS.tasekgelugor.doors[2]);
        await fadeTo(0, 3);
        const t = obj('A'); if (t) await World.talk(t);
      }
    },
    I: item('Ubat Hiper'),
  }
};

MAPS.laluan7 = {
  name: 'Laluan 7', outdoor: true, border: 'Y',
  tiles: [
    'YYYYYYYYY=YYYYYYYYYY',
    'YY.......=........YY',
    'YY.,,,,,.=.,,,,,,.YY',
    'YY.,,,,,.=.,,,,,,.YY',
    'YY.......=.....A..YY',
    'YYYYYY...=...YYYYYYY',
    'YY.......=........YY',
    'YY..I....=..,,,,,.YY',
    'YY.......=..,,,,,.YY',
    'YY,,,,...=..,,,,,.YY',
    'YY,,,,...=....D...YY',
    'YY,,,,...=........YY',
    'YYLLLLLL.=.LLLLLLLYY',
    'YY.......=........YY',
    'YY...a...=..N.....YY',
    'YY,,,,,..=..,,,,,.YY',
    'YY,,,,,..=..,,,,,.YY',
    'YY.......=........YY',
    'YYYYYYYYY=YYYYYYYYYY',
  ],
  conn: { n: 'bertam', s: 'butterworth' },
  enc: { grass: [['Ayam', 18, 21, 20], ['Musangapi', 18, 20, 15], ['Monyet', 18, 21, 15], ['Pakma', 18, 21, 15], ['Mentol', 19, 21, 10], ['Tikusraya', 19, 21, 25]] },
  o: {
    a: sign('LALUAN 7\nBertam — Butterworth'),
    A: trainer('pendekar', 'left', 'Ahli Silat', 'Rizuan', [['Pesilat', 20], ['Monyet', 20]], 'Hiyah! Buah silat aku tak pernah gagal!', 'Buah silat aku... tumpas.', 'Gelanggang silat di Seberang Jaya melatih ahli silat yang hebat.'),
    I: trainer('gadis', 'right', 'Gadis', 'Wani', [['Ayam', 19], ['Kelip', 20]], 'Nak ke Butterworth? Lawan aku dulu!', 'Aku kalah...', 'Butterworth ada pelabuhan yang besar.'),
    D: trainer('budak2', 'left', 'Pemburu Serangga', 'Iqbal', [['Tebuan', 20], ['Cendawan', 20]], 'Tebuan aku marah! Awas sengatnya!', 'Tebuan aku terbang lari...', 'Cendawan di belakang serangga itu mengawal fikirannya.'),
    N: trainer('nelayan', 'left', 'Nelayan', 'Salleh', [['Sepat', 21], ['Ketam', 21]], 'Hari ni tak dapat ikan, dapat lawan pun jadilah!', 'Umpan aku habis!', 'Kalau ada JORAN, cubalah memancing di pelabuhan.'),
  }
};

MAPS.butterworth = {
  name: 'Butterworth', outdoor: true, theme: 'bandar',
  tiles: [
    'TTTTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
    'TT..............-.............TT',
    'TT.BBBBBB.......-......GGGGGG.TT',
    'TT.BBBBBB.......-......GGGGGG.TT',
    'TT.BBBBBB.......-......GGGGGG.TT',
    'TT.BBB1BB.......-......GGG2GG.TT',
    'TT......a.......-.......q.....TT',
    'TT--------------------------..TT',
    'TT....PPPPP.....-....MMMM.....TT',
    'TT....PPPPP.....-....MMMM.....TT',
    'TT....PP3PP.....-....MM4M.....TT',
    'TT..............-.............TT',
    'TT..HHHH....HHHH-....HHHH.....TT',
    'TT..HHHH....HHHH-....HHHH.....TT',
    'TT..HH5H....HH6H-....HH7H..i..TT',
    'TT..............-.............TT',
    'TT..............-.............TT',
    '~~~~~~~~~~kkk...-.............TT',
    '~~~~~~~~~~kkk...-..WWWW.......TT',
    '~~~~~~~~kkkkk...-..WWWW...N...TT',
    '~~~~~~~~k9k~~...-..WW8W.......TT',
    '~~~~~~~~~~~~~...-.............TT',
    '~~~~~~~~~~~~~...-...y.........TT',
    'TTTTTTTTTTTTTTTT-TTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan7', s: 'laluan10' },
  fly: [8, 11],
  enc: { water: [['Oborobor', 25, 32, 50], ['Ketam', 25, 30, 25], ['Kudalaut', 25, 30, 25]], fish: [['Bilis', 10, 20, 40], ['Ketam', 15, 22, 30], ['Kepah', 15, 22, 30]] },
  doors: {
    1: house({ A: npc('makcik', 'down', 'Rumah pangsa ni dah lama. Dari tingkap boleh nampak Selat dan kapal-kapal besar.'), D: npc('budak', 'up', 'Kapten Rizal tu dulu juruterbang pesawat pejuang! Monsta dia macam kilat!') }),
    2: { to: 'gim3' }, 3: KLINIK,
    4: shop(['Bola Tangkap', 'Bola Hebat', 'Ubat Super', 'Ubat Nyamuk', 'Tali Keluar', 'Penawar', 'Ubat Lumpuh', 'Ubat Bangun']),
    5: {
      to: 'rumah', o: {
        A: {
          s: 'pakcik', d: 'down', run: async () => {
            if (flag('baucar')) { await say('PENGERUSI: Hai kawan! Selalu datang lawat kelab kami ya!'); return; }
            await say('PENGERUSI: Selamat datang ke KELAB PEMINAT MONSTA BUTTERWORTH! Aku pengerusi kelab ini.');
            if (!(await UI.yes('PENGERUSI: Kamu nak dengar cerita tentang Monsta kesayangan aku?'))) { await say('PENGERUSI: Oh... datanglah lagi bila ada masa.'); return; }
            await say('PENGERUSI: Monsta aku ialah Comel. Bulunya lembut, matanya bulat, dan dia suka tidur atas perut aku...');
            await say('PENGERUSI: Setiap pagi dia kejutkan aku dengan menjilat hidung aku! Comel betul!');
            await say('PENGERUSI: Terima kasih kerana sudi mendengar! Ambil BAUCAR ini sebagai tanda terima kasih.');
            setFlag('baucar'); await give('Baucar Basikal');
            await say('PENGERUSI: Tukarkan di Kedai Basikal Kepala Batas. Basikal sangat berguna!');
          }
        },
        I: npc('gadis', 'up', 'Kami semua sayang Monsta! Kelab ini tempat kami berkongsi cerita.'),
        D: npc('budak2', 'left', 'Monsta yang disayangi akan lebih bersemangat bertarung!'),
      }
    },
    6: house({ A: npc('askar', 'down', 'Aku bertugas di Pangkalan Udara Butterworth. Bunyi jet di sini kuat, tapi Monsta Elektrik suka!') }),
    7: house({ A: npc('makcik2', 'down', 'Ubat Nyamuk sangat berguna. Monsta liar yang lemah tak akan dekat dengan kamu.'), I: npc('budak', 'up', 'Ayah aku kerja di pelabuhan. Dia kata Geng Lanun selalu seludup Monsta melalui laut!') }),
    8: { to: 'rumah', lock: () => true, lockText: 'GUDANG PELABUHAN\nKakitangan sahaja.' },
    9: { to: 'kapal', ret: [9, 19], look: 'kapal', lock: () => !S.bag['Tiket Kapal'] || flag('kapal_pergi'), lockText: () => flag('kapal_pergi') ? 'Kapal SERI PERAI sudah belayar ke laut lepas.' : 'KELASI: Maaf, hanya penumpang yang ada TIKET boleh naik kapal SERI PERAI.' },
  },
  o: {
    a: sign('BUTTERWORTH\nBandar pelabuhan dan pintu gerbang Seberang Perai.'),
    q: sign('GIM BUTTERWORTH\nKetua: KAPTEN RIZAL\n"Petir yang menyambar dari langit!"'),
    y: sign('PELABUHAN BUTTERWORTH'),
    i: npc('askar', 'down', 'Pangkalan Udara Butterworth sangat terkenal. Kapten Rizal dulu juruterbang di sana!', { move: 'wander' }),
    N: npc('nelayan', 'left', () => flag('kapal_pergi') ? 'Kapal SERI PERAI dah belayar. Mungkin ia akan kembali tahun depan.' : 'Kapal SERI PERAI sedang berlabuh. Hanya yang ada tiket boleh naik.'),
  }
};
MAPS.gim3 = gymMap('Gim Butterworth', 'm', {
  A: gymLeader(2, {
    s: 'ketua3', name: 'KAPTEN RIZAL',
    pre: 'KAPTEN RIZAL: Hei budak! Kamu nak cabar aku? Aku KAPTEN RIZAL, bekas juruterbang pesawat pejuang! Monsta ELEKTRIK aku sepantas kilat. Bersedia!',
    team: [['Kunang', 21], ['Mentol', 18], ['Tupaipetir', 24]], items: ['Ubat Super'],
    lose: 'KAPTEN RIZAL: Wah! Kamu memang hebat, budak! Aku tabik kamu! Ambil LENCANA PETIR ini!',
    badgeText: 'KAPTEN RIZAL: LENCANA PETIR membolehkan kamu menggunakan TERBANG di luar pertarungan. Kamu boleh terbang ke bandar yang pernah kamu lawati!',
    after: 'KAPTEN RIZAL: Terus terbang tinggi, budak!', reward: ['Ubat Super', 3]
  }),
  I: trainer('askar', 'down', 'Askar', 'Hafiz', [['Mentol', 20], ['Kelip', 20]], 'Berhenti! Ini gim tentera!', 'Aku mengaku kalah!', 'Kapten Rizal tak pernah kalah dengan budak... sebelum ni.'),
  J: trainer('askar', 'right', 'Askar', 'Rahman', [['Tupaikilat', 21], ['Tupaikilat', 21]], 'Dua Tupaikilat! Bersedia untuk renjatan elektrik!', 'Litar pintas!', 'Jenis TANAH kebal dengan serangan ELEKTRIK!'),
  N: trainer('saintis', 'left', 'Jurutera', 'Karim', [['Mentol', 21], ['Kelip', 21]], 'Aku jurutera elektrik. Voltan aku tinggi!', 'Fius terbakar...', 'Mentol boleh berevolusi jadi Neonraja.'),
  U: gymGuide('Elektrik', 'Kapten Rizal guna Monsta jenis ELEKTRIK. Monsta jenis TANAH kebal dengan serangan elektrik! Jangan guna jenis AIR atau TERBANG.'),
});
MAPS.kapal = {
  name: 'Kapal Seri Perai', inside: true, music: 'laluan',
  tiles: [
    '################',
    '#Q____A_____n_Q#',
    '#_____________l#',
    '#_KK___I___KK__#',
    '#_KK_______KK__#',
    '#______D_______#',
    '#_J__________N_#',
    '#VVVVVVVVVVVVVV#',
    '#_KK________KK_#',
    '#_KK________KK_#',
    '#______________#',
    '#######E########',
  ],
  shelf: 'Peta laut Selat dan pelabuhan-pelabuhan.',
  o: {
    A: {
      s: 'kapten', d: 'down', run: async () => {
        if (flag('tebas_dapat')) { await say('KAPTEN: Terima kasih lagi! Kapal akan belayar tak lama lagi. Selamat jalan!'); return; }
        await say('KAPTEN: Ugh... aku mabuk laut... Walaupun aku kapten kapal...');
        if (!(await UI.yes('Urut belakang kapten?'))) { await say('KAPTEN: Uwekk...'); return; }
        await say('{P} mengurut belakang kapten...');
        await wait(.8);
        await say('KAPTEN: Aaahh! Lega rasanya! Terima kasih, budak!');
        await say('KAPTEN: Sebagai tanda terima kasih, ambil CAKERA RAHSIA ini. Ia mengajar jurus TEBAS!');
        setFlag('tebas_dapat'); await give('CR01 Tebas');
        await say('KAPTEN: TEBAS boleh memotong semak kecil yang menghalang jalan. Tapi kamu perlukan LENCANA OMBAK untuk menggunakannya.');
        await say('KAPTEN: Kapal akan belayar sebentar lagi. Baik kamu turun sekarang!');
        setFlag('kapal_pergi');
      }
    },
    I: trainer('nelayan', 'down', 'Kelasi', 'Jamil', [['Ketam', 19], ['Oborobor', 19]], 'Ahoy! Kelasi di kapal ni semua jurulatih!', 'Kapal karam!', 'Kapten mabuk laut lagi, kesian dia.'),
    J: trainer('gadis', 'right', 'Pelancong', 'Melati', [['Comel', 20], ['Pipit', 20]], 'Pelayaran ini sangat mewah! Jom bertarung sementara menunggu!', 'Tak seronok kalah...', 'Selat ini sangat cantik waktu senja.'),
    N: trainer('pakcik', 'left', 'Usahawan', 'Kassim', [['Musangapi', 22], ['Comel', 21]], 'Aku orang kaya. Monsta aku pun mahal!', 'Duit tak boleh beli kemenangan...', 'Pelaburan terbaik ialah melatih Monsta!'),
    D: { s: 'johan', d: 'down', show: () => !flag('rival4') },
    V: {
      if: () => !flag('rival4'), trig: async () => {
        const r = obj('D');
        await say('{R}: Hah! {P}! Kamu pun naik kapal ni?');
        if (r) { await approach(r); turnP(OPP[r.dir]); }
        await say('{R}: Aku dah latih Monsta aku bersungguh-sungguh. Kamu takkan menang kali ni!');
        const res = await Story.rivalFight(4, null, '{R}: Tak guna! Aku kalah lagi!');
        if (res !== 'win') return;
        await say('{R}: Aku dengar kapten ada CAKERA RAHSIA. Tapi aku dah dapat pun... dia mabuk laut, kesian. Jumpa lagi, {P}!');
        if (r) World.objs = World.objs.filter(q => q !== r);
        setFlag('rival4');
      }
    },
    l: item('Ubat Super'),
  }
};

MAPS.laluan8 = {
  name: 'Laluan 8', outdoor: true,
  tiles: [
    'TTTTTTTTTT==TTTTTTTT',
    'TTpppppp..==..ppppTT',
    'TTpppppp..==..ppppTT',
    'TTpppppp..==..ppppTT',
    'TTTTTTTTTTZTTTTTTTTT',
    'TT..pppp..=.pppp..TT',
    'TT..pppp..=.pppp..TT',
    'TT........=..A....TT',
    'TT~~~~~~..=..~~~~~TT',
    'TT~~~~~~..=..~~~~~TT',
    'TT..I.....=.......TT',
    'TTpppppp..=..ppppTTT',
    'TTpppppp..=..ppppTTT',
    'TTpppppp..=..ppppTTT',
    'TT........=....D..TT',
    'TT..a.....=.......TT',
    'TTTTTTTTTT=TTTTTTTTT',
  ],
  conn: { n: 'tasekgelugor', s: 'permatangpauh' },
  enc: { grass: [['Kerbau', 22, 26, 20], ['Itik', 22, 25, 20], ['Bangau', 23, 26, 15], ['Ayam', 22, 25, 20], ['Sepat', 22, 25, 10], ['Berudu', 22, 25, 15]], water: [['Sepat', 25, 30, 40], ['Berudu', 25, 30, 30], ['Itik', 25, 30, 30]], fish: [['Sepat', 15, 25, 60], ['Berudu', 15, 25, 30], ['Haruan', 20, 25, 10]] },
  o: {
    a: sign('LALUAN 8\nTasek Gelugor — Permatang Pauh'),
    Z: {
      mon: 'Beruang', u: '=', show: () => !flag('beruang1'), t: 'Seekor Monsta besar sedang tidur nyenyak di tengah jalan... Dengkurnya kuat sekali.',
      flute: async () => {
        await say('BERUANG terjaga dari tidurnya!');
        await say('BERUANG sedang marah dan menyerang!');
        const r = await wildBattle('Beruang', 30);
        setFlag('beruang1');
        if (r !== 'caught') await say('BERUANG itu kembali ke dalam hutan.');
      }
    },
    A: trainer('pakcik', 'left', 'Petani', 'Mat', [['Kerbau', 24], ['Ayam', 23]], 'Musim menuai dah dekat. Pak cik tengah bersemangat ni!', 'Aduh, penat membajak...', 'Bendang di Permatang Pauh sangat luas.'),
    I: trainer('gadis2', 'right', 'Gadis', 'Rahmah', [['Itik', 24], ['Bangau', 25]], 'Bangau aku suka ikut kerbau di sawah!', 'Bangau aku terbang pergi...', 'Bangau sabar menunggu ikan.'),
    D: trainer('nelayan', 'left', 'Nelayan', 'Wahab', [['Sepat', 24], ['Berudu', 24], ['Katak', 25]], 'Parit sawah penuh ikan sepat!', 'Umpan habis!', 'Katak boleh berevolusi dengan BATU AIR.'),
  }
};

MAPS.permatangpauh = {
  name: 'Permatang Pauh', outdoor: true,
  tiles: [
    'TTTTTTTTTT=TTTTTTTTTTTTTTT',
    'TT........=.............TT',
    'TT.HHHH...=....PPPPP....TT',
    'TT.HHHH...=....PPPPP....TT',
    'TT.HH1H...=....PP2PP....TT',
    'TT........=.............TT',
    'TT..a.....================',
    'TT..MMMM..=.....HHHH....TT',
    'TT..MMMM..=.....HHHH....TT',
    'TT..MM3M..=.....HH4H....TT',
    'TT........=.........N...TT',
    'TT..pppp..=..pppppp.....TT',
    'TT..pppp..=..pppppp.....TT',
    'TT........=......q......TT',
    'TTTTTTTTTT=TTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan8', s: 'laluan9', e: 'laluan12' },
  fly: [17, 5],
  doors: {
    1: {
      to: 'rumah', o: {
        A: {
          s: 'pendaki', d: 'down', run: async () => {
            if (flag('terbang_dapat')) { await say('Monsta TERBANG boleh bawa kamu ke mana-mana bandar yang pernah kamu lawati. Hebat kan?'); return; }
            await say('Aku sangat suka burung! Aku boleh tengok Helang terbang sepanjang hari...');
            await say('Kamu pun suka Monsta terbang? Ambillah CAKERA RAHSIA ini!');
            setFlag('terbang_dapat'); await give('CR02 Terbang');
            await say('Ajar TERBANG kepada Monsta jenis TERBANG. Dengan LENCANA PETIR, kamu boleh terbang ke bandar lain!');
          }
        },
        I: npc('gadis2', 'up', 'Abang aku gila burung. Dia selalu pergi tengok Bangau di sawah.'),
      }
    },
    2: KLINIK,
    3: shop(['Bola Hebat', 'Bola Tangkap', 'Ubat Super', 'Ubat Hiper', 'Semangat', 'Penawar', 'Ubat Lumpuh', 'Ubat Bakar', 'Ubat Nyamuk', 'Ubat Nyamuk Super']),
    4: house({ A: npc('makcik', 'down', 'Permatang Pauh terkenal dengan sawah padinya. Monsta Kerbau dan Bangau banyak di sini.'), D: npc('atuk', 'left', 'Dulu Tok bawa kerbau membajak sawah. Sekarang semua guna jentera!') }),
  },
  o: {
    a: sign('PERMATANG PAUH\nKampung bendang yang luas saujana mata memandang.'),
    q: sign('Laluan 9 ke selatan: Seberang Jaya. Laluan 12 ke timur: Bukit Tambun.'),
    N: npc('pakcik', 'down', 'Pengawal di pintu masuk Seberang Jaya kehausan. Kalau ada air minuman, mesti dia gembira.', { move: 'wander' }),
  }
};
MAPS.laluan9 = {
  name: 'Laluan 9', outdoor: true,
  tiles: [
    'TTTTTTTTTT=TTTTTTT',
    'TT........=.....TT',
    'TT.,,,,,..=..,,,TT',
    'TT.,,,,,..=..,,,TT',
    'TT........=..A..TT',
    'TT,,,,....=.....TT',
    'TT,,,,....=..,,,TT',
    'TT..I.....=..,,,TT',
    'TT........=.....TT',
    'TTTTTTTTTTZTTTTTTT',
    'TTTTTTTTTT=TTTTTTT',
  ],
  conn: { n: 'permatangpauh', s: 'seberangjaya' },
  enc: { grass: [['Kudapi', 23, 26, 15], ['Tikusraya', 23, 26, 20], ['Merbah', 24, 26, 20], ['Kelip', 23, 25, 15], ['Musangapi', 23, 25, 20], ['Tedung', 24, 26, 10]] },
  o: {
    Z: pengawal(),
    A: trainer('pendekar', 'left', 'Ahli Silat', 'Azlan', [['Pesilat', 26], ['Monyet', 25]], 'Silat bukan untuk bergaduh, tapi untuk mempertahankan diri. Mari berlatih!', 'Kamu berilmu tinggi!', 'Guru silat di Seberang Jaya sangat hebat.'),
    I: trainer('gadis', 'right', 'Gadis', 'Nabila', [['Kudapi', 25], ['Comel', 25]], 'Kudapi aku larinya laju!', 'Kuda aku tersungkur...', 'Seberang Jaya tu bandar moden. Tapi sekarang ditutup...'),
  }
};

MAPS.seberangjaya = {
  name: 'Seberang Jaya', outdoor: true, theme: 'bandar',
  tiles: [
    'TTTTTTTTTT-TTTTTTTTTTTTTTTTTTTTTTT',
    'TT........-.....................TT',
    'TT.HHHH...-....BBBBBBBBBB.......TT',
    'TT.HHHH...-....BBBBBBBBBB.......TT',
    'TT.HH1H...-....BBBBBBBBBB.......TT',
    'TT........-....BBBBBBBBBB.......TT',
    'TT..a.....-....BBBBBBBBBB.......TT',
    'TT........-....BBBB2BBBBB.......TT',
    '----------------------------------',
    'TT........-.........q...........TT',
    'TT.PPPPP..-..MMMMMM....GGGGGG...TT',
    'TT.PPPPP..-..MMMMMM....GGGGGG...TT',
    'TT.PPPPP..-..MMMMMM....GGGGGG...TT',
    'TT.PP3PP..-..MMM4MM....GGG5GG...TT',
    'TT........-..........y....D.....TT',
    'TT........-.....................TT',
    'TT.HHHH...-...HHHHHH...HHHH.....TT',
    'TT.HHHH...-...HHHHHH...HHHH.....TT',
    'TT.HH6H...-...HHH7HH...HH8H..i..TT',
    'TT........-.....................TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan9', w: 'laluan11', e: 'laluan15' },
  fly: [5, 14],
  doors: {
    1: house({ A: npc('pelajar', 'down', () => flag('menara_selesai') ? 'Syarikat Monsta Perai di menara tu yang cipta BOLA TANGKAP. Hebat kan?' : 'Geng Lanun mahu curi teknologi BOLA SAKTI dari Menara Seberang Jaya!') }),
    2: { to: 'menara1' }, 3: KLINIK,
    4: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Hiper', 'Ubat Super', 'Semangat', 'Penawar Penuh', 'Ubat Nyamuk Super', 'Tali Keluar', 'Ubat Cair Ais']),
    5: { to: 'gim6' },
    6: house({ A: npc('makcik2', 'down', 'Seberang Jaya dulu kawasan ladang. Sekarang penuh bangunan tinggi!'), I: npc('budak', 'up', 'Gim Seberang Jaya guna Monsta PSIKIK. Jenis SERANGGA berkesan melawan PSIKIK!') }),
    7: {
      to: 'rumah', o: {
        A: {
          s: 'pendekar', d: 'down', run: async o => {
            if (flag('gelanggang')) { await say('GURU SILAT: Latih PAHLAWAN itu dengan baik. Silat itu seni, bukan sekadar kekuatan.'); return; }
            if (!flag('guru_kalah')) {
              await say('GURU SILAT: Selamat datang ke GELANGGANG SILAT SERI JAYA! Aku guru di sini.');
              await say('GURU SILAT: Kamu mahu menguji ilmu? Mari! Buktikan kehebatan kamu!');
              const r = await fightTrainer({ cls: 'Guru Silat', name: 'Tok Guru', team: [['Pahlawan', 37], ['Beruk', 37]], pay: 60, music: 'ketua', lose: 'GURU SILAT: Hebat! Ilmu kamu tinggi!' }, 'pendekar');
              if (r !== 'win') return;
              setFlag('guru_kalah');
            }
            await say('GURU SILAT: Sebagai hadiah, ambillah anak murid terbaikku, PAHLAWAN!');
            setFlag('gelanggang');
            await giveMon('Pahlawan', 30);
          }
        },
        I: trainer('pendekar', 'up', 'Ahli Silat', 'Firdaus', [['Pesilat', 31], ['Beruk', 31]], 'Nak jumpa Tok Guru? Langkah mayat aku dulu! Eh, maksud aku, lawan aku dulu!', 'Aku perlu berlatih lagi!', 'Tok Guru sangat hebat!'),
      }
    },
    8: house({ A: npc('atuk', 'down', 'Sebelum ada bangunan-bangunan ni, Tok selalu tangkap Monsta di sini.') }),
  },
  o: {
    a: sign('SEBERANG JAYA\nBandar moden di tengah-tengah Seberang Perai.'),
    q: sign('MENARA SEBERANG JAYA\nIbu pejabat Syarikat Monsta Perai.'),
    y: sign('GIM SEBERANG JAYA\nKetua: CIK SURIA\n"Kuasa minda tiada batasnya!"'),
    i: npc('makcik', 'down', () => flag('menara_selesai') ? 'Terima kasih kerana menyelamatkan bandar kami!' : 'Geng Lanun dah tawan Menara Seberang Jaya! Takutnya!', { move: 'wander' }),
    D: npc('lanun', 'up', 'LANUN: Gim ini ditutup! Bos kami ada urusan penting di Menara!', { show: () => !flag('menara_selesai') }),
  }
};
MAPS.gim6 = gymMap('Gim Seberang Jaya', '|', {
  A: gymLeader(5, {
    s: 'ketua6', name: 'CIK SURIA',
    pre: 'CIK SURIA: Aku sudah tahu kamu akan datang... Aku CIK SURIA. Sejak kecil aku boleh membaca fikiran orang. Monsta PSIKIK aku akan melihat setiap langkah kamu!',
    team: [['Kukangsakti', 38], ['Serati', 37], ['Bintanglaut', 38], ['Mahakukang', 43]], items: ['Ubat Hiper'],
    lose: 'CIK SURIA: Aku tidak menjangka kekalahan ini... Kamu layak menerima LENCANA MINDA.',
    badgeText: 'CIK SURIA: Dengan LENCANA MINDA, Monsta kamu akan lebih yakin. Aku dapat rasakan kamu akan pergi jauh.',
    after: 'CIK SURIA: Masa depan kamu... cerah.', reward: ['Bola Ultra', 3]
  }),
  I: trainer('pelajar', 'down', 'Ahli Minda', 'Lutfi', [['Kukang', 34], ['Kukangsakti', 36]], 'Aku dah baca fikiran kamu. Kamu gementar!', 'Tak... aku yang gementar...', 'Cik Suria boleh gerakkan sudu dengan mindanya!'),
  J: trainer('gadis2', 'right', 'Ahli Minda', 'Qaseh', [['Serati', 36], ['Kerbausakti', 36]], 'Tenangkan fikiran... dan kalah!', 'Fikiran aku bercelaru...', 'Jenis SERANGGA dan HANTU bagus melawan PSIKIK.'),
  N: trainer('pelajar', 'left', 'Ahli Minda', 'Iman', [['Punggukbulan', 37], ['Bintanglaut', 36]], 'Masa depan kamu... aku nampak kekalahan!', 'Ramalan aku salah!', 'Hmm... mungkin aku perlu belajar lagi.'),
  U: gymGuide('Psikik', 'Cik Suria guna Monsta jenis PSIKIK. Serangan jenis SERANGGA dan HANTU sangat berkesan. Monsta LAWAN dan RACUN akan susah!'),
});
MAPS.menara1 = {
  name: 'Menara Seberang Jaya', inside: true, music: 'lanun',
  tiles: [
    '##############',
    '#Q_____1____Q#',
    '#__A_________#',
    '#_CCCC_______#',
    '#____________#',
    '#______O_____#',
    '#_o________o_#',
    '#____________#',
    '#____________#',
    '######E#######',
  ],
  doors: { 1: { to: 'menara2', at: '1' } },
  o: {
    A: npc('gadis2', 'down', () => flag('menara_selesai') ? 'Selamat datang ke Menara Seberang Jaya! Terima kasih, wira kecil!' : 'Tolong! Geng Lanun dah tawan bangunan ini! Mereka mahu curi teknologi BOLA SAKTI!'),
    O: lanun('down', [['Asap', 30], ['Selut', 30]], 'Menara ini milik Geng Lanun sekarang! Keluar!', 'Arghh!', 'Bos ada di tingkat paling atas.', { show: () => !flag('menara_selesai'), tr: { sight: 3 } }),
  }
};
MAPS.menara2 = {
  name: 'Menara Seberang Jaya 2F', inside: true, music: 'lanun',
  tiles: [
    '##############',
    '#1___#____I__#',
    '#____#_______#',
    '#_A__#__N____#',
    '#____#_______#',
    '#____###_#####',
    '#_O__________#',
    '#____________#',
    '####Z#########',
    '#___2________#',
    '##############',
  ],
  doors: { 1: { to: 'menara1', at: '1' }, 2: { to: 'menara3', at: '1' } },
  o: {
    A: {
      s: 'saintis', d: 'down', run: async () => {
        if (flag('duyung')) { await say('PEKERJA: Jagalah DUYUNG itu. Ia sangat baik hati.'); return; }
        await say('PEKERJA: Kamu bukan Lanun? Syukurlah! Lanun mahu mencuri Monsta DUYUNG yang kami jaga.');
        await say('PEKERJA: Tolong bawa ia pergi dari sini! Ia lebih selamat bersama kamu.');
        setFlag('duyung');
        await giveMon('Duyung', 25);
      }
    },
    I: item('Kad Kunci'),
    O: lanun('right', [['Tikusraya', 30], ['Tedung', 30]], 'Pintu di bawah tu berkunci. Tanpa KAD KUNCI, kamu takkan ke mana-mana!', 'Hmph!', 'Kad Kunci tu ada dalam bilik sebelah. Eh, jangan dengar cakap aku!', { show: () => !flag('menara_selesai') }),
    N: lanun('down', [['Asap', 31], ['Kelawar', 30], ['Tikusraya', 30]], 'Tiga Monsta aku akan lawan kamu!', 'Tak cukup tiga rupanya...', 'Bos kata Bola Sakti akan buat kami kaya!', { show: () => !flag('menara_selesai') }),
    Z: {
      bar: true, show: () => !flag('pintu_m2'), run: async () => {
        if (!S.bag['Kad Kunci']) { await say('Pintu besi berkunci. Ada pengimbas kad di sebelahnya.'); return; }
        Snd.sfx('door');
        await say('{P} mengimbas KAD KUNCI... Bip! Pintu terbuka!');
        setFlag('pintu_m2');
      }
    },
  }
};
MAPS.menara3 = {
  name: 'Menara Seberang Jaya 3F', inside: true, music: 'lanun',
  tiles: [
    '##############',
    '#1V__________#',
    '#V___________#',
    '#____KK__KK__#',
    '#_D__KK__KK__#',
    '#____________#',
    '#__O______N__#',
    '#____________#',
    '#__________2_#',
    '##############',
  ],
  doors: { 1: { to: 'menara2', at: '2' }, 2: { to: 'menara4', at: '1' } },
  o: {
    D: { s: 'johan', d: 'up', show: () => !flag('rival6') },
    V: {
      if: () => !flag('rival6'), trig: async () => {
        const r = obj('D');
        await say('{R}: Oi! {P}! Kamu pun datang ke sini?');
        if (r) { await approach(r); turnP(OPP[r.dir]); }
        await say('{R}: Aku datang sebab dengar Geng Lanun ada di sini. Tapi sebelum tu... aku nak tengok sejauh mana kamu dah maju!');
        const res = await Story.rivalFight(6, null, '{R}: Hmph! Kamu memang kuat...');
        if (res !== 'win') return;
        await say('{R}: Aku akan kalahkan kamu di Dewan Liga nanti. Tunggulah! Aku pergi dulu!');
        if (r) World.objs = World.objs.filter(q => q !== r);
        setFlag('rival6');
      }
    },
    O: lanun('right', [['Kucingraja', 32], ['Selut', 32]], 'Hoi! Tempat ini larangan!', 'Aduh!', 'Bos sedang berunding dengan Presiden.', { show: () => !flag('menara_selesai') }),
    N: lanun('left', [['Keluang', 33], ['Asap', 32]], 'Kamu budak yang kalahkan bos di Bertam?!', 'Memang dia!', 'Bos pasti balas dendam.', { show: () => !flag('menara_selesai') }),
  }
};
MAPS.menara4 = {
  name: 'Menara Seberang Jaya 4F', inside: true, music: 'lanun',
  tiles: [
    '##############',
    '#____QQQQ____#',
    '#_____A______#',
    '#____KKKK____#',
    '#______D_____#',
    '#____________#',
    '#__O______N__#',
    '#____________#',
    '#1___________#',
    '##############',
  ],
  doors: { 1: { to: 'menara3', at: '2' } },
  o: {
    A: {
      s: 'pakcik', d: 'down', run: async () => {
        if (!flag('menara_selesai')) { await say('PRESIDEN: Tolong! Geng Lanun mahu mencuri rekaan BOLA SAKTI kami!'); return; }
        if (flag('bola_sakti')) { await say('PRESIDEN: Syarikat Monsta Perai terhutang budi kepada kamu. Kamu dialu-alukan di sini bila-bila masa.'); return; }
        await say('PRESIDEN: Terima kasih! Kamu telah menyelamatkan Syarikat Monsta Perai daripada Geng Lanun!');
        await say('PRESIDEN: Sebagai tanda terima kasih, ambil BOLA SAKTI ini. Ia prototaip terakhir kami. Ia pasti menangkap mana-mana Monsta!');
        setFlag('bola_sakti'); await give('Bola Sakti');
        await say('PRESIDEN: Gunakannya dengan bijak!');
      }
    },
    D: {
      s: 'datuk', d: 'down', show: () => !flag('menara_selesai'), run: async () => {
        await say('DATUK GARANG: Kamu lagi?! Budak yang selalu menyusahkan aku!');
        await say('DATUK GARANG: Syarikat ini akan menjadi milik Geng Lanun! Dengan BOLA SAKTI, kami boleh tangkap semua Monsta di Seberang Perai!');
        await say('DATUK GARANG: Kali ini aku tak akan kalah! Rasakan kekuatan sebenar aku!');
        const r = await fightTrainer({ cls: 'Ketua Lanun', name: 'DATUK GARANG', team: [['Tenggiraja', 37], ['Seladang', 35], ['Badak', 37], ['Tedung', 41]], items: ['Ubat Hiper'], lanun: true, pay: 100, music: 'ketua', lose: 'DATUK GARANG: Mustahil! Aku kalah lagi?!' }, 'datuk');
        if (r !== 'win') return;
        await say('DATUK GARANG: Hmph... Aku mengaku kalah, buat masa ini. Geng Lanun akan berundur dari Seberang Jaya.');
        await say('DATUK GARANG: Tapi ingat, budak. Kita akan bertemu lagi... dan kali itu, aku akan menunggu kamu di tempat aku sendiri!');
        await say('Datuk Garang dan Geng Lanun melarikan diri!');
        setFlag('menara_selesai');
      }
    },
    O: lanun('right', [['Jerebu', 34], ['Tikusraya', 33]], 'Jangan ganggu urusan Bos!', 'Tak mungkin!', 'Bos...', { show: () => !flag('menara_selesai') }),
    N: lanun('left', [['Tedung', 34], ['Keluang', 34]], 'Kamu takkan sampai kepada Bos!', 'Ugh!', 'Bos akan menang. Mesti!', { show: () => !flag('menara_selesai') }),
  }
};

MAPS.laluan10 = {
  name: 'Laluan 10', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTT-TTT',
    'TT..............-.TT',
    'TT.,,,,,,.......-.TT',
    'TT.,,,,,,..A....-.TT',
    'TT.,,,,,,.......-.TT',
    'TT..............-.TT',
    'TT--------------..TT',
    'TT-..........,,,,,TT',
    'TT-..I.......,,,,,TT',
    'TT-..........,,,,,TT',
    'TT-.,,,,,.....D...TT',
    'TT-.,,,,,.........TT',
    'TT-.,,,,,...a.....TT',
    'TT-...............TT',
    'TTT-TTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'butterworth', s: 'perai' },
  enc: { grass: [['Selut', 22, 25, 20], ['Asap', 22, 25, 20], ['Mentol', 22, 25, 20], ['Tikusraya', 22, 25, 20], ['Aiskepal', 23, 25, 8], ['Comel', 22, 24, 12]] },
  o: {
    a: sign('LALUAN 10\nButterworth — Perai'),
    A: trainer('saintis', 'down', 'Saintis', 'Faris', [['Mentol', 24], ['Selut', 24]], 'Kajian aku tentang pencemaran menunjukkan... kamu perlu bertarung!', 'Data aku salah!', 'Sisa kilang melahirkan Monsta seperti Selut dan Asap.'),
    I: trainer('budak', 'right', 'Budak Sekolah', 'Nazim', [['Tikusraya', 23], ['Asap', 23]], 'Jom lawan! Aku dah bosan tunggu bas!', 'Bas dah sampai... tapi aku kalah.', 'Perai penuh dengan kilang.'),
    D: trainer('pakcik', 'left', 'Pekerja Kilang', 'Rosli', [['Selut', 25], ['Asap', 25], ['Mentol', 25]], 'Syif aku dah habis. Masa untuk bertarung!', 'Kerja lebih masa pun tak penat macam ni...', 'Kilang gula Perai dah lama beroperasi.'),
  }
};
MAPS.perai = {
  name: 'Perai', outdoor: true, theme: 'bandar', surfMap: true,
  tiles: [
    'TTT-TTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT.-........................TT',
    'TT.-.WWWWWWW.....GGGGGG.....TT',
    'TT.-.WWWWWWW.....GGGGGG.....TT',
    'TT.-.WWWWWWW.....GGGGGG.....TT',
    'TT.-.WWW1WWW.....GGG2GG.....TT',
    'TT.-..a...........q.........TT',
    'TT.---------------------------',
    'TT.......PPPPP....MMMM......TT',
    'TT.......PPPPP....MMMM......TT',
    'TT.......PP3PP....MM4M..N...TT',
    'TT..........................TT',
    'TT...HHHH.......HHHH........TT',
    'TT...HHHH.......HHHH........TT',
    'TT...HH5H.......HH6H....y...TT',
    'TT..........................TT',
    'TTsssssssssssssssssssssssssTTT',
    'T~~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'T~~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'T~~~~~~~~~~~~~~~~~~~~~~~~~~~TT',
    'T~~~~~~~~~~~~~~~~sssss~~~~~~TT',
    'T~~~~~~~~~~~~~~~sBBBBBBs~~~~TT',
    'T~~~~~~~~~~~~~~~sBBB7BBs~~~~TT',
    'T~~~~~~~~~~~~~~~sssssss~~~~~TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { n: 'laluan10', e: 'laluan11' },
  fly: [11, 11],
  enc: { water: [['Oborobor', 28, 34, 35], ['Sepat', 28, 32, 25], ['Memerang', 28, 32, 25], ['Anakbuaya', 28, 32, 15]], fish: [['Sepat', 20, 28, 40], ['Haruan', 25, 30, 30], ['Bilis', 15, 25, 30]] },
  doors: {
    1: house({ A: npc('pakcik', 'down', 'Kilang gula ini dah beroperasi sejak lama. Monsta Aiskepal selalu datang ke kilang ais sebelah.'), I: npc('pelajar', 'up', 'Gula dari sini dihantar ke seluruh negara!') }),
    2: { to: 'gim7', lock: () => !S.bag['Kunci Rahsia'], lockText: 'Pintu gim berkunci. Ada nota: "Kunci hilang. Mungkin tertinggal di Kilang Lama Batu Kawan. — Pak Bahar"' },
    3: KLINIK,
    4: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Hiper', 'Ubat Super', 'Semangat', 'Penawar Penuh', 'Ubat Bakar', 'Ubat Cair Ais', 'Ubat Nyamuk Super']),
    5: house({ A: npc('makcik', 'down', 'Di seberang Sungai Perai ada STESEN JANAKUASA lama. Dengar kata ada burung petir tinggal di sana!') }),
    6: house({ A: npc('budak', 'down', 'Kalau nak menyeberang sungai, kamu perlukan Monsta yang tahu OMBAK.'), D: npc('gadis2', 'left', 'Pak Bahar suka teka-teki. Tapi dia hilang kunci gim dia. Kelakar kan?') }),
    7: { to: 'stesen' },
  },
  o: {
    a: sign('PERAI\nBandar perindustrian di tepi Sungai Perai.'),
    q: sign('GIM PERAI\nKetua: PAK BAHAR\n"Semangat yang membara!"'),
    y: sign('Di seberang sungai: STESEN JANAKUASA PERAI. Dilarang masuk!'),
    N: npc('pakcik', 'down', 'Pak Bahar hilang kunci gimnya. Katanya tertinggal di Kilang Lama Batu Kawan, di hujung Sungai Jawi...', { move: 'wander' }),
  }
};
MAPS.gim7 = gymMap('Gim Perai', 'm', {
  A: gymLeader(6, {
    s: 'ketua7', name: 'PAK BAHAR',
    pre: 'PAK BAHAR: Hahaha! Kamu jumpa kunci aku? Hebat! Aku PAK BAHAR, Ketua Gim Perai! Monsta API aku membara seperti relau kilang! Kalau takut panas, balik sekarang!',
    team: [['Musangraja', 42], ['Kudapi', 40], ['Kudasembrani', 42], ['Kancilapi', 47]], items: ['Ubat Hiper'],
    lose: 'PAK BAHAR: Aku terbakar dengan api aku sendiri! Kamu layak menerima LENCANA BARA!',
    badgeText: 'PAK BAHAR: LENCANA BARA menunjukkan semangat kamu yang membara. Tinggal satu lencana lagi, di Guar Perahu!',
    after: 'PAK BAHAR: Api semangat jangan dibiarkan padam!', reward: ['Ubat Penuh', 2]
  }),
  I: trainer('pakcik', 'down', 'Tukang Besi', 'Bakri', [['Musangapi', 36], ['Kudapi', 37]], 'Panasnya macam dalam relau, kan? Hahaha!', 'Relau aku sejuk...', 'Jenis AIR, TANAH dan BATU sangat berkesan melawan API.'),
  J: trainer('pakcik', 'right', 'Tukang Besi', 'Jaafar', [['Kudapi', 38], ['Musangapi', 38]], 'Pukul besi selagi panas!', 'Besi aku bengkok!', 'Pak Bahar suka berjenaka, tapi dia serius bila bertarung.'),
  N: trainer('pelajar', 'left', 'Pelajar', 'Hilmi', [['Kudasembrani', 40]], 'Kuda sembrani aku boleh terbang!', 'Jatuh terhempas!', 'Kudasembrani jenis API dan TERBANG. Jenis BATU sangat berkesan!'),
  U: gymGuide('Api', 'Pak Bahar guna Monsta jenis API. Jenis AIR, TANAH dan BATU sangat berkesan! Jangan guna jenis RUMPUT, AIS atau SERANGGA.'),
});
MAPS.stesen = {
  name: 'Stesen Janakuasa Perai', inside: true, cave: true, escape: true, music: 'gua', theme: 'bandar',
  tiles: [
    '##################',
    '#m_m_m____m_m_m__#',
    '#______________Z_#',
    '#_mmmmmm_mmmmmm__#',
    '#______I_________#',
    '#mmmm_mmmmmm_mmmm#',
    '#________________#',
    '#_mm_mm_mm_mm_mm_#',
    '#____________J___#',
    '#mmmmmmm__mmmmmmm#',
    '#________________#',
    '#_l___________m__#',
    '#________________#',
    '########E#########',
  ],
  enc: { cave: [['Mentol', 30, 35, 35], ['Neonraja', 33, 36, 10], ['Kunang', 30, 34, 20], ['Tupaikilat', 30, 34, 25], ['Kelip', 30, 33, 10]] },
  o: {
    Z: {
      mon: 'Jentayu', show: () => !flag('jentayu'), run: async () => {
        await say('Kreeeek! Kilat memancar di sekeliling burung itu!');
        await wildBattle('Jentayu', 50);
        setFlag('jentayu');
      }
    },
    I: item('Batu Petir'), J: item('Ubat Hiper'), l: item('Semangat'),
  }
};
MAPS.laluan11 = {
  name: 'Laluan 11', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT,,,,,,,.....TTTT....,,,,TT',
    'TT,,,,,,,..A..TTTT..I.,,,,TT',
    'TT,,,,,,,.....TTTT....,,,,TT',
    'TT......................TTTT',
    '------------------------Z---',
    'TT.......,,,,,,.....D...TTTT',
    'TT..a....,,,,,,........TTTTT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'perai', e: 'seberangjaya' },
  enc: { grass: [['Asap', 25, 28, 18], ['Selut', 25, 28, 18], ['Mentol', 25, 28, 16], ['Kucingraja', 26, 28, 12], ['Merbah', 26, 28, 20], ['Pesilat', 25, 27, 16]] },
  o: {
    Z: Object.assign(pengawal(), { u: '-' }),
    a: sign('LALUAN 11\nPerai — Seberang Jaya'),
    A: trainer('budak2', 'down', 'Budak Sekolah', 'Farhan', [['Comel', 27], ['Kucingraja', 28]], 'Kucing aku garang! Meow!', 'Meow... kalah...', 'Comel suka tidur atas motosikal.'),
    I: trainer('gadis', 'down', 'Gadis', 'Liyana', [['Pakma', 27], ['Periuk', 27], ['Kelip', 27]], 'Nak ke Seberang Jaya? Pengawal tu garang tau!', 'Kamu lagi garang!', 'Pengawal tu cuma haus sebenarnya.'),
    D: trainer('pendekar', 'up', 'Ahli Silat', 'Badrul', [['Pesilat', 28], ['Pahlawan', 29]], 'Buah silat Harimau! Terimalah!', 'Harimau aku tumpas...', 'Pahlawan berevolusi daripada Pesilat.'),
  }
};

MAPS.laluan15 = {
  name: 'Laluan 15', outdoor: true,
  tiles: [
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    'TT,,,,,,...^^^^^^...,,,,,,,,TT',
    'TT,,,,,,..A^^^^^^.I.,,,,,,,,TT',
    'TT,,,,,,...^^^^^^...,,,,,,,,TT',
    'TT..........................TT',
    '==============================',
    'TT..........,,,,,,,......D..TT',
    'TT..a.......,,,,,,,.........TT',
    'TT..N.......,,,,,,,.........TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'seberangjaya', e: 'bukitmertajam' },
  enc: { grass: [['Kudapi', 34, 38, 18], ['Tedung', 34, 38, 15], ['Tikusraya', 34, 37, 17], ['Punggukbulan', 35, 38, 15], ['Beruk', 34, 37, 20], ['Helang', 36, 38, 5], ['Biawakraja', 35, 37, 10]] },
  o: {
    a: sign('LALUAN 15\nSeberang Jaya — Bukit Mertajam'),
    A: trainer('pendaki', 'down', 'Pendaki', 'Zaki', [['Batuhidup', 37], ['Ularbatu', 38], ['Tenggiraja', 37]], 'Aku dah daki Bukit Mertajam seratus kali!', 'Kali ni aku jatuh...', 'Di puncak bukit ada Dewan Liga.'),
    I: trainer('gadis2', 'down', 'Jurulatih Cekap', 'Hanis', [['Kudasembrani', 40]], 'Kudasembrani aku terbang melepasi awan!', 'Terhempas ke bumi...', 'Kamu dah kumpul berapa lencana?'),
    D: trainer('pendekar', 'up', 'Ahli Silat', 'Taufik', [['Pahlawan', 38], ['Beruk', 38]], 'Latihan di kaki bukit menguatkan kaki!', 'Kaki aku lemah...', 'Laluan Kemenangan di utara Bukit Mertajam sangat mencabar.'),
    N: trainer('budak', 'up', 'Budak Sekolah', 'Hadi', [['Tikusraya', 36], ['Tedung', 36]], 'Aku nak jadi juara satu hari nanti!', 'Masih jauh lagi...', 'Nanti aku cabar kamu lagi!'),
  }
};
MAPS.bukitmertajam = {
  name: 'Bukit Mertajam', outdoor: true, surfMap: true,
  tiles: [
    '^^^^^^^^^^^^=^^^^^^^^^^^^^^^',
    '^^^^^^^^^^^^=^^^^^^^^1^^^^^^',
    '^^^^^^^^^^^^Z^^^^^^^^.^^^^^^',
    'TT.........OVV.........y..TT',
    'TT.HHHH.....==..PPPPP....TTT',
    'TT.HHHH.....==..PPPPP....TTT',
    'TT.HH2H.....==..PP3PP....TTT',
    'TT..........==............TT',
    '--------------------ss~~~~~~',
    'TT..MMMM....==..HHHH..TTTTTT',
    'TT..MMMM....==..HHHH..TTTTTT',
    'TT..MM4M....==..HH5H..TTTTTT',
    'TT..........==..........a.TT',
    'TT.N........==............TT',
    'TTTTTTTTTTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'laluan15', n: 'laluankemenangan', e: 'empangan' },
  fly: [18, 7],
  enc: { water: [['Haruan', 35, 40, 50], ['Memerang', 35, 38, 50]], fish: [['Haruan', 30, 38, 60], ['Bilis', 20, 30, 40]] },
  doors: {
    1: { to: 'guabersurat', look: 'gua', lock: () => !flag('juara'), lockText: 'Laluan ke gua dihalang batu besar. Tertulis: "Hanya untuk JUARA Seberang Perai."' },
    2: house({ A: npc('atuk', 'down', 'Bukit Mertajam dinamakan sempena bukit di belakang pekan ini. Di puncaknya ada batu bersurat purba.'), I: npc('budak2', 'up', 'Aku nak jadi macam Juara Liga!') }),
    3: KLINIK,
    4: shop(['Bola Ultra', 'Bola Hebat', 'Ubat Penuh', 'Ubat Hiper', 'Pulih Penuh', 'Semangat', 'Penawar Penuh', 'Ubat Nyamuk Super', 'Tali Keluar']),
    5: house({ A: npc('makcik', 'down', 'Empangan Mengkuang di timur bandar ni. Orang tua-tua kata ada NAGA tinggal di dasar tasiknya.') }),
  },
  o: {
    a: sign('BUKIT MERTAJAM\nBandar di kaki bukit bersejarah.'),
    y: sign('BATU BERSURAT CHEROK TOK KUN\nBatu bersurat purba di lereng Bukit Mertajam.'),
    N: npc('atuk', 'down', 'Di puncak Cherok Tok Kun ada DEWAN LIGA MONSTA. Hanya juara sejati sampai ke sana!', { move: 'wander' }),
    Z: npc('askar', 'down', () => `PENGAWAL: Hanya jurulatih dengan LAPAN lencana boleh memasuki LALUAN KEMENANGAN. Kamu ada ${badges()} lencana.`, { u: '=', show: () => badges() < 8 }),
    O: { s: 'johan', d: 'right', show: () => badges() >= 8 && !flag('rival7') },
    V: {
      u: '=', if: () => badges() >= 8 && !flag('rival7'), trig: async () => {
        const r = obj('O');
        await say('{R}: Hei! {P}! Kamu pun dah dapat lapan lencana?');
        if (r) { await approach(r); turnP(OPP[r.dir]); }
        await say('{R}: Aku pun sama! Aku akan jadi JUARA! Tapi sebelum tu, jom kita tengok siapa yang lebih layak!');
        const res = await Story.rivalFight(7, null, '{R}: Apa?! Kamu... kamu memang kuat!');
        if (res !== 'win') return;
        await say('{R}: Hmph! Kamu kalahkan aku lagi. Tapi Empat Perkasa di Dewan Liga jauh lebih kuat! Aku pergi dulu. Jumpa di puncak!');
        if (r) World.objs = World.objs.filter(q => q !== r);
        setFlag('rival7');
      }
    },
  }
};
MAPS.empangan = {
  name: 'Empangan Mengkuang', outdoor: true, surfMap: true, theme: 'air',
  tiles: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TT~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~sss~~~TT',
    'TT~~~~~~~~~~sZs~~~TT',
    'TT~~~~~~~~~~sss~~~TT',
    'TT~~~~~~~~~~~~~~~~TT',
    '~~~~~~~~~~~~~~~~~~TT',
    'TT~~~~~~~~~~~~~~~~TT',
    'TT~~~~sss~~~~~~~~~TT',
    'TT~~~~sIs~~~~~~~~~TT',
    'TT~~~~sss~~~~~~~~~TT',
    'TTTTTTTTTTTTTTTTTTTT',
  ],
  conn: { w: 'bukitmertajam' },
  enc: { water: [['Haruan', 35, 40, 35], ['Anaknaga', 30, 35, 10], ['Nagaserpa', 38, 40, 3], ['Memerang', 35, 38, 27], ['Bilis', 20, 30, 25]], fish: [['Bilis', 20, 30, 50], ['Haruan', 30, 38, 40], ['Anaknaga', 25, 30, 10]] },
  o: {
    Z: {
      mon: 'Nagatasik', show: () => !flag('nagatasik'), run: async () => {
        await say('Air tasik berkocak... Seekor naga muncul dari dasar tasik!');
        await wildBattle('Nagatasik', 50);
        setFlag('nagatasik');
      }
    },
    I: item('Gula Ajaib'),
  }
};
MAPS.guabersurat = {
  name: 'Gua Batu Bersurat', inside: true, cave: true, escape: true, music: 'gua', theme: 'gua', under: 'c', border: 'x',
  tiles: [
    'xxxxxxxxxxxxxxxx',
    'xxxxxxxccZccxxxx',
    'xxxxxxxccccccxxx',
    'xxcccccccxxccxxx',
    'xxcxxxxxxxxccxxx',
    'xxcxxccccccccxxx',
    'xxcxxcxxxxxxxxxx',
    'xxcccccccccIxxxx',
    'xxxxxxxxxcxxxxxx',
    'xxxxxxxxxcxxxxxx',
    'xxxxxxxxxExxxxxx',
    'xxxxxxxxxxxxxxxx',
  ],
  enc: { cave: [['Jembalang', 55, 60, 20], ['Gunungbatu', 55, 60, 20], ['Mahakukang', 55, 58, 15], ['Nagaserpa', 55, 58, 15], ['Keluang', 55, 60, 30]], crate: .1 },
  o: {
    Z: {
      mon: 'Kelembai', show: () => !flag('kelembai'), run: async () => {
        await say('Sesuatu memerhati kamu dari kegelapan...');
        await say('SANG KELEMBAI: ...');
        await wildBattle('Kelembai', 70);
        setFlag('kelembai');
      }
    },
    I: item('Semangat Maks'),
  }
};
MAPS.laluankemenangan = {
  name: 'Laluan Kemenangan', cave: true, theme: 'gua', border: 'x', under: 'c', escape: true, music: 'gua',
  tiles: [
    'xxxxxxxxxxxxxxxxxxcxxxxxxx',
    'xxxxxxxxxxxxxxxxxxcxxxxxxx',
    'xxxcccccccxxxxxxcccccxxxxx',
    'xxxcccAcccxxxxxxcccccxxxxx',
    'xxxcccccccccccccccNccxxxxx',
    'xxxxxxxccxxxxxxxxxxccxxxxx',
    'xxxxxxxccxxxxxxxxxxccxxxxx',
    'xxcccccccccxxxxxccccccccxx',
    'xxcIcccccccxxxxxcccccZccxx',
    'xxcccccccccxxxxxccccccccxx',
    'xxxxxxcccxxxxxxxxxxxcccxxx',
    'xxxxxxcccxxxxxxxxxxxcccxxx',
    'xxxcccccccccccccccccccccxx',
    'xxxcccDccccccccccccccOccxx',
    'xxxccccccxxxxxxcccccccccxx',
    'xxxxxxcccxxxxxxxxxxxxxxxxx',
    'xxxxxxcccxxxxxxxxxxxxxxxxx',
    'xxxccccccccccccccxxxxxxxxx',
    'xxxccccccccccUccccxxxxxxxx',
    'xxxxxxxxxxxxcccxxxxxxxxxxx',
    'xxxxxxxxxxxxcccxxxxxxxxxxx',
    'xxxxxxxxxxxxxcxxxxxxxxxxxx',
  ],
  conn: { s: 'bukitmertajam', n: 'puncak' },
  enc: { cave: [['Batuhidup', 38, 42, 18], ['Ularbatu', 38, 42, 12], ['Pahlawan', 38, 41, 12], ['Keluang', 38, 42, 20], ['Tenggiraja', 40, 42, 12], ['Pelesit', 38, 41, 14], ['Badak', 40, 42, 12]] },
  o: {
    A: trainer('gadis', 'down', 'Jurulatih Cekap', 'Sofia', [['Kudasembrani', 42], ['Bintanglaut', 42], ['Periukkera', 43]], 'Kamu mahu ke Dewan Liga? Buktikan dulu kepada aku!', 'Kamu layak!', 'Empat Perkasa sedang menunggu kamu.'),
    N: trainer('pendekar', 'left', 'Jurulatih Cekap', 'Zahid', [['Hulubalang', 43], ['Gunungbatu', 42]], 'Laluan Kemenangan ini tempat jurulatih terbaik berlatih!', 'Hebat!', 'Aku akan terus berlatih di sini.'),
    D: trainer('pelajar', 'down', 'Jurulatih Cekap', 'Irdina', [['Serati', 42], ['Mahakukang', 42], ['Kepahgergasi', 43]], 'Tiga tahun aku berlatih untuk hari ini!', 'Tiga tahun lagi, nampaknya...', 'Jangan lupa bawa ubat yang cukup!'),
    O: trainer('pendaki', 'left', 'Jurulatih Cekap', 'Syukri', [['Badakbesi', 44], ['Tenggiraja', 43], ['Buaya', 44]], 'Tanah dan batu! Kekuatan bumi!', 'Bumi bergegar... dan aku tumbang.', 'Jenis AIR dan RUMPUT sangat berkesan melawan pasukan aku.'),
    U: trainer('ahli', 'down', 'Jurulatih Cekap', 'Nurin', [['Nagaserpa', 44], ['Kucingraja', 43], ['Oborraja', 43]], 'Selamat datang ke Laluan Kemenangan!', 'Kamu memang bakal juara!', 'Teruskan ke utara!'),
    I: item('Ubat Penuh'),
    Z: {
      mon: 'Garuda', show: () => !flag('garuda'), run: async () => {
        await say('Kyaaaa! Sayap berapi mengembang luas!');
        await wildBattle('Garuda', 50);
        setFlag('garuda');
      }
    },
  }
};
MAPS.puncak = {
  name: 'Puncak Cherok Tok Kun', outdoor: true, border: '^',
  tiles: [
    '^^^^^^^^^^^^^^^^^^',
    '^^^^BBBBBBBBBB^^^^',
    '^^^^BBBBBBBBBB^^^^',
    '^^^^BBBBBBBBBB^^^^',
    '^^^^BBBBBBBBBB^^^^',
    '^^^^BBBB1BBBBB^^^^',
    '^^..............^^',
    '^^.PPPPP.a......^^',
    '^^.PPPPP........^^',
    '^^.PP2PP........^^',
    '^^..............^^',
    '^^......=.......^^',
    '^^^^^^^^=^^^^^^^^^',
  ],
  conn: { s: 'laluankemenangan' },
  fly: [5, 10],
  doors: {
    1: { to: 'liga1' },
    2: { to: 'klinik', stock: ['Bola Ultra', 'Ubat Penuh', 'Ubat Hiper', 'Pulih Penuh', 'Semangat', 'Penawar Penuh', 'Ubat Nyamuk Super'], o: { D: { s: 'peniaga', d: 'left', run: clerk } } },
  },
  o: { a: sign('DEWAN LIGA MONSTA SEBERANG PERAI\nCabar EMPAT PERKASA dan JUARA!') }
};
// ---------- Dewan Liga ----------
function ligaMap(n, L) {
  const last = n === 5;
  return {
    name: L.room, inside: true, music: 'ketua', theme: 'liga', noExit: n > 1,
    tiles: [
      '###########',
      '#####1#####',
      '#_________#',
      '#____A____#',
      '#_________#',
      '#_e_____e_#',
      '#_e_____e_#',
      '#_________#',
      '#_________#',
      n === 1 ? '#####E#####' : '###########',
    ],
    doors: { 1: { to: last ? 'dewan' : 'liga' + (n + 1), at: last ? [4, 6] : [5, 8], dir: 'up', lock: () => !flag(L.flag), lockText: 'Pintu tertutup. Kalahkan lawan di bilik ini dahulu!' } },
    o: {
      A: {
        s: L.s, d: 'down', run: async () => {
          if (flag(L.flag)) { await say(L.after); return; }
          await say(L.pre);
          const r = await fightTrainer({ cls: L.cls, name: L.name, team: typeof L.team === 'function' ? L.team() : L.team, lose: L.lose, items: ['Ubat Penuh', 'Ubat Penuh'], pay: 100, music: 'ketua', theme: 'liga' }, L.s);
          if (r !== 'win') return;
          setFlag(L.flag);
          if (L.won) await L.won(); else await say(L.after);
        }
      }
    }
  };
}
MAPS.liga1 = ligaMap(1, {
  room: 'Dewan Liga — Bilik Ais', s: 'e1', cls: 'Empat Perkasa', name: 'CIKGU ZALEHA', flag: 'e1',
  pre: 'CIKGU ZALEHA: Selamat datang ke Dewan Liga Monsta! Saya CIKGU ZALEHA dari Empat Perkasa. Monsta AIS saya akan membekukan harapan kamu!',
  team: [['Kepahgergasi', 53], ['Aiskacang', 54], ['Duyung', 56], ['Serati', 54], ['Kerbausakti', 54]],
  lose: 'CIKGU ZALEHA: Kamu lulus ujian cikgu dengan cemerlang!', after: 'CIKGU ZALEHA: Teruskan ke bilik seterusnya. Tiga lagi Perkasa menanti.'
});
MAPS.liga2 = ligaMap(2, {
  room: 'Dewan Liga — Bilik Batu', s: 'e2', cls: 'Empat Perkasa', name: 'PAK HITAM', flag: 'e2',
  pre: 'PAK HITAM: Aku PAK HITAM! Aku berlatih bersama Monsta aku di kaki bukit selama bertahun-tahun. Kekuatan otot dan batu! HIYAAAH!',
  team: [['Gunungbatu', 53], ['Hulubalang', 55], ['Katakpuru', 55], ['Ularbatu', 56], ['Hulubalang', 58]],
  lose: 'PAK HITAM: Ototku kalah dengan semangatmu!', after: 'PAK HITAM: Pergilah. Kekuatan sebenar ada di depan sana.'
});
MAPS.liga3 = ligaMap(3, {
  room: 'Dewan Liga — Bilik Bayang', s: 'e3', cls: 'Empat Perkasa', name: 'NENEK KEBAYAN', flag: 'e3',
  pre: 'NENEK KEBAYAN: Hihihi... Nenek dah lama tunggu cucu. Nenek ni NENEK KEBAYAN. Monsta HANTU dan RACUN nenek... sangat lapar!',
  team: [['Jembalang', 56], ['Keluang', 56], ['Pelesit', 55], ['Lumpurbisa', 58], ['Jembalang', 60]],
  lose: 'NENEK KEBAYAN: Hihihi... kamu budak yang berbakat.', after: 'NENEK KEBAYAN: Pergilah, cu. Hati-hati dengan naga di depan sana.'
});
MAPS.liga4 = ligaMap(4, {
  room: 'Dewan Liga — Bilik Naga', s: 'e4', cls: 'Empat Perkasa', name: 'TUAN ADIWIRA', flag: 'e4',
  pre: 'TUAN ADIWIRA: Aku TUAN ADIWIRA, ketua Empat Perkasa. Naga ialah makhluk legenda yang paling agung! Monsta NAGA aku tidak pernah tunduk!',
  team: [['Nagasura', 58], ['Nagaserpa', 56], ['Nagaserpa', 56], ['Nagalaut', 60], ['Nagaraja', 62]],
  lose: 'TUAN ADIWIRA: Mustahil... Naga aku tewas!', after: 'TUAN ADIWIRA: Kamu telah mengalahkan Empat Perkasa. Tetapi masih ada JUARA yang menunggu di bilik terakhir...'
});
MAPS.liga5 = ligaMap(5, {
  room: 'Dewan Liga — Bilik Juara', s: 'johan', cls: 'Juara', name: '{R}', flag: 'juara_menang',
  pre: '{R}: Hei, {P}! Aku dah tunggu kamu! Aku kalahkan Empat Perkasa lebih awal daripada kamu. Sekarang, aku JUARA MONSTA SEBERANG PERAI!',
  team: () => Story.rivalTeam(8),
  lose: '{R}: TIDAK! Macam mana aku boleh kalah?! Aku dah latih Monsta aku bersungguh-sungguh...', after: '{R}: ...',
  won: async () => {
    await say('{R}: Aku... aku bukan juara lagi. Kamu yang menang, {P}.');
    await say('PROF. MERANTI: {P}! Tahniah!');
    await say('PROF. MERANTI: Kamu telah mengalahkan Empat Perkasa dan {R}. Kamu JUARA MONSTA SEBERANG PERAI yang baru!');
    await say('PROF. MERANTI: {R}... kamu kalah kerana kamu lupa menyayangi Monsta kamu. {P} faham bahawa Monsta ialah kawan, bukan alat.');
    await say('PROF. MERANTI: {P}, ikut atuk ke DEWAN KEMASYHURAN.');
  }
});
MAPS.liga5.o.A.s = 'johan';
MAPS.dewan = {
  name: 'Dewan Kemasyhuran', inside: true, music: 'tajuk', noExit: true,
  tiles: [
    '#########',
    '#Q_nnn_Q#',
    '#___A___#',
    '#_______#',
    '#_e___e_#',
    '#_e___e_#',
    '#_______#',
    '#########',
  ],
  o: {
    A: {
      s: 'prof', d: 'down', run: async () => {
        await say('PROF. MERANTI: Ini DEWAN KEMASYHURAN. Nama juara dan Monsta mereka direkodkan di sini untuk selama-lamanya.');
        await say('PROF. MERANTI: {P}, kamu dan Monsta kamu telah melalui pengembaraan yang hebat. Mari kita rekodkan!');
        await hallOfFame();
      }
    }
  }
};
MAPS.liga1.scriptOnly = false;
