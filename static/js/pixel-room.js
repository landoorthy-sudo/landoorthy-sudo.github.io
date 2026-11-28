// Landoorthy 的像素小房间。阿里住在这里，丝瓜带着南瓜来串门。
// 场景 192×108 像素；小动物会走来走去，点它们会说话。
(function () {
  const root = document.getElementById('pixel-room');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const tip = root.querySelector('.pr-tip');
  const nameEl = root.querySelector('.pr-name');
  const textEl = root.querySelector('.pr-text');
  const lampBtn = root.querySelector('[data-lamp]');
  const W = 192, H = 108;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let lampOn = true;
  try { lampOn = localStorage.getItem('pixel-room-lamp') !== 'off'; } catch (e) {}
  let tick = 0, typing = null;
  const rand = (a, b) => a + Math.random() * (b - a);

  // ---------- 画图小工具 ----------
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  function dither(x, y, w, h, c, phase) {
    ctx.fillStyle = c;
    for (let j = y; j < y + h; j++) for (let i = x + ((j + (phase || 0)) % 2); i < x + w; i += 2) ctx.fillRect(i, j, 1, 1);
  }
  function sprite(rows, pal, ox, oy) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ' || !pal[ch]) continue;
        rect(ox + x, oy + y, 1, 1, pal[ch]);
      }
    });
  }
  // 在 (x, y) 处画宽度为 w 的角色；flip 时水平翻转
  function drawAt(x, y, w, flip, fn) {
    ctx.save();
    if (flip) { ctx.translate(Math.round(x) + w, Math.round(y)); ctx.scale(-1, 1); }
    else ctx.translate(Math.round(x), Math.round(y));
    fn();
    ctx.restore();
  }

  // ---------- 角色 ----------
  // 圆角块：先描边再填色，四个角各削掉一个像素
  function blob(x, y, w, h, line, fill) {
    rect(x + 1, y, w - 2, h, line); rect(x, y + 1, w, h - 2, line);
    rect(x + 1, y + 1, w - 2, h - 2, fill);
  }

  // 两只猫是圆团子：头和身子连在一起，豆豆眼、腮红，走路时只露出一点小短脚。
  // 像素图由 tools/catgen.py 生成，每个字母是一种颜色（见 SG / NG）。头朝左画，往右走时翻转。
  // 丝瓜：大只银渐层，浅银白色，背上深一点带细条纹，额头三道淡纹。
  const SG = { o: '#4e525c', g: '#e0e3e8', s: '#c6cad2', t: '#a3a8b2', w: '#fafaf7', p: '#efaab6', e: '#2a2a30', b: '#f4b4c2' };
  const SIGUA_SLEEP = [[
    '..o........o................',
    '..ooo....ooo................',
    '..oppo..opgo................',
    '..ogtgootggo................',
    '...oggggggo.................',
    '..oggggggggooooooooo........',
    '.ogggggggggggstsstssoo......',
    '.ogggggggggggstsstsstso.....',
    '.ogggggggggggggggggggggo....',
    '.ogggggggggggggggggggggo....',
    '.ogeeggggeeggggggggggggo....',
    '.ogbbggggbbggggggggggggo....',
    '.oggggggggggggggggggggo.....',
    '..ogggggggggggggggggoo......',
    '...oooggoooooooggggo........',
    '......oo.......oooooooooo...',
    '............................'
  ], [
    '..o........o................',
    '..ooo....ooo................',
    '..oppo..opgo................',
    '..ogtgootggo................',
    '...oggggggo.................',
    '..oggggggggooooooooo........',
    '.ogggggggggggstsstssoo......',
    '.ogggggggggggstsstsstso.....',
    '.ogggggggggggggggggggggo....',
    '.ogggggggggggggggggggggo....',
    '.ogeeggggeeggggggggggggo....',
    '.ogbbggggbbggggggggggggo....',
    '.oggggggggggggggggggggo.....',
    '..ogggggggggggggggggoo......',
    '...oooggoooooogggggo........',
    '......oo......ooooooooooo...',
    '............................'
  ]];
  const SIGUA_WALK = [[
    '..o........o................',
    '..ooo....ooo................',
    '..oppo..opgo................',
    '..otgtoogggo................',
    '...oggggggo.................',
    '..oggggggggooooooooo........',
    '.ogggggggggggstsstssoo..oo..',
    '.ogggggggggggstsstsstso.oo..',
    '.ogggggggggggggggggggggogo..',
    '.ogeggggegggggggggggggggto..',
    '.ogeggggegggggggggggggggo...',
    '.obbggggbbgggggggggggggo....',
    '.oggggggggggggggggggggo.....',
    '..ogggggggggggggggggoo......',
    '...oggggoggooooggooo........',
    '....oooo.oo....oo...oo......',
    '............................'
  ], [
    '..o........o................',
    '..ooo....ooo................',
    '..oppo..opgo................',
    '..otgtoogggo................',
    '...oggggggo.................',
    '..oggggggggooooooooo........',
    '.ogggggggggggstsstssoo.oo...',
    '.ogggggggggggstsstsstso.oo..',
    '.ogggggggggggggggggggggogo..',
    '.ogeggggegggggggggggggggto..',
    '.ogeggggegggggggggggggggo...',
    '.obbggggbbgggggggggggggo....',
    '.oggggggggggggggggggggo.....',
    '..ogggggggggggggggggoo......',
    '...oogggooggooggoooo........',
    '.....ooo..oo..oo...oo.......',
    '............................'
  ]];
  // 南瓜：小只金渐层，杏金色，额头一小块灰棕色。
  const NG = { o: '#6e4a2c', g: '#ecb46a', s: '#9a8a80', t: '#c88a48', w: '#f8e7c6', p: '#efaab6', e: '#2a2018', b: '#f4a8a0' };
  const NANGUA_CURL = [
    '..o.....o...........',
    '..oo...oo...........',
    '..ogooogo...........',
    '..oggtggo...........',
    '.ogggggggoooooo.....',
    '.oggggggggstssto....',
    '.oggggggggstsstso...',
    '.oeeggggeeggggggo...',
    '.obbggggbbggggggo...',
    '.ogggggggggggggo....',
    '..ooggooggggggo.....',
    '....oo..oooooooooo..',
    '....................'
  ];
  const NANGUA_WALK = [[
    '..o.....o...........',
    '..oo...oo...........',
    '..osooogo........oo.',
    '..ogtgggo........oo.',
    '.ogggggggoooooo..oo.',
    '.oggggggggstssto.oo.',
    '.oeggggeggstsstsoo..',
    '.oeggggeggggggggo...',
    '.bbggggbbgggggggo...',
    '.ogggggggggggggo....',
    '..ogggoggooggoo.....',
    '...ooo.oo..oo.oo....',
    '....................'
  ], [
    '..o.....o...........',
    '..oo...oo...........',
    '..osooogo.......oo..',
    '..ogtgggo........oo.',
    '.ogggggggoooooo..oo.',
    '.oggggggggstssto.oo.',
    '.oeggggeggstsstsoo..',
    '.oeggggeggggggggo...',
    '.bbggggbbgggggggo...',
    '.ogggggggggggggo....',
    '..ooggooggggogo.....',
    '....oo..oooo.oo.....',
    '....................'
  ]];
  // 呼吸：把中间一行多画一次，团子轻轻鼓起来
  const puff = (rows, on) => on ? rows.slice(0, 8).concat([rows[8]], rows.slice(8)) : rows;
  function siguaLying(lift, tailUp) { sprite(puff(SIGUA_SLEEP[tailUp ? 1 : 0], lift), SG, 0, -lift); }
  function siguaWalking(frame) { sprite(SIGUA_WALK[frame], SG, 0, 0); }
  function nanguaCurl() { sprite(NANGUA_CURL, NG, 0, 0); }
  function nanguaWalking(frame) { sprite(NANGUA_WALK[frame], NG, 0, 0); }

  // 点猫咪时冒出来的小爱心
  const HEART = ['.r.r.', 'rrrrr', 'rrrrr', '.rrr.', '..r..'];
  const hearts = [];
  function popHeart(x, y) { if (!reduceMotion) hearts.push({ x, y, t: 0 }); }

  // 阿里：白色长腿小狗，橙色背心。头朝右画。
  const ALI_TOP = [
    '...k.....k......',
    '..kck...kck.....',
    '..kcck.kcck.....',
    '..kcwwkwwwck....',
    '..kwwwwwwwwk....',
    '..kwwwwwwwwwk...',
    '..kwwwewwwwwwkk.',
    '..kwwwwwwwwwwwbk',
    '..kwwwwwwwwwkk..',
    '...kwwwwwwwk....',
    '..kwwwwwwwwwk...',
    '..kvvvvvvvvvk...',
    '.kvvVvvvvVvvk...',
    '.kvvvvvvvvvvk...',
    '.kvvvVvvvvvvk...',
    '.kwwwwwwwwwwk...'
  ];
  const AL = { k: '#b3b3b3', c: '#f0d9a8', w: '#ffffff', e: '#222222', b: '#222222', v: '#e8a33c', V: '#c9822a' };
  function ali(frame, running) {
    sprite(ALI_TOP, AL, 0, 0);
    const legs = !running ? [[2, 0], [8, 0]] : frame ? [[1, 0], [9, 1]] : [[3, 1], [7, 0]];
    legs.forEach(([lx, up]) => { rect(lx, 16, 4, 4 - up, AL.k); rect(lx + 1, 16, 2, 3 - up, AL.w); });
    const wag = tick % 2 === 0;
    rect(wag ? -2 : -3, wag ? 11 : 9, 2, 2, AL.w); rect(wag ? -3 : -5, wag ? 9 : 7, 2, 3, AL.w);
  }
  const ZZZ = ['kkk', '..k', '.k.', 'kkk'];

  // ---------- 行为 ----------
  const FLOOR = 99;
  const RUG_X = 64;
  const sigua = { x: RUG_X, state: 'nap', dir: -1, target: RUG_X, wait: rand(40, 90), frame: 0 };
  const nangua = { x: 90, state: 'curl', dir: -1, frame: 0 };
  const dog = { x: 116, dir: 1, state: 'idle', target: 116, wait: rand(10, 30), hop: 0, frame: 0 };
  const HOP = [0, 2, 4, 5, 5, 4, 2, 0];

  function stepToward(a, speed) {
    const d = a.target - a.x;
    if (Math.abs(d) <= speed) { a.x = a.target; return true; }
    a.dir = d > 0 ? 1 : -1; a.x += a.dir * speed;
    if (tick % 2 === 0) a.frame ^= 1;
    return false;
  }

  function update() {
    // 丝瓜：趴着陪南瓜 → 起身溜达 → 回来趴下
    if (sigua.state === 'nap' && --sigua.wait <= 0) {
      sigua.state = 'walk'; sigua.target = Math.round(rand(4, 100));
      if (Math.abs(sigua.target - RUG_X) < 20) sigua.target = sigua.target < RUG_X ? 20 : 100;
      nangua.state = Math.random() < 0.6 ? 'follow' : 'alone';
      if (nangua.state === 'follow') nangua.x = 90;
    } else if (sigua.state === 'walk' && stepToward(sigua, 1)) {
      sigua.state = 'pause'; sigua.wait = rand(15, 35);
    } else if (sigua.state === 'pause' && --sigua.wait <= 0) {
      sigua.state = 'home'; sigua.target = RUG_X;
    } else if (sigua.state === 'home' && stepToward(sigua, 1)) {
      sigua.state = 'nap'; sigua.wait = rand(60, 140); sigua.dir = -1;
    }
    // 南瓜：跟在丝瓜身后，或者自己接着睡
    if (nangua.state === 'follow') {
      const want = sigua.x + (sigua.dir > 0 ? -19 : 27);
      if (Math.abs(want - nangua.x) > 1) { nangua.dir = want > nangua.x ? 1 : -1; nangua.x += nangua.dir * 1.2; if (tick % 2 === 0) nangua.frame ^= 1; }
      if (sigua.state === 'nap') { nangua.state = 'curl'; nangua.x = 90; }
    } else if (nangua.state === 'alone' && sigua.state === 'nap') nangua.state = 'curl';

    // 阿里：在右半边跑来跑去，偶尔原地蹦两下
    if (dog.hop > 0) { dog.hop--; }
    else if (dog.state === 'idle' && --dog.wait <= 0) {
      if (Math.random() < 0.4) { dog.hop = HOP.length * 2; dog.wait = rand(10, 25); }
      else { dog.state = 'run'; dog.target = Math.round(rand(104, 158)); }
    } else if (dog.state === 'run' && stepToward(dog, 1.5)) {
      dog.state = 'idle'; dog.wait = rand(12, 40);
      if (Math.random() < 0.5) dog.hop = HOP.length;
    }
  }

  // ---------- 房间 ----------
  const pal = () => lampOn ? {
    wall: '#3a2f52', wallDark: '#2c2442', stripe: '#43375f', trim: '#1c1730',
    floor: '#4a3445', floorDark: '#3a2837', plank: '#2e2030',
    wood: '#6a4a52', woodDark: '#4e3540', woodLight: '#8a6470',
    rug: '#7a3f5e', rugIn: '#934d6e', door: '#5a4060', doorDark: '#43304a'
  } : {
    wall: '#211c36', wallDark: '#18142a', stripe: '#272140', trim: '#100d1e',
    floor: '#2a1f30', floorDark: '#211827', plank: '#191220',
    wood: '#3f2d3e', woodDark: '#2f2130', woodLight: '#523a4f',
    rug: '#4a2a42', rugIn: '#57334e', door: '#382a42', doorDark: '#2a1f33'
  };

  function city() {
    rect(12, 8, 38, 32, lampOn ? '#2a2550' : '#151230');
    dither(12, 8, 38, 10, lampOn ? '#3a3068' : '#1f1a40');
    [[12, 22, 8], [20, 16, 6], [26, 24, 7], [33, 13, 6], [39, 20, 5], [44, 26, 6]].forEach(([x, top, w]) => {
      rect(x, top, w, 40 - top, '#120f24');
      for (let yy = top + 2; yy < 38; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2)
        if ((xx * 7 + yy * 3 + Math.floor(tick / 30)) % 5 === 0) rect(xx, yy, 1, 1, (xx + yy) % 3 ? '#ffcf6a' : '#5fe1ff');
    });
    rect(34, 11, 4, 1, '#ff5fa2');
    rect(16, 11, 2, 2, '#f5f0c8');
  }

  function drawRoom(c) {
    rect(0, 0, W, 74, c.wall);
    for (let x = 3; x < W; x += 6) rect(x, 0, 1, 74, c.stripe);
    dither(0, 0, W, 8, c.wallDark);
    dither(0, 62, W, 10, c.wallDark, 1);
    rect(0, 72, W, 2, c.trim);
    rect(0, 74, W, H - 74, c.floor);
    for (let y = 80; y < H; y += 6) rect(0, y, W, 1, c.plank);
    dither(0, 102, W, 6, c.floorDark);

    rect(8, 4, 46, 40, c.trim); city();
    rect(30, 8, 2, 32, c.trim); rect(12, 23, 38, 1, c.trim);
    rect(6, 42, 50, 3, c.woodDark); rect(6, 42, 50, 1, c.woodLight);

    const neonOn = reduceMotion || Math.floor(tick / 20) % 7 !== 0;
    sprite(['.k.k.', 'kkkkk', 'kkkkk', '.kkk.', '..k..'], { k: neonOn ? '#ff5fa2' : '#6a3a58' }, 66, 14);
    rect(78, 10, 18, 22, c.trim); rect(79, 11, 16, 20, '#5fb3c8'); dither(79, 21, 16, 10, '#3d7f96'); rect(83, 15, 8, 6, '#ffcf6a');

    rect(134, 18, 24, 70, c.woodDark); rect(134, 18, 24, 1, c.woodLight);
    [22, 44, 66].forEach((y, i) => {
      rect(136, y, 20, 19, c.trim);
      const books = [['#d9566c', 3, 15], ['#5fb3a0', 2, 12], ['#e8c06a', 3, 17], ['#7e8fd9', 2, 13], ['#c58adf', 3, 11], ['#5fe1ff', 2, 14]];
      let bx = 137;
      books.slice(i, i + 4).forEach(([col, bw, bh]) => { rect(bx, y + 19 - bh, bw, bh, col); bx += bw + 1; });
    });

    rect(166, 28, 22, 46, c.doorDark); rect(168, 30, 18, 44, c.door); dither(168, 30, 18, 44, c.doorDark, 1);
    rect(170, 34, 14, 5, '#e8dcc8'); rect(171, 36, 12, 1, c.doorDark); rect(182, 52, 2, 2, '#e8c06a');

    rect(62, 62, 66, 4, c.wood); rect(62, 62, 66, 1, c.woodLight);
    rect(64, 66, 3, 20, c.woodDark); rect(123, 66, 3, 20, c.woodDark);
    rect(88, 51, 16, 11, '#1a1828'); rect(89, 52, 14, 9, '#1e3b52');
    rect(90, 54, 8, 1, '#5fe1ff'); rect(90, 56, 11, 1, '#5fe1ff'); rect(90, 58, 6, 1, '#5fe1ff');
    if (!reduceMotion && Math.floor(tick / 6) % 2 === 0) rect(97, 58, 2, 1, '#ffffff');
    rect(85, 61, 22, 1, '#3a3848');
    rect(70, 59, 12, 3, '#e8dcc8'); rect(71, 60, 10, 1, '#b0a594');
    rect(108, 58, 3, 4, '#e8dcc8'); rect(111, 59, 1, 2, '#e8dcc8');
    if (!reduceMotion) rect(109, 54 - (tick % 8 > 3 ? 1 : 0), 1, 2, '#b0a59488');
    rect(116, 52, 1, 10, '#2a2838'); rect(113, 61, 7, 1, '#2a2838');
    rect(112, 49, 9, 4, lampOn ? '#ffd38a' : '#55506a');
    if (lampOn) { ctx.fillStyle = 'rgba(255, 211, 138, 0.16)'; ctx.beginPath(); ctx.moveTo(112, 53); ctx.lineTo(121, 53); ctx.lineTo(127, 62); ctx.lineTo(106, 62); ctx.closePath(); ctx.fill(); }

    rect(56, 80, 6, 6, '#c76b4a'); rect(55, 80, 8, 1, '#e08a62');
    sprite(['..g..', '.ggg.', 'g.g.g', '.ggg.', '..g..'], { g: '#5fb38a' }, 56, 74);

    rect(60, 92, 68, 10, c.rug); rect(64, 94, 60, 6, c.rugIn); dither(64, 94, 60, 6, c.rug, 1);
    rect(140, 94, 22, 6, '#8a5070'); rect(142, 92, 18, 3, '#a8648a'); dither(142, 95, 18, 4, '#6e3d59');
    rect(166, 96, 7, 3, '#5fb3c8'); rect(167, 95, 5, 1, '#e8c06a');
  }

  // 每个角色当前的可点击范围
  const boxes = {};
  function drawPets() {
    const breathe = !reduceMotion && Math.floor(tick / 15) % 2 === 0 ? 1 : 0;
    const actors = [];

    if (sigua.state === 'nap') {
      actors.push({ y: FLOOR, draw: () => drawAt(sigua.x, 84, 28, false, () => siguaLying(breathe, Math.floor(tick / 12) % 2 === 0)), box: ['sigua', sigua.x, 83, 28, 16] });
    } else {
      actors.push({ y: FLOOR, draw: () => drawAt(sigua.x, 84, 28, sigua.dir > 0, () => siguaWalking(sigua.frame)), box: ['sigua', sigua.x, 83, 28, 16] });
    }

    if (nangua.state === 'follow') {
      actors.push({ y: FLOOR + 0.5, draw: () => drawAt(nangua.x, 88, 20, nangua.dir > 0, () => nanguaWalking(nangua.frame)), box: ['nangua', nangua.x, 87, 20, 12] });
    } else {
      actors.push({ y: FLOOR + 0.5, draw: () => drawAt(nangua.x, 88, 20, false, nanguaCurl), box: ['nangua', nangua.x, 87, 20, 12] });
      if (!reduceMotion) {
        const step = Math.floor(tick / 3) % 12;
        actors.push({ y: 200, draw: () => sprite(ZZZ, { k: '#c9c2f0' }, 100 + (step > 6 ? 1 : 0), 82 - Math.floor(step / 2)) });
      }
    }

    const hopY = dog.hop > 0 ? HOP[dog.hop % HOP.length] : 0;
    actors.push({ y: FLOOR - 0.5, draw: () => drawAt(dog.x, 79 - hopY, 16, dog.dir < 0, () => ali(dog.frame, dog.state === 'run')), box: ['ali', dog.x, 77 - hopY, 17, 23] });

    actors.sort((a, b) => a.y - b.y).forEach(a => a.draw());
    for (let i = hearts.length - 1; i >= 0; i--) {
      const h = hearts[i]; h.t++;
      if (h.t > 24) { hearts.splice(i, 1); continue; }
      sprite(HEART, { r: h.t > 16 && h.t % 2 ? '#ff9ec4' : '#ff5fa2' }, Math.round(h.x + Math.sin(h.t / 3)), Math.round(h.y - h.t / 2));
    }
    Object.keys(boxes).forEach(k => delete boxes[k]);
    actors.forEach(a => { if (a.box) boxes[a.box[0]] = a.box.slice(1); });
  }

  function draw() {
    drawRoom(pal());
    drawPets();
    if (!lampOn) {
      ctx.fillStyle = 'rgba(8, 6, 20, 0.25)'; ctx.fillRect(0, 0, W, H);
      rect(89, 52, 14, 9, '#1e3b52'); rect(90, 54, 8, 1, '#5fe1ff'); rect(90, 56, 11, 1, '#5fe1ff');
    }
  }

  // ---------- 互动 ----------
  const places = [
    { id: 'lamp', x: 112, y: 49, w: 9, h: 14, label: '台灯 · 开关' },
    { id: 'laptop', x: 86, y: 51, w: 20, h: 12, label: '电脑 · 技术笔记', href: '/notes/' },
    { id: 'desk', x: 62, y: 58, w: 66, h: 20, label: '书桌 · 作品集', href: '/works/' },
    { id: 'shelf', x: 134, y: 18, w: 24, h: 70, label: '书架 · 书影音', href: '/shelf/' },
    { id: 'door', x: 166, y: 28, w: 22, h: 46, label: '门 · 关于我', href: '/about/' },
    { id: 'window', x: 8, y: 4, w: 46, h: 40, label: '窗外' }
  ];
  const petLabels = { sigua: '丝瓜 · 男妈妈', nangua: '南瓜 · 小宝', ali: '阿里 · 这个家的狗' };
  const lines = {
    sigua: ['嘘，南瓜在睡觉。', '我看着南瓜呢，你去忙吧。', '你今天吃饭了吗？', '（轻轻舔了舔南瓜的头）'],
    siguaWalk: ['我去巡视一下，马上回来。', '南瓜，跟紧点。', '（尾巴竖得高高的）'],
    nangua: ['zzz……', '（往丝瓜怀里拱了拱）', '我还小，不用写稿。zzz'],
    nanguaWalk: ['等等我！', '（迈着小短腿追丝瓜）', '丝瓜去哪我去哪。'],
    ali: ['你回来啦！', '出门吗？出门吗？出门吗？', '这里是我家。猫是客人。', '（原地蹦了两下）'],
    window: ['外面的霓虹一直亮着。', '今晚的城市很安静。']
  };
  const speakers = { sigua: '丝瓜', nangua: '南瓜', ali: '阿里', window: '窗外' };

  function typeLine(who, text) {
    nameEl.textContent = who;
    clearInterval(typing);
    if (reduceMotion) { textEl.textContent = text; return; }
    let i = 0; textEl.textContent = '';
    typing = setInterval(() => { textEl.textContent = text.slice(0, ++i); if (i >= text.length) clearInterval(typing); }, 45);
  }
  function scenePoint(evt) {
    const r = canvas.getBoundingClientRect();
    return { x: (evt.clientX - r.left) / r.width * W, y: (evt.clientY - r.top) / r.height * H };
  }
  const inside = (p, x, y, w, h) => p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h;
  function hit(p) {
    for (const id of ['nangua', 'ali', 'sigua']) {
      const b = boxes[id];
      if (b && inside(p, b[0], b[1], b[2], b[3])) return { id, label: petLabels[id], x: b[0], y: b[1], w: b[2], h: b[3] };
    }
    for (const s of places) if (inside(p, s.x, s.y, s.w, s.h)) return s;
    return null;
  }
  function setLamp(on) {
    lampOn = on;
    try { localStorage.setItem('pixel-room-lamp', on ? 'on' : 'off'); } catch (e) {}
    if (lampBtn) lampBtn.textContent = on ? '关灯' : '开灯';
    draw();
  }
  function go(href) { window.location.href = root.dataset.base.replace(/\/$/, '') + href; }

  canvas.addEventListener('mousemove', evt => {
    const s = hit(scenePoint(evt));
    canvas.style.cursor = s ? 'pointer' : 'default';
    if (s) {
      tip.textContent = s.label;
      tip.style.left = ((s.x + s.w / 2) / W * 100) + '%';
      tip.style.top = (s.y / H * 100) + '%';
      tip.hidden = false;
    } else tip.hidden = true;
  });
  canvas.addEventListener('mouseleave', () => { tip.hidden = true; });
  canvas.addEventListener('click', evt => {
    const s = hit(scenePoint(evt));
    if (!s) return;
    if (s.id === 'sigua' || s.id === 'nangua') {
      const walking = s.id === 'sigua' ? sigua.state !== 'nap' : nangua.state === 'follow';
      const pool = lines[s.id + (walking ? 'Walk' : '')];
      typeLine(speakers[s.id], pool[Math.floor(Math.random() * pool.length)]);
      popHeart(s.x + s.w / 2 - 2, s.y - 4);
      return;
    }
    if (s.id === 'ali') {
      typeLine('阿里', lines.ali[Math.floor(Math.random() * lines.ali.length)]);
      if (!reduceMotion && dog.hop === 0) dog.hop = HOP.length * 2;
      return;
    }
    if (s.id === 'window') { typeLine('窗外', lines.window[Math.floor(Math.random() * lines.window.length)]); return; }
    if (s.id === 'lamp') { setLamp(!lampOn); typeLine('台灯', lampOn ? '咔哒。灯亮了。' : '咔哒。只剩窗外的霓虹。'); return; }
    if (s.href) go(s.href);
  });
  if (lampBtn) lampBtn.addEventListener('click', () => setLamp(!lampOn));

  const dateEl = root.querySelector('.pr-date');
  if (dateEl) {
    const d = new Date();
    dateEl.textContent = `${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()]} ${d.getMonth() + 1}/${d.getDate()}`;
  }

  setLamp(lampOn);
  typeLine('阿里', '你回来啦！今天丝瓜带着南瓜来串门了。点点我们，或者点家具去别的地方看看。');
  if (!reduceMotion) setInterval(() => { tick++; update(); draw(); }, 90);
})();
