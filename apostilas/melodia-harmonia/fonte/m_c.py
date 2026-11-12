# -*- coding: utf-8 -*-
from mcommon import *
import random

FING = {'C4': 1, 'D4': 2, 'E4': 3, 'F4': 4, 'G4': 5}
NAT = {(1, 0): 'mi', (1, 1): 'fá', (1, 3): 'sol', (1, 5): 'lá', (2, 0): 'si', (2, 1): 'dó', (2, 3): 'ré', (2, 5): 'mi'}
TABPOS = {'C4': (2, 1), 'D4': (2, 3), 'E4': (1, 0), 'F4': (1, 1), 'G4': (1, 3), 'A4': (1, 5), 'B3': (2, 0)}

def seq(notes, durs=None):
    out = []
    for i, n in enumerate(notes):
        out.append((n, durs[i] if durs else 'sm'))
    return out

def with_bars(notes, per_bar):
    """notes: lista (nota,dur); per_bar: lista com quantas notas por compasso"""
    out = []; k = 0
    for i, cnt in enumerate(per_bar):
        for _ in range(cnt):
            out.append(notes[k]); k += 1
        if i < len(per_bar) - 1: out.append('|')
    return out

def build(L):
    # ============== AULA 4: MELODIA ==============
    def melodia(L):
        c = titulo('Aula 4: melodia', 'ritmo + notas = música que a gente canta', 520)
        c += fala('a <b>melodia</b> é feita de <b>ritmo</b> (quanto dura cada som) e <b>altura</b> (qual nota). é só juntar o que você aprendeu nos dois livros!', 'musica', 'r')
        c += '<div class="col2" style="gap:12px"><div class="box" style="padding:8px 10px"><div class="m" style="font-size:14px">SÓ O RITMO</div>' + rhythm([(0, 16, 'n'), (16, 16, 'n'), (32, 8, 'n'), (40, 8, 'n'), (48, 16, 'n')], beams=[[2, 3]], width=300, total=64, pad=14, counts=[(0, '1'), (16, '2'), (32, '3'), (48, '4')]) + '<div style="font-size:12px">bata palmas</div></div>'
        c += '<div class="box" style="padding:8px 10px"><div class="m" style="font-size:14px">RITMO + NOTAS = MELODIA</div>' + staff(with_bars([('C4', 'sm'), ('C4', 'sm'), ('D4', 'co'), ('E4', 'co'), ('G4', 'sm')], [5]), width=300, gap=9, labels='syl', show_final=False) + '<div style="font-size:12px">cante as notas no mesmo ritmo</div></div></div>'
        c += lab('1. ritmo ou melodia? circule')
        items = [('só palmas: 1 · 2 · 3 · 4', 'ritmo'), ('cantar “dó ré mi fá sol”', 'melodia'), ('baterista tocando o bumbo', 'ritmo'), ('flauta tocando uma canção', 'melodia')]
        for t, r in items:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13.2px"><span class="pill">ritmo</span><span class="pill">melodia</span><span>{t}</span></div>'
        c += lab('2. mesmo ritmo, notas diferentes: troque a altura das notas e crie a sua melodia!')
        c += '<div class="box" style="padding:8px 10px 2px">' + staff(with_bars([('B4', 'sm'), ('B4', 'sm'), ('B4', 'co'), ('B4', 'co'), ('B4', 'sm')], [5]), width=620, gap=12, ghost_after=0, show_final=True) + '<div style="font-size:11.5px;color:#555;margin:-6px 0 4px">(as notas cinzas mostram o ritmo; desenhe as suas notas mais acima ou mais abaixo)</div>' + staff([], width=620, gap=12, show_final=True) + '</div>'
        c += lab('3. sobe ou desce? ouça (no app) e circule')
        c += '<div class="row" style="gap:20px;font-size:13px">' + ''.join(f'<span><b>{i+1}.</b> <span class="pill">sobe</span> <span class="pill">desce</span></span>' for i in range(3)) + '</div>'
        L.gab('m4-melodia', 'melodia (pág. {pg})', 'ritmo, melodia, ritmo, melodia. as melodias da questão 3 dependem do que for tocado ou ouvido no app.')
        return c + corner('musica', 56)
    L.add('m4-melodia', 'aula 4 · melodia', melodia)

    def mao(L):
        c = titulo('A mão no teclado', 'um dedo para cada tecla: 1 2 3 4 5', 440)
        c += fala('vamos colocar a <b>mão direita</b> no teclado: o <b>polegar (1)</b> no <b>dó</b>, e cada dedo numa tecla branca vizinha. isso se chama <b>posição de dó</b>!', 'feliz')
        marks = {60: '1', 62: '2', 64: '3', 65: '4', 67: '5'}
        c += '<div class="center">' + keyboard('C4', 'G4', marks=marks, W=70, H=132, names='syl', dot_c=False) + '</div>'
        c += '<div style="display:flex;justify-content:space-between;margin:8px 20px 4px">' + ''.join(f'<div class="center"><div style="width:50px;height:50px;border:2.5px solid #111;border-radius:50%;line-height:44px;font-family:Marker;font-size:24px;margin:auto">{n}</div><div style="font-size:12px;font-weight:800">{t}</div></div>' for n, t in [(1, 'polegar'), (2, 'indicador'), (3, 'médio'), (4, 'anelar'), (5, 'mindinho')]) + '</div>'
        c += lab('1. ligue o dedo à tecla')
        dire = ['sol', 'ré', 'dó', 'mi', 'fá']
        ordem = [1, 2, 3, 4, 5]
        # linhas: dedo i -> nota correta na posição embaralhada
        emb = ['mi', 'sol', 'dó', 'fá', 'ré']
        dd = ['polegar (1)', 'mindinho (5)', 'indicador (2)', 'anelar (4)', 'médio (3)']
        for i in range(5):
            c += f'<div style="display:flex;align-items:center;margin-bottom:5px"><div class="box" style="flex:0 0 36%;padding:3px 14px;border-radius:30px;font-weight:800">{dd[i]}</div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-right:8px"></div><div class="box center" style="flex:0 0 22%;padding:3px 14px;border-radius:30px;font-weight:800">{emb[i]}</div></div>'
        c += lab('2. toque a escadinha com a mão direita')
        nm = ['C4', 'D4', 'E4', 'F4', 'G4']
        c += '<div class="box" style="padding:6px 10px 0">' + staff([(n, 'sm') for n in nm], width=620, gap=12, labels='syl', fingers=[FING[n] for n in nm], show_final=False) + '</div>'
        c += '<div class="row" style="gap:12px;margin-top:6px;font-size:13px"><b>toquei:</b> ' + ck(5, 'big') + ' <span class="gray">devagar, no pulso, cantando as notas</span></div>'
        L.gab('m4-mao', 'a mão no teclado (pág. {pg})', 'polegar → dó · indicador → ré · médio → mi · anelar → fá · mindinho → sol.')
        return c + corner('feliz', 56)
    L.add('m4-mao', 'aula 4 · a mão no teclado', mao)

    MINI = [(['C4', 'D4', 'E4', 'D4', 'C4', 'D4', 'E4'], ['sm'] * 6 + ['mi'], [4, 3]),
            (['E4', 'F4', 'G4', 'F4', 'E4', 'D4', 'C4'], ['sm'] * 6 + ['mi'], [4, 3]),
            (['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4'], ['sm'] * 6 + ['mi'], [4, 3]),
            (['G4', 'F4', 'E4', 'D4', 'C4', 'C4'], ['sm'] * 4 + ['mi', 'mi'], [4, 2]),
            (['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4'], ['sm'] * 4 + ['sm', 'sm', 'mi'], [4, 3])]
    def mini(L):
        c = titulo('Mini melodias', 'leia, ache as teclas e toque', 400)
        c += '<p style="font-size:12.8px">Coloque o <b>polegar no dó</b> (posição de dó). Leia as notas, olhe os <b>números dos dedos</b> embaixo e toque no pulso. Marque quando conseguir <b>sem parar</b>.</p>'
        resp = []
        for i, (ns, ds, pb) in enumerate(MINI):
            its = with_bars(list(zip(ns, ds)), pb)
            fing = [FING[n] for n in ns]
            c += f'<div class="box" style="padding:4px 10px 2px;margin-bottom:8px;border-radius:14px"><div class="row"><span class="num" style="margin-right:6px">{i+1}</span><div style="flex:1">{staff(its, width=600, gap=10, labels="syl", fingers=fing, tsig=True, show_final=True)}</div></div><div style="text-align:right;font-size:11px;margin-top:-4px">toquei: {ck(4)}</div></div>'
            resp.append(' '.join(sig(n) for n in ns))
        L.gab('m4-mini', 'mini melodias (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)) + '.')
        return c
    L.add('m4-mini', 'aula 4 · mini melodias', mini)

    ESTRELA1 = (['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'], ['sm'] * 6 + ['mi'] + ['sm'] * 6 + ['mi'], [4, 3, 4, 3])
    ESTRELA2 = (['G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4'], ['sm'] * 6 + ['mi'] + ['sm'] * 6 + ['mi'], [4, 3, 4, 3])
    def estrela(L):
        c = titulo('Brilha, brilha, estrelinha', 'melodia tradicional (domínio público)', 560)
        c += fala('essa melodia é conhecida no mundo inteiro. só tem 6 notas diferentes: <b>dó ré mi fá sol lá</b>. dá para tocar com uma mão só!', 'amor')
        c += '<div class="box" style="padding:8px 10px 4px;margin-bottom:8px"><div class="m" style="font-size:13px">1ª PARTE</div>' + staff(with_bars(list(zip(ESTRELA1[0], ESTRELA1[1])), ESTRELA1[2]), width=620, gap=12, labels='syl', tsig=True) + '</div>'
        c += '<div class="box" style="padding:8px 10px 4px;margin-bottom:8px"><div class="m" style="font-size:13px">2ª PARTE</div>' + staff(with_bars(list(zip(ESTRELA2[0], ESTRELA2[1])), ESTRELA2[2]), width=620, gap=12, labels='syl', tsig=False, clef=True) + '</div>'
        c += '<div class="box" style="padding:8px 10px 4px"><div class="m" style="font-size:13px">VOLTA À 1ª PARTE</div><div style="font-size:12.5px">repita a primeira parte do começo e termine no dó.</div></div>'
        c += lab('as teclas que você vai usar: dó ré mi fá sol lá')
        c += '<div class="center">' + keyboard('C4', 'B4', marks={60: '1', 62: '2', 64: '3', 65: '4', 67: '5', 69: '6'}, W=56, H=84, names='syl', dot_c=False) + '</div>'
        c += lab('perguntas')
        cnt_sol = sum(1 for n in ESTRELA1[0] if n == 'G4'); cnt_dc = sum(1 for n in ESTRELA1[0] if n == 'C4')
        c += f'<div class="row" style="gap:10px;font-size:13px"><span>quantas vezes aparece o <b>sol</b> na 1ª parte?</span><div class="dots" style="width:70px"></div></div><div class="row" style="gap:10px;font-size:13px;margin-top:4px"><span>a melodia termina em qual nota?</span><div class="dots" style="width:90px"></div></div>'
        L.gab('m4-estrela', 'Brilha, brilha, estrelinha (pág. {pg})', f'o sol aparece {cnt_sol} vezes na 1ª parte (nota repetida conta cada vez) · termina no dó.')
        return c + corner('amor', 56)
    L.add('m4-estrela', 'aula 4 · estrelinha', estrela)

    ODE1 = ([('E4', 'sm'), ('E4', 'sm'), ('F4', 'sm'), ('G4', 'sm'), '|', ('G4', 'sm'), ('F4', 'sm'), ('E4', 'sm'), ('D4', 'sm'), '|', ('C4', 'sm'), ('C4', 'sm'), ('D4', 'sm'), ('E4', 'sm'), '|', ('E4', 'sm.'), ('D4', 'co'), ('D4', 'mi')])
    ODE2 = ([('E4', 'sm'), ('E4', 'sm'), ('F4', 'sm'), ('G4', 'sm'), '|', ('G4', 'sm'), ('F4', 'sm'), ('E4', 'sm'), ('D4', 'sm'), '|', ('C4', 'sm'), ('C4', 'sm'), ('D4', 'sm'), ('E4', 'sm'), '|', ('D4', 'sm.'), ('C4', 'co'), ('C4', 'mi')])
    def ode(L):
        c = titulo('Ode à Alegria', 'de Beethoven (domínio público)', 440)
        c += fala('uma das melodias mais lindas da história! cabe toda na <b>posição de dó</b> (dedos 1 a 5). vamos tocar devagar e no pulso.', 'vibra')
        f1 = [FING[i[0]] for i in ODE1 if i != '|']
        f2 = [FING[i[0]] for i in ODE2 if i != '|']
        c += '<div class="box" style="padding:8px 10px 4px;margin-bottom:8px"><div class="m" style="font-size:13px">1ª LINHA</div>' + staff(ODE1, width=620, gap=12, labels='syl', fingers=f1, tsig=True) + '</div>'
        c += '<div class="box" style="padding:8px 10px 4px"><div class="m" style="font-size:13px">2ª LINHA</div>' + staff(ODE2, width=620, gap=12, labels='syl', fingers=f2, tsig=False) + '</div>'
        c += lab('o ritmo (conte 1 · 2 · 3 · 4)')
        c += '<p style="font-size:12.8px">No último compasso de cada linha tem uma <b>semínima pontuada</b> (1 tempo e meio), uma <b>colcheia</b> (meio tempo) e uma <b>mínima</b> (2 tempos). Conte: <b>1-2 &amp; 3-4</b>.</p>'
        c += lab('checklist do pianista')
        for t in ['li o nome das notas e cantei devagar', 'toquei só a 1ª linha sem parar', 'toquei as duas linhas no pulso', 'toquei com o metrônomo a 70 BPM']:
            c += f'<div style="margin-bottom:4px;font-size:13.2px"><span class="ck big"></span> {t}</div>'
        c += lab('pergunta') + '<div class="row" style="gap:10px;font-size:13px"><span>quantas notas diferentes a Ode usa?</span><div class="dots" style="width:70px"></div></div>'
        L.gab('m4-ode', 'Ode à Alegria (pág. {pg})', 'usa 5 notas diferentes: dó, ré, mi, fá e sol.')
        return c + corner('vibra', 56)
    L.add('m4-ode', 'aula 4 · Ode à Alegria', ode)

    def ode_tab(L):
        c = titulo('Ode à Alegria no violão', 'tocando em tablatura nas cordas 1 e 2', 580)
        c += fala('a mesma melodia no violão! as notas dó ré mi fá sol moram nas <b>duas cordas mais finas</b>. a gente lê em <b>tablatura</b>: cada número é uma casa.', 'ouve')
        marks = {(2, 1): 'dó', (2, 3): 'ré', (1, 0): 'mi', (1, 1): 'fá', (1, 3): 'sol'}
        c += '<div class="center">' + braco(marks, nfrets=3, w=560, strings=2, h=100, show_names=True) + '</div>'
        def tabline(its):
            ns = [i[0] for i in its if i != '|']
            ev = [TABPOS[n] for n in ns]
            return tab_ev(ev, ns)
        def tab_ev(ev, ns):
            from mel import tab as _t
            return _t(ev, width=600, counts=[sig(n) for n in ns], gap=18)
        c += '<div class="box" style="padding:8px 10px;margin-top:10px"><div class="m" style="font-size:13px">1ª LINHA</div>' + tabline(ODE1) + '</div>'
        c += '<div class="box" style="padding:8px 10px;margin-top:8px"><div class="m" style="font-size:13px">2ª LINHA</div>' + tabline(ODE2) + '</div>'
        c += box('<b>Dedos da mão esquerda:</b> casa 1 → dedo 1 · casa 3 → dedo 3. as cordas “soltas” (número 0) não precisam de dedo! Toque cada nota com o polegar da mão direita, devagar.', style='margin-top:10px;font-size:12.8px')
        c += '<div class="row" style="gap:14px;margin-top:8px;font-size:13px"><b>toquei:</b> ' + ck(5, 'big') + ' <span class="gray">devagar · no pulso · inteira</span></div>'
        L.gab('m4-odetab', 'Ode no violão (pág. {pg})', 'dó = 2ª corda casa 1 · ré = 2ª corda casa 3 · mi = 1ª corda solta · fá = 1ª corda casa 1 · sol = 1ª corda casa 3.')
        return c + corner('ouve', 56)
    L.add('m4-odetab', 'aula 4 · Ode no violão', ode_tab)

    def crie(L):
        c = titulo('Crie a sua melodia', 'o dado escolhe as notas, você escolhe o resto', 540)
        c += fala('compositores também usam sorte! jogue o <b>dado das notas</b> (recorte na página dos dados) e deixe cada número virar uma nota.', 'oculos', 'r')
        c += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:7px">' + ''.join(f'<div class="box center" style="padding:6px 2px;border-radius:12px"><div class="m" style="font-size:22px">{i+1}</div><div style="font-weight:800;font-size:13px">{SYL[n]}</div><div class="cf" style="font-size:15px">{n}</div></div>' for i, n in enumerate(['C', 'D', 'E', 'F', 'G', 'A'])) + '</div>'
        c += lab('1. jogue o dado 8 vezes e escreva as notas')
        c += '<div class="row" style="gap:7px">' + ''.join(f'<div class="box center" style="flex:1;height:48px;border-radius:10px;font-size:10px;padding-top:2px">{i+1}ª</div>' for i in range(8)) + '</div>'
        c += lab('2. desenhe as notas na pauta. escolha o ritmo: semínimas, mínimas ou colcheias!')
        for _ in range(3):
            c += '<div class="box" style="padding:4px 10px;margin-bottom:6px">' + staff([], width=620, gap=12, tsig=True) + '</div>'
        c += lab('3. dê um nome para a sua música')
        c += '<div class="row" style="gap:10px"><b style="font-family:Gochi;font-size:18px">título:</b><div class="dots" style="flex:1"></div></div>'
        c += '<div class="row" style="gap:10px;margin-top:6px"><b style="font-family:Gochi;font-size:18px">compositor(a):</b><div class="dots" style="flex:1"></div></div>'
        c += '<div style="margin-top:8px;font-size:13px"><span class="ck big"></span> toquei no teclado &nbsp; <span class="ck big"></span> toquei no violão &nbsp; <span class="ck big"></span> gravei no celular</div>'
        return c + corner('oculos', 56)
    L.add('m4-crie', 'aula 4 · crie sua melodia', crie)

    PARES = [('C4', 'G4'), ('E5', 'C5'), ('D4', 'D4'), ('G4', 'B4'), ('F5', 'A4'), ('E4', 'F4'), ('C5', 'C4'), ('A4', 'A4')]
    def contorno(L):
        c = titulo('Sobe ou desce?', 'o desenho da melodia', 360)
        c += '<p>Quando a melodia vai para uma nota mais <b>alta</b> na pauta, ela <b>sobe</b>. Mais <b>baixa</b>, <b>desce</b>. Igual, <b>repete</b>.</p>'
        c += lab('1. a 2ª nota sobe, desce ou repete?', True)
        res = []
        c += '<div class="col2" style="gap:8px">'
        for i, (a, b) in enumerate(PARES):
            d = dpos(b) - dpos(a)
            res.append('sobe' if d > 0 else 'desce' if d < 0 else 'repete')
            c += f'<div class="box" style="padding:4px 8px;border-radius:12px"><span class="num">{i+1}</span>{staff([(a, "sm"), (b, "sm")], width=210, gap=9, show_final=False)}<div class="row" style="justify-content:center;gap:6px;font-size:12px"><span class="pill">sobe</span><span class="pill">desce</span><span class="pill">repete</span></div></div>'
        c += '</div>'
        c += lab('2. desenhe uma linha mostrando o caminho da melodia')
        ex = [[('C4', 'sm'), ('E4', 'sm'), ('G4', 'sm'), ('E4', 'sm')]]
        for e in ex:
            c += '<div class="box" style="padding:4px 10px;margin-bottom:6px">' + staff(e, width=620, gap=11, show_final=False) + '<div style="height:36px;border:2px dashed #aaa;border-radius:8px;margin-bottom:4px"></div></div>'
        L.gab('m4-contorno', 'sobe ou desce? (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(res)) + '. linha: sobe (dó mi sol) e depois desce (sol → mi).')
        return c + corner('timido', 56)
    L.add('m4-contorno', 'aula 4 · sobe ou desce', contorno)

    # ============== AULA 5: VIOLÃO ==============
    def cordas(L):
        c = titulo('Aula 5: as 6 cordas', 'do grave ao agudo: mi · lá · ré · sol · si · mi', 560)
        c += fala('o violão tem <b>6 cordas</b>. a <b>1ª corda</b> é a mais <b>fina</b> (e mais aguda). a <b>6ª</b> é a mais <b>grossa</b> (e mais grave). parece ao contrário, mas é assim que se conta!', 'duvida')
        marks = {(s, 0): OPEN_STR[6 - s] for s in range(1, 7)}
        c += '<div class="center">' + braco(marks, nfrets=3, w=640, strings=6, h=190) + '</div>'
        c += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:6px 0">' + ''.join(f'<div class="box center" style="padding:5px 2px;border-radius:12px"><div class="num" style="font-size:12px">{s}ª corda</div><div class="m" style="font-size:16px">{OPEN_STR[6-s].upper()}</div><div class="cf" style="font-size:14px">{ {1:"E",2:"B",3:"G",4:"D",5:"A",6:"E"}[s] }</div></div>' for s in range(1, 7)) + '</div>'
        c += box('<b>Frase para decorar (da 6ª para a 1ª):</b> <b>M</b>eu <b>L</b>indo <b>R</b>obô <b>S</b>abe <b>S</b>empre <b>M</b>úsica = <b>Mi Lá Ré Sol Si Mi</b>. invente a sua: <div class="dots"></div>', style='font-size:12.8px')
        c += lab('1. ligue a corda ao nome dela (solta)')
        ords = [(1, 'mi'), (2, 'si'), (3, 'sol'), (4, 'ré'), (5, 'lá'), (6, 'mi')]
        dd = ['ré', 'sol', 'mi', 'lá', 'si', 'mi']
        for i, (s, n) in enumerate(ords):
            c += f'<div style="display:flex;align-items:center;margin-bottom:4px"><div class="box" style="flex:0 0 28%;padding:2px 14px;border-radius:30px;font-weight:800">{s}ª corda</div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-right:8px"></div><div class="box center" style="flex:0 0 20%;padding:2px 14px;border-radius:30px;font-weight:800">{dd[i]}</div></div>'
        c += '<div class="col2" style="gap:6px 16px;margin-top:8px;font-size:13px"><div>a corda mais fina é a <b class="dots" style="display:inline-block;width:40px"></b>ª</div><div>a corda mais grossa é a <b class="dots" style="display:inline-block;width:40px"></b>ª</div></div>'
        L.gab('m5-cordas', 'as 6 cordas (pág. {pg})', 'ligue: 1ª → mi · 2ª → si · 3ª → sol · 4ª → ré · 5ª → lá · 6ª → mi. mais fina: 1ª · mais grossa: 6ª.')
        return c + corner('duvida', 56)
    L.add('m5-cordas', 'aula 5 · as cordas', cordas)

    def trastes(L):
        c = titulo('As casas do violão', 'onde cada nota mora na 1ª e na 2ª corda', 560)
        c += fala('o braço tem várias <b>casas</b> (os espaços entre as barrinhas de metal). cada casa muda a nota: <b>apertar uma casa = subir um semitom</b>. aperte <b>perto do traste</b>, com a ponta do dedo.', 'pensa')
        marks = {k: v for k, v in NAT.items()}
        c += '<div class="center">' + braco(marks, nfrets=5, w=640, strings=2, h=110) + '</div>'
        c += '<div class="col2" style="gap:10px;margin-top:8px">' + box('<div class="m" style="font-size:13px">1ª CORDA (MI)</div><div class="cf" style="font-size:14px">solta: mi · casa 1: fá · casa 3: sol · casa 5: lá</div>') + box('<div class="m" style="font-size:13px">2ª CORDA (SI)</div><div class="cf" style="font-size:14px">solta: si · casa 1: dó · casa 3: ré · casa 5: mi</div>') + '</div>'
        c += lab('1. complete')
        qs = [((1, 3), 'na 1ª corda, casa 3, está o'), ((2, 1), 'na 2ª corda, casa 1, está o'), ((1, 5), 'na 1ª corda, casa 5, está o'), ((2, 3), 'na 2ª corda, casa 3, está o'), ((1, 0), 'na 1ª corda solta está o'), ((2, 5), 'na 2ª corda, casa 5, está o')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:13.2px"><span>{t}</span><div class="dots" style="width:60px"></div></div>' for _, t in qs) + '</div>'
        c += lab('2. onde fica? escreva corda e casa')
        ws = [('fá', '1ª corda, casa 1'), ('ré', '2ª corda, casa 3'), ('dó', '2ª corda, casa 1'), ('lá', '1ª corda, casa 5')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:13.2px"><b style="width:30px">{n}</b><div class="dots" style="flex:1"></div></div>' for n, _ in ws) + '</div>'
        c += lab('3. pinte as bolinhas das notas dó, mi e sol no braço de baixo')
        c += '<div class="center">' + braco({}, nfrets=5, w=640, strings=2, h=100) + '</div>'
        L.gab('m5-trastes', 'as casas do violão (pág. {pg})', ' · '.join(NAT[k] for k, _ in qs) + '. onde fica: fá = 1ª corda casa 1 · ré = 2ª corda casa 3 · dó = 2ª corda casa 1 · lá = 1ª corda casa 5. dó está na 2ª corda casa 1; mi na 1ª corda solta (ou 2ª casa 5); sol na 1ª corda casa 3.')
        return c + corner('pensa', 56)
    L.add('m5-trastes', 'aula 5 · casas', trastes)

    def semitons5(L):
        c = titulo('Cada casa é um semitom', 'as notas com ♯ também moram no braço', 560)
        n1 = ['mi', 'fá', 'fá♯', 'sol', 'sol♯', 'lá']; n2 = ['si', 'dó', 'dó♯', 'ré', 'ré♯', 'mi']
        marks = {(1, i): n for i, n in enumerate(n1)}; marks.update({(2, i): n for i, n in enumerate(n2)})
        c += '<div class="center">' + braco(marks, nfrets=5, w=640, strings=2, h=110) + '</div>'
        c += '<div class="col2" style="gap:10px;margin-top:10px">' + box('<b>1 casa = 1 semitom</b><br>mi → fá (casa 1) é um semitom.', style='font-size:13px') + box('<b>2 casas = 1 tom</b><br>mi → fá♯ (casa 2) é um tom.', style='font-size:13px') + '</div>'
        c += lab('1. verdadeiro ou falso?')
        vf = [('ir da casa 1 para a casa 3 sobe um tom.', 'V'), ('na 1ª corda, o fá♯ fica na casa 2.', 'V'), ('de uma casa para a vizinha são dois semitons.', 'F'), ('na 2ª corda, o ré fica na casa 3.', 'V')]
        for t, r in vf:
            c += f'<div class="row" style="gap:6px;margin-bottom:4px;font-size:13.5px"><span class="ck big"></span> V &nbsp;<span class="ck big"></span> F &nbsp; {t}</div>'
        c += lab('2. escreva a nota')
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:13.5px"><span>{t}:</span><div class="dots" style="flex:1"></div></div>' for t in ['1ª corda, casa 4', '2ª corda, casa 4', '1ª corda, casa 2', '2ª corda, casa 2']) + '</div>'
        c += lab('3. a escala de dó maior na 2ª e 1ª cordas')
        c += '<p style="font-size:13px">Com as notas que você já viu, toque a escala subindo: <b>dó (2ª c.1) · ré (2ª c.3) · mi (1ª solta) · fá (1ª c.1) · sol (1ª c.3) · lá (1ª c.5)</b>. Marque quando conseguir: ' + ck(5, 'big') + '</p>'
        L.gab('m5-semi', 'cada casa é um semitom (pág. {pg})', 'V · V · F · V. notas: sol♯ · ré♯ · fá♯ · dó♯.')
        return c + corner('musica', 56)
    L.add('m5-semi', 'aula 5 · semitons', semitons5)

    def tabp(L):
        c = titulo('A tablatura (tab)', 'a partitura do violão em 6 linhas', 440)
        c += fala('a <b>tablatura</b> mostra onde os dedos vão! as <b>6 linhas</b> são as <b>6 cordas</b>: a de cima é a <b>1ª (mais fina)</b>. o <b>número</b> é a <b>casa</b>: 0 = corda solta.', 'oculos')
        c += '<div class="box" style="padding:8px 10px">' + tab([(1, 0), (1, 1), (1, 3), (1, 1), (1, 0)], width=600, counts=['mi', 'fá', 'sol', 'fá', 'mi'], gap=20) + '</div>'
        c += lab('1. leia a tab e escreva as notas')
        tabs = [([(1, 3), (1, 1), (1, 0)], ['sol', 'fá', 'mi']), ([(2, 1), (2, 3), (1, 0)], ['dó', 'ré', 'mi']), ([(1, 0), (1, 1), (1, 3), (1, 5)], ['mi', 'fá', 'sol', 'lá']), ([(2, 3), (2, 1), (2, 0)], ['ré', 'dó', 'si'])]
        c += '<div class="col2" style="gap:8px">'
        for i, (ev, ns) in enumerate(tabs):
            c += f'<div class="box" style="padding:6px 8px;border-radius:12px"><span class="num">{i+1}</span>{tab(ev, width=270, gap=15)}<div class="row" style="gap:6px;justify-content:center;margin-top:2px">' + ''.join('<div class="dots" style="width:50px"></div>' for _ in ns) + '</div></div>'
        c += '</div>'
        c += lab('2. escreva a tab destas notas')
        for nm in [['mi', 'sol', 'fá']]:
            c += f'<div class="box" style="padding:6px 10px;margin-bottom:6px"><div class="row" style="gap:8px"><b style="font-size:13px">escreva:</b>' + ''.join(f'<span class="pill">{n}</span>' for n in nm) + '</div>' + tab([None, None, None], width=560, gap=14) + '</div>'
        L.gab('m5-tab', 'a tablatura (pág. {pg})', 'leitura: 1: sol fá mi · 2: dó ré mi · 3: mi fá sol lá · 4: ré dó si. escrever: mi (1ª solta), sol (1ª casa 3), fá (1ª casa 1).')
        return c
    L.add('m5-tab', 'aula 5 · tablatura', tabp)

    def postura(L):
        c = titulo('Postura e primeiros dedilhados', 'tocar com conforto e sem dor', 560)
        c += fala('um bom músico começa pela <b>postura</b>. se o corpo está confortável, a música sai mais fácil (e sem dor nos dedos)!', 'feliz')
        c += '<div class="col2" style="gap:12px">'
        c += box('<div class="m" style="font-size:14px;margin-bottom:5px">SENTADO(A)</div><ul style="padding-left:16px;font-size:12.5px;line-height:1.5">' + dica_lista(['costas retas e ombros soltos', 'violão apoiado na perna (destros: na direita)', 'pés no chão ou um apoio para o pé esquerdo', 'o braço do violão sobe um pouquinho']) + '</ul>')
        c += box('<div class="m" style="font-size:14px;margin-bottom:5px">MÃO ESQUERDA (nas casas)</div><ul style="padding-left:16px;font-size:12.5px;line-height:1.5">' + dica_lista(['polegar atrás do braço, sem apertar demais', 'a <b>ponta</b> do dedo bem perto do traste', 'dedos curvados, como se segurasse uma bolinha', 'dedos numerados: 1 indicador · 2 médio · 3 anelar · 4 mindinho']) + '</ul>')
        c += '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:10px">'
        c += box('<div class="m" style="font-size:14px;margin-bottom:5px">MÃO DIREITA (nas cordas)</div><ul style="padding-left:16px;font-size:12.5px;line-height:1.5">' + dica_lista(['o antebraço apoia o violão', 'polegar toca as cordas graves, os outros dedos as agudas', 'ou use uma <b>palheta</b> entre o polegar e o indicador', 'o movimento vem do pulso, solto']) + '</ul>')
        c += box('<div class="m" style="font-size:14px;margin-bottom:5px">AFINAÇÃO</div><div style="font-size:12.5px;line-height:1.5">com a ajuda de um adulto, use um <b>afinador</b> (app ou clip). as cordas soltas devem ser: <b>Mi · Lá · Ré · Sol · Si · Mi</b>. as <b>tarraxas</b> giram para apertar ou soltar a corda: devagar!</div>')
        c += '</div>'
        c += lab('aquecimento da “minhoca”: um dedo para cada casa')
        c += '<p style="font-size:12.8px">Na <b>1ª corda</b> toque as casas 1-2-3-4 (dedos 1-2-3-4) e depois na <b>2ª corda</b>. Devagar e no pulso!</p>'
        c += '<div class="box" style="padding:8px 10px">' + tab([(1, 1), (1, 2), (1, 3), (1, 4), (2, 1), (2, 2), (2, 3), (2, 4)], width=600, counts=['1', '2', '3', '4', '1', '2', '3', '4'], gap=20) + '</div>'
        c += '<div class="row" style="gap:12px;margin-top:8px;font-size:13px"><b>toquei:</b> ' + ck(6, 'big') + '</div>'
        return c + corner('feliz', 56)
    L.add('m5-postura', 'aula 5 · postura', postura)

    def arte3(L):
        return f'<section class="page full"><img src="img/color3.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>{FOOT}</span><span>{L.pg("color3")}</span></div></section>'
    L.add('color3', 'para colorir', arte3, 'raw')
