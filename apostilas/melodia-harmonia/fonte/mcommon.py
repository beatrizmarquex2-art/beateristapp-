# -*- coding: utf-8 -*-
from base import *
import mel
from mel import *
import random, re

def cf(t, size=None):
    st = f' style="font-size:{size}px"' if size else ''
    return f'<span class="cf"{st}>{t}</span>'

# nomes (com ♯ e ♭) das notas de cada acorde de teclado, e as teclas
CHORD_KB = {
    'C': (['C4', 'E4', 'G4'], 'Dó · Mi · Sol'), 'D': (['D4', 'F#4', 'A4'], 'Ré · Fá♯ · Lá'), 'E': (['E4', 'G#4', 'B4'], 'Mi · Sol♯ · Si'),
    'F': (['F4', 'A4', 'C5'], 'Fá · Lá · Dó'), 'G': (['G4', 'B4', 'D5'], 'Sol · Si · Ré'), 'A': (['A4', 'C#5', 'E5'], 'Lá · Dó♯ · Mi'), 'B': (['B4', 'D#5', 'F#5'], 'Si · Ré♯ · Fá♯'),
    'Cm': (['C4', 'Eb4', 'G4'], 'Dó · Mi♭ · Sol'), 'Dm': (['D4', 'F4', 'A4'], 'Ré · Fá · Lá'), 'Em': (['E4', 'G4', 'B4'], 'Mi · Sol · Si'), 'Fm': (['F4', 'Ab4', 'C5'], 'Fá · Lá♭ · Dó'),
    'Gm': (['G4', 'Bb4', 'D5'], 'Sol · Si♭ · Ré'), 'Am': (['A4', 'C5', 'E5'], 'Lá · Dó · Mi'), 'Bm': (['B4', 'D5', 'F#5'], 'Si · Ré · Fá♯'),
}
FULL = {'C': 'Dó maior', 'D': 'Ré maior', 'E': 'Mi maior', 'F': 'Fá maior', 'G': 'Sol maior', 'A': 'Lá maior', 'B': 'Si maior', 'Cm': 'Dó menor', 'Dm': 'Ré menor', 'Em': 'Mi menor', 'Fm': 'Fá menor', 'Gm': 'Sol menor', 'Am': 'Lá menor', 'Bm': 'Si menor'}

def chord_kb(nome, W=26, H=92, lo='C4', hi='G5', labels=True, names=None):
    notas, _ = CHORD_KB[nome]
    marks = {midi(n): (str(k) if labels else '') for k, n in zip((1, 3, 5), notas)}
    return keyboard(lo, hi, marks=marks, W=W, H=H, names=names, dot_c=False)

def blank_kb(W=26, H=92, lo='C4', hi='G5'):
    return keyboard(lo, hi, marks={}, W=W, H=H, dot_c=False)

def seq_syl(names):
    return ' · '.join(SYL[n[0]] for n in names)

def cifra_line(text, size=15):
    """'[C]Dó, ré, mi' -> acorde em cima da sílaba"""
    parts = re.split(r'(\[[^\]]+\])', text)
    out = ''
    cur = None
    for p in parts:
        if not p: continue
        if p.startswith('['):
            cur = p[1:-1]
        else:
            ch = f'<span class="cf" style="font-size:{size+2}px;line-height:1.1;height:20px;display:block">{cur if cur else "&nbsp;"}</span>'
            out += f'<span style="display:inline-flex;flex-direction:column;vertical-align:bottom;margin-right:1px">{ch}<span style="white-space:pre-wrap">{p}</span></span>'
            cur = None
    return f'<div style="font-size:{size}px;line-height:1.1;margin:10px 0">{out}</div>'

def arrow(d, size=26, col='#111'):
    """seta de batida: 'd' (para baixo) ou 'u' (para cima)"""
    if d == 'd':
        p = f'M{size/2},3 L{size/2},{size-11} M{size/2-8},{size-18} L{size/2},{size-7} L{size/2+8},{size-18}'
    else:
        p = f'M{size/2},{size-3} L{size/2},11 M{size/2-8},18 L{size/2},7 L{size/2+8},18'
    return f'<svg viewBox="0 0 {size} {size}" width="{size}" height="{size}" style="display:inline-block;vertical-align:middle"><path d="{p}" fill="none" stroke="{col}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>'

def strum_grid(pattern, show=True, cw=64):
    """pattern: 8 itens 'd','u','.' em 1 e 2 e 3 e 4 e"""
    heads = ['1', 'e', '2', 'e', '3', 'e', '4', 'e']
    h = '<table style="border-collapse:collapse;width:100%;table-layout:fixed"><tr>' + ''.join(f'<td style="text-align:center;font-weight:{800 if x.isdigit() else 400};font-size:13px;padding-bottom:2px">{x}</td>' for x in heads) + '</tr><tr>'
    for p in pattern:
        cell = arrow(p, 30) if (show and p in 'du') else ('' if show else '')
        h += f'<td style="border:2px solid #111;height:46px;text-align:center">{cell}</td>'
    return h + '</tr></table>'

def sec_title(n):
    return n

def dica_lista(items):
    return ''.join(f'<li style="margin-bottom:5px">{i}</li>' for i in items)

def sig(n):
    """nome da nota (dó, ré..) a partir de 'E4' ou 'F#4'"""
    s = SYL[n[0]]
    if len(n) == 3: s += '♯' if n[1] == '#' else '♭'
    return s
