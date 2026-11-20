'use strict';
(function (SK) {
  const U = SK.U, D = SK.D, A = SK.A, FX = SK.FX, E = FX.E, In = SK.Input, TS = 64, TAU = Math.PI * 2;
  const sfx = (k, o) => SK.Audio.sfx(k, o);
  const PLACE = { torch: { h: 78, light: 300, col: '#ffb050', fire: 1 }, campfire: { h: 84, light: 380, col: '#ff9a40', fire: 1, r: 14 }, workbench: { h: 96, r: 30 }, furnace: { h: 108, r: 30, light: 120, col: '#ff7a30' }, anvil: { h: 74, r: 24 }, chest: { h: 76, r: 26 }, bed: { h: 96, r: 34 }, lantern: { h: 66, light: 340, col: '#ffd890' }, bomb: { h: 70, r: 22 } };
  SK.PLACE = PLACE;
  SK.Player = class Player {
    constructor(g, d) {
      this.g = g; d = d || {}; this.x = d.x || g.world.spawn.x; this.y = d.y || g.world.spawn.y; this.hp = d.hp || 100; this.maxhp = 100; this.inv = new SK.Inventory(); this.sel = d.sel || 0; this.armor = d.armor || null; this.dir = 'down'; this.faceR = true; this.t = 0; this.fr = 0;
      this.vx = this.vy = 0; this.kx = this.ky = 0; this.dashT = 0; this.dashCd = 0; this.iframes = 0; this.atkCd = 0; this.swing = 0; this.lunge = 0; this.buffs = {}; this.dead = false; this.kills = d.kills || 0; this.ghosts = []; this.stepT = 0; this.aim = 0; this.mouseT = 0; this.mineT = 0; this.mineSnd = 0; this.useCd = 0; this.flash = 0; this.respawnT = 0; this.moving = false; this.name = SK.settings.name; this.digT = 0; this.padAim = 0; this.dd = { x: 0, y: 1 };
      if (d.inv) this.inv.s = d.inv; else { this.inv.add('pick_wood'); this.inv.add('sword_wood'); this.inv.add('axe_wood'); this.inv.add('torch', 8); this.inv.add('bread', 4); this.inv.add('p_heal', 2); }
      this.sheets = { down: A.img('assets/player/run_down.webp'), up: A.img('assets/player/run_up.webp'), side: A.img('assets/player/run_side.webp') };
    }
    get def() { let d = this.armor ? D.items[this.armor].def : 0; if (this.buffs.skin) d += 18; return d; }
    item() { const s = this.inv.s[this.sel]; return s ? D.items[s.id] : null; }
    heal(n) { this.hp = Math.min(this.maxhp, this.hp + n); E.heal(this.x, this.y); this.g.dmgText(this.x, this.y - 110, '+' + Math.round(n), '#8aff70'); }
    hurt(dmg, sx, sy, pal) {
      if (this.iframes > 0 || this.dead || this.dashT > 0) return false; const d = this.def; let k = 1 - d / (d + 60); if (this.buffs.fireres && pal === 'fire') k *= .4; dmg = Math.max(1, Math.round(dmg * k)); this.hp -= dmg; this.iframes = .85; this.flash = .2; const a = U.ang(sx, sy, this.x, this.y); this.kx += Math.cos(a) * 320; this.ky += Math.sin(a) * 320 * .7;
      SK.shake(.5); SK.hitstop(90); E.hit(this.x, this.y - 50, { pal: pal || 'blood', ang: a }); E.blood(this.x, this.y - 50, { n: 12, ang: a }); sfx('player_hurt', { vol: .9 }); this.g.dmgText(this.x, this.y - 100, dmg, '#ff5a5a'); this.g.hurtFx = 1;
      if (this.hp <= 0) this.die(); return true;
    }
    die() { this.dead = true; this.hp = 0; this.respawnT = 3.2; SK.hitstop(250); SK.shake(1); E.explosion(this.x, this.y - 40, { pal: 'blood', r: 90 }); sfx('death', { vol: 1 }); this.g.onPlayerDeath(); }
    respawn() { this.dead = false; this.hp = this.maxhp * .6; this.x = this.g.world.spawn.x; this.y = this.g.world.spawn.y; this.iframes = 2; this.kx = this.ky = 0; E.magicCircle(this.x, this.y, { pal: 'holy', r: 120, life: 1 }); SK.cam.x = this.x; SK.cam.y = this.y; }
    update(dt) {
      const g = this.g, w = g.world; this.t += dt; this.iframes = Math.max(0, this.iframes - dt); this.flash = Math.max(0, this.flash - dt); this.atkCd -= dt; this.dashCd -= dt; this.useCd -= dt; this.swing = Math.max(0, this.swing - dt); this.lunge = Math.max(0, this.lunge - dt * 5); for (const b in this.buffs) { this.buffs[b] -= dt; if (this.buffs[b] <= 0) delete this.buffs[b]; }
      if (this.dead) { this.respawnT -= dt; if (this.respawnT <= 0) this.respawn(); return; }
      const M = In.mouse, cam = SK.cam; if (M.x !== this._mx || M.y !== this._my) { this.mouseT = 3; this._mx = M.x; this._my = M.y; } this.mouseT -= dt; if (M.b[0] || M.b[2]) this.mouseT = 3;
      const wx = cam.x + (M.x - innerWidth / 2) / cam.zoom, wy = cam.y + (M.y - innerHeight / 2) / cam.zoom; this.mx = wx; this.my = wy;
      const px = this.x, py = this.y - 40; const padA = !!(In.ax2 || In.ay2); if (padA) { this.aim = Math.atan2(In.ay2, In.ax2); this.mouseT = 0; this.padAim = 2; } else if (this.mouseT > 0 && !g.ui.open) this.aim = Math.atan2(wy - py, wx - px); this.padAim = Math.max(0, this.padAim - dt);
      const useMouse = this.mouseT > 0 && !padA;
      let ax = In.ax, ay = In.ay; if (g.ui.open) { ax = ay = 0; }
      const sp = 215 * (1 + (this.buffs.speed ? .4 : 0)) * (this.swing > 0 ? .75 : 1);
      if (this.dashT > 0) { this.dashT -= dt; const dd = this.dd; w.move(this, dd.x * 760 * dt, dd.y * 640 * dt, 14); this.ghosts.push({ x: this.x, y: this.y, fr: this.fr, dir: this.dir, r: this.faceR, a: .5 }); E.dust(this.x, this.y, 1, [140, 130, 120]); }
      else { this.vx += (ax * sp - this.vx) * Math.min(1, dt * 14); this.vy += (ay * sp * .8 - this.vy) * Math.min(1, dt * 14); w.move(this, this.vx * dt, this.vy * dt, 14); }
      if (Math.abs(this.kx) + Math.abs(this.ky) > 5) { w.move(this, this.kx * dt, this.ky * dt, 14); this.kx *= Math.exp(-10 * dt); this.ky *= Math.exp(-10 * dt); }
      this.moving = Math.hypot(this.vx, this.vy) > 24 && this.dashT <= 0;
      if (this.moving) { if (Math.abs(ax) > Math.abs(ay) * .9) { this.dir = 'side'; this.faceR = ax > 0; } else if (ay) this.dir = ay > 0 ? 'down' : 'up'; else if (ax) { this.dir = 'side'; this.faceR = ax > 0; } }
      if (this.swing > 0 || (useMouse && (In.down('attack') || In.down('place')))) { const c = Math.cos(this.aim), s = Math.sin(this.aim); if (Math.abs(c) > Math.abs(s)) { this.dir = 'side'; this.faceR = c > 0; } else this.dir = s > 0 ? 'down' : 'up'; }
      if (this.moving) { this.fr += dt * 24 * U.clamp(Math.hypot(this.vx, this.vy) / 215, .5, 1.5); this.stepT -= dt; if (this.stepT <= 0) { this.stepT = .3; const tl = w.tile(this.x / TS | 0, this.y / TS | 0); sfx('footsteps_' + (tl.step || 'dirt'), { vol: .32, pitch: .1 }); if (Math.random() < .5) E.dust(this.x, this.y, 1, tl.step === 'snow' ? [230, 235, 245] : tl.step === 'sand' ? [220, 190, 130] : [130, 115, 90]); } } else this.fr = 0;
      if (In.pressed('dash') && this.dashCd <= 0 && !g.ui.open) { this.dashT = .17; this.dashCd = .75; this.iframes = Math.max(this.iframes, .26); let dx = ax, dy = ay; if (!dx && !dy) { if (useMouse) { dx = Math.cos(this.aim); dy = Math.sin(this.aim); } else { dx = this.dir === 'side' ? (this.faceR ? 1 : -1) : 0; dy = this.dir === 'down' ? 1 : this.dir === 'up' ? -1 : 0; } } const l = Math.hypot(dx, dy) || 1; this.dd = { x: dx / l, y: dy / l }; sfx('cloth_rustle', { vol: .7 }); E.shockwave(this.x, this.y, { pal: 'wind', r: 50, life: .3 }); SK.shake(.1); }
      for (let i = this.ghosts.length - 1; i >= 0; i--) { this.ghosts[i].a -= dt * 2.6; if (this.ghosts[i].a <= 0) this.ghosts.splice(i, 1); }
      for (let i = 1; i <= 9; i++) if (In.pressed('slot' + i)) this.sel = i - 1;
      if (!g.ui.open && !g.paused) {
        if (In.down('attack')) this.useAttack(dt);
        if (In.pressed('place')) this.usePlace(); else if (In.down('place') && this.useCd <= 0 && this.item() && this.item().type === 'block') this.usePlace();
        if (In.down('interact')) this.digFloor(dt); else this.digT = 0;
        if (In.pressed('interact')) g.interact();
      }
      if (this.buffs.night) FX.light(this.x, this.y - 30, 520, '#a0d0ff', .5);
      FX.light(this.x, this.y - 40, 190, '#ffe0b0', .55);
      const it = this.item(); if (it && it.type === 'place' && PLACE[it.prop] && PLACE[it.prop].light) FX.light(this.x + 20, this.y - 50, 190, PLACE[it.prop].col, .6);
    }
    target() {
      const w = this.g.world; let x, y; if (this.mouseT > 0 && !(In.ax2 || In.ay2)) { x = this.mx; y = this.my; } else if (this.padAim > 0) { x = this.x + Math.cos(this.aim) * 54; y = this.y - 20 + Math.sin(this.aim) * 54; } else { x = this.x + (this.dir === 'side' ? (this.faceR ? 54 : -54) : 0); y = this.y - 14 + (this.dir === 'down' ? 54 : this.dir === 'up' ? -54 : 0); }
      let tx = Math.floor(x / TS), ty = Math.floor(y / TS); const t = w.tile(tx, ty); if (!t.solid) { const t2 = w.tile(tx, ty + 1); if (t2.solid && y - ty * TS > TS - SK.RISE * .6) ty++; }
      const cx = tx * TS + TS / 2, cy = ty * TS + TS / 2; if (U.dist(this.x, this.y - 10, cx, cy) > TS * 3.4) return null; return { tx, ty, x: cx, y: cy };
    }
    toolFor(kind) { const it = this.item(); return it && it.tool === kind ? it : null; }
    useAttack(dt) {
      const g = this.g, w = g.world, it = this.item(); const weapon = it && it.type === 'weapon' ? it : null, tool = it && it.type === 'tool' ? it : null; const reach = weapon ? weapon.range : tool ? 78 : 64;
      const pw = (this.buffs.power ? 1.4 : 1); const dmgBase = (weapon ? weapon.dmg : tool ? tool.dmg : 6) * pw; const cd = weapon ? weapon.cd : .45;
      if (weapon && weapon.cast) { if (this.atkCd > 0) return; this.atkCd = cd; this.swing = .2; const a = this.aim, sx = this.x, sy = this.y - 52; const pal = weapon.pal; sfx(weapon.cast === 'arrow' ? 'bow_shot' : 'magic_spell', { vol: .7 });
        g.projs.push(new SK.Proj({ owner: 'player', x: sx + Math.cos(a) * 24, y: sy + Math.sin(a) * 24, vx: Math.cos(a) * 640, vy: Math.sin(a) * 640, dmg: dmgBase, pal, r: weapon.cast === 'arrow' ? 6 : 13, type: weapon.cast === 'arrow' ? 'arrow' : 'bolt', life: 1.6, boom: weapon.cast === 'bolt' ? 46 : 0 })); FX.burst(sx + Math.cos(a) * 28, sy + Math.sin(a) * 28, pal, 8, { ang: a, s1: 260 }); this.wear(1); return; }
      const px = this.x, py = this.y - 42, a = this.aim; let mobTarget = false;
      for (const m of g.mobs) { if (m.dead || (m.ai === 'villager')) continue; const d = U.dist(px, py, m.x, m.y - m.h * .4); if (d < reach + m.h * .3) { const da = Math.abs(((Math.atan2(m.y - m.h * .4 - py, m.x - px) - a + Math.PI * 3) % TAU) - Math.PI); if (da < 1.2 || d < 46) { mobTarget = true; break; } } }
      const T = this.target(); const tileSolid = T && w.tile(T.tx, T.ty).solid; let prop = null;
      if (!mobTarget) { let best = 1e9; for (const p of w.propsIn(px - 140, py - 140, px + 140, py + 140)) { if (p.dead || p.type === 'struct' || !p.hp) continue; const d = U.dist(px, this.y, p.x, p.y), da = Math.abs(((Math.atan2(p.y - py, p.x - px) - a + Math.PI * 3) % TAU) - Math.PI); if (d < reach + 40 && (da < 1.1 || d < 60) && d < best) { best = d; prop = p; } } }
      if (!mobTarget && !prop && tileSolid) return this.mine(dt, T);
      if (!mobTarget && !prop && T && tool && tool.tool === 'shovel' && w.tile(T.tx, T.ty).hard > 0 && !w.tile(T.tx, T.ty).solid) return this.mine(dt, T, true);
      if (this.atkCd > 0) return; this.atkCd = cd; this.swing = .2; this.lunge = 1; const cx = Math.cos(a), sy = Math.sin(a); this.kx += cx * 150; this.ky += sy * 120;
      E.slash(px + cx * 24, py + sy * 24, { ang: a, len: Math.min(reach, 96), pal: weapon ? weapon.pal : 'wind', w: weapon ? 1 : .6 }); sfx(weapon ? 'sword_swing' : 'cutting_grass', { vol: .7, pitch: .1 });
      let hit = 0;
      for (const m of g.mobs) { if (m.dead) continue; const mx = m.x, my = m.y - m.h * .4, d = U.dist(px, py, mx, my); if (d > reach + m.h * (m.isBoss ? .45 : .3)) continue; const da = Math.abs(((Math.atan2(my - py, mx - px) - a + Math.PI * 3) % TAU) - Math.PI); if (da > 1.25 && d > 50) continue; const crit = Math.random() < .12; m.hurt(dmgBase * (crit ? 1.7 : 1) * U.rnd(.9, 1.1), px, py, weapon ? weapon.pal : 'holy', g, { crit }); if (weapon && weapon.burn) E.fire(m.x, m.y - 20, { n: 4 }); if (weapon && weapon.chain) E.lightning(px, py, m.x, m.y - m.h * .4, { pal: 'bolt', quiet: true, life: .16 }); hit++; }
      if (hit) { sfx(weapon ? 'sword_hit' : 'hammer_hit', { vol: .8 }); SK.hitstop(55 + hit * 10); SK.shake(.16); this.wear(1); }
      else if (prop) this.hitProp(prop, tool || weapon);
    }
    hitProp(p, it) {
      const g = this.g; const k = it && it.tool; let dm = 1; if (p.type === 'tree') dm = k === 'axe' ? 2.6 * (it.spd / 1.5) : .7; else if (p.type === 'rock') dm = k === 'pick' ? 2.4 * (it.spd / 1.5) : .5; else dm = 2; dm *= this.buffs.haste ? 1.5 : 1; p.hp -= dm; p.sh = .3;
      const col = p.type === 'tree' ? '#7a5a38' : p.type === 'rock' ? '#8a8a90' : '#4a8a3a'; E.debris(p.x, p.y - 50, col, 5); E.dust(p.x, p.y, 3); sfx(p.type === 'tree' ? 'axe_chop_wood' : p.type === 'rock' ? 'pickaxe_stone' : 'cutting_grass', { x: p.x, y: p.y, vol: .8 }); SK.shake(.06); if (it) this.wear(1);
      if (p.hp <= 0) { g.world.removeProp(p); g.world.dead.add(p.id); sfx(p.type === 'tree' ? 'tree_fall' : 'block_break', { x: p.x, y: p.y }); E.debris(p.x, p.y - 40, col, 14); E.dust(p.x, p.y, 8); SK.shake(.2); const dr = SK.DROPS[p.drop] || [1, 2]; g.drop(p.x, p.y - 20, p.drop, U.rint(dr[0], dr[1])); if (p.type === 'tree' && Math.random() < .35) g.drop(p.x, p.y - 20, 'stick', U.rint(1, 2)); if (p.type === 'tree' && Math.random() < .12) g.drop(p.x, p.y - 20, 'apple', 1); if (p.type === 'rock') g.drop(p.x, p.y - 20, 'stone', U.rint(0, 2));
        if (p.type === 'tree' && !p.stump && /береза|дерево/.test(SK_MAN.obj[p.k].name)) { const st = A.byName('obj', 'пень'); if (st && Math.random() < .8) g.world.addProp({ k: st, x: p.x, y: p.y, h: 56, r: 12, hp: 2, type: 'tree', drop: 'wood', stump: 1 }); } }
    }
    mine(dt, T, floor) {
      const g = this.g, w = g.world, tool = this.item() && this.item().type === 'tool' ? this.item() : null; const t = w.tile(T.tx, T.ty); const power = (tool && (tool.tool === 'pick' || (floor && tool.tool === 'shovel')) ? tool.spd : tool ? .8 : .6) * (this.buffs.haste ? 1.6 : 1); const tier = tool && tool.tool === 'pick' ? tool.tier : 0;
      this.mineSnd -= dt; this.swing = .12; this.dir = Math.abs(T.x - this.x) > Math.abs(T.y - this.y) ? 'side' : (T.y > this.y ? 'down' : 'up'); if (this.dir === 'side') this.faceR = T.x > this.x;
      const r = w.hitTile(T.tx, T.ty, power * dt, floor ? 9 : tier);
      if (r && r.weak) { if (this.mineSnd <= 0) { this.mineSnd = .5; sfx('item_break', { vol: .5 }); g.toast('Нужен инструмент лучше (' + t.name + ')', 1); E.hit(T.x, T.y - 20, { pal: 'wind' }); } return; }
      if (this.mineSnd <= 0 && r) { this.mineSnd = .26; const col = t.id.startsWith('ore') ? '#caa860' : t.solid ? '#8a8a90' : '#7a5a38'; E.debris(T.x, T.y - 24, col, 3); sfx(t.snd === 'ore' ? 'mining_ore' : t.snd === 'block_break' ? 'pickaxe_stone' : t.snd === 'dig_sand' ? 'digging_sand' : t.snd === 'dig_dirt' ? 'digging_dirt' : t.snd === 'wood_place' ? 'saw_wood' : t.snd, { vol: .7 }); E.dust(T.x, T.y, 1); SK.shake(.03); if (tool) this.wear(.2); }
      if (r && r.broke) { const col = t.id.startsWith('ore') ? '#caa860' : '#8a8a90'; E.debris(T.x, T.y - 24, col, 16); E.dust(T.x, T.y, 8); SK.shake(.18); sfx(t.solid ? 'block_break' : 'digging_dirt', { vol: .9 }); if (t.drop) g.drop(T.x, T.y, t.drop, t.id.startsWith('ore') ? U.rint(1, 3) : 1); if (t.id.startsWith('ore')) { E.hit(T.x, T.y - 20, { pal: 'holy' }); g.drop(T.x, T.y, 'stone', 1); } }
    }
    digFloor(dt) {
      const g = this.g, w = g.world; let tx = Math.floor(this.x / TS), ty = Math.floor((this.y - 4) / TS); const T = this.target(); if (this.dir !== 'down' && T) { tx = T.tx; ty = T.ty; } const tile = w.tile(tx, ty);
      if (tile.solid) { if (T) this.mine(dt, { tx, ty, x: tx * TS + 32, y: ty * TS + 32 }); return; }
      const tool = this.toolFor('shovel'); this.swing = .12; const p = (tool ? tool.spd : .9) * (this.buffs.haste ? 1.6 : 1); this.digT -= dt; const r = w.hitTile(tx, ty, p * dt, 9);
      if (this.digT <= 0 && r) { this.digT = .25; E.debris(tx * TS + 32, ty * TS + 32, '#7a5a38', 3); sfx(tile.snd, { vol: .6 }); E.dust(tx * TS + 32, ty * TS + 40, 1); }
      if (r && r.broke) { E.debris(tx * TS + 32, ty * TS + 32, '#7a5a38', 12); E.dust(tx * TS + 32, ty * TS + 40, 6); SK.shake(.08); if (tile.drop) g.drop(tx * TS + 32, ty * TS + 32, tile.drop, 1); if (tool) this.wear(1); }
    }
    wear(n) { const s = this.inv.s[this.sel]; if (!s) return; const it = D.items[s.id]; if (!it.dur) return; s.d -= n; if (s.d <= 0) { this.inv.s[this.sel] = null; sfx('item_break', { vol: .9 }); E.debris(this.x, this.y - 40, '#aaaaaa', 10); this.g.toast(it.name + ' сломан', 1); } }
    usePlace() {
      const g = this.g, w = g.world, s = this.inv.s[this.sel]; if (!s || this.useCd > 0) return; const it = D.items[s.id]; this.useCd = .22;
      if (it.type === 'block') { const T = this.target(); if (!T) return; const t = w.tile(T.tx, T.ty); if (t.solid) return; if (U.dist(this.x, this.y - 10, T.x, T.y) < 44) { g.toast('Слишком близко', 1); return; } w.setTile(T.tx, T.ty, it.tile); s.n--; if (s.n <= 0) this.inv.s[this.sel] = null; sfx(w.tile(T.tx, T.ty).snd === 'wood_place' ? 'wood_place' : 'stone_place', { vol: .8 }); E.dust(T.x, T.y, 5); E.debris(T.x, T.y - 20, '#9a9a9a', 4); SK.shake(.05); }
      else if (it.type === 'place') { const T = this.target(); let x, y; if (T) { x = T.x; y = T.y + TS / 2 - 6; } else { x = this.x + (this.faceR ? 60 : -60); y = this.y; } const sp = PLACE[it.prop]; if (!sp) return; if (w.tile(x / TS | 0, (y - 8) / TS | 0).solid) return; const k = A.byName('obj', it.icon); const pr = w.addProp({ k, x, y, h: sp.h, r: sp.r || 0, hp: 4, type: 'place', kind: it.prop, drop: s.id, ph: U.rnd(0, 6) }); s.n--; if (s.n <= 0) this.inv.s[this.sel] = null; sfx('wood_place', { vol: .8 }); E.dust(x, y, 6); E.shockwave(x, y, { pal: 'earth', r: 40, life: .3 }); if (it.prop === 'bomb') { pr.fuse = 3; sfx('fuse_burning', { x, y }); } }
      else if (it.type === 'food') { if (it.heal > 0) this.heal(it.heal); else { this.hp = Math.max(1, this.hp + it.heal); E.blood(this.x, this.y - 50, { n: 4 }); } sfx('eating_crunch', { vol: .8 }); s.n--; if (s.n <= 0) this.inv.s[this.sel] = null; g.toast(it.name); }
      else if (it.type === 'potion') { if (it.heal) this.heal(it.heal); if (it.buff) this.buffs[it.buff] = it.t; E.potion(this.x, this.y - 30, { wind: 'wind', blood: 'blood', fire: 'fire', earth: 'earth', holy: 'holy', bolt: 'bolt', corrupt: 'corrupt' }[it.fx] || 'poison'); sfx('potion_drink', { vol: .9 }); s.n--; if (s.n <= 0) this.inv.s[this.sel] = null; g.toast(it.name + (it.buff ? ' (' + it.t + ' с)' : '')); }
      else if (it.type === 'armor') { const old = this.armor; this.armor = s.id; this.inv.s[this.sel] = old ? { id: old, n: 1, d: 0 } : null; sfx('ekipirovka_broni_udar_po_brone', { vol: .9 }); E.shockwave(this.x, this.y, { pal: 'holy', r: 70, life: .4 }); g.toast('Надето: ' + it.name); }
    }
    draw(ctx, t) {
      const meta = SK_PLAYER[this.dir], sh = this.sheets[this.dir]; if (!sh || !sh.ok) return; const H = 118, sc = H / meta.fh, fw = meta.fw * sc, fh = H; const moving = this.moving || this.dashT > 0, f = moving ? Math.floor(this.fr) % meta.n : 0;
      const bob = moving ? 0 : Math.sin(t * 2.2) * 1.6, flip = this.dir === 'side' && !this.faceR; const lx = this.swing > 0 ? Math.cos(this.aim) * 10 * this.lunge : 0;
      for (const gh of this.ghosts) { const m2 = SK_PLAYER[gh.dir]; ctx.save(); ctx.globalAlpha = gh.a * .55; ctx.globalCompositeOperation = 'lighter'; ctx.translate(gh.x, gh.y); if (gh.dir === 'side' && !gh.r) ctx.scale(-1, 1); ctx.drawImage(this.sheets[gh.dir], (Math.floor(gh.fr) % m2.n) * m2.fw, 0, m2.fw, m2.fh, -m2.fw * (H / m2.fh) / 2, -H, m2.fw * (H / m2.fh), H); ctx.restore(); }
      ctx.save(); ctx.globalAlpha = .32; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 26, 9, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1;
      if (this.iframes > 0 && this.dashT <= 0 && Math.floor(t * 28) % 2 === 0) ctx.globalAlpha = .45; if (this.dead) ctx.globalAlpha = Math.max(0, this.respawnT / 3.2 * .4);
      ctx.translate(this.x + lx, this.y - bob); if (flip) ctx.scale(-1, 1); ctx.rotate(this.moving ? Math.sin(this.fr * .8) * .03 : 0); if (this.swing > 0) ctx.scale(1 + this.lunge * .08, 1 - this.lunge * .06);
      const dx = f * meta.fw; ctx.drawImage(sh, dx, 0, meta.fw, meta.fh, -fw / 2, -fh, fw, fh);
      if (this.flash > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, this.flash * 3); ctx.drawImage(sh, dx, 0, meta.fw, meta.fh, -fw / 2, -fh, fw, fh); }
      ctx.restore();
      const it = this.item(); if (it && (it.type === 'weapon' || it.type === 'tool') && !this.dead) { const src = D.iconSrc(it.id), im = src ? A.img(src) : null; if (im && im.ok) { const side = this.dir === 'side', dir = this.faceR ? 1 : -1; let hx = this.x + (side ? 22 * dir : this.dir === 'up' ? -16 : 16), hy = this.y - (this.dir === 'up' ? 56 : 44); const rot = this.swing > 0 ? Math.sin((1 - this.swing / .2) * 3.1) * 1.6 - .8 : -.6 + Math.sin(t * 2) * .05; if (this.swing > 0) { const a = this.aim; hx += Math.cos(a) * 18 * this.lunge; hy += Math.sin(a) * 18 * this.lunge; } ctx.save(); ctx.translate(hx, hy); ctx.rotate(rot * (side ? dir : 1)); if (this.dir === 'up') ctx.globalAlpha = .9; const s = it.type === 'weapon' ? 62 : 54; ctx.drawImage(im, -s * .2, -s * .85, s, s * im.naturalHeight / im.naturalWidth); ctx.restore(); } }
    }
  };
})(window.SK);
