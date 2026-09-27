# MONSTA SEBERANG PERAI

Permainan RPG pengembaraan Monsta berasaskan pelayar web, dengan jalan cerita dan tempoh permainan ala *Pokémon Red* — tetapi seluruh dunianya berlatarkan **Seberang Perai**, dan semua teks dalam **Bahasa Melayu**.

> *A browser-based monster-collecting RPG with the story structure and length of Pokémon Red, set entirely in mainland Penang (Seberang Perai), fully in Malay.*

## Cara bermain

Tiada pemasangan diperlukan. Buka `index.html` dalam pelayar (Chrome, Firefox, Safari, Edge — komputer atau telefon).

Untuk berkongsi secara dalam talian, aktifkan **GitHub Pages** untuk repositori ini (Settings → Pages → deploy from branch) dan buka URL yang diberikan.

### Kawalan

| Tindakan | Papan kekunci | Telefon |
|---|---|---|
| Bergerak | Anak panah / WASD | D-pad |
| A (pilih, bercakap) | Z / Space / J | Butang **A** |
| B (batal, **tahan untuk berlari**) | X / Shift / Esc | Butang **B** |
| Menu | Enter / P | Butang **MENU** |
| Bunyi hidup/mati | M | Butang **BUNYI** |

Permainan disimpan dalam pelayar (localStorage) melalui **MENU → SIMPAN**.

## Jalan cerita

Kamu seorang budak dari **Penaga**. Profesor Meranti memberi kamu Monsta pertama — **Anakpadi** (Rumput), **Percik** (Api) atau **Penyucil** (Air) — dan cucunya **Johan** menjadi pesaing kamu. Kumpulkan lapan lencana gim, tumpaskan **Geng Lanun** pimpinan Datuk Garang, lengkapkan **MONSTADEX**, dan cabar **Empat Perkasa** di puncak Cherok Tok Kun, Bukit Mertajam.

### Laluan pengembaraan (semua di Seberang Perai)

Penaga → Laluan 1 → Guar Perahu → Hutan Bakau → **Teluk Ayer Tawar** → Tapak Arkeologi Guar Kepah → **Kepala Batas** → **Bertam** → **Butterworth** → Tasek Gelugor → Permatang Pauh → Jalan Juru → Bukit Tambun → Simpang Ampat → **Nibong Tebal** → Taman Rimba Bukit Panchor → **Seberang Jaya** → Sungai Jawi → Batu Kawan → **Perai** → **Guar Perahu** → Bukit Mertajam → Laluan Kemenangan → Dewan Liga

| # | Gim | Ketua | Jenis | Lencana |
|---|---|---|---|---|
| 1 | Teluk Ayer Tawar | Abang Kamal | Batu | Lencana Kerang |
| 2 | Kepala Batas | Kak Mawar | Air | Lencana Ombak |
| 3 | Butterworth | Kapten Rizal | Elektrik | Lencana Petir |
| 4 | Bertam | Cik Melur | Rumput | Lencana Padi |
| 5 | Nibong Tebal | Pendekar Harun | Racun | Lencana Keris |
| 6 | Seberang Jaya | Cik Suria | Psikik | Lencana Minda |
| 7 | Perai | Pak Bahar | Api | Lencana Bara |
| 8 | Guar Perahu | Datuk Garang | Tanah | Lencana Bumi |

**Empat Perkasa:** Cikgu Zaleha (Ais), Pak Hitam (Lawan/Batu), Nenek Kebayan (Hantu/Racun), Tuan Adiwira (Naga) — dan Juara.

## Ciri-ciri

- **123 Monsta** dengan nama Melayu (Kancil, Tenggiling, Kerbau, Bilis → Nagasura, Toyol, Aiskacang, Belangkas, Garuda, Jentayu, Sang Kelembai…), 15 jenis, evolusi mengikut tahap dan batu evolusi
- **112 jurus** (Tarian Keris, Tapak Harimau, Pukau, Lidah Api, Ombak…) dengan status, perubahan statistik dan kesan jenis
- **70 peta**: bandar, laluan, gua, 8 gim, markas Geng Lanun, Menara Seberang Jaya, Rumah Tinggal berhantu, kapal Seri Perai, Dewan Liga
- Klinik Monsta, Kedai Monsta, PC simpanan, Pasar Raya Bertam dengan mesin layan diri
- Jurus padang: **Tebas**, **Terbang**, **Ombak**; Basikal; Seruling; memancing; Ubat Nyamuk
- Pertarungan liar dan jurulatih, menangkap Monsta, EXP, belajar jurus, AI jurulatih
- Legenda pasca-permainan tersembunyi
- Grafik piksel, sprite Monsta dan muzik cip dijana secara prosedur — tiada fail aset luar
- Kawalan sentuh untuk telefon

## Struktur kod

```
index.html, style.css
js/engine.js     kanvas, input, dialog, bunyi & muzik
js/gfx.js        jubin, bangunan, watak, penjana sprite Monsta
js/data.js       jenis, jurus, 123 Monsta, barang, lencana
js/monsta.js     statistik, EXP, jurus, evolusi
js/battle.js     sistem pertarungan
js/menus.js      menu, beg, Monstadex, PC, kedai, simpan
js/world.js      peta, pergerakan, NPC, jurulatih, API skrip
js/story.js      skrip bersama (jururawat, ketua gim, pesaing)
js/maps/*.js     peta (utara, tengah, selatan, dalaman)
tools/           pengesah peta & ujian automatik (Node + Playwright)
```

### Ujian

```bash
node tools/validate.js       # semak semua peta, pintu dan sambungan
node tools/playthrough.js    # main automatik dari awal hingga Juara (perlukan Playwright)
```
