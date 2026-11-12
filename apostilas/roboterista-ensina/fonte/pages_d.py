# -*- coding: utf-8 -*-
from base import *
from pages_a import FIG7, NOMES, VALOR
from pages_b import tempos_txt
import random

# 9 variações da semicolcheia (1 tempo = 16 unidades): spec do tokens + rótulo + descrição
VAR = {
    1: (['[', 'sc', 'sc', 'sc', 'sc', ']'], '1 e &amp; a', 'quatro semicolcheias'),
    2: (['[', 'co', 'sc', 'sc', ']'], '1 (e) &amp; a', 'colcheia + duas semicolcheias'),
    3: (['[', 'sc', 'sc', 'co', ']'], '1 e &amp; (a)', 'duas semicolcheias + colcheia'),
    4: (['[', 'sc', 'co', 'sc', ']'], '1 e (&amp;) a', 'semicolcheia + colcheia + semicolcheia'),
    5: (['[', 'co.', 'sc', ']'], '1 (e) (&amp;) a', 'colcheia pontuada + semicolcheia'),
    6: (['[', 'sc', 'co.', ']'], '1 e (&amp;) (a)', 'semicolcheia + colcheia pontuada'),
    7: (['scp', '[', 'sc', 'sc', 'sc', ']'], '(1) e &amp; a', 'pausa de semicolcheia + três semicolcheias'),
    8: (['cop', '[', 'sc', 'sc', ']'], '(1) (e) &amp; a', 'pausa de colcheia + duas semicolcheias'),
    9: (['scp', 'sc', 'scp', 'sc'], '(1) e (&amp;) a', 'pausa, semicolcheia, pausa, semicolcheia'),
}
BEAT = {'Q': ['sm'], 'E': ['[', 'co', 'co', ']'], 'R': ['smp'], 'S': ['[', 'sc', 'sc', 'sc', 'sc', ']']}
for k, v in VAR.items():
    BEAT[f'V{k}'] = v[0]

def beats_spec(seq):
    out = []
    for b in seq:
        out += BEAT[b]
    return out

def one_beat_svg(k, width=300, sub=True):
    sp = VAR[k][0] if isinstance(k, int) else BEAT[k]
    return comp_c(sp, width=width, sub=sub)[0]

# --------- compasso com tercina/sextina ---------
def comp_beats(beats, width=560, counts=True):
    """beats: lista de 'Q','E','S','T','X','R' (4 itens)"""
    ev, beams, tuplets = [], [], []
    for bi, b in enumerate(beats):
        o = bi * 16
        if b == 'Q':
            ev.append((o, 16, 'n'))
        elif b == 'R':
            ev.append((o, 16, 'r'))
        elif b == 'E':
            i0 = len(ev); ev += [(o, 8, 'n'), (o + 8, 8, 'n')]; beams.append([i0, i0 + 1])
        elif b == 'S':
            i0 = len(ev); ev += [(o + 4 * k, 4, 'n') for k in range(4)]; beams.append(list(range(i0, i0 + 4)))
        elif b == 'T':
            i0 = len(ev); ev += [(o + 16 * k / 3, 8, 'n') for k in range(3)]; beams.append([i0, i0 + 1, i0 + 2]); tuplets.append((i0, i0 + 2, 3))
        elif b == 'X':
            i0 = len(ev); ev += [(o + 16 * k / 6, 4, 'n') for k in range(6)]; beams.append(list(range(i0, i0 + 6))); tuplets.append((i0, i0 + 5, 6))
    cnt = [(i * 16, str(i + 1)) for i in range(4)] if counts else None
    return rhythm(ev, beams=beams, width=width, total=64, counts=cnt, bars=[64], tuplets=tuplets)

# --------- pauta de bateria ---------
def drum_measure(hh, sn, bd, width=620, open_hh=(), labels=True, flag_single=True):
    """hh/sn/bd: conjuntos de colcheias (0..7). Voz de cima (chimbal e caixa) com hastes para cima; bumbo para baixo."""
    pad = 70
    step = (width - pad - 24) / 8
    xs = [pad + i * step for i in range(8)]
    Lb = 104  # linha de baixo
    ys = {k: Lb - 10 * k for k in range(5)}  # linhas 0..4
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} 172" width="{width}" height="172" style="display:block">']
    for k in range(5):
        o.append(f'<line x1="6" y1="{ys[k]}" x2="{width-6}" y2="{ys[k]}" stroke="#111" stroke-width="1.6"/>')
    o.append(f'<line x1="{width-6}" y1="{ys[4]}" x2="{width-6}" y2="{ys[0]}" stroke="#111" stroke-width="2.4"/>')
    o.append(f'<rect x="18" y="{ys[2]-8}" width="5" height="16" fill="#111"/><rect x="28" y="{ys[2]-8}" width="5" height="16" fill="#111"/>')
    o.append(f'<text x="50" y="{ys[2]-1}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="21" fill="#111">4</text><text x="50" y="{ys[2]+17}" text-anchor="middle" font-family="Hanken,Arial" font-weight="900" font-size="21" fill="#111">4</text>')
    y_hh = ys[4] - 12
    y_sn = ys[0] - 10 * 2.5 + 20 - 20  # 3º espaço
    y_sn = (ys[2] + ys[1]) / 2          # 3º espaço contado de baixo? (entre linha 2 e 3 = 3º espaço)
    y_sn = (ys[2] + ys[3]) / 2 if False else (ys[2] + ys[1]) / 2
    y_bd = (ys[0] + ys[1]) / 2          # 1º espaço
    y_sn = (ys[2] + ys[3]) / 2          # 3º espaço (entre 3ª e 4ª linha)
    top = 20
    voice1 = sorted(set(hh) | set(sn))
    for i in range(8):
        x = xs[i]
        if i in hh:
            col = '#111'
            o.append(f'<path d="M{x-5.5:.1f},{y_hh-5.5:.1f} L{x+5.5:.1f},{y_hh+5.5:.1f} M{x-5.5:.1f},{y_hh+5.5:.1f} L{x+5.5:.1f},{y_hh-5.5:.1f}" stroke="#111" stroke-width="2.2" stroke-linecap="round"/>')
            if i in open_hh:
                o.append(f'<circle cx="{x:.1f}" cy="{y_hh-12:.1f}" r="3.2" fill="none" stroke="#111" stroke-width="1.6"/>')
        if i in sn:
            o.append(head(x, y_sn, True))
        if i in bd:
            o.append(head(x, y_bd, True))
            o.append(f'<line x1="{x-5.8:.1f}" y1="{y_bd+1:.1f}" x2="{x-5.8:.1f}" y2="{y_bd+32:.1f}" stroke="#111" stroke-width="2.1"/>')
        if i in voice1:
            lo = y_sn if i in sn else y_hh
            sx = x + 5.7 if i in sn else x + 5.5
            o.append(f'<line x1="{sx:.1f}" y1="{lo:.1f}" x2="{sx:.1f}" y2="{top:.1f}" stroke="#111" stroke-width="2.1"/>')
    # ligadura na voz de cima
    runs, cur = [], []
    for i in range(8):
        if i in voice1:
            cur.append(i)
        else:
            if cur: runs.append(cur); cur = []
    if cur: runs.append(cur)
    for r in runs:
        a = xs[r[0]] + 5.7
        b = xs[r[-1]] + 5.7
        if len(r) > 1:
            o.append(f'<rect x="{a-1:.1f}" y="{top:.1f}" width="{b-a+2:.1f}" height="4.5" fill="#111"/>')
        elif flag_single:
            o.append(f'<path d="M{a:.1f},{top:.1f} C{a+1:.1f},{top+8:.1f} {a+10:.1f},{top+10:.1f} {a+8:.1f},{top+20:.1f}" fill="none" stroke="#111" stroke-width="2.5" stroke-linecap="round"/>')
    if labels:
        names = ['1', 'e', '2', 'e', '3', 'e', '4', 'e']
        for i, t in enumerate(names):
            o.append(f'<text x="{xs[i]:.1f}" y="160" text-anchor="middle" font-family="Hanken,Arial" font-size="13" font-weight="{800 if t.isdigit() else 400}" fill="#333">{t}</text>')
    o.append('</svg>')
    return ''.join(o)

def grid_levada(hh, sn, bd, fill=True, labels=('chimbal', 'caixa', 'bumbo'), cw=48, rows=None):
    heads = ['1', 'e', '2', 'e', '3', 'e', '4', 'e']
    h = '<table style="border-collapse:collapse;font-size:12.5px;width:100%"><tr><td style="width:78px"></td>' + ''.join(f'<td style="text-align:center;font-weight:{800 if x.isdigit() else 400};padding-bottom:3px">{x}</td>' for x in heads) + '</tr>'
    for name, st in zip(labels, (hh, sn, bd)):
        h += f'<tr><td style="font-weight:800;padding-right:6px">{name}</td>'
        for i in range(8):
            on = fill and i in st
            h += f'<td style="border:2px solid #111;height:24px;text-align:center;font-family:Marker;font-size:18px;{"background:#fff" if True else ""}">{"X" if on else ""}</td>'
        h += '</tr>'
    return h + '</table>'

def build(L):
    # ================= AULA 6 =================
    def sem(L):
        c = titulo('Semicolcheia: 1 e &amp; a', 'quatro notas dentro de um tempo', 520)
        c += fala('a semicolcheia é rapidinha: <b>4 cabem em 1 tempo</b>! a gente conta “1 e &amp; a” (lê-se “um, é, e, á”).', 'vibra')
        c += lab('um tempo = 4 casinhas', True)
        c += '<div style="display:flex;gap:14px;justify-content:center">' + ''.join(f'<div class="box" style="width:138px;height:88px;text-align:center;font-family:Marker;font-size:44px;line-height:78px;border-radius:18px">{t}</div>' for t in ['1', 'E', '&amp;', 'A']) + '</div>'
        c += '<p style="margin-top:12px"><b>Semínima</b> = 1 casinha só (o “1”) · <b>2 colcheias</b> = “1” e “&amp;” · <b>4 semicolcheias</b> = “1 e &amp; a”.</p>'
        cnt = [(0, '1'), (4, 'e'), (8, '&amp;'), (12, 'a')]
        c += '<div class="row" style="gap:20px;justify-content:space-between;margin:6px 0">'
        for ev, bm, nm in [([(0, 16, 'n')], [], '1 semínima'), ([(0, 8, 'n'), (8, 8, 'n')], [[0, 1]], '2 colcheias'), ([(i * 4, 4, 'n') for i in range(4)], [[0, 1, 2, 3]], '4 semicolcheias')]:
            c += f'<div style="flex:1">{rhythm(ev, beams=bm, width=215, total=16, counts=cnt)}<b style="font-size:12px">{nm}</b></div>'
        c += '</div>'
        c += lab('bata palmas, 4 vezes cada:')
        for t in ['só no “1” (semínima)', 'no “1” e no “&amp;” (colcheias)', 'em todas: 1 e &amp; a (semicolcheias)']:
            c += f'<div class="row" style="justify-content:space-between;padding:4px 0;border-bottom:1.5px dotted #aaa"><span style="font-size:13.5px">{t}</span><span>{ck(4, "big")}</span></div>'
        c += lab('desafio do Paul')
        c += box('Bata <b>4 vezes</b> “1 e &amp; a” bem devagar e depois cada vez mais rápido. Em qual velocidade você ainda consegue manter as 4 batidas iguais, sem atropelar? <div class="dots"></div>', style='font-size:13px')
        c += corner('vibra', 60)
        return c
    L.add('a6-sem', 'aula 6 · semicolcheia', sem)

    def var(L):
        c = titulo('As 9 variações', 'jeitinhos de dividir um tempo com semicolcheias', 560)
        c += '<p style="font-size:12.8px">O que está entre <b>( )</b> é <b>silêncio</b>. Bata palmas só nas casinhas sem parênteses.</p>'
        c += '<div class="col2" style="gap:9px">'
        for k in range(1, 10):
            sp, lb, ds = VAR[k]
            c += f'<div class="box center" style="padding:6px 8px;border-radius:14px"><div class="num" style="text-align:left">{k}</div>{one_beat_svg(k, 250, True).replace("<svg", "<svg style=\"margin:0 auto\"", 1) if False else one_beat_svg(k, 250)}<div style="font-weight:800;font-size:13.5px;margin-top:-2px">{lb}</div><div style="font-size:11px;color:#333">{ds}</div></div>'
        c += '<div class="center" style="align-self:center">' + paul('vibra', 100) + '<div class="g" style="font-size:19px">bata palmas em cada uma!</div></div>'
        c += '</div>'
        return c
    L.add('a6-var', 'aula 6 · as variações', var)

    X12 = ['XXXX', 'X-XX', 'XXX-', 'XX-X', 'X--X', 'XX--', '-XXX', '--XX', '-X-X', 'XXXX', 'X-X-', 'X--X']
    def compl(L):
        c = titulo('Complete o ritmo', 'desenhe as notas nas casinhas marcadas', 480)
        c += '<p style="font-size:12.8px">Cada quadradinho é um <b>tempo</b> (1 e &amp; a). Onde está <b>X</b>, desenhe uma nota (um ovalzinho pintado com haste); onde está <b>–</b>, deixe em branco.</p>'
        c += '<div class="col2" style="gap:9px">'
        for i, p in enumerate(X12):
            c += f'<div class="box" style="padding:6px 12px;border-radius:14px"><span class="num">{i+1}</span><table style="width:100%;border-collapse:collapse;margin-top:-6px"><tr>' + ''.join(f'<td style="text-align:center;font-weight:700;font-size:12px">{h}</td>' for h in ['1', 'e', '&amp;', 'a']) + '</tr><tr>' + ''.join(f'<td style="text-align:center;font-family:Marker;font-size:22px">{"X" if ch == "X" else "–"}</td>' for ch in p) + '</tr></table><div style="border-bottom:2px solid #111;height:34px;margin-top:0"></div></div>'
        c += '</div>'
        names = ['1', 'e', '&', 'a']
        L.gab('a6-compl', 'complete o ritmo (pág. {pg})', ' · '.join(f'{i+1}: notas em ' + ' '.join(names[j] for j, ch in enumerate(p) if ch == 'X') for i, p in enumerate(X12)) + '.')
        c += corner('timido', 56)
        return c
    L.add('a6-compl', 'aula 6 · complete', compl)

    LEIA1 = [list('QQEQ'), list('EEQQ'), ['V1', 'Q', 'V1', 'Q'], ['V2', 'E', 'V2', 'Q'], ['V3', 'Q', 'V3', 'E'], ['V4', 'Q', 'V4', 'Q'], ['V5', 'E', 'V5', 'Q'], ['V7', 'Q', 'V7', 'Q'], ['V1', 'V2', 'V3', 'E'], ['V6', 'Q', 'V6', 'Q']]
    LEIA2 = [['V8', 'Q', 'V8', 'Q'], ['V9', 'E', 'V9', 'Q'], ['V1', 'V1', 'V1', 'V1'], ['V2', 'V3', 'V2', 'V3'], ['V4', 'V5', 'V4', 'V6'], ['V7', 'V8', 'V9', 'Q'], ['V5', 'V6', 'V5', 'V6'], ['V1', 'R', 'V1', 'R'], ['V7', 'V4', 'V2', 'Q'], ['V9', 'V9', 'V9', 'V9']]
    def leia(rows, pid, titulo_, sub_, hint):
        def f(L):
            c = titulo(titulo_, sub_, 460)
            c += f'<p style="font-size:12.8px">{hint}</p>'
            for i, r in enumerate(rows):
                svg, tot = comp_c(beats_spec(r), width=560, sub=True)
                assert tot == 64, (r, tot)
                c += f'<div class="row" style="gap:6px;margin-bottom:0;align-items:flex-start"><span class="num" style="width:26px;margin-top:6px">{i+1}</span><div style="flex:1">{svg}</div><div style="width:112px;text-align:right;font-size:11px;margin-top:6px">palmas<br><span style="white-space:nowrap">{ck(5)}</span></div></div>'
            return c + corner('ouve', 56)
        L.add(pid, 'aula 6 · leia e toque', f)
    leia(LEIA1, 'a6-leia1', 'Bata palmas e leia (1)', 'compassos de 4 tempos', 'Leia cada compasso <b>contando baixinho</b> (1 e &amp; a, 2 e &amp; a…) e bata palmas só nas notas. Marque uma caixinha a cada vez que conseguir <b>sem parar</b>.')
    leia(LEIA2, 'a6-leia2', 'Bata palmas e leia (2)', 'agora com mais pausas e combinações', 'Mesma regra: conte tudo, toque só as notas e respeite os silêncios. Comece a <b>60 BPM</b> e só aumente quando estiver fácil.')

    def nome(L):
        c = titulo('Qual é o nome?', 'ligue cada ritmo ao seu nome', 400)
        esq = list(range(1, 10))
        dire = list(range(1, 10))
        random.Random(11).shuffle(dire)
        for i, k in enumerate(esq):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:3px"><div class="box" style="flex:0 0 42%;padding:2px 8px;border-radius:12px"><span class="num" style="font-size:13px">{k}</span>{one_beat_svg(k, 130, False)}</div>'
                  f'<div style="width:13px;height:13px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:13px;height:13px;border-radius:50%;background:#111;margin-right:8px"></div>'
                  f'<div class="box" style="flex:0 0 42%;min-height:50px;padding:2px 12px;border-radius:12px;display:flex;flex-direction:column;justify-content:center"><b style="font-size:12.5px">{VAR[dire[i]][2]}</b><span style="font-size:12px">({VAR[dire[i]][1]})</span></div></div>')
        pos = {k: i + 1 for i, k in enumerate(dire)}
        L.gab('a6-nome', 'qual é o nome? (pág. {pg})', ' · '.join(f'{k} → {VAR[k][2]}' for k in range(1, 10)) + '.')
        return c
    L.add('a6-nome', 'aula 6 · ligue', nome)

    def monte(L):
        c = titulo('Monte o seu ritmo', 'o dado escolhe, você desenha e toca', 460)
        c += fala('recorte o <b>dado</b> (págs. de recortes), jogue 4 vezes e desenhe o ritmo sorteado em cada casinha. depois é só bater palmas!', 'oculos', 'r')
        c += lab('o que cada número do dado significa', True)
        c += '<div class="col3" style="gap:8px">'
        for n, k in enumerate([1, 2, 3, 4, 5, 6], 1):
            c += f'<div class="box center" style="padding:4px 8px;border-radius:12px"><div class="row"><span class="m" style="font-size:30px;width:30px">{n}</span><div style="flex:1">{one_beat_svg(k, 160, False)}</div></div></div>'
        c += '</div>'
        c += lab('sorteie 4 vezes e desenhe')
        for r in range(3):
            c += '<div class="row" style="gap:8px;margin-bottom:8px">' + ''.join('<div class="box" style="flex:1;height:78px;border-radius:10px;position:relative"><div style="position:absolute;left:6px;right:6px;top:52px;border-top:2px solid #111"></div><span class="tiny" style="position:absolute;left:6px;top:2px">dado: ___</span></div>' for _ in range(4)) + '</div>'
        c += lab('ache o intruso: circule o ritmo diferente em cada linha')
        INT = [(['V1', 'V1', 'V2', 'V1'], 3), (['V3', 'V4', 'V3', 'V3'], 2), (['V5', 'V5', 'V5', 'V6'], 4)]
        for r, (row, ans) in enumerate(INT):
            c += '<div class="row" style="gap:6px;margin-bottom:6px">' + ''.join(f'<div class="box" style="flex:1;padding:2px 4px;border-radius:10px">{one_beat_svg(int(b[1]), 130, False)}</div>' for b in row) + '</div>'
        L.gab('a6-monte', 'monte o seu ritmo (pág. {pg})', 'dado e desenhos: resposta livre (confira com o “quadro” do dado). intrusos: linha 1 → o 3º · linha 2 → o 2º · linha 3 → o 4º.')
        return c
    L.add('a6-monte', 'aula 6 · monte o seu ritmo', monte)

    def arte3(L):
        return f'<section class="page full"><img src="img/color3.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg("color3")}</span></div></section>'
    L.add('color3', 'para colorir', arte3, 'raw')

    # ================= AULA 7 =================
    t = 16 / 3
    def terc(L):
        c = titulo('A tercina', '3 notas no lugar de 2', 300)
        c += fala('e se a gente dividir o tempo em <b>3 partes iguais</b>, em vez de 2? aí nasce a <b>tercina</b>!', 'duvida')
        c += '<p>A <b>tercina</b> junta <b>3 notas</b> no tempo de 2. Ela vem com um colchete e o <b>número 3</b> em cima. Conte: <b>“tri-pla-ça”</b> (ou “1-la-li, 2-la-li…”).</p>'
        svg = rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=330, total=16, tuplets=[(0, 2, 3)], counts=[(0, 'tri'), (t, 'pla'), (2 * t, 'ça')])
        c += f'<div class="box" style="padding:10px 18px"><div class="m" style="font-size:14px;text-transform:uppercase">1 tempo dividido em 3:</div><div class="center"><div style="display:inline-block">{svg}</div></div></div>'
        c += lab('compare e bata palmas:')
        cnt = None
        c += '<div class="box" style="padding:8px 16px;margin-bottom:8px"><div class="row" style="gap:20px"><b style="width:190px;font-size:13px">2 colcheias (1 &amp;)</b>' + rhythm([(0, 8, 'n'), (8, 8, 'n')], beams=[[0, 1]], width=300, total=16) + f'<span style="margin-left:auto">{ck(4)}</span></div></div>'
        c += '<div class="box" style="padding:8px 16px;margin-bottom:8px"><div class="row" style="gap:20px"><b style="width:190px;font-size:13px">3 notas (tercina)</b>' + rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=300, total=16, tuplets=[(0, 2, 3)]) + f'<span style="margin-left:auto">{ck(4)}</span></div></div>'
        c += '<div class="box" style="padding:8px 16px"><div class="row" style="gap:20px"><b style="width:190px;font-size:13px">4 semicolcheias (1 e &amp; a)</b>' + rhythm([(i * 4, 4, 'n') for i in range(4)], beams=[[0, 1, 2, 3]], width=300, total=16) + f'<span style="margin-left:auto">{ck(4)}</span></div></div>'
        c += tip('bata palmas contando 1 tempo com 2 notas, depois com 3, depois com 4. sinta como o ritmo “gira” diferente!', 'tente')
        c += corner('duvida', 60)
        return c
    L.add('a7-terc', 'aula 7 · tercina', terc)

    def sext(L):
        c = titulo('A sextina', '6 notas dentro de um tempo', 360)
        c += '<p>A <b>sextina</b> junta <b>6 notas</b> no tempo de 4 semicolcheias. É como <b>duas tercinas coladas</b>! Também leva um colchete com o <b>número 6</b>.</p>'
        s6 = 16 / 6
        svg = rhythm([(i * s6, 4, 'n') for i in range(6)], beams=[list(range(6))], width=520, total=16, tuplets=[(0, 5, 6)], counts=[(i * s6, tx) for i, tx in enumerate(['1', 'la', 'li', '2', 'la', 'li'])])
        c += f'<div class="box" style="padding:10px 18px"><div class="m" style="font-size:14px;text-transform:uppercase">1 tempo dividido em 6:</div><div class="center"><div style="display:inline-block">{svg}</div></div></div>'
        c += '<p style="margin-top:10px"><b>Como contar:</b> “1-la-li-2-la-li” (uma tercina em cada metade do tempo) ou apenas “1 e-la-li e-la-li”. O mais importante: as 6 notas ficam <b>todas do mesmo tamanho</b>.</p>'
        for nm in ['bata palmas devagar', 'bata palmas no meio', 'bata palmas rápido']:
            c += f'<div class="row" style="justify-content:space-between;padding:8px 0;border-bottom:1.5px dotted #888"><span style="font-size:13.5px">{nm}</span><span>{ck(4, "big")}</span></div>'
        c += lab('tercina × sextina: qual é qual?')
        c += '<div class="col2" style="gap:12px">' + f'<div class="box center" style="padding:8px">{rhythm([(0,8,"n"),(t,8,"n"),(2*t,8,"n")], beams=[[0,1,2]], width=220, total=16, tuplets=[(0,2,3)])}<div class="row" style="justify-content:center;gap:10px;margin-top:4px"><span class="ck r"></span> tercina &nbsp; <span class="ck r"></span> sextina</div></div>' + f'<div class="box center" style="padding:8px">{rhythm([(i*s6,4,"n") for i in range(6)], beams=[list(range(6))], width=220, total=16, tuplets=[(0,5,6)])}<div class="row" style="justify-content:center;gap:10px;margin-top:4px"><span class="ck r"></span> tercina &nbsp; <span class="ck r"></span> sextina</div></div></div>'
        L.gab('a7-sext', 'a sextina (pág. {pg})', 'o da esquerda é a tercina (3 notas) e o da direita é a sextina (6 notas).')
        c += corner('amor', 60)
        return c
    L.add('a7-sext', 'aula 7 · sextina', sext)

    def quantas(L):
        c = titulo('Quantas notas cabem em 1 tempo?', 'compare as divisões', 600)
        s6 = 16 / 6
        rows = [('1 NOTA: SEMÍNIMA', rhythm([(0, 16, 'n')], width=300, total=16)),
                ('2 NOTAS: COLCHEIAS', rhythm([(0, 8, 'n'), (8, 8, 'n')], beams=[[0, 1]], width=300, total=16)),
                ('3 NOTAS: TERCINA', rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=300, total=16, tuplets=[(0, 2, 3)])),
                ('4 NOTAS: SEMICOLCHEIAS', rhythm([(i * 4, 4, 'n') for i in range(4)], beams=[[0, 1, 2, 3]], width=300, total=16)),
                ('6 NOTAS: SEXTINA', rhythm([(i * s6, 4, 'n') for i in range(6)], beams=[list(range(6))], width=300, total=16, tuplets=[(0, 5, 6)]))]
        for t_, svg in rows:
            c += f'<div class="box row" style="gap:14px;padding:8px 18px;margin-bottom:10px;border-radius:16px"><div style="flex:1"><div class="m" style="font-size:15.5px">{t_}</div><div style="font-size:12px;margin-top:4px">bata palmas: {ck(4)}</div></div><div style="width:310px;flex:none">{svg}</div></div>'
        c += lab('desafio')
        c += box('Qual é mais rápida: a <b>tercina</b> ou as <b>4 semicolcheias</b>? Quantas notas a mais cabem?<div class="row" style="gap:10px;margin-top:6px"><b style="font-family:Gochi;font-size:17px">minha resposta:</b><div class="dots" style="flex:1"></div></div>', style='font-size:13.5px')
        c += lab('desafio 2') + box('Se numa música cada tempo recebe <b>6 notas</b> (sextina) e o compasso é 4/4, quantas notas tem um compasso inteiro? <span class="dots" style="display:inline-block;width:80px;vertical-align:bottom"></span>', style='font-size:13.5px')
        L.gab('a7-quantas', 'quantas notas cabem em 1 tempo? (pág. {pg})', 'as 4 semicolcheias são mais rápidas: cabem 1 nota a mais que a tercina (4 contra 3). desafio 2: 6 × 4 = 24 notas.')
        c += corner('duvida', 60)
        return c
    L.add('a7-quantas', 'aula 7 · comparar', quantas)

    def desenhe(L):
        c = titulo('Desenhe tercina e sextina', 'trace e depois faça sozinho(a)', 500)
        s6 = 16 / 6
        c += '<div class="box" style="padding:12px 18px;margin-bottom:12px"><div class="m" style="font-size:15px;text-transform:uppercase">tercina</div><div class="row" style="gap:50px;margin:4px 0">' + rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=210, total=16, tuplets=[(0, 2, 3)]) + rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=210, total=16, tuplets=[(0, 2, 3)], col=GHOST, label_col=GHOST) + '</div><div style="height:70px;border-bottom:2px dotted #888"></div><div style="height:70px;border-bottom:2px dotted #888"></div></div>'
        c += '<div class="box" style="padding:12px 18px"><div class="m" style="font-size:15px;text-transform:uppercase">sextina</div>' + rhythm([(i * s6, 4, 'n') for i in range(6)], beams=[list(range(6))], width=400, total=16, tuplets=[(0, 5, 6)]) + rhythm([(i * s6, 4, 'n') for i in range(6)], beams=[list(range(6))], width=400, total=16, tuplets=[(0, 5, 6)], col=GHOST) + '<div style="height:70px;border-bottom:2px dotted #888"></div><div style="height:70px;border-bottom:2px dotted #888"></div></div>'
        c += tip('lembre: as notas são <b>ligadas por um traço</b>, e em cima vai o colchete com o <b>3</b> ou o <b>6</b>.')
        c += corner('oculos', 60)
        return c
    L.add('a7-desenhe', 'aula 7 · desenhe', desenhe)

    TL = [['Q', 'T', 'Q', 'Q'], ['T', 'T', 'Q', 'T'], ['E', 'T', 'E', 'T'], ['S', 'T', 'S', 'Q'], ['X', 'Q', 'X', 'Q'], ['T', 'X', 'T', 'X'], ['E', 'S', 'T', 'X'], ['X', 'X', 'X', 'X']]
    def leia7(L):
        c = titulo('Leia e toque (3 e 6)', 'tercinas e sextinas: o ritmo agora “gira”', 420)
        c += '<p style="font-size:12.8px">Conte os tempos 1 · 2 · 3 · 4 e <b>dentro de cada tempo</b> toque as notas que aparecem. Na tercina, pense “tri-pla-ça”. Na sextina, “1-la-li-2-la-li”. Devagar e firme!</p>'
        for i, r in enumerate(TL):
            c += f'<div class="row" style="gap:6px;align-items:flex-start;margin-bottom:2px"><span class="num" style="width:26px;margin-top:20px">{i+1}</span><div style="flex:1">{comp_beats(r, 560)}</div><div style="width:112px;text-align:right;font-size:11px;margin-top:24px">palmas<br><span style="white-space:nowrap">{ck(5)}</span></div></div>'
        c += corner('vibra', 56)
        return c
    L.add('a7-leia', 'aula 7 · leia e toque', leia7)

    # ================= AULA 8 BÔNUS =================
    def maos(L):
        c = titulo('Bônus: mãos em movimento', 'D = mão direita · E = mão esquerda', 520)
        c += fala('quem toca bateria precisa de <b>duas mãos</b> amigas! esses desenhos de letras se chamam <b>rudimentos</b>: são os “alfabetos” do baterista.', 'oculos')
        c += lab('1. toque simples', True)
        c += '<div class="center m" style="font-size:30px;letter-spacing:5px">D E D E | D E D E</div><p class="center" style="font-size:13px">alterna uma batida em cada mão.</p>'
        c += '<div class="row" style="justify-content:center;gap:9px;margin:6px 0">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in 'DEDEDEDE') + '</div>'
        c += lab('2. toque duplo')
        c += '<div class="center m" style="font-size:30px;letter-spacing:5px">D D E E | D D E E</div><p class="center" style="font-size:13px">faz duas batidas seguidas com cada mão.</p>'
        c += '<div class="row" style="justify-content:center;gap:9px;margin:6px 0">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in 'DDEEDDEE') + '</div>'
        c += lab('3. agora com o metrônomo')
        c += box('Ponha o metrônomo em <b>60 BPM</b>. Toque cada letra no tempo, devagar, <b>com o mesmo volume em todas as batidas</b>. Quando ficar fácil, suba <b>5 BPM</b>.' + f'<div class="row" style="gap:30px;margin-top:8px"><span>60 BPM {ck(3, "big")}</span><span>65 BPM {ck(3, "big")}</span><span>70 BPM {ck(3, "big")}</span></div>', style='font-size:13px')
        c += tip('pratique primeiro <b>devagar</b>. um baterista de verdade treina o simples por anos!', 'segredo')
        c += corner('oculos', 60)
        return c
    L.add('a8-maos', 'aula 8 · rudimentos', maos)

    def para(L):
        c = titulo('Aprenda o paradiddle', 'pense nas mãos como uma sequência de letras!', 560)
        c += lab('paradiddle simples', True)
        c += '<div class="col2" style="gap:14px"><div class="box center" style="padding:14px;border-radius:18px"><div class="m" style="font-size:34px;letter-spacing:6px">D E D D</div><div style="margin-top:4px;font-size:13px;font-weight:700">começa com D</div></div><div class="box center" style="padding:14px;border-radius:18px"><div class="m" style="font-size:34px;letter-spacing:6px">E D E E</div><div style="margin-top:4px;font-size:13px;font-weight:700">começa com E</div></div></div>'
        c += lab('1. complete as letras')
        c += '<div class="row" style="justify-content:center;gap:9px">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in ['D', 'E', '', 'D', 'E', '', 'E', 'E']) + '</div><p class="center" style="font-size:12.5px;margin-top:4px">dica: 4 batidas em cada metade (D E D D · E D E E).</p>'
        c += lab('2. desafio das baquetas')
        c += '<div class="row" style="justify-content:center;gap:9px">' + ''.join(f'<div style="text-align:center"><div class="box" style="width:66px;height:62px;border-radius:12px"></div><b>{i}</b></div>' for i in range(1, 9)) + '</div><p class="center" style="font-size:12.5px;margin-top:4px">marque um pontinho na <b>1ª batida de cada grupo de 4</b>. depois, toque sem parar.</p>'
        c += lab('3. onde fica o acento?')
        c += box('No paradiddle, a <b>1ª batida de cada grupo</b> costuma ser <b>mais forte</b> (acento). Toque <b>D</b>-e-d-d <b>E</b>-d-e-e com a primeira bem forte e as outras fracas. Qual a diferença que você ouve? <div class="dots"></div>', style='font-size:13px')
        L.gab('a8-para', 'aprenda o paradiddle (pág. {pg})', 'completar: D E D D E D E E.')
        c += corner('timido', 60)
        return c
    L.add('a8-para', 'aula 8 · paradiddle', para)

    def para2(L):
        c = titulo('Paradiddles maiores', 'o segredo é alternar os grupos sem perder o pulso', 620)
        c += lab('paradiddle duplo · 6 toques', True)
        c += '<div class="center m" style="font-size:30px;letter-spacing:5px;line-height:1.3">D E D E D D<br>E D E D E E</div>'
        c += '<div class="row" style="justify-content:center;gap:9px;margin:6px 0">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in 'DEDEDD') + '</div>'
        c += lab('paradiddle triplo · 8 toques')
        c += '<div class="center m" style="font-size:30px;letter-spacing:5px;line-height:1.3">D E D E D E D D<br>E D E D E D E E</div>'
        c += '<div class="row" style="justify-content:center;gap:7px;margin:6px 0">' + ''.join(f'<div class="box" style="width:60px;height:60px;text-align:center;font-family:Marker;font-size:24px;line-height:52px;border-radius:12px">{x}</div>' for x in 'DEDEDEDD') + '</div>'
        c += lab('complete o paradiddle duplo da mão esquerda')
        c += '<div class="row" style="justify-content:center;gap:9px">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in ['E', '', 'E', 'D', '', 'E']) + '</div>'
        c += box('<b>mini missão:</b> toque 2 vezes o duplo e 2 vezes o triplo. Comece a <b>60 BPM</b> e aumente só quando ficar confortável.', style='margin-top:12px;font-size:13.5px')
        L.gab('a8-para2', 'paradiddles maiores (pág. {pg})', 'completar: E D E D E E.')
        c += corner('feliz', 60)
        return c
    L.add('a8-para2', 'aula 8 · paradiddle', para2)

    def para3(L):
        c = titulo('Paradiddle-diddle', 'agora os grupos têm 6 batidas. conte com calma!', 620)
        c += lab('1. aprenda as duas versões', True)
        c += '<div class="box center" style="margin-bottom:8px;padding:14px;border-radius:18px"><div class="m" style="font-size:36px;letter-spacing:8px">D E D D E E</div></div><div class="box center" style="padding:14px;border-radius:18px"><div class="m" style="font-size:36px;letter-spacing:8px">E D E E D D</div></div>'
        c += lab('2. complete o segundo grupo')
        c += '<div class="row" style="justify-content:center;gap:9px">' + ''.join(f'<div class="box" style="width:66px;height:62px;text-align:center;font-family:Marker;font-size:26px;line-height:54px;border-radius:12px">{x}</div>' for x in ['E', '', 'E', '', 'D', 'D']) + '</div>'
        c += lab('3. revisão dos rudimentos')
        for t_ in ['toque simples: mãos alternadas (D E D E)', 'toque duplo: pares de batidas (D D E E)', 'paradiddle: 4 batidas (D E D D)', 'paradiddle-diddle: 6 batidas (D E D D E E)']:
            c += f'<div style="margin-bottom:8px;font-size:13.5px"><span class="ck big"></span> {t_}</div>'
        c += lab('4. qual é o rudimento? escreva o nome')
        for l_ in ['D E D D E D E E', 'D D E E D D E E', 'D E D E D E D E', 'D E D D E E E D D']:
            pass
        for l_, ans in [('D E D D  E D E E', 'paradiddle'), ('D D E E  D D E E', 'toque duplo'), ('D E D E  D E D E', 'toque simples'), ('D E D D E E  E D E E D D', 'paradiddle-diddle')]:
            c += f'<div class="row" style="gap:14px;margin-bottom:6px"><span class="m" style="font-size:20px;width:300px;letter-spacing:3px;white-space:nowrap">{l_}</span><b style="font-size:12.5px">nome:</b><div class="dots" style="flex:1"></div></div>'
        L.gab('a8-para3', 'paradiddle-diddle (pág. {pg})', 'completar: E D E E D D. nomes: paradiddle · toque duplo · toque simples · paradiddle-diddle.')
        c += corner('ouve', 60)
        return c
    L.add('a8-para3', 'aula 8 · rudimentos', para3)

    def pauta_b(L):
        c = titulo('A pauta da bateria', 'cada peça mora num lugar da pauta', 520)
        c += fala('na bateria, a gente lê uma pauta de <b>5 linhas</b>. cada peça tem o seu lugarzinho! o prato (chimbal) usa um <b>X</b> lá em cima.', 'pensa')
        c += '<div class="box center" style="padding:10px">' + drum_measure(hh={0, 2, 4, 6}, sn={2}, bd={0}, width=600, labels=False, flag_single=False).replace('height="172"', 'height="132"') + '</div>'
        c += lab('onde mora cada peça')
        c += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">' + ''.join(f'<div class="box center" style="padding:10px;border-radius:16px"><div class="m" style="font-size:15px;text-transform:uppercase">{n}</div><div style="font-size:12.5px;margin-top:4px">{d}</div></div>' for n, d in [('chimbal e pratos', 'um <b>X</b> acima da pauta'), ('caixa', 'na <b>3ª posição</b> (um espacinho dentro da pauta)'), ('bumbo', 'no <b>1º espacinho</b>, lá embaixo (haste para baixo)')]) + '</div>'
        c += lab('qual peça é qual? ligue') + '<div class="col2" style="gap:8px 20px"><div class="box" style="padding:6px 12px;border-radius:12px">um X lá em cima</div><div class="box" style="padding:6px 12px;border-radius:12px;text-align:right">bumbo</div><div class="box" style="padding:6px 12px;border-radius:12px">bolinha lá embaixo</div><div class="box" style="padding:6px 12px;border-radius:12px;text-align:right">chimbal</div><div class="box" style="padding:6px 12px;border-radius:12px">bolinha no meio</div><div class="box" style="padding:6px 12px;border-radius:12px;text-align:right">caixa</div></div>'
        c += tip('o <b>pé direito</b> toca o bumbo e o <b>pé esquerdo</b> fecha o chimbal. as mãos ficam com a caixa e os pratos!', 'curiosidade')
        c += corner('pensa', 60)
        L.gab('a8-pauta', 'a pauta da bateria (pág. {pg})', 'um X lá em cima → chimbal · bolinha lá embaixo → bumbo · bolinha no meio → caixa.')
        return c
    L.add('a8-pauta', 'aula 8 · pauta da bateria', pauta_b)

    ROCK1 = (set(range(8)), {2, 6}, {0, 4})
    def lev1(L):
        c = titulo('Minha primeira levada de rock', 'a base de milhares de músicas', 560)
        c += fala('uma <b>levada</b> é o ritmo que o baterista repete sem parar. a mais famosa do rock tem 3 peças: chimbal, caixa e bumbo. vamos montar em 3 passos!', 'oculos', 'r')
        c += lab('passo 1: só o chimbal, em todas as colcheias (1 e 2 e 3 e 4 e)', True)
        c += grid_levada(set(range(8)), set(), set(), True)
        c += lab('passo 2: some a caixa nos tempos 2 e 4')
        c += grid_levada(set(range(8)), {2, 6}, set(), True)
        c += lab('passo 3: some o bumbo nos tempos 1 e 3')
        c += grid_levada(*ROCK1, True)
        c += '<div class="box center" style="padding:6px;margin-top:10px">' + drum_measure(*ROCK1, width=600) + '</div>'
        c += tip('conte alto <b>“1 e 2 e 3 e 4 e”</b>. o chimbal toca em tudo, a caixa só no <b>2</b> e no <b>4</b>, o bumbo no <b>1</b> e no <b>3</b>.', 'receita')
        c += corner('oculos', 60)
        return c
    L.add('a8-lev1', 'aula 8 · levada de rock', lev1)

    def lev2(L):
        c = titulo('Mais levadas para tocar', 'agora você já sabe ler a pauta da bateria', 580)
        c += lab('rock com bumbo extra: bumbo no 1, no 3 e no “e” do 3', True)
        R2 = (set(range(8)), {2, 6}, {0, 4, 5})
        c += grid_levada(*R2, True) + '<div class="box center" style="padding:6px;margin-top:6px">' + drum_measure(*R2, width=520) + '</div>'
        c += lab('quatro no chão: bumbo em todos os tempos, chimbal nos “e”s')
        R3 = ({1, 3, 5, 7}, {2, 6}, {0, 2, 4, 6})
        c += grid_levada(*R3, True) + '<div class="box center" style="padding:6px;margin-top:6px">' + drum_measure(*R3, width=520, open_hh={1, 3, 5, 7}) + '</div>'
        c += lab('crie a sua levada: pinte as casinhas com X e dê um nome')
        c += grid_levada(set(), set(), set(), False)
        c += '<div class="row" style="gap:10px;margin-top:8px"><b style="font-family:Gochi;font-size:18px">nome da minha levada:</b><div class="dots" style="flex:1"></div></div>'
        return c
    L.add('a8-lev2', 'aula 8 · levadas', lev2)

    def arte4(L):
        return f'<section class="page full"><img src="img/color4.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg("color4")}</span></div></section>'
    L.add('color4', 'para colorir', arte4, 'raw')
