'use strict';
(function (SK) {
  const A = SK.A;
  const norm = s => s.toLowerCase().replace(/\s*[—-]\s*/g, '—').replace(/ё/g, 'е').replace(/\s+/g, ' ').trim();
  const idx = {};
  A.byName = function (kind, name) {
    if (!idx[kind]) { idx[kind] = {}; for (const k in SK_MAN[kind]) idx[kind][norm(SK_MAN[kind][k].name)] = k; }
    const n = norm(name); if (idx[kind][n]) return idx[kind][n];
    for (const nm in idx[kind]) if (nm.startsWith(n)) return idx[kind][nm];
    for (const nm in idx[kind]) if (nm.includes(n)) return idx[kind][nm];
    return null;
  };
  const D = SK.D = {};
  // [id, название, текстура, solid, твёрдость, тир, предмет-при-добыче, звук, шаг]
  const T = [
    ['grass', 'Трава', 'трава', 0, .5, 0, 'dirt', 'dig_dirt', 'grass'], ['forest', 'Лесная почва', 'лесная почва', 0, .5, 0, 'dirt', 'dig_dirt', 'dirt'],
    ['sand', 'Песок', 'песок', 0, .4, 0, 'sand', 'dig_sand', 'sand'], ['redsand', 'Красный песок', 'красный песок', 0, .4, 0, 'redsand', 'dig_sand', 'sand'],
    ['snow', 'Снег', 'снег', 0, .4, 0, 'snowball', 'dig_sand', 'snow'], ['icesnow', 'Ледяной снег', 'ледяной снег', 0, .6, 0, 'snowball', 'dig_sand', 'ice'],
    ['dirt', 'Земля', 'земля', 0, .5, 0, 'dirt', 'dig_dirt', 'dirt'], ['gravel', 'Гравий', 'гравий', 0, .6, 0, 'gravel', 'dig_dirt', 'gravel'],
    ['clay', 'Глина', 'глина', 0, .6, 0, 'clay', 'dig_dirt', 'dirt'], ['moss', 'Мох', 'мох', 0, .5, 0, 'dirt', 'dig_dirt', 'grass'],
    ['basalt', 'Базальт', 'базальт', 0, .6, 0, 'cobble', 'dig_dirt', 'ash'],
    ['stone', 'Камень', 'камень', 1, 2.2, 1, 'cobble', 'block_break', 'stone'], ['granite', 'Гранит', 'гранит', 1, 2.6, 1, 'cobble', 'block_break', 'stone'],
    ['diorite', 'Диорит', 'диорит', 1, 2.4, 1, 'cobble', 'block_break', 'stone'], ['andesite', 'Андезит', 'андезит', 1, 2.4, 1, 'cobble', 'block_break', 'stone'],
    ['sandstone', 'Песчаник', 'песчанник', 1, 1.8, 1, 'sandstone', 'block_break', 'stone'], ['redsandstone', 'Красный песчаник', 'красный песчанник', 1, 1.8, 1, 'sandstone', 'block_break', 'stone'],
    ['ice', 'Лёд', 'лед', 1, 1.6, 1, 'icechunk', 'glass_break', 'ice'], ['deepslate', 'Глубинный камень', 'глубинный камень', 1, 3.6, 2, 'cobble', 'block_break', 'stone'],
    ['obsidian', 'Обсидиан', 'обсидиан', 1, 8, 5, 'obsidian', 'block_break', 'stone'], ['bricks', 'Каменные кирпичи', 'каменные кирпичи', 1, 2.4, 1, 'bricks', 'block_break', 'stone'],
    ['brickred', 'Кирпичи', 'кирпичный блок', 1, 2.4, 1, 'brickred', 'block_break', 'stone'], ['planks', 'Доски', 'деревянные доски', 1, 1.4, 0, 'plank', 'wood_place', 'wood'],
    ['log', 'Бревно', 'бревно - боковая поверхность', 1, 1.6, 0, 'wood', 'wood_place', 'wood'], ['bone', 'Костяной блок', 'костяной блок', 1, 2, 1, 'bone', 'block_break', 'bones'],
    ['rune', 'Рунный камень', 'рунный камень', 1, 3, 2, 'cobble', 'block_break', 'stone'], ['shroom', 'Грибной блок', 'светящийся грибной блок', 1, 1, 0, 'shroom', 'dig_dirt', 'grass'],
    ['hay', 'Тюк сена', 'тюк сена', 1, .8, 0, 'hay', 'cutting_grass', 'grass'], ['terracotta', 'Терракота', 'терракота', 1, 2, 1, 'terracotta', 'block_break', 'stone'],
    ['cobble', 'Булыжник', 'булыжник', 1, 2, 1, 'cobble', 'block_break', 'stone'], ['clayblock', 'Глиняный блок', 'глинянный блок', 1, 1.5, 0, 'clay', 'dig_dirt', 'dirt'],
    ['leaves', 'Листва', 'листва', 1, .5, 0, 'fibre', 'cutting_grass', 'grass'], ['smoothsand', 'Гладкий песчаник', 'гладкий песчанник', 1, 1.8, 1, 'sandstone', 'block_break', 'stone'],
    ['snowblock', 'Снежный блок', 'снежный блок', 1, .8, 0, 'snowball', 'dig_sand', 'snow'], ['ironcl', 'Железная облицовка', 'железный блок — облицовка', 1, 5, 3, 'ironblock', 'block_break', 'metal'],
    ['goldcl', 'Золотая облицовка', 'золотой блок — облицовка', 1, 5, 3, 'goldblock', 'block_break', 'metal'], ['titancl', 'Титановая облицовка', 'титановый блок — облицовка', 1, 7, 4, 'titanblock', 'block_break', 'metal'],
    ['rust', 'Ржавый металл', 'ржавый метал', 1, 3, 2, 'scrap', 'block_break', 'metal'], ['bamboopl', 'Бамбуковые доски', 'бамбуковые доски', 1, 1.2, 0, 'bamboopl', 'wood_place', 'wood'],
    ['hole', 'Яма', 'земля', 0, 0, 0, null, 'dig_dirt', 'dirt']
  ];
  D.tiles = []; D.tid = {};
  T.forEach((t, i) => { const o = { i, id: t[0], name: t[1], tex: t[2], solid: !!t[3], hard: t[4], tier: t[5], drop: t[6], snd: t[7], step: t[8] }; D.tiles.push(o); D.tid[o.id] = i; });
  const ORES = [['coal', 'Угольная руда', 'coal', 1, 1], ['copper', 'Медная руда—блок в мире', 'copper_ore', 1, 2], ['iron', 'Железная руда—блок в мире', 'iron_ore', 2, 3], ['gold', 'Золотая руда', 'gold_ore', 2, 4],
    ['silver', 'Серебряная руда—блок в мире', 'silver', 2, 4], ['titan', 'Титановая руда—блок в мире', 'titan_ore', 3, 6], ['rustore', 'Ржавая руда—блок в мире', 'rusty', 2, 3], ['magma', 'Магматитовая руда—блок в мире', 'magma_ore', 4, 8], ['svart', 'Сварт-сталь руда—блок в мире', 'svart_ore', 5, 10], ['obsore', 'Обсидиановая руда—блок в мире', 'obs_ore', 4, 9]];
  for (const o of ORES) { const i = D.tiles.length; const t = { i, id: 'ore_' + o[0], name: o[1].split('—')[0], tex: 'камень', ore: o[1], solid: true, hard: 3 + o[3], tier: o[3], drop: o[2], snd: 'ore', step: 'stone' }; D.tiles.push(t); D.tid[t.id] = i; }
  const I = {
    wood: ['Бревно', 'бревна', 'res'], plank: ['Доски', 'Доски', 'block', { tile: 'planks' }], stick: ['Палка', 'палка', 'res'], cobble: ['Булыжник', 'булыжник', 'block', { tile: 'cobble' }],
    stone: ['Камень', 'камень', 'res'], sand: ['Песок', 'песок ресурс', 'block', { tile: 'sand' }], redsand: ['Красный песок', 'красный песок ресурс', 'block', { tile: 'redsand' }], dirt: ['Земля', 'tex:земля', 'block', { tile: 'dirt' }],
    gravel: ['Гравий', 'tex:гравий', 'block', { tile: 'gravel' }], clay: ['Глина', 'Глина', 'block', { tile: 'clay' }], snowball: ['Снег', 'снег', 'block', { tile: 'snow' }], icechunk: ['Лёд', 'лед', 'block', { tile: 'ice' }],
    sandstone: ['Песчаник', 'tex:песчанник', 'block', { tile: 'sandstone' }], obsidian: ['Обсидиан', 'обсидиан', 'block', { tile: 'obsidian' }], bricks: ['Каменные кирпичи', 'Каменные кирпичи', 'block', { tile: 'bricks' }], brickred: ['Кирпичи', 'Кирпичный блок(красные кирпичи)', 'block', { tile: 'brickred' }],
    bone: ['Кость', 'кость', 'res'], shroom: ['Грибной блок', 'tex:светящийся грибной блок', 'block', { tile: 'shroom' }], hay: ['Тюк сена', 'Тюк сена', 'block', { tile: 'hay' }], terracotta: ['Терракота', 'Терракота', 'block', { tile: 'terracotta' }],
    glass: ['Стекло', 'стекло', 'res'], fibre: ['Волокно', 'волокно', 'res'], hide: ['Шкура', 'шкура', 'res'], fur: ['Мех', 'мех', 'res'], feather: ['Перья', 'перья', 'res'], web: ['Паутина', 'паутина', 'res'], slime: ['Слизь', 'слизь', 'res'], cloth: ['Ткань', 'ткань', 'res'],
    coal: ['Уголь', 'уголь - ресурс', 'res'], copper_ore: ['Медная руда', 'медная руда предмет', 'res'], iron_ore: ['Железная руда', 'железная руда', 'res'], gold_ore: ['Золотая руда', 'золотая руда', 'res'], silver: ['Серебряная руда', 'Серебряная руда—необработанный ресурс', 'res'],
    titan_ore: ['Титановая руда', 'титановая руда', 'res'], rusty: ['Ржавая руда', 'ржавая руда', 'res'], magma_ore: ['Магматит', 'магматит', 'res'], svart_ore: ['Сварт-сталь (руда)', 'Сварт-сталь руда—необработанный ресурс', 'res'], obs_ore: ['Обсидиановая руда', 'обсидиановая руда—необработанный ресурс', 'res'],
    copper_ing: ['Медный слиток', 'медный слиток', 'res'], iron_ing: ['Железный слиток', 'железный слиток', 'res'], gold_ing: ['Золотой слиток', 'золотой слиток', 'res'], titan_ing: ['Титановый слиток', 'титановый слиток', 'res'], svart_ing: ['Сварт-сталь', 'сварт-сталь', 'res'], magma_ing: ['Магматитовый слиток', 'магматитовый слиток', 'res'],
    shard: ['Осколок Биврёста', 'осколок бивреста', 'res'], bottle: ['Пузырёк', 'Пузырёк', 'res'], scrap: ['Ржавый лом', 'ржавый лом', 'res'], ironblock: ['Железная облицовка', 'tex:железный блок — облицовка', 'block', { tile: 'ironcl' }],
    core_fire: ['Ядро огня', 'ядро огня', 'res'], core_cold: ['Ядро холода', 'ядро холода ресурс', 'res'], core_life: ['Ядро природы', 'Ядро природы', 'res'], core_bolt: ['Ядро молнии', 'ядро молнии', 'res'], core_light: ['Ядро света', 'ядро света', 'res'], core_void: ['Ядро скверны', 'ядро скверны', 'res'],
    berry_red: ['Красная ягода', 'Красная ягода', 'food', { heal: 6 }], berry_blue: ['Синяя ягода', 'Синяя ягода', 'food', { heal: 6 }], apple: ['Яблоко', 'яблоко', 'food', { heal: 8 }], bread: ['Хлеб', 'хлеб', 'food', { heal: 14 }],
    meat_raw: ['Сырое мясо', 'сырое мясо кабана', 'food', { heal: -4 }], meat: ['Жареное мясо', 'жареное мясо кабана', 'food', { heal: 22 }], fish: ['Жареная рыба', 'жареная рыба', 'food', { heal: 18 }], mushroom: ['Печёный гриб', 'печеный гриб', 'food', { heal: 10 }],
    honey: ['Мёд', 'мед', 'food', { heal: 12 }], carrot: ['Морковь', 'морковь', 'food', { heal: 8 }], corn: ['Печёная кукуруза', 'печеная кукуруза', 'food', { heal: 10 }], steak: ['Стейк', 'стейк', 'food', { heal: 28 }],
    pick_wood: ['Деревянная кирка', 'кирка', 'tool', { tool: 'pick', tier: 1, spd: 1.4, dmg: 8, dur: 90 }], pick_copper: ['Медная кирка', 'медная кирка', 'tool', { tool: 'pick', tier: 2, spd: 2.2, dmg: 11, dur: 160 }],
    pick_iron: ['Железная кирка', 'железная кирка', 'tool', { tool: 'pick', tier: 3, spd: 3.2, dmg: 14, dur: 260 }], pick_titan: ['Титановая кирка', 'титановая кирка', 'tool', { tool: 'pick', tier: 4, spd: 4.6, dmg: 17, dur: 420 }],
    pick_magma: ['Магматитовая кирка', 'магматитовая кирка', 'tool', { tool: 'pick', tier: 5, spd: 6, dmg: 22, dur: 600 }], pick_svart: ['Сварт-стальная кирка', 'сварталь-стальная кирка', 'tool', { tool: 'pick', tier: 6, spd: 8, dmg: 26, dur: 900 }],
    axe_wood: ['Топор', 'топор', 'tool', { tool: 'axe', tier: 1, spd: 1.5, dmg: 10, dur: 100 }], axe_iron: ['Железный топор', 'железный топор', 'tool', { tool: 'axe', tier: 3, spd: 3, dmg: 16, dur: 280 }], axe_titan: ['Титановый топор', 'титановый топор', 'tool', { tool: 'axe', tier: 4, spd: 4.4, dmg: 20, dur: 450 }],
    shovel: ['Лопата', 'лопата', 'tool', { tool: 'shovel', tier: 1, spd: 2.4, dmg: 6, dur: 200 }],
    sword_wood: ['Деревянный меч', 'меч деревянный', 'weapon', { dmg: 12, range: 74, cd: .38, dur: 80, pal: 'holy' }], sword_stone: ['Каменный меч', 'каменный меч', 'weapon', { dmg: 17, range: 78, cd: .4, dur: 120, pal: 'holy' }],
    sword_copper: ['Медный меч', 'медный меч', 'weapon', { dmg: 22, range: 82, cd: .38, dur: 180, pal: 'fire' }], sword_iron: ['Железный меч', 'меч железный', 'weapon', { dmg: 30, range: 86, cd: .36, dur: 280, pal: 'holy' }],
    sword_titan: ['Титановый меч', 'меч титановый', 'weapon', { dmg: 42, range: 92, cd: .34, dur: 450, pal: 'ice' }], sword_magma: ['Магматитовый меч', 'меч магматитовый', 'weapon', { dmg: 56, range: 96, cd: .34, dur: 600, pal: 'fire', burn: 1 }],
    sword_svart: ['Меч сварт-стали', 'меч сварт-стальной', 'weapon', { dmg: 68, range: 100, cd: .32, dur: 800, pal: 'dark' }], sword_gold: ['Меч Асгарда', 'меч золото асгарда', 'weapon', { dmg: 80, range: 104, cd: .3, dur: 900, pal: 'holy' }],
    sword_rainbow: ['Меч Радужного Осколка', 'меч радужного осколка', 'weapon', { dmg: 95, range: 110, cd: .3, dur: 1000, pal: 'bolt', chain: 1 }], spear: ['Копьё', 'копье', 'weapon', { dmg: 20, range: 120, cd: .5, dur: 140, pal: 'wind' }],
    staff_sparks: ['Посох искр', 'посох искр', 'weapon', { dmg: 30, range: 0, cd: .5, dur: 300, pal: 'bolt', cast: 'bolt' }], staff_witch: ['Посох ведьмы', 'посох ведьмы', 'weapon', { dmg: 26, range: 0, cd: .55, dur: 300, pal: 'dark', cast: 'dark' }],
    bow: ['Самодельный лук', 'самодельный лук', 'weapon', { dmg: 24, range: 0, cd: .6, dur: 200, pal: 'wind', cast: 'arrow' }],
    set_leather: ['Кожаный комплект', 'кожаный комплект', 'armor', { def: 8 }], set_copper: ['Медный комплект', 'медный комплект', 'armor', { def: 14 }], set_iron: ['Железный комплект', 'железный комплект', 'armor', { def: 22 }],
    set_titan: ['Титановый комплект', 'титановый комплект', 'armor', { def: 32 }], set_magma: ['Магматитовый комплект', 'магматитовый комплект', 'armor', { def: 42, fire: 1 }], set_svart: ['Сварт-стальной комплект', 'сварт-стальной комплект', 'armor', { def: 52 }], set_fur: ['Меховой комплект', 'меховой комплект', 'armor', { def: 12, cold: 1 }],
    p_heal: ['Зелье лечения', 'зелье лечения', 'potion', { fx: 'heal', heal: 60 }], p_speed: ['Зелье скорости', 'зелье скорости', 'potion', { fx: 'wind', buff: 'speed', t: 45 }], p_power: ['Зелье силы', 'зелье силы', 'potion', { fx: 'blood', buff: 'power', t: 45 }],
    p_fire: ['Зелье огнестойкости', 'зелье огнестойкости', 'potion', { fx: 'fire', buff: 'fireres', t: 90 }], p_skin: ['Зелье твёрдой кожи', 'зелье твердой кожи', 'potion', { fx: 'earth', buff: 'skin', t: 60 }], p_haste: ['Зелье быстрого разрушения', 'зелье быстрого разрушения', 'potion', { fx: 'holy', buff: 'haste', t: 60 }],
    p_night: ['Зелье ночного зрения', 'зелье ночного зрения', 'potion', { fx: 'bolt', buff: 'night', t: 120 }], p_lev: ['Зелье левитации', 'зелье левитации', 'potion', { fx: 'wind', buff: 'float', t: 20 }], p_cleanse: ['Зелье защиты от Скверны', 'зелье защиты от Скверны', 'potion', { fx: 'corrupt', buff: 'cleanse', t: 120 }],
    torch: ['Факел', 'файкел', 'place', { prop: 'torch' }], campfire: ['Костёр', 'костер', 'place', { prop: 'campfire' }], workbench: ['Верстак', 'верстак', 'place', { prop: 'workbench' }], furnace: ['Печь', 'печь', 'place', { prop: 'furnace' }],
    chest: ['Сундук', 'сундук ур 1', 'place', { prop: 'chest' }], anvil: ['Наковальня', 'наковальня', 'place', { prop: 'anvil' }], bed: ['Кровать', 'кровать', 'place', { prop: 'bed' }], lantern: ['Фонарь', 'фонарь', 'place', { prop: 'lantern' }],
    potion_bomb: ['Бочка взрывчатого песка', 'бочка взрывчатого песка', 'place', { prop: 'bomb' }]
  };
  D.items = {};
  for (const id in I) { const [name, icon, type, p] = I[id]; D.items[id] = Object.assign({ id, name, icon, type, stack: type === 'tool' || type === 'weapon' || type === 'armor' ? 1 : 99 }, p || {}); }
  D.iconSrc = function (id) { const it = D.items[id]; if (!it) return ''; if (it._src !== undefined) return it._src; let s = null; if (it.icon.startsWith('tex:')) { const k = A.byName('tex', it.icon.slice(4)); if (k) s = 'assets/tex/' + k + '.webp'; } else { const k = A.byName('obj', it.icon); if (k) s = 'assets/obj/' + k + '.webp'; } return it._src = s || ''; };
  D.recipes = [
    ['plank', 4, { wood: 1 }, 'hand'], ['stick', 4, { plank: 2 }, 'hand'], ['workbench', 1, { plank: 8 }, 'hand'], ['torch', 4, { stick: 1, coal: 1 }, 'hand'], ['campfire', 1, { wood: 3, cobble: 2 }, 'hand'], ['bottle', 3, { glass: 1 }, 'bench'],
    ['furnace', 1, { cobble: 8 }, 'bench'], ['chest', 1, { plank: 8 }, 'bench'], ['bed', 1, { plank: 4, cloth: 3 }, 'bench'], ['anvil', 1, { iron_ing: 6 }, 'bench'], ['lantern', 1, { iron_ing: 1, torch: 1, glass: 1 }, 'bench'],
    ['pick_wood', 1, { plank: 3, stick: 2 }, 'bench'], ['axe_wood', 1, { plank: 3, stick: 2 }, 'bench'], ['shovel', 1, { plank: 1, stick: 2 }, 'bench'], ['sword_wood', 1, { plank: 2, stick: 1 }, 'bench'], ['sword_stone', 1, { cobble: 2, stick: 1 }, 'bench'], ['spear', 1, { stick: 2, cobble: 1 }, 'bench'],
    ['pick_copper', 1, { copper_ing: 3, stick: 2 }, 'bench'], ['sword_copper', 1, { copper_ing: 2, stick: 1 }, 'bench'], ['pick_iron', 1, { iron_ing: 3, stick: 2 }, 'bench'], ['sword_iron', 1, { iron_ing: 2, stick: 1 }, 'bench'], ['axe_iron', 1, { iron_ing: 3, stick: 2 }, 'bench'],
    ['pick_titan', 1, { titan_ing: 3, stick: 2 }, 'anvil'], ['sword_titan', 1, { titan_ing: 2, stick: 1 }, 'anvil'], ['axe_titan', 1, { titan_ing: 3, stick: 2 }, 'anvil'], ['pick_magma', 1, { magma_ing: 3, stick: 2 }, 'anvil'], ['sword_magma', 1, { magma_ing: 3, core_fire: 1, stick: 1 }, 'anvil'],
    ['pick_svart', 1, { svart_ing: 3, stick: 2 }, 'anvil'], ['sword_svart', 1, { svart_ing: 3, stick: 1 }, 'anvil'], ['sword_rainbow', 1, { titan_ing: 4, shard: 6, core_life: 1 }, 'anvil'],
    ['set_leather', 1, { hide: 8 }, 'bench'], ['set_fur', 1, { fur: 8, hide: 4 }, 'bench'], ['set_copper', 1, { copper_ing: 10 }, 'bench'], ['set_iron', 1, { iron_ing: 14 }, 'anvil'], ['set_titan', 1, { titan_ing: 16 }, 'anvil'],
    ['p_heal', 1, { berry_red: 3, bottle: 1 }, 'bench'], ['p_speed', 1, { berry_blue: 3, bottle: 1, feather: 1 }, 'bench'], ['p_power', 1, { meat_raw: 2, bottle: 1, bone: 1 }, 'bench'], ['p_fire', 1, { core_fire: 1, bottle: 1 }, 'bench'], ['p_night', 1, { slime: 2, bottle: 1 }, 'bench'],
    ['glass', 1, { sand: 2 }, 'furnace'], ['copper_ing', 1, { copper_ore: 1, coal: 1 }, 'furnace'], ['iron_ing', 1, { iron_ore: 1, coal: 1 }, 'furnace'], ['gold_ing', 1, { gold_ore: 1, coal: 1 }, 'furnace'], ['titan_ing', 1, { titan_ore: 1, coal: 2 }, 'furnace'], ['magma_ing', 1, { magma_ore: 1, coal: 2 }, 'furnace'], ['svart_ing', 1, { svart_ore: 1, coal: 3 }, 'furnace'],
    ['meat', 1, { meat_raw: 1 }, 'furnace'], ['bread', 1, { corn: 2 }, 'furnace'], ['brickred', 2, { clay: 2 }, 'furnace'], ['terracotta', 1, { clay: 1 }, 'furnace']
  ];
  D.biomes = {
    forest: { name: 'Древний лес', tiles: ['grass', 'grass', 'grass', 'forest', 'moss'], music: 'boska_magia_midgard_les', amb: { forest_ambience: .5, wind_trees: .35, leaves_rustle: .15 }, ambient: [38, 52, 62], fog: '#3a5a50' },
    desert: { name: 'Пустыня', tiles: ['sand', 'sand', 'sand', 'redsand'], music: 'midgard_pustynya', amb: { desert_wind: .5, sandstorm: .12 }, ambient: [70, 45, 20], fog: '#c8a060' },
    tundra: { name: 'Ледяная тундра', tiles: ['snow', 'snow', 'icesnow', 'snow'], music: 'frozen_wilderness_midgard_ledyanaya_tundra', amb: { arctic_wind: .55, blizzard: .12 }, ambient: [40, 60, 90], fog: '#9fb8d0' },
    waste: { name: 'Пустошь Скверны', tiles: ['basalt', 'gravel', 'dirt', 'basalt'], music: 'decaying_silence_midgard_pustosh_skverna', amb: { wasteland_wind: .5, dark_drone: .25 }, ambient: [40, 20, 50], fog: '#4a3050' }
  };
  D.mobRules = [
    [/кролик|овца|свинья|курица|самка оленя|^олень|горный козел|енот|еж$|панда|сурикат|грызун/, { ai: 'passive', hp: 24, spd: 70, dmg: 0, h: 58 }],
    [/жаб/, { ai: 'passive', hp: 16, spd: 60, dmg: 0, h: 44 }],
    [/пчела|фея/, { ai: 'passive', hp: 10, spd: 90, dmg: 0, h: 40, fly: 1 }],
    [/ворон|гриф|орел|попугай/, { ai: 'passive', hp: 18, spd: 110, dmg: 0, h: 56, fly: 1 }],
    [/житель|крестьянин/, { ai: 'villager', hp: 40, spd: 55, dmg: 0, h: 100 }],
    [/волк|пес$|пёс|гончая/, { ai: 'melee', hp: 55, spd: 165, dmg: 12, h: 74, rng: 38, cd: 1.1, lunge: 1, snd: 'wolf_growl' }],
    [/медвед|мамонт/, { ai: 'melee', hp: 140, spd: 110, dmg: 24, h: 110, rng: 50, cd: 1.6, slam: 1, snd: 'bear_growl' }],
    [/барс|ягуар|кабан|крокодил|анаконда|змей/, { ai: 'melee', hp: 70, spd: 150, dmg: 15, h: 72, rng: 40, cd: 1.2, lunge: 1, snd: 'snake_hiss' }],
    [/скорпион|паук/, { ai: 'melee', hp: 40, spd: 140, dmg: 11, h: 56, rng: 34, cd: 1, lunge: 1, snd: 'spider_skitter' }],
    [/лучник|арбалет/, { ai: 'ranged', hp: 50, spd: 100, dmg: 12, h: 96, rng: 380, cd: 1.8, proj: 'arrow' }],
    [/ведьм|колдун|шаман|жрец|прорицатель|оракул/, { ai: 'caster', hp: 60, spd: 85, dmg: 14, h: 100, rng: 340, cd: 2.2, proj: 'dark', snd: 'witch_cackle' }],
    [/маг|чародей|иллюзионист|некромант|лич|алхимик/, { ai: 'caster', hp: 55, spd: 80, dmg: 16, h: 104, rng: 360, cd: 2, proj: 'dark', snd: 'magic_spell' }],
    [/призрак|банши|дух|тень/, { ai: 'ghost', hp: 45, spd: 95, dmg: 13, h: 96, rng: 330, cd: 2.4, proj: 'dark', fly: 1, snd: 'ghost_wail' }],
    [/голем|колосс|страж|древний страж/, { ai: 'melee', hp: 220, spd: 65, dmg: 30, h: 140, rng: 56, cd: 2.2, slam: 1, snd: 'stone_golem' }],
    [/скелет|зомби|вурдалак|упырь|мумия|проклят|одержим|мертвец/, { ai: 'melee', hp: 70, spd: 95, dmg: 14, h: 100, rng: 44, cd: 1.3, snd: 'skeleton_collapse' }],
    [/./, { ai: 'melee', hp: 85, spd: 105, dmg: 16, h: 104, rng: 46, cd: 1.3 }]
  ];
  D.elem = [[/огн|лав|огнен/, 'fire'], [/лед|мороз|снеж|ледян|холод/, 'ice'], [/молни|ветр/, 'bolt'], [/кров/, 'blood'], [/хаос|скверн|проклят/, 'corrupt'], [/земл|камен|голем/, 'earth'], [/белый маг|свят|жрец/, 'holy'], [/тень|тёмн|темн|некромант|призрак|лич|ведьм/, 'dark'], [/яд|болот|жаб/, 'poison']];
  D.spawn = {
    forest: ['волк', 'кролик', 'овца', 'свинья', 'курица', 'кабан', 'медведь', 'енот', 'еж', 'панда', 'жаба', 'ведьма болота', 'олень', 'охотник', 'пчела', 'фея леса', 'крестьянин'],
    desert: ['мумия', 'скорпион', 'песчанный грызун', 'сурикат', 'гриф', 'песчанник', 'страж гробницы', 'змей пустошей'],
    tundra: ['полярный волк', 'белый медведь', 'олень', 'ледяной воин', 'ледяной медведь', 'морозный змей', 'ведьма льда', 'маг льда', 'снежный барс', 'горный козел'],
    waste: ['разбойник', 'одичавший пес', 'ведьма пустошей', 'проклятый воин', 'скелет', 'призрак', 'наемник', 'вурдалак', 'проклятый маг', 'ворон', 'сектант']
  };
  D.bosses = {
    pharaoh: { name: 'Фараон проклятой гробницы', art: 'фараон проклятой гробницы', music: 'faraon', bpm: 120, hp: 900, pal: 'holy', size: 260, dmg: 24, biome: 'desert', pat: ['aimed', 'ring', 'slam', 'summon'], snd: 'pharaoh' },
    frost: { name: 'Вождь Ледяных Троллей', art: 'ледяной титан', music: 'vozhd_ledyanyh_trolley_citadel_moroza_holod', bpm: 110, hp: 1100, pal: 'ice', size: 280, dmg: 28, biome: 'tundra', pat: ['charge', 'slam', 'ring', 'beam'], snd: 'troll_roar' },
    bandit: { name: 'Король Разбойников', art: 'король разбойников', music: 'korol_razboynikov', bpm: 140, hp: 800, pal: 'fire', size: 240, dmg: 22, biome: 'waste', pat: ['charge', 'aimed', 'aimed', 'slam'], snd: 'bandit_shout' },
    arngutang: { name: 'Арнгутанг', art: 'шаман забытого племени', music: 'arngutang', bpm: 130, hp: 1000, pal: 'poison', size: 250, dmg: 24, biome: 'forest', pat: ['ring', 'summon', 'aimed', 'vortex'], snd: 'shaman_chant' },
    melnir: { name: 'Разумный Мьёльнир', art: 'рунический голем', music: 'razumnyy_melnir', bpm: 150, hp: 1000, pal: 'bolt', size: 230, dmg: 26, pat: ['charge', 'lightning', 'ring', 'lightning'], snd: 'hammer_lightning' },
    miner: { name: 'Тролль-Горнорубщик', art: 'каменный колосс', music: 'troll_gornorubschik', bpm: 100, hp: 1400, pal: 'earth', size: 300, dmg: 34, pat: ['slam', 'slam', 'charge', 'summon'], snd: 'troll_roar' },
    mother: { name: 'Матка Зарослей', art: 'хранитель мирового дерева', music: 'matka_zarosley', bpm: 125, hp: 1300, pal: 'poison', size: 290, dmg: 26, pat: ['ring', 'summon', 'vortex', 'aimed'], snd: 'giant_plant_roar' },
    surt: { name: 'Тень Сурта', art: 'огненный титан', music: 'ten_surta', bpm: 135, hp: 1600, pal: 'fire', size: 300, dmg: 36, pat: ['beam', 'ring', 'slam', 'charge'], snd: 'demon_roar' },
    deadice: { name: 'Король Мёртвого Льда', art: 'король мертвецов', music: 'korol_mertvogo_lda', bpm: 115, hp: 1500, pal: 'ice', size: 270, dmg: 32, pat: ['beam', 'ring', 'aimed', 'vortex'], snd: 'ghost_wail' },
    hel: { name: 'Хель', art: 'верховная ведьма', music: 'hel', bpm: 130, hp: 1700, pal: 'corrupt', size: 270, dmg: 34, pat: ['vortex', 'ring', 'aimed', 'summon'], snd: 'dark_queen' },
    eitri: { name: 'Эйтри, Великий Кузнец', art: 'голем пожиратель', music: 'eytri_velikiy_kuznec', bpm: 125, hp: 1500, pal: 'fire', size: 280, dmg: 32, pat: ['slam', 'aimed', 'charge', 'ring'], snd: 'blacksmith' },
    elf: { name: 'Король Эльфов-Эхо', art: 'дух погибшего королества', music: 'korol_elfov_eho', bpm: 135, hp: 1500, pal: 'dark', size: 250, dmg: 30, pat: ['vortex', 'lightning', 'ring', 'aimed'], snd: 'psychic_wave' },
    entity: { name: 'Сущность Взрыва', art: 'сердце древнего мира', music: 'suschnost_vzryva', bpm: 140, hp: 2600, pal: 'fire', size: 320, dmg: 40, pat: ['ring', 'beam', 'vortex', 'lightning', 'slam', 'summon'], snd: 'cosmic_explosion' }
  };
})(window.SK);
