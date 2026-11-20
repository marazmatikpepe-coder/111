'use strict';
(function (SK) {
  const $ = id => document.getElementById(id);
  SK.canvas = $('game'); SK.ctx = SK.canvas.getContext('2d');
  async function boot() {
    const A = SK.A, bar = $('lbar'), txt = $('ltxt');
    const first = ['assets/ui/logo.png']; const tb = A.byName('tex', 'каменные кирпичи'), tl = A.byName('tex', 'бревно - боковая поверхность'); if (tb) first.push('assets/tex/' + tb + '.webp'); if (tl) first.push('assets/tex/' + tl + '.webp');
    let n = 0; await Promise.all(first.map(p => A.load(p).then(() => { n++; bar.style.width = (n / first.length * 100) + '%'; })));
    txt.textContent = 'Готово'; SK.Audio.init();
    const startMusic = () => { SK.Audio.init(); SK.Audio.resume(); const f = SK.menu.musicFile(); if (f && SK.menu.active) SK.Audio.playMusic(f, { vol: .8, fade: 3 }); };
    addEventListener('pointerdown', startMusic, { once: true }); addEventListener('keydown', startMusic, { once: true });
    setTimeout(() => { $('loading').classList.remove('show'); SK.menu.show('menu'); startMusic(); }, 250);
    requestAnimationFrame(SK.loop);
  }
  boot();
})(window.SK);
