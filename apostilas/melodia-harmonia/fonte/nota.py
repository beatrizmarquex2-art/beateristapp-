# -*- coding: utf-8 -*-
"""Notação rítmica em SVG (pauta de uma linha, como na bateria). Unidade: 1/64 da semibreve."""
import math

# duração base (em 1/64) -> (nome, bandeirinhas, cabeça vazia?, tem haste?)
BASE = {64: ('semibreve', 0, True, False), 32: ('minima', 0, True, True), 16: ('seminima', 0, False, True),
        8: ('colcheia', 1, False, True), 4: ('semicolcheia', 2, False, True), 2: ('fusa', 3, False, True),
        1: ('semifusa', 4, False, True)}
NOME_DUR = {'semibreve': 64, 'minima': 32, 'seminima': 16, 'colcheia': 8, 'semicolcheia': 4, 'fusa': 2, 'semifusa': 1}
INK = '#111'
GHOST = '#cfcfcf'

def base_of(d):
    if d in BASE:
        return d, False
    for b in BASE:
        if abs(d - b * 1.5) < 1e-9:
            return b, True
    raise ValueError(d)

def head(cx, ly, filled, col=INK, rx=6.4, ry=4.7):
    fill = col if filled else 'none'
    if not filled:  # cabeça vazia: contorno grosso e miolo branco
        return (f'<ellipse cx="{cx:.2f}" cy="{ly:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" transform="rotate(-24 {cx:.2f} {ly:.2f})" '
                f'fill="#fff" stroke="{col}" stroke-width="2.3"/>')
    return (f'<ellipse cx="{cx:.2f}" cy="{ly:.2f}" rx="{rx:.2f}" ry="{ry:.2f}" transform="rotate(-24 {cx:.2f} {ly:.2f})" '
            f'fill="{fill}" stroke="{col}" stroke-width="1"/>')

def stem_x(cx):
    return cx + 5.7

def flag_path(sx, top, n, col=INK):
    out = []
    for i in range(n):
        y = top + i * 5.6
        out.append(f'<path d="M{sx:.2f},{y:.2f} C{sx+1:.2f},{y+7:.2f} {sx+10.5:.2f},{y+9:.2f} {sx+8.6:.2f},{y+19:.2f}" '
                   f'fill="none" stroke="{col}" stroke-width="2.5" stroke-linecap="round"/>')
    return ''.join(out)

def rest_svg(cx, ly, d, col=INK):
    """pausa centrada em cx, com a linha da pauta em ly"""
    b, dot = base_of(d)
    nome, fl, _, _ = BASE[b]
    o = []
    if b == 64:
        o.append(f'<rect x="{cx-6.5:.2f}" y="{ly:.2f}" width="13" height="5.2" fill="{col}"/>')
    elif b == 32:
        o.append(f'<rect x="{cx-6.5:.2f}" y="{ly-5.2:.2f}" width="13" height="5.2" fill="{col}"/>')
    elif b == 16:
        o.append(f'<path d="M{cx-3:.2f},{ly-13:.2f} L{cx+3.5:.2f},{ly-6:.2f} L{cx-3:.2f},{ly+0.5:.2f} L{cx+3:.2f},{ly+7:.2f} '
                 f'C{cx-5:.2f},{ly+6:.2f} {cx-6.5:.2f},{ly+11:.2f} {cx-1.5:.2f},{ly+14:.2f}" fill="none" stroke="{col}" '
                 f'stroke-width="2.9" stroke-linecap="round" stroke-linejoin="round"/>')
    else:
        n = fl
        step = 7.4
        dy = 22 + step * (n - 1)
        x0, y0 = cx + 4.6, ly - 12
        x1, y1 = cx - 4.4, ly - 12 + dy
        o.append(f'<line x1="{x0:.2f}" y1="{y0:.2f}" x2="{x1:.2f}" y2="{y1:.2f}" stroke="{col}" stroke-width="2.6" stroke-linecap="round"/>')
        for j in range(n):
            yj = ly - 8 + j * step
            t = (yj - y0) / (y1 - y0)
            xj = x0 + (x1 - x0) * t
            o.append(f'<circle cx="{xj-4.7:.2f}" cy="{yj+0.2:.2f}" r="3.1" fill="{col}"/>')
            o.append(f'<path d="M{xj-4.2:.2f},{yj-1.4:.2f} C{xj-2:.2f},{yj-4.6:.2f} {xj+0.4:.2f},{yj-4.8:.2f} {xj+1.7:.2f},{yj-7:.2f}" '
                     f'fill="none" stroke="{col}" stroke-width="2.4" stroke-linecap="round"/>')
    if dot:
        o.append(f'<circle cx="{cx+9.5:.2f}" cy="{ly-3.5:.2f}" r="1.9" fill="{col}"/>')
    return ''.join(o)

def rhythm(events, beams=(), width=360, total=64, counts=None, tuplets=(), pad=16, line=True, bars=(), col=INK,
           ghost_after=None, notes_col=None, h_extra=0, stem_h=30, lyshift=0, scale=1.0, top_pad=None, show_line_ends=True,
           label_col='#444'):
    """events: lista de (start, dur, 'n'|'r'). beams: listas de índices que compartilham ligadura.
    counts: lista de (posição_em_unidades, texto). tuplets: (idx_ini, idx_fim, numero). Retorna <svg>."""
    pxu = (width - 2 * pad) / total
    has_t = bool(tuplets)
    top = (stem_h + 6 + (20 if has_t else 4)) if top_pad is None else top_pad
    ly = top + lyshift
    H = ly + (30 if counts else 20) + h_extra
    xs = [pad + e[0] * pxu + (0 if e[2] == 'r' else 0) for e in events]
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {H:.1f}" width="{width*scale:.1f}" height="{H*scale:.1f}" style="display:block;overflow:visible">']
    if line:
        out.append(f'<line x1="{2 if show_line_ends else pad-8}" y1="{ly:.1f}" x2="{width-2 if show_line_ends else width-pad+8}" y2="{ly:.1f}" stroke="{col}" stroke-width="1.6"/>')
    for b in bars:
        bx = pad + b * pxu
        out.append(f'<line x1="{bx:.1f}" y1="{ly-9:.1f}" x2="{bx:.1f}" y2="{ly+9:.1f}" stroke="{col}" stroke-width="1.6"/>')
    # agrupamento
    in_beam = {}
    for gi, g in enumerate(beams):
        for i in g:
            in_beam[i] = gi
    # desenha pausas e notas
    for i, (st, d, k) in enumerate(events):
        cx = xs[i]
        c = col
        if ghost_after is not None and i >= ghost_after:
            c = GHOST
        if notes_col and i in notes_col:
            c = notes_col[i]
        if k == 'r':
            out.append(rest_svg(cx, ly, d, c))
            continue
        b, dot = base_of(d)
        nome, fl, vazia, haste = BASE[b]
        sx = stem_x(cx)
        if haste:
            out.append(f'<line x1="{sx:.2f}" y1="{ly-1:.2f}" x2="{sx:.2f}" y2="{ly-stem_h:.2f}" stroke="{c}" stroke-width="2.1" stroke-linecap="butt"/>')
        out.append(head(cx, ly, not vazia, c))
        if dot:
            out.append(f'<circle cx="{cx+11:.2f}" cy="{ly-4.2:.2f}" r="1.9" fill="{c}"/>')
        if fl and i not in in_beam:
            out.append(flag_path(sx, ly - stem_h, fl, c))
    # ligaduras (beams)
    for g in beams:
        if len(g) < 2:
            continue
        sxs = [stem_x(xs[i]) for i in g]
        fls = [BASE[base_of(events[i][1])[0]][1] for i in g]
        maxf = max(fls)
        ytop = ly - stem_h
        c = col
        if ghost_after is not None and g[0] >= ghost_after:
            c = GHOST
        for lvl in range(1, maxf + 1):
            y = ytop + (lvl - 1) * 6.0
            # corridas consecutivas com bandeirinhas >= lvl
            j = 0
            while j < len(g):
                if fls[j] >= lvl:
                    k = j
                    while k + 1 < len(g) and fls[k + 1] >= lvl:
                        k += 1
                    if k > j:
                        out.append(f'<rect x="{sxs[j]-1.05:.2f}" y="{y:.2f}" width="{sxs[k]-sxs[j]+2.1:.2f}" height="4" fill="{c}"/>')
                    else:  # toquinho
                        if j == 0:
                            a, bb = sxs[j] - 1.05, sxs[j] + 8
                        elif j == len(g) - 1:
                            a, bb = sxs[j] - 8, sxs[j] + 1.05
                        else:
                            a, bb = sxs[j] - 1.05, sxs[j] + 8
                        # toquinho aponta para o vizinho mais próximo em duração (regra simples: para a direita, exceto no último)
                        out.append(f'<rect x="{a:.2f}" y="{y:.2f}" width="{bb-a:.2f}" height="4" fill="{c}"/>')
                    j = k + 1
                else:
                    j += 1
    # tercinas / sextinas
    for (a, b, n) in tuplets:
        x1 = stem_x(xs[a]) - 4
        x2 = stem_x(xs[b]) + 5
        yb = ly - stem_h - 14
        mid = (x1 + x2) / 2
        out.append(f'<path d="M{x1:.1f},{yb+6:.1f} L{x1:.1f},{yb:.1f} L{mid-9:.1f},{yb:.1f} M{mid+9:.1f},{yb:.1f} L{x2:.1f},{yb:.1f} L{x2:.1f},{yb+6:.1f}" '
                   f'fill="none" stroke="{col}" stroke-width="1.5"/>')
        out.append(f'<text x="{mid:.1f}" y="{yb+4.5:.1f}" text-anchor="middle" font-family="Hanken, Arial, sans-serif" font-weight="700" font-size="14" fill="{col}">{n}</text>')
    if counts:
        for pos, tx in counts:
            x = pad + pos * pxu
            out.append(f'<text x="{x:.1f}" y="{ly+24:.1f}" text-anchor="middle" font-family="Hanken, Arial, sans-serif" font-size="11.5" fill="{label_col}">{tx}</text>')
    out.append('</svg>')
    return ''.join(out)

# ---------- atalhos ----------
def one(nome_dur, rest=False, width=64, scale=1.0, col=INK, dot=False, counts=None, line=True, stem_h=30):
    """uma figura (ou pausa) sozinha"""
    d = NOME_DUR[nome_dur]
    if dot:
        d = d * 3 // 2 if d >= 2 else d
    ev = [(0, d, 'r' if rest else 'n')]
    return rhythm(ev, width=width, total=1, pad=width / 2 - 0.0001 if False else width / 2, scale=scale, col=col, line=line, stem_h=stem_h, counts=counts)

def single(nome, rest=False, size=60, col=INK, dot=False, line=False):
    """figura sozinha em caixa pequena, para cartas e tabelas (altura ~size px)"""
    d = NOME_DUR[nome]
    if dot:
        d = d * 3 // 2
    fl = BASE[base_of(d)[0]][1]
    top = 40 if not rest else 22
    if rest:
        H = 46
        parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 {H}" width="{size*40/H:.1f}" height="{size}" style="display:block;overflow:visible">']
        ly = 22 if BASE[base_of(d)[0]][1] >= 1 or base_of(d)[0] == 16 else 22
        if line:
            parts.append(f'<line x1="0" y1="{ly}" x2="40" y2="{ly}" stroke="{col}" stroke-width="1.6"/>')
        parts.append(rest_svg(20, ly, d, col))
        parts.append('</svg>')
        return ''.join(parts)
    stem_h = 30
    H = 36 + 14 * (1 if fl >= 3 else 0)
    ly = H - 8
    parts = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 {H}" width="{size*40/H:.1f}" height="{size}" style="display:block;overflow:visible">']
    if line:
        parts.append(f'<line x1="0" y1="{ly}" x2="40" y2="{ly}" stroke="{col}" stroke-width="1.6"/>')
    cx = 14
    b, dt = base_of(d)
    nome_, f, vazia, haste = BASE[b]
    sx = stem_x(cx)
    if haste:
        parts.append(f'<line x1="{sx}" y1="{ly-1}" x2="{sx}" y2="{ly-stem_h}" stroke="{col}" stroke-width="2.1"/>')
    parts.append(head(cx, ly, not vazia, col))
    if dt:
        parts.append(f'<circle cx="{cx+11}" cy="{ly-4.2}" r="1.9" fill="{col}"/>')
    if f:
        parts.append(flag_path(sx, ly - stem_h, f, col))
    parts.append('</svg>')
    return ''.join(parts)

def figura(nome, size=70, col=INK, dot=False, rest=False):
    """figura com tamanho previsível, sempre com a mesma altura de caixa (para ficar alinhada em listas)"""
    d = NOME_DUR[nome]
    if dot:
        d = d * 3 // 2
    if rest:
        H = 50
        ly = 25
        s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 {H}" width="{size*36/H:.1f}" height="{size}" style="display:block;overflow:visible">']
        s.append(rest_svg(18, ly, d, col))
        s.append('</svg>')
        return ''.join(s)
    fl = BASE[base_of(d)[0]][1]
    H = 52
    ly = 44
    stem_h = 34 if fl < 3 else 40
    cx = 14
    b, dt = base_of(d)
    nome_, f, vazia, haste = BASE[b]
    sx = stem_x(cx)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 {H}" width="{size*36/H:.1f}" height="{size}" style="display:block;overflow:visible">']
    if haste:
        s.append(f'<line x1="{sx}" y1="{ly-1}" x2="{sx}" y2="{ly-stem_h}" stroke="{col}" stroke-width="2.1"/>')
    s.append(head(cx, ly, not vazia, col))
    if dt:
        s.append(f'<circle cx="{cx+11}" cy="{ly-4.2}" r="1.9" fill="{col}"/>')
    if f:
        s.append(flag_path(sx, ly - stem_h, f, col))
    s.append('</svg>')
    return ''.join(s)

def compasso(spec, width=400, counts=True, bars_end=False, scale=1.0, tuplets_idx=(), ghost_after=None, col=INK, count_labels=None, extra_beams=None):
    """spec: lista de tokens. 'sb','mi','sm','co','sc','fu','sf' = notas; com sufixo 'p' = pausa; com '.' = pontuada.
    Vários tokens consecutivos de colcheia/semicolcheia entre '[' e ']' viram um grupo ligado. Retorna (svg, total_units)."""
    ev, beams = [], []
    cur = None
    pos = 0
    names = {'sb': 'semibreve', 'mi': 'minima', 'sm': 'seminima', 'co': 'colcheia', 'sc': 'semicolcheia', 'fu': 'fusa', 'sf': 'semifusa'}
    for t in spec:
        if t == '[':
            cur = []
            continue
        if t == ']':
            if cur and len(cur) > 1:
                beams.append(cur)
            cur = None
            continue
        rest = t.endswith('p')
        tt = t[:-1] if rest else t
        dot = tt.endswith('.')
        tt = tt[:-1] if dot else tt
        d = NOME_DUR[names[tt]]
        if dot:
            d = d * 3 // 2
        ev.append((pos, d, 'r' if rest else 'n'))
        if cur is not None and not rest:
            cur.append(len(ev) - 1)
        pos += d
    return rhythm(ev, beams=beams, width=width, total=pos, scale=scale, ghost_after=ghost_after, col=col), pos


def glyph(vazia=False, haste=True, flags=0, size=70, col=INK, dot=False):
    """figura montada peça por peça (para 'ache o erro' e alternativas)"""
    H = 52; ly = 44; stem_h = 34 if flags < 3 else 40
    cx = 14; sx = stem_x(cx)
    s = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 {H}" width="{size*36/H:.1f}" height="{size}" style="display:block;overflow:visible">']
    if haste:
        s.append(f'<line x1="{sx}" y1="{ly-1}" x2="{sx}" y2="{ly-stem_h}" stroke="{col}" stroke-width="2.1"/>')
    s.append(head(cx, ly, not vazia, col))
    if dot:
        s.append(f'<circle cx="{cx+11}" cy="{ly-4.2}" r="1.9" fill="{col}"/>')
    if flags and haste:
        s.append(flag_path(sx, ly - stem_h, flags, col))
    s.append('</svg>')
    return ''.join(s)

def comp_c(spec, width=400, sub=False, scale=1.0, col=INK):
    """compasso 4/4 com contagem 1 2 3 4 (ou 1 e & a) embaixo e barra no fim"""
    ev, beams = [], []
    cur = None; pos = 0
    names = {'sb': 'semibreve', 'mi': 'minima', 'sm': 'seminima', 'co': 'colcheia', 'sc': 'semicolcheia', 'fu': 'fusa', 'sf': 'semifusa'}
    for t in spec:
        if t == '[':
            cur = []; continue
        if t == ']':
            if cur and len(cur) > 1: beams.append(cur)
            cur = None; continue
        rest = t.endswith('p'); tt = t[:-1] if rest else t
        dot = tt.endswith('.'); tt = tt[:-1] if dot else tt
        d = NOME_DUR[names[tt]]
        if dot: d = d * 3 // 2
        ev.append((pos, d, 'r' if rest else 'n'))
        if cur is not None and not rest: cur.append(len(ev) - 1)
        pos += d
    nb = pos // 16
    if sub:
        counts = [(b * 16 + k * 4, tx) for b in range(nb) for k, tx in enumerate([str(b + 1), 'e', '&amp;', 'a'])]
    else:
        counts = [(b * 16, str(b + 1)) for b in range(nb)]
    return rhythm(ev, beams=beams, width=width, total=pos, counts=counts, bars=[pos], scale=scale, col=col), pos
