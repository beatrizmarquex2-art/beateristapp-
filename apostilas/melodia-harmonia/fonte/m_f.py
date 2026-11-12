# -*- coding: utf-8 -*-
from mcommon import *
from m_d import card_acorde
from jogos import make_search, make_cross
from pages_e import search_html
import random, segno

NOTAS11 = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5']
CIF = {'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'A': 'A', 'B': 'B'}

def build(L):
    # ===== caça-palavras =====
    def caca(pid, tt, sub, words, seed, nome='pensa'):
        def f(L):
            g, sol = make_search(words, 14, seed)
            c = titulo(tt, sub, 460)
            c += '<div class="center" style="margin:6px 0 10px">' + search_html(g, 38) + '</div>'
            c += lab('palavras para achar:')
            c += '<div class="col4" style="gap:8px 12px;font-weight:700;font-size:13px">' + ''.join(f'<div><span class="ck"></span> {w}</div>' for w in sorted(words)) + '</div>'
            c += '<p class="cap" style="margin-top:10px">as palavras podem estar na horizontal, na vertical, na diagonal ou de trás para frente (sem acentos).</p>'
            allsol = set()
            for w, cells in sol.items(): allsol |= set(cells)
            L.gab(pid, tt + ' (pág. {pg})', 'GRID', kind='grid')
            L.gridsol = getattr(L, 'gridsol', {}); L.gridsol[pid] = (g, allsol)
            return c + corner(nome, 60)
        L.add(pid, 'jogos · caça-palavras', f)
    caca('j-caca1', 'Caça-palavras: a música', 'ache as 12 palavras das aulas 1 a 4', ['TECLADO', 'VIOLAO', 'ACORDE', 'MELODIA', 'HARMONIA', 'ESCALA', 'SEMITOM', 'PAUTA', 'CLAVE', 'OITAVA', 'CIFRA', 'SUSTENIDO'], 3)
    caca('j-caca2', 'Caça-palavras: o violão', 'encontre as partes e os termos do violão', ['CORDAS', 'TRASTE', 'BRACO', 'CABECA', 'TARRAXA', 'CAVALETE', 'PALHETA', 'TABLATURA', 'PESTANA', 'AFINADOR', 'CASAS', 'BOCA'], 5, 'feliz')
    caca('j-caca3', 'Caça-palavras: harmonia', 'tríades, famílias e canções', ['PIANO', 'PEDAL', 'TRIADE', 'MAIOR', 'MENOR', 'SETIMA', 'FAMILIA', 'CANCAO', 'BATIDA', 'REFRAO', 'ESTROFE', 'BEMOL'], 9, 'oculos')

    def cruz(pid, tt, sub, entries, seed):
        def f(L):
            norm, pl, starts, H, W = make_cross(entries, seed=seed)
            cell = 36 if W <= 12 else 32
            c = titulo(tt, sub, 460)
            c += '<div class="row" style="gap:18px;align-items:flex-start">'
            t = '<table style="border-collapse:collapse;flex:none">'
            for r in range(H):
                t += '<tr>'
                for cc in range(W):
                    if (r, cc) in norm:
                        n = starts.get((r, cc))
                        t += f'<td style="width:{cell}px;height:{cell}px;border:2px solid #111;background:#fff;vertical-align:top;font-size:9.5px;font-weight:700;padding:1px 2px">{n if n else ""}</td>'
                    else:
                        t += f'<td style="width:{cell}px;height:{cell}px;border:none"></td>'
                t += '</tr>'
            t += '</table>'
            hor = sorted([(starts[(p[2], p[3])], p[1], len(p[0])) for p in pl if p[4] == 'h'])
            ver = sorted([(starts[(p[2], p[3])], p[1], len(p[0])) for p in pl if p[4] == 'v'])
            dc = '<div style="flex:1;min-width:0"><div class="m" style="font-size:14px;margin-bottom:3px">HORIZONTAIS</div>' + ''.join(f'<div style="font-size:11.5px;margin-bottom:3px"><b>{n}.</b> {cl} <span class="gray">({l})</span></div>' for n, cl, l in hor)
            dc += '<div class="m" style="font-size:14px;margin:10px 0 3px">VERTICAIS</div>' + ''.join(f'<div style="font-size:11.5px;margin-bottom:3px"><b>{n}.</b> {cl} <span class="gray">({l})</span></div>' for n, cl, l in ver) + '</div>'
            c += t + dc + '</div><p class="cap" style="margin-top:12px">o número entre parênteses é a quantidade de letras (sem acentos).</p>'
            gh = '<table style="border-collapse:collapse">'
            for r in range(H):
                gh += '<tr>'
                for cc in range(W):
                    gh += (f'<td style="width:17px;height:17px;border:1.2px solid #111;text-align:center;font-size:10.5px;font-weight:800">{norm[(r,cc)]}</td>' if (r, cc) in norm else '<td style="width:17px;height:17px"></td>')
                gh += '</tr>'
            L.gab(pid, tt + ' (pág. {pg})', gh + '</table>', kind='html')
            return c + corner('pensa', 60)
        L.add(pid, 'jogos · cruzadinha', f)
    cruz('j-cruz1', 'Cruzadinha musical', 'use as dicas e preencha', [('TECLADO', 'instrumento de teclas brancas e pretas'), ('ACORDE', 'notas tocadas juntas'), ('MELODIA', 'a parte que a gente canta'), ('ESCALA', 'a escadinha de notas'), ('SEMITOM', 'a menor distância entre duas notas'), ('PAUTA', 'as 5 linhas da música'), ('CLAVE', 'o desenho do começo da pauta'), ('OITAVA', 'espaço de 8 notas, de um dó ao próximo'), ('CIFRA', 'as notas escritas em letras'), ('HARMONIA', 'os acordes que acompanham')], 1)
    cruz('j-cruz2', 'Cruzadinha do violão', 'responda às dicas sobre o violão', [('VIOLAO', 'instrumento com 6 cordas e uma boca'), ('TRASTE', 'barrinha de metal no braço'), ('CORDAS', 'são 6 no violão'), ('CAVALETE', 'onde as cordas ficam presas'), ('TARRAXA', 'gira para afinar'), ('PALHETA', 'objeto usado para tocar as cordas'), ('PESTANA', 'o dedo deitado sobre várias cordas'), ('AFINADOR', 'aparelho que ajuda a afinar'), ('TABLATURA', 'a partitura do violão em 6 linhas')], 4)
    cruz('j-cruz3', 'Cruzadinha da harmonia', 'tríades, famílias e canções', [('TRIADE', 'acorde de 3 notas'), ('MAIOR', 'soa alegre'), ('MENOR', 'soa mais triste'), ('SETIMA', 'nota extra do acorde com 7'), ('FAMILIA', 'acordes que combinam entre si'), ('BATIDA', 'jeito de tocar com a mão direita'), ('CANCAO', 'música com letra'), ('REFRAO', 'a parte que se repete'), ('BEMOL', 'símbolo que desce um semitom')], 7)

    # ===== cifras secretas =====
    def secreto(L):
        c = titulo('A mensagem secreta das notas', 'leia a pauta, anote a cifra e descubra', 560)
        c += fala('cada nota na pauta é uma <b>letra</b> (a cifra). leia as notas e escreva as letras embaixo: palavras escondidas! as letras só vão de <b>A a G</b>.', 'oculos', 'r')
        c += lab('chave: nota → cifra', True)
        c += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">' + ''.join(f'<div class="box center" style="padding:4px 2px;border-radius:10px">{staff([(n, "sm")], width=70, gap=7, clef=False, show_final=False)}<div class="cf" style="font-size:19px">{n[0]}</div></div>' for n in ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']) + '</div>'
        words = ['CAFE', 'CABECA', 'FACADA']
        pos = {'C': 'C4', 'D': 'D4', 'E': 'E4', 'F': 'F4', 'G': 'G4', 'A': 'A4', 'B': 'B4'}
        for k, w in enumerate(words):
            c += f'<div class="box" style="padding:6px 10px;margin-top:8px;border-radius:14px"><span class="num">{k+1}</span>' + staff([(pos[ch], 'sm') for ch in w], width=560, gap=11, clef=True, show_final=True) + '<div class="row" style="gap:6px">' + ''.join('<div class="dots" style="flex:1;height:22px"></div>' for _ in w) + '</div></div>'
        c += lab('agora crie a sua: escreva uma palavra com letras A a G e desenhe as notas')
        c += '<div class="box" style="padding:4px 10px">' + staff([], width=560, gap=11) + '</div>'
        L.gab('j-secreto', 'a mensagem secreta das notas (pág. {pg})', 'CAFE · CABECA · FACADA.')
        return c + corner('oculos', 56)
    L.add('j-secreto', 'jogos · mensagem secreta', secreto)

    # ===== palavras musicais: complete as frases =====
    def frases(L):
        c = titulo('Complete as frases', 'use as palavras do quadro', 460)
        pal = ['semitom', 'acorde', 'melodia', 'clave', 'oitava', 'tríade', 'pestana', 'cifra', 'pauta', 'escala']
        c += '<div class="box" style="padding:8px 14px;border-radius:16px"><div class="m" style="font-size:14px;margin-bottom:4px">QUADRO DE PALAVRAS</div><div class="row" style="flex-wrap:wrap;gap:6px 14px;font-weight:800;font-size:13.5px">' + ''.join(f'<span class="pill">{p}</span>' for p in pal) + '</div></div>'
        fr = [('A menor distância entre duas notas é o ____________.', 'semitom'), ('Um conjunto de notas tocadas juntas é um ____________.', 'acorde'), ('A parte da música que a gente canta é a ____________.', 'melodia'), ('A ____________ de sol fica no começo da pauta.', 'clave'), ('Do dó ao próximo dó existe uma ____________.', 'oitava'), ('Um acorde de 3 notas se chama ____________.', 'tríade'), ('O dedo deitado sobre várias cordas faz a ____________.', 'pestana'), ('As notas escritas em letras formam a ____________.', 'cifra'), ('As 5 linhas onde a música é escrita são a ____________.', 'pauta'), ('Dó ré mi fá sol lá si dó é uma ____________.', 'escala')]
        for i, (t, a) in enumerate(fr):
            c += f'<div class="row" style="gap:8px;margin-top:9px;font-size:13.5px"><span class="num" style="width:24px">{i+1}.</span><span>{t}</span></div>'
        c += lab('bônus: invente uma frase com 3 palavras do quadro') + '<div class="dots"></div><div class="dots"></div>'
        L.gab('j-frases', 'complete as frases (pág. {pg})', ' · '.join(f'{i+1}: {a}' for i, (_, a) in enumerate(fr)) + '.')
        return c + corner('feliz', 56)
    L.add('j-frases', 'jogos · frases', frases)

    # ===== prova =====
    Q1 = [('Quantas notas diferentes a música tem antes de repetir (dó ré mi...)?', ['5', '7', '12'], 1), ('Qual tecla branca fica à esquerda do grupo de 2 pretas?', ['dó', 'fá', 'lá'], 0), ('Em cifra, o sol é a letra:', ['G', 'C', 'A'], 0), ('Entre mi e fá a distância é de:', ['um tom', 'um semitom', 'dois tons'], 1), ('A pauta tem:', ['4 linhas e 5 espaços', '5 linhas e 4 espaços', '6 linhas'], 1),
          ('A 1ª corda do violão é a:', ['mais grossa', 'mais fina', 'do meio'], 1), ('Na tablatura o número indica:', ['o dedo', 'a casa', 'a corda'], 1), ('No diagrama, a bolinha vazia (○) significa:', ['corda solta', 'não tocar', 'dedo 1'], 0), ('O ✕ no diagrama quer dizer:', ['tocar forte', 'não tocar a corda', 'repetir'], 1), ('O acorde Am é:', ['lá maior', 'lá menor', 'lá com 7'], 1)]
    Q2 = [('Num acorde de teclado, as notas são:', ['1ª, 2ª e 3ª', '1ª, 3ª e 5ª', '1ª, 4ª e 6ª'], 1), ('C maior tem as notas:', ['dó mi sol', 'dó ré mi', 'dó fá sol'], 0), ('A receita do acorde maior é:', ['4 + 3 semitons', '3 + 4 semitons', '2 + 2 semitons'], 0), ('O sustenido (♯):', ['desce um semitom', 'sobe um semitom', 'não muda'], 1), ('Os 3 acordes principais de dó maior são:', ['C, F e G', 'C, Dm e Em', 'Am, Dm e Em'], 0), ('Na batida do violão, o ↑ cai:', ['nos números', 'no “e”', 'só no 1'], 1), ('A harmonia é feita de:', ['palmas', 'acordes', 'pausas'], 1), ('A melodia é feita de:', ['notas em sequência no ritmo', 'só pausas', 'só acordes'], 0)]
    def provaq(qs, start):
        h = ''
        for i, (q, opts, ok) in enumerate(qs):
            h += f'<div class="box" style="padding:5px 14px;margin-bottom:6px;border-radius:14px"><div style="font-size:13px;font-weight:800"><span class="num">{start+i}.</span> {q}</div><div class="row" style="gap:16px;margin-top:3px;flex-wrap:wrap">' + ''.join(f'<span style="font-size:12.5px"><span class="ck r"></span> {"ABC"[j]}) {o}</span>' for j, o in enumerate(opts)) + '</div></div>'
        return h
    def prova1(L):
        c = titulo('A prova do Paul (1)', 'marque a resposta certa: 10 perguntas', 460)
        c += '<p style="font-size:12.8px">Leia com calma e <b>circule</b> a resposta certa. Pode consultar o livro! No final você descobre o seu título.</p>'
        c += provaq(Q1, 1)
        c += box('<div class="row" style="gap:20px"><b>nome:</b><div class="dots" style="flex:1"></div><b>data:</b><div class="dots" style="width:120px"></div></div>', style='margin-top:6px')
        L.gab('j-prova1', 'a prova do Paul (pág. {pg})', ' · '.join(f'{i+1}: {"ABC"[ok]}' for i, (_, _, ok) in enumerate(Q1)) + ' · ' + ' · '.join(f'{10+i+1}: {"ABC"[ok]}' for i, (_, _, ok) in enumerate(Q2)) + ' · 19: B (G) · 20: A (Am).')
        return c + corner('pensa', 56)
    L.add('j-prova1', 'jogos · a prova do Paul', prova1)
    def prova2(L):
        c = titulo('A prova do Paul (2)', 'agora com desenhos', 460)
        c += provaq(Q2, 11)
        vis = [(19, 'Que acorde é este?', acorde_s('G'), ['C', 'G', 'D'], ''), (20, 'Que acorde de teclado é este?', chord_kb('Am', W=14, H=50, lo='C4', hi='G5'), ['Am', 'C', 'Dm'], '')]
        for n, q, g, opts, _ in vis:
            c += f'<div class="box row" style="padding:3px 14px;margin-bottom:6px;border-radius:14px;gap:14px"><div style="width:110px;flex:none">{g}</div><div style="flex:1"><div style="font-size:13px;font-weight:800"><span class="num">{n}.</span> {q}</div><div class="row" style="gap:14px;margin-top:3px">' + ''.join(f'<span style="font-size:12.5px"><span class="ck r"></span> {"ABC"[j]}) {o}</span>' for j, o in enumerate(opts)) + '</div></div></div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:6px">QUAL É O SEU TÍTULO? conte seus acertos:</div><div class="col2" style="font-size:13px;gap:3px 16px"><div><b>18 a 20:</b> Músico Mestre ★★★</div><div><b>13 a 17:</b> Músico de Ouro ★★</div><div><b>8 a 12:</b> Músico Aprendiz ★</div><div><b>0 a 7:</b> releia as aulas e tente de novo!</div></div><div class="row" style="gap:10px;margin-top:8px"><b>meus acertos:</b><div class="dots" style="width:70px"></div><b>meu título:</b><div class="dots" style="flex:1"></div></div>', style='margin-top:4px')
        return c + corner('vibra', 56)
    L.add('j-prova2', 'jogos · a prova do Paul', prova2)

    # ================= RECORTES =================
    def cut(inner, h=126, extra=''):
        return f'<div class="cut" style="height:{h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:5px;{extra}">{inner}</div>'
    def scis(): return '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div>'

    def notas_cartas(L):
        c = titulo('Cartas das notas', 'jogo da memória: nota na pauta × nome da nota', 480)
        c += scis() + '<div class="col3" style="gap:8px">'
        for n in ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']:
            c += cut(staff([(n, 'sm')], width=150, gap=11, show_final=False), 118)
        for n in ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']:
            c += cut(f'<div class="m" style="font-size:24px">{SYL[n[0]].upper()}</div><div class="cf" style="font-size:30px">{n[0]}</div>', 118)
        c += cut(paul('musica', 84), 118) + cut(paul('vibra', 84), 118)
        c += '</div>' + box('<b>Como jogar:</b> vire todas as cartas para baixo. Cada jogador vira 2 cartas: se a <b>nota na pauta</b> combinar com o <b>nome</b>, fica com o par! Quem tiver mais pares vence. <b>Sozinho:</b> cronometre e tente bater o seu recorde.', style='margin-top:10px;font-size:12.8px')
        return c
    L.add('r-notas', 'recortes · cartas das notas', notas_cartas)

    def acordes1(L):
        c = titulo('Cartas de acordes: violão', 'recorte e use no jogo da memória', 480)
        c += scis() + '<div class="col3" style="gap:8px">'
        for n in ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em', 'G7', 'C7', 'D7', 'E7', 'A7']:
            c += cut(f'<div class="cf" style="font-size:19px;line-height:1">{n}</div>{acorde_s(n, 82)}', 138)
        c += cut(paul('amor', 84), 138)
        c += '</div>' + box('<b>Memória dos acordes:</b> as <b>9 primeiras cartas</b> (C D E F G A Am Dm Em) formam pares com as cartas de <b>teclado</b> da próxima página. Ache o <b>mesmo acorde</b> nos dois instrumentos!', style='margin-top:10px;font-size:12.8px')
        return c
    L.add('r-acordes1', 'recortes · acordes de violão', acordes1)

    def acordes2(L):
        c = titulo('Cartas de acordes: teclado', 'o par das cartas de violão', 460)
        c += scis() + '<div class="col3" style="gap:8px">'
        for n in ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em', 'B', 'Cm', 'Fm', 'Gm', 'Bm']:
            lo, hi = 'C4', 'G5'
            c += cut(f'<div class="cf" style="font-size:19px;line-height:1">{n}</div>{chord_kb(n, W=12, H=50, lo=lo, hi=hi)}<div style="font-size:9.5px;font-weight:700">{CHORD_KB[n][1]}</div>', 138)
        c += cut(paul('oculos', 84), 138)
        c += '</div>' + box('<b>Como jogar:</b> espalhe as cartas de violão e de teclado viradas para baixo. Vire 2: se forem do <b>mesmo acorde</b> (um de cada instrumento), você fica com o par! Valem 9 pares (C D E F G A Am Dm Em).', style='margin-top:10px;font-size:12.8px')
        return c
    L.add('r-acordes2', 'recortes · acordes de teclado', acordes2)

    def bingo1(L):
        c = titulo('Bingo das notas na pauta', 'recorte as fichas na próxima página e sorteie', 540)
        rnd = random.Random(41); cards = []
        while len(cards) < 4:
            s = rnd.sample(range(11), 9)
            if tuple(sorted(s)) not in [tuple(sorted(x)) for x in cards]: cards.append(s)
        c += '<div class="col2" style="gap:14px">'
        for i, s in enumerate(cards):
            c += f'<div class="box" style="padding:8px;border-radius:18px"><div class="m" style="font-size:14px;text-align:center;margin-bottom:6px">CARTELA {i+1}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">' + ''.join(f'<div style="border:2px solid #111;border-radius:10px;height:108px;display:flex;align-items:center;justify-content:center;overflow:hidden">{staff([(NOTAS11[k], "sm")], width=130, gap=10, show_final=False)}</div>' for k in s) + '</div></div>'
        c += '</div>' + box('<b>Como jogar:</b> cada jogador escolhe uma cartela. Um sorteia uma ficha e diz o <b>nome da nota</b> (e a cifra!). Quem tiver essa nota na cartela <b>cobre com um botão</b>. Vence quem completar uma linha, uma coluna ou a cartela toda e gritar <b>BINGO!</b>', style='margin-top:12px;font-size:12.8px')
        return c
    L.add('r-bingo1', 'recortes · bingo', bingo1)

    def bingo2(L):
        c = titulo('Fichas do bingo', 'recorte e coloque num saquinho', 380)
        c += scis() + '<div class="col4" style="gap:8px">'
        for n in NOTAS11:
            c += cut(f'<div class="m" style="font-size:19px">{SYL[n[0]].upper()}</div><div class="cf" style="font-size:22px">{n[0]}</div><div style="font-size:10px">{"mais grave" if n[-1]=="4" else "mais aguda"}</div>', 100)
        c += cut(paul('vibra', 64), 100)
        c += '</div>' + lab('variações do jogo')
        c += '<div class="col2" style="gap:10px;font-size:12.8px">' + box('<b>Bingo das cifras:</b> quem sorteia só fala a <b>letra</b> (C, D, E…) e os jogadores acham a nota.') + box('<b>Bingo dos acordes:</b> sorteie o nome de um acorde e peça que o jogador toque no instrumento antes de cobrir!') + '</div>'
        return c + corner('vibra', 70)
    L.add('r-bingo2', 'recortes · bingo', bingo2)

    def domino(L):
        c = titulo('Dominó das notas e dos acordes', 'recorte, embaralhe e feche o círculo', 560)
        c += scis()
        notas = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4']
        ac = ['C', 'G', 'Am', 'F', 'Dm', 'Em', 'D']
        pcs = []
        for k in range(7):
            pcs.append((staff([(notas[k], 'sm')], width=96, gap=9, show_final=False), f'<div class="m" style="font-size:19px">{SYL[notas[(k+1)%7][0]].upper()}</div>'))
        for k in range(7):
            pcs.append((acorde_s(ac[k], 56), f'<div class="cf" style="font-size:24px">{ac[(k+1)%7]}</div>'))
        random.Random(3).shuffle(pcs)
        c += '<div class="col2" style="gap:8px 12px">'
        for a, b in pcs:
            c += f'<div class="cut" style="display:flex;height:84px"><div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden">{a}</div><div style="width:2px;background:#888;margin:6px 0"></div><div style="flex:1;display:flex;align-items:center;justify-content:center">{b}</div></div>'
        c += '</div>' + box('<b>Como jogar:</b> cada peça tem uma <b>nota na pauta</b> (ou um <b>diagrama de acorde</b>) de um lado e um <b>nome</b> do outro. Encaixe o nome com o desenho seguinte até <b>fechar o círculo</b>. Duas rodadas: uma só com notas e outra só com acordes.', style='margin-top:10px;font-size:12.5px')
        return c
    L.add('r-domino', 'jogos de mesa · dominó', domino)

    def trilha(L):
        c = titulo('A trilha do Músico', 'chegue ao 30 dizendo o nome de cada nota e de cada acorde!', 660)
        rnd = random.Random(8)
        items = []
        for k in NOTAS11: items.append(('n', k))
        for n in ['C', 'G', 'Am', 'F', 'D', 'Em', 'E', 'Dm', 'A']: items.append(('a', n))
        rnd.shuffle(items); items = items * 2
        star = {5, 13, 22, 27}; sleep = {9, 16, 24}; again = {11, 19}
        cell = {}; j = 0
        for n in range(1, 31):
            if n == 1: cell[n] = ('<div class="m" style="font-size:17px">SAÍDA</div>' + paul('vibra', 54), 's')
            elif n == 30: cell[n] = ('<div class="m" style="font-size:15px">CHEGADA</div>' + paul('coracao', 54), 's')
            elif n in star: cell[n] = ('<div style="font-size:30px;line-height:1">★</div><div style="font-size:10px;font-weight:800;line-height:1.1">avance 2 casas</div>', 'x')
            elif n in sleep: cell[n] = ('<div style="font-size:26px;line-height:1">𝄽</div><div style="font-size:10px;font-weight:800;line-height:1.1">é uma pausa!<br>fique 1 rodada</div>', 'x')
            elif n in again: cell[n] = ('<div style="font-size:26px;line-height:1">♫</div><div style="font-size:10px;font-weight:800;line-height:1.1">jogue de novo</div>', 'x')
            else:
                k, v = items[j]; j += 1
                cell[n] = (staff([(v, 'sm')], width=96, gap=9, show_final=False) if k == 'n' else acorde_s(v, 52), 'y')
        grid = [[None] * 6 for _ in range(5)]
        for n in range(1, 31):
            rr = (n - 1) // 6; cc = (n - 1) % 6
            if rr % 2 == 1: cc = 5 - cc
            grid[4 - rr][cc] = n
        t = '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">'
        for r in range(5):
            for cc in range(6):
                n = grid[r][cc]; ct, kd = cell[n]
                bd = '3px solid #111' if kd == 's' else '2px solid #111'
                t += f'<div style="border:{bd};border-radius:14px;height:114px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;overflow:hidden"><span class="num" style="position:absolute;left:7px;top:3px;font-size:13px">{n}</span>{ct}</div>'
        c += t + '</div><div class="row" style="gap:14px;margin-top:8px;font-size:11.5px"><span><b>★</b> avance 2</span><span><b>pausa</b>: 1 rodada sem jogar</span><span><b>♫</b> jogue de novo</span><span>nota ou acorde: diga o <b>nome</b></span></div>'
        return c
    L.add('r-trilha', 'jogos de mesa · trilha', trilha)

    def trilha2(L):
        c = titulo('Trilha: regras, dados e peões', 'tudo para jogar com a família', 520)
        c += '<div class="col2" style="gap:12px;align-items:start"><div>' + box('<div class="m" style="font-size:14px;margin-bottom:5px">COMO JOGAR (2 a 4 jogadores)</div><ol style="padding-left:18px;font-size:12.3px;line-height:1.45"><li>Cada um escolhe um peão e põe na <b>SAÍDA</b>.</li><li>Na sua vez, jogue o <b>dado</b> e ande o número de casas.</li><li>Caiu numa <b>nota</b>? Diga o <b>nome</b> e a <b>cifra</b> (ex.: “sol, G”). Caiu num <b>acorde</b>? Diga o nome e se é <b>maior ou menor</b>. Acertou: fica. Errou: volta 1 casa.</li><li>Caiu na <b>★</b>: avance 2 casas.</li><li>Caiu na <b>pausa</b>: 1 rodada sem jogar (o silêncio também é música!).</li><li>Caiu no <b>♫</b>: jogue de novo.</li><li>Vence quem chegar primeiro ao <b>30</b>.</li></ol>', style='padding:10px 14px') + '</div><div>' + box('<div class="m" style="font-size:14px;margin-bottom:5px">DICAS DO PAUL</div><div style="font-size:12.3px;line-height:1.45">• Use as <b>cartas</b> para conferir as respostas.<br>• Para um jogo mais difícil, toque o acorde no instrumento antes de dizer o nome.<br>• Sozinho? Jogue contra o relógio!</div>', style='padding:10px 14px') + '<div class="center" style="margin-top:8px">' + paul('feliz', 90) + '</div></div></div>'
        c += lab('o dado: recorte, dobre nas linhas pontilhadas e cole as abas')
        face = lambda n: f'<div class="cut" style="width:100px;height:100px;display:flex;align-items:center;justify-content:center;font-family:Marker;font-size:50px">{n}</div>'
        blank = '<div style="width:100px;height:100px"></div>'
        c += '<div style="display:grid;grid-template-columns:repeat(4,100px);justify-content:center">' + blank + face(1) + blank + blank + face(2) + face(3) + face(4) + face(5) + blank + face(6) + blank + blank + '</div>'
        c += lab('os peões: recorte, dobre a base e cole')
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<div class="cut" style="width:100px;padding:6px;text-align:center">{paul(p, 70)}<div style="border-top:2px dashed #888;margin-top:4px;font-size:9px;color:#777">dobre aqui</div><div style="height:14px"></div></div>' for p in ['feliz', 'oculos', 'musica', 'vibra']) + '</div>'
        return c
    L.add('r-trilha2', 'jogos de mesa · trilha', trilha2)

    def dados(L):
        c = titulo('Os dados da música', 'recorte, monte e jogue para criar melodias e músicas', 560)
        def net(faces, nome, sub):
            def fc(x): return f'<div class="cut" style="width:84px;height:84px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Marker;font-size:{x[1]}px">{x[0]}</div>'
            blank = '<div style="width:84px;height:84px"></div>'
            return (f'<div class="box" style="padding:8px 10px;border-radius:16px"><div class="m" style="font-size:14px;text-align:center">{nome}</div><div style="font-size:11.5px;text-align:center;margin-bottom:4px">{sub}</div><div style="display:grid;grid-template-columns:repeat(4,84px);justify-content:center">'
                    + blank + fc(faces[0]) + blank + blank + fc(faces[1]) + fc(faces[2]) + fc(faces[3]) + fc(faces[4]) + blank + fc(faces[5]) + blank + blank + '</div></div>')
        c += net([('DÓ', 34), ('RÉ', 34), ('MI', 34), ('FÁ', 34), ('SOL', 28), ('LÁ', 34)], 'DADO DAS NOTAS', 'sorteia a nota')
        c += '<div style="height:6px"></div>' + net([('C', 44), ('G', 44), ('Am', 40), ('F', 44), ('Em', 40), ('Dm', 40)], 'DADO DOS ACORDES', 'sorteia o acorde')
        c += '<div style="height:6px"></div>' + net([('↓', 46), ('↓↑', 40), ('↓ . ↑', 28), ('↓↓↑', 32), ('↓↑↓↑', 24), ('.↓↑', 36)], 'DADO DA BATIDA', 'sorteia a batida')
        c += box('<b>Como usar:</b> jogue os 3 dados: o das <b>notas</b> (8 vezes, para a melodia), o dos <b>acordes</b> (4 vezes, para a harmonia) e o da <b>batida</b> (1 vez). Pronto: uma música inteira, nascida do acaso! Escreva na página “crie a sua melodia”.', style='margin-top:10px;font-size:12.8px')
        return c
    L.add('r-dados', 'recortes · dados', dados)

    # ================= FINAL =================
    def app(L):
        c = titulo('Ouça e jogue no app!', 'aponte a câmera do celular', 460)
        c += fala('agora é a hora de ouvir cada acorde e cada melodia! o app tem <b>violão</b> e <b>teclado</b> na tela, e você pode ouvir os acordes do livro.', 'musica')
        items = [('Acordes de violão', 'os acordes com diagramas: veja e ouça cada um.', 'https://jogos.beaterista.com.br/#/estudos/acordes/violao'), ('Acordes de teclado', 'as 12 notas e os acordes maiores e menores.', 'https://jogos.beaterista.com.br/#/estudos/acordes/teclado'),
                 ('Aulas do Paul: teclado e violão', 'aulinhas curtas com sons: notas, escala e acordes.', 'https://jogos.beaterista.com.br/#/estudos/aulas'), ('Violão e piano na tela', 'toque os instrumentos direto no celular ou no tablet.', 'https://jogos.beaterista.com.br/#/tocar')]
        for t, d, u in items:
            q = segno.make(u, error='m').svg_inline(scale=4, border=1, dark='#111', light='#fff')
            c += f'<div class="box row" style="gap:18px;padding:12px 18px;margin-bottom:12px;border-radius:20px"><div style="width:112px;flex:none">{q.replace("<svg", "<svg style=\"width:112px;height:112px;display:block\"", 1)}</div><div><div class="m" style="font-size:19px">{t}</div><div style="font-size:13px;margin:3px 0 8px">{d}</div><div class="tiny">{u.replace("https://", "")}</div></div></div>'
        c += '<p class="cap">Sem câmera? Digite o endereço no navegador. O app funciona no celular, no tablet e no computador.</p>'
        return c + corner('ouve', 56)
    L.add('f-app', 'ouça e jogue no app', app)

    def plano(L):
        dias = [('Aula 1: som, notas e teclado', 'm1-som', 'm1-tecl'), ('Aula 1: nomes, cifras e oitavas', 'm1-nomes', 'm1-oit'), ('Aula 2: tons, semitons e escala', 'm2-semi', 'm2-escala'), ('Aula 3: a pauta e as linhas', 'm3-pauta', 'm3-linhas'), ('Aula 3: espaços e leitura', 'm3-espacos', 'm3-teclado'), ('Aula 4: melodia e mão no teclado', 'm4-melodia', 'm4-mini'),
                ('Aula 4: Ode à Alegria', 'm4-estrela', 'm4-odetab'), ('Aula 5: o violão, cordas e tab', 'm5-cordas', 'm5-postura'), ('Aula 6: Em, Am, C e G', 'm6-diagrama', 'm6-cg'), ('Aula 6: acordes e trocas', 'm6-dae', 'm6-troca'), ('Aulas 7 e 8: batidas e acordes de teclado', 'm7-seta', 'm8-mao'), ('Aula 9: canções e prova do Paul', 'm9-campo', 'j-prova2')]
        c = titulo('Meu plano de 12 dias', '10 minutos por dia: marque quando fizer', 540)
        for i, (t, a, b) in enumerate(dias):
            c += (f'<div class="box row" style="gap:14px;padding:5px 16px;margin-bottom:6px;border-radius:14px"><div class="m" style="font-size:19px;width:62px">DIA {i+1}</div><div style="flex:1"><b style="font-size:13.5px">{t}</b><div style="font-size:11.5px;color:#444">págs. {L.pg(a)} a {L.pg(b)}</div></div><div style="font-size:11.5px;text-align:right">fiz! <span class="ck big"></span><br>estrelas: ☆ ☆ ☆</div></div>')
        c += '<div class="m" style="font-size:15px;margin-top:8px">MEU MAIOR APRENDIZADO DA SEMANA:</div>' + dots(2)
        return c + corner('feliz', 50)
    L.add('f-plano12', 'meu plano', plano)

    def trinta(L):
        c = titulo('Desafio dos 30 dias', 'um dia de cada vez: 10 minutos de música', 520)
        c += '<p style="font-size:12.8px">Pinte uma <b>estrela</b> a cada dia que você estudar (mesmo se for só 5 minutinhos!). Nos dias com ✦ você ganha um <b>prêmio</b>: cole uma figurinha do Paul.</p>'
        special = {7: 'semana 1', 15: 'metade!', 21: 'semana 3', 30: 'campeão(ã)!'}
        c += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:7px">'
        for d in range(1, 31):
            sp = special.get(d)
            c += f'<div style="border:2px solid #111;border-radius:14px;height:96px;position:relative;text-align:center;{"background:#f0f0f0;" if sp else ""}"><span class="num" style="position:absolute;left:7px;top:3px">{d}</span><div style="font-size:34px;margin-top:20px;line-height:1">☆</div>' + (f'<div style="font-size:10px;font-weight:800">✦ {sp}</div>' if sp else '<div class="cap">tocou ☐</div>') + '</div>'
        c += '</div>' + box('<b>ideias de estudo para cada dia:</b> tocar um acorde novo · jogar um jogo do livro · treinar uma troca de acordes · ler 3 notas na pauta · tocar uma canção do Paul · criar uma batida · ensinar uma nota para alguém da família.', style='margin-top:10px;font-size:12.5px')
        return c + corner('timido', 56)
    L.add('f-30', 'desafio de 30 dias', trinta)

    def mural(L):
        c = titulo('Meu mural de conquistas', 'pinte as estrelas de cada aula que você terminou', 560)
        itens = ['Aula 1 · as notas', 'Aula 2 · tons e escalas', 'Aula 3 · a pauta', 'Aula 4 · melodia', 'Aula 5 · o violão', 'Aula 6 · acordes de violão', 'Aula 7 · as batidas', 'Aula 8 · acordes de teclado', 'Aula 9 · harmonia', 'Jogos e desafios', 'Prova do Paul', 'Canções do Paul']
        c += '<div class="col3" style="gap:10px">'
        for i, t in enumerate(itens):
            c += f'<div class="box center" style="padding:10px 6px;border-radius:20px;height:132px"><div style="width:52px;height:52px;border:3px solid #111;border-radius:50%;margin:0 auto 4px;line-height:44px;font-family:Marker;font-size:24px">{i+1}</div><div style="font-weight:800;font-size:12px;height:30px">{t}</div><div style="font-size:26px;line-height:1;letter-spacing:4px">☆☆☆</div></div>'
        c += '</div>' + lab('meus títulos') + '<div class="col3" style="gap:10px">' + ''.join(f'<div class="box center" style="padding:10px;border-radius:16px"><span class="ck big"></span><div class="m" style="font-size:13.5px;margin-top:4px">{t}</div></div>' for t in ['Músico Aprendiz', 'Músico de Ouro', 'Músico Mestre']) + '</div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">MINHA CANÇÃO PREFERIDA PARA TOCAR:</div>' + dots(1) + '<div class="m" style="font-size:14px;margin:8px 0 4px">QUEM ASSISTIU À MINHA APRESENTAÇÃO?</div>' + dots(1), style='margin-top:12px')
        return c + corner('coracao', 60)
    L.add('f-mural', 'mural de conquistas', mural)

    def adesivos(L):
        c = titulo('Figurinhas do Paul', 'recorte e cole nas páginas que você terminou', 520)
        c += scis() + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">'
        imgs = ['feliz', 'oculos', 'pensa', 'musica', 'vibra', 'surpreso', 'sono', 'duvida', 'amor', 'timido', 'coracao', 'zzz', 'ouve']
        txt = ['ARRASOU!', 'MAIS UM!', 'ACORDE ✓', 'NOTA 10', 'CAMPEÃO(Ã)', 'AFINADO(A)!', 'MÚSICO(A)']
        for v in imgs:
            c += f'<div class="cut" style="height:122px;border-radius:60px;display:flex;align-items:center;justify-content:center">{paul(v, 78)}</div>'
        for v in txt:
            c += f'<div class="cut" style="height:122px;border-radius:60px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Marker;font-size:17px;padding:10px;line-height:1.1">★<br>{v}<br>★</div>'
        return c + '</div><p class="cap" style="margin-top:8px">dica: imprima em papel adesivo ou use cola em bastão.</p>'
    L.add('f-adesivos', 'figurinhas', adesivos)

    DIC = [('acorde', 'notas tocadas juntas.'), ('afinar', 'ajustar as cordas para soarem nas notas certas.'), ('batida', 'o jeito de tocar as cordas com a mão direita (↓ ↑).'), ('bemol (♭)', 'desce a nota um semitom.'), ('cifra', 'as notas escritas em letras (A a G) e os acordes em cima da letra.'), ('clave de sol', 'o desenho no começo da pauta; marca onde está o sol.'),
           ('casa', 'o espaço entre dois trastes do violão.'), ('escala', 'notas em ordem, como uma escadinha.'), ('harmonia', 'os acordes que acompanham a melodia.'), ('melodia', 'a parte da música que a gente canta.'), ('oitava', 'do dó ao próximo dó: 8 notas.'), ('pauta', '5 linhas e 4 espaços onde a música é escrita.'),
           ('pestana', 'o dedo deitado apertando várias cordas.'), ('semitom', 'a menor distância entre duas notas.'), ('sustenido (♯)', 'sobe a nota um semitom.'), ('tablatura', 'a partitura do violão em 6 linhas.'), ('tríade', 'acorde de 3 notas: 1ª, 3ª e 5ª.'), ('traste', 'a barrinha de metal no braço do violão.')]
    def dic(L):
        c = titulo('O dicionário do Paul', 'as palavras mais importantes do livro', 540)
        c += '<div class="col2" style="gap:8px 12px">' + ''.join(f'<div class="box" style="padding:7px 12px;border-radius:12px"><div class="m" style="font-size:15px;text-transform:uppercase">{w}</div><div style="font-size:12.5px;margin-top:2px">{d}</div></div>' for w, d in DIC) + '</div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">PALAVRAS NOVAS QUE EU APRENDI:</div>' + dots(2), style='margin-top:12px')
        return c + corner('pensa', 56)
    L.add('f-dic', 'dicionário', dic)

    def diploma(L):
        return f'''<section class="page full" style="padding:0">
<div style="position:absolute;inset:8mm;border:4.5px solid #111"></div><div style="position:absolute;inset:11.5mm;border:1.5px solid #111"></div>
<div style="position:absolute;top:30mm;left:0;right:0;display:flex;justify-content:center;gap:30px;align-items:flex-end"><div style="width:44mm">{keyboard('C4','B4',marks={},W=22,H=70,dot_c=False)}</div><div style="width:50mm">{acorde_s('Em', 62)}</div><div style="width:50mm">{staff([('C4','sm'),('E4','sm'),('G4','mi')],width=190,gap=9,show_final=False)}</div></div>
<div style="position:absolute;top:60mm;left:0;right:0;text-align:center;font-family:Gochi;font-size:22px">Beaterista Escola de Música</div>
<div style="position:absolute;top:70mm;left:0;right:0;text-align:center"><div class="m" style="font-size:82px;line-height:1">DIPLOMA</div><div class="m" style="font-size:30px;margin-top:6px">DE MELODIA E HARMONIA</div></div>
<div style="position:absolute;top:114mm;left:0;right:0;text-align:center;font-size:15px">este diploma é concedido a</div>
<div style="position:absolute;top:130mm;left:30mm;right:30mm;border-bottom:2.5px dotted #777;height:2px"></div>
<div style="position:absolute;top:138mm;left:28mm;right:28mm;text-align:center;font-size:15.5px;line-height:1.5">por aprender as <b>notas</b>, a <b>pauta</b>, os <b>acordes do violão e do teclado</b>, as <b>batidas</b> e por <b>tocar músicas de verdade</b></div>
<div style="position:absolute;top:160mm;left:0;right:0;text-align:center"><img src="img/paul_vibra.png" style="height:66mm"></div>
<div style="position:absolute;top:232mm;left:0;right:0;text-align:center;font-size:12.5px"><span class="ck"></span> Aprendiz &nbsp;&nbsp; <span class="ck"></span> de Ouro &nbsp;&nbsp; <span class="ck"></span> Mestre</div>
<div style="position:absolute;bottom:41mm;left:30mm;width:62mm;border-top:1.6px solid #111;text-align:center;font-size:12px;padding-top:3px">assinatura do professor(a)</div>
<div style="position:absolute;bottom:41mm;right:30mm;width:62mm;border-top:1.6px solid #111;text-align:center;font-size:12px;padding-top:3px">data</div>
<div class="m" style="position:absolute;bottom:22mm;left:0;right:0;text-align:center;font-size:15px">beaterista.com.br · TikTok @beaterista</div></section>'''
    L.add('f-diploma', 'diploma', diploma, 'raw')

    # ================= GABARITO =================
    def gabp(i):
        def f(L):
            ents = L.ans
            def entry(pid, tt, content, kind):
                title = tt.format(pg=L.pg(pid))
                if kind == 'grid':
                    g, sol = L.gridsol[pid]; body = search_html(g, 15, sol, small=True); w = 250
                elif kind == 'html':
                    body = content; w = 150 + len(content) * 0.01
                else:
                    body = f'<div style="font-size:11.6px">{content}</div>'; w = 34 + len(content) * 0.285
                return f'<div style="break-inside:avoid;margin-bottom:10px"><div style="font-weight:800;font-size:12.5px;margin-bottom:2px">{title}</div>{body}</div>', w
            items = [entry(*e) for e in ents]
            tot = sum(w for _, w in items); cap = tot / 4 + 40
            pages, cur, acc = [], [], 0
            for h, w in items:
                if acc + w > cap and len(pages) < 3: pages.append(cur); cur = []; acc = 0
                cur.append(h); acc += w
            pages.append(cur)
            pg_ = pages[i] if i < len(pages) else []
            c = titulo(f'Gabarito ({i+1}/4)', 'confira com carinho: o erro também ensina', 560)
            return c + '<div style="column-count:2;column-gap:22px">' + ''.join(pg_) + '</div>'
        return f
    for i in range(4):
        L.add(f'gab{i+1}', 'gabarito', gabp(i), 'std', maxz=1.12)

def acorde_s(n, w=80):
    return acorde(n, w)
