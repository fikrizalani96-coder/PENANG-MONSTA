'use strict';
// ===== Tetapan pelancaran =====
// Isikan nilai sebenar sebelum melancarkan laman web. Lihat LAUNCH.md untuk langkah penuh.
const CONFIG = {
  // Firebase (Log masuk Google + simpanan awan + pembelian). Salin dari Firebase Console → Project settings → Web app.
  firebase: null,
  // Contoh:
  // firebase: {
  //   apiKey: 'AIza...',
  //   authDomain: 'monsta-seberang-perai.firebaseapp.com',
  //   projectId: 'monsta-seberang-perai',
  //   storageBucket: 'monsta-seberang-perai.appspot.com',
  //   messagingSenderId: '1234567890',
  //   appId: '1:1234567890:web:abcdef',
  // },
  firebaseVersion: '10.12.2',
  functionsRegion: 'asia-southeast1',

  // Google AdSense (H5 Games Ads / Ad Placement API). Contoh: 'ca-pub-1234567890123456'
  adsenseClient: null,
  adsTest: true,             // true = iklan ujian (adbreak-test). Tukar ke false selepas AdSense diluluskan.
  interstitialMinGap: 240,   // saat minimum antara iklan selingan

  // Pembelian ujian tanpa pelayan (HANYA untuk pembangunan di localhost / file://)
  devPurchases: true,
};
const IS_DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
