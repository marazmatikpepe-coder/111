'use strict';
(function (SK) {
  const A = SK.A, U = SK.U, D = SK.D;
  const TS = 64, RISE = 26; SK.TS = TS;
  // [объект, высота px, радиус, hp, тип, дроп, вес]
  const PS = {
    forest: [['береза1', 250, 16, 6, 'tree', 'wood', 3], ['береза2', 240, 16, 6, 'tree', 'wood', 3], ['береза3', 230, 16, 6, 'tree', 'wood', 3], ['дерево1', 270, 18, 7, 'tree', 'wood', 4], ['дерево 2', 280, 18, 7, 'tree', 'wood', 3], ['дерево 3', 260, 18, 7, 'tree', 'wood', 3], ['дерево 4', 270, 18, 7, 'tree', 'wood', 3], ['дерево 5', 300, 20, 8, 'tree', 'wood', 2],
      ['куст красных ягод', 70, 12, 2, 'bush', 'berry_red', 2], ['куст синих ягод', 70, 12, 2, 'bush', 'berry_blue', 2], ['папоротник', 56, 0, 1, 'grass', 'fibre', 3], ['камень1', 52, 14, 5, 'rock', 'stone', 1.5], ['камень3', 60, 15, 5, 'rock', 'stone', 1], ['гигантский камень', 120, 30, 9, 'rock', 'stone', .3], ['коряга1', 70, 14, 4, 'tree', 'wood', 1]],
    desert: [['кактус 1', 120, 12, 3, 'cactus', 'fibre', 3], ['кактус2', 110, 12, 3, 'cactus', 'fibre', 3], ['кактус3', 100, 12, 3, 'cactus', 'fibre', 3], ['мертвое дерево', 220, 14, 5, 'tree', 'stick', 2], ['камень2', 54, 14, 5, 'rock', 'stone', 2], ['камень4', 60, 15, 5, 'rock', 'stone', 2], ['алоэ', 56, 0, 1, 'grass', 'fibre', 2], ['камень5', 50, 12, 4, 'rock', 'stone', 1], ['кость', 36, 0, 1, 'grass', 'bone', .5]],
    tundra: [['ель', 280, 14, 6, 'tree', 'wood', 4], ['великанская ель', 340, 18, 8, 'tree', 'wood', 1.5], ['мертвое дерево', 220, 14, 5, 'tree', 'stick', 1], ['камень6', 52, 14, 5, 'rock', 'stone', 2], ['камень1', 56, 14, 5, 'rock', 'stone', 1], ['куст горных ягод', 66, 12, 2, 'bush', 'berry_blue', 1]],
    waste: [['мертвое дерево', 230, 14, 5, 'tree', 'stick', 3], ['коряга1', 80, 14, 4, 'tree', 'stick', 2], ['ржавый лом', 50, 12, 3, 'rock', 'scrap', 1.5], ['камень4', 60, 15, 5, 'rock', 'stone', 2], ['кость', 40, 0, 1, 'grass', 'bone', 1.5], ['камень5', 56, 14, 5, 'rock', 'stone', 2]]
  };
  const STRUCT = {
    pyramid: ['Песчаная пирамида', 640, 150], village: ['Песчаная деревня дом', 230, 70], oasis: ['оазис стоянка', 230, 60], citadel: ['Цитадель Мороза', 580, 130], kurgan: ['Ледяной курган', 310, 90],
    castle: ['замок разбойников', 540, 130], ruins: ['Захваченные руины', 310, 90], shrine: ['святилище арунгатанга', 480, 110], hut: ['хижина лесника', 200, 60], mega: ['круг мегалитов', 270, 80], witch: ['логово ведьмы', 250, 70]
  };
  const DROPS = { wood: [2, 4], stone: [1, 3], fibre: [1, 2], stick: [1, 3], berry_red: [1, 3], berry_blue: [1, 3], bone: [1, 1], scrap: [1, 2], mushroom: [1, 2] };
  SK.World = class World {
    constructor(seed, name) {
      this.seed = seed >>> 0; this.name = name || 'Мир'; this.w = 256; this.h = 256; this.tiles = new Uint8Array(this.w * this.h); this.biome = new Uint8Array(this.w * this.h);
      this.props = []; this.grid = new Map(); this.dmg = new Map(); this.edits = new Map(); this.time = 0.28; this.day = 1; this.structs = []; this.bossDone = {}; this.dead = new Set();
      this.bnames = ['forest', 'desert', 'tundra', 'waste']; this.gen();
    }
    idx(x, y) { return y * this.w + x; }
    gkey(cx, cy) { return cx * 4096 + cy; }
    gen() {
      const S = this.seed, nA = SK.Noise(S), nB = SK.Noise(S + 11), nC = SK.Noise(S + 22), nD = SK.Noise(S + 33), nOre = SK.Noise(S + 44), nE = SK.Noise(S + 55), W = this.w, H = this.h;
      const bi = (x, y) => { const wx = nA.fbm(x * .02, y * .02, 3) * 40 - 20, wy = nB.fbm(x * .02 + 9, y * .02, 3) * 40 - 20, px = x + wx, py = y + wy;
        if (py < H * .26) return 2; if (px > W * .64) return 1; if (py > H * .74 || px < W * .17) return 3; return 0; };
      const ores = [['ore_coal', .50, 0], ['ore_copper', .60, 3], ['ore_iron', .62, 4], ['ore_gold', .70, 5], ['ore_silver', .72, 5], ['ore_titan', .78, 7], ['ore_rustore', .66, 6]];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const b = bi(x, y), i = this.idx(x, y); this.biome[i] = b; const B = D.biomes[this.bnames[b]];
        const r = nC(x * .15, y * .15), tn = B.tiles[Math.min(B.tiles.length - 1, (r * B.tiles.length) | 0)];
        let t = D.tid[tn];
        const m = nD.fbm(x * .05, y * .05, 4), edge = Math.min(x, y, W - 1 - x, H - 1 - y), dc = Math.hypot(x - W / 2, y - H / 2);
        if ((m > .6 && dc > 14) || edge < 3) {
          const fam = b === 1 ? ['sandstone', 'sandstone', 'redsandstone', 'smoothsand'] : b === 2 ? ['stone', 'ice', 'stone', 'granite'] : b === 3 ? ['deepslate', 'stone', 'basalt', 'deepslate'] : ['stone', 'granite', 'diorite', 'andesite'];
          t = D.tid[fam[Math.min(3, (nE(x * .2, y * .2) * 4) | 0)]]; if (edge < 3) t = D.tid.deepslate;
          if (m > .66) { const on = nOre(x * .35, y * .35); for (const o of ores) { if (on > o[1] && nOre(x * .8 + o[2] * 50, y * .8) > .66 - (m - .66)) { t = D.tid[o[0]]; break; } } }
        }
        this.tiles[i] = t;
      }
      const sx = W >> 1, sy = H >> 1; this.spawn = { x: sx * TS + TS / 2, y: sy * TS + TS / 2 }; this.clear(sx, sy, 6, 'grass');
      const place = (key, b, cx, cy) => { const s = STRUCT[key], k = A.byName('obj', s[0]); if (!k) return; this.clear(cx, cy, 9, D.biomes[this.bnames[b]].tiles[0]);
        return this.addProp({ k, x: cx * TS + TS / 2, y: cy * TS + TS, h: s[1], r: s[2], hp: 9999, type: 'struct', name: s[0] }); };
      this.altars = [];
      for (const a of [['pyramid', 1, .84, .5, 'pharaoh'], ['citadel', 2, .5, .1, 'frost'], ['castle', 3, .5, .92, 'bandit'], ['shrine', 0, .3, .38, 'arngutang']]) { const cx = (W * a[2]) | 0, cy = (H * a[3]) | 0; place(a[0], a[1], cx, cy); this.altars.push({ boss: a[4], x: cx * TS + TS / 2, y: (cy + 4) * TS + TS / 2 }); this.clear(cx, cy + 4, 7, D.biomes[this.bnames[a[1]]].tiles[0]); }
      for (const s of [['village', 1, .72, .62], ['oasis', 1, .78, .3], ['kurgan', 2, .25, .12], ['ruins', 3, .3, .86], ['hut', 0, .62, .5], ['mega', 0, .42, .6], ['witch', 0, .3, .55]]) { const cx = (W * s[2]) | 0, cy = (H * s[3]) | 0; if (this.biome[this.idx(cx, cy)] !== s[1]) continue; place(s[0], s[1], cx, cy); }
      const r2 = U.seedRand(S + 123), cell = 56, occ = new Map();
      const near = (x, y, d) => { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = occ.get(((x / cell | 0) + a) * 4096 + (y / cell | 0) + b); if (l) for (const q of l) if (Math.hypot(q[0] - x, q[1] - y) < d) return true; } return false; };
      const reg = (x, y) => { const k = ((x / cell) | 0) * 4096 + ((y / cell) | 0); (occ.get(k) || occ.set(k, []).get(k)).push([x, y]); };
      for (const p of this.props) reg(p.x, p.y);
      const N = (W * H) / 6;
      for (let n = 0; n < N; n++) {
        const tx = 2 + (r2() * (W - 4)) | 0, ty = 2 + (r2() * (H - 4)) | 0, t = D.tiles[this.tiles[this.idx(tx, ty)]]; if (t.solid || t.id === 'hole') continue;
        const b = this.biome[this.idx(tx, ty)], bn = this.bnames[b], list = PS[bn]; if (!list) continue;
        const dense = nA.fbm(tx * .06 + 50, ty * .06, 3); if (r2() > (bn === 'forest' ? .22 + dense * .5 : bn === 'desert' ? .1 : bn === 'tundra' ? .16 : .09) * 1.5) continue;
        if (Math.hypot(tx - sx, ty - sy) < 6) continue;
        let tot = 0; for (const e of list) tot += e[6]; let q = r2() * tot, e = list[0]; for (const c of list) { q -= c[6]; if (q <= 0) { e = c; break; } }
        const k = A.byName('obj', e[0]); if (!k) continue; const x = tx * TS + 10 + r2() * (TS - 20), y = ty * TS + TS - 6 - r2() * 8; if (near(x, y, e[4] === 'tree' ? 70 : 34)) continue;
        const sc = .85 + r2() * .3; this.addProp({ k, x, y, h: e[1] * sc, r: e[2], hp: e[3], type: e[4], drop: e[5], flip: r2() < .5, ph: r2() * 6.28 }); reg(x, y);
      }
    }
    clear(cx, cy, r, tileId) { const t = D.tid[tileId]; for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) { if (x < 1 || y < 1 || x >= this.w - 1 || y >= this.h - 1) continue; if (Math.hypot(x - cx, y - cy) <= r) this.tiles[this.idx(x, y)] = t; }
      for (let i = this.props.length - 1; i >= 0; i--) { const p = this.props[i]; if (!p.dead && p.type !== 'struct' && Math.hypot(p.x / TS - cx, p.y / TS - cy) < r + 1) this.removeProp(p); } }
    addProp(p) { p.id = this.props.length; p.maxhp = p.hp; p.sh = 0; p.ph = p.ph || 0; this.props.push(p); const c = this.gkey((p.x / 256) | 0, (p.y / 256) | 0); let l = this.grid.get(c); if (!l) this.grid.set(c, l = []); l.push(p); return p; }
    removeProp(p) { p.dead = true; const l = this.grid.get(this.gkey((p.x / 256) | 0, (p.y / 256) | 0)); if (l) { const i = l.indexOf(p); if (i >= 0) l.splice(i, 1); } }
    propsIn(x0, y0, x1, y1) { const o = []; for (let cx = Math.floor(x0 / 256); cx <= Math.floor(x1 / 256); cx++) for (let cy = Math.floor(y0 / 256); cy <= Math.floor(y1 / 256); cy++) { const l = this.grid.get(this.gkey(cx, cy)); if (l) for (const p of l) o.push(p); } return o; }
    tile(tx, ty) { if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return D.tiles[D.tid.deepslate]; return D.tiles[this.tiles[ty * this.w + tx]]; }
    setTile(tx, ty, id) { if (tx < 1 || ty < 1 || tx >= this.w - 1 || ty >= this.h - 1) return; const v = typeof id === 'number' ? id : D.tid[id]; this.tiles[ty * this.w + tx] = v; this.edits.set(ty * this.w + tx, v); this.dmg.delete(ty * this.w + tx); }
    biomeAt(px, py) { const tx = U.clamp(px / TS | 0, 0, this.w - 1), ty = U.clamp(py / TS | 0, 0, this.h - 1); return this.bnames[this.biome[ty * this.w + tx]]; }
    move(e, dx, dy, r) {
      const tryAxis = (nx, ny) => {
        const x0 = Math.floor((nx - r) / TS), x1 = Math.floor((nx + r) / TS), y0 = Math.floor((ny - r * .6) / TS), y1 = Math.floor((ny + r * .35) / TS);
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (this.tile(tx, ty).solid) { const cx = U.clamp(nx, tx * TS, tx * TS + TS), cy = U.clamp(ny, ty * TS, ty * TS + TS); if (Math.hypot(nx - cx, (ny - cy) / .6) < r) return true; }
        if (e.ghost) return false;
        for (const p of this.propsIn(nx - 220, ny - 220, nx + 220, ny + 80)) { if (!p.r || p.dead) continue;
          if (p.type === 'struct') { if (Math.abs(nx - p.x) < p.r * 1.1 && ny > p.y - 70 && ny < p.y + 4) return true; } else if (Math.hypot(nx - p.x, (ny - p.y) / .75) < p.r + r * .7) return true; }
        return false; };
      let hit = false; if (dx) { if (!tryAxis(e.x + dx, e.y)) e.x += dx; else hit = true; } if (dy) { if (!tryAxis(e.x, e.y + dy)) e.y += dy; else hit = true; }
      e.x = U.clamp(e.x, TS * 2, (this.w - 2) * TS); e.y = U.clamp(e.y, TS * 2, (this.h - 2) * TS); return hit;
    }
    hitTile(tx, ty, power, tier) {
      const t = this.tile(tx, ty), k = ty * this.w + tx; if (!t.solid && t.id === 'hole') return null;
      if (t.solid && t.tier > tier) return { weak: true, t };
      const d = (this.dmg.get(k) || 0) + power / (t.hard || .5); this.dmg.set(k, d);
      if (d >= 1) { this.dmg.delete(k); const out = { broke: true, t }; const b = this.biome[k]; if (t.solid) this.setTile(tx, ty, t.id.startsWith('ore_') ? 'basalt' : (b === 1 ? 'sand' : b === 2 ? 'snow' : b === 3 ? 'basalt' : 'dirt')); else this.setTile(tx, ty, 'hole'); return out; }
      return { broke: false, t, prog: d };
    }
    bright(im) { if (im._b) return im._b; const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const g = c.getContext('2d'); g.drawImage(im, 0, 0); let L = .5; try { const d = g.getImageData(0, 0, c.width, c.height).data; let s = 0, n = 0; for (let i = 0; i < d.length; i += 4 * 97) { s += (d[i] * .3 + d[i + 1] * .59 + d[i + 2] * .11) / 255; n++; } L = s / n; } catch (e) { } const f = Math.min(1.55, Math.max(1, .42 / Math.max(.05, L))); if (f > 1.02) { g.filter = `brightness(${f}) contrast(1.04) saturate(1.12)`; g.clearRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0); } return im._b = c; }
    drawGround(ctx, x0, y0, x1, y1) {
      const tc = this._tc || (this._tc = {});
      for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
        const t = this.tile(tx, ty); if (t.solid) continue; let im = tc[t.i]; if (im === undefined) { const k = A.byName('tex', t.tex); im = tc[t.i] = k ? A.tex(k) : null; }
        const x = tx * TS, y = ty * TS; if (!im || !im.ok) { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x, y, TS, TS); continue; }
        const fl = ((tx * 7 + ty * 13) & 3); ctx.drawImage(this.bright(im), x, y, TS + 1, TS + 1);
        if (t.id === 'hole') { ctx.fillStyle = 'rgba(0,0,0,.55)'; ctx.fillRect(x, y, TS, TS); ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(x, y, TS, 10); }
        if (fl === 0) { ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(x, y, TS, TS); } else if (fl === 1) { ctx.fillStyle = 'rgba(255,255,255,.035)'; ctx.fillRect(x, y, TS, TS); }
        ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(x, y + TS - 2, TS, 2);
      }
    }
    drawSolidRow(ctx, ty, x0, x1) {
      const tc = this._tc || (this._tc = {}), oc = this._oc || (this._oc = {});
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.tile(tx, ty); if (!t.solid) continue; let im = tc[t.i]; if (im === undefined) { const k = A.byName('tex', t.tex); im = tc[t.i] = k ? A.tex(k) : null; } const x = tx * TS, y = ty * TS - RISE; if (!im || !im.ok) { ctx.fillStyle = '#555'; ctx.fillRect(x, y, TS, TS + RISE); continue; }
        const bi = this.bright(im); ctx.drawImage(bi, 0, bi.height * .55, bi.width, bi.height * .45, x, y + TS, TS + 1, RISE); ctx.fillStyle = 'rgba(0,0,0,.42)'; ctx.fillRect(x, y + TS, TS + 1, RISE);
        ctx.drawImage(bi, x, y, TS + 1, TS + 1); ctx.fillStyle = 'rgba(255,255,255,.07)'; ctx.fillRect(x, y, TS, 2); ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(x + TS - 2, y, 2, TS);
        if (t.ore) { let o = oc[t.i]; if (o === undefined) { const k = A.byName('obj', t.ore); o = oc[t.i] = k ? A.obj(k) : null; } if (o && o.ok) ctx.drawImage(o, x - 2, y - 2, TS + 4, TS + 4); }
        const dm = this.dmg.get(ty * this.w + tx); if (dm) { ctx.strokeStyle = 'rgba(0,0,0,.65)'; ctx.lineWidth = 2; ctx.beginPath(); const n = Math.ceil(dm * 7), r = U.seedRand(tx * 977 + ty); for (let i = 0; i < n; i++) { const ax = x + r() * TS, ay = y + r() * TS; ctx.moveTo(ax, ay); ctx.lineTo(ax + (r() - .5) * 26, ay + (r() - .5) * 26); } ctx.stroke(); }
      }
    }
    drawProp(ctx, p, t) {
      const im = A.obj(p.k); if (!im.ok) return; const h = p.h, w = h * im.naturalWidth / im.naturalHeight; ctx.save(); ctx.translate(p.x, p.y);
      ctx.globalAlpha = .28; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, Math.min(w * .32, 70), Math.min(w * .1, 22), 0, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
      let sway = 0; if (p.type === 'tree' || p.type === 'bush' || p.type === 'grass' || p.type === 'cactus') sway = Math.sin(t * 1.3 + p.ph) * (p.type === 'tree' ? .018 : .04) + (p.sh > 0 ? Math.sin(p.sh * 60) * p.sh * .6 : 0);
      ctx.transform(1, 0, sway, 1, 0, 0); if (p.flip) ctx.scale(-1, 1); if (p.sh > 0) p.sh = Math.max(0, p.sh - .016);
      ctx.drawImage(im, -w / 2, -h, w, h); ctx.restore();
    }
  };
  SK.PS = PS; SK.STRUCT = STRUCT; SK.RISE = RISE; SK.DROPS = DROPS;
})(window.SK);
