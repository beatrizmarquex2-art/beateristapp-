# -*- coding: utf-8 -*-
from base import *
from pages_a import FIG7, NOMES, VALOR, VALOR_N, notas_row
import math

def fmt(v):
    m = {0.5: 'meio tempo', 0.25: '¼ de tempo', 0.125: '⅛ de tempo', 0.0625: '1/16 de tempo', 1: '1 tempo', 1.5: '1 tempo e meio', 0.75: '¾ de tempo'}
    if v in m: return m[v]
    if float(v).is_integer(): return f'{int(v)} tempos'
    return f'{v} tempos'

def tempos_txt(v):
    if float(v).is_integer(): return f'{int(v)}'
    return str(v).replace('.5', ',5')

def fsig(a, b, h=64):
    return f'<div class="m" style="font-size:{h*0.46:.0f}px;line-height:{h*0.44:.0f}px;text-align:center;width:30px;flex:none">{a}<br>{b}</div>'

def pizza(n, r=70, fill=(), lw=2.6, label_idx=False):
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {2*r+8} {2*r+8}" width="{2*r+8}" height="{2*r+8}" style="display:block">']
    cx = cy = r + 4
    if n == 1:
        o.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{"#bbb" if 0 in fill else "#fff"}" stroke="#111" stroke-width="{lw}"/>')
    else:
        for i in range(n):
            a0 = -math.pi / 2 + 2 * math.pi * i / n
            a1 = -math.pi / 2 + 2 * math.pi * (i + 1) / n
            x0, y0 = cx + r * math.cos(a0), cy + r * math.sin(a0)
            x1, y1 = cx + r * math.cos(a1), cy + r * math.sin(a1)
            f = '#bdbdbd' if i in fill else '#fff'
            o.append(f'<path d="M{cx},{cy} L{x0:.1f},{y0:.1f} A{r},{r} 0 {1 if n==2 else 0} 1 {x1:.1f},{y1:.1f} Z" fill="{f}" stroke="#111" stroke-width="{lw}" stroke-linejoin="round"/>')
    o.append('</svg>')
    return ''.join(o)

def build(L):
    # =============== AULA 1 ===============
    def tempo(L):
        c = titulo('Aula 1: o tempo', 'o batimento da música', 360)
        c += fala('põe a mão no peito! sente o tum-tum-tum? a música também tem um batimento. a gente chama de pulso ou tempo.', 'pensa')
        c += '<p>O <b>tempo</b> é a batida que não para, sempre igual, como o tic-tac do relógio ou os seus passos andando. Contamos assim: <b>1 · 2 · 3 · 4</b>, e de novo <b>1 · 2 · 3 · 4</b>. Cada grupo de 4 tempos se chama <b>compasso</b>.</p>'
        c += lab('faça agora:') + '<ol style="padding-left:22px;font-size:13.5px;line-height:1.7"><li>Em pé, marque o tempo com os pés (1 · 2 · 3 · 4) por 30 segundos.</li><li>Agora bata palmas no tempo, sem parar de contar em voz alta.</li><li>Ponha uma música que você gosta e tente achar o tempo: onde dá vontade de bater o pé?</li></ol>'
        c += lab('um compasso de 4 tempos:')
        c += '<div style="display:flex;gap:16px;justify-content:center">' + ''.join(f'<div class="box" style="width:136px;height:92px;text-align:center;font-family:Marker;font-size:46px;line-height:80px;border-radius:18px">{i}</div>' for i in range(1, 5)) + '</div>'
        c += lab('quem tem pulso? marque com ✔ o que tem batida constante:')
        itens = ['o tic-tac do relógio', 'o batimento do coração', 'seus passos andando', 'o barulho do vento', 'o metrônomo', 'a chuva forte caindo (sem ritmo certo)']
        c += '<div class="col2" style="font-size:13.5px;gap:8px 20px">' + ''.join(f'<div><span class="ck"></span> {t}</div>' for t in itens) + '</div>'
        c += corner('pensa', 80)
        L.gab('a1-tempo', 'quem tem pulso? (pág. {pg})', 'tem pulso: relógio, coração, passos e metrônomo. não têm pulso constante: o vento e a chuva forte.')
        return c
    L.add('a1-tempo', 'aula 1 · o tempo', tempo)

    def pulso(L):
        c = titulo('Marque o pulso', 'preencha uma bolinha para cada tempo', 400)
        c += '<p>Em cada linha tem 4 tempos. <b>Pinte</b> as bolinhas enquanto bate o pé no tempo e conta em voz alta.</p>'
        for r in range(6):
            c += '<div style="display:flex;justify-content:space-around;margin:5px 0">' + ''.join(f'<div class="row" style="gap:6px"><div style="width:58px;height:58px;border:3px solid #111;border-radius:50%"></div><span class="num" style="font-size:15px;align-self:flex-start">{i}</span></div>' for i in range(1, 5)) + '</div>'
        c += lab('desafio do Paul:') + '<p>Bata o tempo e, <b>só no tempo 1</b>, bata palmas. Depois, só nos tempos <b>1 e 3</b>. Depois, só no <b>2 e 4</b>. Marque com um <b>X</b> onde você bateu palmas:</p>'
        for t in ['só no 1', 'nos tempos 1 e 3', 'nos tempos 2 e 4', 'em todos os tempos']:
            c += f'<div class="row" style="margin-bottom:7px"><b style="width:190px;font-size:13.5px">{t}</b>' + ''.join(f'<div class="box" style="width:80px;height:40px;margin-right:9px;text-align:center;font-family:Marker;padding:5px;border-radius:10px">{i}</div>' for i in range(1, 5)) + '</div>'
        c += corner('ouve', 70)
        return c
    L.add('a1-pulso', 'aula 1 · o tempo', pulso)

    def bpm(L):
        c = titulo('Pulso e metrônomo', 'o metrônomo ajuda a manter a velocidade constante', 520)
        import draw
        c += '<div class="row" style="gap:20px;margin-bottom:8px"><div class="box" style="padding:10px 16px;border-radius:20px">' + draw.icon_metro(110) + '</div><div><div class="m" style="font-size:25px;line-height:1.1">60 BPM = 60 batidas por minuto</div><p style="margin-top:8px">BPM significa <b>batidas por minuto</b>. A 60 BPM, sentimos uma batida por segundo. Quanto maior o número, mais rápida é a música!</p></div></div>'
        c += lab('1. pinte cada pulso') + '<div style="display:flex;gap:10px;justify-content:center">' + ''.join(f'<div style="text-align:center"><div style="width:62px;height:62px;border:3px solid #111;border-radius:12px"></div><b>{i}</b></div>' for i in range(1, 9)) + '</div><p style="text-align:center;margin-top:6px"><b>conte em voz alta: 1 - 2 - 3 - 4 - 1 - 2 - 3 - 4</b></p>'
        c += lab('2. rápido ou devagar? marque V (verdadeiro) ou F (falso)')
        vf = [('80 BPM é mais rápido que 60 BPM.', 'V'), ('40 BPM é mais rápido que 80 BPM.', 'F'), ('120 BPM é mais rápido que 100 BPM.', 'V')]
        for t, r in vf:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px"><span class="ck big"></span> V &nbsp; <span class="ck big"></span> F &nbsp; <span style="font-size:13.5px">{t}</span></div>'
        c += lab('3. dê nome ao andamento: ligue')
        for l_, r_ in [('60 BPM', 'moderado'), ('100 BPM', 'rápido'), ('160 BPM', 'lento')]:
            c += ('<div style="display:flex;align-items:center;margin-bottom:8px">'
                  f'<div class="box" style="width:200px;padding:6px 14px;border-radius:30px;font-weight:800">{l_}</div><div style="width:14px;height:14px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div>'
                  f'<div style="width:14px;height:14px;border-radius:50%;background:#111;margin-right:10px"></div><div class="box" style="width:200px;padding:6px 14px;border-radius:30px;font-weight:800;text-align:right">{r_}</div></div>')
        c += box('<b>missão:</b> ponha o metrônomo (ou o app) em 60 BPM e bata palmas por 20 segundos. <b>Quantas batidas você deu?</b> <span class="dots" style="display:inline-block;width:90px;vertical-align:bottom"></span>', style='margin-top:10px;font-size:13px')
        L.gab('a1-bpm', 'pulso e metrônomo (pág. {pg})', 'V · F · V. ligue: 60 BPM → lento · 100 BPM → moderado · 160 BPM → rápido. missão: 20 batidas.')
        return c
    L.add('a1-bpm', 'aula 1 · o tempo', bpm)

    def sem(L):
        c = titulo('A semínima', 'a nossa medida: vale 1 tempo', 360)
        c += fala('toda figura é comparada com uma só: a semínima. ela vale 1 tempo: uma palma para cada número da contagem.', 'musica', 'r')
        c += '<div class="center" style="margin:6px 0">' + figura('seminima', 190) + '<div class="m" style="font-size:25px">SEMÍNIMA = 1 TEMPO</div></div>'
        c += '<p><b>Como se desenha:</b> uma <b>cabeça cheia</b> (um ovalzinho pintado) e uma <b>haste</b> (uma linha para cima).</p>'
        c += lab('trace e depois continue sozinho(a):')
        ev = [(i * 16, 16, 'n') for i in range(4)]
        c += rhythm(ev, width=660, total=64, pad=40, ghost_after=1)
        c += lab('agora desenhe a semínima sozinho(a) na pauta:')
        for _ in range(3):
            c += '<div style="height:70px;border-bottom:2px solid #111;margin:6px 0 0"></div>'
        c += '<div class="tip" style="margin-top:20px"><b>Palmas:</b><span>bata 4 palmas contando 1 · 2 · 3 · 4: você tocou 4 semínimas!</span></div>'
        return c
    L.add('a1-sem', 'aula 1 · a semínima', sem)

    def comp(L):
        c = titulo('O compasso', 'a caixinha onde os tempos moram', 360)
        c += fala('a música é organizada em caixinhas iguais: os compassos! a linha vertical é a barra de compasso. no começo vem uma fração, que me diz o tamanho da caixinha.', 'feliz')
        c += '<p>O número de <b>cima</b> diz <b>quantos tempos</b> cabem na caixinha. O número de <b>baixo</b> diz <b>qual figura vale 1 tempo</b>: o 4 quer dizer semínima. Por isso o <b>4/4</b> é “4 semínimas por compasso”, o mais usado no rock e no pop.</p>'
        for a, b, spec, nm in [(2, 4, ['sm', 'sm'], '2/4: 2 tempos (marcha)'), (3, 4, ['sm', 'sm', 'sm'], '3/4: 3 tempos (valsa)'), (4, 4, ['sm', 'sm', 'sm', 'sm'], '4/4: 4 tempos (rock e pop)')]:
            wid = 150 * len(spec)
            svg, tot = compasso(spec, width=wid + 30)
            # contagem
            cnt = [(i * 16, str(i + 1)) for i in range(len(spec))]
            ev = [(i * 16, 16, 'n') for i in range(len(spec))]
            svg = rhythm(ev, width=wid + 30, total=16 * len(spec), pad=22, bars=[16 * len(spec)], counts=cnt)
            c += f'<div class="box" style="margin-bottom:10px;padding:8px 16px 10px"><b class="m" style="font-size:14px;text-transform:uppercase">{nm}</b><div class="row" style="gap:14px;margin-top:2px"><div class="row" style="flex:none">{fsig(a, b, 70)}</div><div style="flex:1">{svg}</div></div></div>'
        c += lab('o 1 é o tempo forte')
        c += '<p>Em cada compasso o <b>tempo 1 é o mais forte</b>: ele ganha um <b>acento</b> (&gt;). Bata palmas em 4/4 batendo <b>forte no 1</b> e fraquinho nos outros:</p>'
        c += '<div class="row" style="justify-content:space-around;margin-bottom:6px">' + ''.join(f'<div style="text-align:center"><div class="m" style="font-size:30px;line-height:1">{"&gt;" if i==1 else "&nbsp;"}</div><div class="box" style="width:90px;height:60px;line-height:52px;text-align:center;font-family:Marker;font-size:30px;border-radius:14px">{i}</div></div>' for i in range(1, 5)) + '</div>'
        c += lab('responda:')
        for q in ['Quantos tempos tem um compasso 3/4?', 'No 4/4, qual figura vale 1 tempo?', 'Quantas semínimas cabem num compasso 2/4?']:
            c += f'<div style="display:flex;gap:10px;align-items:end;margin-bottom:3px"><b style="font-size:13px">{q}</b><div class="dots" style="flex:1"></div></div>'
        L.gab('a1-comp', 'o compasso (pág. {pg})', '3 tempos · semínima · 2 semínimas.')
        return c
    L.add('a1-comp', 'aula 1 · o compasso', comp)

    def jogos1(L):
        c = titulo('Brincadeiras do tempo', 'pulso e ritmo não são a mesma coisa', 500)
        c += fala('o <b>pulso</b> é a batida que não para. o <b>ritmo</b> é o desenho que as notas fazem em cima do pulso. eu consigo bater o pulso com o pé e o ritmo com as mãos, ao mesmo tempo!', 'oculos', 'r')
        c += lab('1. o ritmo das palavras: cada sílaba é uma batida')
        c += '<p style="font-size:12.5px">Diga cada palavra batendo palmas <b>uma vez por sílaba</b>. Depois escreva quantas palmas você deu.</p>'
        pal = [('Paul', 'Paul', 1), ('tambor', 'tam-bor', 2), ('pandeiro', 'pan-dei-ro', 3), ('música', 'mú-si-ca', 3), ('baquetas', 'ba-que-tas', 3), ('bateria', 'ba-te-ri-a', 4), ('metrônomo', 'me-trô-no-mo', 4), ('Beaterista', 'be-a-te-ris-ta', 5)]
        c += '<div class="col2" style="gap:8px 16px">'
        for p, s, n in pal:
            c += f'<div class="box" style="padding:7px 12px;border-radius:12px;display:flex;justify-content:space-between;align-items:center"><b style="font-size:14px">{p}</b><span class="ck big" style="margin:0"></span></div>'
        c += '</div>'
        c += '<p style="font-size:12px;margin-top:4px" class="gray">dentro da caixinha, escreva o número de palmas.</p>'
        c += lab('2. o ritmo do seu nome')
        c += '<p style="font-size:12.5px">Escreva seu nome separando em sílabas e desenhe uma bolinha para cada sílaba. Depois bata o ritmo do seu nome 4 vezes!</p>'
        c += '<div class="box" style="height:80px;display:flex;align-items:center;gap:16px"><div class="m" style="font-size:14px">MEU NOME:</div><div class="dots" style="flex:1"></div></div>'
        c += lab('3. pulso nos pés, ritmo nas mãos')
        c += '<p style="font-size:12.5px">Marque o pulso com o pé (1 · 2 · 3 · 4) e, ao mesmo tempo, bata nas mãos o ritmo da palavra <b>“ba-te-ri-a”</b>. Não vale parar de contar! Se perdeu o pulso, volte ao começo e tente de novo mais devagar.</p>'
        c += '<div class="row" style="gap:10px;margin:6px 0">' + ''.join(f'<span class="ck big"></span>' for _ in range(5)) + ' <span class="gray" style="font-size:12px">marque cada vez que conseguir sem errar</span></div>'
        c += lab('4. conte os compassos')
        c += '<p style="font-size:12.5px">Ponha uma música que você gosta e conte: 1 · 2 · 3 · 4, 2 · 2 · 3 · 4, 3 · 2 · 3 · 4... Quantos compassos tem o refrão? <span style="display:inline-block;width:80px;border-bottom:2px dotted #888"></span></p>'
        c += corner('feliz', 70)
        L.gab('a1-jogos', 'brincadeiras do tempo (pág. {pg})', 'sílabas (palmas): Paul 1 · tambor 2 · pandeiro 3 · música 3 · baquetas 3 · bateria 4 · metrônomo 4 · Beaterista 5.')
        return c
    L.add('a1-jogos', 'aula 1 · brincadeiras', jogos1)

    # =============== AULA 2 ===============
    def esc(L):
        c = titulo('A escadinha das 7 figuras', 'cada uma vale a metade da de cima', 520)
        c += '<p>Na música, os valores <b>dividem ao meio</b>. A <b>semibreve</b> é a maior; cada figura seguinte dura a metade da anterior.</p>'
        desc = {'semibreve': 'a maior: o compasso inteiro', 'minima': 'metade da semibreve', 'seminima': 'o pulso: a nossa medida', 'colcheia': 'metade da semínima', 'semicolcheia': 'metade da colcheia', 'fusa': 'metade da semicolcheia', 'semifusa': 'a menor de todas'}
        for n in FIG7:
            frac = VALOR_N[n] / 4
            c += (f'<div class="box" style="display:flex;align-items:center;gap:16px;padding:6px 16px;margin-bottom:8px;border-radius:16px"><div style="width:60px;flex:none;display:flex;justify-content:center">{figura(n, 74)}</div>'
                  f'<div style="width:215px;flex:none"><div class="m" style="font-size:18px;text-transform:uppercase">{NOMES[n]}</div><b style="font-size:14px">vale {VALOR[n]}</b><div style="font-size:11.5px">{desc[n]}</div></div>'
                  f'<div style="flex:1"><div style="height:20px;border:2px solid #111;background:linear-gradient(90deg,#111 {frac*100:.2f}%,#fff {frac*100:.2f}%)"></div><div class="cap" style="margin-top:3px">tamanho comparado com 4 tempos</div></div></div>')
        c += tip('2 colcheias = 1 semínima. 2 semínimas = 1 mínima. sempre dividindo ao meio!')
        c += corner('feliz', 60)
        return c
    L.add('a2-esc', 'aula 2 · as figuras', esc)

    def arv(L):
        c = titulo('A árvore das figuras', 'quanto cabe em um compasso?', 460)
        c += '<p>Cada linha divide a de cima <b>ao meio</b>. Todas as linhas têm o <b>mesmo comprimento</b>: um compasso de 4 tempos.</p>'
        for n, q in [('semibreve', 1), ('minima', 2), ('seminima', 4), ('colcheia', 8), ('semicolcheia', 16)]:
            lbl = f'{q} {NOMES[n]}' + ('s' if q > 1 else '')
            c += f'<div style="font-size:12.5px;font-weight:800;margin:7px 0 2px">{lbl}</div><div class="row" style="border:2px solid #111;border-radius:10px;overflow:hidden;background:#fff">'
            for i in range(q):
                c += f'<div style="flex:1;height:72px;display:flex;align-items:center;justify-content:center;{"border-left:2px solid #111;" if i else ""}">{figura(n, 54 if q >= 8 else 62)}</div>'
            c += '</div>'
        c += '<div style="margin:10px 0 4px;font-size:12.5px"><b>Mais pequenas ainda:</b> 32 <b>fusas</b> cabem no compasso e 64 <b>semifusas</b>! São bem rápidas, mas seguem a mesma regra: cada uma vale metade da anterior.</div>'
        c += '<div class="m" style="font-size:16px;margin-top:8px;line-height:1.35">CONTA RÁPIDA: 1 SEMIBREVE = 2 MÍNIMAS = 4 SEMÍNIMAS = 8 COLCHEIAS = 16 SEMICOLCHEIAS</div>'
        c += lab('desafio') + box('Quantas <b>colcheias</b> valem 1 <b>mínima</b>? <span class="dots" style="display:inline-block;width:80px;vertical-align:bottom"></span> &nbsp;&nbsp; E quantas <b>semicolcheias</b> valem 1 <b>semínima</b>? <span class="dots" style="display:inline-block;width:80px;vertical-align:bottom"></span>', style='font-size:13.5px')
        c += corner('amor', 66)
        L.gab('a2-arv', 'a árvore das figuras (pág. {pg})', '1 mínima = 4 colcheias · 1 semínima = 4 semicolcheias.')
        return c
    L.add('a2-arv', 'aula 2 · a árvore', arv)

    def pizzas(L):
        c = titulo('A pizza do compasso', 'cada fatia é uma figura!', 400)
        c += fala('imagine que o compasso inteiro (4 tempos) é uma pizza. cada figura é uma fatia do mesmo tamanho!', 'amor', 'r')
        rows = [('semibreve', 1, 1), ('minima', 2, 2), ('seminima', 4, 4), ('colcheia', 8, 8), ('semicolcheia', 16, 16)]
        c += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">'
        for n, q, sl in rows:
            c += f'<div class="box row" style="gap:14px;padding:8px 14px;border-radius:16px">{pizza(sl, 46, fill=(0,), lw=2)}<div><div class="m" style="font-size:14.5px;text-transform:uppercase">{NOMES[n]}</div><div style="font-size:12px">{sl} fatia{"s" if sl>1 else ""} = pizza inteira<br><b>1 fatia = {VALOR[n]}</b></div></div></div>'
        c += '<div class="box row" style="gap:14px;padding:8px 14px;border-radius:16px">' + figura('seminima', 56) + '<div style="font-size:12px"><b>pinte uma fatia</b> de cada pizza ao lado: elas ficam do mesmo tamanho?<br>sim e não! o <b>tamanho</b> muda, mas a pizza inteira é sempre <b>4 tempos</b>.</div></div>'
        c += '</div>'
        c += lab('desafio das pizzas: pinte as fatias') + '<p style="font-size:12.5px">Cada pizza abaixo tem 16 fatias de semicolcheia (¼ de tempo cada). Pinte as fatias que o Paul comeu em cada pedido. <b>Dica:</b> 1 semínima = 4 fatias · 1 colcheia = 2 fatias · 1 mínima = 8 fatias.</p>'
        c += '<div class="col2" style="gap:14px">'
        pedidos = [('1 mínima + 1 semínima + 2 colcheias', 'ele comeu a pizza toda!'), ('2 semínimas + 1 colcheia + 4 semicolcheias', 'quantas fatias sobraram?')]
        for t, d in pedidos:
            c += f'<div class="box center" style="padding:10px;border-radius:18px">{pizza(16, 70, lw=2)}<div style="font-weight:800;font-size:12.5px;margin-top:6px">{t}</div><div class="cap">{d}</div></div>'
        c += '</div>'
        L.gab('a2-piz', 'a pizza do compasso (pág. {pg})', '1º pedido: 8+4+2+2 = 16 fatias (a pizza toda). 2º pedido: 8+2+4 = 14 fatias, sobraram 2 (meio tempo).')
        return c
    L.add('a2-piz', 'aula 2 · a pizza', pizzas)

    def tr(n_list, pid, idx):
        def f(L):
            c = titulo(f'Trace as figuras ({idx})', 'passe o lápis no cinza claro e depois desenhe' if idx == 1 else 'agora as figuras com bandeirinhas', 440)
            for n in n_list:
                c += f'<div class="box" style="margin-bottom:12px;padding:10px 16px;border-radius:16px"><div class="m" style="font-size:15px;text-transform:uppercase">{NOMES[n]}</div><div style="font-size:12px">vale {VALOR[n]}</div><div class="row" style="gap:22px;margin-top:2px;align-items:flex-end">'
                for i in range(4):
                    c += f'<div style="width:62px">{figura(n, 84, "#111" if i == 0 else GHOST)}</div>'
                c += '<div style="flex:1;display:flex;gap:26px;padding-bottom:8px"><div style="flex:1;border-bottom:2px dotted #888;height:10px"></div><div style="flex:1;border-bottom:2px dotted #888;height:10px"></div></div></div></div>'
            if idx == 1:
                c += tip('a semibreve é só a <b>cabeça vazia</b>, sem haste. a mínima tem a cabeça vazia e <b>haste</b>. a semínima tem a cabeça <b>cheia</b> e haste.')
                c += corner('timido', 60)
            else:
                c += tip('cada <b>bandeirinha</b> a mais faz a figura valer <b>metade</b>. 1 bandeirinha = colcheia, 2 = semicolcheia, 3 = fusa, 4 = semifusa.', 'repare')
                c += corner('musica', 60)
            return c
        L.add(pid, 'aula 2 · traçar', f)
    tr(['semibreve', 'minima', 'seminima'], 'a2-tr1', 1)
    tr(['colcheia', 'semicolcheia', 'fusa', 'semifusa'], 'a2-tr2', 2)

    PARES = [('colcheia', 'minima'), ('semibreve', 'seminima'), ('semifusa', 'fusa'), ('minima', 'seminima'), ('semicolcheia', 'colcheia'), ('seminima', 'colcheia'),
             ('semifusa', 'seminima'), ('semibreve', 'minima'), ('fusa', 'colcheia'), ('minima', 'fusa'), ('seminima', 'semibreve'), ('semicolcheia', 'semifusa')]
    def mais(L):
        c = titulo('Qual vale mais?', 'circule a figura que dura mais tempo', 380)
        c += '<div class="col2" style="gap:10px">'
        resp = []
        for i, (a, b) in enumerate(PARES):
            c += (f'<div class="box" style="padding:6px 12px;border-radius:14px"><div class="num">{i+1}</div><div class="row" style="justify-content:space-around;margin-top:-8px"><div style="padding:3px 12px">{figura(a, 74)}</div><b class="m" style="font-size:14px">OU</b><div style="padding:3px 12px">{figura(b, 74)}</div></div></div>')
            resp.append(NOMES[a] if VALOR_N[a] > VALOR_N[b] else NOMES[b])
        c += '</div>' + tip('quanto <b>mais bandeirinhas</b>, mais <b>rápida</b> e <b>menos tempo</b> vale a figura.')
        c += corner('oculos', 60)
        L.gab('a2-mais', 'qual vale mais? (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)))
        return c
    L.add('a2-mais', 'aula 2 · desafios', mais)

    def ligue(L):
        c = titulo('Quanto vale? Ligue!', 'una cada figura ao seu valor', 400)
        vals = {'semibreve': '4 tempos', 'minima': '2 tempos', 'seminima': '1 tempo', 'colcheia': 'meio tempo', 'semicolcheia': '¼ de tempo', 'fusa': '⅛ de tempo', 'semifusa': '1/16 de tempo'}
        ordem = ['semifusa', 'colcheia', 'minima', 'semibreve', 'fusa', 'seminima', 'semicolcheia']
        c += '<div style="margin-top:6px">'
        for i, n in enumerate(FIG7):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:10px"><div class="box" style="flex:0 0 44%;height:84px;display:flex;align-items:center;gap:16px;padding:4px 18px;border-radius:16px"><div style="width:50px">{figura(n, 70)}</div><b class="m" style="font-size:15.5px;text-transform:uppercase">{NOMES[n]}</b></div>'
                  f'<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div><div style="width:15px;height:15px;border-radius:50%;background:#111;margin-right:10px"></div>'
                  f'<div class="box" style="flex:0 0 36%;height:84px;display:flex;align-items:center;justify-content:center;font-family:Marker;font-size:18px;border-radius:16px">{vals[ordem[i]].upper()}</div></div>')
        c += '</div>'
        c += corner('amor', 70)
        L.gab('a2-lig', 'quanto vale? (pág. {pg})', ' · '.join(f'{NOMES[n]} → {vals[n]}' for n in FIG7))
        return c
    L.add('a2-lig', 'aula 2 · desafios', ligue)

    def compl(L):
        c = titulo('Complete a escadinha', 'preencha, marque e circule', 420)
        c += lab('1. complete', True)
        fr = [('a semibreve vale', '4 tempos'), ('a mínima vale', '2 tempos'), ('a semínima vale', '1 tempo'), ('a colcheia vale', 'meio tempo'), ('a semicolcheia vale', '¼ de tempo'), ('a fusa vale', '⅛ de tempo'), ('a semifusa vale', '1/16 de tempo')]
        c += '<div class="col2" style="gap:6px 20px">' + ''.join(f'<div style="display:flex;gap:8px;align-items:end;font-size:13.5px"><b style="white-space:nowrap">{a}</b><div class="dots" style="flex:1"></div></div>' for a, _ in fr) + '</div>'
        c += lab('2. verdadeiro ou falso?')
        vf = [('a mínima vale o dobro da semínima.', 'V'), ('a colcheia vale mais que a semínima.', 'F'), ('4 semínimas = 1 semibreve.', 'V'), ('2 colcheias = 1 mínima.', 'F'), ('a fusa vale a metade da semicolcheia.', 'V'), ('a semibreve não tem haste.', 'V'), ('a semifusa é a figura mais longa.', 'F')]
        for t, r in vf:
            c += f'<div class="row" style="gap:6px;margin-bottom:5px"><span class="ck big"></span> V &nbsp;<span class="ck big"></span> F &nbsp; <span style="font-size:13.5px">{t}</span></div>'
        c += lab('3. circule só as figuras que valem MENOS de 1 tempo')
        c += '<div class="row" style="justify-content:space-around;margin-bottom:4px">' + ''.join(f'<div style="padding:6px 8px">{figura(n, 78)}</div>' for n in FIG7) + '</div>'
        c += lab('4. ordene da MAIOR para a MENOR: escreva o número de 1 a 7')
        emb = ['colcheia', 'semibreve', 'semifusa', 'seminima', 'minima', 'fusa', 'semicolcheia']
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<div style="text-align:center">{figura(n, 66)}<div class="box" style="width:42px;height:34px;margin:2px auto 0;border-radius:8px"></div></div>' for n in emb) + '</div>'
        L.gab('a2-compl', 'complete a escadinha (pág. {pg})', ' · '.join(f'{a} {b}' for a, b in fr) + '. V/F: V · F · V · F · V · V · F. menos de 1 tempo: colcheia, semicolcheia, fusa e semifusa. ordem (colcheia, semibreve, semifusa, semínima, mínima, fusa, semicolcheia): 4 · 1 · 7 · 3 · 2 · 6 · 5.')
        return c
    L.add('a2-compl', 'aula 2 · desafios', compl)

    def conta(L):
        c = titulo('Brincando de contar', 'soma os tempos como quem monta um quebra-cabeça!', 600)
        c += lab('1. ligue a figura ao seu valor', True)
        c += '<div class="col3" style="gap:14px">'
        for n, v in [('minima', '2 tempos'), ('seminima', '1 tempo'), ('semibreve', '4 tempos')]:
            c += f'<div class="box center" style="padding:6px;border-radius:16px">{figura(n, 70)}<div style="margin-top:2px;height:22px"></div></div>'
        c += '</div><div class="col3" style="gap:14px;margin-top:10px">' + ''.join(f'<div class="box center" style="padding:7px;border-radius:30px;font-weight:800">{t}</div>' for t in ['1 tempo', '4 tempos', '2 tempos']) + '</div>'
        c += lab('2. quantos tempos tem? some e escreva')
        itens = [('1 mínima + 2 semínimas', 4), ('4 colcheias', 2), ('1 semibreve + 1 semínima', 5), ('2 semínimas + 2 colcheias', 3), ('1 mínima + 1 semínima + 2 colcheias', 4), ('8 semicolcheias', 2), ('1 semínima + 4 semicolcheias + 1 colcheia', 2.5), ('2 mínimas + 1 semibreve', 8)]
        c += '<div class="col2" style="gap:8px 14px">' + ''.join(f'<div class="box row" style="justify-content:space-between;padding:7px 12px;border-radius:12px;font-size:12.8px"><span>{t}</span><span class="bx" style="min-width:48px;height:30px;margin-left:8px">&nbsp;</span></div>' for t, _ in itens) + '</div>'
        c += lab('3. desafio: desenhe uma combinação que some 4 tempos')
        c += '<div class="box dash" style="height:110px"></div>'
        c += lab('4. e uma que some 3 tempos e meio')
        c += '<div class="box dash" style="height:90px"></div>'
        c += corner('timido', 60)
        L.gab('a2-conta', 'brincando de contar (pág. {pg})', 'ligue: mínima → 2 tempos · semínima → 1 tempo · semibreve → 4 tempos. somas: ' + ' · '.join(f'{i+1}: {tempos_txt(v)}' for i, (_, v) in enumerate(itens)) + '. desafios: resposta livre (confira se somam 4 e 3,5 tempos).')
        return c
    L.add('a2-conta', 'aula 2 · desafios', conta)

    PROB = [(['mi', 'sm'], ), (['sm', 'sm'], ), (['[', 'co', 'co', ']', 'sm'], ), (['mi'], ), (['sm', '[', 'co', 'co', ']', 'sm'], ), (['[', 'co', 'co', ']', '[', 'co', 'co', ']'], ), (['sm'], ), (['mi', '[', 'co', 'co', ']'], )]
    def compc(L):
        c = titulo('Complete o compasso', 'cada compasso tem 4 tempos: desenhe o que falta!', 600)
        c += '<p style="font-size:12.8px">Some os tempos que já estão escritos e <b>desenhe a(s) figura(s) que falta(m)</b> para fechar 4 tempos. Pode usar mais de um jeito!</p>'
        resp = []
        for i, (spec,) in enumerate(PROB):
            svg, tot = compasso(spec, width=210 + 20 * len([s for s in spec if s not in '[]']) * 2, scale=1)
            falta = 4 - tot / 16
            resp.append((i + 1, tempos_txt(falta)))
            c += (f'<div class="box row" style="gap:14px;padding:6px 14px;margin-bottom:8px;border-radius:14px"><span class="num" style="width:20px">{i+1}</span><div style="width:290px;flex:none">{svg}</div>'
                  f'<div class="box dash" style="flex:1;height:60px;border-radius:10px"></div><div style="width:80px;font-size:12px;text-align:right">falta:<br><span style="display:inline-block;width:56px;border-bottom:2px dotted #888">&nbsp;</span> t.</div></div>')
        c += corner('vibra', 62)
        L.gab('a2-comp', 'complete o compasso (pág. {pg})', 'o que falta (em tempos): ' + ' · '.join(f'{n}: {t}' for n, t in resp) + '. qualquer combinação que complete o total vale!')
        return c
    L.add('a2-comp', 'aula 2 · compassos', compc)
