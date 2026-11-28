"""生成首页像素房间里丝瓜和南瓜的像素图。
运行：python3 tools/catgen.py，会输出 tools/cats.json 和预览图 tools/cats.png，
再把 cats.json 里的行粘进 static/js/pixel-room.js。"""
import sys, json; sys.path.insert(0, 'tools')
from catgen_lib import Spr
from PIL import Image

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
SG = dict(o='#5a5e68', g='#dadde2', s='#b6bac2', t='#868b95', w='#fafaf7', p='#eaa2ad', n='#d98a8f', m='#8a6a70', e='#2a2a30', G='#a8bd6a', h='#ffffff', b='#f2bcc5')
NG = dict(o='#6e4a2c', g='#e6ae66', s='#8f8178', t='#b98245', w='#f8e7c6', p='#eaa2ad', n='#c98070', m='#8a5a48', e='#2a2018', G='#7d8a5a', h='#ffffff', b='#f2b0a8')
EYE_OPEN = ['.ee.', 'ehee', 'eGGe', '.GG.']
EYE_SHUT = ['....', 'e..e', '.ee.', '....']

def head(sp, hx, hy, W, H, awake, look=0, forehead_dark=False, tag='head'):
    """W×H 的圆脸，左上角 hx,hy；look 让五官往左右偏一点（侧身走路时）"""
    sp.ellipse(hx + W/2, hy + H/2 + 0.6, W/2, H/2 - 0.2, 'g', tag)
    # 大耳朵：尖尖的三角形，内侧粉色
    for side in (0, 1):
        for r in range(5):
            lo, hi = 1 + max(0, (4 - r) // 2 - 1), 1 + r + 1
            for x in range(lo, hi + 1):
                X = hx + x if side == 0 else hx + W - 1 - x
                sp.pix([(X, hy + r - 2)], 'g', tag)
        for (x, y) in ((2, 0), (3, 1), (2, 1), (3, 2), (4, 2)):
            X = hx + x if side == 0 else hx + W - 1 - x
            sp.put(X, hy + y, 'p')
    cx = hx + W // 2 + look
    if forehead_dark:  # 南瓜：额头一片灰棕色，带 M 字纹
        for y in range(hy + 1, hy + 4):
            for x in range(cx - 3 + (y - hy), cx + 3 - (y - hy)):
                if sp.get(x, y) == 'g': sp.put(x, y, 's')
        sp.pix([(cx - 1, hy + 2), (cx, hy + 2), (cx - 1, hy + 3), (cx, hy + 3)], 't')
    else:  # 丝瓜：额头几道细细的条纹
        sp.pix([(cx - 1, hy + 2), (cx, hy + 2), (cx - 2, hy + 3), (cx + 1, hy + 3), (cx - 1, hy + 4), (cx, hy + 4)], 't')
    ey = hy + H // 2 - 1
    for ex in (cx - 6, cx + 2):
        for y, row in enumerate(EYE_OPEN if awake else EYE_SHUT):
            for x, c in enumerate(row):
                if c != '.': sp.put(ex + x, ey + y, c)
    # 白色的嘴套
    for y in range(ey + 3, hy + H):
        for x in range(cx - 4, cx + 4):
            dx = (x + .5 - cx) / 4; dy = (y + .5 - (ey + 5)) / 2.6
            if dx * dx + dy * dy <= 1 and sp.get(x, y) == 'g': sp.put(x, y, 'w')
    sp.pix([(cx - 1, ey + 4), (cx, ey + 4)], 'n')
    pass  # 不画嘴，只留粉鼻子
    sp.pix([(cx - 7, ey + 4), (cx + 6, ey + 4)], 'b')

def finish(sp, head_tag='head'):
    sp.outline('o')
    sp.outline('o', tag=head_tag, against={'body', 'paw', 'tail', 'leg'})
    return sp

def sigua_lying(awake=False, tail_up=False):
    sp = Spr(32, 18)
    shade = lambda x, y: 's' if y < 8 else ('w' if y > 15 else 'g')
    sp.ellipse(20, 11.5, 11.5, 6.4, shade, 'body')
    # 带深色环纹的尾巴，绕在身前
    for x in range(12, 31):
        sp.pix([(x, 16)], 't' if x % 3 == 0 else 'g', 'tail')
    sp.pix([(11, 15 if tail_up else 16), (12, 15)], 'g', 'tail')
    sp.ellipse(4, 16.3, 2.8, 1.5, 'w', 'paw'); sp.ellipse(12, 16.3, 2.8, 1.5, 'w', 'paw')
    sp.outline('o')
    head(sp, 0, 2, 16, 13, awake)
    finish(sp)
    sp.pix([(3, 17), (12, 17)], 'p') if False else None
    return sp.rows()

def sigua_walk(frame):
    sp = Spr(32, 20)
    shade = lambda x, y: 's' if y < 9 else ('w' if y > 13 else 'g')
    sp.ellipse(19, 11, 10.5, 5.2, shade, 'body')
    # 竖起来的环纹尾巴
    for i, (x, y) in enumerate([(29, 9), (30, 8), (30, 7), (30, 6), (30, 5), (29, 4), (29, 3), (28, 2)]):
        sp.pix([(x, y), (x + 1, y)], 't' if i % 3 == 1 else 'g', 'tail')
    legs = [(11, 0), (15, 1), (22, 1), (26, 0)] if frame else [(11, 1), (15, 0), (22, 0), (26, 1)]
    for lx, up in legs:
        for y in range(14, 19 - up): sp.pix([(lx - 1, y), (lx, y), (lx + 1, y)], 'g' if y < 16 - up else 'w', 'leg')
    sp.outline('o')
    head(sp, 0, 1, 16, 14, True, look=-1)
    finish(sp)
    return sp.rows()

def nangua_curl():
    sp = Spr(20, 13)
    shade = lambda x, y: ('t' if x % 3 == 0 and y < 7 else 'g') if y < 10 else 'w'
    sp.ellipse(12.5, 7.5, 7.3, 4.8, shade, 'body')
    for x in range(7, 19): sp.pix([(x, 11)], 't' if x % 3 == 0 else 'g', 'tail')
    sp.outline('o')
    head(sp, 0, 1, 12, 11, False, forehead_dark=True)
    finish(sp)
    return sp.rows()

def nangua_walk(frame):
    sp = Spr(22, 15)
    shade = lambda x, y: ('t' if x % 3 == 0 and y < 8 else 'g') if y < 10 else 'w'
    sp.ellipse(13.5, 8, 7.2, 3.8, shade, 'body')
    for i, (x, y) in enumerate([(20, 7), (20, 6), (21, 5), (21, 4), (20, 3)]):
        sp.pix([(x, y)], 't' if i % 2 else 'g', 'tail')
    legs = [(9, 0), (16, 1)] if frame else [(9, 1), (16, 0)]
    for lx, up in legs:
        for y in range(11, 14 - up): sp.pix([(lx - 1, y), (lx, y), (lx + 1, y)], 'g', 'leg')
    sp.outline('o')
    head(sp, 0, 0, 12, 11, True, look=-1, forehead_dark=True)
    finish(sp)
    return sp.rows()

if __name__ == '__main__':
    out = dict(sigua_sleep=sigua_lying(False), sigua_sleep2=sigua_lying(False, True), sigua_walk0=sigua_walk(0), sigua_walk1=sigua_walk(1),
               nangua_curl=nangua_curl(), nangua_walk0=nangua_walk(0), nangua_walk1=nangua_walk(1))
    json.dump(out, open('tools/cats.json', 'w'))
    render([(out['sigua_sleep'], SG), (out['sigua_walk0'], SG), (out['nangua_curl'], NG), (out['nangua_walk0'], NG)], 'tools/cats.png', z=12)
