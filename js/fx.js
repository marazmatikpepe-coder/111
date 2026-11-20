'use strict';
(function (SK) {
  const U = SK.U, TAU = Math.PI * 2;
  const PAL = {
    fire: { a: [255, 235, 150], b: [255, 120, 30], c: [110, 25, 8], l: '#ff9a3c' }, ice: { a: [235, 250, 255], b: [110, 190, 255], c: [40, 90, 200], l: '#7fc8ff' },
    dark: { a: [235, 170, 255], b: [150, 70, 230], c: [50, 15, 100], l: '#a060ff' }, holy: { a: [255, 255, 225], b: [255, 215, 110], c: [200, 130, 30], l: '#ffe080' },
    poison: { a: [220, 255, 150], b: [110, 210, 60], c: [30, 100, 30], l: '#8aff50' }, blood: { a: [255, 90, 90], b: [190, 20, 30], c: [70, 5, 10], l: '#d02030' },
    bolt: { a: [255, 255, 255], b: [170, 210, 255], c: [70, 110, 255], l: '#9fc8ff' }, earth: { a: [230, 200, 150], b: [150, 110, 70], c: [70, 50, 30], l: '#b08a5a' },
    wind: { a: [240, 255, 245], b: [170, 235, 215], c: [90, 160, 150], l: '#b0f0e0' }, corrupt: { a: [255, 160, 240], b: [170, 40, 190], c: [50, 5, 70], l: '#c040d0' }
  };
  const glowCache = {};
  function glow(rgb) {
    const k = rgb.join(','); let c = glowCache[k]; if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(.25, `rgba(${rgb},.55)`); gr.addColorStop(.6, `rgba(${rgb},.12)`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return glowCache[k] = c;
  }
  let smokeSpr = null;
  function smoke() { if (smokeSpr) return smokeSpr; const c = smokeSpr = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.7)'); gr.addColorStop(.5, 'rgba(255,255,255,.3)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; }
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const tcache = new Map();
  function tint(spr, c) { const k = (c[0] >> 4) + ',' + (c[1] >> 4) + ',' + (c[2] >> 4); let t = tcache.get(k); if (t) return t; t = document.createElement('canvas'); t.width = t.height = 64; const g = t.getContext('2d'); g.drawImage(spr, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = `rgb(${(c[0] >> 4) * 16},${(c[1] >> 4) * 16},${(c[2] >> 4) * 16})`; g.fillRect(0, 0, 64, 64); tcache.set(k, t); return t; }
  const FX = SK.FX = {
    P: [], S: [], lights: [], flash: [], PAL, glow,
    cap() { return [600, 1400, 2600][SK.settings.gfx.fx] || 1400; },
    add(p) { if (FX.P.length > FX.cap()) return; p.max = p.life; p.rot = p.rot || 0; p.vr = p.vr || 0; p.drag = p.drag == null ? 0 : p.drag; p.ay = p.ay || 0; p.ax = p.ax || 0; p.k = p.k || 'glow'; FX.P.push(p); return p; },
    shape(s) { s.t = 0; FX.S.push(s); return s; },
    light(x, y, r, color, i = 1) { FX.lights.push({ x, y, r, c: color, i }); },
    flashLight(x, y, r, color, i, life) { FX.flash.push({ x, y, r, c: color, i, life, max: life }); },
    update(dt) {
      for (let i = FX.P.length - 1; i >= 0; i--) {
        const p = FX.P[i]; p.life -= dt; if (p.life <= 0) { FX.P[i] = FX.P[FX.P.length - 1]; FX.P.pop(); continue; }
        const d = Math.exp(-p.drag * dt); p.vx = p.vx * d + p.ax * dt; p.vy = p.vy * d + p.ay * dt; if (p.turb) { p.vx += (Math.random() - .5) * p.turb * dt; p.vy += (Math.random() - .5) * p.turb * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        if (p.orbit) { const o = p.orbit; o.a += o.w * dt; o.r = Math.max(0, o.r - o.in * dt); p.x = o.x + Math.cos(o.a) * o.r; p.y = o.y + Math.sin(o.a) * o.r * .8 - (p.max - p.life) * (o.up || 0); }
      }
      for (let i = FX.S.length - 1; i >= 0; i--) { const s = FX.S[i]; s.t += dt; if (s.t >= s.life) { FX.S.splice(i, 1); continue; } }
      for (let i = FX.flash.length - 1; i >= 0; i--) { FX.flash[i].life -= dt; if (FX.flash[i].life <= 0) FX.flash.splice(i, 1); }
    },
    draw(ctx) {
      ctx.save();
      for (const p of FX.P) { if (p.k !== 'smoke' && p.k !== 'shard' && p.k !== 'debris') continue; const t = 1 - p.life / p.max;
        const s = p.s0 + (p.s1 - p.s0) * t, c = mix(p.c0, p.c1, t), a = (p.a0 + (p.a1 - p.a0) * t);
        if (p.k === 'smoke') { ctx.globalAlpha = Math.max(0, a); ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(tint(smoke(), c), p.x - s, p.y - s, s * 2, s * 2); }
        else { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = Math.max(0, a); ctx.fillStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); if (p.k === 'shard') { ctx.beginPath(); ctx.moveTo(0, -s * 1.3); ctx.lineTo(s * .5, 0); ctx.lineTo(0, s * 1.3); ctx.lineTo(-s * .5, 0); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 1; ctx.stroke(); } else ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); } }
      ctx.globalCompositeOperation = 'lighter';
      for (const p of FX.P) { if (p.k === 'smoke' || p.k === 'shard' || p.k === 'debris') continue; const t = 1 - p.life / p.max;
        const s = p.s0 + (p.s1 - p.s0) * t, c = mix(p.c0, p.c1, t), a = Math.max(0, p.a0 + (p.a1 - p.a0) * t); if (a <= 0.004) continue; ctx.globalAlpha = Math.min(1, a);
        if (p.k === 'spark') { const sp = Math.hypot(p.vx, p.vy) || 1, l = Math.min(26, sp * .045 + 2); ctx.strokeStyle = `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`; ctx.lineWidth = Math.max(1, s * .35); ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx / sp * l, p.y - p.vy / sp * l); ctx.stroke(); ctx.drawImage(glow(c.map(Math.round)), p.x - s * 1.6, p.y - s * 1.6, s * 3.2, s * 3.2); }
        else ctx.drawImage(glow(c.map(v => Math.round(v / 8) * 8)), p.x - s, p.y - s, s * 2, s * 2); }
      for (const s of FX.S) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'lighter'; s.draw(ctx, s, s.t / s.life); }
      ctx.restore();
    },
    drawLight(ctx, W, H, cam, ambient, quality) {
      const sc = quality ? .5 : .33, w = Math.ceil(W * sc), h = Math.ceil(H * sc);
      if (!FX._lc || FX._lc.width !== w || FX._lc.height !== h) { FX._lc = document.createElement('canvas'); FX._lc.width = w; FX._lc.height = h; FX._lg = FX._lc.getContext('2d'); }
      const g = FX._lg; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.fillStyle = `rgba(${ambient[0]},${ambient[1]},${ambient[2]},${ambient[3]})`; g.fillRect(0, 0, w, h);
      g.globalCompositeOperation = 'destination-out';
      const all = FX.lights.concat(FX.flash.map(f => ({ x: f.x, y: f.y, r: f.r, c: f.c, i: f.i * (f.life / f.max) })));
      const z = cam.zoom * sc;
      for (const l of all) { const x = (l.x - cam.x) * z + w / 2, y = (l.y - cam.y) * z + h / 2, r = l.r * z; if (x < -r || y < -r || x > w + r || y > h + r) continue;
        const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${Math.min(1, l.i)})`); gr.addColorStop(.5, `rgba(0,0,0,${Math.min(1, l.i) * .55})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.imageSmoothingEnabled = true; ctx.drawImage(FX._lc, 0, 0, w, h, 0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter'; const zz = cam.zoom;
      for (const l of all) { const x = (l.x - cam.x) * zz + W / 2, y = (l.y - cam.y) * zz + H / 2, r = l.r * zz; if (x < -r || y < -r || x > W + r || y > H + r) continue; const rgb = U.rgb(l.c); ctx.globalAlpha = Math.min(.55, l.i * .38); ctx.drawImage(glow(rgb), x - r * .8, y - r * .8, r * 1.6, r * 1.6); }
      ctx.restore(); FX.lights.length = 0;
    }
  };
  SK.cam = { x: 0, y: 0, zoom: 1, trauma: 0, ox: 0, oy: 0 };
  SK.shake = (a) => { SK.cam.trauma = Math.min(1, SK.cam.trauma + a * (SK.settings.gfx.shake)); };
  SK.hitstop = (ms) => { SK.time.freeze = Math.max(SK.time.freeze, ms / 1000); };
  const E = FX.E = {}, R = U.rnd;
  function burst(x, y, pal, n, o = {}) {
    const P = PAL[pal] || PAL.fire; for (let i = 0; i < n; i++) { const a = o.ang != null ? o.ang + R(-(o.spread || .6), (o.spread || .6)) : R(0, TAU), sp = R(o.s0 || 60, o.s1 || 320);
      FX.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * (o.flat || 1), drag: o.drag == null ? 3.2 : o.drag, ay: o.g || 0, life: R(.25, o.life || .7), s0: R(2, o.size || 5), s1: 0, c0: P.a, c1: P.b, a0: 1, a1: 0, k: 'spark' }); }
  }
  function blobs(x, y, pal, n, o = {}) {
    const P = PAL[pal] || PAL.fire; for (let i = 0; i < n; i++) { const a = R(0, TAU), r = R(0, o.r || 10), sp = R(o.s0 || 10, o.s1 || 90);
      FX.add({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * .7, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp + (o.vy || 0), drag: o.drag == null ? 2.2 : o.drag, ay: o.ay || 0, turb: o.turb || 0, life: R(o.l0 || .35, o.l1 || .9), s0: R(o.z0 || 8, o.z1 || 22), s1: R(0, 6), c0: P.a, c1: P.c, a0: o.a || .9, a1: 0 }); }
  }
  function smokePuff(x, y, n, o = {}) { for (let i = 0; i < n; i++) FX.add({ x: x + R(-10, 10), y: y + R(-6, 6), vx: R(-20, 20), vy: R(-50, -15) + (o.vy || 0), drag: .8, life: R(.8, 1.6), s0: R(12, 22), s1: R(36, 60), c0: o.c || [70, 60, 60], c1: [20, 20, 20], a0: o.a || .5, a1: 0, k: 'smoke' }); }
  E.hit = (x, y, o = {}) => { burst(x, y, o.pal || 'holy', 12, { ang: o.ang, spread: .9, s1: 360 }); FX.shape({ x, y, life: .16, draw(c, s, t) { c.globalAlpha = 1 - t; c.fillStyle = '#fff'; c.beginPath(); c.arc(s.x, s.y, 14 * (1 - t) + 3, 0, TAU); c.fill(); } }); FX.flashLight(x, y, 90, '#ffe9b0', .8, .12); };
  E.blood = (x, y, o = {}) => { const c = o.c || [150, 15, 25]; for (let i = 0; i < (o.n || 10); i++) { const a = o.ang != null ? o.ang + R(-.7, .7) : R(0, TAU), sp = R(80, 260); FX.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, drag: 3, life: R(.3, .7), s0: R(2, 4), s1: 1, c0: c, c1: [60, 5, 10], a0: 1, a1: 0, k: 'debris', rot: R(0, 6) }); } };
  E.debris = (x, y, col, n = 8) => { const c = U.rgb(col); for (let i = 0; i < n; i++) { const a = R(0, TAU), sp = R(60, 220); FX.add({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, ay: 600, drag: .5, life: R(.4, .8), s0: R(3, 6), s1: 3, c0: c, c1: c.map(v => v * .6), a0: 1, a1: 0, k: 'debris', rot: R(0, 6), vr: R(-9, 9) }); } };
  E.dust = (x, y, n = 6, c = [150, 130, 100]) => { for (let i = 0; i < n; i++) FX.add({ x: x + R(-8, 8), y: y + R(-3, 3), vx: R(-35, 35), vy: R(-25, -5), drag: 2, life: R(.3, .7), s0: R(6, 10), s1: R(14, 22), c0: c, c1: c, a0: .35, a1: 0, k: 'smoke' }); };
  E.slash = (x, y, o = {}) => { const a = o.ang || 0, P = PAL[o.pal || 'holy'], len = o.len || 70, w = o.w || 1; FX.shape({ x, y, a, life: .2, draw(c, s, t) { const e = U.ease(Math.min(1, t * 2.2)); c.lineCap = 'round';
        for (const [lw, col, al] of [[16 * w, `rgb(${P.b})`, .35], [8 * w, `rgb(${P.a})`, .8], [3 * w, '#fff', 1]]) { c.globalAlpha = (1 - t) * al; c.lineWidth = lw * (1 - t * .6); c.strokeStyle = col; c.beginPath(); c.arc(s.x, s.y, len, s.a - 1.1 + e * .2, s.a - 1.1 + e * 2.2); c.stroke(); } } }); burst(x + Math.cos(a) * len, y + Math.sin(a) * len, o.pal || 'holy', 6, { ang: a, spread: 1.2, s1: 200 }); };
  E.shockwave = (x, y, o = {}) => { const P = PAL[o.pal || 'fire'], R0 = o.r || 160; FX.shape({ x, y, life: o.life || .55, draw(c, s, t) { const e = 1 - Math.pow(1 - t, 3), r = R0 * e; c.globalAlpha = (1 - t); c.lineWidth = 3 + 14 * (1 - t); c.strokeStyle = `rgb(${P.b})`; c.beginPath(); c.ellipse(s.x, s.y, r, r * .75, 0, 0, TAU); c.stroke(); c.lineWidth = 2; c.strokeStyle = '#fff'; c.globalAlpha = (1 - t) * .8; c.beginPath(); c.ellipse(s.x, s.y, r * .96, r * .72, 0, 0, TAU); c.stroke(); const gr = c.createRadialGradient(s.x, s.y, r * .6 + 1, s.x, s.y, r + 2); gr.addColorStop(0, `rgba(${P.c},0)`); gr.addColorStop(1, `rgba(${P.b},${.25 * (1 - t)})`); c.fillStyle = gr; c.globalAlpha = 1; c.beginPath(); c.ellipse(s.x, s.y, r, r * .75, 0, 0, TAU); c.fill(); } }); };
  E.explosion = (x, y, o = {}) => { const pal = o.pal || 'fire', r = o.r || 120, k = r / 120; burst(x, y, pal, 36 * Math.min(2, k), { s0: 120, s1: 520 * k, size: 7, life: 1 }); blobs(x, y, pal, 26, { r: 16 * k, s1: 160 * k, z0: 14 * k, z1: 40 * k, l0: .4, l1: 1.0, a: 1 });
    smokePuff(x, y - 10, 10 * Math.min(2, k), { a: .55 }); E.shockwave(x, y, { pal, r: r * 1.5 }); FX.flashLight(x, y, r * 4, PAL[pal].l, 1.6, .55); FX.shape({ x, y, life: .14, draw(c, s, t) { c.globalAlpha = 1 - t; c.drawImage(glow([255, 255, 255]), s.x - r * 1.3, s.y - r * 1.3, r * 2.6, r * 2.6); } }); SK.shake(.55 * Math.min(1.5, k)); SK.hitstop(60); E.debris(x, y, '#5a4630', 10); };
  E.fire = (x, y, o = {}) => { const s = o.s || 1; for (let i = 0; i < (o.n || 2); i++) FX.add({ x: x + R(-8, 8) * s, y: y + R(-3, 3), vx: R(-14, 14), vy: R(-90, -40) * s, drag: .6, turb: 120, life: R(.45, .9), s0: R(10, 18) * s, s1: 2, c0: PAL.fire.a, c1: PAL.fire.c, a0: .85, a1: 0 }); if (Math.random() < .25 * (o.n || 2)) FX.add({ x: x + R(-8, 8), y, vx: R(-20, 20), vy: R(-120, -60), drag: .3, turb: 200, life: R(.6, 1.3), s0: 2.4, s1: .6, c0: PAL.fire.a, c1: PAL.fire.b, a0: 1, a1: 0, k: 'spark' }); if (o.smoke !== false && Math.random() < .08) smokePuff(x, y - 24 * s, 1, { a: .22 }); };
  E.magicCircle = (x, y, o = {}) => { const P = PAL[o.pal || 'dark'], r = o.r || 110, life = o.life || 1.2; FX.shape({ x, y, life, draw(c, s, t) { const a = t < .15 ? t / .15 : t > .8 ? (1 - t) / .2 : 1, rr = r * (.6 + .4 * U.ease(Math.min(1, t * 4)));
      c.globalAlpha = a; c.save(); c.translate(s.x, s.y); c.scale(1, .75); c.strokeStyle = `rgb(${P.b})`; c.shadowColor = P.l; c.shadowBlur = 18; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, rr, 0, TAU); c.stroke(); c.lineWidth = 1.5; c.beginPath(); c.arc(0, 0, rr * .82, 0, TAU); c.stroke();
      c.rotate(t * 3); for (let i = 0; i < 24; i++) { c.rotate(TAU / 24); c.beginPath(); c.moveTo(rr * .86, 0); c.lineTo(rr * (i % 2 ? .93 : .98), 0); c.stroke(); }
      c.rotate(-t * 6); c.lineWidth = 2; c.beginPath(); for (let i = 0; i < 6; i++) { const q = i * TAU / 3; c.lineTo(Math.cos(q * 2) * rr * .6, Math.sin(q * 2) * rr * .6); } c.closePath(); c.stroke();
      c.rotate(t * 9); c.beginPath(); for (let i = 0; i < 5; i++) { const q = i * TAU * 2 / 5; c.lineTo(Math.cos(q) * rr * .55, Math.sin(q) * rr * .55); } c.closePath(); c.stroke(); c.restore();
      c.globalAlpha = a * .25; c.drawImage(glow(P.b), s.x - rr, s.y - rr * .75, rr * 2, rr * 1.5); if (Math.random() < .5) FX.add({ x: s.x + R(-rr, rr) * .8, y: s.y + R(-rr, rr) * .5, vx: 0, vy: -R(40, 110), life: R(.5, 1), s0: R(2, 5), s1: 0, c0: P.a, c1: P.b, a0: 1, a1: 0 }); } }); FX.flashLight(x, y, r * 2.2, PAL[o.pal || 'dark'].l, .9, life); };
  E.lightning = (x1, y1, x2, y2, o = {}) => { const segs = [], n = Math.max(6, Math.hypot(x2 - x1, y2 - y1) / 22 | 0), P = PAL[o.pal || 'bolt']; const mk = (ax, ay, bx, by, amp) => { const pts = [[ax, ay]]; for (let i = 1; i < n; i++) { const t = i / n, nx = -(by - ay), ny = bx - ax, l = Math.hypot(nx, ny) || 1; pts.push([ax + (bx - ax) * t + nx / l * R(-amp, amp), ay + (by - ay) * t + ny / l * R(-amp, amp)]); } pts.push([bx, by]); return pts; };
    const main = mk(x1, y1, x2, y2, o.amp || 26); segs.push(main); for (let i = 2; i < main.length - 2; i += 3) if (Math.random() < .6) { const [bx, by] = main[i], a = R(0, TAU), L = R(30, 80); segs.push(mk(bx, by, bx + Math.cos(a) * L, by + Math.sin(a) * L, 12).slice(0, 5)); }
    FX.shape({ life: o.life || .28, draw(c, s, t) { const fl = Math.random() < .35 ? .4 : 1; c.lineJoin = 'round'; for (const [lw, col, al] of [[14, `rgb(${P.c})`, .35], [6, `rgb(${P.b})`, .8], [2.2, '#fff', 1]]) { c.globalAlpha = (1 - t) * fl * al; c.lineWidth = lw * (1 - t * .5); c.strokeStyle = col; for (const sg of segs) { c.beginPath(); sg.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); } } } });
    burst(x2, y2, o.pal || 'bolt', 14, { s1: 300 }); FX.flashLight(x2, y2, 220, P.l, 1.4, .25); if (!o.quiet) { SK.shake(.25); SK.Audio.sfx('lightning_strike', { x: x2, y: y2, vol: .8 }); } };
  E.beam = (x1, y1, x2, y2, o = {}) => { const P = PAL[o.pal || 'fire'], w = o.w || 26; FX.shape({ life: o.life || .6, draw(c, s, t) { const a = t < .1 ? t / .1 : t > .75 ? (1 - t) / .25 : 1; c.lineCap = 'round'; const wob = 1 + Math.sin(t * 60) * .08; for (const [k, col, al] of [[1.5, `rgb(${P.c})`, .3], [1, `rgb(${P.b})`, .7], [.45, `rgb(${P.a})`, .95], [.15, '#fff', 1]]) { c.globalAlpha = a * al; c.lineWidth = w * k * wob; c.strokeStyle = col; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); } if (Math.random() < .8) { const q = Math.random(); FX.add({ x: x1 + (x2 - x1) * q, y: y1 + (y2 - y1) * q, vx: R(-60, 60), vy: R(-60, 60), life: R(.2, .5), s0: R(3, 7), s1: 0, c0: P.a, c1: P.b, a0: 1, a1: 0 }); } } }); FX.flashLight((x1 + x2) / 2, (y1 + y2) / 2, 200, P.l, 1, o.life || .6); };
  E.vortex = (x, y, o = {}) => { const P = PAL[o.pal || 'dark'], r = o.r || 120, dur = o.life || 1.2, n = o.n || 70; for (let i = 0; i < n; i++) { const a = R(0, TAU), rr = R(r * .3, r); const p = FX.add({ x, y, vx: 0, vy: 0, life: dur * R(.6, 1), s0: R(5, 11), s1: 1, c0: P.a, c1: P.b, a0: 1, a1: 0 }); if (p) p.orbit = { x, y, a, r: rr, w: (o.dir || 1) * R(4, 9), in: rr / (p.life * 1.05), up: o.up || 30 }; }
    FX.shape({ x, y, life: dur, draw(c, s, t) { c.globalAlpha = (t < .2 ? t / .2 : 1 - t) * .5; c.strokeStyle = `rgb(${P.b})`; c.lineWidth = 3; for (let k = 0; k < 3; k++) { c.beginPath(); for (let i = 0; i < 40; i++) { const q = i / 40, a = q * 9 + t * 14 + k * 2.1, rr = r * (1 - q) * (1 - t * .6); const px = s.x + Math.cos(a) * rr, py = s.y + Math.sin(a) * rr * .75 - q * 20; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke(); } } }); FX.flashLight(x, y, r * 2, P.l, .8, dur); };
  E.heal = (x, y) => { for (let i = 0; i < 24; i++) FX.add({ x: x + R(-22, 22), y: y + R(-4, 14), vx: R(-10, 10), vy: -R(60, 150), drag: .5, life: R(.7, 1.4), s0: R(3, 7), s1: 0, c0: PAL.poison.a, c1: PAL.holy.b, a0: 1, a1: 0 }); E.shockwave(x, y + 10, { pal: 'poison', r: 60, life: .5 }); FX.flashLight(x, y, 160, '#9aff70', .8, .4); };
  E.potion = (x, y, pal = 'poison') => { blobs(x, y, pal, 30, { r: 14, s1: 140, z0: 10, z1: 26, l0: .5, l1: 1.2, a: .8, vy: -30 }); E.shockwave(x, y, { pal, r: 90 }); E.vortex(x, y, { pal, r: 70, life: .9, n: 40, up: 60 }); };
  E.corruption = (x, y, n = 2) => { for (let i = 0; i < n; i++) FX.add({ x: x + R(-14, 14), y: y + R(-4, 10), vx: R(-20, 20), vy: -R(30, 90), drag: .6, turb: 160, life: R(.8, 1.6), s0: R(8, 16), s1: 2, c0: PAL.corrupt.a, c1: PAL.corrupt.c, a0: .75, a1: 0 }); };
  E.trail = (x, y, pal = 'fire', s = 10) => { const P = PAL[pal] || PAL.fire; FX.add({ x: x + R(-3, 3), y: y + R(-3, 3), vx: R(-20, 20), vy: R(-20, 20), drag: 3, life: R(.25, .5), s0: s * R(.7, 1.1), s1: 0, c0: P.a, c1: P.b, a0: .9, a1: 0 }); };
  E.pillar = (x, y, o = {}) => { const P = PAL[o.pal || 'holy'], h = o.h || 380, w = o.w || 46; FX.shape({ x, y, life: o.life || .7, draw(c, s, t) { const a = t < .15 ? t / .15 : (1 - t) / .85, ww = w * (t < .15 ? 1.6 - 3 * t : 1) * (1 - t * .5); const gr = c.createLinearGradient(s.x, s.y - h, s.x, s.y); gr.addColorStop(0, `rgba(${P.a},0)`); gr.addColorStop(.7, `rgba(${P.b},${.7 * a})`); gr.addColorStop(1, `rgba(${P.a},${a})`); c.fillStyle = gr; c.fillRect(s.x - ww / 2, s.y - h, ww, h); c.globalAlpha = a; c.fillStyle = '#fff'; c.fillRect(s.x - ww * .12, s.y - h, ww * .24, h); } }); blobs(x, y, o.pal || 'holy', 16, { r: 20, s1: 120, vy: -80, z1: 26 }); FX.flashLight(x, y, 260, P.l, 1.2, o.life || .7); };
  E.warn = (x, y, r, life, o = {}) => { FX.shape({ x, y, life, draw(c, s, t) { c.globalCompositeOperation = 'source-over'; c.globalAlpha = .18 + .11 * Math.sin(t * 30) + t * .25; c.fillStyle = o.col || '#ff3030'; c.beginPath(); c.ellipse(s.x, s.y, r, r * .75, 0, 0, TAU); c.fill(); c.globalAlpha = .7; c.strokeStyle = o.col || '#ff5050'; c.lineWidth = 2; c.stroke(); c.globalAlpha = .5; c.beginPath(); c.ellipse(s.x, s.y, r * t, r * t * .75, 0, 0, TAU); c.stroke(); } }); };
  FX.smokePuff = smokePuff; FX.burst = burst; FX.blobs = blobs;
})(window.SK);
