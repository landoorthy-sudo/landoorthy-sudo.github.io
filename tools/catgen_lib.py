from PIL import Image
class Spr:
    def __init__(s, w, h): s.w, s.h = w, h; s.g = [['.'] * w for _ in range(h)]; s.mask = [[None] * w for _ in range(h)]
    def put(s, x, y, c):
        if 0 <= x < s.w and 0 <= y < s.h: s.g[y][x] = c
    def get(s, x, y): return s.g[y][x] if 0 <= x < s.w and 0 <= y < s.h else '.'
    def ellipse(s, cx, cy, rx, ry, fill, tag):
        for y in range(s.h):
            for x in range(s.w):
                if ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2 <= 1:
                    s.g[y][x] = fill(x, y) if callable(fill) else fill; s.mask[y][x] = tag
    def pix(s, pts, c, tag=None):
        for x, y in pts:
            s.put(x, y, c)
            if tag and 0 <= x < s.w and 0 <= y < s.h: s.mask[y][x] = tag
    def outline(s, c='o', tag=None, against=None):
        """给 tag 区域描边：与透明处或 against 区域相邻的像素变成描边色"""
        out = []
        for y in range(s.h):
            for x in range(s.w):
                if s.mask[y][x] is None or (tag and s.mask[y][x] != tag): continue
                for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
                    nx, ny = x+dx, y+dy
                    m = s.mask[ny][nx] if 0 <= nx < s.w and 0 <= ny < s.h else None
                    if m is None or (against and m in against):
                        out.append((x, y)); break
        for x, y in out: s.g[y][x] = c
    def rows(s): return [''.join(r) for r in s.g]
def render(rows_list, pal, path, z=14, bg='#4a3445'):
    W = sum(len(r[0]) for r in rows_list) + 4 * (len(rows_list) + 1); H = max(len(r) for r in rows_list) + 8
    im = Image.new('RGB', (W * z, H * z), bg); px = im.load(); ox = 4
    for rows in rows_list:
        for y, row in enumerate(rows):
            for x, ch in enumerate(row):
                if ch in pal[id(rows)] if isinstance(pal, dict) and id(rows) in pal else ch in pal:
                    col = (pal[id(rows)] if id(rows) in pal else pal)[ch]
                    for i in range(z):
                        for j in range(z): px[(ox + x) * z + i, (4 + y) * z + j] = tuple(int(col[k:k+2], 16) for k in (1, 3, 5))
        ox += len(rows[0]) + 4
    im.save(path)
