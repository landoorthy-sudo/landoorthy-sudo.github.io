// 书架顶部：黑客帝国式字雨 + 张岱的引文逐字解码。
// 鼠标靠近时字雨会被拨开、变成青色；点击会重新解码一次。
(function () {
  const hero = document.querySelector('[data-matrix]');
  if (!hero) return;
  const canvas = hero.querySelector('canvas');
  const ctx = canvas.getContext('2d');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const GLYPHS = ('ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789' +
    '人无癖疵不可与交以其深情真气也书影音读看听').split('');
  const pick = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];
  const FONT = 16;

  let W = 0, H = 0, dpr = 1, cols = [], mouse = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = hero.clientWidth; H = hero.clientHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.ceil(W / FONT);
    cols = Array.from({ length: n }, (_, i) => cols[i] || {
      y: Math.random() * -H,
      speed: 0.35 + Math.random() * 0.65,
      hot: Math.random() < 0.06 // 少数几列是霓虹粉
    });
    ctx.fillStyle = '#0a0918'; ctx.fillRect(0, 0, W, H);
  }

  function frame() {
    ctx.fillStyle = 'rgba(10, 9, 24, 0.14)';
    ctx.fillRect(0, 0, W, H);
    ctx.font = FONT + 'px "LXGW WenKai", monospace';
    ctx.textBaseline = 'top';
    cols.forEach((c, i) => {
      const x = i * FONT;
      let near = 0;
      if (mouse) {
        const dx = x - mouse.x;
        near = Math.max(0, 1 - Math.abs(dx) / 90);
      }
      const y = c.y;
      // 靠近鼠标的那一段被拨开：不画
      const parted = mouse && near > 0.2 && Math.abs(y - mouse.y) < 70 * near;
      if (!parted) {
        ctx.fillStyle = '#d9ffe9';
        ctx.fillText(pick(), x, y);
        ctx.fillStyle = near > 0 ? `rgba(95, 225, 255, ${0.5 + near * 0.5})` : (c.hot ? '#ff5fa2' : '#39ff88');
        ctx.fillText(pick(), x, y - FONT);
      }
      c.y += FONT * c.speed * (1 + near * 1.5);
      if (c.y > H + FONT * 2 && Math.random() > 0.96) { c.y = -FONT * (1 + Math.random() * 10); c.speed = 0.35 + Math.random() * 0.65; }
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
    for (let i = 0; i < 40; i++) frame(); // 静止的一帧
  } else {
    let last = 0;
    (function loop(t) {
      if (t - last > 50) { frame(); last = t; }
      requestAnimationFrame(loop);
    })(0);
  }
  decode();
})();
