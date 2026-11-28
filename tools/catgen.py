"""生成首页像素房间里丝瓜和南瓜的像素图（横版侧身小猫）。
结构：宽宽的圆角方脑袋，两只耳朵分在头顶两角；身子比头低一点、跟在后面；
小短腿；尾巴高高翘起打个弯。豆豆眼、腮红、小胡子。
运行：python3 tools/catgen.py，输出 tools/cats.json 和预览图 tools/cats.png，
再把 cats.json 里的行粘进 static/js/pixel-room.js。"""
import json, sys, os
sys.path.insert(0, os.path.dirname(__file__))
from catgen_lib import Spr
from PIL import Image

SG = dict(o='#4e525c', g='#e0e3e8', s='#c4c8d0', t='#9ea3ad', w='#fafaf7', p='#efaab6', e='#2a2a30', b='#f4b4c2', n='#d98a9a')
NG = dict(o='#6e4a2c', g='#ecb46a', s='#a08a76', t='#c8873f', w='#f8e7c6', p='#efaab6', e='#2a2018', b='#f4a8a0', n='#b8705a')

def rrect(sp, x0, y0, x1, y1, r, c='g', tag='c'):
    for y in range(y0, y1 + 1):
        for x in range(x0, x1 + 1):
            dx = max(x0 + r - x, 0, x - (x1 - r)); dy = max(y0 + r - y, 0, y - (y1 - r))
            if dx * dx + dy * dy <= r * r + 0.5: sp.pix([(x, y)], c, tag)

def cat(W, H, head, body, ear, legs, tail, awake, tail_frame=0, small=False, forehead='lines'):
    sp = Spr(W, H)
    hx0, hy0, hx1, hy1 = head
    bx0, by0, bx1, by1 = body
    # 尾巴（先画，被身子盖住根部）
    if tail == 'up':
        tx = bx1 - 2
        top_y = by0 - (5 if small else 7)
        pts = [(tx + (1 if y < by0 - 2 else 0), y) for y in range(by0 + 2, top_y, -1)]
        for i, (x, y) in enumerate(pts):
            sp.pix([(x, y), (x + 1, y), (x + 2, y)], 't' if i % 3 == 2 else 'g', 'c')
        sp.pix([(tx - tail_frame, top_y), (tx + 1 - tail_frame, top_y), (tx + 2, top_y)], 'g', 'c')
    else:  # 睡觉：尾巴贴地绕到身前
        for i, x in enumerate(range(bx0 + 1 - tail_frame, bx1 + 2)):
            sp.pix([(x, by1 + 1)], 't' if i % 2 else 'g', 'c')
        sp.pix([(bx1 + 1, by1), (bx1 + 1, by1 + 1)], 'g', 'c')
    rrect(sp, bx0, by0, bx1, by1, 2)
    # 小短腿
    for lx, up in legs:
        for y in range(by1 - 1, by1 + 3 - up):
            sp.pix([(lx, y), (lx + 1, y)], 'g', 'c')
    rrect(sp, hx0, hy0, hx1, hy1, 2 if not small else 2)
    # 两只耳朵分在头顶两角
    for side in (0, 1):
        ex = hx0 + 1 if side == 0 else hx1 - 1 - (ear - 1)
        for r in range(ear):
            # 第 r 行（从耳尖往下），宽度 r+1，尖朝外
            for k in range(r + 1 + (1 if r == ear - 1 else 0)):
                x = (hx0 + 1 + k) if side == 0 else (hx1 - 1 - k)
                sp.pix([(x, hy0 - ear + r)], 'g', 'c')
    sp.outline('o')
    # 头和身子之间描一条线，让脑袋更立体
    for y in range(hy0, hy1 + 1):
        if sp.get(hx1 + 1, y) not in ('.', 'o') and sp.get(hx1, y) != '.':
            sp.put(hx1 + 1, y, 'o') if False else None
    # 耳朵内侧粉色
    for side in (0, 1):
        x = hx0 + 2 if side == 0 else hx1 - 2
        for y in (hy0 - 1, hy0):
            if sp.get(x, y) == 'g': sp.put(x, y, 'p')
    # 背上颜色深一点 + 条纹
    for y in range(by0 + 1, by0 + 3):
        for x in range(hx1 + 1, bx1):
            if sp.get(x, y) == 'g': sp.put(x, y, 's')
    for x in range(hx1 + 2, bx1 - 1, 3):
        for y in range(by0 + 1, by0 + 4):
            if sp.get(x, y) in ('g', 's'): sp.put(x, y, 't')
    # 额头花纹
    mid = (hx0 + hx1) // 2
    if forehead == 'lines':
        for x in (mid - 2, mid, mid + 2):
            for y in (hy0 + 1, hy0 + 2):
                if sp.get(x, y) == 'g': sp.put(x, y, 't')
    else:  # 南瓜：额头一小块灰棕色
        for x in range(mid - 1, mid + 2):
            if sp.get(x, hy0 + 1) == 'g': sp.put(x, hy0 + 1, 's')
        sp.put(mid, hy0 + 2, 's')
    # 脸：豆豆眼、鼻子、腮红、胡子
    ey = hy0 + (3 if small else 4)
    L, R = hx0 + 2, hx1 - 2
    if awake:
        sp.pix([(L, ey), (L, ey + 1), (R, ey), (R, ey + 1)], 'e')
    else:
        sp.pix([(L - 1, ey + 1), (L, ey + 1), (R, ey + 1), (R + 1, ey + 1)], 'e')
    sp.pix([(mid, ey + 2)], 'n')
    if not small: sp.pix([(mid - 1, ey + 3), (mid + 1, ey + 3)], 'o')
    sp.pix([(L - 1, ey + 2), (R + 1, ey + 2)], 'b')
    for y in (ey + 1, ey + 3) if not small else (ey + 1,):
        sp.pix([(hx0 - 2, y), (hx0 - 1, y)], 'o')       # 左边的胡子伸出脸外
    return sp.rows()

def sigua(state, frame=0):
    W, H = 30, 20
    head, body = (2, 4, 15, 14), (11, 8, 26, 16)
    if state == 'sleep':
        return cat(W, H, head, body, 3, [], 'down', False, frame)
    legs = [(12, frame), (16, 1 - frame), (20, 1 - frame), (24, frame)]
    return cat(W, H, head, body, 3, legs, 'up', True, frame)

def nangua(state, frame=0):
    W, H = 24, 16
    head, body = (2, 4, 12, 11), (8, 7, 20, 13)
    if state == 'sleep':
        return cat(W, H, head, body, 3, [], 'down', False, frame, small=True, forehead='m')
    legs = [(9, frame), (12, 1 - frame), (15, 1 - frame), (18, frame)]
    return cat(W, H, head, body, 3, legs, 'up', True, frame, small=True, forehead='m')

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
