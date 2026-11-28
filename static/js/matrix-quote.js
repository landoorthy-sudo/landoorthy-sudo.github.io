// 书架顶部：黑客帝国式字雨（李贺、张岱、《红楼梦》的句子）+ 张岱的引文逐字解码。
// 鼠标靠近时字雨会被拨开、变成青色；点击会重新解码一次。
(function () {
  const hero = document.querySelector('[data-matrix]');
  if (!hero) return;
  const canvas = hero.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 字雨里落的是整句：每一列从上往下，按顺序落一句李贺、张岱或《红楼梦》。
  const VERSES = [
    // 李贺
    '天若有情天亦老', '衰兰送客咸阳道', '黑云压城城欲摧', '甲光向日金鳞开', '报君黄金台上意', '提携玉龙为君死',
    '石破天惊逗秋雨', '昆山玉碎凤凰叫', '芙蓉泣露香兰笑', '雄鸡一声天下白', '我有迷魂招不得', '少年心事当拏云',
    '男儿何不带吴钩', '秋坟鬼唱鲍家诗', '恨血千年土中碧', '桐风惊心壮士苦', '幽兰露如啼眼', '羲和敲日玻璃声',
    '东关酸风射眸子', '忆君清泪如铅水',
    // 张岱：陶庵梦忆序、湖心亭看雪、自为墓志铭
    '陶庵国破家亡', '无所归止', '披发入山', '繁华靡丽', '过眼皆空', '五十年来', '总成一梦',
    '偶拈一则', '如游旧径', '如见故人', '痴人前不得说梦', '鸡鸣枕上', '夜气方回', '黍熟黄粱', '车旅蚁穴',
    '天与云与山与水', '上下一白', '长堤一痕', '湖心亭一点', '余舟一芥', '莫说相公痴', '更有痴似相公者',
    '劳碌半生', '皆成梦幻',
    // 红楼梦
    '满纸荒唐言', '一把辛酸泪', '都云作者痴', '谁解其中味', '假作真时真亦假', '无为有处有还无',
    '寒塘渡鹤影', '冷月葬花魂', '质本洁来还洁去', '一朝春尽红颜老', '花落人亡两不知', '侬今葬花人笑痴',
    '他年葬侬知是谁', '风刀霜剑严相逼', '开辟鸿蒙', '谁为情种', '偷来梨蕊三分白', '借得梅花一缕魂',
    '落了片白茫茫大地真干净', '世事洞明皆学问', '人情练达即文章'
  ];
  const ALL = VERSES.join('').split('');
  const pick = () => ALL[(Math.random() * ALL.length) | 0];
  const verse = () => VERSES[(Math.random() * VERSES.length) | 0];
  const FONT = 16;
  const COL = 22; // 列间距略大于字号，竖着读更清楚

  let W = 0, H = 0, dpr = 1, cols = [], mouse = null;

  function newDrop(c, first) {
    c.text = verse(); c.i = 0;
    c.row = first ? -((Math.random() * 14) | 0) : -((Math.random() * 6) | 0);
    c.speed = 0.25 + Math.random() * 0.45; c.acc = 0;
    c.hot = Math.random() < 0.08; // 少数几列是霓虹粉
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.ceil(W / COL);
    cols = Array.from({ length: n }, (_, i) => {
      if (cols[i]) return cols[i];
      const c = {}; newDrop(c, true); return c;
    });
    ctx.fillStyle = '#0a0918'; ctx.fillRect(0, 0, W, H);
  }

  function frame() {
    ctx.fillStyle = 'rgba(10, 9, 24, 0.10)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT + 'px "LXGW WenKai", "Songti SC", serif';
    ctx.textBaseline = 'top';
    const rows = Math.ceil(H / FONT);
    cols.forEach((c, k) => {
      const x = k * COL + (COL - FONT) / 2;
      const near = mouse ? Math.max(0, 1 - Math.abs(x - mouse.x) / 90) : 0;
      c.acc += c.speed * (1 + near * 1.5);
      if (c.acc < 1) return;
      c.acc -= 1;
      // 往下落一格：上一格变成余晖色，新的一格是亮白的字头
      const y = c.row * FONT;
      const parted = mouse && near > 0.2 && Math.abs(y - mouse.y) < 60 * near; // 靠近鼠标的那一段被拨开
      if (c.i > 0 && c.i <= c.text.length && !parted) {
        ctx.fillStyle = '#0a0918'; ctx.fillRect(x, y - FONT, FONT, FONT);
        ctx.fillStyle = near > 0 ? `rgba(95, 225, 255, ${0.55 + near * 0.45})` : (c.hot ? '#ff5fa2' : '#39ff88');
        ctx.fillText(c.text[c.i - 1], x, y - FONT);
      }
      if (c.i < c.text.length && !parted) {
        ctx.fillStyle = '#e6fff0';
        ctx.fillText(c.text[c.i], x, y);
      }
      c.i++; c.row++;
      if (c.i > c.text.length + 2 + ((Math.random() * 6) | 0) || c.row > rows + 1) newDrop(c, false);
    });
  }

  // ---------- 引文解码 ----------
  const lines = Array.from(hero.querySelectorAll('[data-text]'));
  lines.forEach(el => {
    el.textContent = '';
    Array.from(el.dataset.text).forEach(ch => {
      const s = document.createElement('span');
      s.dataset.ch = ch;
      s.textContent = ch;
      el.appendChild(s);
    });
  });
  const spans = lines.flatMap(el => Array.from(el.children));
  let decodeTimer = null;

  function decode() {
    if (reduceMotion) { spans.forEach(s => { s.textContent = s.dataset.ch; s.className = 'ok'; }); return; }
    clearInterval(decodeTimer);
    const start = performance.now();
    spans.forEach((s, i) => {
      s.dataset.at = 250 + i * 70 + Math.random() * 220;
      s.className = 'scr';
    });
    decodeTimer = setInterval(() => {
      const t = performance.now() - start;
      let done = true;
      spans.forEach(s => {
        if (s.dataset.ch.trim() === '' || /[《》·——。，\s]/.test(s.dataset.ch) && t > +s.dataset.at) { s.textContent = s.dataset.ch; s.className = 'ok'; return; }
        if (t < +s.dataset.at) { s.textContent = pick(); done = false; }
        else if (s.className !== 'ok') { s.textContent = s.dataset.ch; s.className = 'ok flash'; }
      });
      if (done) clearInterval(decodeTimer);
    }, 55);
  }

  // 鼠标划过某个字：短暂乱码一下
  spans.forEach(s => s.addEventListener('mouseenter', () => {
    if (reduceMotion || s.className.indexOf('ok') < 0) return;
    let n = 0;
    const t = setInterval(() => {
      s.textContent = ++n > 5 ? s.dataset.ch : pick();
      if (n > 5) clearInterval(t);
    }, 45);
  }));

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    mouse = { x: e.clientX - r.left, y: e.clientY - r.top };
  });
  hero.addEventListener('mouseleave', () => { mouse = null; });
  hero.addEventListener('click', decode);
  hero.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); decode(); } });

  resize();
  window.addEventListener('resize', resize);
  if (reduceMotion) {
    for (let i = 0; i < 200; i++) frame(); // 静止的一帧
  } else {
    let last = 0;
    (function loop(t) {
      if (t - last > 50) { frame(); last = t; }
      requestAnimationFrame(loop);
    })(0);
  }
  decode();
})();
