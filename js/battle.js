'use strict';
// ===== Sistem pertarungan =====
function stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function accMul(s) { return s >= 0 ? (3 + s) / 3 : 3 / (3 - s); }
function newSide() { return { mon: null, st: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 }, conf: 0, seed: false, recharge: false, flinch: false }; }
const BG_THEMES = {
  rumput: ['#c8f0b0', '#f0f8e0', '#a8d888', '#88c070'],
  pantai: ['#a8d8f8', '#f8f0d0', '#f0e0a8', '#d8c888'],
  gua: ['#685848', '#907860', '#a89070', '#806850'],
  dalam: ['#e8e0d0', '#f8f4ec', '#d8c8a8', '#c0b090'],
  bandar: ['#c8d8e8', '#f0f4f8', '#b8c0c8', '#98a0a8'],
  gim: ['#d8d0e8', '#f4f0fa', '#c0b0d8', '#a898c0'],
  air: ['#78b0e8', '#c8e8f8', '#88c0e8', '#5898d0'],
  malam: ['#303858', '#5a6088', '#6a7898', '#4a5878'],
  liga: ['#e8c8a0', '#f8ecd8', '#d8a878', '#b88858'],
};

class BattleScene {
  constructor(o) {
    this.o = o; this.wild = !!o.wild; this.tr = o.trainer || null;
    this.foeParty = this.wild ? [o.wild] : this.tr.team;
    this.me = newSide(); this.foe = newSide();
    this.theme = BG_THEMES[o.theme] || BG_THEMES.rumput;
    this.meX = -400; this.foeX = 400; this.meVis = false; this.foeVis = false;
    this.meTr = true; this.foeTr = !!this.tr; this.meTrX = 0; this.foeTrX = 0;
    this.meBlink = 0; this.foeBlink = 0; this.meY = 0; this.foeY = 0; this.foeScale = 1;
    this.hpShow = [0, 0]; this.expShow = 0; this.ball = null; this.runs = 0; this.flash = 0;
    this.participants = new Set();
  }
  foeName(m = this.foe.mon) { if (this.o.ghost && !S.bag['Teropong Roh']) return 'HANTU'; return monName(m) + (this.wild ? ' liar' : ' musuh'); }
  nm(side) { return side === this.me ? monName(side.mon) : this.foeName(side.mon); }
  say(t) { return UI.say(t); }
  async anim(dur, fn) { const t0 = Game.t; while (Game.t - t0 < dur) { fn((Game.t - t0) / dur); await wait(0.016); } fn(1); }
  async animHp(side) {
    const i = side === this.me ? 0 : 1, from = this.hpShow[i], to = side.mon.hp;
    const dur = Math.min(0.9, Math.abs(from - to) / maxHp(side.mon) * 1.5 + 0.1);
    await this.anim(dur, t => this.hpShow[i] = from + (to - from) * t);
  }
  update() { }
  draw() {
    const [sky, sky2, g1, g2] = this.theme;
    const gr = ctx.createLinearGradient(0, 0, 0, SH);
    gr.addColorStop(0, sky); gr.addColorStop(.6, sky2); gr.addColorStop(1, sky);
    ctx.fillStyle = gr; ctx.fillRect(0, 0, SW, SH);
    // pelantar
    const plat = (x, y, rx, ry) => { ctx.fillStyle = g2; ctx.beginPath(); ctx.ellipse(x, y + 4, rx, ry, 0, 0, 7); ctx.fill(); ctx.fillStyle = g1; ctx.beginPath(); ctx.ellipse(x, y, rx - 6, ry - 5, 0, 0, 7); ctx.fill(); };
    plat(560 + this.foeX * 0, 188, 140, 30);
    plat(180, 322, 170, 34);
    ctx.imageSmoothingEnabled = false;
    // lawan
    if (this.foeTr && this.tr) {
      const img = personSprite(this.tr.look || 'budak', 'down', 0);
      ctx.drawImage(img, 560 - 56 + this.foeTrX, 190 - 116, 112, 112);
    }
    if (this.foeVis && this.foe.mon && !(this.foeBlink > 0 && Math.floor(Game.t * 16) % 2)) {
      const img = this.o.ghost && !S.bag['Teropong Roh'] ? silhouette(this.foe.mon.sp) : monstaSprite(this.foe.mon.sp);
      const s = 192 * this.foeScale;
      ctx.drawImage(img, 560 - s / 2 + this.foeX, 200 - s + this.foeY + (192 - s) * .4, s, s);
    }
    // pemain
    if (this.meTr) {
      const img = personSprite(S.look || 'pemain', 'up', 0);
      ctx.drawImage(img, 180 - 64 + this.meTrX, 336 - 140, 128, 128);
    }
    if (this.meVis && this.me.mon && !(this.meBlink > 0 && Math.floor(Game.t * 16) % 2)) {
      const img = monstaSprite(this.me.mon.sp, true);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, SW, 330); ctx.clip();
      ctx.drawImage(img, 180 - 108 + this.meX, 338 - 216 + this.meY, 216, 216);
      ctx.restore();
    }
    if (this.ball) ctx.drawImage(ballSprite(this.ball.col), this.ball.x - 18, this.ball.y - 18, 36, 36);
    // kotak info
    if (this.foeVis && this.foe.mon) this.drawInfo(this.foe, 24, 26, false);
    if (this.meVis && this.me.mon) this.drawInfo(this.me, 398, 196, true);
    if (this.tr && this.foeTr && this.showBalls) this.drawBalls();
    if (this.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${this.flash})`; ctx.fillRect(0, 0, SW, SH); }
    if (!Game.scenes.some(s => s instanceof Dialog) && !Game.scenes.some(s => s instanceof ActionMenu || s instanceof MoveMenu)) panel(8, SH - 152, SW - 16, 144);
  }
  drawBalls() {
    const n = this.foeParty.length;
    for (let i = 0; i < 6; i++) {
      const m = this.foeParty[i]; if (!m) continue;
      const img = ballSprite(alive(m) ? '#e03838' : '#707070');
      ctx.drawImage(img, 60 + i * 34, 90, 30, 30);
    }
    const mine = S.party;
    for (let i = 0; i < 6; i++) { const m = mine[i]; if (!m) continue; ctx.drawImage(ballSprite(alive(m) ? '#e03838' : '#707070'), 420 + i * 34, 270, 30, 30); }
  }
  drawInfo(side, x, y, mine) {
    const m = side.mon, w = 298, h = mine ? 118 : 84;
    ctx.fillStyle = '#283044'; rr(x, y, w, h, 10); ctx.fill();
    ctx.fillStyle = '#f8f8f0'; rr(x + 3, y + 3, w - 6, h - 6, 8); ctx.fill();
    const nm = this.o.ghost && !mine && !S.bag['Teropong Roh'] ? 'HANTU' : monName(m);
    txt(nm, x + 14, y + 6, { size: 30 });
    txt('Tp' + m.lv, x + w - 14, y + 6, { size: 28, align: 'right' });
    if (m.status) { ctx.fillStyle = STATUS_COL[m.status]; rr(x + 14, y + 42, 50, 24, 5); ctx.fill(); txt(STATUS_NAME[m.status], x + 39, y + 42, { size: 24, color: '#fff', align: 'center' }); }
    const hpi = mine ? 0 : 1;
    const mh = maxHp(m), shown = clamp(this.hpShow[hpi], 0, mh), pct = shown / mh;
    const bx = x + 110, by = y + 48, bw = 170;
    txt('HP', x + 76, y + 40, { size: 26, color: '#d0a030' });
    ctx.fillStyle = '#404850'; ctx.fillRect(bx - 2, by - 2, bw + 4, 14);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(bx, by, bw, 10);
    ctx.fillStyle = pct > .5 ? '#48c048' : pct > .2 ? '#e8c030' : '#e04040'; ctx.fillRect(bx, by, bw * pct, 10);
    if (mine) {
      txt(`${Math.ceil(shown)} / ${mh}`, x + w - 16, y + 60, { size: 28, align: 'right' });
      const e0 = expFor(m.lv), e1 = expFor(m.lv + 1), ep = clamp((m.exp - e0) / (e1 - e0), 0, 1);
      ctx.fillStyle = '#404850'; ctx.fillRect(x + 40, y + 98, w - 60, 8);
      ctx.fillStyle = '#48a0e8'; ctx.fillRect(x + 42, y + 100, (w - 64) * (this.expShow !== null ? ep : 0), 4);
      txt('EXP', x + 12, y + 90, { size: 20, color: '#4880c0' });
    }
  }

  // ----- aliran utama -----
  async run() {
    const o = this.o;
    Snd.music(o.music || (this.tr ? (this.tr.lanun ? 'lanun' : 'ketua') : 'lawan'));
    // imbasan masuk
    for (let i = 0; i < 3; i++) { this.flash = 1; await wait(.07); this.flash = 0; await wait(.07); }
    this.meTrX = -500; if (this.tr) this.foeTrX = 500;
    await this.anim(.6, t => { this.meTrX = -500 * (1 - t); if (this.tr) this.foeTrX = 500 * (1 - t); });
    if (this.wild) {
      this.foe.mon = this.foeParty[0]; this.hpShow[1] = this.foe.mon.hp; this.foeVis = true; this.foeX = 400;
      await this.anim(.4, t => this.foeX = 400 * (1 - t));
      if (!o.ghost || S.bag['Teropong Roh']) seeMon(this.foe.mon.sp);
      await this.say(o.ghost && !S.bag['Teropong Roh'] ? 'HANTU muncul!' : o.intro || `${monName(this.foe.mon)} liar muncul!`);
      if (o.ghost && !S.bag['Teropong Roh']) await this.say('Alamak! HANTU itu tidak dapat dikenal pasti!');
    } else {
      this.showBalls = true;
      await this.say(`${this.tr.cls} ${this.tr.name} mahu bertarung!`);
      this.showBalls = false;
      await this.sendFoe(this.foeParty.findIndex(alive));
    }
    await this.sendMe(S.party.findIndex(alive), true);
    while (true) {
      const r = await this.turn();
      if (r) return r;
    }
  }
  async sendFoe(i) {
    const m = this.foeParty[i];
    this.foe = newSide(); this.foe.mon = m; this.hpShow[1] = m.hp;
    if (this.foeTr) { await this.anim(.35, t => this.foeTrX = 400 * t); this.foeTr = false; }
    await this.say(`${this.tr.cls} ${this.tr.name} menghantar ${monName(m)}!`);
    seeMon(m.sp);
    Snd.sfx('ball');
    this.foeVis = true; this.foeScale = .1;
    await this.anim(.3, t => this.foeScale = .1 + .9 * t);
  }
  async sendMe(i, first) {
    const m = S.party[i];
    this.me = newSide(); this.me.mon = m; this.hpShow[0] = m.hp; this.meIdx = i;
    this.participants.add(m);
    if (this.meTr) { await this.anim(.35, t => this.meTrX = -400 * t); this.meTr = false; }
    Snd.sfx('ball');
    this.meVis = true; this.meX = 0; this.meY = 150;
    await this.anim(.3, t => this.meY = 150 * (1 - t));
    await this.say(first ? `Pergi! ${monName(m)}!` : `Ayuh, ${monName(m)}!`);
  }
  async recallMe() {
    await this.say(`${monName(this.me.mon)}, kembali!`);
    await this.anim(.25, t => this.meY = 150 * t);
    this.meVis = false;
  }

  async chooseAction() {
    while (true) {
      const a = await new Promise(r => Game.push(new ActionMenu(this, r)));
      if (a === 0) {
        const mon = this.me.mon;
        if (mon.moves.every(x => x.pp <= 0)) { await this.say(`${monName(mon)} tiada lagi jurus yang boleh digunakan!`); return { type: 'move', id: 'bergelut' }; }
        const mi = await new Promise(r => Game.push(new MoveMenu(this, r)));
        if (mi < 0) continue;
        if (mon.moves[mi].pp <= 0) { await this.say('Tiada lagi PP untuk jurus ini!'); continue; }
        return { type: 'move', id: mon.moves[mi].id, slot: mi };
      }
      if (a === 1) {
        const r = await Menus.bag({ battle: true, wild: this.wild });
        if (!r) continue;
        return { type: 'item', ...r };
      }
      if (a === 2) {
        const i = await Menus.party({ mode: 'battle', cur: this.meIdx });
        if (i < 0) continue;
        return { type: 'switch', i };
      }
      if (a === 3) {
        if (!this.wild) { await this.say('Tidak boleh lari daripada pertarungan jurulatih!'); continue; }
        if (this.o.noRun) { await this.say('Tidak boleh lari!'); continue; }
        return { type: 'run' };
      }
    }
  }
  foeChoose() {
    const A = this.foe.mon, D = this.me.mon;
    if (this.foe.st && this.foe.recharge) return { type: 'recharge' };
    if (this.o.ghost && !S.bag['Teropong Roh']) return { type: 'ghost' };
    if (this.tr && this.tr.items && this.tr.items.length && A.hp < maxHp(A) * .3 && chance(.7)) return { type: 'fitem', item: this.tr.items.shift() };
    const usable = A.moves.filter(m => m.pp > 0);
    if (!usable.length) return { type: 'move', id: 'bergelut' };
    if (this.wild && !this.o.smart) { const m = pick(usable); return { type: 'move', id: m.id, slotRef: m }; }
    let best = null, bs = -1;
    for (const m of usable) {
      const mv = MOVES[m.id]; let sc = 0;
      if (mv.p > 0) {
        const eff = mv.typeless ? 1 : typeMul(mv.t, SP[D.sp].types);
        sc = (mv.fixed ? (mv.fixed === 'lvl' ? A.lv : 40) : mv.p) * eff * (SP[A.sp].types.includes(mv.t) ? 1.5 : 1) * (mv.a ? mv.a / 100 : 1);
        if (mv.recharge) sc *= .6;
      } else {
        if (mv.st) sc = D.status ? 0 : 50;
        if (mv.st === 'lumpuh' && mv.t === 'Elektrik' && SP[D.sp].types.includes('Tanah')) sc = 0;
        if (mv.s && !mv.self) sc = Object.entries(mv.s).every(([k, v]) => this.me.st[k] > -3) ? 25 : 0;
        if (mv.s && mv.self) sc = Object.entries(mv.s).every(([k]) => this.foe.st[k] < 2) ? 32 : 0;
        if (mv.heal || mv.rest) sc = A.hp < maxHp(A) * .45 ? 90 : 0;
        if (mv.seed) sc = this.me.seed || SP[D.sp].types.includes('Rumput') ? 0 : 42;
        if (mv.conf) sc = this.me.conf ? 0 : 36;
      }
      sc += Math.random() * 30;
      if (sc > bs) { bs = sc; best = m; }
    }
    return { type: 'move', id: best.id, slotRef: best };
  }

  async turn() {
    // tindakan pemain
    let act;
    if (this.me.recharge) act = { type: 'recharge' };
    else act = await this.chooseAction();
    if (act.type === 'run') {
      this.runs++;
      const a = stat(this.me.mon, 'spe'), b = stat(this.foe.mon, 'spe');
      const p = this.o.ghost ? 1 : a >= b ? 1 : clamp(a / b * .6 + .2 + .15 * this.runs, 0, 1);
      if (chance(p)) { Snd.sfx('run'); await this.say('Berjaya melarikan diri!'); return 'run'; }
      await this.say('Tidak dapat melarikan diri!');
      act = { type: 'none' };
    }
    if (act.type === 'item') {
      const r = await this.useItem(act);
      if (r) return r;
    }
    if (act.type === 'switch') {
      await this.recallMe();
      await this.sendMe(act.i, false);
    }
    const fact = this.foeChoose();
    if (fact.type === 'fitem') {
      const it = fact.item, A = this.foe.mon;
      A.hp = Math.min(maxHp(A), A.hp + (ITEMS[it].heal || 0)); if (ITEMS[it].cure) A.status = null;
      Snd.sfx('heal');
      await this.say(`${this.tr.cls} ${this.tr.name} menggunakan ${it.toUpperCase()}!`);
      await this.animHp(this.foe);
    }
    // susunan
    const order = [];
    const meMoves = act.type === 'move' || act.type === 'recharge';
    const foeMoves = fact.type === 'move' || fact.type === 'recharge' || fact.type === 'ghost';
    if (meMoves && foeMoves) {
      const pm = act.type === 'move' ? (MOVES[act.id].pri || 0) : 0, pf = fact.type === 'move' ? (MOVES[fact.id].pri || 0) : 0;
      let meFirst;
      if (pm !== pf) meFirst = pm > pf;
      else {
        const sa = this.speed(this.me), sb = this.speed(this.foe);
        meFirst = sa === sb ? chance(.5) : sa > sb;
      }
      if (meFirst) order.push([this.me, this.foe, act], [this.foe, this.me, fact]); else order.push([this.foe, this.me, fact], [this.me, this.foe, act]);
    } else {
      if (meMoves) order.push([this.me, this.foe, act]);
      if (foeMoves) order.push([this.foe, this.me, fact]);
    }
    for (let k = 0; k < order.length; k++) {
      const [att, def, a] = order[k];
      if (!alive(att.mon) || !alive(def.mon)) continue;
      if (a.type === 'recharge') { att.recharge = false; await this.say(`${this.nm(att)} perlu berehat!`); continue; }
      if (a.type === 'ghost') { await this.say(pick(['HANTU: Pergi... pergi dari sini...', 'HANTU: Keluarlah... dari rumah ini...'])); continue; }
      if (this.o.ghost && att === this.me && !S.bag['Teropong Roh']) { await this.say(`${monName(att.mon)} terlalu takut untuk bergerak!`); continue; }
      const slot = att === this.me ? (a.slot !== undefined ? att.mon.moves[a.slot] : null) : a.slotRef;
      await this.doMove(att, def, a.id, slot, k === 0);
      const r = await this.checkFaint();
      if (r) return r;
      if (r === false) break; // pertukaran paksa; tamat giliran
    }
    // hujung giliran
    for (const side of [this.me, this.foe]) {
      side.flinch = false;
      const m = side.mon; if (!m || !alive(m)) continue;
      if (m.status === 'racun' || m.status === 'bakar') {
        const d = Math.max(1, Math.floor(maxHp(m) / (m.status === 'racun' ? 8 : 16)));
        m.hp = Math.max(0, m.hp - d);
        await this.say(`${this.nm(side)} ${m.status === 'racun' ? 'terkena kesan racun' : 'melecur kepanasan'}!`);
        await this.blink(side); await this.animHp(side);
      }
      const other = side === this.me ? this.foe : this.me;
      if (side.seed && alive(m) && other.mon && alive(other.mon)) {
        const d = Math.max(1, Math.floor(maxHp(m) / 8));
        m.hp = Math.max(0, m.hp - d); other.mon.hp = Math.min(maxHp(other.mon), other.mon.hp + d);
        await this.say(`Benih pacat menyedut tenaga ${this.nm(side)}!`);
        await this.animHp(side); await this.animHp(other);
      }
    }
    const r = await this.checkFaint();
    if (r) return r;
    return null;
  }
  speed(side) { let s = stat(side.mon, 'spe') * stageMul(side.st.spe); if (side.mon.status === 'lumpuh') s /= 2; return s; }
  async blink(side) {
    Snd.sfx('hit');
    if (side === this.me) { this.meBlink = 1; await wait(.4); this.meBlink = 0; } else { this.foeBlink = 1; await wait(.4); this.foeBlink = 0; }
  }
  async lunge(side) {
    const k = side === this.me ? 1 : -1;
    await this.anim(.12, t => { if (side === this.me) this.meX = 30 * t; else this.foeX = -30 * t; });
    await this.anim(.12, t => { if (side === this.me) this.meX = 30 * (1 - t); else this.foeX = -30 * (1 - t); });
  }

  async doMove(att, def, id, slot, first) {
    const A = att.mon, D = def.mon, mv = MOVES[id];
    if (window.DBG && DBG.win && att === this.me) { A.status = null; att.conf = 0; att.flinch = false; if (mv.p === 0) return this.doMove(att, def, 'terkam', null, first); }
    const an = this.nm(att);
    // halangan status
    if (A.status === 'tidur') {
      A.sleep = (A.sleep || 1) - 1;
      if (A.sleep <= 0) { A.status = null; await this.say(`${an} sudah bangun!`); }
      else { await this.say(`${an} sedang tidur nyenyak.`); return; }
    }
    if (A.status === 'beku') {
      if (chance(.2)) { A.status = null; await this.say(`${an} sudah cair!`); }
      else { await this.say(`${an} beku kaku!`); return; }
    }
    if (att.flinch) { await this.say(`${an} tersentak dan tidak dapat bergerak!`); return; }
    if (att.conf > 0) {
      att.conf--;
      if (att.conf === 0) await this.say(`${an} sudah tidak keliru lagi!`);
      else {
        await this.say(`${an} sedang keliru!`);
        if (chance(1 / 3)) {
          const a = stat(A, 'atk') * stageMul(att.st.atk), d = stat(A, 'def') * stageMul(att.st.def);
          const dmg = Math.max(1, Math.floor(Math.floor(Math.floor(2 * A.lv / 5 + 2) * 40 * a / d) / 50) + 2);
          A.hp = Math.max(0, A.hp - dmg);
          await this.say('Ia mencederakan dirinya sendiri kerana keliru!');
          await this.blink(att); await this.animHp(att);
          return;
        }
      }
    }
    if (A.status === 'lumpuh' && chance(.25)) { await this.say(`${an} lumpuh! Ia tidak dapat bergerak!`); return; }
    if (slot) slot.pp = Math.max(0, slot.pp - 1);
    await this.say(`${an} menggunakan ${mv.n.toUpperCase()}!`);
    // ketepatan
    const targetsFoe = !(mv.self || mv.heal || mv.rest);
    if (targetsFoe && mv.a > 0 && !(window.DBG && DBG.win && att === this.me)) {
      const acc = mv.a * accMul(clamp(att.st.acc - def.st.eva, -6, 6));
      if (Math.random() * 100 >= acc) { await this.say(`Tetapi serangan ${an} terlepas!`); return; }
    }
    if (mv.p === 0) { await this.statusMove(att, def, mv); return; }
    // kerosakan
    await this.lunge(att);
    const r = this.calc(att, def, mv);
    if (r.eff === 0) { await this.say(`Ia tidak memberi kesan kepada ${this.nm(def)}...`); return; }
    const dealt = Math.min(D.hp, r.dmg);
    D.hp -= dealt;
    if (r.eff > 1) Snd.sfx('super'); else if (r.eff < 1) Snd.sfx('weak');
    await this.blink(def); await this.animHp(def);
    if (r.crit) await this.say('Serangan genting!');
    if (r.eff > 1) await this.say('Sangat berkesan!');
    else if (r.eff < 1) await this.say('Kurang berkesan...');
    if (mv.drain && alive(A)) {
      const h = Math.max(1, Math.floor(dealt * mv.drain));
      A.hp = Math.min(maxHp(A), A.hp + h); await this.animHp(att);
      await this.say(`Tenaga ${this.nm(def)} telah disedut!`);
    }
    if (mv.recoil) {
      const h = Math.max(1, Math.floor(dealt * mv.recoil));
      A.hp = Math.max(0, A.hp - h); await this.animHp(att);
      await this.say(`${an} tercedera akibat hentakan!`);
    }
    if (mv.recharge && alive(D)) att.recharge = true;
    if (!alive(D)) return;
    // kesan sampingan
    if (mv.st && chance((mv.sc || 100) / 100)) await this.inflict(def, mv.st, true);
    if (mv.s && mv.sc && chance(mv.sc / 100)) await this.changeStats(def, mv.s, true);
    if (mv.flinch && first && chance(mv.flinch / 100)) def.flinch = true;
    if (mv.conf && chance(mv.conf / 100) && !def.conf) { def.conf = 2 + rnd(4); await this.say(`${this.nm(def)} menjadi keliru!`); }
  }
  calc(att, def, mv) {
    const A = att.mon, D = def.mon;
    if (window.DBG && DBG.win) return att === this.me ? { dmg: 9999, eff: 1 } : { dmg: 1, eff: 1 };
    const eff = mv.typeless ? 1 : typeMul(mv.t, SP[D.sp].types);
    if (mv.fixed) return { dmg: eff === 0 ? 0 : (mv.fixed === 'lvl' ? A.lv : mv.fixed), eff: eff === 0 ? 0 : 1, crit: false };
    if (eff === 0) return { dmg: 0, eff: 0 };
    const phys = !SPECIAL.has(mv.t);
    const crit = chance(mv.crit ? 1 / 8 : 1 / 16);
    let as = att.st[phys ? 'atk' : 'spa'], ds = def.st[phys ? 'def' : 'spd'];
    if (crit) { as = Math.max(0, as); ds = Math.min(0, ds); }
    let a = stat(A, phys ? 'atk' : 'spa') * stageMul(as), d = stat(D, phys ? 'def' : 'spd') * stageMul(ds);
    if (phys && A.status === 'bakar') a /= 2;
    let dmg = Math.floor(Math.floor(Math.floor(2 * A.lv / 5 + 2) * mv.p * a / d) / 50) + 2;
    if (crit) dmg = Math.floor(dmg * 1.5);
    if (!mv.typeless && SP[A.sp].types.includes(mv.t)) dmg = Math.floor(dmg * 1.5);
    dmg = Math.floor(dmg * eff);
    dmg = Math.floor(dmg * (85 + rnd(16)) / 100);
    return { dmg: Math.max(1, dmg), eff, crit };
  }
  async statusMove(att, def, mv) {
    const A = att.mon, D = def.mon;
    if (mv.heal) {
      if (A.hp >= maxHp(A)) { await this.say('Tetapi HP sudah penuh!'); return; }
      A.hp = Math.min(maxHp(A), A.hp + Math.floor(maxHp(A) * mv.heal)); Snd.sfx('heal');
      await this.animHp(att); await this.say(`${this.nm(att)} memulihkan kesihatannya!`); return;
    }
    if (mv.rest) {
      if (A.hp >= maxHp(A)) { await this.say('Tetapi HP sudah penuh!'); return; }
      A.hp = maxHp(A); A.status = 'tidur'; A.sleep = 3; Snd.sfx('heal');
      await this.animHp(att); await this.say(`${this.nm(att)} tidur dan pulih sepenuhnya!`); return;
    }
    if (mv.seed) {
      if (SP[D.sp].types.includes('Rumput')) { await this.say(`Ia tidak memberi kesan kepada ${this.nm(def)}...`); return; }
      if (def.seed) { await this.say('Tetapi ia gagal!'); return; }
      def.seed = true; await this.say(`Benih pacat ditanam pada ${this.nm(def)}!`); return;
    }
    if (mv.conf) {
      if (def.conf) { await this.say(`${this.nm(def)} sudah pun keliru!`); return; }
      def.conf = 2 + rnd(4); await this.say(`${this.nm(def)} menjadi keliru!`); return;
    }
    if (mv.st) {
      if (mv.t === 'Elektrik' && SP[D.sp].types.includes('Tanah')) { await this.say(`Ia tidak memberi kesan kepada ${this.nm(def)}...`); return; }
      const ok = await this.inflict(def, mv.st, false);
      if (!ok) await this.say('Tetapi ia gagal!');
      return;
    }
    if (mv.s) await this.changeStats(mv.self ? att : def, mv.s, false);
  }
  async inflict(side, st, secondary) {
    const m = side.mon, t = SP[m.sp].types;
    if (m.status) return false;
    if ((st === 'racun' && t.includes('Racun')) || (st === 'bakar' && t.includes('Api')) || (st === 'lumpuh' && t.includes('Elektrik')) || (st === 'beku' && t.includes('Ais'))) return false;
    m.status = st;
    if (st === 'tidur') m.sleep = 1 + rnd(3);
    const msg = { racun: 'diracun', bakar: 'melecur', lumpuh: 'lumpuh! Ia mungkin tidak dapat bergerak', tidur: 'tertidur', beku: 'beku' }[st];
    await this.say(`${this.nm(side)} ${msg}!`);
    return true;
  }
  async changeStats(side, s, secondary) {
    for (const [k, v] of Object.entries(s)) {
      const cur = side.st[k];
      if ((v > 0 && cur >= 6) || (v < 0 && cur <= -6)) { if (!secondary) await this.say(`${STAT_NAME[k]} ${this.nm(side)} tidak boleh ${v > 0 ? 'naik' : 'turun'} lagi!`); continue; }
      side.st[k] = clamp(cur + v, -6, 6);
      Snd.sfx(v > 0 ? 'stat' : 'statdown');
      const w = v > 1 ? 'naik mendadak' : v > 0 ? 'naik' : v < -1 ? 'jatuh mendadak' : 'turun';
      await this.say(`${STAT_NAME[k]} ${this.nm(side)} ${w}!`);
    }
  }
  // null: teruskan; string: tamat; false: giliran terhenti (pertukaran)
  async checkFaint() {
    let broke = null;
    if (this.foe.mon && !alive(this.foe.mon) && this.foeVis) {
      Snd.sfx('faint');
      await this.anim(.35, t => this.foeY = 200 * t);
      this.foeVis = false; this.foeY = 0;
      await this.say(`${this.foeName()} pengsan!`);
      if (!(this.o.ghost && !S.bag['Teropong Roh'])) await this.giveExp();
      if (this.o.ghost) return 'win';
      const next = this.foeParty.findIndex(alive);
      if (next < 0) {
        if (this.me.mon && !alive(this.me.mon)) await this.meFaintAnim();
        return 'win';
      }
      if (!alive(this.me.mon)) { const r = await this.meFainted(); if (r) return r; }
      await this.sendFoe(next);
      this.participants = new Set([this.me.mon]);
      broke = false;
    }
    if (this.me.mon && !alive(this.me.mon) && this.meVis) {
      const r = await this.meFainted(); if (r) return r;
      broke = false;
    }
    return broke;
  }
  async meFaintAnim() {
    Snd.sfx('faint');
    await this.anim(.35, t => this.meY = 200 * t);
    this.meVis = false; this.meY = 0;
    await this.say(`${monName(this.me.mon)} pengsan!`);
  }
  async meFainted() {
    if (this.meVis) await this.meFaintAnim();
    this.participants.delete(this.me.mon);
    if (!S.party.some(alive)) return 'lose';
    let i = -1;
    while (i < 0) i = await Menus.party({ mode: 'forced', cur: this.meIdx });
    await this.sendMe(i, false);
    return null;
  }
  async giveExp() {
    const f = this.foe.mon, parts = [...this.participants].filter(m => alive(m) && S.party.includes(m));
    if (!parts.length) return;
    const total = Math.floor(SP[f.sp].exp * f.lv / 7 * (this.tr ? 1.5 : 1));
    const each = Math.max(1, Math.floor(total / parts.length));
    for (const m of parts) {
      await this.say(`${monName(m)} mendapat ${each} mata EXP!`);
      await gainExp(m, each, t => this.say(t));
      if (m === this.me.mon) this.hpShow[0] = m.hp;
    }
  }
  async useItem(act) {
    const it = ITEMS[act.item];
    if (it.ball) {
      if (!this.wild) {
        await this.say('Jurulatih itu menepis Bola!');
        await this.say('Jangan jadi pencuri!');
        return null;
      }
      takeItem(act.item);
      await this.say(`{P} membaling ${act.item.toUpperCase()}!`);
      const col = { 'Bola Tangkap': '#e03838', 'Bola Hebat': '#3868e0', 'Bola Ultra': '#e0c030', 'Bola Sakti': '#a040c0' }[act.item];
      Snd.sfx('ball');
      this.ball = { x: 150, y: 300, col };
      await this.anim(.5, t => { this.ball.x = 150 + (560 - 150) * t; this.ball.y = 300 - Math.sin(t * Math.PI) * 220 + (120 - 300) * t; });
      if (this.o.nocatch || (this.o.ghost && !S.bag['Teropong Roh'])) {
        this.ball = null;
        await this.say(this.o.ghost ? 'Bola itu menembusi HANTU dan jatuh ke lantai!' : 'Bola itu ditepis!');
        return null;
      }
      this.flash = .6; await wait(.08); this.flash = 0;
      await this.anim(.25, t => this.foeScale = 1 - t * .95);
      this.foeVis = false; this.foeScale = 1;
      this.ball.y = 170;
      const m = this.foe.mon, mh = maxHp(m);
      let shakes = 0, caught = false;
      if (it.ball >= 255) { caught = true; shakes = 3; }
      else {
        const sb = m.status === 'tidur' || m.status === 'beku' ? 2 : m.status ? 1.5 : 1;
        const a = Math.floor(((3 * mh - 2 * m.hp) * SP[m.sp].cr * it.ball) / (3 * mh) * sb);
        if (a >= 255) { caught = true; shakes = 3; }
        else {
          const b = 1048560 / Math.sqrt(Math.sqrt(16711680 / Math.max(1, a)));
          for (shakes = 0; shakes < 4; shakes++) if (rnd(65536) >= b) break;
          caught = shakes >= 4; shakes = Math.min(3, shakes);
        }
      }
      for (let i = 0; i < shakes; i++) {
        await wait(.35); Snd.sfx('shake');
        await this.anim(.3, t => this.ball.x = 560 + Math.sin(t * Math.PI * 2) * 10);
      }
      await wait(.3);
      if (caught) {
        Snd.sfx('catch');
        this.ball.col = '#888';
        await this.say(`Berjaya! ${monName(m).replace(' LIAR', '')} telah ditangkap!`);
        const fresh = !S.dex.caught[m.sp];
        catchMon(m.sp);
        if (fresh) await this.say(`Data ${m.sp.toUpperCase()} telah didaftarkan dalam MONSTADEX.`);
        m.status = m.status === 'beku' ? null : m.status;
        addMon(m, true);
        if (S.party.includes(m)) { } else await this.say(`${m.sp.toUpperCase()} telah dihantar ke PC Monsta.`);
        return 'caught';
      }
      this.ball = null; this.foeVis = true;
      Snd.sfx('ball');
      await this.say(['Alamak! Monsta itu terlepas keluar!', 'Aduh! Rasanya dah hampir dapat!', 'Arghh! Sikit lagi!', 'Tak guna! Hampir-hampir dapat tadi!'][shakes]);
      return null;
    }
    // barang pemulihan
    const m = S.party[act.target];
    takeItem(act.item);
    await this.say(`{P} menggunakan ${act.item.toUpperCase()}.`);
    applyItemEffect(m, act.item);
    Snd.sfx('heal');
    if (m === this.me.mon) await this.animHp(this.me);
    await this.say(act.msg || `${monName(m)} berasa lebih baik!`);
    return null;
  }
}
function applyItemEffect(m, name) {
  const it = ITEMS[name];
  if (it.revive) { m.hp = Math.max(1, Math.floor(maxHp(m) * it.revive)); m.status = null; return; }
  if (it.heal) m.hp = Math.min(maxHp(m), m.hp + it.heal);
  if (it.cure && (it.cure === 'semua' || it.cure === m.status)) m.status = null;
  if (it.pp) m.moves.forEach(x => x.pp = Math.min(MOVES[x.id].pp, x.pp + it.pp));
}
function canUseItemOn(m, name) {
  const it = ITEMS[name];
  if (it.revive) return !alive(m);
  if (!alive(m)) return false;
  if (it.heal && m.hp < maxHp(m)) return true;
  if (it.cure && m.status && (it.cure === 'semua' || it.cure === m.status)) return true;
  if (it.pp) return m.moves.some(x => x.pp < MOVES[x.id].pp);
  return false;
}

class ActionMenu {
  constructor(bs, res) { this.bs = bs; this.res = res; this.transparent = true; this.i = ActionMenu.last || 0; }
  update() {
    const i = this.i;
    if (Input.pressed.up && i >= 2) this.i -= 2;
    if (Input.pressed.down && i < 2) this.i += 2;
    if (Input.pressed.left && i % 2) this.i -= 1;
    if (Input.pressed.right && !(i % 2)) this.i += 1;
    if (i !== this.i) Snd.sfx('move');
    if (Input.pressed.a) { Snd.sfx('beep'); ActionMenu.last = this.i; Game.pop(this); this.res(this.i); }
  }
  draw() {
    panel(8, SH - 152, SW - 16, 144);
    const lines = wrapText(`Apa patut ${monName(this.bs.me.mon)} buat?`, 300);
    lines.slice(0, 3).forEach((l, k) => txt(l, 36, SH - 124 + k * 36));
    panel(360, SH - 152, SW - 368, 144, true);
    const opts = ['LAWAN', 'BEG', 'MONSTA', 'LARI'];
    opts.forEach((o, k) => {
      const x = 400 + (k % 2) * 150, y = SH - 120 + Math.floor(k / 2) * 50;
      txt(o, x, y); if (k === this.i) cursor(x - 22, y + 7);
    });
  }
}
class MoveMenu {
  constructor(bs, res) { this.bs = bs; this.res = res; this.transparent = true; this.i = 0; }
  update() {
    const n = this.bs.me.mon.moves.length, i = this.i;
    if (Input.pressed.up && i >= 2) this.i -= 2;
    if (Input.pressed.down && i + 2 < n) this.i += 2;
    if (Input.pressed.left && i % 2) this.i -= 1;
    if (Input.pressed.right && !(i % 2) && i + 1 < n) this.i += 1;
    if (i !== this.i) Snd.sfx('move');
    if (Input.pressed.a) { Snd.sfx('beep'); Game.pop(this); this.res(this.i); }
    if (Input.pressed.b) { Game.pop(this); this.res(-1); }
  }
  draw() {
    const mv = this.bs.me.mon.moves;
    panel(8, SH - 152, 470, 144, true);
    mv.forEach((m, k) => {
      const x = 50 + (k % 2) * 210, y = SH - 120 + Math.floor(k / 2) * 50;
      const nm = MOVES[m.id].n; txt(nm.length > 13 ? nm.slice(0, 12) + '.' : nm, x, y, { size: 30 });
      if (k === this.i) cursor(x - 22, y + 7);
    });
    panel(484, SH - 152, SW - 492, 144);
    const m = mv[this.i], d = MOVES[m.id];
    txt('PP', 510, SH - 122, { size: 28 });
    txt(`${m.pp}/${d.pp}`, SW - 36, SH - 122, { size: 28, align: 'right', color: m.pp === 0 ? '#d03030' : '#202028' });
    ctx.fillStyle = TYPE_COLOR[d.t]; rr(510, SH - 82, SW - 546, 34, 6); ctx.fill();
    txt(d.t.toUpperCase(), 510 + (SW - 546) / 2, SH - 80, { size: 28, color: '#fff', align: 'center' });
  }
}

// Mulakan pertarungan; kembali 'win'|'lose'|'run'|'caught'
async function startBattle(o) {
  const bs = new BattleScene(o);
  await fadeTo(1, 6);
  Game.push(bs);
  await fadeTo(0, 6);
  let r;
  try { r = await bs.run(); }
  catch (e) { console.error(e); r = 'run'; }
  if (r === 'win' && bs.tr) {
    Snd.music('menang');
    bs.foeTr = true; bs.foeTrX = 300;
    await bs.anim(.4, t => bs.foeTrX = 300 * (1 - t));
    await UI.say(`{P} telah mengalahkan ${bs.tr.cls} ${bs.tr.name}!`);
    if (bs.tr.lose) await UI.say(bs.tr.lose);
    const money = bs.tr.money !== undefined ? bs.tr.money : bs.tr.team[bs.tr.team.length - 1].lv * (bs.tr.pay || 20);
    if (money > 0) { S.money += money; await UI.say(`{P} mendapat RM${money} kerana menang!`); }
  }
  if (r === 'lose' && o.canLose) {
    await UI.say(o.loseText || '{P} kalah...');
  }
  // pulihkan status sementara
  for (const m of S.party) { if (m.status === 'tidur' && !alive(m)) m.status = null; }
  await fadeTo(1, 5);
  Game.pop(bs);
  World.music();
  await fadeTo(0, 5);
  // evolusi
  if (r !== 'lose') {
    for (const m of S.party) {
      if (m._leveled && alive(m)) { const to = evoByLevel(m); if (to) await evolve(m, to); }
    }
  }
  S.party.forEach(m => delete m._leveled);
  return r;
}
