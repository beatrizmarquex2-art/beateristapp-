# -*- coding: utf-8 -*-
"""Melodia e harmonia em SVG: pauta de sol com notas, teclado, diagramas de acordes do violão, braço e tablatura."""
import math
from nota import head, flag_path, INK, GHOST

LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
SYL = {'C': 'dó', 'D': 'ré', 'E': 'mi', 'F': 'fá', 'G': 'sol', 'A': 'lá', 'B': 'si'}
SYL_UP = {k: v.upper() for k, v in SYL.items()}
SEMI = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}

def dpos(name):
    return int(name[-1]) * 7 + LETTERS.index(name[0])

def midi(name):
    """'C4' -> 60; aceita sustenido '#' e bemol 'b' depois da letra"""
    l = name[0]; o = int(name[-1]); acc = 0
    if len(name) == 3:
        acc = 1 if name[1] == '#' else -1
    return 12 * (o + 1) + SEMI[l] + acc

def nome_nota(name):
    return SYL[name[0]]

# ================= PAUTA =================
BASEPOS = dpos('E4')
DURW = {'sb': 100, 'mi.': 100, 'mi': 74, 'sm.': 66, 'sm': 50, 'co': 40, 'sc': 30}
TREBLE_PATHS = (
    'M2,{a} C-16,{b} -14,{c} 4,{d} C16,{e} 12,{f} 4,{g} C-2,{h} 2,{i} 4,{j} L6,{k} C8,{l} -2,{m} -8,{n} C-14,{o} -8,{p} -2,{q}',
)

def treble(sc, cx, base):
    # caminho da clave de sol (mesma forma usada no app), em unidades de 8 por meia-linha
    yn = lambda s: -s * 8
    d1 = (f'M{cx+2},{yn(2)+12} C{cx-16},{yn(2)+2} {cx-14},{yn(5)} {cx+4},{yn(8)+6} C{cx+16},{yn(11)} {cx+12},{yn(13)} {cx+4},{yn(13)+2} '
          f'C{cx-2},{yn(12)} {cx+2},{yn(9)} {cx+4},{yn(7)} L{cx+6},{yn(-1)-2} C{cx+8},{yn(-3)} {cx-2},{yn(-4)} {cx-8},{yn(-3)} C{cx-14},{yn(-2)} {cx-8},{yn(0)+4} {cx-2},{yn(-1)}')
    d2 = (f'M{cx+12},{yn(3)} C{cx+14},{yn(0)} {cx},{yn(0)-2} {cx-8},{yn(2)} C{cx-14},{yn(4)} {cx-8},{yn(7)} {cx+2},{yn(6)} C{cx+10},{yn(5)} {cx+9},{yn(2)} {cx+2},{yn(2)}')
    sw = 3.4 / sc
    return (f'<g transform="translate(0,{base}) scale({sc})"><path d="{d1}" fill="none" stroke="{INK}" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round"/>'
            f'<path d="{d2}" fill="none" stroke="{INK}" stroke-width="{sw*0.85:.2f}" stroke-linecap="round"/></g>')

def staff(items, width=640, gap=12, labels=None, fingers=None, tsig=False, clef=True, ghost_after=None, col=INK, top_extra=0, show_final=True, label_col='#333', highlight=None, cifra_above=None, lines_only=False, bar_nums=False, numbers=False, clef_col=None):
    """items: lista de ('E4','sm') | '|' | ('E4','sm','rótulo') ; labels: 'syl'|'let'|None; fingers: lista paralela (ou None);
    cifra_above: dict idx_do_evento -> texto (cifra de acorde) sobre a nota; highlight: conjunto de idx a destacar."""
    U = gap / 2
    ev = [i for i in items if i != '|']
    pitches = [dpos(e[0]) - BASEPOS for e in ev] if ev else [0]
    up_ext = max(0, max(pitches) - 9) * U if ev else 0
    TOP = 20 + up_ext + top_extra + (24 if cifra_above else 0)
    BOT = TOP + 4 * gap
    low_ext = max(0, -min(pitches)) * U if ev else 0
    x0 = 20 + (52 if clef else 0) + (34 if tsig else 0) + 6
    # espaços
    slots = []
    for it in items:
        if it == '|':
            slots.append(14)
        else:
            slots.append(DURW[it[1]])
    avail = width - x0 - 22
    f = min(1.35, avail / max(1, sum(slots)))
    H = BOT + 20 + max(low_ext, 0) + (24 if labels else 0) + (24 if fingers else 0)
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {H:.0f}" width="{width}" height="{H:.0f}" style="display:block;overflow:visible">']
    for k in range(5):
        y = BOT - k * gap
        out.append(f'<line x1="4" y1="{y}" x2="{width-4}" y2="{y}" stroke="{col}" stroke-width="1.8"/>')
    out.append(f'<line x1="4" y1="{TOP}" x2="4" y2="{BOT}" stroke="{col}" stroke-width="2.2"/>')
    if clef:
        tr = treble(U / 8 * 1.02, 34, BOT)
        if clef_col: tr = tr.replace(INK, clef_col)
        out.append(tr)
    if tsig:
        tx = 20 + 52 + 14
        out.append(f'<text x="{tx}" y="{TOP+gap*2-3}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="{gap*2.1:.0f}" fill="{col}">4</text>'
                   f'<text x="{tx}" y="{TOP+gap*4-3}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="{gap*2.1:.0f}" fill="{col}">4</text>')
    if numbers:
        for k in range(5):
            out.append(f'<text x="{width-38}" y="{BOT-k*gap+4.5}" font-family="Hanken,Arial" font-weight="800" font-size="12" fill="#333">{k+1}ª</text>')
        for k in range(4):
            out.append(f'<text x="{width-38}" y="{BOT-(k+0.5)*gap+4.5}" font-family="Hanken,Arial" font-weight="600" font-size="11" fill="#777">{k+1}º</text>')
    x = x0
    ei = 0
    pos_x = {}
    # primeira passada: posições
    xs = []
    for it, w in zip(items, slots):
        if it == '|':
            xs.append(x + w * f * 0.5); x += w * f
        else:
            xs.append(x + w * f * 0.38); x += w * f
    # beams: agrupa pares de colcheias consecutivas
    beams = []
    k = 0
    evs = [(i, it) for i, it in enumerate(items) if it != '|']
    j = 0
    while j < len(evs) - 1:
        if evs[j][1][1] == 'co' and evs[j + 1][1][1] == 'co' and not (items[evs[j][0] + 1] == '|' if evs[j][0] + 1 < len(items) else False):
            beams.append((evs[j][0], evs[j + 1][0])); j += 2
        else:
            j += 1
    in_beam = {a: 1 for a, b in beams}; in_beam.update({b: 2 for a, b in beams})
    ex = 0
    for idx, it in enumerate(items):
        xx = xs[idx]
        if it == '|':
            out.append(f'<line x1="{xx:.1f}" y1="{TOP}" x2="{xx:.1f}" y2="{BOT}" stroke="{col}" stroke-width="1.8"/>')
            continue
        p = dpos(it[0]) - BASEPOS
        y = BOT - p * U
        dur = it[1]
        base = dur.rstrip('.')
        dot = dur.endswith('.')
        c = col
        if ghost_after is not None and ex >= ghost_after: c = GHOST
        if highlight and ex in highlight: c = '#111'
        # linhas suplementares
        if p < 0:
            for kk in range(-2, p - 1, -2):
                yy = BOT - kk * U
                out.append(f'<line x1="{xx-13:.1f}" y1="{yy:.1f}" x2="{xx+13:.1f}" y2="{yy:.1f}" stroke="{c}" stroke-width="1.8"/>')
        if p > 8:
            for kk in range(10, p + 1, 2):
                yy = BOT - kk * U
                out.append(f'<line x1="{xx-13:.1f}" y1="{yy:.1f}" x2="{xx+13:.1f}" y2="{yy:.1f}" stroke="{c}" stroke-width="1.8"/>')
        rx, ry = gap * 0.62, gap * 0.46
        up = p < 4
        stem_h = gap * 3.4
        filled = base in ('sm', 'co', 'sc')
        hasstem = base != 'sb'
        sx = xx + rx * 0.92 if up else xx - rx * 0.92
        if hasstem and idx not in in_beam:
            y2 = y - stem_h if up else y + stem_h
            out.append(f'<line x1="{sx:.1f}" y1="{y:.1f}" x2="{sx:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="2"/>')
            if base == 'co':
                if up:
                    out.append(flag_path(sx, y2, 1, c))
                else:
                    out.append(f'<g transform="translate(0,{2*y2:.1f}) scale(1,-1)">{flag_path(sx, y2, 1, c)}</g>')
        out.append(head(xx, y, filled, c, rx, ry))
        if dot:
            out.append(f'<circle cx="{xx+rx+5:.1f}" cy="{y - (U if p % 2 == 0 else 0):.1f}" r="2" fill="{c}"/>')
        # rótulos
        if labels:
            nm = it[2] if len(it) > 2 else (SYL[it[0][0]] if labels == 'syl' else it[0][0])
            out.append(f'<text x="{xx:.1f}" y="{H - (24 if fingers else 0) - 7:.1f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="{max(11, gap*1.0):.0f}" fill="{label_col}">{nm}</text>')
        if fingers and ex < len(fingers) and fingers[ex]:
            out.append(f'<circle cx="{xx:.1f}" cy="{H-12:.1f}" r="8" fill="#fff" stroke="#111" stroke-width="1.6"/><text x="{xx:.1f}" y="{H-8:.1f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="11">{fingers[ex]}</text>')
        if cifra_above and ex in cifra_above:
            out.append(f'<text x="{xx-6:.1f}" y="{TOP-18 - up_ext:.1f}" font-family="Hanken,Arial" font-weight="900" font-size="17" fill="#111">{cifra_above[ex]}</text>')
        ex += 1
    # beams
    for a, b in beams:
        pa = dpos(items[a][0]) - BASEPOS; pb = dpos(items[b][0]) - BASEPOS
        up = (pa + pb) / 2 < 4
        ya = BOT - pa * U; yb = BOT - pb * U
        rx = gap * 0.62
        xa = xs[a] + (rx * 0.92 if up else -rx * 0.92); xb = xs[b] + (rx * 0.92 if up else -rx * 0.92)
        if up:
            ytop = min(ya, yb) - stem_h
            out.append(f'<line x1="{xa:.1f}" y1="{ya:.1f}" x2="{xa:.1f}" y2="{ytop:.1f}" stroke="{col}" stroke-width="2"/><line x1="{xb:.1f}" y1="{yb:.1f}" x2="{xb:.1f}" y2="{ytop:.1f}" stroke="{col}" stroke-width="2"/>')
            out.append(f'<rect x="{xa-1:.1f}" y="{ytop:.1f}" width="{xb-xa+2:.1f}" height="4.5" fill="{col}"/>')
        else:
            ybot = max(ya, yb) + stem_h
            out.append(f'<line x1="{xa:.1f}" y1="{ya:.1f}" x2="{xa:.1f}" y2="{ybot:.1f}" stroke="{col}" stroke-width="2"/><line x1="{xb:.1f}" y1="{yb:.1f}" x2="{xb:.1f}" y2="{ybot:.1f}" stroke="{col}" stroke-width="2"/>')
            out.append(f'<rect x="{xa-1:.1f}" y="{ybot-4.5:.1f}" width="{xb-xa+2:.1f}" height="4.5" fill="{col}"/>')
    if show_final:
        xf = width - 8
        out.append(f'<line x1="{xf-6}" y1="{TOP}" x2="{xf-6}" y2="{BOT}" stroke="{col}" stroke-width="1.8"/><rect x="{xf-2}" y="{TOP}" width="4.5" height="{BOT-TOP}" fill="{col}"/>')
    out.append('</svg>')
    return ''.join(out)

def mini_staff_note(name, dur='sm', width=120, gap=12, **kw):
    return staff([(name, dur)], width=width, gap=gap, show_final=False, **kw)

# ================= TECLADO =================
WHITE_PC = [0, 2, 4, 5, 7, 9, 11]
BLACK_AFTER = {0, 2, 5, 7, 9}  # C D F G A têm tecla preta à direita

def keyboard(lo='C4', hi='B4', marks=None, W=34, H=120, names=None, dot_c=True, black_names=False, hide_names_for=None, label_size=None, mark_gray='#a8a8a8', blank=None, circle_c=False):
    """lo/hi: teclas brancas (ex. 'C4','E5'). marks: {midi: rótulo}. names: 'syl'|'let'|None (nomes nas brancas).
    blank: conjunto de midi cujas teclas brancas mostram uma caixinha para escrever (jogos). """
    marks = marks or {}
    lo_m, hi_m = midi(lo), midi(hi)
    whites = [m for m in range(lo_m, hi_m + 1) if m % 12 in WHITE_PC]
    n = len(whites)
    total = n * W
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {total+4} {H+4}" width="{total+4}" height="{H+4}" style="display:block;overflow:visible">']
    letter_of = {0: 'C', 2: 'D', 4: 'E', 5: 'F', 7: 'G', 9: 'A', 11: 'B'}
    for i, m in enumerate(whites):
        x = 2 + i * W
        fill = mark_gray if m in marks else '#fff'
        o.append(f'<rect x="{x}" y="2" width="{W}" height="{H}" fill="{fill}" stroke="#111" stroke-width="2"/>')
        l = letter_of[m % 12]
        if dot_c and l == 'C':
            o.append(f'<circle cx="{x+W/2}" cy="{H-(W*0.95 if names else 14)}" r="{max(3,W*0.1):.1f}" fill="#111" opacity=".55"/>')
        txt = None
        if m in marks and marks[m] != '':
            txt = marks[m]
            o.append(f'<text x="{x+W/2}" y="{H-8}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="{(label_size or W*0.5):.0f}" fill="#111">{txt}</text>')
        elif names and not (hide_names_for and m in hide_names_for):
            nm = SYL[l] if names == 'syl' else l
            o.append(f'<text x="{x+W/2}" y="{H-8}" text-anchor="middle" font-family="Hanken,Arial" font-weight="700" font-size="{(label_size or W*0.36):.0f}" fill="#222">{nm}</text>')
        if blank and m in blank:
            o.append(f'<rect x="{x+4}" y="{H-W*0.95}" width="{W-8}" height="{W*0.75}" rx="4" fill="#fff" stroke="#111" stroke-width="1.6"/>')
    bw = W * 0.62
    for i, m in enumerate(whites):
        if (m % 12) in BLACK_AFTER and i < n - 1:
            x = 2 + (i + 1) * W - bw / 2
            bm = m + 1
            fill = '#8a8a8a' if bm in marks else '#111'
            o.append(f'<rect x="{x:.1f}" y="2" width="{bw:.1f}" height="{H*0.62:.0f}" rx="3" fill="{fill}" stroke="#111" stroke-width="1.5"/>')
            if bm in marks and marks[bm] != '':
                o.append(f'<text x="{x+bw/2:.1f}" y="{H*0.62-8:.0f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="{max(9,W*0.34):.0f}" fill="#fff">{marks[bm]}</text>')
            elif black_names:
                tx = black_names.get(bm, '')
                ls = tx.split('/')
                fs = max(8, W * 0.22)
                for li, ln in enumerate(ls):
                    o.append(f'<text x="{x+bw/2:.1f}" y="{H*0.62-8-(len(ls)-1-li)*(fs+2):.0f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="700" font-size="{fs:.0f}" fill="#fff">{ln}</text>')
    o.append('</svg>')
    return ''.join(o)

# ================= DIAGRAMA DE ACORDE (violão) =================
def chord_svg(frets, fingers=None, w=128, barre=None, labels_below=False, nfrets=5, start=1, show_open_names=False):
    """frets: 6 valores (6ª corda → 1ª); -1 = não toca, 0 = solta. fingers: 6 valores (0/None = sem dedo).
    barre: (casa, corda_inicial_idx, corda_final_idx) com índice 0 = 6ª corda."""
    sx0, dx = 22, 17
    y0, dy = 34, 21
    W, H = 128, y0 + nfrets * dy + (22 if labels_below else 10)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{w}" height="{w*H/W:.0f}" style="display:block;margin:0 auto;overflow:visible">']
    # casas
    for f in range(nfrets + 1):
        y = y0 + f * dy
        sw = 5 if (f == 0 and start == 1) else 1.8
        o.append(f'<line x1="{sx0}" y1="{y}" x2="{sx0+5*dx}" y2="{y}" stroke="#111" stroke-width="{sw}" stroke-linecap="square"/>')
    for i in range(6):
        x = sx0 + i * dx
        o.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y0+nfrets*dy}" stroke="#111" stroke-width="{2.6-i*0.32:.2f}"/>')
    if start > 1:
        o.append(f'<text x="{sx0+5*dx+8}" y="{y0+dy*0.65}" font-family="Hanken,Arial" font-weight="800" font-size="12" fill="#111">{start}ª</text>')
    if barre:
        bf, a, b = barre
        yy = y0 + (bf - start + 0.5) * dy
        o.append(f'<rect x="{sx0+a*dx-7}" y="{yy-7:.1f}" width="{(b-a)*dx+14}" height="14" rx="7" fill="#111"/>')
    for i, f in enumerate(frets):
        x = sx0 + i * dx
        if f is None:
            continue
        if f < 0:
            o.append(f'<path d="M{x-5},{y0-17} L{x+5},{y0-7} M{x+5},{y0-17} L{x-5},{y0-7}" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>')
        elif f == 0:
            o.append(f'<circle cx="{x}" cy="{y0-12}" r="5" fill="#fff" stroke="#111" stroke-width="2.2"/>')
        else:
            yy = y0 + (f - start + 0.5) * dy
            isb = barre and barre[0] == f and barre[1] <= i <= barre[2]
            fing = fingers[i] if fingers else None
            if not isb:
                o.append(f'<circle cx="{x}" cy="{yy:.1f}" r="8" fill="#111"/>')
            if fing and (not isb or i == barre[1]):
                o.append(f'<text x="{x}" y="{yy+4.2:.1f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="12" fill="#fff">{fing}</text>')
    if labels_below:
        for i, t in enumerate(['6', '5', '4', '3', '2', '1']):
            o.append(f'<text x="{sx0+i*dx}" y="{H-3}" text-anchor="middle" font-family="Hanken,Arial" font-weight="700" font-size="11" fill="#555">{t}</text>')
    o.append('</svg>')
    return ''.join(o)

# acordes: nome, título, frets, dedos, barre
ACORDES = {
    'C':  ('Dó maior', [-1, 3, 2, 0, 1, 0], [0, 3, 2, 0, 1, 0], None),
    'D':  ('Ré maior', [-1, -1, 0, 2, 3, 2], [0, 0, 0, 1, 3, 2], None),
    'E':  ('Mi maior', [0, 2, 2, 1, 0, 0], [0, 2, 3, 1, 0, 0], None),
    'F':  ('Fá maior (com pestana)', [1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1], (1, 0, 5)),
    'G':  ('Sol maior', [3, 2, 0, 0, 0, 3], [2, 1, 0, 0, 0, 3], None),
    'A':  ('Lá maior', [-1, 0, 2, 2, 2, 0], [0, 0, 1, 2, 3, 0], None),
    'Am': ('Lá menor', [-1, 0, 2, 2, 1, 0], [0, 0, 2, 3, 1, 0], None),
    'Dm': ('Ré menor', [-1, -1, 0, 2, 3, 1], [0, 0, 0, 2, 3, 1], None),
    'Em': ('Mi menor', [0, 2, 2, 0, 0, 0], [0, 2, 3, 0, 0, 0], None),
    'A7': ('Lá com sétima', [-1, 0, 2, 0, 2, 0], [0, 0, 1, 0, 2, 0], None),
    'D7': ('Ré com sétima', [-1, -1, 0, 2, 1, 2], [0, 0, 0, 2, 1, 3], None),
    'E7': ('Mi com sétima', [0, 2, 0, 1, 0, 0], [0, 2, 0, 1, 0, 0], None),
    'G7': ('Sol com sétima', [3, 2, 0, 0, 0, 1], [3, 2, 0, 0, 0, 1], None),
    'C7': ('Dó com sétima', [-1, 3, 2, 3, 1, 0], [0, 3, 2, 4, 1, 0], None),
}
OPEN_STR = ['Mi', 'Lá', 'Ré', 'Sol', 'Si', 'Mi']

def acorde(nome, w=128, labels_below=False):
    t, fr, fi, br = ACORDES[nome]
    return chord_svg(fr, fi, w=w, barre=br, labels_below=labels_below)

def acorde_receita(nome):
    """texto 'dedo X na Nª corda, casa Y' para cada nota do acorde"""
    t, fr, fi, br = ACORDES[nome]
    nomes = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª']
    partes = []
    if br:
        partes.append(f'dedo 1 deitado (pestana) na casa {br[0]}, nas 6 cordas')
    for i in range(6):
        if fr[i] > 0 and fi[i] and not (br and br[0] == fr[i] and fi[i] == 1):
            partes.append(f'dedo {fi[i]} na {nomes[i]} corda, casa {fr[i]}')
    soltas = [nomes[i] for i in range(6) if fr[i] == 0]
    mut = [nomes[i] for i in range(6) if fr[i] < 0]
    return partes, soltas, mut

# ================= BRAÇO HORIZONTAL (notas nas casas) =================
OPEN_MIDI = [64, 59, 55, 50, 45, 40]  # 1ª..6ª corda: mi4 si3 sol3 ré3 lá2 mi2

def braco(marks=None, nfrets=5, w=640, strings=6, show_names=True, h=170, fret_labels=True, fill_names=None):
    """marks: {(corda 1..6, casa 0..n): rótulo}. corda 1 em cima."""
    marks = marks or {}
    x0, x1 = 92, w - 14
    fw = (x1 - x0) / nfrets
    y0, dy = 24, (h - 40) / (strings - 1)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" style="display:block;overflow:visible">']
    o.append(f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{(strings-1)*dy}" fill="#fff" stroke="#111" stroke-width="2"/>')
    for f in range(nfrets + 1):
        x = x0 + f * fw
        o.append(f'<line x1="{x}" y1="{y0}" x2="{x}" y2="{y0+(strings-1)*dy}" stroke="#111" stroke-width="{6 if f==0 else 2}"/>')
        if fret_labels and f >= 1:
            o.append(f'<text x="{x - fw/2}" y="{h-6}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="13" fill="#444">casa {f}</text>')
    for s in range(strings):
        y = y0 + s * dy
        o.append(f'<line x1="{x0}" y1="{y}" x2="{x1}" y2="{y}" stroke="#111" stroke-width="{1.2+s*0.45:.2f}"/>')
        if show_names:
            o.append(f'<text x="{x0-60}" y="{y+5}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="14" fill="#111">{s+1}ª corda</text>')
    for f in (3, 5):
        if f <= nfrets:
            cx = x0 + (f - 0.5) * fw
            o.append(f'<circle cx="{cx}" cy="{y0+(strings-1)*dy/2}" r="5" fill="#ddd"/>')
    for (s, f), lab in marks.items():
        y = y0 + (s - 1) * dy
        x = x0 + (f - 0.5) * fw if f > 0 else x0 - 14
        o.append(f'<circle cx="{x}" cy="{y}" r="11.5" fill="#111"/><text x="{x}" y="{y+4.5}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="{11 if len(str(lab))<4 else 9}" fill="#fff">{lab}</text>')
    o.append('</svg>')
    return ''.join(o)

# ================= TABLATURA =================
def tab(events, width=560, label='TAB', numbers=True, counts=None, slot=None, gap=24):
    """events: lista de (corda 1..6, casa) ou lista de listas (notas juntas) ou None (pausa). corda 1 em cima."""
    n = len(events)
    x0 = 58
    sl = slot or (width - x0 - 14) / max(1, n)
    H = 5 * gap / 1.15 + 36 + (18 if counts else 0)
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {H}" width="{width}" height="{H}" style="display:block;overflow:visible">']
    y0 = 18
    for s in range(6):
        o.append(f'<line x1="10" y1="{y0+s*gap/1.15:.1f}" x2="{width-6}" y2="{y0+s*gap/1.15:.1f}" stroke="#111" stroke-width="1.6"/>')
    ly = y0 + 5 * gap / 1.15
    o.append(f'<line x1="10" y1="{y0}" x2="10" y2="{ly:.1f}" stroke="#111" stroke-width="2.2"/>')
    o.append(f'<text x="34" y="{y0+2.2*gap/1.15:.1f}" text-anchor="middle" font-family="Marker,Impact" font-size="17" fill="#111">T</text><text x="34" y="{y0+3.5*gap/1.15:.1f}" text-anchor="middle" font-family="Marker,Impact" font-size="17" fill="#111">A</text><text x="34" y="{y0+4.8*gap/1.15:.1f}" text-anchor="middle" font-family="Marker,Impact" font-size="17" fill="#111">B</text>')
    for i, ev in enumerate(events):
        cx = x0 + sl * (i + 0.5)
        if ev is None:
            continue
        notes = ev if isinstance(ev, list) else [ev]
        for (s, f) in notes:
            if f is None: continue
            y = y0 + (s - 1) * gap / 1.15
            o.append(f'<rect x="{cx-9}" y="{y-9:.1f}" width="18" height="18" fill="#fff"/><text x="{cx}" y="{y+5.5:.1f}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="15" fill="#111">{f}</text>')
        if counts and i < len(counts) and counts[i]:
            o.append(f'<text x="{cx}" y="{ly+22:.1f}" text-anchor="middle" font-family="Hanken,Arial" font-size="11.5" fill="#444">{counts[i]}</text>')
    o.append('</svg>')
    return ''.join(o)

# ================= VIOLÃO (desenho com partes) =================
def violao_partes(numbered=True, w=250):
    K = '#111'
    o = []
    # braço
    o.append(f'<rect x="88" y="40" width="44" height="200" fill="#fff" stroke="{K}" stroke-width="3"/>')
    for i in range(1, 8):
        y = 40 + i * 25
        o.append(f'<line x1="88" y1="{y}" x2="132" y2="{y}" stroke="{K}" stroke-width="2.4"/>')
    o.append(f'<rect x="86" y="38" width="48" height="6" fill="{K}"/>')
    # cabeça
    o.append(f'<path d="M84,40 L84,-6 Q84,-16 94,-16 L126,-16 Q136,-16 136,-6 L136,40 Z" fill="#fff" stroke="{K}" stroke-width="3"/>')
    for k in range(3):
        y = -4 + k * 16
        o.append(f'<line x1="84" y1="{y}" x2="68" y2="{y}" stroke="{K}" stroke-width="3"/><circle cx="64" cy="{y}" r="6" fill="#fff" stroke="{K}" stroke-width="2.6"/>')
        o.append(f'<line x1="136" y1="{y}" x2="152" y2="{y}" stroke="{K}" stroke-width="3"/><circle cx="156" cy="{y}" r="6" fill="#fff" stroke="{K}" stroke-width="2.6"/>')
    # corpo
    o.append(f'<path d="M92,236 C52,236 40,280 62,314 C30,336 16,384 36,424 C54,462 166,462 184,424 C204,384 190,336 158,314 C180,280 168,236 128,236 Z" fill="#fff" stroke="{K}" stroke-width="3.4" stroke-linejoin="round"/>')
    o.append(f'<circle cx="110" cy="316" r="26" fill="#fff" stroke="{K}" stroke-width="3.4"/><circle cx="110" cy="316" r="21" fill="none" stroke="{K}" stroke-width="1.6"/>')
    o.append(f'<rect x="80" y="404" width="60" height="10" rx="3" fill="{K}"/>')
    # cordas
    for i in range(6):
        x = 93 + i * 6.8
        o.append(f'<line x1="{x:.1f}" y1="-12" x2="{x:.1f}" y2="409" stroke="{K}" stroke-width="{2.2-i*0.28:.2f}"/>')
    if numbered:
        def badge(x, y, n):
            return (f'<circle cx="{x}" cy="{y}" r="15" fill="#fff" stroke="{K}" stroke-width="3"/><text x="{x}" y="{y+6.5}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="18" fill="{K}">{n}</text>')
        for (x, y, n) in [(36, -40, 1), (186, -4, 2), (176, 100, 3), (24, 124, 4), (186, 190, 5), (24, 252, 6), (186, 316, 7), (24, 410, 8)]:
            pass
        # selos com linha apontando para a parte
        for (bx, by, tx, ty, n) in [(110, -36, 110, -16, 1), (186, -8, 160, -4, 2), (46, 130, 88, 130, 3), (186, 100, 134, 100, 4), (186, 262, 128, 262, 5), (176, 372, 150, 372, 6), (52, 316, 84, 316, 7), (110, 438, 110, 414, 8)]:
            o.append(f'<line x1="{bx}" y1="{by}" x2="{tx}" y2="{ty}" stroke="{K}" stroke-width="2.4"/>')
        for (bx, by, tx, ty, n) in [(110, -36, 110, -16, 1), (186, -8, 160, -4, 2), (46, 130, 88, 130, 3), (186, 100, 134, 100, 4), (186, 262, 128, 262, 5), (176, 372, 150, 372, 6), (52, 316, 84, 316, 7), (110, 438, 110, 414, 8)]:
            o.append(badge(bx, by, n))
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 -52 220 510" width="{w}" height="{w*510/220:.0f}" style="display:block;margin:0 auto;overflow:visible">' + ''.join(o) + '</svg>'

def teclado_partes(w=640):
    K = '#111'
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 330" width="{w}" height="{w*330/700:.0f}" style="display:block;margin:0 auto;overflow:visible">']
    o.append(f'<rect x="10" y="30" width="680" height="270" rx="18" fill="#fff" stroke="{K}" stroke-width="4"/>')
    # painel
    o.append(f'<rect x="30" y="46" width="640" height="70" rx="10" fill="#fff" stroke="{K}" stroke-width="2.6"/>')
    o.append(f'<rect x="48" y="58" width="120" height="44" rx="6" fill="#eee" stroke="{K}" stroke-width="2.4"/>')
    for i in range(6):
        o.append(f'<circle cx="{210+i*44}" cy="80" r="12" fill="#fff" stroke="{K}" stroke-width="2.6"/><line x1="{210+i*44}" y1="80" x2="{210+i*44+5}" y2="72" stroke="{K}" stroke-width="2.4"/>')
    for i in range(5):
        o.append(f'<rect x="{500+i*30}" y="66" width="22" height="28" rx="4" fill="#fff" stroke="{K}" stroke-width="2.4"/>')
    # teclas
    kx, kw, nk = 30, 640 / 21, 21
    ky, kh = 126, 168
    for i in range(nk):
        o.append(f'<rect x="{kx+i*kw:.1f}" y="{ky}" width="{kw:.1f}" height="{kh}" fill="#fff" stroke="{K}" stroke-width="2"/>')
    pcs = [0, 1, 3, 4, 5]  # após C D F G A
    seq = [0, 1, 3, 4, 5]
    for i in range(nk - 1):
        l = i % 7
        if l in (0, 1, 3, 4, 5):
            o.append(f'<rect x="{kx+(i+1)*kw-9:.1f}" y="{ky}" width="18" height="100" rx="3" fill="{K}"/>')
    def b(x, y, n):
        return f'<circle cx="{x}" cy="{y}" r="16" fill="#fff" stroke="{K}" stroke-width="3"/><text x="{x}" y="{y+6.5}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="19" fill="{K}">{n}</text>'
    # chaves da oitava (7 teclas) com colchete
    o.append(f'<path d="M{kx+7*kw:.0f},{ky+kh+8} L{kx+7*kw:.0f},{ky+kh+16} L{kx+14*kw:.0f},{ky+kh+16} L{kx+14*kw:.0f},{ky+kh+8}" fill="none" stroke="{K}" stroke-width="3"/>')
    o.append(b(110, 82, 1)); o.append(b(330, 36, 2))
    o.append(b(kx + 2.5 * kw, ky + kh - 26, 3)); o.append(b(kx + 8 * kw + 18, ky + 40, 4)); o.append(b(kx + 10.5 * kw, ky + kh + 38, 5))
    o.append(b(590, 36, 6))
    o.append('</svg>')
    return ''.join(o)

def pedal_svg(w=110):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" width="{w}" height="{w*70/120:.0f}" style="display:block;margin:0 auto"><path d="M8,56 L22,20 Q26,12 34,12 L96,12 Q112,12 112,26 L112,52 Q112,60 104,60 L16,60 Q8,60 8,56 Z" fill="#fff" stroke="#111" stroke-width="3.4" stroke-linejoin="round"/><line x1="26" y1="24" x2="100" y2="24" stroke="#111" stroke-width="2.2"/></svg>')
