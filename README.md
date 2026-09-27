# MONSTA SEBERANG PERAI

Permainan RPG pengembaraan Monsta berasaskan pelayar web, dengan jalan cerita dan tempoh permainan ala *Pokémon Red* — tetapi seluruh dunianya berlatarkan **Seberang Perai**, dan semua teks dalam **Bahasa Melayu**.

> *A browser-based monster-collecting RPG with the story structure and length of Pokémon Red, set entirely in mainland Penang (Seberang Perai), fully in Malay.*

## Versi 2.0: Jejak Sejarah

- **Grafik 3D gaya diorama** (Three.js): tanah bertekstur yang dilukis, rumpun rumput, bunga dan pokok bulat, watak chibi, Monsta plush yang licin, cahaya matahari hangat dengan bayang lembut dan kesan tilt-shift. Arena pertarungan padang rumput dengan panel krim klasik. Pilihan grafik: 3D Tinggi / 3D Rendah / 2D Klasik (diturunkan secara automatik pada peranti perlahan; beralih ke 2D jika WebGL tiada).
- **Mudah alih & web**: potret **9:16** di telefon (joystick + butang A/B) dan landskap **16:9** di komputer.
- **Log masuk Google**: simpanan awan (Supabase) untuk main di mana-mana peranti.
- **Cerita lebih panjang, 13 bab**, dengan **sejarah Malaysia**:
  - 12 **Serpihan Sejarah** tersembunyi di Seberang Perai, dari Guar Kepah prasejarah hingga pembentukan Malaysia.
  - **Muzium Sejarah** Butterworth dengan hadiah daripada kurator.
  - Selepas menjadi Juara: arka pasca-permainan **Lorong Masa**, 6 zaman (Guar Kepah purba, Kedah Tua, Kuala Perai 1800, ladang tebu abad ke-19, Butterworth 1941, Merdeka 1957), 6 Panglima Bayangan dan Pendeta Kelam.
- **Pengewangan**: iklan Google H5 Games (selingan + berganjaran pilihan) dan **Kedai Premium** melalui Stripe. Buang Iklan RM29.90 (sekali bayar); semua item lain bawah RM10.

Lihat **[LAUNCH.md](LAUNCH.md)** untuk panduan pelancaran (Supabase, log masuk Google, Stripe, AdSense).

## Cara bermain

Tiada pemasangan diperlukan. Buka `index.html` dalam pelayar (Chrome, Firefox, Safari, Edge — komputer atau telefon). Tanpa tetapan, permainan disimpan dalam pelayar dan pembelian disimulasikan (mod ujian).

### Kawalan

| Tindakan | Papan kekunci | Telefon |
|---|---|---|
| Bergerak | Anak panah / WASD | D-pad |
| A (pilih, bercakap) | Z / Space / J | Butang **A** |
| B (batal, **tahan untuk berlari**) | X / Shift / Esc | Butang **B** |
| Menu | Enter / P | Butang **MENU** |
| Bunyi hidup/mati | M | Butang **BUNYI** |

Permainan disimpan dalam pelayar (localStorage) melalui **MENU → SIMPAN**.

**Fail simpanan:** **MENU → FAIL SIMPANAN → Eksport ke fail** memuat turun fail `.json` (contoh `monsta-ali-20260927-1534.json`). Untuk menyambung di peranti atau pelayar lain, pilih **IMPORT SIMPANAN** di skrin tajuk. Fail yang rosak atau telah diubah akan ditolak.

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
- **78 peta**: bandar, laluan, gua, 8 gim, markas Geng Lanun, Menara Seberang Jaya, Rumah Tinggal berhantu, kapal Seri Perai, Dewan Liga
- Klinik Monsta, Kedai Monsta, PC simpanan, Pasar Raya Bertam dengan mesin layan diri
- Jurus padang: **Tebas**, **Terbang**, **Ombak**; Basikal; Seruling; memancing; Ubat Nyamuk
- Pertarungan liar dan jurulatih, menangkap Monsta, EXP, belajar jurus, AI jurulatih
- Legenda pasca-permainan tersembunyi
- Grafik piksel, sprite Monsta dan muzik cip dijana secara prosedur — tiada fail aset luar
- Kawalan sentuh untuk telefon

## Struktur kod

```
index.html, style.css
js/config.js     tetapan pelancaran (Supabase, AdSense)
js/engine.js     kanvas responsif 9:16 / 16:9, input sentuh, dialog, bunyi & muzik
js/render3d.js   pemapar 3D (Three.js): dunia, pertarungan, pameran Monsta
js/gfx.js        jubin, bangunan, watak, penjana sprite Monsta
js/data.js       jenis, jurus, 123 Monsta, barang, lencana
js/monsta.js     statistik, EXP, jurus, evolusi
js/battle.js     sistem pertarungan
js/menus.js      menu, beg, Monstadex, PC, kedai, simpan
js/world.js      peta, pergerakan, NPC, jurulatih, API skrip
js/story.js      skrip bersama (jururawat, ketua gim, pesaing)
js/sejarah.js    Serpihan Sejarah, Buku Sejarah, bab cerita, kurator muzium
js/cloud.js      log masuk Google, simpanan awan, tuntutan pembelian
js/monetize.js   iklan H5 Games & Kedai Premium
js/maps/*.js     peta (utara, tengah, selatan, dalaman, masa)
supabase/        pangkalan data (migrations/) & pelayan pembayaran Stripe (functions/)
vendor/          three.min.js & supabase.js (lesen MIT)
tools/           pengesah peta & ujian automatik (Node + Playwright)
```

### Ujian

```bash
node tools/validate.js       # semak peta, pintu, sambungan, serpihan & harga premium
node tools/playthrough.js    # main automatik dari awal hingga Juara & Lorong Masa (perlukan Playwright)
node tools/shot3d.js era6 10 11 390 844   # tangkapan skrin 3D
```
