'use strict';
(function (SK) {
  const U = SK.U, D = SK.D, A = SK.A, FX = SK.FX, E = FX.E, TS = 64, TAU = Math.PI * 2;
  const sfx = (k, o) => SK.Audio.sfx(k, o);
  SK.Inventory = class {
    constructor() { this.s = new Array(36).fill(null); }
    add(id, n = 1) { const it = D.items[id]; if (!it) return n; for (let i = 0; i < 36 && n > 0; i++) { const s = this.s[i]; if (s && s.id === id && s.n < it.stack) { const t = Math.min(n, it.stack - s.n); s.n += t; n -= t; } }
      for (let i = 0; i < 36 && n > 0; i++) if (!this.s[i]) { const t = Math.min(n, it.stack); this.s[i] = { id, n: t, d: it.dur || 0 }; n -= t; } return n; }
    count(id) { let c = 0; for (const s of this.s) if (s && s.id === id) c += s.n; return c; }
    take(id, n) { for (let i = 35; i >= 0 && n > 0; i--) { const s = this.s[i]; if (s && s.id === id) { const t = Math.min(n, s.n); s.n -= t; n -= t; if (s.n <= 0) this.s[i] = null; } } return n === 0; }
    can(rec) { for (const k in rec) if (this.count(k) < rec[k]) return false; return true; }
  };
  class Pickup {
    constructor(x, y, id, n = 1) { this.x = x; this.y = y; this.z = 0; this.vz = U.rnd(160, 300); this.vx = U.rnd(-90, 90); this.vy = U.rnd(-50, 50); this.id = id; this.n = n; this.t = 0; this.dead = false; this.ph = U.rnd(0, 6); }
    update(dt, g) {
      this.t += dt; if (this.z > 0 || this.vz > 0) { this.vz -= 900 * dt; this.z += this.vz * dt; this.x += this.vx * dt; this.y += this.vy * dt; if (this.z <= 0) { this.z = 0; if (Math.abs(this.vz) > 120) this.vz = -this.vz * .45; else this.vz = 0; this.vx *= .5; this.vy *= .5; } }
      const p = g.player, d = U.dist(this.x, this.y, p.x, p.y - 20);
      if (this.t > .5 && d < 110 && !p.dead) { const a = U.ang(this.x, this.y, p.x, p.y - 20), s = 260 + (110 - d) * 4; this.x += Math.cos(a) * s * dt; this.y += Math.sin(a) * s * dt; if (d < 24) { const left = p.inv.add(this.id, this.n); if (left < this.n) { sfx('item_pickup', { vol: .7 }); g.toast('+' + (this.n - left) + ' ' + D.items[this.id].name); } this.n = left; if (left <= 0) this.dead = true; } }
      if (this.t > 600) this.dead = true;
    }
    draw(ctx, t) { const src = D.iconSrc(this.id); if (!src) return; const im = A.img(src); if (!im.ok) return; const b = Math.sin(t * 3 + this.ph) * 4 + 6, s = 34;
      ctx.save(); ctx.globalAlpha = .3; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 12, 5, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.drawImage(im, this.x - s / 2, this.y - this.z - b - s + 8, s, s * im.naturalHeight / im.naturalWidth); ctx.restore(); }
  }
  class Proj {
    constructor(o) { Object.assign(this, { r: 10, life: 3, dmg: 10, pal: 'dark', owner: 'mob', t: 0, pierce: 0, boom: 0, homing: 0 }, o); this.dead = false; this.hit = new Set(); }
    update(dt, g) {
      this.t += dt; this.life -= dt; if (this.life <= 0) { this.die(g); return; }
      if (this.homing && this.owner === 'mob') { const p = g.player, a = Math.atan2(this.vy, this.vx), ta = U.ang(this.x, this.y, p.x, p.y - 30); let d = ta - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; const na = a + U.clamp(d, -this.homing * dt, this.homing * dt), sp = Math.hypot(this.vx, this.vy); this.vx = Math.cos(na) * sp; this.vy = Math.sin(na) * sp; }
      this.x += this.vx * dt; this.y += this.vy * dt;
      if (this.type !== 'arrow') { E.trail(this.x, this.y, this.pal, this.r * 1.3); FX.light(this.x, this.y, 130 + this.r * 3, FX.PAL[this.pal].l, .6); }
      if (g.world.tile(this.x / TS | 0, (this.y + 4) / TS | 0).solid) { this.die(g); return; }
      if (this.owner === 'mob') { const p = g.player; if (!p.dead && U.dist(this.x, this.y, p.x, p.y - 30) < this.r + 20) { p.hurt(this.dmg, this.x, this.y, this.pal); if (!this.pierce) this.die(g); } }
      else for (const m of g.mobs) { if (m.dead || this.hit.has(m)) continue; if (U.dist(this.x, this.y, m.x, m.y - m.h * .45) < this.r + m.h * .3) { m.hurt(this.dmg, this.x, this.y, this.pal, g); this.hit.add(m); if (!this.pierce) { this.die(g); break; } } }
    }
    die(g) { if (this.dead) return; this.dead = true; if (this.boom) { E.explosion(this.x, this.y, { pal: this.pal, r: this.boom }); const rr = this.boom * 1.2; if (this.owner === 'mob') { const p = g.player; if (U.dist(this.x, this.y, p.x, p.y) < rr) p.hurt(this.dmg, this.x, this.y, this.pal); } else for (const m of g.mobs) if (!m.dead && U.dist(this.x, this.y, m.x, m.y) < rr) m.hurt(this.dmg, this.x, this.y, this.pal, g); } else E.hit(this.x, this.y, { pal: this.pal }); }
    draw(ctx) { if (this.type === 'arrow') { const a = Math.atan2(this.vy, this.vx); ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(a); ctx.fillStyle = '#d8c8a0'; ctx.fillRect(-16, -1.5, 30, 3); ctx.fillStyle = '#ccd'; ctx.beginPath(); ctx.moveTo(14, -4); ctx.lineTo(22, 0); ctx.lineTo(14, 4); ctx.fill(); ctx.restore(); return; }
      const P = FX.PAL[this.pal]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const r = this.r * (1 + Math.sin(this.t * 22) * .08); ctx.drawImage(FX.glow(P.b), this.x - r * 2.4, this.y - r * 2.4, r * 4.8, r * 4.8); ctx.drawImage(FX.glow([255, 255, 255]), this.x - r, this.y - r, r * 2, r * 2); ctx.restore(); }
  }
  const flashC = document.createElement('canvas'), flashG = flashC.getContext('2d');
  function drawFlash(ctx, im, x, y, w, h, a) { const W = Math.ceil(w), H = Math.ceil(h); if (flashC.width < W || flashC.height < H) { flashC.width = W; flashC.height = H; } flashG.globalCompositeOperation = 'source-over'; flashG.clearRect(0, 0, flashC.width, flashC.height); flashG.drawImage(im, 0, 0, w, h); flashG.globalCompositeOperation = 'source-atop'; flashG.fillStyle = `rgba(255,255,255,${a})`; flashG.fillRect(0, 0, W, H); ctx.drawImage(flashC, 0, 0, W, H, x, y, W, H); }
  SK.drawFlash = drawFlash;
  function elemOf(name) { for (const [re, e] of D.elem) if (re.test(name)) return e; return 'dark'; }
  class Mob {
    constructor(slug, x, y, g, kind = 'mobs') {
      const info = SK_MAN[kind][slug], nm = (info ? info.name : slug).toLowerCase(); this.slug = slug; this.kind = kind; this.name = info ? info.name : slug; this.x = x; this.y = y; this.vx = this.vy = 0; this.kx = this.ky = 0;
      let rule = D.mobRules[D.mobRules.length - 1][1]; for (const [re, r] of D.mobRules) if (re.test(nm)) { rule = r; break; } this.rule = rule; this.ai = rule.ai; this.elem = elemOf(nm);
      const sc = U.rnd(.92, 1.08), tier = /король|архи|старшая|вожд|главарь|капитан|гладиатор|палач|берсерк|убийца/.test(nm) ? 1.6 : /ветеран|рыцарь|страж/.test(nm) ? 1.25 : 1;
      this.h = rule.h * sc * (/король|архи/.test(nm) ? 1.12 : 1); this.maxhp = this.hp = Math.round(rule.hp * tier * U.rnd(.9, 1.15)); this.dmg = Math.round((rule.dmg || 0) * tier); this.spd = rule.spd * U.rnd(.9, 1.1);
      this.face = U.pick([-1, 1]); this.t = U.rnd(0, 9); this.st = 'idle'; this.stt = U.rnd(.5, 2.5); this.cd = U.rnd(.5, 1.5); this.flash = 0; this.dead = false; this.ph = U.rnd(0, 6); this.aggro = false; this.fly = !!rule.fly; this.ghost = this.ai === 'ghost' || /призрак|дух|банши|тень/.test(nm);
      this.img = kind === 'mobs' ? A.mob(slug) : A.npc(slug); this.home = { x, y }; this.tx = x; this.ty = y; this.wt = 0; this.sq = 1; this.pal = this.elem; this.hurtT = 0; this.undead = /скелет|зомби|вурдалак|упырь|мумия|призрак|мертвец|проклят|лич|банши/.test(nm);
    }
    hurt(dmg, sx, sy, pal, g, o = {}) {
      if (this.dead) return; this.hp -= dmg; this.flash = .14; this.hurtT = .4; const a = U.ang(sx, sy, this.x, this.y), kb = o.kb == null ? 260 : o.kb; this.kx += Math.cos(a) * kb; this.ky += Math.sin(a) * kb * .6; this.aggro = true;
      if (this.ai === 'passive') { this.st = 'flee'; this.stt = 3; }
      E.hit(this.x, this.y - this.h * .45, { pal: pal || 'holy', ang: a }); E.blood(this.x, this.y - this.h * .4, { ang: a, c: this.undead ? [200, 200, 180] : this.elem === 'fire' ? [255, 120, 30] : this.elem === 'ice' ? [150, 210, 255] : [150, 15, 25], n: 7 });
      g.dmgText(this.x, this.y - this.h, Math.round(dmg), o.crit ? '#ffd24a' : '#fff'); sfx(this.undead ? 'bones_rattle' : 'blood_squelch', { x: this.x, y: this.y, vol: .6 });
      if (this.hp <= 0) this.die(g);
    }
    die(g) {
      this.dead = true; E.explosion(this.x, this.y - this.h * .4, { pal: this.undead ? 'dark' : this.elem, r: 50 + this.h * .3 }); SK.hitstop(50); SK.shake(.18); sfx('skeleton_collapse', { x: this.x, y: this.y, vol: .6 });
      const nm = this.name.toLowerCase(), L = (id, a, b, ch = 1) => { if (Math.random() < ch) g.drop(this.x, this.y, id, U.rint(a, b)); };
      if (this.ai === 'passive' || /волк|медвед|кабан|барс|ягуар|пес|мамонт|крокодил|змей|анаконда/.test(nm)) { L('meat_raw', 1, 2); L('hide', 0, 2, .6); if (/полярн|медвед|белый|ледян|барс/.test(nm)) L('fur', 1, 2); if (this.fly) L('feather', 1, 3); }
      if (this.undead) { L('bone', 1, 3, .8); L('cloth', 1, 2, .4); L('coal', 1, 2, .3); } if (/паук|скорпион/.test(nm)) { L('web', 1, 2, .6); L('slime', 1, 1, .4); }
      if (this.ai === 'caster' || this.ai === 'ghost') { L('p_heal', 1, 1, .12); L('bottle', 1, 2, .3); L('core_void', 1, 1, .05); L('slime', 1, 1, .3); }
      if (/разбойник|наемник|дикарь|варвар|сектант|охотник/.test(nm)) { L('iron_ing', 1, 2, .3); L('bread', 1, 1, .3); L('cloth', 1, 2, .5); L('scrap', 1, 2, .4); } if (/голем|колосс|страж/.test(nm)) { L('stone', 3, 6); L('iron_ore', 1, 3, .4); L('shard', 1, 1, .08); }
      L('berry_red', 1, 2, .15); g.player.kills = (g.player.kills || 0) + 1;
    }
    update(dt, g) {
      this.t += dt; this.cd -= dt; this.flash = Math.max(0, this.flash - dt); this.hurtT = Math.max(0, this.hurtT - dt); const p = g.player, dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
      if (Math.abs(this.kx) + Math.abs(this.ky) > 5) { g.world.move(this, this.kx * dt, this.ky * dt, 16); this.kx *= Math.exp(-9 * dt); this.ky *= Math.exp(-9 * dt); }
      const night = g.isNight(); const sense = (night ? 520 : 420) * (this.aggro ? 1.8 : 1); let mx = 0, my = 0; const sp = this.spd;
      const wander = () => { this.wt -= dt; if (this.wt <= 0) { this.wt = U.rnd(1.5, 4); const a = U.rnd(0, TAU), r = U.rnd(40, 200); this.tx = this.home.x + Math.cos(a) * r; this.ty = this.home.y + Math.sin(a) * r; if (Math.random() < .35) { this.tx = this.x; this.ty = this.y; } } const ddx = this.tx - this.x, ddy = this.ty - this.y, dd = Math.hypot(ddx, ddy); if (dd > 12) { mx = ddx / dd * .45; my = ddy / dd * .45; } };
      const ai = this.ai;
      if (ai === 'passive' || ai === 'villager') { if (this.st === 'flee') { this.stt -= dt; const a = Math.atan2(-dy, -dx); mx = Math.cos(a) * 1.3; my = Math.sin(a) * 1.3; if (this.stt <= 0) this.st = 'idle'; } else wander(); }
      else if (!p.dead && (d < sense || (this.aggro && d < 900))) {
        if (!this.aggro) { this.aggro = true; if (this.rule.snd) sfx(this.rule.snd, { x: this.x, y: this.y, vol: .7 }); }
        const ang = Math.atan2(dy, dx); this.face = dx > 0 ? 1 : -1;
        if (this.st === 'windup') { this.stt -= dt; this.sq = 1 + Math.sin(U.clamp(1 - this.stt / this.wd, 0, 1) * 3) * .22; if (this.stt <= 0) this.fire(g, ang); }
        else if (this.st === 'strike') { this.stt -= dt; mx = this.sx * 4.2; my = this.sy * 4.2; E.trail(this.x, this.y - 20, this.pal, 12); if (!this.did && d < (this.rule.rng || 40) + 20) { this.did = true; p.hurt(this.dmg, this.x, this.y, this.pal); } if (this.stt <= 0) { this.st = 'recover'; this.stt = .5; } }
        else if (this.st === 'recover') { this.stt -= dt; if (this.stt <= 0) this.st = 'idle'; }
        else {
          const rng = this.rule.rng || 40;
          if (ai === 'melee') { if (d > rng * .8) { mx = Math.cos(ang); my = Math.sin(ang); } if (d < rng + 22 && this.cd <= 0) { this.st = 'windup'; this.wd = this.stt = .42; this.cd = this.rule.cd || 1.3; E.warn(this.x, this.y, rng + 20, .42, { col: '#ff4040' }); sfx('warning_beep', { x: this.x, y: this.y, vol: .25 }); } }
          else { const want = this.rule.rng * .75; if (d > want + 40) { mx = Math.cos(ang); my = Math.sin(ang); } else if (d < want - 60) { mx = -Math.cos(ang); my = -Math.sin(ang); } else { const sg = Math.sign(Math.sin(this.ph)) || 1; mx = -Math.sin(ang) * .4 * sg; my = Math.cos(ang) * .4 * sg; } if (d < this.rule.rng + 40 && this.cd <= 0) { this.st = 'windup'; this.wd = this.stt = .6; this.cd = this.rule.cd || 2; E.magicCircle(this.x, this.y, { pal: this.elem, r: 50, life: .65 }); } }
        }
      } else { this.aggro = false; wander(); }
      const l = Math.hypot(mx, my); if (l > .02) { const m = Math.min(1.4, l) / l; this.vx += (mx * m * sp - this.vx) * Math.min(1, dt * 8); this.vy += (my * m * sp - this.vy) * Math.min(1, dt * 8); if (Math.abs(mx) > .1 && this.st !== 'windup') this.face = mx > 0 ? 1 : -1; } else { this.vx *= Math.exp(-8 * dt); this.vy *= Math.exp(-8 * dt); }
      if (Math.hypot(this.vx, this.vy) > 4) { g.world.move(this, this.vx * dt, this.vy * dt, 16); this.ph += dt * (6 + Math.hypot(this.vx, this.vy) / 30); }
      this.sq += (1 - this.sq) * Math.min(1, dt * 10);
    }
    fire(g, ang) {
      const p = g.player, r = this.rule; this.sq = 1;
      if (this.ai === 'melee') { this.st = 'strike'; this.did = false;
        if (r.slam) { this.st = 'recover'; this.stt = .7; E.explosion(this.x + Math.cos(ang) * 40, this.y, { pal: this.elem, r: 70 }); if (U.dist(this.x, this.y, p.x, p.y) < (r.rng || 40) + 70) p.hurt(this.dmg, this.x, this.y, this.pal); sfx('hammer_hit', { x: this.x, y: this.y }); }
        else { this.stt = r.lunge ? .22 : .16; this.sx = Math.cos(ang) * (r.lunge ? 1.5 : .6); this.sy = Math.sin(ang) * (r.lunge ? 1.5 : .6); sfx('knife_slash', { x: this.x, y: this.y, vol: .5 }); } return; }
      this.st = 'recover'; this.stt = .6; const pal = this.elem, speed = 330;
      if (r.proj === 'arrow') { g.projs.push(new Proj({ x: this.x, y: this.y - this.h * .5, vx: Math.cos(ang) * 520, vy: Math.sin(ang) * 520, dmg: this.dmg, type: 'arrow', pal: 'wind', life: 2, r: 6 })); sfx('bow_shot', { x: this.x, y: this.y, vol: .6 }); }
      else { const n = /архи|хаос|стихий/.test(this.name.toLowerCase()) ? 3 : 1; for (let i = 0; i < n; i++) { const a = ang + (i - (n - 1) / 2) * .22; g.projs.push(new Proj({ x: this.x, y: this.y - this.h * .55, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, dmg: this.dmg, pal, r: 12, life: 3, homing: this.ghost ? 1.2 : 0, boom: pal === 'fire' ? 50 : 0 })); } sfx(pal === 'fire' ? 'fireball' : pal === 'ice' ? 'ice_spell' : 'magic_spell', { x: this.x, y: this.y, vol: .6 }); }
    }
    draw(ctx, t) {
      const im = this.img; if (!im.ok) return; const h = this.h, w = h * im.naturalWidth / im.naturalHeight, mv = Math.hypot(this.vx, this.vy) > 8; let bob = 0, rot = 0, sx = 1, sy = 1;
      if (this.fly) bob = Math.sin(t * 3 + this.ph) * 8 + 26; else if (mv) { bob = Math.abs(Math.sin(this.ph)) * 7; rot = Math.sin(this.ph) * .05; } sy = 1 + Math.sin(t * 2.4 + this.ph) * .015;
      if (this.st === 'windup') { sx = 1.08; sy = .9; } else if (this.st === 'strike') { sx = 1.15; sy = .88; }
      ctx.save(); ctx.globalAlpha = .3 - (this.fly ? .1 : 0); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x, this.y, w * .3 * (1 - bob / 140), w * .09, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      ctx.translate(this.x, this.y - bob); ctx.rotate(rot * this.face); ctx.scale(this.face > 0 ? -sx : sx, sy * this.sq); if (this.ghost) ctx.globalAlpha = .88;
      if (this.flash > 0) drawFlash(ctx, im, -w / 2, -h, w, h, Math.min(1, this.flash * 9)); else ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
      if (this.hp < this.maxhp && this.hurtT > 0) { const bw = Math.max(40, w * .5); ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(this.x - bw / 2, this.y - h - 16, bw, 5); ctx.fillStyle = '#c33'; ctx.fillRect(this.x - bw / 2 + 1, this.y - h - 15, (bw - 2) * Math.max(0, this.hp / this.maxhp), 3); }
    }
  }
  class Boss extends Mob {
    constructor(id, x, y, g) {
      const def = D.bosses[id], slug = A.byName('bosses', def.art) || Object.keys(SK_MAN.bosses)[0]; super(slug, x, y, g, 'bosses'); this.id = id; this.def = def; this.name = def.name; this.maxhp = this.hp = def.hp; this.h = def.size; this.dmg = def.dmg; this.pal = this.elem = def.pal; this.img = A.boss(slug);
      this.phase = 1; this.cur = null; this.wait = 2.5; this.pi = 0; this.intro = 3.2; this.aggro = true; this.isBoss = true; this.tau = 60 / def.bpm; this.dead = false; this.sq = 1;
    }
    hurt(dmg, sx, sy, pal, g, o = {}) { if (this.dead || this.intro > 0) return; this.hp -= dmg; this.flash = .08; E.hit(this.x + U.rnd(-40, 40), this.y - this.h * U.rnd(.3, .8), { pal: pal || 'holy', ang: U.ang(sx, sy, this.x, this.y) }); g.dmgText(this.x + U.rnd(-30, 30), this.y - this.h * U.rnd(.5, 1), Math.round(dmg), o.crit ? '#ffd24a' : '#fff'); sfx('sword_hit', { vol: .5 });
      const f = this.hp / this.maxhp; if (this.phase === 1 && f < .66) this.setPhase(2, g); else if (this.phase === 2 && f < .33) this.setPhase(3, g); if (this.hp <= 0) this.die(g); }
    setPhase(n, g) { this.phase = n; this.cur = null; this.wait = this.tau * 3; this.sq = 1.25; SK.shake(.8); SK.hitstop(180); E.shockwave(this.x, this.y, { pal: this.def.pal, r: 360 }); E.magicCircle(this.x, this.y, { pal: this.def.pal, r: 200, life: 1.4 }); E.pillar(this.x, this.y, { pal: this.def.pal, h: 520, w: 120, life: 1 }); sfx(this.def.snd || 'boss_roar', { vol: 1, pitch: .02 }); g.banner('Фаза ' + n, this.name); }
    die(g) { this.dead = true; g.bossDie(this); }
    beat(n = 1) { const m = SK.Audio.music; return m && m.src ? SK.Audio.beatIn(this.def.bpm) + (n - 1) * this.tau : this.tau * n; }
    ptA() { const p = SK.game.player; return Math.atan2(p.y - 30 - (this.y - this.h * .5), p.x - this.x); }
    start(pat, g) {
      const tau = this.tau, ph = this.phase, p = g.player, c = this.cur = { pat, t: 0, step: 0 };
      switch (pat) {
        case 'aimed': c.dur = tau * 4; c.n = 3 + ph; break; case 'ring': c.dur = tau * 4; break; case 'slam': c.dur = tau * 4; c.tx = p.x; c.ty = p.y; E.warn(c.tx, c.ty, 130 + ph * 14, tau * 2, { col: '#ff4040' }); sfx('warning_beep', { vol: .5 }); break;
        case 'charge': c.dur = tau * 5; c.ang = this.ptA(); c.sx = this.x; c.sy = this.y; this.sq = .85; break; case 'summon': c.dur = tau * 4; E.magicCircle(this.x, this.y + 40, { pal: this.def.pal, r: 150, life: tau * 3 }); sfx('rune_activate', { vol: .8 }); break;
        case 'vortex': c.dur = tau * 6; c.zs = []; for (let i = 0; i < 2 + ph; i++) { const a = U.rnd(0, TAU), r = i ? U.rnd(90, 230) : 0, z = { x: p.x + Math.cos(a) * r, y: p.y + Math.sin(a) * r * .8, r: 110, t: 0 }; c.zs.push(z); E.warn(z.x, z.y, z.r, tau * 2, { col: '#c060ff' }); } break;
        case 'lightning': c.dur = tau * 5; c.zs = []; for (let i = 0; i < 4 + ph * 2; i++) c.zs.push({ x: p.x + U.rnd(-280, 280), y: p.y + U.rnd(-200, 200), t: i * tau * .35 }); break;
        case 'beam': c.dur = tau * 7; c.a0 = this.ptA() - 1; c.dir = Math.random() < .5 ? 1 : -1; break;
      }
    }
    upd(dt, g) {
      const c = this.cur, p = g.player, tau = this.tau, D_ = this.def; c.t += dt; const cx = this.x, cy = this.y - this.h * .55;
      switch (c.pat) {
        case 'aimed': { const every = tau * .5; while (c.t >= c.step * every + tau * 1.2 && c.step < c.n) { c.step++; const a = this.ptA() + U.rnd(-.12, .12); for (let i = -1; i <= 1; i++) if (this.phase > 1 || i === 0) g.projs.push(new Proj({ x: cx, y: cy, vx: Math.cos(a + i * .2) * 360, vy: Math.sin(a + i * .2) * 360, dmg: this.dmg, pal: D_.pal, r: 13, life: 4, boom: D_.pal === 'fire' ? 48 : 0 })); sfx(D_.pal === 'fire' ? 'fireball' : 'magic_spell', { vol: .5 }); E.burst ? 0 : 0; FX.burst(cx, cy, D_.pal, 8, { s1: 220 }); } break; }
        case 'ring': { const times = [tau * 1.2, tau * 2.2, tau * 3.2]; if (c.step < (this.phase > 1 ? 3 : 2) && c.t >= times[c.step]) { const n = 16 + this.phase * 4, off = c.step * (Math.PI / n); for (let i = 0; i < n; i++) { const a = i / n * TAU + off; g.projs.push(new Proj({ x: cx, y: cy, vx: Math.cos(a) * 250, vy: Math.sin(a) * 250, dmg: this.dmg * .8, pal: D_.pal, r: 10, life: 5 })); } c.step++; E.shockwave(cx, cy + 20, { pal: D_.pal, r: 140 }); SK.shake(.25); sfx('psychic_wave', { vol: .6 }); } break; }
        case 'slam': { if (!c.did && c.t >= tau * 2) { c.did = true; E.explosion(c.tx, c.ty, { pal: D_.pal, r: 150 }); E.pillar(c.tx, c.ty, { pal: D_.pal, h: 420 }); if (U.dist(c.tx, c.ty, p.x, p.y) < 130 + this.phase * 14) p.hurt(this.dmg * 1.4, c.tx, c.ty, D_.pal); sfx('hammer_hit', { vol: 1 }); const n = 8 + this.phase * 2; for (let i = 0; i < n; i++) { const a = i / n * TAU; g.projs.push(new Proj({ x: c.tx, y: c.ty, vx: Math.cos(a) * 300, vy: Math.sin(a) * 300, dmg: this.dmg * .6, pal: D_.pal, r: 9, life: 2.2 })); } this.x += (c.tx - this.x) * .5; this.y += (c.ty - this.y) * .4; } break; }
        case 'charge': { if (c.t < tau * 1.5) { if (!c.w) { c.w = true; FX.shape({ life: tau * 1.5, draw(ctx, s, t) { ctx.globalAlpha = .25 + .2 * Math.sin(t * 40); ctx.strokeStyle = '#ff4040'; ctx.lineWidth = 46; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c.sx, c.sy); ctx.lineTo(c.sx + Math.cos(c.ang) * 620, c.sy + Math.sin(c.ang) * 620); ctx.stroke(); } }); } }
          else if (c.t < tau * 2.4) { const sp = 820; g.world.move(this, Math.cos(c.ang) * sp * dt, Math.sin(c.ang) * sp * dt, 30); E.trail(this.x, this.y - this.h * .4, D_.pal, 26); E.dust(this.x, this.y, 2); SK.shake(.06); if (!c.hit && U.dist(this.x, this.y, p.x, p.y) < 70) { c.hit = true; p.hurt(this.dmg * 1.3, this.x, this.y, D_.pal); } } break; }
        case 'summon': { if (!c.did && c.t >= tau * 1.5) { c.did = true; const list = Object.keys(SK_MAN.mobs).filter(k => /скелет|призрак|проклятый воин|мумия|ледяной воин|разбойник|дикий волк|сектант/.test(SK_MAN.mobs[k].name.toLowerCase())); const pool = list.length ? list : Object.keys(SK_MAN.mobs).slice(0, 8); const n = 2 + this.phase; for (let i = 0; i < n; i++) { const a = i / n * TAU, m = new Mob(U.pick(pool), this.x + Math.cos(a) * 160, this.y + Math.sin(a) * 120, g); m.hp = m.maxhp = Math.round(m.maxhp * .6); m.aggro = true; m.minion = true; g.mobs.push(m); E.explosion(m.x, m.y, { pal: D_.pal, r: 40 }); } sfx('portal', { vol: .8 }); } break; }
        case 'vortex': { for (const z of c.zs) { z.t += dt; if (!z.on && z.t >= tau * 2) { z.on = true; E.vortex(z.x, z.y, { pal: D_.pal, r: z.r, life: tau * 3, up: 40 }); sfx('distortion_horror', { vol: .5 }); } if (z.on && z.t < tau * 5) { if (U.dist(z.x, z.y, p.x, p.y) < z.r && (c.tick = (c.tick || 0) - dt) <= 0) { c.tick = .45; p.hurt(this.dmg * .5, z.x, z.y, D_.pal); const a = U.ang(p.x, p.y, z.x, z.y); p.kx += Math.cos(a) * 160; p.ky += Math.sin(a) * 160; } } } break; }
        case 'lightning': { for (const z of c.zs) { if (!z.w && c.t >= z.t) { z.w = true; E.warn(z.x, z.y, 56, tau * .8, { col: '#aaccff' }); } if (!z.h && c.t >= z.t + tau * .8) { z.h = true; E.lightning(z.x, z.y - 600, z.x, z.y, { pal: 'bolt' }); E.explosion(z.x, z.y, { pal: 'bolt', r: 60 }); if (U.dist(z.x, z.y, p.x, p.y) < 70) p.hurt(this.dmg, z.x, z.y, 'bolt'); } } break; }
        case 'beam': { const warm = tau * 1.5, len = 900; if (c.t < warm) { c.a = c.a0; if (!c.w) { c.w = true; FX.shape({ life: warm, draw(ctx, s, t) { ctx.globalAlpha = .3 + t * .4; ctx.strokeStyle = FX.PAL[D_.pal].l; ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(c.a) * len, cy + Math.sin(c.a) * len); ctx.stroke(); ctx.setLineDash([]); } }); } }
          else if (c.t < warm + tau * 4) { const k = (c.t - warm) / (tau * 4); c.a = c.a0 + c.dir * k * 2.2 * (this.phase > 1 ? 1.2 : 1); const ex = cx + Math.cos(c.a) * len, ey = cy + Math.sin(c.a) * len; if ((c.bt = (c.bt || 0) - dt) <= 0) { c.bt = .08; E.beam(cx, cy, ex, ey, { pal: D_.pal, w: 38, life: .12 }); } SK.shake(.05);
            const vx = ex - cx, vy = ey - cy, tt = U.clamp(((p.x - cx) * vx + (p.y - 30 - cy) * vy) / (len * len), 0, 1), qx = cx + vx * tt, qy = cy + vy * tt; if (Math.hypot(p.x - qx, p.y - 30 - qy) < 32 && (c.tick = (c.tick || 0) - dt) <= 0) { c.tick = .3; p.hurt(this.dmg * .8, cx, cy, D_.pal); } } break; }
      }
      if (c.t >= c.dur) { this.cur = null; this.sq = 1; this.wait = this.beat(this.phase > 1 ? 1 : 2); if (this.phase === 3) this.wait *= .7; }
    }
    update(dt, g) {
      this.t += dt; this.flash = Math.max(0, this.flash - dt); const p = g.player; this.face = p.x > this.x ? 1 : -1; this.sq += (1 - this.sq) * Math.min(1, dt * 6);
      if (this.intro > 0) { this.intro -= dt; if (this.intro < 2.6 && !this.roar) { this.roar = true; sfx(this.def.snd || 'boss_roar', { vol: 1 }); SK.shake(.9); E.shockwave(this.x, this.y, { pal: this.def.pal, r: 420, life: 1 }); g.banner(this.name, 'Пробуждение'); const f = SK_AUD[this.def.music]; if (f) { g.musicForce = true; SK.Audio.playMusic(f.files[0], { fade: .8 }); } } return; }
      const d = U.dist(this.x, this.y, p.x, p.y); if (!this.cur) { this.wait -= dt; if (d > 360) { const a = U.ang(this.x, this.y, p.x, p.y); g.world.move(this, Math.cos(a) * 90 * dt, Math.sin(a) * 90 * dt, 30); } if (this.wait <= 0) { const pats = this.def.pat; this.pi = (this.pi + (this.phase > 1 && Math.random() < .35 ? 2 : 1)) % pats.length; this.start(pats[this.pi], g); } } else this.upd(dt, g);
      if (this.phase > 1) E.corruption(this.x + U.rnd(-60, 60), this.y - this.h * U.rnd(.1, .8), 1);
      FX.light(this.x, this.y - this.h * .5, 320 + this.phase * 40, FX.PAL[this.def.pal].l, .7);
      if (d < 60 && !p.dead) p.hurt(this.dmg * .5, this.x, this.y, this.def.pal);
    }
    draw(ctx, t) { const im = this.img; if (!im.ok) return; const h = this.h * (this.intro > 0 ? U.ease(U.clamp(1 - this.intro / 2.4, 0, 1)) * .3 + .7 : 1), w = h * im.naturalWidth / im.naturalHeight, bob = Math.sin(t * 1.6) * 8 + 14, face = this.face; const warn = this.cur && (this.cur.t < this.tau * 1.4) ? 1 : 0;
      ctx.save(); ctx.globalAlpha = .35; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x, this.y, w * .32, w * .1, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.translate(this.x, this.y - bob); ctx.scale((face > 0 ? -1 : 1) * (1 + (this.sq - 1) * .5), this.sq);
      if (this.flash > 0) drawFlash(ctx, im, -w / 2, -h, w, h, Math.min(1, this.flash * 9)); else { if (this.phase > 1) { ctx.shadowColor = FX.PAL[this.def.pal].l; ctx.shadowBlur = 20 + warn * 20; } ctx.drawImage(im, -w / 2, -h, w, h); } ctx.restore(); }
  }
  SK.Pickup = Pickup; SK.Proj = Proj; SK.Mob = Mob; SK.Boss = Boss;
})(window.SK);
