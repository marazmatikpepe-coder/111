'use strict';
(function (SK) {
  const U = SK.U, A = SK.A, FX = SK.FX, In = SK.Input, D = SK.D, TAU = Math.PI * 2;
  const $ = id => document.getElementById(id), qa = s => document.querySelectorAll(s);
  const M = SK.menu = { active: true, t: 0, gust: 0, gustT: 6, fl: 1, mx: 0, my: 0, screen: 'menu', ret: 'menu' };
  const nz = SK.Noise(7);
  function flame(ctx, x, y, w, h, t, i, s) {
    const sw = Math.sin(t * 3.1 + i * 1.7) * w * .38 + Math.sin(t * 7.3 + i) * w * .12, tipx = x + sw, tipy = y - h * (.88 + Math.sin(t * 4.7 + i * 2.3) * .12);
    const g = ctx.createLinearGradient(x, y, tipx, tipy); g.addColorStop(0, 'rgba(255,245,190,.95)'); g.addColorStop(.35, 'rgba(255,170,50,.8)'); g.addColorStop(.75, 'rgba(210,60,12,.45)'); g.addColorStop(1, 'rgba(120,20,5,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.bezierCurveTo(x - w * .75 + sw * .3, y - h * .35, x - w * .25 + sw * .7, y - h * .7, tipx, tipy); ctx.bezierCurveTo(x + w * .3 + sw * .6, y - h * .65, x + w * .8 + sw * .2, y - h * .3, x + w / 2, y); ctx.closePath(); ctx.fill();
  }
  M.frame = function (dt, ctx, W, H) {
    M.t += dt; const t = M.t, s = Math.max(W / 1600, H / 900), cx = W / 2 + (M.mx - .5) * -26 * s, fy = H * .79 + (M.my - .5) * -12 * s;
    // мерцание: дыхание + рваные провалы и вспышки
    M.gustT -= dt; if (M.gustT <= 0) { M.gust = U.rnd(.5, 1.3); M.gustT = U.rnd(4, 11); } M.gust = Math.max(0, M.gust - dt);
    const nv = nz(t * 9, 3) - .5, breath = .5 + .5 * Math.sin(t * .55), f = Math.max(.12, (.55 + .22 * Math.sin(t * 2.3) + .1 * Math.sin(t * 5.7 + 1) + nv * .35) * (.45 + .55 * Math.pow(breath, .6)) * (M.gust > 0 ? .3 + .7 * (1 - Math.sin(Math.min(1, M.gust) * Math.PI)) : 1)); M.fl = U.lerp(M.fl, f, Math.min(1, dt * 14));
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#040306'; ctx.fillRect(0, 0, W, H);
    // стена из кирпича
    const bk = A.byName('tex', 'каменные кирпичи'), im = bk ? A.tex(bk) : null, T = 230 * s;
    if (im && im.ok) { for (let y = -((M.my - .5) * -10 * s % T); y < H; y += T) for (let x = -(T / 2 - (M.mx - .5) * -14 * s); x < W; x += T) ctx.drawImage(im, x, y, T + 1, T + 1); ctx.fillStyle = 'rgba(8,6,10,.55)'; ctx.fillRect(0, 0, W, H); }
    // очаг
    const ow = 620 * s, oh = 470 * s, ox = cx - ow / 2, oy = fy - oh + 40 * s;
    ctx.save(); ctx.fillStyle = '#17120f'; ctx.strokeStyle = '#030203'; ctx.lineWidth = 5 * s;
    const fr = 70 * s; ctx.fillStyle = 'rgba(30,24,22,.97)'; ctx.fillRect(ox - fr, oy - fr * 1.1, ow + fr * 2, oh + fr * 1.1 + 60 * s); // каменная рама
    if (im && im.ok) { ctx.globalAlpha = .75; ctx.drawImage(im, 0, 0, im.naturalWidth, im.naturalHeight * .6, ox - fr, oy - fr * 1.1, ow + fr * 2, oh + fr * 1.1 + 60 * s); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(ox - fr, oy - fr * 1.1, ow + fr * 2, oh + fr * 1.1 + 60 * s); }
    ctx.strokeRect(ox - fr, oy - fr * 1.1, ow + fr * 2, oh + fr * 1.1 + 60 * s);
    ctx.fillStyle = '#26201c'; ctx.fillRect(ox - fr - 26 * s, oy - fr * 1.1 - 34 * s, ow + (fr + 26 * s) * 2, 36 * s); ctx.strokeRect(ox - fr - 26 * s, oy - fr * 1.1 - 34 * s, ow + (fr + 26 * s) * 2, 36 * s);
    ctx.beginPath(); ctx.moveTo(ox, oy + oh + 60 * s); ctx.lineTo(ox, oy + 120 * s); ctx.quadraticCurveTo(ox, oy, cx, oy); ctx.quadraticCurveTo(ox + ow, oy, ox + ow, oy + 120 * s); ctx.lineTo(ox + ow, oy + oh + 60 * s); ctx.closePath(); const sg = ctx.createRadialGradient(cx, fy, 20, cx, fy - 100 * s, ow * .75); sg.addColorStop(0, '#2a1208'); sg.addColorStop(.5, '#0a0605'); sg.addColorStop(1, '#020102'); ctx.fillStyle = sg; ctx.fill(); ctx.stroke(); ctx.restore();
    // поленья
    const lg = A.byName('tex', 'бревно - боковая поверхность'), li = lg ? A.tex(lg) : null; ctx.save(); ctx.translate(cx, fy + 8 * s);
    for (const [a, dx, len] of [[-.2, -40, 360], [.16, 30, 380], [.0, 0, 300]]) { ctx.save(); ctx.rotate(a); ctx.translate(dx * s, 0); const L = len * s, Hh = 54 * s; ctx.fillStyle = '#2a1a10'; ctx.strokeStyle = '#050302'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.roundRect(-L / 2, -Hh / 2, L, Hh, 22 * s); ctx.fill(); if (li && li.ok) { ctx.save(); ctx.clip(); ctx.globalAlpha = .55; ctx.drawImage(li, -L / 2, -Hh / 2, L, Hh); ctx.restore(); } ctx.stroke(); ctx.restore(); }
    ctx.restore();
    // жар углей
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55 * M.fl + .2; ctx.drawImage(FX.glow([255, 110, 30]), cx - 230 * s, fy - 80 * s, 460 * s, 160 * s); ctx.restore();
    // язык пламени
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.min(1, .35 + M.fl * .9); const fh = (230 + M.fl * 250) * s;
    for (let i = 0; i < 9; i++) { const k = (i - 4) / 4, x = cx + k * 150 * s + Math.sin(t * 2 + i) * 14 * s, h = fh * (1 - Math.abs(k) * .5) * (.75 + .25 * Math.sin(t * 5 + i * 2)); flame(ctx, x, fy - 6 * s, 150 * s * (1 - Math.abs(k) * .4), h, t, i, s); }
    ctx.restore();
    // частицы
    const nn = Math.round(3 + M.fl * 7); FX.E.fire(cx + U.rnd(-120, 120) * s, fy - 20 * s, { n: nn, s: 2.8 * s * (.6 + M.fl * .6), smoke: false });
    if (Math.random() < .7) FX.add({ x: cx + U.rnd(-150, 150) * s, y: fy - 40 * s, vx: U.rnd(-40, 40), vy: -U.rnd(140, 420) * s, drag: .25, turb: 220, life: U.rnd(1.2, 3.4), s0: U.rnd(1.4, 3) * s, s1: .4, c0: [255, 230, 150], c1: [255, 100, 20], a0: 1, a1: 0, k: 'spark' });
    if (Math.random() < .5) FX.add({ x: cx + U.rnd(-100, 100) * s, y: fy - 60 * s, vx: U.rnd(-20, 20), vy: -U.rnd(30, 90) * s, drag: .2, turb: 120, life: U.rnd(3, 7), s0: U.rnd(2, 4) * s, s1: 0, c0: [255, 190, 90], c1: [255, 80, 20], a0: .9, a1: 0 });
    if (Math.random() < .12) FX.smokePuff(cx + U.rnd(-90, 90) * s, fy - 330 * s, 1, { a: .22, vy: -30 });
    FX.update(dt); FX.draw(ctx);
    // освещение: тьма комнаты с вырезом от огня
    const R = (640 + M.fl * 620) * s; FX.light(cx, fy - 120 * s, R, '#ff8a30', Math.min(1.1, .35 + M.fl * .9)); FX.light(cx, fy - 40 * s, R * .35, '#ffb060', M.fl);
    FX.drawLight(ctx, W, H, { x: W / 2, y: H / 2, zoom: 1 }, [3, 2, 5, .93], 1);
    // пыль в луче
    const vg = ctx.createRadialGradient(W / 2, H * .55, H * .35, W / 2, H * .55, H * 1.0); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(2,1,3,.82)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    // логотип мерцает вместе с огнём
    const lo = $('logo'); if (lo) { const k = U.clamp(.35 + M.fl * .85, .25, 1.05); lo.style.opacity = k; lo.style.filter = `drop-shadow(0 0 ${12 + M.fl * 26}px rgba(255,${130 + M.fl * 60 | 0},60,${.2 + M.fl * .4})) brightness(${.8 + M.fl * .5})`; }
    $('mainbtns').style.opacity = U.clamp(.55 + M.fl * .6, .5, 1);
    M.padPoll && M.padPoll();
  };
  // ---------- экраны ----------
  M.show = function (name) {
    M.screen = name; for (const id of ['menu', 'play', 'settings']) $(id).classList.toggle('show', id === name);
    if (name === 'play') M.renderWorlds(); if (name === 'settings') M.renderSettings();
  };
  qa('[data-go]').forEach(b => b.onclick = () => { SK.Audio.init(); SK.Audio.resume(); SK.Audio.sfx('menu_click'); M.show(b.dataset.go); });
  $('btnquit').onclick = () => { if (window.skverna && window.skverna.quit) window.skverna.quit(); else window.close(); };
  function tabs(sel, attr, prefix) { qa(sel).forEach(b => b.onclick = () => { qa(sel).forEach(x => x.classList.remove('on')); b.classList.add('on'); qa('[id^="' + prefix + '"]').forEach(x => x.hidden = x.id !== prefix + b.dataset[attr]); SK.Audio.sfx('menu_click', { vol: .5 }); if (prefix === 'sx') { } }); }
  qa('#play .tab').forEach(b => b.onclick = () => { qa('#play .tab').forEach(x => x.classList.remove('on')); b.classList.add('on'); ['worlds', 'create', 'join'].forEach(k => $('t-' + k).hidden = k !== b.dataset.t); });
  qa('#settings .tab').forEach(b => b.onclick = () => { qa('#settings .tab').forEach(x => x.classList.remove('on')); b.classList.add('on'); ['keys', 'pad', 'sound', 'screen', 'player'].forEach(k => $('s-' + k).hidden = k !== b.dataset.s); M.renderSettings(); });
  // ---------- миры ----------
  const worlds = () => { try { return JSON.parse(localStorage.getItem('skverna.worlds') || '[]'); } catch (e) { return []; } };
  const saveWorlds = l => localStorage.setItem('skverna.worlds', JSON.stringify(l));
  M.renderWorlds = function () {
    const l = worlds().sort((a, b) => (b.played || 0) - (a.played || 0)), el = $('worldlist'); el.innerHTML = l.length ? '' : '<p class="muted">Миров пока нет. Откройте вкладку «Создать мир».</p>';
    for (const w of l) { const d = document.createElement('div'); d.className = 'wi'; const dt = w.played ? new Date(w.played).toLocaleString('ru-RU') : '—'; d.innerHTML = `<div><div class="t"></div><div class="s">День ${w.day || 1} · был: ${dt}</div></div><div class="acts"><button class="btn sm go">Играть</button><button class="btn sm del">Удалить</button></div>`; d.querySelector('.t').textContent = w.name;
      d.querySelector('.go').onclick = () => M.start(w); let arm = 0; const del = d.querySelector('.del'); del.onclick = () => { if (!arm) { arm = 1; del.textContent = 'Точно?'; setTimeout(() => { arm = 0; del.textContent = 'Удалить'; }, 2500); return; } localStorage.removeItem('skverna.world.' + w.id); saveWorlds(worlds().filter(x => x.id !== w.id)); M.renderWorlds(); }; el.appendChild(d); }
  };
  $('btncreate').onclick = () => {
    const name = ($('wname').value || 'Новый мир').trim().slice(0, 24), sv = $('wseed').value.trim(); const seed = sv ? (/^\d+$/.test(sv) ? parseInt(sv, 10) >>> 0 : U.hash(sv)) : (Math.random() * 4294967295) >>> 0;
    const meta = { id: 'w' + Date.now().toString(36) + Math.floor(Math.random() * 999), name, seed, created: Date.now(), played: Date.now(), day: 1 }; const l = worlds(); l.push(meta); saveWorlds(l); M.start(meta);
  };
  $('btnjoin').onclick = () => { const id = $('joinid').value.trim(); if (!id) { $('joinmsg').textContent = 'Введите ID'; return; } $('joinmsg').textContent = 'Подключение…'; SK.net.join(id, msg => { $('joinmsg').textContent = msg; }); };
  M.start = function (meta, opts) {
    SK.Audio.init(); SK.Audio.resume(); SK.Audio.stopMusic(1.2); SK.Audio.sfx('menu_start', { vol: .8 }); const L = $('loading'); L.classList.add('show'); $('lbar').style.width = '4%'; $('ltxt').textContent = 'Создание мира…';
    setTimeout(async () => {
      try {
        const r = SK.game.loadWorld(meta); $('lbar').style.width = '20%'; $('ltxt').textContent = 'Загрузка ресурсов…';
        const keys = new Set(); for (const t of D.tiles) { const k = A.byName('tex', t.tex); if (k) keys.add('assets/tex/' + k + '.webp'); if (t.ore) { const o = A.byName('obj', t.ore); if (o) keys.add('assets/obj/' + o + '.webp'); } }
        for (const b in SK.PS) for (const e of SK.PS[b]) { const k = A.byName('obj', e[0]); if (k) keys.add('assets/obj/' + k + '.webp'); } for (const s in SK.STRUCT) { const k = A.byName('obj', SK.STRUCT[s][0]); if (k) keys.add('assets/obj/' + k + '.webp'); }
        for (const id in D.items) { const s = D.iconSrc(id); if (s) keys.add(s); } for (const b in D.spawn) for (const k of SK.game.spawnList(b)) keys.add('assets/mobs/' + k + '.webp'); for (const id in D.bosses) { const k = A.byName('bosses', D.bosses[id].art); if (k) keys.add('assets/bosses/' + k + '.webp'); }
        ['run_down', 'run_up', 'run_side'].forEach(n => keys.add('assets/player/' + n + '.webp')); const list = [...keys]; let done = 0; await Promise.all(list.map(p => A.load(p).then(() => { done++; if (done % 8 === 0) $('lbar').style.width = (20 + done / list.length * 75) + '%'; })));
        $('lbar').style.width = '100%'; await new Promise(r => setTimeout(r, 150)); M.active = false; for (const id of ['menu', 'play', 'settings']) $(id).classList.remove('show'); L.classList.remove('show');
        SK.game.start(r.w, r.pdata, meta); SK.net && SK.net.onStart && SK.net.onStart();
      } catch (e) { L.classList.remove('show'); M.show('play'); const d = $('err'); d.style.display = 'block'; d.textContent = 'Не удалось запустить мир: ' + (e.stack || e); }
    }, 60);
  };
  M.toMenu = function () { SK.game.save(); SK.game.stop(); SK.net && SK.net.stop && SK.net.stop(); M.active = true; $('pause').style.display = 'none'; FX.P.length = 0; FX.S.length = 0; M.show('menu'); SK.Audio.playMusic(M.musicFile(), { vol: .8, fade: 2 }); };
  M.musicFile = function () { const k = Object.keys(SK_AUD).find(x => /menyu|menu|titr/.test(x)) || Object.keys(SK_AUD).find(x => /boska|ten_surta/.test(x)); return k ? SK_AUD[k].files[0] : null; };
  // ---------- пауза ----------
  $('p-resume').onclick = () => SK.game.pause(false);
  $('p-settings').onclick = () => { M.ret = 'pause'; $('pause').style.display = 'none'; $('settings').classList.add('show'); M.renderSettings(); };
  $('p-exit').onclick = () => M.toMenu();
  $('p-net').onclick = () => SK.net.hostToggle(msg => { $('netinfo').innerHTML = msg; });
  $('setback').onclick = () => { SK.Audio.sfx('menu_click'); SK.saveSettings(); if (!M.active) { $('settings').classList.remove('show'); $('pause').style.display = 'flex'; } else M.show('menu'); };
  // ---------- настройки ----------
  const KEYN = { up: 'Вверх', down: 'Вниз', left: 'Влево', right: 'Вправо', attack: 'Удар / добыча', dash: 'Рывок', interact: 'Действие (E)', place: 'Поставить / использовать', inv: 'Инвентарь', pause: 'Пауза', craft: 'Создание', map: 'Карта' };
  const PADN = { attack: 'Удар', dash: 'Рывок', interact: 'Действие', place: 'Использовать', inv: 'Инвентарь', pause: 'Пауза' };
  const kn = c => { if (!c) return '—'; return c.replace(/^Key/, '').replace(/^Digit/, '').replace('Arrow', '').replace('Space', 'Пробел').replace('Escape', 'Esc').replace('ShiftLeft', 'Shift').replace('ShiftRight', 'Shift').replace('ControlLeft', 'Ctrl').replace('Tab', 'Tab').replace('Up', '↑').replace('Down', '↓').replace('Left', '←').replace('Right', '→'); };
  function slider(label, get, set, min, max, step, fmt) { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span class="nm">${label}</span><span style="display:flex;gap:12px;align-items:center"><input type="range" min="${min}" max="${max}" step="${step}"><span class="v" style="min-width:48px;text-align:right"></span></span>`; const i = r.querySelector('input'), v = r.querySelector('.v'); i.value = get(); v.textContent = fmt ? fmt(get()) : Math.round(get() * 100) + '%'; i.oninput = () => { set(parseFloat(i.value)); v.textContent = fmt ? fmt(parseFloat(i.value)) : Math.round(i.value * 100) + '%'; SK.saveSettings(); }; return r; }
  function toggle(label, get, set) { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span class="nm">${label}</span><div class="tg ${get() ? 'on' : ''}"></div>`; const t = r.querySelector('.tg'); t.onclick = () => { set(!get()); t.classList.toggle('on', get()); SK.saveSettings(); SK.Audio.sfx('menu_click', { vol: .4 }); }; return r; }
  function select(label, opts, get, set) { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span class="nm">${label}</span><select>${opts.map(o => `<option value="${o[0]}" ${String(o[0]) === String(get()) ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`; r.querySelector('select').onchange = e => { set(parseFloat(e.target.value)); SK.saveSettings(); }; return r; }
  M.renderSettings = function () {
    const S = SK.settings, k = $('s-keys'); k.innerHTML = '<p class="muted">Нажмите на клавишу, затем новую кнопку. Esc — отмена. Слоты 1–9 выбирают предмет.</p>';
    for (const a in KEYN) { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span class="nm">${KEYN[a]}</span><button class="kb">${kn(S.keys[a])}</button>`; const b = r.querySelector('button'); b.onclick = () => { b.textContent = 'нажмите…'; b.classList.add('listen'); In.listening = code => { if (code !== 'Escape') S.keys[a] = code; SK.saveSettings(); M.renderSettings(); }; }; k.appendChild(r); }
    const rs = document.createElement('button'); rs.className = 'btn sm'; rs.textContent = 'Сбросить'; rs.onclick = () => { Object.assign(S.keys, { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD', attack: 'KeyJ', dash: 'Space', interact: 'KeyE', place: 'KeyF', inv: 'Tab', pause: 'Escape', craft: 'KeyC', map: 'KeyM' }); SK.saveSettings(); M.renderSettings(); }; k.appendChild(rs);
    const p = $('s-pad'); p.innerHTML = `<p class="muted" id="padstat">Геймпад: ${In.pad ? In.pad.id.slice(0, 50) : 'не подключён (нажмите любую кнопку на геймпаде)'}</p><p class="muted">Левый стик — движение, правый — прицел. Крестовина тоже двигает.</p>`;
    for (const a in PADN) { const r = document.createElement('div'); r.className = 'row'; r.innerHTML = `<span class="nm">${PADN[a]}</span><button class="kb">Кнопка ${S.pad[a]}</button>`; const b = r.querySelector('button'); b.onclick = () => { b.textContent = 'нажмите кнопку…'; b.classList.add('listen'); M.padPoll = () => { const g = In.pad; if (!g) return; for (let i = 0; i < g.buttons.length; i++) if (g.buttons[i].pressed) { S.pad[a] = i; M.padPoll = null; SK.saveSettings(); M.renderSettings(); return; } }; }; p.appendChild(r); }
    p.appendChild(slider('Мёртвая зона', () => S.pad.deadzone, v => S.pad.deadzone = v, 0, .6, .01));
    const s = $('s-sound'); s.innerHTML = ''; for (const [n, l] of [['master', 'Общая громкость'], ['music', 'Музыка'], ['sfx', 'Эффекты'], ['amb', 'Окружение']]) s.appendChild(slider(l, () => S.vol[n], v => { S.vol[n] = v; SK.Audio.applyVol(); if (n === 'sfx') SK.Audio.sfx('item_pickup'); }, 0, 1, .01));
    const sc = $('s-screen'); sc.innerHTML = ''; sc.appendChild(toggle('Полный экран', () => S.gfx.fullscreen || !!document.fullscreenElement, v => { S.gfx.fullscreen = v; if (window.skverna && window.skverna.fullscreen) window.skverna.fullscreen(v); else if (v) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen && document.fullscreenElement && document.exitFullscreen(); }));
    sc.appendChild(select('Разрешение рендера', [[.5, '50%'], [.75, '75%'], [1, '100%'], [1.25, '125%']], () => S.gfx.scale, v => S.gfx.scale = v)); sc.appendChild(select('Лимит кадров', [[0, 'Без лимита'], [30, '30'], [60, '60'], [120, '120']], () => S.gfx.fps, v => S.gfx.fps = v));
    sc.appendChild(select('Качество эффектов', [[0, 'Низкое'], [1, 'Среднее'], [2, 'Высокое']], () => S.gfx.fx, v => S.gfx.fx = v)); sc.appendChild(toggle('Динамическое освещение', () => S.gfx.lights, v => S.gfx.lights = v));
    sc.appendChild(slider('Тряска камеры', () => S.gfx.shake, v => S.gfx.shake = v, 0, 1.5, .05)); sc.appendChild(slider('Масштаб камеры', () => S.gfx.fov, v => S.gfx.fov = v, .7, 1.4, .05, v => v.toFixed(2) + '×'));
    const pl = $('s-player'); pl.innerHTML = `<label>Имя игрока<input id="pname" maxlength="16" value="${S.name.replace(/"/g, '')}"></label>`; $('pname').oninput = e => { S.name = e.target.value || 'Странник'; SK.saveSettings(); };
  };
  addEventListener('mousemove', e => { M.mx = e.clientX / innerWidth; M.my = e.clientY / innerHeight; });
  addEventListener('keydown', e => { if (e.code === 'Escape' && M.active && !In.listening) { if (M.screen === 'play' || M.screen === 'settings') M.show('menu'); } });
})(window.SK);
