'use strict';
// ===== Sejarah Malaysia: Serpihan Sejarah, Buku Sejarah, bab cerita =====
// Fakta ringkas dan umum untuk tujuan pendidikan. Serpihan diletakkan di lokasi Seberang Perai.
const FRAGS = [
  { n: 1, map: 'guarkepah', x: 22, y: 13, era: '± 5,000 tahun dahulu', t: 'Manusia Prasejarah Guar Kepah',
    b: 'Di Guar Kepah, Kepala Batas, ahli arkeologi menemui rangka manusia prasejarah berusia kira-kira 5,000 tahun di dalam timbunan kulit kepah. Penduduk awal ini tinggal di pesisir dan hidup dengan mengutip kerang-kerangan serta menangkap ikan.' },
  { n: 2, map: 'penaga', x: 5, y: 13, era: 'Abad ke-1 hingga ke-13 Masihi', t: 'Kerajaan Kedah Tua',
    b: 'Kedah Tua di sekitar Lembah Bujang dan Sungai Muda merupakan antara pelabuhan dagang terawal di Asia Tenggara. Pedagang dari India, China dan Asia Barat singgah di sini. Seberang Perai dahulunya sebahagian daripada wilayah Kedah.' },
  { n: 3, map: 'bukitmertajam', x: 20, y: 3, era: 'Abad ke-5 hingga ke-6 Masihi (anggaran)', t: 'Batu Bersurat Cherok Tok Kun',
    b: 'Di lereng Bukit Mertajam terdapat batu besar yang terukir tulisan purba beraksara Pallava. Ia antara bukti tertua tentang hubungan awal rantau ini dengan dunia luar dan telah dikaji oleh pegawai British pada abad ke-19.' },
  { n: 4, map: 'telukayertawar', x: 8, y: 12, era: '1400 – 1511', t: 'Kesultanan Melayu Melaka',
    b: 'Kesultanan Melaka diasaskan oleh Parameswara sekitar tahun 1400. Melaka menjadi pusat perdagangan antarabangsa dan penyebaran Islam di Nusantara, sehingga ditawan Portugis pada tahun 1511.' },
  { n: 5, map: 'kepalabatas', x: 9, y: 17, era: 'Karya sastera Melayu klasik', t: 'Hikayat Hang Tuah',
    b: 'Hikayat Hang Tuah mengisahkan laksamana Melaka yang terkenal dengan kesetiaan dan kepahlawanannya bersama sahabat-sahabatnya. Ia antara karya agung kesusasteraan Melayu dan penuh dengan nilai budaya.' },
  { n: 6, map: 'perai', x: 26, y: 11, era: '1800', t: 'Penyerahan Seberang Perai',
    b: 'Pada tahun 1800, Kesultanan Kedah menyerahkan jalur tanah besar ini kepada Syarikat Hindia Timur Inggeris melalui satu perjanjian. Kawasan ini dinamakan Province Wellesley, yang kini dikenali sebagai Seberang Perai.' },
  { n: 7, map: 'butterworth', x: 27, y: 16, era: '1843 – 1855', t: 'Asal Nama Butterworth',
    b: 'Bandar Butterworth dinamakan sempena William John Butterworth, Gabenor Negeri-Negeri Selat dari tahun 1843 hingga 1855. Butterworth kemudian berkembang menjadi pelabuhan dan pusat pengangkutan utama.' },
  { n: 8, map: 'bertam', x: 26, y: 17, era: 'Abad ke-19', t: 'Ladang Tebu dan Kilang Gula',
    b: 'Pada abad ke-19, ladang tebu dan kilang gula dibuka di Seberang Perai, termasuk di Bertam, Nibong Tebal dan Perai. Pekerja pelbagai kaum datang dan bekerja bersama, membentuk masyarakat majmuk yang kita kenali hari ini.' },
  { n: 9, map: 'laluan10', x: 16, y: 13, era: 'Awal abad ke-20', t: 'Landasan Kereta Api',
    b: 'Menjelang awal abad ke-20, landasan kereta api sampai ke Perai dan Butterworth. Ia menghubungkan pelabuhan dengan negeri-negeri lain di Tanah Melayu dan memudahkan pengangkutan hasil bijih timah, getah dan gula.' },
  { n: 10, map: 'laluan7', x: 16, y: 16, era: 'Disember 1941 – 1945', t: 'Perang Dunia Kedua',
    b: 'Pada Disember 1941, tentera Jepun menyerang Tanah Melayu. Lapangan terbang di Butterworth turut dibom. Penduduk melalui zaman pendudukan Jepun yang sukar sehingga perang tamat pada tahun 1945.' },
  { n: 11, map: 'seberangjaya', x: 30, y: 15, era: '31 Ogos 1957', t: 'Hari Kemerdekaan',
    b: 'Pada 31 Ogos 1957, Tunku Abdul Rahman mengisytiharkan kemerdekaan Persekutuan Tanah Melayu di Stadium Merdeka, Kuala Lumpur, sambil melaungkan "Merdeka!" sebanyak tujuh kali.' },
  { n: 12, map: 'nibongtebal', x: 12, y: 15, era: '16 September 1963', t: 'Pembentukan Malaysia',
    b: 'Pada 16 September 1963, Malaysia dibentuk melalui gabungan Persekutuan Tanah Melayu, Singapura, Sabah dan Sarawak. Singapura keluar daripada Malaysia pada tahun 1965.' },
];
const CHAPTERS = [
  ['BAB 2', 'Jalan ke Teluk Ayer Tawar', () => flag('dex')],
  ['BAB 3', 'Rahsia Guar Kepah', () => S.badges.includes(0)],
  ['BAB 4', 'Bandar Ilmu Kepala Batas', () => flag('fosil')],
  ['BAB 5', 'Menuju Bertam & Butterworth', () => flag('lanun_kb')],
  ['BAB 6', 'Bayang-bayang Geng Lanun', () => S.badges.includes(2)],
  ['BAB 7', 'Semangat Tasek Gelugor', () => flag('markas_selesai')],
  ['BAB 8', 'Bendang Permatang Pauh', () => flag('seruling')],
  ['BAB 9', 'Menara Seberang Jaya', () => flag('pengawal')],
  ['BAB 10', 'Api di Hujung Sungai', () => flag('menara_selesai')],
  ['BAB 11', 'Laluan Kemenangan', () => S.badges.length >= 8],
];
const Sejarah = {
  count() { return S && S.frags ? Object.keys(S.frags).length : 0; },
  inject(W) {
    const m = W.map;
    if (!m) return;
    for (const f of FRAGS) {
      if (f.map !== m.id || (S.frags && S.frags[f.n])) continue;
      if (W.objs.some(o => o.def.frag === f.n)) continue;
      W.objs.push({ def: { frag: f.n }, key: '§' + f.n, x: f.x, y: f.y, hx: f.x, hy: f.y, px: f.x * 16, py: f.y * 16, dir: 'down', moving: null, t: 0, block: true, frame: 0 });
    }
    if (m.eraExtra) m.eraExtra(W);
  },
  async collect(n) {
    const f = FRAGS.find(q => q.n === n); if (!f) return;
    S.frags = S.frags || {};
    Snd.sfx('catch');
    await say(`{P} menemui SERPIHAN SEJARAH #${n}!`);
    S.frags[n] = 1;
    World.objs = World.objs.filter(o => o.def.frag !== n);
    await this.show(f);
    const c = this.count();
    await say(`Serpihan Sejarah: ${c} / 12. ${c < 12 ? 'Bawa ke Muzium Sejarah di Butterworth untuk mendapat hadiah!' : 'Lengkap! Kamu seorang Sejarawan Muda!'}`);
  },
  show(f) {
    return new Promise(res => {
      const lines = wrapText(f.b, Math.min(SW - 140, 900), 30);
      const sc = {
        transparent: true, t: 0,
        update(dt) { this.t += dt; if (this.t > .4 && (Input.pressed.a || Input.pressed.b)) { Snd.sfx('beep'); Game.pop(this); res(); } },
        draw() {
          ctx.fillStyle = 'rgba(4,6,14,.72)'; ctx.fillRect(0, 0, SW, SH);
          const w = Math.min(SW - 60, 1000), h = 200 + lines.length * 38, x = (SW - w) / 2, y = Math.max(20, (SH - INSET.b - h) / 2);
          const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#f6e7c1'); g.addColorStop(1, '#e2c98f');
          ctx.fillStyle = g; rr(x, y, w, h, 12); ctx.fill();
          ctx.strokeStyle = '#7a5520'; ctx.lineWidth = 4; rr(x + 8, y + 8, w - 16, h - 16, 8); ctx.stroke();
          txt('SERPIHAN SEJARAH #' + f.n, x + 40, y + 28, { size: 26, color: '#7a5520', shadow: false });
          txt(f.t, x + 40, y + 62, { size: 44, color: '#3a2208', shadow: false });
          txt(f.era, x + 40, y + 114, { size: 26, color: '#8a3a18', shadow: false });
          lines.forEach((l, k) => txt(l, x + 40, y + 156 + k * 38, { size: 30, color: '#2a1a08', shadow: false }));
        }
      };
      Game.push(sc);
    });
  },
  async book() {
    const list = FRAGS.map(f => ({ l: (S.frags && S.frags[f.n]) ? `#${f.n} ${f.t}` : `#${f.n} ???`, dim: !(S.frags && S.frags[f.n]) }));
    let st = 0;
    while (true) {
      const i = await UI.list(list, { title: `BUKU SEJARAH  ${this.count()}/12`, start: st, desc: k => (S.frags && S.frags[FRAGS[k].n]) ? FRAGS[k].era : 'Serpihan ini belum dijumpai. Terokai Seberang Perai!' });
      if (i < 0) return; st = i;
      if (S.frags && S.frags[FRAGS[i].n]) await this.show(FRAGS[i]);
    }
  },
  pendingChapter() {
    if (!S) return null;
    S.chapters = S.chapters || {};
    for (const [n, t, cond] of CHAPTERS) if (!S.chapters[n] && cond()) return [n, t];
    return null;
  },
  async chapterCheck() {
    const c = this.pendingChapter(); if (!c) return;
    S.chapters[c[0]] = 1;
    await UI.chapter(c[0], c[1]);
  },
  // Kurator Muzium Sejarah
  async curator() {
    const c = this.count();
    S.fragRewards = S.fragRewards || {};
    if (!flag('muzium_intro')) {
      await say('KURATOR: Selamat datang ke MUZIUM SEJARAH SEBERANG PERAI! Saya Encik Arif, kurator di sini.');
      await say('KURATOR: Di seluruh Seberang Perai tersembunyi 12 SERPIHAN SEJARAH. Setiap satu menyimpan kisah tanah air kita, dari zaman prasejarah hingga pembentukan Malaysia.');
      await say('KURATOR: Carilah serpihan-serpihan itu. Ia bercahaya keemasan. Saya akan beri hadiah setiap kali kamu mengumpul 3 serpihan!');
      setFlag('muzium_intro');
    }
    const tiers = [[3, 'Gula Ajaib', 2], [6, 'Bola Ultra', 5], [9, 'Ubat Penuh', 5], [12, 'Semangat Maks', 3]];
    let gave = false;
    for (const [need, item, n] of tiers) {
      if (c >= need && !S.fragRewards[need]) {
        await say(`KURATOR: Hebat! Kamu sudah mengumpul ${need} serpihan. Terimalah hadiah ini!`);
        S.fragRewards[need] = 1; await give(item, n); gave = true;
      }
    }
    if (c >= 12 && !flag('sejarawan')) {
      setFlag('sejarawan');
      await say('KURATOR: Kamu telah mengumpul kesemua 12 serpihan! Mulai hari ini, kamu digelar SEJARAWAN MUDA SEBERANG PERAI!');
      await say('KURATOR: Ingatlah: bangsa yang lupa sejarahnya akan hilang arah. Terima kasih kerana menghargai sejarah kita.');
      return;
    }
    if (!gave) await say(`KURATOR: Kamu sudah mengumpul ${c} daripada 12 Serpihan Sejarah. ${c < 12 ? 'Teruskan pencarian! Buka BUKU SEJARAH dalam menu untuk membaca semula kisahnya.' : ''}`);
  }
};
