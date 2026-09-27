'use strict';
// ===== Logik Monsta: cipta, statistik, EXP, jurus, evolusi =====
const STATK = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
const STAT_NAME = { hp: 'HP', atk: 'SERANGAN', def: 'PERTAHANAN', spa: 'SRG. KHAS', spd: 'PTH. KHAS', spe: 'KELAJUAN', acc: 'KETEPATAN', eva: 'ELAKAN' };
function expFor(lv) { return lv <= 1 ? 0 : lv * lv * lv; }
function makeMon(name, lv, opts = {}) {
  const sp = SP[name]; if (!sp) throw new Error('Monsta tiada: ' + name);
  const m = { sp: name, lv, exp: expFor(lv), iv: STATK.map(() => opts.iv !== undefined ? opts.iv : rnd(32)), status: null, moves: [] };
  const known = [];
  for (const [l, mv] of sp.learn) if (l <= lv && !known.includes(mv)) known.push(mv);
  for (const mv of known.slice(-4)) m.moves.push({ id: mv, pp: MOVES[mv].pp });
  if (opts.moves) m.moves = opts.moves.map(id => ({ id, pp: MOVES[id].pp }));
  m.hp = stat(m, 'hp');
  return m;
}
function stat(m, k) {
  const b = SP[m.sp].base[k], iv = m.iv[STATK.indexOf(k)];
  if (k === 'hp') return Math.floor((2 * b + iv) * m.lv / 100) + m.lv + 10;
  return Math.floor((2 * b + iv) * m.lv / 100) + 5;
}
function maxHp(m) { return stat(m, 'hp'); }
function monName(m) { return (m.nick || m.sp).toUpperCase(); }
function healMon(m) { m.hp = maxHp(m); m.status = null; m.moves.forEach(x => x.pp = MOVES[x.id].pp); }
function alive(m) { return m.hp > 0; }
// kembali: senarai jurus baru yang dipelajari pada tahap ini
function movesAt(m, lv) { return SP[m.sp].learn.filter(([l]) => l === lv).map(x => x[1]); }
// Tambah EXP; kembali senarai peristiwa naik tahap (async untuk UI)
async function gainExp(m, amount, say) {
  m.exp += amount;
  while (m.lv < 100 && m.exp >= expFor(m.lv + 1)) {
    const oldMax = maxHp(m);
    m.lv++;
    m.hp += maxHp(m) - oldMax;
    Snd.sfx('level');
    await say(`${monName(m)} naik ke tahap ${m.lv}!`);
    m._leveled = true;
    for (const mv of movesAt(m, m.lv)) await learnMove(m, mv, say);
  }
}
async function learnMove(m, mv, say) {
  if (m.moves.some(x => x.id === mv)) return false;
  const nm = MOVES[mv].n.toUpperCase();
  if (m.moves.length < 4) {
    m.moves.push({ id: mv, pp: MOVES[mv].pp });
    Snd.sfx('item');
    await say(`${monName(m)} telah mempelajari ${nm}!`);
    return true;
  }
  while (true) {
    await say(`${monName(m)} mahu mempelajari ${nm}. Tetapi ${monName(m)} sudah tahu empat jurus.`);
    const forget = await UI.yes(`Lupakan satu jurus untuk memberi ruang kepada ${nm}?`);
    if (forget) {
      const i = await UI.ask('Jurus mana patut dilupakan?', [...m.moves.map(x => MOVES[x.id].n), 'BATAL'], { cancel: 4 });
      if (i < 4) {
        const old = MOVES[m.moves[i].id].n.toUpperCase();
        m.moves[i] = { id: mv, pp: MOVES[mv].pp };
        await say(`1, 2 dan... Pap! ${monName(m)} lupa ${old}.`);
        Snd.sfx('item');
        await say(`Dan... ${monName(m)} telah mempelajari ${nm}!`);
        return true;
      }
    }
    if (await UI.yes(`Berhenti mempelajari ${nm}?`)) { await say(`${monName(m)} tidak mempelajari ${nm}.`); return false; }
  }
}
function evoByLevel(m) { const e = SP[m.sp].evos.find(e => e.lv && m.lv >= e.lv); return e ? e.to : null; }
function evoByItem(m, item) { const e = SP[m.sp].evos.find(e => e.item === item); return e ? e.to : null; }
function seeMon(name) { S.dex.seen[name] = 1; }
function catchMon(name) { S.dex.seen[name] = 1; S.dex.caught[name] = 1; }
function dexCount() { return [Object.keys(S.dex.seen).length, Object.keys(S.dex.caught).length]; }

// ---------- Adegan evolusi ----------
class EvoScene {
  constructor(m, to, res) { this.m = m; this.from = m.sp; this.to = to; this.res = res; this.t = 0; this.phase = 0; }
  draw() {
    let name = this.from;
    if (this.phase === 1) { const f = Math.sin(this.t * (4 + this.t * 3)) > 0; name = f ? this.to : this.from; }
    if (this.phase >= 2) name = this.to;
    if (R3.ok && R3.drawShow(name, { white: this.phase === 1, rot: this.phase === 1 ? this.t * 3 : undefined, y: PORTRAIT ? -1.2 : 0 })) {
      if (this.phase === 1) { ctx.fillStyle = `rgba(255,250,220,${.15 + .15 * Math.sin(this.t * 10)})`; ctx.fillRect(0, 0, SW, SH); }
      return;
    }
    screenBG('#3a3a7a', '#fff8d0');
    const img = this.phase === 1 ? silhouette(name) : monstaSprite(name);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, SW / 2 - 150, SH * .15, 300, 300);
    ctx.imageSmoothingEnabled = true;
  }
}
async function evolve(m, to) {
  const sc = new EvoScene(m, to);
  Game.push(sc);
  Snd.music(null);
  await UI.say(`Eh? ${monName(m)} sedang berevolusi!`);
  sc.phase = 1; Snd.sfx('evo');
  let cancelled = false;
  const t0 = Game.t;
  while (Game.t - t0 < 3.2) {
    await wait(0.05); sc.t = Game.t - t0;
    if (Input.held.b) { cancelled = true; break; }
  }
  if (cancelled) {
    sc.phase = 0;
    await UI.say(`Hah? ${monName(m)} berhenti berevolusi!`);
  } else {
    sc.phase = 2;
    const oldName = monName(m);
    const oldMax = maxHp(m);
    m.sp = to; m.hp += maxHp(m) - oldMax;
    catchMon(to);
    Snd.sfx('catch');
    await UI.say(`Tahniah! ${oldName} telah berevolusi menjadi ${to.toUpperCase()}!`);
    for (const mv of movesAt(m, m.lv)) await learnMove(m, mv, t => UI.say(t));
  }
  Game.pop(sc);
  World.music();
}
