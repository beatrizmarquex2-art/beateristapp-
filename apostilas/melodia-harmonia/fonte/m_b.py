# -*- coding: utf-8 -*-
from mcommon import *
import random

BLACK = {61: 'dó♯/ré♭', 63: 'ré♯/mi♭', 66: 'fá♯/sol♭', 68: 'sol♯/lá♭', 70: 'lá♯/si♭'}

def build(L):
    # ============== AULA 2 ==============
    def semi(L):
        c = titulo('Aula 2: tom e semitom', 'a distância entre as notas', 440)
        c += fala('o <b>semitom</b> é a menor distância: de uma tecla para a vizinha (preta ou branca). <b>2 semitons = 1 tom</b>.', 'pensa')
        c += '<div class="center">' + keyboard('C4', 'E5', marks={}, W=48, H=116, names='syl', dot_c=False) + '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:8px">' + box('<b>semitom:</b> tecla vizinha<br>ex.: dó → dó♯ · mi → fá · si → dó', style='font-size:13px') + box('<b>tom:</b> pula uma tecla (dois semitons)<br>ex.: dó → ré · fá → sol · lá → si', style='font-size:13px') + '</div>'
        c += box('<b>Atenção!</b> entre <b>mi e fá</b> e entre <b>si e dó</b> NÃO existe tecla preta: por isso essas duas distâncias já são <b>semitons</b>!', style='margin-top:8px;font-size:13px')
        c += lab('1. tom (T) ou semitom (S)? marque')
        pares = [('C4', 'D4'), ('E4', 'F4'), ('F4', 'G4'), ('B4', 'C5'), ('G4', 'A4'), ('A4', 'B4'), ('D4', 'E4'), ('C4', 'C#4')]
        res = []
        c += '<div class="col2" style="gap:6px 14px">'
        for a, b in pares:
            d = midi(b) - midi(a)
            res.append('T' if d == 2 else 'S')
            c += f'<div class="row" style="gap:8px;font-size:13.5px;border-bottom:1.5px dotted #aaa;padding:2px 0"><b style="width:96px">{sig(a)} → {sig(b)}</b><span class="ck"></span> T <span class="ck"></span> S</div>'
        c += '</div>'
        c += lab('2. circule no teclado os 2 lugares onde as teclas brancas se tocam (sem preta no meio)')
        c += '<div class="center">' + keyboard('C4', 'B5', marks={}, W=33, H=90, dot_c=False) + '</div>'
        L.gab('m2-semi', 'tom e semitom (pág. {pg})', ' · '.join(f'{sig(a)}→{sig(b)}: {r}' for (a, b), r in zip(pares, res)) + '. lugares: entre mi e fá e entre si e dó (duas vezes cada).')
        return c + corner('pensa', 56)
    L.add('m2-semi', 'aula 2 · tons e semitons', semi)

    def pretas(L):
        c = titulo('As teclas pretas: ♯ e ♭', 'cada tecla preta tem dois nomes!', 480)
        c += fala('o <b>sustenido (♯)</b> sobe a nota um semitom, para a tecla da direita. o <b>bemol (♭)</b> desce um semitom, para a tecla da esquerda. a mesma tecla preta pode ter dois nomes!', 'duvida')
        c += '<div class="center">' + keyboard('C4', 'B4', marks={}, W=72, H=130, names='syl', black_names=BLACK, dot_c=False) + '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:10px"><div class="box center" style="padding:8px"><div style="font-size:54px;line-height:1">♯</div><b>sustenido</b><div style="font-size:12px">dó ♯ = a tecla à direita do dó</div></div><div class="box center" style="padding:8px"><div style="font-size:54px;line-height:1">♭</div><b>bemol</b><div style="font-size:12px">ré ♭ = a tecla à esquerda do ré</div></div></div>'
        c += lab('1. trace os símbolos')
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<span style="font-size:60px;line-height:1;color:{"#111" if i%4==0 else "#d0d0d0"}">{s}</span>' for i, s in enumerate(['♯', '♯', '♯', '♯', '♭', '♭', '♭', '♭'])) + '</div>'
        c += lab('2. a mesma tecla, dois nomes: complete')
        pares = [('dó♯', 'ré'), ('ré♯', 'mi'), ('fá♯', 'sol'), ('sol♯', 'lá'), ('lá♯', 'si')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:14px"><b>{a}</b><span>=</span><b>{b}</b><span style="display:inline-block;width:26px;border-bottom:2px solid #111;text-align:center">&nbsp;</span></div>' for a, b in pares) + '</div>'
        c += lab('3. qual tecla? escreva a nota')
        qs = [('fá + ♯', 'fá♯'), ('si + ♭', 'si♭'), ('sol + ♯', 'sol♯'), ('mi + ♭', 'mi♭')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:14px"><b>{a}</b><span>=</span><div class="dots" style="width:70px"></div></div>' for a, _ in qs) + '</div>'
        L.gab('m2-pretas', 'as teclas pretas (pág. {pg})', 'dó♯ = ré♭ · ré♯ = mi♭ · fá♯ = sol♭ · sol♯ = lá♭ · lá♯ = si♭. depois: fá♯ · si♭ · sol♯ · mi♭.')
        return c + corner('duvida', 56)
    L.add('m2-pretas', 'aula 2 · ♯ e ♭', pretas)

    def escala(L):
        c = titulo('A escala de dó maior', 'a escadinha de 8 notas', 440)
        c += fala('uma <b>escala</b> é uma escadinha de notas em ordem. a mais famosa é a de <b>dó maior</b>: só teclas brancas, de um dó até o outro!', 'musica', 'r')
        marks = {60: '1', 62: '2', 64: '3', 65: '4', 67: '5', 69: '6', 71: '7', 72: '8'}
        c += '<div class="center">' + keyboard('C4', 'C5', marks=marks, W=60, H=124, names='syl', dot_c=False) + '</div>'
        c += lab('a receita da escala maior: T T S T T T S')
        c += '<div class="row" style="justify-content:space-between;margin:2px 0 4px">' + ''.join(f'<div class="box center" style="flex:1;margin:0 2px;padding:6px 0;border-radius:12px"><div class="m" style="font-size:20px">{t}</div></div>' for t in 'TTSTTTS') + '</div>'
        c += '<div class="row" style="justify-content:space-between;font-size:11.5px;font-weight:700;color:#444"><span>dó→ré</span><span>ré→mi</span><span>mi→fá</span><span>fá→sol</span><span>sol→lá</span><span>lá→si</span><span>si→dó</span></div>'
        c += lab('1. complete: T (tom) ou S (semitom)?')
        c += '<div class="row" style="justify-content:space-between">' + ''.join(f'<div class="center"><div style="font-size:11px;font-weight:700">{a}→{b}</div><div class="box" style="width:76px;height:42px;border-radius:10px;margin-top:2px"></div></div>' for a, b in [('dó', 'ré'), ('ré', 'mi'), ('mi', 'fá'), ('fá', 'sol'), ('sol', 'lá'), ('lá', 'si'), ('si', 'dó')]) + '</div>'
        c += lab('2. escreva a escala de dó maior (subindo e descendo)')
        c += '<div class="line" style="height:30px"></div><div class="line" style="height:30px"></div>'
        c += box('<b>Cante e toque:</b> suba a escada “dó ré mi fá sol lá si dó” e desça de volta. Marque quando conseguir: ' + ck(5, 'big'), style='margin-top:10px;font-size:13px')
        L.gab('m2-escala', 'a escala de dó maior (pág. {pg})', 'T T S T T T S. escala: dó ré mi fá sol lá si dó (subindo) · dó si lá sol fá mi ré dó (descendo).')
        return c + corner('musica', 56)
    L.add('m2-escala', 'aula 2 · escala de dó', escala)

    def escala2(L):
        c = titulo('Outras escalas maiores', 'a mesma receita, outro ponto de partida', 560)
        c += '<p>Para a escala soar “igualzinha”, a receita <b>T T S T T T S</b> tem que ser a mesma. Quando começamos em outra nota, as <b>teclas pretas</b> entram para manter a receita!</p>'
        def esc(nome, notas, lo='C4', hi='G5'):
            marks = {midi(n): str(i + 1) for i, n in enumerate(notas)}
            return f'<div class="box" style="padding:8px 10px;margin-bottom:8px;border-radius:14px"><div class="row" style="gap:10px;margin-bottom:3px"><b class="m" style="font-size:15px">{nome}</b><span class="gray" style="font-size:12px">{" · ".join(sig(n) for n in notas)}</span></div><div class="center">{keyboard(lo, hi, marks=marks, W=34, H=84, dot_c=False)}</div></div>'
        c += esc('sol maior', ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'])
        c += esc('fá maior', ['F4', 'G4', 'A4', 'Bb4', 'C5', 'D5', 'E5', 'F5'])
        c += lab('agora é com você: pinte a escala de ré maior (ré mi fá♯ sol lá si dó♯ ré)')
        c += '<div class="box" style="padding:8px 10px;border-radius:14px"><div class="center">' + keyboard('C4', 'G5', marks={}, W=34, H=84, dot_c=False) + '</div></div>'
        c += tip('em sol maior só o <b>fá</b> vira <b>fá♯</b>. em fá maior o <b>si</b> vira <b>si♭</b>. em ré maior viram fá♯ e dó♯. confira com a receita T T S T T T S!', 'repare')
        L.gab('m2-escala2', 'outras escalas (pág. {pg})', 'ré maior: ' + keyboard('C4', 'G5', marks={midi(n): str(i + 1) for i, n in enumerate(['D4', 'E4', 'F#4', 'G4', 'A4', 'B4', 'C#5', 'D5'])}, W=14, H=46, dot_c=False), kind='html')
        return c + corner('oculos', 56)
    L.add('m2-escala2', 'aula 2 · outras escalas', escala2)

    def jogos2(L):
        c = titulo('Jogos de tons e semitons', 'ouvido e olho de músico', 440)
        c += lab('1. tom (T) ou semitom (S)? olhe as teclas marcadas', True)
        pares = [('E4', 'F4'), ('C4', 'D4'), ('B4', 'C5'), ('F4', 'G4'), ('D4', 'D#4'), ('A4', 'B4'), ('G4', 'G#4'), ('D4', 'E4')]
        res = []
        c += '<div class="col2" style="gap:8px">'
        for i, (a, b) in enumerate(pares):
            d = midi(b) - midi(a); res.append('T' if d == 2 else 'S')
            c += f'<div class="box" style="padding:6px 8px;border-radius:12px"><span class="num">{i+1}</span><div class="center">{keyboard("C4", "C5", marks={midi(a): "1", midi(b): "2"}, W=24, H=56, dot_c=False)}</div><div class="row" style="justify-content:center;gap:14px;margin-top:3px;font-weight:800"><span class="ck big r"></span> T &nbsp; <span class="ck big r"></span> S</div></div>'
        c += '</div>'
        c += lab('2. verdadeiro ou falso?')
        vf = [('entre mi e fá tem uma tecla preta.', 'F'), ('um tom = 2 semitons.', 'V'), ('o sustenido sobe a nota um semitom.', 'V'), ('a escala de dó maior usa teclas pretas.', 'F'), ('de si para dó é um semitom.', 'V')]
        for t, r in vf:
            c += f'<div class="row" style="gap:6px;margin-bottom:4px;font-size:13.5px"><span class="ck big"></span> V &nbsp;<span class="ck big"></span> F &nbsp; {t}</div>'
        L.gab('m2-jogos', 'jogos de tons e semitons (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(res)) + '. V/F: F · V · V · F · V.')
        return c + corner('feliz', 56)
    L.add('m2-jogos', 'aula 2 · jogos', jogos2)

    # ============== AULA 3 ==============
    def pauta(L):
        c = titulo('Aula 3: a pauta', '5 linhas e 4 espaços onde a música mora', 480)
        c += fala('a <b>pauta</b> tem <b>5 linhas</b> e <b>4 espaços</b>. a gente conta de <b>baixo para cima</b>. a nota pode ficar <b>na linha</b> ou <b>no espaço</b>!', 'feliz')
        c += '<div class="box" style="padding:10px 10px 4px">' + staff([], width=640, gap=14, clef=True, numbers=True, show_final=False) + '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:10px">' + box('<div class="m" style="font-size:14px">A CLAVE DE SOL</div><div style="font-size:12.5px">é o desenho do começo da pauta. o enrolado dela abraça a <b>2ª linha</b>: é onde mora o <b>sol</b>!</div>') + box('<div class="m" style="font-size:14px">A BARRA DE COMPASSO</div><div style="font-size:12.5px">a linha vertical que separa os compassos. a barra dupla no fim diz: acabou!</div>') + '</div>'
        c += lab('1. trace a clave de sol e depois desenhe sozinho(a)')
        c += '<div class="box" style="padding:4px 10px">' + staff([], width=640, gap=14, clef=True, clef_col='#d0d0d0', show_final=False) + '</div>'
        c += '<div class="box" style="padding:4px 10px;margin-top:8px">' + staff([], width=640, gap=14, clef=False, show_final=False) + '</div>'
        c += lab('2. responda')
        c += '<div class="col3" style="gap:8px;font-size:13.5px"><div>quantas linhas? <b class="dots" style="display:inline-block;width:40px"></b></div><div>quantos espaços? <b class="dots" style="display:inline-block;width:40px"></b></div><div>de onde para onde se conta? <b class="dots" style="display:inline-block;width:70px"></b></div></div>'
        L.gab('m3-pauta', 'a pauta (pág. {pg})', '5 linhas · 4 espaços · de baixo para cima.')
        return c + corner('feliz', 56)
    L.add('m3-pauta', 'aula 3 · a pauta', pauta)

    def linhas(L):
        c = titulo('As notas nas linhas', 'mi · sol · si · ré · fá', 440)
        c += '<div class="box" style="padding:10px 10px 0">' + staff([('E4', 'sm'), ('G4', 'sm'), ('B4', 'sm'), ('D5', 'sm'), ('F5', 'sm')], width=640, gap=14, labels='syl', show_final=False) + '</div>'
        c += box('<b>Para decorar, de baixo para cima:</b> <span class="m" style="font-size:18px">MI · SOL · SI · RÉ · FÁ</span><br><span style="font-size:13px">frase do Paul: <b>M</b>amãe <b>S</b>empre <b>S</b>orri <b>R</b>evendo <b>F</b>otos! (invente a sua)</span><div class="dots"></div>', style='margin:10px 0')
        c += lab('qual é a nota? escreva o nome')
        alvo = ['G4', 'E4', 'D5', 'B4', 'F5', 'G4', 'B4', 'E4']
        c += '<div class="col4" style="gap:8px">'
        for n in alvo:
            c += f'<div class="box center" style="padding:4px;border-radius:12px">{staff([(n, "sm")], width=140, gap=11, show_final=False)}<div class="dots" style="width:90px;margin:2px auto"></div></div>'
        c += '</div>'
        L.gab('m3-linhas', 'as notas nas linhas (pág. {pg})', ' · '.join(sig(n) for n in alvo) + '.')
        return c + corner('timido', 56)
    L.add('m3-linhas', 'aula 3 · linhas', linhas)

    def espacos(L):
        c = titulo('As notas nos espaços', 'fá · lá · dó · mi', 440)
        c += '<div class="box" style="padding:10px 10px 0">' + staff([('F4', 'sm'), ('A4', 'sm'), ('C5', 'sm'), ('E5', 'sm')], width=640, gap=14, labels='syl', show_final=False) + '</div>'
        c += box('<b>Para decorar, de baixo para cima:</b> <span class="m" style="font-size:18px">FÁ · LÁ · DÓ · MI</span><br><span style="font-size:13px">falando bem rápido: “<b>fá-lá-dó-mi</b>” parece “fala, dormi!”</span><div class="dots"></div>', style='margin:10px 0')
        c += lab('qual é a nota? escreva o nome')
        alvo = ['A4', 'C5', 'F4', 'E5', 'F4', 'C5', 'E5', 'A4']
        c += '<div class="col4" style="gap:8px">'
        for n in alvo:
            c += f'<div class="box center" style="padding:4px;border-radius:12px">{staff([(n, "sm")], width=140, gap=11, show_final=False)}<div class="dots" style="width:90px;margin:2px auto"></div></div>'
        c += '</div>'
        c += lab('linha ou espaço? marque')
        mix = ['E4', 'F4', 'G4', 'A4', 'B4', 'C5']
        c += '<div class="col3" style="gap:8px">' + ''.join(f'<div class="box center" style="padding:3px;border-radius:12px">{staff([(n, "sm")], width=130, gap=10, show_final=False)}<div style="font-size:12px"><span class="ck"></span> linha &nbsp; <span class="ck"></span> espaço</div></div>' for n in mix) + '</div>'
        L.gab('m3-espacos', 'as notas nos espaços (pág. {pg})', ' · '.join(sig(n) for n in alvo) + '. linha ou espaço: linha · espaço · linha · espaço · linha · espaço.')
        return c + corner('feliz', 56)
    L.add('m3-espacos', 'aula 3 · espaços', espacos)

    def escada(L):
        c = titulo('A escada das notas', 'de dó a dó na pauta', 400)
        c += fala('com a <b>linha de baixo</b> (o dó central tem uma linhazinha só dele!) a gente sobe a escada: dó ré mi fá sol lá si dó.', 'musica')
        nm = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
        c += '<div class="box" style="padding:10px 10px 0">' + staff([(n, 'sm') for n in nm], width=640, gap=14, labels='syl', show_final=False) + '</div>'
        c += '<div class="box" style="padding:10px 10px 0;margin-top:8px">' + staff([(n, 'sm') for n in nm], width=640, gap=14, labels='let', show_final=False) + '</div>'
        c += box('<b>Repare:</b> para <b>cima</b> na pauta = som mais <b>agudo</b>. para baixo = mais <b>grave</b>. o dó central fica <b>abaixo</b> da pauta, com uma linha curtinha chamada <b>linha suplementar</b>.', style='margin:10px 0;font-size:13px')
        c += lab('desce a escada: escreva as notas de volta')
        c += '<div class="row" style="justify-content:space-between">' + ''.join(f'<div class="box" style="width:68px;height:44px;border-radius:10px"></div>' for _ in range(8)) + '</div>'
        c += lab('circule só as notas que ficam NAS LINHAS')
        c += '<div class="box" style="padding:10px 10px 0">' + staff([(n, 'sm') for n in nm], width=640, gap=14, show_final=False) + '</div>'
        L.gab('m3-escada', 'a escada das notas (pág. {pg})', 'descendo: dó si lá sol fá mi ré dó. nas linhas: mi · sol · si (e o dó central na linha suplementar).')
        return c + corner('musica', 56)
    L.add('m3-escada', 'aula 3 · a escada', escada)

    def leia(L):
        c = titulo('Leia e escreva as notas', 'a prova dos nove da pauta', 460)
        rnd = random.Random(14)
        faixa = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
        resp = []
        for r in range(5):
            seq = [rnd.choice(faixa) for _ in range(6)]
            resp.append(' '.join(sig(n) for n in seq))
            c += f'<div class="box" style="padding:6px 10px 6px;margin-bottom:7px;border-radius:14px"><div class="row"><span class="num" style="margin-right:6px">{r+1}</span><div style="flex:1">{staff([(n, "sm") for n in seq], width=600, gap=11, show_final=True)}</div></div><div class="row" style="gap:8px;margin-top:2px">' + ''.join('<div class="dots" style="flex:1"></div>' for _ in range(6)) + '</div></div>'
        c += tip('conte as linhas de <b>baixo para cima</b> e use as frases do Paul: <b>mi-sol-si-ré-fá</b> nas linhas e <b>fá-lá-dó-mi</b> nos espaços.')
        L.gab('m3-leia', 'leia e escreva as notas (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)) + '.')
        return c + corner('ouve', 56)
    L.add('m3-leia', 'aula 3 · leia', leia)

    def desenhe(L):
        c = titulo('Desenhe as notas', 'leia o nome e desenhe a nota na pauta', 480)
        rows = [['mi', 'sol', 'si', 'ré', 'fá'], ['fá', 'lá', 'dó', 'mi'], ['dó', 'ré', 'mi', 'fá', 'sol'], ['sol', 'lá', 'si', 'dó'], ['si', 'sol', 'mi', 'ré'], ['lá', 'fá', 'ré', 'dó']]
        POS = {'dó': 'abaixo da 1ª linha, na linhazinha suplementar', 'ré': 'abaixo da 1ª linha', 'mi': '1ª linha', 'fá': '1º espaço', 'sol': '2ª linha', 'lá': '2º espaço', 'si': '3ª linha'}
        ans = []
        for i, r in enumerate(rows):
            c += f'<div class="box" style="padding:5px 10px 5px;margin-bottom:8px;border-radius:14px"><div class="row" style="gap:8px"><span class="num">{i+1}</span><b style="font-size:14px">desenhe:</b>' + ''.join(f'<span class="pill" style="font-size:13px">{n}</span>' for n in r) + '</div>' + staff([], width=620, gap=12, show_final=True) + '</div>'
            ans.append(f'{i+1}: ' + ', '.join(f'{n} = {POS[n]}' for n in r))
        L.gab('m3-desenhe', 'desenhe as notas (pág. {pg})', 'posições: dó = linha suplementar abaixo da pauta · ré = espaço abaixo da 1ª linha · mi = 1ª linha · fá = 1º espaço · sol = 2ª linha · lá = 2º espaço · si = 3ª linha · dó (agudo) = 3º espaço.')
        return c + corner('timido', 56)
    L.add('m3-desenhe', 'aula 3 · desenhe', desenhe)

    def tecl(L):
        c = titulo('Da pauta para o teclado', 'ligue cada nota à tecla dela', 440)
        c += '<p style="font-size:12.8px">Cada pauta mostra uma nota. Ligue-a à tecla <b>pintada</b> correta. (O dó está marcado com um pontinho no teclado.)</p>'
        notas = ['E4', 'C5', 'G4', 'B4', 'F4', 'A4']
        keys = ['G4', 'E4', 'C5', 'F4', 'B4', 'A4']
        for i in range(6):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:9px"><div class="box" style="flex:0 0 36%;padding:4px 6px;border-radius:14px">{staff([(notas[i], "sm")], width=190, gap=11, show_final=False)}</div>'
                  f'<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div><div style="width:15px;height:15px;border-radius:50%;background:#111;margin-right:10px"></div>'
                  f'<div class="box center" style="flex:0 0 46%;padding:6px;border-radius:14px">{keyboard("C4", "C5", marks={midi(keys[i]): ""}, W=30, H=60, dot_c=True)}</div></div>')
        pos = {k: j + 1 for j, k in enumerate(keys)}
        L.gab('m3-teclado', 'da pauta para o teclado (pág. {pg})', ' · '.join(f'{sig(n)} → teclado {pos[n]}' for n in notas) + ' (numerando os teclados de cima para baixo na coluna da direita).')
        return c + corner('vibra', 56)
    L.add('m3-teclado', 'aula 3 · pauta e teclado', tecl)

    def arte2(L):
        return f'<section class="page full"><img src="img/color2.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>{FOOT}</span><span>{L.pg("color2")}</span></div></section>'
    L.add('color2', 'para colorir', arte2, 'raw')
