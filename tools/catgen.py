"""生成首页像素房间里丝瓜和南瓜的像素图。
风格：头和身子连成一个圆团子，豆豆眼、腮红，小短脚只露出一点点。
运行：python3 tools/catgen.py，输出 tools/cats.json 和预览图 tools/cats.png，
再把 cats.json 里的行粘进 static/js/pixel-room.js。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from catgen_lib import Spr
from PIL import Image

SG = dict(o='#4e525c', g='#e0e3e8', s='#c6cad2', t='#a3a8b2', w='#fafaf7', p='#efaab6', e='#2a2a30', b='#f4b4c2')
NG = dict(o='#6e4a2c', g='#ecb46a', s='#9a8a80', t='#c88a48', w='#f8e7c6', p='#efaab6', e='#2a2018', b='#f4a8a0')

def blob(sp, W, H, bw, bh, awake, look=-1, forehead=None, feet=None, tail='up', tail_frame=0, ear=3):
    """头朝左的猫团子：一个圆角面包形的身子 + 左边略高的圆脑袋 + 两只三角耳。
    bw×bh：身子大小；feet：小短脚的 x 位置（None = 趴着不露脚）"""
    top = ear                                   # 头顶所在行（上面留给耳朵）
    bot = top + bh - 1                          # 身子底边
    x0, x1 = 1, bw
    # 圆角面包：超椭圆
    cx, cy, a, b = (x0 + x1) / 2 + .5, top + 2 + (bh - 2) / 2, (x1 - x0 + 1) / 2, (bh - 2) / 2
    for y in range(H):
        for x in range(W):
            dx, dy = abs((x + .5 - cx) / a), abs((y + .5 - cy) / b)
            if dx ** 3 + dy ** 3 <= 1: sp.pix([(x, y)], 'g', 'c')
    # 脑袋：左边一个略高的圆
    hr = bh / 2 + 0.4
    hcx, hcy = x0 + hr - 0.5, top + hr - 0.2
    sp.ellipse(hcx, hcy, hr, hr, 'g', 'c')
    # 三角耳：尖朝外，越往下越宽，内侧粉色
    widths = [1, 3, 4, 5] if ear >= 3 else [1, 2, 3]
    for side in (0, 1):
        for r, wdt in enumerate(widths):
            y = top - len(widths) + 1 + r
            for k in range(wdt):
                X = (x0 + 1 + k) if side == 0 else (int(hcx * 2 - x0 - 1) - k)
                sp.pix([(X, y)], 'g', 'c')
    ears = [(x0 + 2, top - len(widths) + 2), (x0 + 2, top - len(widths) + 3), (x0 + 3, top - len(widths) + 3)] if ear >= 3 else [(x0 + 2, top - 1)]
    # 尾巴
    tx = x1 + 1
    if tail == 'up':
        pts = [(tx - 1, bot - 4), (tx, bot - 5), (tx, bot - 6), (tx, bot - 7), (tx - tail_frame, bot - 8)]
        for i, (x, y) in enumerate(pts): sp.pix([(x, y), (x + 1, y)], 't' if i % 2 else 'g', 'c')
    else:  # 睡觉：尾巴贴地绕到身前
        for i, x in enumerate(range(x1 - 8 - tail_frame, x1 + 2)):
            sp.pix([(x, bot + 1)], 't' if i % 2 else 'g', 'c')
    if feet:
        for fx in feet: sp.pix([(fx, bot + 1), (fx + 1, bot + 1)], 'g', 'c')
    sp.outline('o')
    for (x, y) in ears:
        for X in (x, int(hcx * 2) - x - 1):
            if sp.get(X, y) == 'g': sp.put(X, y, 'p')
    # 背上颜色深一点 + 几道条纹（只画在描边里面）
    for y in range(H):
        for x in range(W):
            if sp.get(x, y) == 'g' and y <= top + 4 and x > hcx + hr - 1: sp.put(x, y, 's')
    for x in range(int(hcx + hr) + 1, x1 - 1, 3):
        for y in range(top + 2, top + 5):
            if sp.get(x, y) in ('g', 's') and sp.get(x, y - 1) != '.': sp.put(x, y, 't'); 
    fx = int(hcx) + look
    if forehead == 'm':   # 南瓜：额头一小块灰棕色 + 中间一道纹
        for x in (fx - 1, fx, fx + 1):
            if sp.get(x, top) == 'g': sp.put(x, top, 's')
        if sp.get(fx, top + 1) == 'g': sp.put(fx, top + 1, 't')
    else:                 # 丝瓜：三道很淡的细纹
        for x in (fx - 2, fx, fx + 2):
            if sp.get(x, top) == 'g': sp.put(x, top, 't')
    # 豆豆眼 + 腮红
    ey = int(hcy)
    L, R = fx - 2, fx + 3
    if awake: sp.pix([(L, ey), (L, ey + 1), (R, ey), (R, ey + 1)], 'e')
    else: sp.pix([(L - 1, ey + 1), (L, ey + 1), (R, ey + 1), (R + 1, ey + 1)], 'e')
    sp.pix([(L - 1, ey + 2), (L, ey + 2), (R, ey + 2), (R + 1, ey + 2)], 'b')
    return sp.rows()

def sigua(state, frame=0):
    W, H = 28, 17
    if state == 'sleep':
        return blob(Spr(W, H), W, H, 23, 12, False, look=0, tail='down', tail_frame=frame)
    feet = [4, 9, 15, 20] if frame == 0 else [5, 10, 14, 19]
    return blob(Spr(W, H), W, H, 23, 12, True, feet=feet, tail_frame=frame)

def nangua(state, frame=0):
    W, H = 20, 13
    if state == 'sleep':
        return blob(Spr(W, H), W, H, 16, 9, False, look=0, forehead='m', tail='down', tail_frame=frame, ear=2)
    feet = [3, 7, 11, 14] if frame == 0 else [4, 8, 10, 13]
    return blob(Spr(W, H), W, H, 16, 9, True, forehead='m', feet=feet, tail_frame=frame, ear=2)

def render(items, path, z=12):
    W = sum(len(r[0]) for r, _ in items) + 4 * (len(items) + 1); H = max(len(r) for r, _ in items) + 8
    im = Image.new('RGB', (W * z, H * z), '#4a3445'); ox = 4
    for rows, pal in items:
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch in pal:
                    c = tuple(int(pal[ch][k:k+2], 16) for k in (1, 3, 5))
                    im.paste(c, ((ox+x)*z, (4+y)*z, (ox+x+1)*z, (4+y+1)*z))
        ox += len(rows[0]) + 4
    im.save(path)

if __name__ == '__main__':
    here = os.path.dirname(os.path.abspath(__file__))
    out = dict(sigua_sleep=sigua('sleep', 0), sigua_sleep2=sigua('sleep', 1), sigua_walk0=sigua('walk', 0), sigua_walk1=sigua('walk', 1),
               nangua_curl=nangua('sleep', 0), nangua_walk0=nangua('walk', 0), nangua_walk1=nangua('walk', 1))
    json.dump(out, open(os.path.join(here, 'cats.json'), 'w'))
    render([(out['sigua_sleep'], SG), (out['sigua_walk0'], SG), (out['sigua_walk1'], SG), (out['nangua_curl'], NG), (out['nangua_walk0'], NG)], os.path.join(here, 'cats.png'))
