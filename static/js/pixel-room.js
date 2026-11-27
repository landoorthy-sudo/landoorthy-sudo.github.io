// 像素小房间 v2：暗色低像素 + 网点阴影 + 对话框。阿里的家，丝瓜和南瓜来串门。
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
  let tick = 0, blinkUntil = 0, typing = null;

  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  // 棋盘网点：两色交错，用来做像素游戏里的渐变阴影
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

  // 丝瓜：大只银渐层，侧脸趴着，眯眼，温和的"男妈妈"
  const SIGUA_HEAD = [
    '...k......k...',
    '..kgk....kgk..',
    '..kgnkkkkkngk.',
    '.kgggsgsgsgggk',
    'kglllllllllggk',
    'kgkkllllllgggk',
    'klllllllllgggk',
    'knwllllllggggk',
    '.kwwllllgggk..',
    '..kkwwwwgk....'
  ];
  const SIGUA_HEAD_BLINK = { 5: 'kglllllllllggk' };
  const SIGUA_PAL = { k: '#565a62', g: '#b4b8bf', l: '#dfe2e6', w: '#f8f8f5', n: '#e8a0a0', s: '#868a91' };
  function drawSigua(ox, oy, lift, blink, tailUp) {
    const Pl = SIGUA_PAL;
    rect(ox + 9, oy + 3 - lift, 25, 12 + lift, Pl.k);
    rect(ox + 10, oy + 4 - lift, 23, 10 + lift, Pl.g);
    rect(ox + 10, oy + 10, 22, 4, Pl.l);
    for (let x = ox + 14; x < ox + 31; x += 5) rect(x, oy + 4 - lift, 2, 2, Pl.s);
    rect(ox + 32, oy + (tailUp ? 9 : 11), 4, 2, Pl.k); rect(ox + 33, oy + (tailUp ? 9 : 11), 2, 1, Pl.s);
    rect(ox + 2, oy + 12, 10, 3, Pl.k); rect(ox + 3, oy + 12, 8, 2, Pl.w);
    const head = SIGUA_HEAD.slice();
    if (blink) Object.entries(SIGUA_HEAD_BLINK).forEach(([i, r]) => { head[i] = r; });
    sprite(head, Pl, ox, oy + 1);
  }

  // 南瓜：小只金渐层，缩成一团睡在丝瓜怀里
  const NANGUA = [
    '.k..k.........',
    'kdkkdkkkkkk...',
    'koooooododdk..',
    'kokkokooooodk.',
    'koooooodoooook',
    '.kcnoooooooodk',
    '.kccoodddddook',
    '..kkkkkkkkkkk.'
  ];
  const NANGUA_PAL = { k: '#6b4a2a', o: '#dba757', d: '#b8843a', c: '#f6e6c2', n: '#e8a0a0' };

  const ALI = [
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
    '.kwwwwwwwwwwk...',
    '..kwwk..kwwk....',
    '..kwwk..kwwk....',
    '..kwwk..kwwk....',
    '..kwwk..kwwk....',
    '..kkkk..kkkk....'
  ];
  const ALI_PAL = { k: '#b3b3b3', c: '#f0d9a8', w: '#ffffff', e: '#222222', b: '#222222', v: '#e8a33c', V: '#c9822a' };

  const ZZZ = ['kkk', '..k', '.k.', 'kkk'];


  const P = () => lampOn ? {
    wall: '#3a2f52', wallDark: '#2c2442', stripe: '#43375f', trim: '#1c1730',
    floor: '#4a3445', floorDark: '#3a2837', plank: '#2e2030',
    wood: '#6a4a52', woodDark: '#4e3540', woodLight: '#8a6470',
    rug: '#7a3f5e', rugIn: '#934d6e', door: '#5a4060', doorDark: '#43304a',
    glow: '#ffd38a'
  } : {
    wall: '#211c36', wallDark: '#18142a', stripe: '#272140', trim: '#100d1e',
    floor: '#2a1f30', floorDark: '#211827', plank: '#191220',
    wood: '#3f2d3e', woodDark: '#2f2130', woodLight: '#523a4f',
    rug: '#4a2a42', rugIn: '#57334e', door: '#382a42', doorDark: '#2a1f33',
    glow: '#ffd38a'
  };

  const spots = [
    { id: 'nangua', x: 82, y: 91, w: 15, h: 9, label: '南瓜 · 小宝' },
    { id: 'sigua', x: 64, y: 82, w: 38, h: 16, label: '丝瓜 · 男妈妈' },
    { id: 'ali', x: 112, y: 77, w: 17, h: 22, label: '阿里' },
    { id: 'lamp', x: 112, y: 49, w: 9, h: 14, label: '台灯 · 开关' },
    { id: 'laptop', x: 86, y: 51, w: 20, h: 12, label: '电脑 · AI 与技术', href: '/notes/' },
    { id: 'desk', x: 62, y: 60, w: 66, h: 26, label: '书桌 · 写作', href: '/desk/' },
    { id: 'shelf', x: 134, y: 18, w: 24, h: 70, label: '书架 · 读书 游戏 影视', href: '/shelf/' },
    { id: 'door', x: 166, y: 28, w: 22, h: 46, label: '门 · 关于我', href: '/about/' },
    { id: 'window', x: 10, y: 6, w: 42, h: 16, label: '窗外' }
  ];
  const lines = {
    sigua: ['嘘，南瓜在睡觉。', '我看着南瓜呢，你去忙吧。', '你今天吃饭了吗？', '（轻轻舔了舔南瓜的头）'],
    nangua: ['zzz……', '（往丝瓜怀里拱了拱）', '我还小，不用写稿。zzz'],
    ali: ['你回来啦！', '出门吗？出门吗？出门吗？', '这里是我家。猫是客人。', '尾巴停不下来，没办法。'],
    window: ['外面的霓虹一直亮着。', '今晚的城市很安静。']
  };
  const speakers = { sigua: '丝瓜', nangua: '南瓜', ali: '阿里', window: '窗外' };

  function city(c) {
    rect(12, 8, 38, 32, lampOn ? '#2a2550' : '#151230');
    dither(12, 8, 38, 10, lampOn ? '#3a3068' : '#1f1a40');
    const blds = [[12, 22, 8], [20, 16, 6], [26, 24, 7], [33, 13, 6], [39, 20, 5], [44, 26, 6]];
    blds.forEach(([x, top, w]) => {
      rect(x, top, w, 40 - top, '#120f24');
      for (let yy = top + 2; yy < 38; yy += 3) for (let xx = x + 1; xx < x + w - 1; xx += 2)
        if ((xx * 7 + yy * 3 + Math.floor(tick / 8)) % 5 === 0) rect(xx, yy, 1, 1, (xx + yy) % 3 ? '#ffcf6a' : '#5fe1ff');
    });
    rect(34, 11, 4, 1, '#ff5fa2');
    rect(16, 11, 2, 2, '#f5f0c8');
  }

  function draw() {
    const c = P();
    rect(0, 0, W, 74, c.wall);
    for (let x = 3; x < W; x += 6) rect(x, 0, 1, 74, c.stripe);
    dither(0, 0, W, 8, c.wallDark);
    dither(0, 62, W, 10, c.wallDark, 1);
    rect(0, 72, W, 2, c.trim);
    rect(0, 74, W, H - 74, c.floor);
    for (let y = 80; y < H; y += 6) rect(0, y, W, 1, c.plank);
    dither(0, 96, W, 12, c.floorDark);

    // 窗与城市
    rect(8, 4, 46, 40, c.trim);
    city(c);
    rect(30, 8, 2, 32, c.trim); rect(12, 23, 38, 1, c.trim);
    rect(6, 42, 50, 3, c.woodDark); rect(6, 42, 50, 1, c.woodLight);

    // 墙上的小霓虹爱心和海报
    const neonOn = reduceMotion || Math.floor(tick / 6) % 7 !== 0;
    const heart = ['.k.k.', 'kkkkk', 'kkkkk', '.kkk.', '..k..'];
    sprite(heart, { k: neonOn ? '#ff5fa2' : '#6a3a58' }, 66, 14);
    rect(78, 10, 18, 22, c.trim); rect(79, 11, 16, 20, '#5fb3c8'); dither(79, 21, 16, 10, '#3d7f96');
    rect(83, 15, 8, 6, '#ffcf6a');

    // 书架
    rect(134, 18, 24, 70, c.woodDark); rect(134, 18, 24, 1, c.woodLight);
    [22, 44, 66].forEach((y, i) => {
      rect(136, y, 20, 19, c.trim);
      const books = [['#d9566c', 3, 15], ['#5fb3a0', 2, 12], ['#e8c06a', 3, 17], ['#7e8fd9', 2, 13], ['#c58adf', 3, 11], ['#5fe1ff', 2, 14]];
      let bx = 137;
      books.slice(i, i + 4).forEach(([col, bw, bh]) => { rect(bx, y + 19 - bh, bw, bh, col); dither(bx, y + 19 - bh, bw, 2, '#ffffff22'); bx += bw + 1; });
    });

    // 门
    rect(166, 28, 22, 46, c.doorDark);
    rect(168, 30, 18, 44, c.door);
    dither(168, 30, 18, 44, c.doorDark, 1);
    rect(170, 34, 14, 5, '#e8dcc8'); rect(171, 36, 12, 1, c.doorDark);
    rect(182, 52, 2, 2, '#e8c06a');

    // 书桌
    rect(62, 62, 66, 4, c.wood); rect(62, 62, 66, 1, c.woodLight);
    rect(64, 66, 3, 20, c.woodDark); rect(123, 66, 3, 20, c.woodDark);
    // 电脑
    rect(88, 51, 16, 11, '#1a1828'); rect(89, 52, 14, 9, '#1e3b52');
    rect(90, 54, 8, 1, '#5fe1ff'); rect(90, 56, 11, 1, '#5fe1ff'); rect(90, 58, 6, 1, '#5fe1ff');
    if (!reduceMotion && Math.floor(tick / 3) % 2 === 0) rect(97, 58, 2, 1, '#ffffff');
    rect(85, 61, 22, 1, '#3a3848');
    // 本子、咖啡
    rect(70, 59, 12, 3, '#e8dcc8'); rect(71, 60, 10, 1, '#b0a594');
    rect(108, 58, 3, 4, '#e8dcc8'); rect(111, 59, 1, 2, '#e8dcc8');
    if (!reduceMotion) rect(109, 54 - (tick % 4 > 1 ? 1 : 0), 1, 2, '#b0a59488');
    // 台灯
    rect(116, 52, 1, 10, '#2a2838'); rect(113, 61, 7, 1, '#2a2838');
    rect(112, 49, 9, 4, lampOn ? '#ffd38a' : '#55506a');
    if (lampOn) { ctx.fillStyle = 'rgba(255, 211, 138, 0.16)'; ctx.beginPath(); ctx.moveTo(112, 53); ctx.lineTo(121, 53); ctx.lineTo(127, 62); ctx.lineTo(106, 62); ctx.closePath(); ctx.fill(); }

    // 植物
    rect(56, 80, 6, 6, '#c76b4a'); rect(55, 80, 8, 1, '#e08a62');
    sprite(['..g..', '.ggg.', 'g.g.g', '.ggg.', '..g..'], { g: '#5fb38a' }, 56, 74);

    // 地毯、南瓜
    rect(60, 92, 68, 10, c.rug); rect(64, 94, 60, 6, c.rugIn); dither(64, 94, 60, 6, c.rug, 1);
    const breathe = !reduceMotion && Math.floor(tick / 5) % 2 === 0 ? 1 : 0;
    drawSigua(64, 83, breathe, !reduceMotion && Date.now() < blinkUntil, !reduceMotion && Math.floor(tick / 4) % 2 === 0);
    sprite(NANGUA, NANGUA_PAL, 83, 91);
    if (!reduceMotion) { const step = tick % 12; sprite(ZZZ, { k: '#c9c2f0' }, 92 + (step > 6 ? 1 : 0), 86 - Math.floor(step / 2)); }

    // 阿里的窝和饭碗
    rect(140, 94, 22, 6, '#8a5070'); rect(142, 92, 18, 3, '#a8648a'); dither(142, 95, 18, 4, '#6e3d59');
    rect(130, 96, 7, 3, '#5fb3c8'); rect(131, 95, 5, 1, '#e8c06a');
    // 阿里
    sprite(ALI, ALI_PAL, 112, 78);
    const wag = !reduceMotion && tick % 2 === 0;
    rect(wag ? 110 : 109, wag ? 90 : 88, 2, 2, '#ffffff'); rect(wag ? 109 : 107, wag ? 88 : 86, 2, 3, '#ffffff');

    // 灯光暖色 / 关灯后整体压暗
    if (!lampOn) { ctx.fillStyle = 'rgba(8, 6, 20, 0.25)'; ctx.fillRect(0, 0, W, H); rect(89, 52, 14, 9, '#1e3b52'); rect(90, 54, 8, 1, '#5fe1ff'); rect(90, 56, 11, 1, '#5fe1ff'); }
  }

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
  function hit(p) {
    for (const s of spots) if (p.x >= s.x && p.x <= s.x + s.w && p.y >= s.y && p.y <= s.y + s.h) return s;
    return null;
  }
  function setLamp(on) {
    lampOn = on;
    try { localStorage.setItem('pixel-room-lamp', on ? 'on' : 'off'); } catch (e) {}
    root.classList.toggle('is-dark', !on);
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
    if (lines[s.id]) {
      const pool = lines[s.id];
      typeLine(speakers[s.id], pool[Math.floor(Math.random() * pool.length)]);
      if (s.id === 'sigua') blinkUntil = Date.now() + 600;
      draw(); return;
    }
    if (s.id === 'lamp') { setLamp(!lampOn); typeLine('台灯', lampOn ? '咔哒。灯亮了。' : '咔哒。只剩窗外的霓虹。'); return; }
    if (s.href) go(s.href);
  });
  if (lampBtn) lampBtn.addEventListener('click', () => setLamp(!lampOn));

  const dateEl = root.querySelector('.pr-date');
  if (dateEl) {
    const d = new Date();
    const wk = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
    dateEl.textContent = `${wk} ${d.getMonth() + 1}/${d.getDate()}`;
  }

  setLamp(lampOn);
  typeLine('阿里', '你回来啦！今天丝瓜带着南瓜来串门了。点点我们，或者点家具去别的地方看看。');
  if (!reduceMotion) setInterval(() => { tick++; if (tick % 14 === 0) blinkUntil = Date.now() + 250; draw(); }, 260);
})();
