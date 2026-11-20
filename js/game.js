'use strict';
(function (SK) {
  const U = SK.U, D = SK.D, A = SK.A, FX = SK.FX, E = FX.E, In = SK.Input, TS = 64, TAU = Math.PI * 2;
  const sfx = (k, o) => SK.Audio.sfx(k, o);
  const $ = id => document.getElementById(id);
  const G = SK.game = {
    running: false, paused: false, ui: { open: false }, mobs: [], projs: [], pickups: [], texts: [], boss: null, world: null, player: null, hurtFx: 0, banners: [], toasts: [], spawnT: 0, saveT: 0, curBiome: '', t: 0,
    start(world, pdata, meta) {
      G.world = world; G.meta = meta; G.mobs = []; G.projs = []; G.pickups = []; G.texts = []; G.boss = null; G.ui.open = false; G.paused = false; FX.P.length = 0; FX.S.length = 0; G.musicForce = null; G.summonT = 0;
      G.player = new SK.Player(G, pdata); SK.cam.x = G.player.x; SK.cam.y = G.player.y; G.exp = new Uint8Array(world.w * world.h); G.buildMini(); G.running = true; G.curBiome = ''; G.t = 0; G.hpTrail = G.player.hp;
      G.initHud(); $('hud').style.display = 'block'; $('inv').style.display = 'none'; $('pause').style.display = 'none'; G.updateHud(0); for (let i = 0; i < 8; i++) G.spawnMob(true); G.toast('Добро пожаловать в Скверну', 0, 4);
      SK.Audio.preload(['sword_swing', 'sword_hit', 'footsteps_grass', 'footsteps_sand', 'footsteps_snow', 'footsteps_dirt', 'block_break', 'digging_dirt', 'axe_chop_wood', 'pickaxe_stone', 'player_hurt', 'item_pickup', 'blood_squelch', 'cloth_rustle']);
    },
    stop() { G.running = false; $('hud').style.display = 'none'; SK.Audio.stopAmbience(); G.closeUi(); G.boss = null; },
    isNight() { const t = G.world.time; return t > .58 && t < .93; },
    toast(m, warn, t = 2.4) { G.toasts.push({ m, warn, t }); if (G.toasts.length > 5) G.toasts.shift(); },
    banner(a, b) { G.banners.push({ a, b, t: 3.4 }); },
    dmgText(x, y, v, c) { G.texts.push({ x, y, v, c: c || '#fff', t: .9, vy: -70 - U.rnd(0, 30), vx: U.rnd(-20, 20) }); },
    drop(x, y, id, n) { if (!n || !D.items[id]) return; G.pickups.push(new SK.Pickup(x, y, id, n)); },
    onPlayerDeath() { G.toast('Вы погибли…', 1, 3); if (G.boss) G.resetBoss(); },
    spawnList(b) { G._sl = G._sl || {}; if (G._sl[b]) return G._sl[b]; const names = D.spawn[b] || [], out = []; for (const k in SK_MAN.mobs) { const n = SK_MAN.mobs[k].name.toLowerCase(); if (names.some(s => n.includes(s))) out.push(k); } return G._sl[b] = out; },
    spawnMob(initial) {
      const p = G.player, w = G.world; for (let tr = 0; tr < 12; tr++) { const a = U.rnd(0, TAU), d = initial ? U.rnd(350, 1100) : U.rnd(780, 1250), x = p.x + Math.cos(a) * d, y = p.y + Math.sin(a) * d * .8; if (x < 200 || y < 200 || x > (w.w - 3) * TS || y > (w.h - 3) * TS) continue; if (w.tile(x / TS | 0, y / TS | 0).solid) continue; const b = w.biomeAt(x, y), list = G.spawnList(b); if (!list.length) continue;
        let slug = U.pick(list); if (!G.isNight()) { for (let k = 0; k < 2; k++) { const nm = SK_MAN.mobs[slug].name.toLowerCase(); if (!/кролик|овца|свинья|курица|олень|енот|еж|жаба|панда|сурикат|грызун|козел|фея|пчела|крестьян|житель/.test(nm) && Math.random() < .5) slug = U.pick(list); } }
        G.mobs.push(new SK.Mob(slug, x, y, G)); return; }
    },
    interact() {
      const p = G.player, w = G.world; for (const a of w.altars) { if (U.dist(p.x, p.y, a.x, a.y) < 230) { if (w.bossDone[a.boss]) { G.toast('Алтарь молчит: хранитель повержен'); return; } if (G.boss || G.summonT > 0) return; G.summon(a); return; } }
      for (const pr of w.propsIn(p.x - 120, p.y - 120, p.x + 120, p.y + 80)) { if (pr.dead || pr.type !== 'place') continue; if (U.dist(p.x, p.y, pr.x, pr.y) > 110) continue; if (pr.kind === 'bed') { G.sleep(); return; } if (['workbench', 'furnace', 'anvil', 'campfire'].includes(pr.kind)) { G.openUi(); return; } if (pr.kind === 'chest') { G.toast('Сундук: хранилище появится позже'); return; } }
      G.toast('Здесь нечего делать');
    },
    sleep() { if (!G.isNight()) { G.toast('Спать можно только ночью'); return; } G.world.time = .02; G.world.day++; G.player.hp = G.player.maxhp; E.heal(G.player.x, G.player.y); G.toast('Вы проспали до рассвета'); sfx('success', { vol: .6 }); },
    summon(a) { const id = a.boss; E.magicCircle(a.x, a.y, { pal: D.bosses[id].pal, r: 240, life: 3.2 }); sfx('rune_activate', { vol: 1 }); sfx('boss_stinger', { vol: .9 }); SK.shake(.4); G.toast('Алтарь пробуждается…', 0, 3); G.summonT = 3; G.summonArgs = a; },
    resetBoss() { if (!G.boss) return; G.boss = null; G.mobs = G.mobs.filter(m => !m.minion && !m.isBoss); G.projs = G.projs.filter(p => p.owner !== 'mob'); G.musicForce = null; G.banner('Хранитель ждёт', ''); },
    bossDie(b) {
      G.world.bossDone[b.id] = true; G.boss = null; SK.time.scale = .25; setTimeout(() => SK.time.scale = 1, 1700); sfx('boss_death', { vol: 1 }); SK.shake(1); SK.hitstop(300);
      for (let i = 0; i < 9; i++) setTimeout(() => { if (G.running) { E.explosion(b.x + U.rnd(-120, 120), b.y - U.rnd(40, b.h), { pal: b.def.pal, r: 90 }); sfx('explosion', { vol: .7 }); } }, i * 170); setTimeout(() => { if (G.running) { E.pillar(b.x, b.y, { pal: 'holy', h: 700, w: 160, life: 2 }); E.shockwave(b.x, b.y, { pal: 'holy', r: 600, life: 1.4 }); } }, 1500);
      const loot = ['shard', 'shard', 'shard', 'core_fire', 'core_cold', 'core_life', 'core_bolt', 'core_light', 'titan_ing', 'gold_ing', 'iron_ing', 'iron_ing', 'p_heal', 'p_heal', 'sword_iron', 'pick_iron']; for (let i = 0; i < 10; i++) setTimeout(() => G.running && G.drop(b.x + U.rnd(-50, 50), b.y, U.pick(loot), 1 + (Math.random() < .4 ? 1 : 0)), 1800 + i * 90);
      G.banner('ПОВЕРЖЕН', b.name); G.mobs = G.mobs.filter(m => !m.minion); setTimeout(() => { G.musicForce = null; }, 4000); G.player.heal(40);
    },
    update(dt) {
      const w = G.world, p = G.player; G.t += dt; In.update();
      if (In.pressed('pause')) { if (G.ui.open) G.closeUi(); else G.pause(!G.paused); }
      if (In.pressed('inv') || In.pressed('craft')) { if (G.ui.open) G.closeUi(); else if (!G.paused) G.openUi(); }
      if (G.paused) return;
      if (SK.time.freeze > 0) { SK.time.freeze -= dt; dt *= .03; }
      dt *= SK.time.scale; w.time += dt / 540; if (w.time >= 1) { w.time -= 1; w.day++; G.toast('Наступил день ' + w.day); }
      p.update(dt);
      if (G.summonT > 0) { G.summonT -= dt; if (G.summonT <= 0) { const a = G.summonArgs, def = D.bosses[a.boss]; const b = new SK.Boss(a.boss, a.x, a.y - 80, G); G.boss = b; G.mobs.push(b); E.explosion(a.x, a.y - 60, { pal: def.pal, r: 140 }); E.pillar(a.x, a.y, { pal: def.pal, h: 600, w: 120, life: 1.2 }); SK.shake(.9); } }
      for (const m of G.mobs) { if (m.dead) continue; if (U.dist(m.x, m.y, p.x, p.y) < 1700 || m.isBoss) m.update(dt, G); }
      G.mobs = G.mobs.filter(m => { if (m.dead) return false; if (!m.isBoss && !m.minion && U.dist(m.x, m.y, p.x, p.y) > 2300) return false; return true; });
      for (const q of G.projs) q.update(dt, G); G.projs = G.projs.filter(q => !q.dead);
      for (const q of G.pickups) q.update(dt, G); G.pickups = G.pickups.filter(q => !q.dead);
      for (const t of G.texts) { t.t -= dt; t.x += t.vx * dt; t.y += t.vy * dt; t.vy += 90 * dt; } G.texts = G.texts.filter(t => t.t > 0);
      for (const t of G.toasts) t.t -= dt; G.toasts = G.toasts.filter(t => t.t > 0); for (const b of G.banners) b.t -= dt; G.banners = G.banners.filter(b => b.t > 0);
      G.updateProps(dt);
      G.spawnT -= dt; if (G.spawnT <= 0) { G.spawnT = G.isNight() ? .9 : 1.6; const cap = G.isNight() ? 24 : 15; if (G.mobs.filter(m => !m.isBoss).length < cap) G.spawnMob(); }
      if (G.boss && (p.dead || U.dist(G.boss.x, G.boss.y, p.x, p.y) > 1500)) G.resetBoss();
      FX.update(dt);
      const cam = SK.cam, ax = Math.cos(p.aim) * (p.mouseT > 0 ? 36 : 0), ay = Math.sin(p.aim) * (p.mouseT > 0 ? 24 : 0); const tx = p.x + ax, ty = p.y - 50 + ay; const k = Math.min(1, dt * 5); cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
      if (G.boss && G.boss.intro <= 0) { const bx = (G.boss.x + p.x) / 2, by = (G.boss.y - 60 + p.y) / 2; cam.x += (bx - cam.x) * k * .35; cam.y += (by - cam.y) * k * .35; }
      cam.trauma = Math.max(0, cam.trauma - dt * 1.7); const sh = cam.trauma * cam.trauma * 22; cam.ox = (Math.random() - .5) * sh; cam.oy = (Math.random() - .5) * sh;
      const z = U.clamp(innerHeight / (TS * 11.5), .55, 1.7) * SK.settings.gfx.fov * (G.boss && G.boss.intro <= 0 ? .88 : 1); cam.zoom += (z - cam.zoom) * Math.min(1, dt * 3);
      const bn = w.biomeAt(p.x, p.y); if (bn !== G.curBiome) { G.curBiome = bn; G.banner(D.biomes[bn].name, 'День ' + w.day); }
      G.audioT = (G.audioT || 0) - dt; if (G.audioT <= 0) { G.audioT = .4; G.updateAudio(bn); }
      SK.Audio.setAmbience(G.ambMap || {});
      G.exploreT = (G.exploreT || 0) - dt; if (G.exploreT <= 0) { G.exploreT = .3; G.explore(); }
      G.saveT += dt; if (G.saveT > 60) { G.saveT = 0; G.save(); }
      G.hurtFx = Math.max(0, G.hurtFx - dt * 2.2); G.hpTrail += (p.hp - G.hpTrail) * Math.min(1, dt * 1.6);
    },
    updateAudio(bn) {
      const b = D.biomes[bn], night = G.isNight(), boss = G.boss; const m = {}; for (const k in b.amb) m[k] = b.amb[k] * (boss ? .15 : 1); if (night) { m.forest_night = bn === 'forest' ? .5 : 0; for (const k in m) if (k !== 'forest_night') m[k] *= .6; } for (const k of Object.keys(SK.Audio.amb)) if (!(k in m)) m[k] = 0; G.ambMap = m;
      if (boss || G.musicForce) return; const f = window.SK_AUD && SK_AUD[b.music]; if (f) SK.Audio.playMusic(f.files[0], { vol: .75, fade: 2.5 });
    },
    updateProps(dt) {
      const p = G.player, w = G.world, t = G.t; for (const pr of w.propsIn(p.x - 1100, p.y - 800, p.x + 1100, p.y + 800)) { if (pr.dead || pr.type !== 'place') continue; const sp = SK.PLACE[pr.kind]; if (!sp) continue; const fl = .85 + Math.sin(t * 13 + pr.ph) * .1 + Math.sin(t * 7.3 + pr.ph * 2) * .1;
        if (sp.fire) { E.fire(pr.x, pr.y - (pr.kind === 'torch' ? 62 : 24), { n: pr.kind === 'torch' ? 1 : 2, s: pr.kind === 'torch' ? .55 : 1 }); FX.light(pr.x, pr.y - 40, sp.light * fl, sp.col, 1.0 * fl); if (pr.kind === 'campfire' && U.dist(p.x, p.y, pr.x, pr.y) < 300) sfx('campfire', { x: pr.x, y: pr.y, vol: .5, gap: 1800, range: 500 }); }
        else if (sp.light) FX.light(pr.x, pr.y - 50, sp.light * fl, sp.col, .8 * fl);
        if (pr.fuse > 0) { pr.fuse -= dt; E.trail(pr.x, pr.y - 64, 'fire', 6); if (pr.fuse <= 0) { w.removeProp(pr); w.dead.add(pr.id); E.explosion(pr.x, pr.y - 20, { pal: 'fire', r: 160 }); sfx('explosion', { vol: 1 }); const R = 190; for (const m of G.mobs) if (!m.dead && U.dist(m.x, m.y, pr.x, pr.y) < R) m.hurt(120, pr.x, pr.y, 'fire', G, { kb: 600 }); if (U.dist(p.x, p.y, pr.x, pr.y) < R) p.hurt(40, pr.x, pr.y, 'fire'); for (let ty = -3; ty <= 3; ty++) for (let tx = -3; tx <= 3; tx++) { const X = (pr.x / TS | 0) + tx, Y = (pr.y / TS | 0) + ty, tl = w.tile(X, Y); if (Math.hypot(tx, ty) < 3 && tl.solid && tl.tier <= 3) { w.setTile(X, Y, 'basalt'); G.drop(X * TS + 32, Y * TS + 32, tl.drop || 'cobble', 1); } } } } }
    },
    explore() { const p = G.player, w = G.world, R = 15, cx = p.x / TS | 0, cy = p.y / TS | 0; let ch = false; for (let y = cy - R; y <= cy + R; y++) for (let x = cx - R; x <= cx + R; x++) { if (x < 0 || y < 0 || x >= w.w || y >= w.h) continue; if (Math.hypot(x - cx, y - cy) < R && !G.exp[y * w.w + x]) { G.exp[y * w.w + x] = 1; ch = true; } } if (ch) G.mmDirty = true; },
    pause(v) { G.paused = v; $('pause').style.display = v ? 'flex' : 'none'; if (v) sfx('menu_open'); },
    draw(ctx, W, H) {
      const w = G.world, p = G.player, cam = SK.cam, z = cam.zoom, t = G.t; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#0a0c0e'; ctx.fillRect(0, 0, W, H);
      const vx = cam.x + cam.ox, vy = cam.y + cam.oy; ctx.setTransform(z, 0, 0, z, W / 2 - vx * z, H / 2 - vy * z);
      const hw = W / z / 2 + TS, hh = H / z / 2 + TS; const x0 = Math.max(0, Math.floor((vx - hw) / TS)), x1 = Math.min(w.w - 1, Math.ceil((vx + hw) / TS)), y0 = Math.max(0, Math.floor((vy - hh) / TS)), y1 = Math.min(w.h - 1, Math.ceil((vy + hh + 200) / TS));
      w.drawGround(ctx, x0, y0, x1, y1);
      const L = []; const X0 = vx - hw - 250, X1 = vx + hw + 250, Y0 = vy - hh - 400, Y1 = vy + hh + 250;
      for (const pr of w.propsIn(X0, Y0, X1, Y1 + 300)) { if (pr.dead || pr.y < Y0 || pr.y > Y1 + 300) continue; L.push([pr.y, pr, 0]); }
      for (const m of G.mobs) if (!m.dead && m.x > X0 && m.x < X1 && m.y > Y0 && m.y < Y1 + 300) L.push([m.y, m, 1]); for (const q of G.pickups) L.push([q.y, q, 2]); L.push([p.y, p, 3]);
      L.sort((a, b) => a[0] - b[0]); let li = 0;
      for (let ty = y0 - 1; ty <= y1 + 2; ty++) { w.drawSolidRow(ctx, ty, x0, x1); while (li < L.length && L[li][0] < (ty + 1) * TS) { G.drawItem(ctx, L[li], t); li++; } }
      while (li < L.length) { G.drawItem(ctx, L[li], t); li++; }
      for (const q of G.projs) q.draw(ctx);
      for (const a of w.altars) { if (a.x < X0 || a.x > X1 || a.y < Y0 || a.y > Y1) continue; const done = w.bossDone[a.boss]; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const pulse = .5 + .5 * Math.sin(t * 2 + a.x); ctx.globalAlpha = done ? .15 : .35 + pulse * .25; ctx.strokeStyle = done ? '#6a7a8a' : FX.PAL[D.bosses[a.boss].pal].l; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(a.x, a.y, 70, 52, 0, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.ellipse(a.x, a.y, 46, 34, 0, 0, TAU); ctx.stroke(); ctx.restore(); if (!done) { FX.light(a.x, a.y, 260, FX.PAL[D.bosses[a.boss].pal].l, .55 + pulse * .2); if (Math.random() < .25) E.corruption(a.x + U.rnd(-40, 40), a.y, 1); } }
      G.ambientFx(p, vx, vy, hw, hh);
      FX.draw(ctx);
      ctx.save(); ctx.font = '700 22px "SkvernaFont",Georgia,serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; for (const d of G.texts) { ctx.globalAlpha = Math.min(1, d.t * 2); ctx.strokeStyle = 'rgba(0,0,0,.85)'; ctx.fillStyle = d.c; ctx.strokeText(d.v, d.x, d.y); ctx.fillText(d.v, d.x, d.y); } ctx.restore();
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; const bn = w.biomeAt(p.x, p.y), B = D.biomes[bn]; const tt = w.time; let night = 0; if (tt > .5 && tt < .6) night = (tt - .5) / .1; else if (tt >= .6 && tt <= .9) night = 1; else if (tt > .9) night = 1 - (tt - .9) / .1; night *= (p.buffs.night ? .4 : 1);
      const dusk = (tt > .46 && tt < .6) ? 1 - Math.abs(tt - .53) / .07 : (tt > .9 || tt < .06) ? .7 : 0; const base = B.ambient, col = [Math.round(U.lerp(base[0] * .4, 12, night)), Math.round(U.lerp(base[1] * .4, 16, night)), Math.round(U.lerp(base[2] * .4, 44, night))];
      if (SK.settings.gfx.lights) FX.drawLight(ctx, W, H, { x: vx, y: vy, zoom: z }, [col[0], col[1], col[2], Math.max(night * .76, .0)], 1); else FX.lights.length = 0;
      if (dusk > 0.02) { ctx.fillStyle = `rgba(255,120,40,${dusk * .12})`; ctx.fillRect(0, 0, W, H); }
      const fg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .32, W / 2, H / 2, Math.max(W, H) * .78); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, `rgba(4,3,8,${.62 + night * .12})`); ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = .06 + night * .05; ctx.fillStyle = B.fog; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1;
      if (G.hurtFx > 0) { const hg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .25, W / 2, H / 2, Math.max(W, H) * .7); hg.addColorStop(0, 'rgba(160,0,0,0)'); hg.addColorStop(1, `rgba(160,0,10,${G.hurtFx * .55})`); ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H); }
      if (p.hp < p.maxhp * .3 && !p.dead) { const a = (.5 + .5 * Math.sin(t * 6)) * .25; const hg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .3, W / 2, H / 2, Math.max(W, H) * .7); hg.addColorStop(0, 'rgba(120,0,0,0)'); hg.addColorStop(1, `rgba(120,0,10,${a})`); ctx.fillStyle = hg; ctx.fillRect(0, 0, W, H); }
      if (p.dead) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(0, 0, W, H); }
      if (p.mouseT > 0 && !G.ui.open && !G.paused) { ctx.save(); ctx.translate(In.mouse.x * (W / innerWidth), In.mouse.y * (H / innerHeight)); ctx.strokeStyle = 'rgba(255,240,210,.85)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(0, 0, 9, 0, TAU); ctx.moveTo(-15, 0); ctx.lineTo(-5, 0); ctx.moveTo(15, 0); ctx.lineTo(5, 0); ctx.moveTo(0, -15); ctx.lineTo(0, -5); ctx.moveTo(0, 15); ctx.lineTo(0, 5); ctx.stroke(); ctx.restore(); }
    },
    drawItem(ctx, it, t) { const o = it[1]; if (it[2] === 0) G.world.drawProp(ctx, o, t); else o.draw(ctx, t); },
    ambientFx(p, vx, vy, hw, hh) {
      const b = G.world.biomeAt(p.x, p.y), n = SK.settings.gfx.fx; if (n === 0) return; const rate = n === 2 ? 1 : .5;
      if (b === 'tundra' && Math.random() < .9 * rate) FX.add({ x: vx + U.rnd(-hw, hw), y: vy - hh - 20, vx: U.rnd(-70, -20), vy: U.rnd(90, 190), life: U.rnd(3, 5), s0: U.rnd(2, 4), s1: U.rnd(1, 3), c0: [240, 248, 255], c1: [200, 220, 245], a0: .8, a1: .1 });
      else if (b === 'desert' && Math.random() < .5 * rate) FX.add({ x: vx - hw - 20, y: vy + U.rnd(-hh, hh), vx: U.rnd(180, 320), vy: U.rnd(-20, 30), life: U.rnd(2, 4), s0: U.rnd(3, 6), s1: U.rnd(3, 7), c0: [220, 190, 130], c1: [200, 170, 110], a0: .22, a1: 0 });
      else if (b === 'waste' && Math.random() < .55 * rate) FX.add({ x: vx + U.rnd(-hw, hw), y: vy + hh, vx: U.rnd(-20, 20), vy: U.rnd(-80, -30), life: U.rnd(3, 6), s0: U.rnd(3, 6), s1: 1, c0: [190, 90, 230], c1: [90, 20, 140], a0: .6, a1: 0, turb: 60 });
      else if (b === 'forest' && G.isNight() && Math.random() < .3 * rate) FX.add({ x: vx + U.rnd(-hw, hw), y: vy + U.rnd(-hh, hh), vx: U.rnd(-12, 12), vy: U.rnd(-14, 8), life: U.rnd(3, 6), s0: U.rnd(3, 5), s1: 2, c0: [255, 240, 150], c1: [200, 255, 120], a0: .9, a1: 0, turb: 40 });
    },
    buildMini() { const w = G.world; G.mm = document.createElement('canvas'); G.mm.width = w.w; G.mm.height = w.h; G.mmg = G.mm.getContext('2d'); G.mmdata = G.mmg.createImageData(w.w, w.h); G.mmDirty = true; },
    drawMini() {
      const w = G.world, d = G.mmdata.data; if (G.mmDirty) { G.mmDirty = false; const col = { forest: [58, 110, 58], desert: [214, 180, 108], tundra: [200, 220, 238], waste: [100, 70, 110] }; for (let i = 0; i < w.w * w.h; i++) { const e = G.exp[i], t = D.tiles[w.tiles[i]], b = w.bnames[w.biome[i]]; let c = col[b]; if (t.solid) c = [c[0] * .55, c[1] * .55, c[2] * .6]; if (t.id.startsWith('ore_')) c = [230, 200, 80]; d[i * 4] = e ? c[0] : 0; d[i * 4 + 1] = e ? c[1] : 0; d[i * 4 + 2] = e ? c[2] : 0; d[i * 4 + 3] = e ? 255 : 0; } G.mmg.putImageData(G.mmdata, 0, 0); }
      const cv = $('mini'), g = cv.getContext('2d'), S = cv.width, p = G.player; g.clearRect(0, 0, S, S); g.save(); g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 2, 0, TAU); g.clip(); g.fillStyle = 'rgba(8,8,12,.88)'; g.fillRect(0, 0, S, S); const sc = 2.6, px = p.x / TS, py = p.y / TS; g.imageSmoothingEnabled = false; g.drawImage(G.mm, S / 2 - px * sc, S / 2 - py * sc, w.w * sc, w.h * sc);
      for (const a of w.altars) { const x = S / 2 + (a.x / TS - px) * sc, y = S / 2 + (a.y / TS - py) * sc; if (G.exp[(a.y / TS | 0) * w.w + (a.x / TS | 0)]) { g.fillStyle = w.bossDone[a.boss] ? '#667' : '#ff5050'; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill(); } }
      g.fillStyle = '#fff'; g.beginPath(); g.arc(S / 2, S / 2, 3, 0, TAU); g.fill(); g.restore(); g.strokeStyle = 'rgba(200,170,110,.7)'; g.lineWidth = 2; g.beginPath(); g.arc(S / 2, S / 2, S / 2 - 1, 0, TAU); g.stroke();
    },
    initHud() { const hb = $('hotbar'); hb.innerHTML = ''; for (let i = 0; i < 9; i++) { const d = document.createElement('div'); d.className = 'slot'; d.dataset.i = i; d.innerHTML = '<span class="k">' + (i + 1) + '</span>'; hb.appendChild(d); } G.hbLast = ''; },
    slotHtml(s) { if (!s) return ''; const src = D.iconSrc(s.id); return (src ? `<img src="${src}">` : '') + (s.n > 1 ? `<span class="n">${s.n}</span>` : '') + (D.items[s.id].dur ? `<i class="dur"><b style="width:${Math.max(0, s.d / D.items[s.id].dur * 100)}%"></b></i>` : ''); },
    updateHud() {
      const p = G.player; if (!p) return; $('hpfill').style.width = Math.max(0, p.hp / p.maxhp * 100) + '%'; $('hptrail').style.width = Math.max(0, G.hpTrail / p.maxhp * 100) + '%'; $('hptxt').textContent = Math.ceil(p.hp) + ' / ' + p.maxhp; $('defv').textContent = p.def;
      $('dashfill').style.width = U.clamp(1 - p.dashCd / .75, 0, 1) * 100 + '%';
      const sl = document.querySelectorAll('#hotbar .slot'); let sig = p.sel + '|'; for (let i = 0; i < 9; i++) { const s = p.inv.s[i]; sig += (s ? s.id + s.n + (s.d | 0) : '-') + ','; }
      if (sig !== G.hbLast) { G.hbLast = sig; sl.forEach((d, i) => { const s = p.inv.s[i]; d.classList.toggle('sel', i === p.sel); d.querySelectorAll('img,.n,.dur').forEach(x => x.remove()); if (s) d.insertAdjacentHTML('beforeend', G.slotHtml(s)); }); const it = p.item(); $('itemname').textContent = it ? it.name : ''; $('itemname').style.opacity = 1; clearTimeout(G._in); G._in = setTimeout(() => $('itemname').style.opacity = 0, 1800); }
      $('toasts').innerHTML = G.toasts.map(t => `<div class="toast${t.warn ? ' warn' : ''}" style="opacity:${Math.min(1, t.t * 2)}">${t.m}</div>`).join('');
      const bn = G.banners[0]; const bw = $('banner'); if (bn) { const a = Math.min(1, bn.t * 1.5, (3.4 - bn.t) * 3); bw.style.opacity = a; bw.innerHTML = `<div class="t1">${bn.a}</div><div class="t2">${bn.b || ''}</div>`; } else bw.style.opacity = 0;
      const bb = $('bossbar'); if (G.boss && G.boss.intro <= 0.4) { bb.style.display = 'block'; $('bossname').textContent = G.boss.name; $('bossfill').style.width = Math.max(0, G.boss.hp / G.boss.maxhp * 100) + '%'; $('bossph').textContent = ['I', 'II', 'III'][G.boss.phase - 1]; } else bb.style.display = 'none';
      const ti = G.world.time, hh = Math.floor((ti * 24 + 6) % 24), mm = Math.floor((((ti * 24 + 6) % 1) * 60)); $('clock').textContent = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm + ' · День ' + G.world.day;
      $('buffs').textContent = Object.keys(p.buffs).map(k => ({ speed: 'Скорость', power: 'Сила', skin: 'Кожа', fireres: 'Огнестойкость', haste: 'Спешка', night: 'Ночное зрение', float: 'Левитация', cleanse: 'Очищение' }[k] || k) + ' ' + Math.ceil(p.buffs[k]) + 'с').join(' · ');
      G.drawMini();
    },
    near(kind) { const p = G.player; for (const pr of G.world.propsIn(p.x - 300, p.y - 300, p.x + 300, p.y + 200)) if (!pr.dead && pr.type === 'place' && pr.kind === kind && U.dist(p.x, p.y, pr.x, pr.y) < 280) return true; return false; },
    stations() { return { hand: true, bench: G.near('workbench'), furnace: G.near('furnace') || G.near('campfire'), anvil: G.near('anvil') }; },
    openUi() { G.ui.open = true; $('inv').style.display = 'flex'; G.renderInv(); sfx('inventory_open', { vol: .7 }); },
    closeUi() { G.ui.open = false; $('inv').style.display = 'none'; G.carry = null; },
    renderInv() {
      const p = G.player, st = G.stations(), g = $('invgrid'); g.innerHTML = '';
      for (let i = 0; i < 36; i++) { const s = p.inv.s[i], d = document.createElement('div'); d.className = 'slot' + (i < 9 ? ' hot' : '') + (G.carry === i ? ' carry' : ''); d.innerHTML = G.slotHtml(s); d.title = s ? D.items[s.id].name : '';
        d.onclick = () => { if (G.carry == null) { if (p.inv.s[i]) G.carry = i; } else { const a = p.inv.s[G.carry], b = p.inv.s[i]; if (G.carry !== i) { if (a && b && a.id === b.id && D.items[a.id].stack > 1) { const t = Math.min(b.n + a.n, D.items[a.id].stack) - b.n; b.n += t; a.n -= t; if (a.n <= 0) p.inv.s[G.carry] = null; } else { p.inv.s[G.carry] = b; p.inv.s[i] = a; } } G.carry = null; } G.hbLast = ''; G.renderInv(); };
        d.oncontextmenu = e => { e.preventDefault(); if (p.inv.s[i]) { if (i >= 9) { const t = p.inv.s[8]; p.inv.s[8] = p.inv.s[i]; p.inv.s[i] = t; p.sel = 8; } else p.sel = i; G.hbLast = ''; G.renderInv(); } }; g.appendChild(d); }
      $('equip').innerHTML = p.armor ? `<img src="${D.iconSrc(p.armor)}"><div>${D.items[p.armor].name}<br><small>Защита ${D.items[p.armor].def}</small></div>` : '<div class="muted">Броня не надета</div>';
      const names = { hand: 'Руки', bench: 'Верстак', furnace: 'Печь / костёр', anvil: 'Наковальня' }; $('stations').innerHTML = Object.keys(names).map(k => `<span class="${st[k] ? 'on' : ''}">${names[k]}</span>`).join('');
      const list = $('recipes'); list.innerHTML = '';
      for (const r of D.recipes) { const it = D.items[r[0]]; if (!it) continue; const can = p.inv.can(r[2]), ok = st[r[3]]; const row = document.createElement('div'); row.className = 'rec' + (can && ok ? '' : ' no') + (ok ? '' : ' far');
        row.innerHTML = `<img src="${D.iconSrc(r[0])}"><div class="rn">${it.name}${r[1] > 1 ? ' ×' + r[1] : ''}</div><div class="ri">${Object.keys(r[2]).map(k => `<span class="${p.inv.count(k) >= r[2][k] ? '' : 'lack'}">${D.items[k] ? D.items[k].name : k} ${p.inv.count(k)}/${r[2][k]}</span>`).join('')}</div>`;
        row.onclick = () => { if (!ok) { G.toast('Нужна станция: ' + names[r[3]], 1); return; } if (!p.inv.can(r[2])) { G.toast('Не хватает материалов', 1); return; } if (p.inv.add(r[0], r[1]) > 0) { G.toast('Нет места', 1); return; } for (const k in r[2]) p.inv.take(k, r[2][k]); sfx(r[3] === 'furnace' ? 'furnace' : r[3] === 'anvil' ? 'anvil' : r[3] === 'bench' ? 'crafting_table' : 'wood_place', { vol: .9 }); E.shockwave(p.x, p.y, { pal: 'holy', r: 60, life: .35 }); G.hbLast = ''; G.renderInv(); }; list.appendChild(row); }
    },
    snapshot() {
      const w = G.world, p = G.player, edits = []; w.edits.forEach((v, k) => edits.push(k, v)); const placed = w.props.filter(q => q.type === 'place' && !q.dead).map(q => ({ k: q.k, x: q.x, y: q.y, h: q.h, r: q.r, kind: q.kind, drop: q.drop })); const removed = []; w.dead.forEach(i => removed.push(i));
      return { v: 1, seed: w.seed, name: w.name, time: w.time, day: w.day, bossDone: w.bossDone, edits, placed, removed, player: { x: p.x, y: p.y, hp: p.hp, inv: p.inv.s, sel: p.sel, armor: p.armor, kills: p.kills } };
    },
    save() { if (!G.meta || !G.world) return; try { localStorage.setItem('skverna.world.' + G.meta.id, JSON.stringify(G.snapshot())); const idx = JSON.parse(localStorage.getItem('skverna.worlds') || '[]'); const e = idx.find(x => x.id === G.meta.id); if (e) { e.played = Date.now(); e.day = G.world.day; } localStorage.setItem('skverna.worlds', JSON.stringify(idx)); } catch (e) { console.warn('save fail', e); } },
    loadWorld(meta) {
      const raw = localStorage.getItem('skverna.world.' + meta.id), snap = raw ? JSON.parse(raw) : null; const w = new SK.World(snap ? snap.seed : meta.seed, meta.name);
      if (snap) { w.time = snap.time; w.day = snap.day; w.bossDone = snap.bossDone || {}; for (let i = 0; i < snap.edits.length; i += 2) { w.tiles[snap.edits[i]] = snap.edits[i + 1]; w.edits.set(snap.edits[i], snap.edits[i + 1]); } for (const id of snap.removed) { const p = w.props[id]; if (p && !p.dead) { w.removeProp(p); w.dead.add(id); } } for (const q of snap.placed) w.addProp(Object.assign({ type: 'place', hp: 4, ph: U.rnd(0, 6) }, q)); }
      return { w, pdata: snap ? snap.player : null };
    }
  };
  let last = performance.now(), acc = 0;
  SK.loop = function (now) {
    requestAnimationFrame(SK.loop); const cv = SK.canvas, ctx = SK.ctx; let dt = Math.min(.05, (now - last) / 1000); last = now; const S = SK.settings.gfx; if (S.fps) { acc += dt; if (acc < 1 / S.fps - .001) return; dt = Math.min(.05, acc); acc = 0; }
    const r = Math.min(devicePixelRatio || 1, 1.5) * S.scale, W = Math.round(innerWidth * r), H = Math.round(innerHeight * r); if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
    if (G.running) { G.update(dt); G.draw(ctx, W, H); G.hudT = (G.hudT || 0) - dt; if (G.hudT <= 0) { G.hudT = .05; G.updateHud(); } }
    else if (SK.menu && SK.menu.active) SK.menu.frame(dt, ctx, W, H);
  };
})(window.SK);
