'use strict';
window.SK = window.SK || {};
(function (SK) {
  const U = SK.U = {
    clamp: (v, a, b) => v < a ? a : v > b ? b : v,
    lerp: (a, b, t) => a + (b - a) * t,
    rnd: (a = 0, b = 1) => a + Math.random() * (b - a),
    rint: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: (a) => a[Math.floor(Math.random() * a.length)],
    dist: (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by),
    ang: (ax, ay, bx, by) => Math.atan2(by - ay, bx - ax),
    ease: (t) => t * t * (3 - 2 * t),
    seedRand(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; },
    hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; },
    rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, n >> 8 & 255, n & 255]; }
  };
  SK.Noise = function (seed) {
    const r = U.seedRand(seed), P = new Float32Array(1024); for (let i = 0; i < 1024; i++) P[i] = r();
    const f = (x, y) => P[((x * 73856093) ^ (y * 19349663)) & 1023];
    const sm = t => t * t * (3 - 2 * t);
    const n = (x, y) => { const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
      const a = f(xi, yi), b = f(xi + 1, yi), c = f(xi, yi + 1), d = f(xi + 1, yi + 1); return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf; };
    n.fbm = (x, y, o = 4) => { let s = 0, a = .5, fr = 1, t = 0; for (let i = 0; i < o; i++) { s += n(x * fr, y * fr) * a; t += a; a *= .5; fr *= 2; } return s / t; };
    return n;
  };
  const DEF = {
    vol: { master: .8, music: .7, sfx: .9, amb: .7 },
    gfx: { fullscreen: false, scale: 1, fx: 2, shake: 1, fps: 0, lights: true, fov: 1 },
    keys: { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyJ', dash: 'Space', interact: 'KeyE', place: 'KeyF', inv: 'Tab', pause: 'Escape', craft: 'KeyC', map: 'KeyM' },
    pad: { attack: 2, dash: 0, interact: 3, place: 1, inv: 6, pause: 9, deadzone: .22 },
    name: 'Странник'
  };
  SK.settings = (() => { let s; try { s = JSON.parse(localStorage.getItem('skverna.settings') || 'null'); } catch (e) { } const m = (d, s) => { const o = {}; for (const k in d) o[k] = (d[k] && typeof d[k] === 'object') ? m(d[k], s && s[k]) : (s && s[k] !== undefined ? s[k] : d[k]); return o; }; return m(DEF, s); })();
  SK.saveSettings = () => { try { localStorage.setItem('skverna.settings', JSON.stringify(SK.settings)); } catch (e) { } };
  const In = SK.Input = { keys: {}, hit: {}, mouse: { x: 0, y: 0, b: [false, false, false] }, pad: null, ax: 0, ay: 0, ax2: 0, ay2: 0, act: {}, pact: {}, listening: null };
  addEventListener('keydown', e => {
    if (In.listening) { e.preventDefault(); const cb = In.listening; In.listening = null; cb(e.code); return; }
    if (e.target.tagName === 'INPUT') return;
    In.keys[e.code] = true; In.hit[e.code] = true; if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', e => { In.keys[e.code] = false; });
  addEventListener('blur', () => { In.keys = {}; In.mouse.b = [false, false, false]; });
  addEventListener('mousemove', e => { In.mouse.x = e.clientX; In.mouse.y = e.clientY; });
  addEventListener('mousedown', e => { if (e.target.closest && e.target.closest('.panel,button,input,select')) return; In.mouse.b[e.button] = true; });
  addEventListener('mouseup', e => { In.mouse.b[e.button] = false; });
  addEventListener('contextmenu', e => { if (!(e.target.closest && e.target.closest('#invgrid'))) e.preventDefault(); });
  In.update = function () {
    const S = SK.settings, k = S.keys, g = navigator.getGamepads ? navigator.getGamepads() : [], p = (() => { for (const x of g) if (x && x.connected) return x; return null; })();
    In.pad = p; const dz = S.pad.deadzone;
    let ax = (In.keys[k.right] ? 1 : 0) - (In.keys[k.left] ? 1 : 0), ay = (In.keys[k.down] ? 1 : 0) - (In.keys[k.up] ? 1 : 0);
    if (In.keys.ArrowRight) ax = 1; if (In.keys.ArrowLeft) ax = -1; if (In.keys.ArrowUp) ay = -1; if (In.keys.ArrowDown) ay = 1;
    const pb = i => p && p.buttons[i] && p.buttons[i].pressed;
    if (p) { const gx = p.axes[0] || 0, gy = p.axes[1] || 0; if (Math.hypot(gx, gy) > dz) { ax = gx; ay = gy; } if (pb(14)) ax = -1; if (pb(15)) ax = 1; if (pb(12)) ay = -1; if (pb(13)) ay = 1; }
    const l = Math.hypot(ax, ay); if (l > 1) { ax /= l; ay /= l; } In.ax = ax; In.ay = ay;
    In.pact = In.act; const a = {};
    for (const n of ['attack', 'dash', 'interact', 'place', 'inv', 'pause', 'craft', 'map']) a[n] = !!In.keys[k[n]] || !!In.hit[k[n]] || !!pb(S.pad[n]);
    a.attack = a.attack || In.mouse.b[0]; a.place = a.place || In.mouse.b[2];
    for (let i = 1; i <= 9; i++) a['slot' + i] = !!In.keys['Digit' + i] || !!In.hit['Digit' + i];
    In.hit = {};
    In.act = a; if (p) { const rx = p.axes[2] || 0, ry = p.axes[3] || 0; In.ax2 = Math.abs(rx) > dz ? rx : 0; In.ay2 = Math.abs(ry) > dz ? ry : 0; } else { In.ax2 = In.ay2 = 0; }
  };
  In.down = n => !!In.act[n];
  In.pressed = n => !!In.act[n] && !In.pact[n];
  const A = SK.A = { cache: {} };
  A.img = function (path) { let c = A.cache[path]; if (c) return c; const im = new Image(); im.src = path; im.ok = false; im.onload = () => { im.ok = true; }; A.cache[path] = im; return im; };
  A.load = function (path) { return new Promise(res => { const im = A.img(path); if (im.ok || (im.complete && im.naturalWidth)) { im.ok = true; return res(im); } const f = () => { im.ok = !!im.naturalWidth; res(im); }; im.addEventListener('load', f); im.addEventListener('error', f); }); };
  A.mob = k => A.img('assets/mobs/' + k + '.webp');
  A.boss = k => A.img('assets/bosses/' + k + '.webp');
  A.npc = k => A.img('assets/npc/' + k + '.webp');
  A.obj = k => A.img('assets/obj/' + k + '.webp');
  A.tex = k => A.img('assets/tex/' + k + '.webp');
  SK.ev = { l: {}, on(n, f) { (this.l[n] = this.l[n] || []).push(f); }, emit(n, ...a) { (this.l[n] || []).forEach(f => f(...a)); } };
  SK.time = { t: 0, dt: 0, scale: 1, freeze: 0 };
})(window.SK);
