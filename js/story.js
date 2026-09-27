'use strict';
// ===== Skrip cerita bersama =====
const STARTERS = ['Anakpadi', 'Percik', 'Penyucil'];
const RIVAL_PICK = { Anakpadi: 'Percik', Percik: 'Penyucil', Penyucil: 'Anakpadi' };
const Story = {
  line() { return { Percik: ['Percik', 'Bahang', 'Nagabara'], Penyucil: ['Penyucil', 'Tempurung', 'Meriampenyu'], Anakpadi: ['Anakpadi', 'Padiwira', 'Sawahraja'] }[S.rivalStarter || 'Percik']; },
  comps() { return { Percik: [['Katak', 'Nagasura'], ['Periuk', 'Periukkera']], Penyucil: [['Musangapi', 'Musangraja'], ['Periuk', 'Periukkera']], Anakpadi: [['Musangapi', 'Musangraja'], ['Katak', 'Nagasura']] }[S.rivalStarter || 'Percik']; },
  rivalTeam(stage) {
    const L = this.line(), C = this.comps();
    switch (stage) {
      case 1: return [[L[0], 5]];
      case 2: return [['Pipit', 9], [L[0], 9]];
      case 3: return [['Merbah', 17], ['Kukang', 15], ['Mencit', 15], [L[1], 18]];
      case 4: return [['Merbah', 19], ['Tikusraya', 16], ['Kukangsakti', 18], [C[0][0], 17], [L[1], 20]];
      case 5: return [['Merbah', 25], ['Kukangsakti', 20], [C[0][0], 22], [C[1][0], 23], [L[1], 25]];
      case 6: return [['Helang', 37], ['Kukangsakti', 35], [C[0][1], 38], [C[1][1], 35], [L[2], 40]];
      case 7: return [['Helang', 47], ['Mahakukang', 45], ['Kerbausakti', 45], [C[0][1], 45], [C[1][1], 47], [L[2], 53]];
      case 8: return [['Helang', 61], ['Mahakukang', 59], ['Kerbausakti', 61], [C[0][1], 61], [C[1][1], 63], [L[2], 65]];
    }
  },
  async rivalFight(stage, pre, lose, opts = {}) {
    if (pre) await say(pre);
    const r = await fightTrainer({ cls: 'Pesaing', name: S.rival, look: 'johan', team: this.rivalTeam(stage), lose, pay: stage >= 7 ? 99 : 35, music: 'ketua', items: stage >= 6 ? ['Ubat Hiper'] : [] }, 'johan', opts);
    return r;
  }
};

// Jururawat Klinik Monsta
async function nurse(o) {
  await say('Selamat datang ke KLINIK MONSTA!');
  if (await UI.yes('Kami merawat Monsta kamu sehingga sihat sepenuhnya. Mahu Monsta kamu dirawat?')) {
    await say('Baiklah. Boleh saya ambil Monsta kamu sebentar?');
    o.dir = 'left';
    Snd.music(null); Snd.sfx('heal');
    await heal(true); await wait(1.4);
    o.dir = 'down';
    S.lastHeal = { map: World.map.id, x: World.p.x, y: World.p.y, ret: S.ret ? Object.assign({}, S.ret) : null, door: S.door ? Object.assign({}, S.door) : null };
    World.music();
    await say('Terima kasih kerana menunggu. Monsta kamu sudah sihat sepenuhnya!');
  }
  await say('Kami sentiasa menanti kedatangan kamu!');
}
async function clerk() {
  const stock = (World.ctx && World.ctx.stock) || ['Bola Tangkap', 'Ubat', 'Penawar'];
  if (World.ctx && World.ctx.parcel && !flag('bungkusan')) {
    await say('Hei! Kamu dari Penaga, kan?');
    await say('Profesor Meranti ada tempah barang. Tolong bawa bungkusan ini kepada dia, boleh?');
    setFlag('bungkusan'); await give('Bungkusan');
    return;
  }
  if (World.ctx && World.ctx.parcel && !flag('dex')) { await say('Tolong hantar bungkusan itu kepada Profesor Meranti di Penaga ya!'); return; }
  await Menus.shop(stock);
}
// Ketua gim
function gymLeader(n, L) {
  return {
    s: L.s, d: 'down', run: async o => {
      if (S.badges.includes(n)) { await say(L.after); return; }
      if (L.need && !L.need()) { await say(L.needText); return; }
      await say(L.pre);
      const r = await fightTrainer({ cls: L.cls || 'Ketua Gim', name: L.name, team: L.team, lose: L.lose, items: L.items || ['Ubat Super'], pay: 100, music: 'ketua', theme: L.theme || 'gim' }, L.s);
      if (r === 'win') {
        S.badges.push(n);
        Snd.sfx('level');
        await say(`{P} menerima ${BADGES[n].n.toUpperCase()}!`);
        await say(L.badgeText);
        if (L.reward) await give(L.reward[0], L.reward[1] || 1);
        if (L.won) await L.won(o);
      }
    }
  };
}
function gymGuide(type, tip) {
  return {
    s: 'pakcik', d: 'down', run: async () => {
      if (!flag('guide:' + World.map.id)) {
        await say('Hoi! Bakal juara! Nak cabar gim ini? Pak cik boleh beri nasihat!');
        await say(tip);
        await say('Nah, ambil ini. Minum dulu sebelum bertarung!');
        setFlag('guide:' + World.map.id);
        await give('Air Kelapa');
        return;
      }
      await say(tip);
    }
  };
}
// Jurulatih biasa
function trainer(s, d, cls, name, team, pre, lose, after, extra = {}) {
  return Object.assign({ s, d, tr: Object.assign({ cls, name, team, pre, lose, after }, extra.tr || {}) }, extra.o || {});
}
function lanun(d, team, pre, lose, after, extra = {}) {
  return { s: 'lanun', d, show: extra.show, tr: Object.assign({ cls: 'Lanun', name: 'Anak Buah', team, pre, lose, after, lanun: true, pay: 30 }, extra.tr || {}) };
}
// Papan tanda & NPC ringkas
const sign = t => ({ sign: t });
const npc = (s, d, t, extra = {}) => Object.assign({ s, d, t }, extra);
const item = (name, n) => ({ item: name, n: n || 1 });
const hid = name => ({ hid: name });
const KLINIK = { to: 'klinik' };
const shop = stock => ({ to: 'kedai', stock });
const house = o => ({ to: 'rumah', o });
