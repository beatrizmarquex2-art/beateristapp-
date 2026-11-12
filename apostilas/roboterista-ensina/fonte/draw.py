# -*- coding: utf-8 -*-
"""Desenhos em traço grosso (estilo marcador) para a bateria e acessórios."""
K = '#111'
SW = 3.4

def _el(cx, cy, rx, ry, fill='#fff', sw=SW):
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{rx}" ry="{ry}" fill="{fill}" stroke="{K}" stroke-width="{sw}"/>'

def _ln(x1, y1, x2, y2, sw=SW):
    return f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{K}" stroke-width="{sw}" stroke-linecap="round"/>'

def cymbal(cx, cy, rx, stand_to, ry=13, hat=False):
    o = [_ln(cx, cy, cx, stand_to), _ln(cx - 34, stand_to, cx + 34, stand_to + 0) if False else '']
    o.append(_ln(cx, stand_to, cx - 36, stand_to + 28))
    o.append(_ln(cx, stand_to, cx + 36, stand_to + 28))
    if hat:
        o.append(_el(cx, cy + 12, rx, ry))
    o.append(_el(cx, cy, rx, ry))
    o.append(f'<circle cx="{cx}" cy="{cy-3}" r="5" fill="{K}"/>')
    return ''.join(o)

def drum(x, y, w, h, ry=14, lugs=3, legs=True):
    o = []
    if legs:
        o.append(_ln(x + 16, y + h, x + 8, y + h + 36))
        o.append(_ln(x + w - 16, y + h, x + w - 8, y + h + 36))
    o.append(f'<path d="M{x},{y} L{x},{y+h} Q{x},{y+h+ry} {x+w/2},{y+h+ry} Q{x+w},{y+h+ry} {x+w},{y+h} L{x+w},{y} Z" fill="#fff" stroke="{K}" stroke-width="{SW}" stroke-linejoin="round"/>')
    o.append(_el(x + w / 2, y, w / 2, ry))
    for i in range(lugs):
        lx = x + w * (i + 1) / (lugs + 1)
        o.append(_ln(lx, y + ry * 0.9, lx, y + h - 2, 2.4))
    return ''.join(o)

def kick(cx, cy, r):
    o = [_el(cx, cy, r, r), _el(cx, cy, r * 0.74, r * 0.74)]
    # estrela
    import math
    pts = []
    for i in range(10):
        a = -math.pi / 2 + i * math.pi / 5
        rr = r * 0.34 if i % 2 == 0 else r * 0.14
        pts.append(f'{cx + rr*math.cos(a):.1f},{cy + rr*math.sin(a):.1f}')
    o.append(f'<polygon points="{" ".join(pts)}" fill="#fff" stroke="{K}" stroke-width="{SW}" stroke-linejoin="round"/>')
    o.append(_ln(cx - 28, cy + r + 12, cx + 28, cy + r + 12))
    return ''.join(o)

def badge(x, y, n, r=16):
    return (f'<circle cx="{x}" cy="{y}" r="{r}" fill="#fff" stroke="{K}" stroke-width="3"/>'
            f'<text x="{x}" y="{y+7}" text-anchor="middle" font-family="Hanken,Arial" font-weight="800" font-size="20" fill="{K}">{n}</text>')

def kit(numbered=True, w=640):
    # coordenadas em 680x520
    o = []
    o.append(cymbal(120, 78, 86, 330))                      # crash (7)
    o.append(cymbal(560, 78, 92, 330, ry=12))               # ride (8)
    o.append(cymbal(66, 218, 66, 400, ry=10, hat=True))     # chimbal (3)
    o.append(drum(238, 138, 96, 66, ry=13, legs=False))     # tom 1 (4)
    o.append(drum(352, 138, 96, 66, ry=13, legs=False))     # tom 2 (5)
    o.append(drum(480, 238, 124, 112, ry=17, lugs=4))       # surdo (6)
    o.append(kick(344, 362, 112))                            # bumbo (1)
    o.append(drum(96, 262, 130, 80, ry=15, lugs=4))         # caixa (2)
    if numbered:
        for (x, y, n) in [(344, 372, 1), (162, 296, 2), (66, 202, 3), (286, 166, 4), (400, 166, 5), (544, 300, 6), (120, 62, 7), (560, 62, 8)]:
            o.append(badge(x, y, n))
    return svg_wrap_(''.join(o), 680, 520, w)

def svg_wrap_(inner, vw, vh, w):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {vw} {vh}" width="{w}" height="{w*vh/vw:.0f}" style="display:block;margin:0 auto">{inner}</svg>'

# ---------- ícones ----------
def icon_cajon(w=120):
    o = [f'<rect x="30" y="14" width="100" height="120" rx="10" fill="#fff" stroke="{K}" stroke-width="{SW}"/>',
         _el(80, 62, 22, 22), f'<circle cx="80" cy="62" r="5" fill="{K}"/>']
    for (x, y) in [(42, 28), (118, 28), (42, 120), (118, 120)]:
        o.append(f'<circle cx="{x}" cy="{y}" r="3.2" fill="{K}"/>')
    o.append(_ln(40, 100, 120, 100, 2.4))
    return svg_wrap_(''.join(o), 160, 150, w)

def icon_pad(w=120):
    o = [_el(80, 90, 62, 26), _el(80, 86, 40, 16),
         _ln(40, 20, 100, 78, 5), _ln(112, 14, 62, 74, 5)]
    return svg_wrap_(''.join(o), 160, 150, w)

def icon_edrum(w=120):
    o = [_ln(34, 36, 34, 110), _ln(126, 36, 126, 110), _ln(34, 110, 126, 110),
         _el(34, 32, 24, 8), _el(126, 32, 24, 8),
         _el(62, 66, 22, 9), _el(98, 66, 22, 9), _el(80, 92, 30, 11),
         f'<rect x="56" y="118" width="48" height="16" rx="4" fill="#fff" stroke="{K}" stroke-width="{SW}"/>']
    return svg_wrap_(''.join(o), 160, 150, w)

def icon_metro(w=120):
    o = [f'<path d="M50,128 L68,16 L92,16 L110,128 Z" fill="#fff" stroke="{K}" stroke-width="{SW}" stroke-linejoin="round"/>',
         _ln(80, 112, 94, 36, 4), f'<rect x="76" y="58" width="16" height="14" fill="#fff" stroke="{K}" stroke-width="2.6"/>',
         f'<rect x="40" y="128" width="80" height="12" rx="3" fill="#fff" stroke="{K}" stroke-width="{SW}"/>']
    return svg_wrap_(''.join(o), 160, 150, w)

def icon_sticks(w=120):
    return svg_wrap_(_ln(30, 26, 128, 124, 7) + _ln(130, 26, 32, 124, 7) + f'<circle cx="30" cy="26" r="9" fill="{K}"/><circle cx="130" cy="26" r="9" fill="{K}"/>', 160, 150, w)

def icon_heart_ear(w=120):
    return ''

# --------- teclado/pad de bateria p/ grid de levada ----------
def tick_star(w=40):
    return ''
