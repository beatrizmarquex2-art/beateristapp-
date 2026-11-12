# -*- coding: utf-8 -*-
from base import *
from pages_a import FIG7, NOMES, VALOR, VALOR_N
from pages_d import VAR, BEAT, beats_spec, one_beat_svg, comp_beats
from pages_e import search_html
import random, segno

BEAT['H'] = ['cop', 'co']
SYM = [(n, False) for n in FIG7] + [(n, True) for n in FIG7]

def sym_name(n, r):
    return ('pausa de ' if r else '') + NOMES[n]

def partitura(rows, pid, titulo_, sub_, secao, hint, mode='beats', corner_='feliz', bpm_hint=''):
    def f(L):
        c = titulo(titulo_, sub_, 460)
        c += f'<p style="font-size:12.8px">{hint}</p><div class="row" style="gap:10px;margin-bottom:6px"><b>andamento:</b><div class="dots" style="width:90px"></div><b>BPM</b><span class="gray" style="margin-left:auto;font-size:11.5px">{bpm_hint}</span></div>'
        for i, r in enumerate(rows):
            if mode == 'beats':
                svg, tot = comp_c(beats_spec(r), width=560, sub=True)
                assert tot == 64, (r, tot)
            else:
                svg = comp_beats(r, 560)
            c += f'<div class="row" style="gap:6px;align-items:flex-start"><span class="num" style="width:26px;margin-top:8px">{i+1}</span><div style="flex:1">{svg}</div><div style="width:112px;text-align:right;font-size:11px;margin-top:10px">palmas<br>{ck(5)}</div></div>'
        return c + corner(corner_, 56)
    return f

def build(L):
    # =================== PARTITURAS ===================
    INI = [list('QQQQ'), list('QQQR'), list('QQRQ'), list('QEQQ'), list('EQEQ'), list('QEEQ'), list('EEQR'), list('EQEE'), list('QQEE'), list('REQQ')]
    INT = [['Q', 'S', 'Q', 'Q'], ['E', 'S', 'E', 'Q'], ['S', 'Q', 'S', 'Q'], ['V2', 'Q', 'V2', 'Q'], ['Q', 'H', 'E', 'Q'], ['S', 'V2', 'S', 'E'], ['V3', 'E', 'V3', 'Q'], ['S', 'S', 'E', 'Q'], ['S', 'S', 'S', 'Q'], ['H', 'E', 'S', 'Q']]
    AVC = [['V5', 'Q', 'V5', 'Q'], ['V6', 'Q', 'V6', 'Q'], ['V4', 'E', 'V4', 'Q'], ['V7', 'Q', 'V7', 'Q'], ['V5', 'V6', 'V5', 'Q'], ['V4', 'V7', 'V5', 'V6'], ['V8', 'E', 'V8', 'Q'], ['S', 'V4', 'E', 'V9'], ['V1', 'V3', 'V2', 'V4'], ['V6', 'V5', 'V7', 'V8']]
    MES = [['Q', 'T', 'Q', 'T'], ['T', 'T', 'T', 'T'], ['E', 'T', 'S', 'X'], ['X', 'Q', 'T', 'Q'], ['S', 'X', 'S', 'X'], ['T', 'X', 'T', 'E'], ['X', 'X', 'T', 'T'], ['Q', 'R', 'T', 'X'], ['T', 'E', 'X', 'S']]
    L.add('p-ini', 'tocar · iniciante', partitura(INI, 'p-ini', 'Partituras: iniciante', 'semínimas, pausas e colcheias', 'tocar', 'Ajuste o metrônomo (ou o app) para o andamento indicado. Conte <b>4 tempos de entrada</b> e toque: com palmas, em uma mesa ou em um pad. Marque quando conseguir.', bpm_hint='sugestão: 60 a 80 BPM', corner_='feliz'))
    L.add('p-int', 'tocar · intermediário', partitura(INT, 'p-int', 'Partituras: intermediário', 'agora com semicolcheias', 'tocar', 'Mesmo esquema: <b>4 tempos de entrada</b>, metrônomo ligado e palmas (ou pad) só nas notas. Respeite as pausas!', bpm_hint='sugestão: 60 a 90 BPM', corner_='oculos'))
    L.add('p-avc', 'tocar · avançado', partitura(AVC, 'p-avc', 'Partituras: avançado', 'pontuadas, pausas e variações', 'tocar', 'Aqui aparecem todas as variações da semicolcheia. Conte <b>1 e &amp; a</b> baixinho e comece devagar.', bpm_hint='sugestão: 60 a 100 BPM', corner_='vibra'))
    L.add('p-mestre', 'tocar · mestre', partitura(MES, 'p-mestre', 'Partituras: mestre', 'tercinas, sextinas e muito ritmo', 'tocar', 'O desafio final! Tercinas (3) e sextinas (6) misturadas com semicolcheias. Sinta cada tempo “girar” de um jeito diferente.', mode='comp', bpm_hint='sugestão: 50 a 80 BPM', corner_='ouve'))

    def arte5(L):
        return f'<section class="page full"><img src="img/color5.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg("color5")}</span></div></section>'
    L.add('color5', 'para colorir', arte5, 'raw')
    for pid, img_ in [('p-band1', 'bandas1'), ('p-band2', 'bandas2')]:
        def mk(img_=img_, pid=pid):
            def f(L):
                return f'<img src="img/{img_}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft" style="left:10mm;right:10mm"><span>BEATERISTA | ROBOTERISTA ENSINA · pôster para colorir e colar</span><span>{L.pg(pid)}</span></div>'
            return f
        L.add(pid, 'pôster', mk(), 'land')

    # =================== RECORTES ===================
    def cut_cell(inner, h=132, extra=''):
        return f'<div class="cut" style="height:{h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:6px;{extra}">{inner}</div>'

    def cartas1(L):
        c = titulo('Cartas: figuras e pausas', 'recorte na linha tracejada', 440)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div><div class="col3" style="gap:8px">'
        for n, r in SYM:
            c += cut_cell(f'<div class="m" style="font-size:13.5px;text-transform:uppercase;margin-bottom:4px">{("pausa de " if r else "") + NOMES[n]}</div>{figura(n, 78, rest=r)}<div style="font-size:12px;margin-top:4px">{VALOR[n]}</div>', 150)
        c += cut_cell(paul('vibra', 96), 150)
        c += '</div>'
        c += '<p style="margin-top:10px;font-size:12.8px"><b>Brinque:</b> embaralhe e ordene da <b>maior</b> para a <b>menor</b>; ou ache a <b>figura</b> e a <b>pausa</b> que combinam. Dá para jogar também de <b>“quem vale mais?”</b>: cada jogador vira uma carta e quem tiver a figura mais longa leva as duas.</p>'
        return c
    L.add('r-cartas1', 'recortes · cartas', cartas1)

    def cartas2(L):
        c = titulo('Cartas: nomes e valores', 'jogo da memória: ligue o nome ao valor', 520)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div><div class="col3" style="gap:8px">'
        for n in FIG7:
            c += cut_cell(f'<div class="m" style="font-size:19px;text-transform:uppercase">{NOMES[n]}</div><div class="cap" style="margin-top:8px">nome</div>', 132)
        for n in FIG7:
            c += cut_cell(f'<div style="font-size:19px;font-weight:800">{VALOR[n]}</div><div class="cap" style="margin-top:8px">quanto vale</div>', 132)
        c += cut_cell(paul('musica', 90), 132)
        c += '</div>'
        c += box('<b>Como jogar:</b> vire todas as cartas para baixo. Cada jogador vira 2 cartas por vez: se o <b>nome</b> combinar com o <b>valor</b>, fica com o par e joga de novo; se não combinar, desvira e passa a vez. Vence quem tiver mais pares no final!<br><b>Para jogar sozinho:</b> cronometre quanto tempo você leva para achar os 7 pares e tente bater o seu recorde.', style='margin-top:12px;font-size:12.8px')
        return c
    L.add('r-cartas2', 'recortes · memória', cartas2)

    def cartas3(L):
        c = titulo('Cartas: variações', 'tercina, sextina e todas as divisões do tempo', 360)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div><div class="col3" style="gap:8px">'
        for k in range(1, 10):
            sp, lb, ds = VAR[k]
            c += cut_cell(f'{one_beat_svg(k, 170, True)}<div style="font-weight:800;font-size:12.5px;margin-top:-2px">{lb}</div><div style="font-size:10.5px">{ds}</div>', 150)
        t = 16 / 3; s6 = 16 / 6
        c += cut_cell(rhythm([(0, 8, 'n'), (t, 8, 'n'), (2 * t, 8, 'n')], beams=[[0, 1, 2]], width=170, total=16, tuplets=[(0, 2, 3)]) + '<div class="m" style="font-size:14px">TERCINA</div><div style="font-size:10.5px">3 notas no tempo</div>', 150)
        c += cut_cell(rhythm([(i * s6, 4, 'n') for i in range(6)], beams=[list(range(6))], width=170, total=16, tuplets=[(0, 5, 6)]) + '<div class="m" style="font-size:14px">SEXTINA</div><div style="font-size:10.5px">6 notas no tempo</div>', 150)
        c += cut_cell(paul('oculos', 90), 150)
        c += '</div><p style="margin-top:10px;font-size:12.8px"><b>Jogo da leitura:</b> embaralhe as cartas, tire uma, bata palmas lendo e ganhe 1 ponto por acerto. Quem fizer <b>5 pontos</b> primeiro vence! Para um desafio extra, vire duas cartas e bata uma depois da outra, sem parar o pulso.</p>'
        return c
    L.add('r-cartas3', 'recortes · variações', cartas3)

    # ---- bingo
    def bingo1(L):
        c = titulo('Bingo das figuras e pausas', 'recorte as fichas na próxima página e sorteie', 540)
        c += '<div class="col2" style="gap:14px">'
        rnd = random.Random(21)
        cards = []
        for i in range(4):
            while True:
                s = rnd.sample(range(14), 9)
                if tuple(sorted(s)) not in [tuple(sorted(x)) for x in cards]:
                    cards.append(s); break
        for i, s in enumerate(cards):
            c += f'<div class="box" style="padding:8px;border-radius:18px"><div class="m" style="font-size:14px;text-align:center;margin-bottom:6px">CARTELA {i+1}</div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5px">' + ''.join(f'<div style="border:2px solid #111;border-radius:10px;height:104px;display:flex;align-items:center;justify-content:center">{figura(SYM[k][0], 62, rest=SYM[k][1])}</div>' for k in s) + '</div></div>'
        c += '</div>'
        c += box('<b>Como jogar:</b> cada jogador escolhe uma cartela. Um jogador sorteia uma ficha e fala o <b>nome</b> (por exemplo, “pausa de colcheia”). Quem tiver esse desenho na cartela <b>cobre com um botão</b>. Vence quem completar <b>uma linha, uma coluna ou a cartela toda</b> e gritar <b>BINGO!</b>', style='margin-top:12px;font-size:12.8px')
        return c
    L.add('r-bingo1', 'recortes · bingo', bingo1)

    def bingo2(L):
        c = titulo('Fichas do bingo', 'recorte e coloque num saquinho', 380)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div><div class="col4" style="gap:8px">'
        for n, r in SYM:
            c += cut_cell(f'<div class="m" style="font-size:14px;text-transform:uppercase">{"pausa de" if r else ""}</div><div class="m" style="font-size:15px;text-transform:uppercase">{NOMES[n]}</div>', 100)
        c += '</div>'
        c += lab('variações do jogo')
        c += '<div class="col2" style="gap:10px;font-size:12.8px">' + box('<b>Bingo dos valores:</b> em vez do nome, quem sorteia fala o <b>valor</b> (“meio tempo”) e os jogadores cobrem a figura certa.') + box('<b>Bingo do silêncio:</b> só valem as <b>pausas</b>. Ganha quem completar primeiro as pausas da cartela.') + '</div>'
        c += corner('vibra', 70)
        return c
    L.add('r-bingo2', 'recortes · bingo', bingo2)

    # ---- trilha
    def trilha(L):
        c = titulo('A trilha do Robôterista', 'chegue ao 30 sabendo o nome e o valor de cada figura!', 640)
        rnd = random.Random(5)
        order = list(range(14)); rnd.shuffle(order)
        order2 = list(range(14)); rnd.shuffle(order2)
        seq = order + order2 + order
        star = {5, 13, 22, 27}; sleep = {9, 16, 24}; again = {11, 19}
        cell = {}
        j = 0
        for n in range(1, 31):
            if n == 1: cell[n] = ('<div class="m" style="font-size:17px">SAÍDA</div>' + paul('vibra', 54), 'start')
            elif n == 30: cell[n] = ('<div class="m" style="font-size:15px">CHEGADA</div>' + paul('coracao', 54), 'end')
            elif n in star: cell[n] = ('<div style="font-size:30px;line-height:1">★</div><div style="font-size:10px;font-weight:800;line-height:1.1">avance 2 casas</div>', 'special')
            elif n in sleep: cell[n] = (f'{figura("seminima", 46, rest=True)}<div style="font-size:10px;font-weight:800;line-height:1.1">é uma pausa!<br>fique 1 rodada</div>', 'special')
            elif n in again: cell[n] = ('<div style="font-size:26px;line-height:1">♫</div><div style="font-size:10px;font-weight:800;line-height:1.1">jogue de novo</div>', 'special')
            else:
                k = seq[j]; j += 1
                cell[n] = (figura(SYM[k][0], 62, rest=SYM[k][1]), 'sym')
        grid = [[None] * 6 for _ in range(5)]
        for n in range(1, 31):
            rr = (n - 1) // 6; cc = (n - 1) % 6
            if rr % 2 == 1: cc = 5 - cc
            grid[4 - rr][cc] = n
        t = '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:6px">'
        for r in range(5):
            for cc in range(6):
                n = grid[r][cc]
                ct, kd = cell[n]
                bg = '#fff'
                bd = '3px solid #111' if kd in ('start', 'end') else '2px solid #111'
                t += f'<div style="border:{bd};border-radius:14px;height:112px;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:{bg}"><span class="num" style="position:absolute;left:7px;top:3px;font-size:13px">{n}</span>{ct}</div>'
        t += '</div>'
        c += t
        c += '<div class="row" style="gap:14px;margin-top:8px;font-size:11.5px"><span><b>★</b> avance 2</span><span><b>pausa</b>: fique 1 rodada sem jogar</span><span><b>♫</b> jogue de novo</span><span>figura: diga o <b>nome</b> e o <b>valor</b></span></div>'
        return c
    L.add('r-trilha', 'jogos de mesa · trilha', trilha)

    def trilha2(L):
        c = titulo('Trilha: regras, dado e peões', 'tudo para jogar com a família', 520)
        c += '<div class="col2" style="gap:12px;align-items:start"><div>' + box('<div class="m" style="font-size:14px;margin-bottom:5px">COMO JOGAR (2 a 4 jogadores)</div><ol style="padding-left:18px;font-size:12.3px;line-height:1.45"><li>Cada um escolhe um peão e coloca na <b>SAÍDA</b>.</li><li>Na sua vez, jogue o <b>dado</b> e ande o número de casas.</li><li>Caiu numa <b>figura ou pausa</b>? Diga o <b>nome</b> e <b>quanto vale</b>. Acertou: fica. Errou: volta 1 casa.</li><li>Caiu na <b>★</b>: avance 2 casas.</li><li>Caiu na <b>pausa</b>: fique 1 rodada sem jogar (o silêncio também é música!).</li><li>Caiu no <b>♫</b>: jogue de novo.</li><li>Vence quem chegar primeiro ao <b>30</b>, parando exatamente na chegada ou passando dela.</li></ol>', style='padding:10px 14px') + '</div><div>' + box('<div class="m" style="font-size:14px;margin-bottom:5px">DICAS DO PAUL</div><div style="font-size:12.3px;line-height:1.45">• Use as <b>cartas</b> da pág. de recortes para conferir as respostas.<br>• Para um jogo mais difícil, também diga <b>quantas dessas cabem num compasso</b>.<br>• Sozinho? Jogue contra o relógio: chegue ao 30 em menos de 5 minutos!</div>', style='padding:10px 14px') + '<div class="center" style="margin-top:8px">' + paul('feliz', 90) + '</div></div></div>'
        c += lab('o dado: recorte, dobre nas linhas pontilhadas e cole as abas')
        face = lambda n: f'<div class="cut" style="width:112px;height:112px;display:flex;align-items:center;justify-content:center;font-family:Marker;font-size:56px">{n}</div>'
        blank = '<div style="width:112px;height:112px"></div>'
        c += '<div style="display:grid;grid-template-columns:repeat(4,112px);gap:0;justify-content:center;border:none">' + blank + face(1) + blank + blank + face(2) + face(3) + face(4) + face(5) + blank + face(6) + blank + blank + '</div>'
        c += '<p class="cap center" style="margin-top:3px">dica: cole numa cartolina para o dado ficar firme. se preferir, use um dado de verdade!</p>'
        c += lab('os peões: recorte, dobre a base e cole')
        peos = ['feliz', 'oculos', 'musica', 'vibra']
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<div class="cut" style="width:112px;padding:6px;text-align:center">{paul(p, 78)}<div style="border-top:2px dashed #888;margin-top:4px;font-size:9px;color:#777">dobre aqui</div><div style="height:16px"></div></div>' for p in peos) + '</div>'
        return c
    L.add('r-trilha2', 'jogos de mesa · trilha', trilha2)

    # ---- dominó
    def domino(L):
        c = titulo('Dominó das figuras e pausas', 'recorte, embaralhe e feche o círculo', 560)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div>'
        def peças(rest):
            ps = []
            for k in range(7):
                n = FIG7[k]; v = FIG7[(k + 1) % 7]
                ps.append((figura(n, 56, rest=rest), VALOR[v]))
            return ps
        allp = peças(False) + peças(True)
        rnd = random.Random(3); rnd.shuffle(allp)
        c += '<div class="col2" style="gap:8px 12px">'
        for g, v in allp:
            c += f'<div class="cut" style="display:flex;height:76px"><div style="flex:1;display:flex;align-items:center;justify-content:center">{g}</div><div style="width:2px;background:#888;margin:6px 0"></div><div style="flex:1;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;text-align:center;padding:0 6px">{v}</div></div>'
        c += '</div>'
        c += box('<b>Como jogar:</b> cada peça tem uma <b>figura</b> de um lado e um <b>valor</b> do outro. Encaixe as peças fazendo o valor combinar com a figura da peça seguinte, até <b>fechar o círculo</b>. São duas rodadas: uma só com <b>figuras</b> (valores dos tempos) e outra só com <b>pausas</b> (valores do silêncio). Como saber qual é qual? As peças de figura têm notinhas; as de pausa têm os desenhos do silêncio.', style='margin-top:10px;font-size:12.5px')
        return c
    L.add('r-domino', 'jogos de mesa · dominó', domino)

    # ---- régua do tempo
    def regua(L):
        c = titulo('A régua do tempo', 'recorte as tiras e compare', 380)
        c += '<p style="font-size:12.8px">Cada tira mede <b>1 compasso (4 tempos)</b>. Coloque uma embaixo da outra e veja quantas figuras cabem!</p><div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div>'
        for n, q in [('semibreve', 1), ('minima', 2), ('seminima', 4), ('colcheia', 8), ('semicolcheia', 16)]:
            c += f'<div style="font-size:12px;font-weight:800;margin:6px 0 1px">{q} {NOMES[n]}{"s" if q > 1 else ""}</div><div class="row cut" style="border-radius:2px;overflow:hidden">'
            for i in range(q):
                c += f'<div style="flex:1;height:70px;display:flex;align-items:center;justify-content:center;{"border-left:1.6px solid #111;" if i else ""}">{figura(n, 52 if q >= 8 else 60)}</div>'
            c += '</div>'
        c += '<div style="font-size:12px;font-weight:800;margin:6px 0 1px">os 4 tempos</div><div class="row cut" style="border-radius:2px;overflow:hidden">' + ''.join(f'<div style="flex:1;height:56px;display:flex;align-items:center;justify-content:center;font-family:Marker;font-size:30px;{"border-left:1.6px solid #111;" if i else ""}">{i+1}</div>' for i in range(4)) + '</div>'
        c += box('<b>Desafio:</b> cole as tiras em uma folha e <b>some</b> sempre 4 tempos. Quantas colcheias valem 1 mínima? Confira com as tiras! <span class="gray">(resposta: 4)</span>', style='margin-top:12px;font-size:13px')
        c += corner('amor', 60)
        return c
    L.add('r-regua', 'recortes · régua do tempo', regua)

    # =================== FINAL ===================
    def app(L):
        c = titulo('Jogue no app!', 'aponte a câmera do celular', 360)
        c += fala('agora é a hora de ouvir e tocar! os jogos escutam você (na tela ou no microfone) e mostram a sua precisão.', 'musica')
        items = [('Aulinha do Paul', 'a aula completa, com sons e figuras que você mexe na tela.', 'https://jogos.beaterista.com.br/#/kids/figuras/aula'),
                 ('Toca Aqui', 'leia a partitura e toque no tempo. 3 níveis: iniciante, intermediário e avançado.', 'https://jogos.beaterista.com.br/#/jogos/toca'),
                 ('Figuras rítmicas e Toque as figuras', 'jogos com fases e estrelas: quanto vale, qual vale mais, montar o desenho, pausas e tocar.', 'https://jogos.beaterista.com.br/#/kids/figuras'),
                 ('Ouça as levadas', 'escute e veja a levada de rock, pop, samba e baião com a partitura acendendo.', 'https://jogos.beaterista.com.br/#/estudos/ritmos')]
        for t, d, u in items:
            q = segno.make(u, error='m').svg_inline(scale=4, border=1, dark='#111', light='#fff')
            c += f'<div class="box row" style="gap:18px;padding:12px 18px;margin-bottom:12px;border-radius:20px"><div style="width:112px;flex:none">{q.replace("<svg", "<svg style=\"width:112px;height:112px;display:block\"", 1)}</div><div><div class="m" style="font-size:19px">{t}</div><div style="font-size:13px;margin:3px 0 8px">{d}</div><div class="tiny">{u.replace("https://", "")}</div></div></div>'
        c += '<p class="cap">Sem câmera? Digite o endereço no navegador. O app é gratuito para os alunos e funciona no celular, no tablet e no computador.</p>'
        c += corner('ouve', 56)
        return c
    L.add('f-app', 'jogue no app', app)

    def plano(L):
        dias = [('Aula 1: tempo, pulso e BPM', 'a1-tempo', 'a1-bpm'), ('A semínima, o compasso e as brincadeiras', 'a1-sem', 'a1-jogos'), ('A escadinha das 7 figuras e a pizza', 'a2-esc', 'a2-piz'), ('Trace as figuras, qual vale mais e ligue', 'a2-tr1', 'a2-lig'),
                ('Contas e compassos da aula 2', 'a2-compl', 'a2-comp'), ('Aula 3: montando o desenho', 'a3-peca', 'a3-pauta'), ('Aula 4: as pausas', 'a4-pausas', 'a4-comp'), ('Aula 5 (pontinho) e semicolcheia', 'a5-ponto', 'a6-sem'),
                ('As 9 variações e o bata palmas e leia', 'a6-var', 'a6-monte'), ('Aula 7: tercina e sextina', 'a7-terc', 'a7-leia'), ('Bônus: rudimentos e levadas de rock', 'a8-maos', 'a8-lev2'), ('Jogos, prova do Paul e diploma!', 'j-caca1', 'j-prova2')]
        c = titulo('Meu plano de 12 dias', '10 minutos por dia: marque quando fizer', 540)
        for i, (t, a, b) in enumerate(dias):
            c += (f'<div class="box row" style="gap:14px;padding:5px 16px;margin-bottom:6px;border-radius:14px"><div class="m" style="font-size:19px;width:62px">DIA {i+1}</div><div style="flex:1"><b style="font-size:13.5px">{t}</b><div style="font-size:11.5px;color:#444">págs. {L.pg(a)} a {L.pg(b)}</div></div>'
                  f'<div style="font-size:11.5px;text-align:right">fiz! <span class="ck big"></span><br>estrelas: ☆ ☆ ☆</div></div>')
        c += '<div class="m" style="font-size:15px;margin-top:8px">MEU MAIOR APRENDIZADO DA SEMANA:</div>' + dots(2)
        c += corner('feliz', 50)
        return c
    L.add('f-plano12', 'meu plano', plano)

    def trinta(L):
        c = titulo('Desafio dos 30 dias', 'um dia de cada vez: 10 minutos de música', 520)
        c += '<p style="font-size:12.8px">Pinte uma <b>estrela</b> a cada dia que você estudar (mesmo se for só 5 minutinhos!). Nos dias com ✦ você ganha um <b>prêmio</b>: cole uma figurinha do Paul da página de adesivos.</p>'
        special = {7: 'semana 1', 15: 'metade!', 21: 'semana 3', 30: 'campeão(ã)!'}
        c += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:7px">'
        for d in range(1, 31):
            sp = special.get(d)
            c += f'<div style="border:2px solid #111;border-radius:14px;height:96px;position:relative;text-align:center;{"background:#f0f0f0;" if sp else ""}"><span class="num" style="position:absolute;left:7px;top:3px">{d}</span><div style="font-size:34px;margin-top:20px;line-height:1">☆</div>' + (f'<div style="font-size:10px;font-weight:800">✦ {sp}</div>' if sp else '<div class="cap">palmas ☐</div>') + '</div>'
        c += '</div>'
        c += box('<b>ideias de estudo para cada dia:</b> palmas lendo uma partitura · jogar um jogo do livro · bater o paradiddle · ler 3 compassos de olhos fechados no pulso · ensinar uma figura para alguém da família · tocar no pad ou na mesa com o metrônomo.', style='margin-top:10px;font-size:12.5px')
        c += corner('timido', 56)
        return c
    L.add('f-30', 'desafio de 30 dias', trinta)

    def mural(L):
        c = titulo('Meu mural de conquistas', 'pinte as estrelas de cada aula que você terminou', 560)
        itens = ['Aula 1 · o tempo', 'Aula 2 · as figuras', 'Aula 3 · montar o desenho', 'Aula 4 · as pausas', 'Aula 5 · o pontinho', 'Aula 6 · semicolcheia', 'Aula 7 · tercina e sextina', 'Bônus · rudimentos', 'Bônus · levadas de rock', 'Jogos e desafios', 'Prova do Paul', 'Partituras']
        c += '<div class="col3" style="gap:10px">'
        for i, t in enumerate(itens):
            c += f'<div class="box center" style="padding:10px 6px;border-radius:20px;height:132px"><div style="width:52px;height:52px;border:3px solid #111;border-radius:50%;margin:0 auto 4px;line-height:44px;font-family:Marker;font-size:24px">{i+1}</div><div style="font-weight:800;font-size:12px;height:30px">{t}</div><div style="font-size:26px;line-height:1;letter-spacing:4px">☆☆☆</div></div>'
        c += '</div>'
        c += lab('meus títulos')
        c += '<div class="col3" style="gap:10px">' + ''.join(f'<div class="box center" style="padding:10px;border-radius:16px"><span class="ck big"></span><div class="m" style="font-size:13.5px;margin-top:4px">{t}</div></div>' for t in ['Robôterista Aprendiz', 'Robôterista de Ouro', 'Robôterista Mestre']) + '</div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">MINHA MÚSICA PREFERIDA PARA TOCAR NO PULSO:</div>' + dots(1) + '<div class="m" style="font-size:14px;margin:8px 0 4px">QUEM ASSISTIU À MINHA APRESENTAÇÃO?</div>' + dots(1), style='margin-top:12px')
        c += corner('coracao', 60)
        return c
    L.add('f-mural', 'mural de conquistas', mural)

    def adesivos(L):
        c = titulo('Figurinhas do Paul', 'recorte e cole nas páginas que você terminou', 520)
        c += '<div class="scissors">✂ - - - - - - - - - - - - - - - - recorte - - - - - - - - - - - - - - - - ✂</div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">'
        imgs = ['feliz', 'oculos', 'pensa', 'musica', 'vibra', 'surpreso', 'sono', 'duvida', 'amor', 'timido', 'coracao', 'zzz', 'ouve']
        txt = ['ARRASOU!', 'MAIS UM!', 'NO TEMPO!', 'BEAT PERFEITO', 'CAMPEÃO(Ã)', 'CONTEI E ACERTEI', 'ROBÔTERISTA']
        items = [('i', x) for x in imgs] + [('t', x) for x in txt]
        for k, v in items:
            if k == 'i':
                c += f'<div class="cut" style="height:122px;border-radius:60px;display:flex;align-items:center;justify-content:center">{paul(v, 78)}</div>'
            else:
                c += f'<div class="cut" style="height:122px;border-radius:60px;display:flex;align-items:center;justify-content:center;text-align:center;font-family:Marker;font-size:17px;padding:10px;line-height:1.1">★<br>{v}<br>★</div>'
        c += '</div>'
        c += '<p class="cap" style="margin-top:8px">dica: imprima em papel adesivo para colar de verdade, ou use cola em bastão.</p>'
        return c
    L.add('f-adesivos', 'figurinhas', adesivos)

    DIC = [('acento', 'um toque mais forte que os outros (o sinal é &gt;).'), ('andamento', 'a velocidade da música: lento, moderado ou rápido.'), ('baqueta', 'a varinha usada para tocar bateria.'), ('BPM', 'batidas por minuto: mede o andamento.'),
           ('compasso', 'a caixinha de tempos. No 4/4 tem 4 tempos.'), ('figura rítmica', 'o desenho que mostra quanto tempo o som dura.'), ('levada', 'o ritmo que o baterista repete sem parar.'), ('metrônomo', 'o aparelho que marca o pulso.'),
           ('pausa', 'o desenho do silêncio, com valor de tempo.'), ('pauta', 'as linhas onde a música é escrita.'), ('ponto de aumento', 'o pontinho que faz a figura valer metade a mais.'), ('pulso', 'a batida constante da música.'),
           ('rudimento', 'um exercício de mãos do baterista (como o paradiddle).'), ('semínima', 'a figura que vale 1 tempo: a nossa medida.'), ('sextina', '6 notas dentro de um tempo.'), ('tempo', 'cada batida do compasso: 1, 2, 3, 4.'), ('tercina', '3 notas dentro de um tempo de 2.'), ('tempo forte', 'o 1 do compasso: o mais forte.')]
    def dic(L):
        c = titulo('O dicionário do Paul', 'as palavras mais importantes do livro', 540)
        c += '<div class="col2" style="gap:8px 12px">'
        for w, d in DIC:
            c += f'<div class="box" style="padding:7px 12px;border-radius:12px"><div class="m" style="font-size:15px;text-transform:uppercase">{w}</div><div style="font-size:12.5px;margin-top:2px">{d}</div></div>'
        c += '</div>' + box('<div class="m" style="font-size:14px;margin-bottom:4px">PALAVRAS NOVAS QUE EU APRENDI:</div>' + dots(2), style='margin-top:12px')
        c += corner('pensa', 56)
        return c
    L.add('f-dic', 'dicionário', dic)

    def diploma(L):
        fig = ''.join(f'<div>{figura(n, 64)}</div>' for n in FIG7)
        return f'''<section class="page full" style="padding:0">
<div style="position:absolute;inset:8mm;border:4.5px solid #111"></div><div style="position:absolute;inset:11.5mm;border:1.5px solid #111"></div>
<div style="position:absolute;top:30mm;left:0;right:0;display:flex;justify-content:center;gap:26px;align-items:flex-end">{fig}</div>
<div style="position:absolute;top:56mm;left:0;right:0;text-align:center;font-family:Gochi;font-size:22px">Beaterista Escola de Música</div>
<div style="position:absolute;top:66mm;left:0;right:0;text-align:center"><div class="m" style="font-size:82px;line-height:1">DIPLOMA</div><div class="m" style="font-size:32px;margin-top:6px">DE ROBÔTERISTA</div></div>
<div style="position:absolute;top:110mm;left:0;right:0;text-align:center;font-size:15px">este diploma é concedido a</div>
<div style="position:absolute;top:126mm;left:30mm;right:30mm;border-bottom:2.5px dotted #777;height:2px"></div>
<div style="position:absolute;top:134mm;left:28mm;right:28mm;text-align:center;font-size:15.5px;line-height:1.5">por aprender as <b>7 figuras rítmicas</b>, as <b>pausas</b>, o <b>pontinho</b>, as <b>variações da semicolcheia</b>, a <b>tercina</b> e a <b>sextina</b>, e por <b>tocar no tempo</b></div>
<div style="position:absolute;top:158mm;left:0;right:0;text-align:center"><img src="img/paul_vibra.png" style="height:70mm"></div>
<div style="position:absolute;top:232mm;left:0;right:0;text-align:center;font-size:12.5px"><span class="ck"></span> Aprendiz &nbsp;&nbsp; <span class="ck"></span> de Ouro &nbsp;&nbsp; <span class="ck"></span> Mestre</div>
<div style="position:absolute;bottom:41mm;left:30mm;width:62mm;border-top:1.6px solid #111;text-align:center;font-size:12px;padding-top:3px">assinatura do professor(a)</div>
<div style="position:absolute;bottom:41mm;right:30mm;width:62mm;border-top:1.6px solid #111;text-align:center;font-size:12px;padding-top:3px">data</div>
<div class="m" style="position:absolute;bottom:22mm;left:0;right:0;text-align:center;font-size:15px">beaterista.com.br · TikTok @beaterista</div>
</section>'''
    L.add('f-diploma', 'diploma', diploma, 'raw')

    # =================== GABARITO ===================
    def gab_pages(L):
        ents = L.ans
        def entry(pid, tt, content, kind):
            title = tt.format(pg=L.pg(pid))
            if kind == 'grid':
                g, sol = L.gridsol[pid]
                body = search_html(g, 15, sol, small=True)
                w = 250
            elif kind == 'html':
                body = content; w = 250
            else:
                body = f'<div style="font-size:11.6px">{content}</div>'
                w = 34 + len(content) * 0.285
            return f'<div style="break-inside:avoid;margin-bottom:10px"><div style="font-weight:800;font-size:12.5px;margin-bottom:2px">{title}</div>{body}</div>', w
        items = [entry(*e) for e in ents]
        # divide em 3 páginas
        tot = sum(w for _, w in items)
        pages, cur, acc = [], [], 0
        cap = tot / 3 + 40
        for h, w in items:
            if acc + w > cap and len(pages) < 2:
                pages.append(cur); cur = []; acc = 0
            cur.append(h); acc += w
        pages.append(cur)
        return pages
    def mkg(i):
        def f(L):
            pages = gab_pages(L)
            pg_ = pages[i] if i < len(pages) else []
            c = titulo('Gabarito' + (f' ({i+1}/3)' if True else ''), 'confira com carinho: o erro também ensina', 560)
            c += '<div style="column-count:2;column-gap:22px">' + ''.join(pg_) + '</div>'
            return c
        return f
    for i in range(3):
        L.add(f'gab{i+1}', 'gabarito', mkg(i), 'std', maxz=1.12)
