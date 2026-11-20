'use strict';
(function (SK) {
  const U = SK.U;
  const Au = SK.Audio = {
    ctx: null, bus: {}, buf: {}, pending: {}, music: null, amb: {}, ok: false, lastPlay: {},
    init() {
      if (Au.ctx) return; try {
        const C = window.AudioContext || window.webkitAudioContext; Au.ctx = new C(); const c = Au.ctx;
        const m = c.createGain(); const comp = c.createDynamicsCompressor(); m.connect(comp); comp.connect(c.destination); Au.bus.master = m;
        for (const n of ['music', 'sfx', 'amb']) { const g = c.createGain(); g.connect(m); Au.bus[n] = g; }
        Au.ok = true; Au.applyVol();
      } catch (e) { console.warn('audio off', e); }
    },
    resume() { if (Au.ctx && Au.ctx.state === 'suspended') Au.ctx.resume(); },
    applyVol() { if (!Au.ok) return; const v = SK.settings.vol; Au.bus.master.gain.value = v.master; Au.bus.music.gain.value = v.music; Au.bus.sfx.gain.value = v.sfx; Au.bus.amb.gain.value = v.amb; },
    async load(path) {
      if (Au.buf[path]) return Au.buf[path]; if (Au.pending[path]) return Au.pending[path];
      return Au.pending[path] = (async () => { try { const r = await fetch(path); const ab = await r.arrayBuffer(); const b = await Au.ctx.decodeAudioData(ab); Au.buf[path] = b; return b; } catch (e) { Au.buf[path] = null; return null; } finally { delete Au.pending[path]; } })();
    },
    files(key) { const e = window.SK_AUD && SK_AUD[key]; return e ? e.files : null; },
    has(key) { return !!(window.SK_AUD && SK_AUD[key]); },
    preload(keys) { if (!Au.ok) return; for (const k of keys) { const f = Au.files(k); if (f) f.forEach(x => Au.load('assets/audio/' + x)); } },
    sfx(key, o = {}) {
      if (!Au.ok) return null; const f = Au.files(key); if (!f) return null;
      const now = performance.now(); if (now - (Au.lastPlay[key] || 0) < (o.gap || 40)) return null; Au.lastPlay[key] = now;
      const path = 'assets/audio/' + (o.variant != null ? f[o.variant % f.length] : U.pick(f)); const b = Au.buf[path];
      if (b === undefined) { Au.load(path); return null; } if (!b) return null;
      let vol = o.vol == null ? 1 : o.vol, pan = 0;
      if (o.x != null && SK.cam) { const dx = o.x - SK.cam.x, dy = o.y - SK.cam.y, d = Math.hypot(dx, dy), R = o.range || 900; if (d > R) return null; vol *= 1 - d / R; pan = U.clamp(dx / (R * .6), -1, 1); }
      const c = Au.ctx, s = c.createBufferSource(); s.buffer = b; const pj = o.pitch == null ? .08 : o.pitch; s.playbackRate.value = (o.rate || 1) * (1 + U.rnd(-pj, pj));
      const g = c.createGain(); g.gain.value = vol; let last = g; if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); last = p; }
      s.connect(g); last.connect(Au.bus[o.bus || 'sfx']); s.start(); return s;
    },
    async playMusic(file, o = {}) {
      if (!Au.ok || !file) return; if (Au.music && Au.music.file === file) return;
      const path = 'assets/audio/' + file; const old = Au.music; const c = Au.ctx; Au.music = { file, src: null, g: null, t0: 0, loop: o.loop !== false };
      const me = Au.music; const b = await Au.load(path); if (!b || Au.music !== me) return;
      const g = c.createGain(); g.gain.value = 0; g.connect(Au.bus.music); const s = c.createBufferSource(); s.buffer = b; s.loop = me.loop;
      s.connect(g); s.start(); me.src = s; me.g = g; me.t0 = c.currentTime; me.dur = b.duration; const fi = o.fade == null ? 1.5 : o.fade; g.gain.linearRampToValueAtTime(o.vol == null ? 1 : o.vol, c.currentTime + fi);
      if (old && old.g) { const t = c.currentTime; old.g.gain.cancelScheduledValues(t); old.g.gain.setValueAtTime(old.g.gain.value, t); old.g.gain.linearRampToValueAtTime(0, t + fi); setTimeout(() => { try { old.src.stop(); } catch (e) { } }, fi * 1000 + 100); }
    },
    stopMusic(fade = 1) { const m = Au.music; if (!m || !m.g) { Au.music = null; return; } const c = Au.ctx, t = c.currentTime; m.g.gain.cancelScheduledValues(t); m.g.gain.setValueAtTime(m.g.gain.value, t); m.g.gain.linearRampToValueAtTime(0, t + fade); const s = m.src; setTimeout(() => { try { s.stop(); } catch (e) { } }, fade * 1000 + 100); Au.music = null; },
    musicTime() { const m = Au.music; return m && m.src && Au.ctx ? (Au.ctx.currentTime - m.t0) : 0; },
    beatIn(bpm) { const T = 60 / bpm, t = Au.musicTime(); return T - (t % T); },
    setAmbience(map) {
      if (!Au.ok) return; const c = Au.ctx;
      for (const k in map) { let a = Au.amb[k]; const v = map[k]; if (!a) { if (v <= 0.01) continue; const f = Au.files(k); if (!f) continue; a = Au.amb[k] = { g: c.createGain(), src: null }; a.g.gain.value = 0; a.g.connect(Au.bus.amb);
          Au.load('assets/audio/' + U.pick(f)).then(b => { if (!b) return; const s = c.createBufferSource(); s.buffer = b; s.loop = true; s.connect(a.g); s.start(0, Math.random() * b.duration); a.src = s; }); } }
      for (const k in Au.amb) { const a = Au.amb[k]; const t = map[k] || 0; a.g.gain.value += (t - a.g.gain.value) * .03; }
    },
    stopAmbience() { for (const k in Au.amb) { try { Au.amb[k].src && Au.amb[k].src.stop(); } catch (e) { } } Au.amb = {}; }
  };
})(window.SK);
