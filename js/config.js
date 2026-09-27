'use strict';
// ===== Tetapan pelancaran =====
// Isikan nilai sebenar sebelum melancarkan laman web. Lihat LAUNCH.md untuk langkah penuh.
const CONFIG = {
  // Supabase (Log masuk Google + simpanan awan + pembelian). Kunci "publishable" selamat didedahkan kepada pelayar.
  supabase: {
    url: 'https://aobpmnuvccntrjfsvxgf.supabase.co',
    key: 'sb_publishable_1mzJEEGfy7Wb2oPaosAH_A_h2rQvWv8',
  },

  // Google AdSense (H5 Games Ads / Ad Placement API). Contoh: 'ca-pub-1234567890123456'
  adsenseClient: null,
  adsTest: true,             // true = iklan ujian (adbreak-test). Tukar ke false selepas AdSense diluluskan.
  interstitialMinGap: 240,   // saat minimum antara iklan selingan

  // Pembelian ujian tanpa pelayan (HANYA untuk pembangunan di localhost / file://)
  devPurchases: true,
};
const IS_DEV = location.protocol === 'file:' || /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
