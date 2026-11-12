# -*- coding: utf-8 -*-
import random

DIRS = [(0,1),(1,0),(1,1),(-1,1),(0,-1),(-1,0),(-1,-1),(1,-1)]

def make_search(words, size=14, seed=1, fill_from=None):
    for attempt in range(400):
        rnd = random.Random(seed * 1000 + attempt)
        g = [[None]*size for _ in range(size)]
        sol = {}
        ok = True
        for w in sorted(words, key=lambda x: -len(x)):
            placed = False
            for _ in range(600):
                dr, dc = rnd.choice(DIRS)
                r = rnd.randrange(size); c = rnd.randrange(size)
                er, ec = r + dr*(len(w)-1), c + dc*(len(w)-1)
                if not (0 <= er < size and 0 <= ec < size): continue
                cells = [(r+dr*i, c+dc*i) for i in range(len(w))]
                if all(g[a][b] in (None, w[i]) for i, (a, b) in enumerate(cells)):
                    for i, (a, b) in enumerate(cells): g[a][b] = w[i]
                    sol[w] = cells; placed = True; break
            if not placed: ok = False; break
        if ok:
            pool = list(fill_from or ''.join(words))
            for r in range(size):
                for c in range(size):
                    if g[r][c] is None: g[r][c] = rnd.choice(pool)
            return g, sol
    raise RuntimeError('caça-palavras')

def make_cross(entries, seed=0, tries=3000):
    """entries: lista de (palavra, dica). Devolve grade e posições [(word, clue, r, c, 'h'|'v')]"""
    best = None
    for t in range(tries):
        rnd = random.Random(seed + t)
        order = sorted(entries, key=lambda e: -len(e[0]))
        # pequena variação na ordem
        if t % 2: rnd.shuffle(order); order.sort(key=lambda e: -len(e[0]) + rnd.random()*2.5)
        grid = {}
        placed = []
        w0, c0 = order[0]
        for i, ch in enumerate(w0): grid[(0, i)] = ch
        placed.append((w0, c0, 0, 0, 'h'))
        rest = order[1:]
        fail = False
        for w, cl in rest:
            cands = []
            for (r0, c0_), ch in list(grid.items()):
                for i, wc in enumerate(w):
                    if wc != ch: continue
                    for d in ('h', 'v'):
                        r = r0 - (i if d == 'v' else 0)
                        c = c0_ - (i if d == 'h' else 0)
                        if valid(grid, w, r, c, d):
                            cands.append((r, c, d))
            if not cands: fail = True; break
            # prefere mais cruzamentos
            def score(x):
                r, c, d = x
                n = sum(1 for i in range(len(w)) if (r + (i if d=='v' else 0), c + (i if d=='h' else 0)) in grid)
                return n + rnd.random()
            r, c, d = max(cands, key=score)
            for i, ch in enumerate(w): grid[(r + (i if d=='v' else 0), c + (i if d=='h' else 0))] = ch
            placed.append((w, cl, r, c, d))
        if fail: continue
        rs = [k[0] for k in grid]; cs = [k[1] for k in grid]
        h = max(rs) - min(rs) + 1; w_ = max(cs) - min(cs) + 1
        area = h * w_
        if h <= 15 and w_ <= 14:
            if best is None or area < best[0]:
                best = (area, grid, placed)
                if area <= 150: break
    if not best: raise RuntimeError('cruzadinha')
    _, grid, placed = best
    rmin = min(k[0] for k in grid); cmin = min(k[1] for k in grid)
    norm = {(r - rmin, c - cmin): ch for (r, c), ch in grid.items()}
    pl = [(w, cl, r - rmin, c - cmin, d) for (w, cl, r, c, d) in placed]
    H = max(k[0] for k in norm) + 1; W = max(k[1] for k in norm) + 1
    # numeração
    starts = {}
    num = 0
    for r in range(H):
        for c in range(W):
            if (r, c) not in norm: continue
            sh = any(p[2] == r and p[3] == c and p[4] == 'h' for p in pl)
            sv = any(p[2] == r and p[3] == c and p[4] == 'v' for p in pl)
            if sh or sv:
                num += 1; starts[(r, c)] = num
    return norm, pl, starts, H, W

def valid(grid, w, r, c, d):
    dr, dc = (1, 0) if d == 'v' else (0, 1)
    # célula antes e depois devem estar vazias
    if (r - dr, c - dc) in grid or (r + dr*len(w), c + dc*len(w)) in grid: return False
    cross = 0
    for i, ch in enumerate(w):
        rr, cc = r + dr*i, c + dc*i
        cur = grid.get((rr, cc))
        if cur is not None:
            if cur != ch: return False
            cross += 1
        else:
            # vizinhos laterais devem estar vazios
            if (rr + dc, cc + dr) in grid or (rr - dc, cc - dr) in grid: return False
    return cross >= 1 and cross < len(w)
