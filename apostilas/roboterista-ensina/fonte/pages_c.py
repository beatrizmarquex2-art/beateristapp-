# -*- coding: utf-8 -*-
from base import *
from pages_a import FIG7, NOMES, VALOR, VALOR_N
from pages_b import tempos_txt, fmt
import random

def corner_(n, h=60):
    return corner(n, h)

def build(L):
    # =============== AULA 3 ===============
    def peca(L):
        c = titulo('Montando o desenho', 'toda figura é feita de 3 peças', 420)
        c += fala('olha só: toda figura é um quebra-cabeça de 3 peças! é só juntar do jeito certo.', 'oculos')
        cab = glyph(False, False, 0, 74) .replace('<line', '<line') if False else ''
        # cartões das peças
        vazio = f'<svg viewBox="0 0 40 30" width="76" height="58"><ellipse cx="20" cy="15" rx="15" ry="10.5" transform="rotate(-24 20 15)" fill="#fff" stroke="#111" stroke-width="3.6"/></svg>'
        cheio = f'<svg viewBox="0 0 40 30" width="76" height="58"><ellipse cx="20" cy="15" rx="15" ry="10.5" transform="rotate(-24 20 15)" fill="#111"/></svg>'
        haste = '<svg viewBox="0 0 30 80" width="30" height="110"><line x1="15" y1="4" x2="15" y2="76" stroke="#111" stroke-width="4"/></svg>'
        band = '<svg viewBox="0 0 40 70" width="56" height="100"><path d="M8,4 C10,20 30,22 28,42" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/><path d="M8,22 C10,38 30,40 28,60" fill="none" stroke="#111" stroke-width="5" stroke-linecap="round"/></svg>'
        cards = [('1', 'A CABEÇA', 'pode ser <b>vazia</b> (só o contorno) ou <b>cheia</b> (pintada).', f'<div class="col" style="display:flex;flex-direction:column;align-items:center;gap:8px;height:130px;justify-content:center">{vazio}{cheio}</div>'),
                 ('2', 'A HASTE', 'uma linha para cima. A semibreve é a única que <b>não tem haste</b>.', f'<div style="height:130px;display:flex;align-items:center;justify-content:center">{haste}</div>'),
                 ('3', 'AS BANDEIRINHAS', 'os “rabinhos” na ponta da haste. Cada um divide o valor <b>ao meio</b>.', f'<div style="height:130px;display:flex;align-items:center;justify-content:center">{band}</div>')]
        c += '<div class="col3" style="gap:12px">' + ''.join(f'<div class="box" style="border-radius:18px;padding:10px 14px"><div class="num" style="font-size:19px">{n}</div>{g}<div class="m" style="font-size:13px;margin:8px 0 4px">{t}</div><div style="font-size:12px">{d}</div></div>' for n, t, d, g in cards) + '</div>'
        c += box('<b>Regra de ouro:</b> cabeça <b>vazia</b> sem haste = semibreve · cabeça <b>vazia</b> com haste = mínima · cabeça <b>cheia</b> com haste = semínima · e cada <b>bandeirinha</b> divide o valor ao meio.', style='margin-top:12px;font-size:13px')
        c += '<div class="row" style="justify-content:space-around;margin:10px 0 2px">' + ''.join(f'<div class="center">{figura(n, 78)}<div style="font-size:10.5px;font-weight:700;margin-top:3px">{NOMES[n]}</div></div>' for n in FIG7) + '</div>'
        c += lab('treine as peças: trace as cabeças e as hastes')
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<div>{glyph(i % 2 == 0, True, 0, 78, "#111" if i == 0 else GHOST)}</div>' for i in range(8)) + '</div>'
        c += corner_('oculos')
        return c
    L.add('a3-peca', 'aula 3 · montar o desenho', peca)

    def rec(L):
        c = titulo('As receitas', 'como se monta cada figura', 300)
        recs = {'semibreve': 'cabeça vazia', 'minima': 'cabeça vazia + haste', 'seminima': 'cabeça cheia + haste', 'colcheia': 'cabeça cheia + haste + 1 bandeirinha', 'semicolcheia': 'cabeça cheia + haste + 2 bandeirinhas', 'fusa': 'cabeça cheia + haste + 3 bandeirinhas', 'semifusa': 'cabeça cheia + haste + 4 bandeirinhas'}
        for n in FIG7:
            c += (f'<div class="box row" style="gap:16px;padding:6px 16px;margin-bottom:8px;border-radius:16px"><div style="width:50px;flex:none">{figura(n, 70)}</div>'
                  f'<div style="flex:1"><div class="m" style="font-size:16px;text-transform:uppercase">{NOMES[n]}</div><b style="font-size:13.5px">receita: {recs[n]}</b><div style="font-size:12px">vale {VALOR[n]}</div></div>'
                  f'<div class="box dash" style="width:150px;height:62px;border-radius:10px;font-size:10px;padding:2px 6px;color:#555">desenhe você:</div></div>')
        c += corner_('feliz')
        return c
    L.add('a3-rec', 'aula 3 · receitas', rec)

    REC8 = [('cabeça vazia + haste', 'mínima'), ('cabeça cheia + haste + 1 bandeirinha', 'colcheia'), ('cabeça vazia', 'semibreve'), ('cabeça cheia + haste', 'semínima'),
            ('cabeça cheia + haste + 3 bandeirinhas', 'fusa'), ('cabeça cheia + haste + 2 bandeirinhas', 'semicolcheia'), ('cabeça cheia + haste + 4 bandeirinhas', 'semifusa'), ('cabeça cheia + haste + 1 bandeirinha', 'colcheia')]
    def monte(L):
        c = titulo('Monte você!', 'leia a receita e desenhe a figura', 340)
        c += '<div class="col2" style="gap:10px">'
        for i, (r, n) in enumerate(REC8):
            c += f'<div class="box" style="padding:8px 12px;border-radius:14px"><div class="row" style="gap:8px"><span class="num">{i+1}</span><b style="font-size:12.8px">{r}</b></div><div class="box dash" style="height:88px;margin:6px 0;border-radius:10px"></div><div class="row" style="gap:6px;font-size:12px"><b>nome:</b><div class="dots" style="flex:1"></div></div></div>'
        c += '</div>'
        c += '<div class="g" style="font-size:19px;margin-top:12px">depois diga o nome de cada figura que você montou!</div>'
        c += corner_('amor')
        L.gab('a3-monte', 'monte você (pág. {pg})', ' · '.join(f'{i+1}: {n}' for i, (_, n) in enumerate(REC8)))
        return c
    L.add('a3-monte', 'aula 3 · monte você', monte)

    CERT = [('colcheia', [(False, True, 1), (False, True, 2), (True, True, 1)], 0),
            ('mínima', [(True, True, 0), (False, True, 0), (True, False, 0)], 0),
            ('semicolcheia', [(False, True, 1), (False, True, 2), (False, True, 3)], 1),
            ('semibreve', [(True, True, 0), (True, False, 0), (False, True, 0)], 1),
            ('semínima', [(True, True, 0), (False, True, 0), (False, True, 1)], 1),
            ('fusa', [(False, True, 3), (False, True, 2), (False, True, 4)], 0),
            ('semifusa', [(False, True, 4), (False, True, 3), (True, True, 1)], 0),
            ('colcheia', [(False, True, 0), (False, True, 1), (True, True, 0)], 1)]
    def cert(L):
        c = titulo('Qual está montado certinho?', 'circule o desenho correto', 520)
        resp = []
        for i, (nm, opts, ok) in enumerate(CERT):
            c += f'<div class="box row" style="padding:4px 16px;margin-bottom:7px;border-radius:16px;gap:14px"><div style="width:230px;flex:none"><span class="num">{i+1}.</span> <b class="m" style="font-size:15.5px;text-transform:uppercase">qual é a {nm}?</b></div>'
            for j, (v, h, f) in enumerate(opts):
                c += f'<div class="box" style="width:84px;height:80px;display:flex;flex-direction:column;align-items:center;padding:2px;border-radius:12px"><span style="font-size:11px;font-weight:800;align-self:flex-start;margin-left:6px">{"ABC"[j]}</span>{glyph(v, h, f, 58)}</div>'
            c += '</div>'
            resp.append('ABC'[ok])
        c += corner_('pensa')
        L.gab('a3-cert', 'qual está certinho? (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)))
        return c
    L.add('a3-cert', 'aula 3 · qual está certinho', cert)

    ERR = [('semínima', (True, True, 0), False, 'a cabeça deveria ser cheia'), ('colcheia', (False, True, 0), False, 'faltou 1 bandeirinha'),
           ('semibreve', (True, True, 0), False, 'a semibreve não tem haste'), ('mínima', (True, True, 0), True, 'está certa!'),
           ('semicolcheia', (False, True, 1), False, 'precisa de 2 bandeirinhas'), ('fusa', (False, True, 3), True, 'está certa!'),
           ('semínima', (False, True, 0), True, 'está certa!'), ('semifusa', (False, True, 3), False, 'faltou 1 bandeirinha (são 4)')]
    def erro(L):
        c = titulo('O Paul errou!', 'ache os erros nos desenhos do Paul', 400)
        c += fala('eu tentei desenhar as figuras sozinho, mas acho que errei algumas… você me ajuda a achar os erros e a corrigir?', 'duvida')
        c += '<div class="col2" style="gap:10px">'
        for i, (nm, (v, h, f), certo, _) in enumerate(ERR):
            c += (f'<div class="box" style="padding:8px 12px;border-radius:14px"><div class="row" style="gap:6px"><span class="num">{i+1}</span><b style="font-size:12.8px">o Paul desenhou uma <span class="m" style="text-transform:uppercase">{nm}</span>:</b></div>'
                  f'<div class="row" style="gap:14px;margin-top:2px"><div style="width:60px">{glyph(v, h, f, 76)}</div><div style="font-size:12.2px;line-height:1.8"><span class="ck"></span> está certo<br><span class="ck"></span> está errado: eu corrijo ao lado</div><div class="box dash" style="width:70px;height:72px;margin-left:auto;border-radius:8px"></div></div></div>')
        c += '</div>' + tip('lembre das <b>receitas</b>: cabeça + haste + bandeirinhas! confira cada peça antes de dizer se está certo.')
        c += corner_('timido')
        L.gab('a3-erro', 'o Paul errou! (pág. {pg})', ' · '.join(f'{i+1}: {"certo" if c_ else "errado, " + dsc}' for i, (_, _, c_, dsc) in enumerate(ERR)))
        return c
    L.add('a3-erro', 'aula 3 · ache o erro', erro)

    def pauta(L):
        c = titulo('Desenhe na pauta', 'escreva cada figura sobre a linha', 400)
        c += '<p>A <b>pauta</b> é o conjunto de linhas onde a música é escrita. Aqui vamos usar só <b>uma linha</b> (como na bateria). Desenhe a figura pedida em cada espacinho:</p>'
        rows = [('semínima', 4), ('colcheia', 4), ('mínima', 4), ('semibreve', 2), ('semicolcheia', 4), ('fusa', 4), ('semifusa', 4), ('1 mínima + 2 semínimas', 3)]
        for i, (t, n) in enumerate(rows):
            c += f'<div class="row" style="gap:12px;margin-bottom:6px"><span class="num" style="width:22px">{i+1}.</span><b style="width:150px;font-size:13px">{t} {"×%d" % n if "+" not in t else ""}</b><div class="row" style="gap:10px;flex:1">'
            c += ''.join(f'<div style="flex:1;height:56px;border:2px dotted #777;border-radius:6px;position:relative"><div style="position:absolute;left:0;right:0;top:36px;border-top:2px solid #111"></div></div>' for _ in range(n))
            c += '</div></div>'
        c += tip('na pauta de uma linha, a cabeça da nota fica <b>em cima da linha</b>, e a haste sobe!')
        c += corner_('oculos')
        return c
    L.add('a3-pauta', 'aula 3 · na pauta', pauta)

    def arte2(L):
        return f'<section class="page full"><img src="img/color2.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg("color2")}</span></div></section>'
    L.add('color2', 'para colorir', arte2, 'raw')

    # =============== AULA 4: PAUSAS ===============
    PAUSAS = {'semibreve': '4 tempos', 'minima': '2 tempos', 'seminima': '1 tempo', 'colcheia': 'meio tempo', 'semicolcheia': '¼ de tempo', 'fusa': '⅛ de tempo', 'semifusa': '1/16 de tempo'}
    def pausas(L):
        c = titulo('As pausas', 'o silêncio também tem desenho', 380)
        c += fala('shhh! na música, às vezes ninguém toca. esse silêncio tem nome: <b>pausa</b>. e cada figura tem a sua!', 'sono', 'r')
        c += '<p>A pausa dura <b>o mesmo tempo</b> da figura dela. O tempo continua andando; só não tocamos nada.</p>'
        c += '<div class="row" style="padding:0 16px;font-size:11.5px;font-weight:800;color:#444;gap:0"><span style="width:92px">figura</span><span style="width:92px">pausa</span><span style="flex:1">nome</span><span style="width:130px">silêncio de</span><span>fração</span></div>'
        for n in FIG7:
            c += (f'<div class="box row" style="padding:4px 16px;margin-bottom:6px;border-radius:14px"><div style="width:92px">{figura(n, 62)}</div><div style="width:92px">{figura(n, 62, rest=True)}</div>'
                  f'<div class="m" style="flex:1;font-size:15px;text-transform:uppercase">pausa de {NOMES[n]}</div><b style="width:130px;font-size:13.5px">{PAUSAS[n]}</b><span class="pill">1/{int(round(1/(VALOR_N[n]/4)))}</span></div>')
        c += tip('a pausa de <b>semibreve</b> fica <b>pendurada</b> na linha; a de <b>mínima</b> fica <b>sentada</b> em cima dela.')
        c += corner_('sono', 56)
        return c
    L.add('a4-pausas', 'aula 4 · as pausas', pausas)

    SIL = [['sm', 'sm', 'smp', 'sm'], ['sm', 'smp', 'sm', 'smp'], ['mi', 'smp', 'sm'], ['[', 'co', 'co', ']', 'smp', 'sm', 'sm'], ['smp', 'sm', 'smp', 'sm'], ['mip', 'sm', 'sm'], ['sm', 'sm', 'mip'], ['co', 'cop', 'co', 'cop', 'sm', 'sm']]
    def silencio(L):
        c = titulo('O jogo do silêncio', 'conte tudo, toque só as notas', 440)
        c += fala('o silêncio também é música! <b>conte</b> o tempo inteiro em voz alta, mas só <b>bata palmas</b> quando tiver uma nota. na pausa, abra as mãos no ar!', 'musica')
        c += '<p style="font-size:12.8px">Primeiro faça 4 batidas com as mãos. Na segunda rodada, <b>não toque a 3ª batida: ela virou pausa!</b> Agora leia cada compasso abaixo. Marque quando conseguir sem parar.</p>'
        for i, sp in enumerate(SIL):
            svg, tot = comp_c(sp, width=470)
            assert tot == 64, (sp, tot)
            c += f'<div class="row" style="gap:10px;margin-bottom:2px"><span class="num" style="width:22px;align-self:flex-start;margin-top:8px">{i+1}</span><div style="flex:1">{svg}</div><div style="font-size:11px;width:110px;text-align:right">palmas<br><span style="white-space:nowrap">{ck(4)}</span></div></div>'
        c += corner_('musica')
        return c
    L.add('a4-sil', 'aula 4 · jogo do silêncio', silencio)

    def trp(n_list, pid, idx):
        def f(L):
            c = titulo(f'Trace as pausas ({idx})', 'passe o lápis no cinza claro' if idx == 1 else 'as pausas das figuras rápidas', 440)
            for n in n_list:
                c += f'<div class="box" style="margin-bottom:12px;padding:10px 16px;border-radius:16px"><div class="m" style="font-size:15px;text-transform:uppercase">pausa de {NOMES[n]}</div><div style="font-size:12px">silêncio de {PAUSAS[n]}</div><div class="row" style="gap:22px;margin-top:2px;align-items:center">'
                for i in range(4):
                    c += f'<div style="width:62px;display:flex;justify-content:center;padding:6px 0">{figura(n, 84, "#111" if i == 0 else GHOST, rest=True)}</div>'
                c += '<div style="flex:1;display:flex;gap:26px;padding-top:30px"><div style="flex:1;border-bottom:2px dotted #888;height:10px"></div><div style="flex:1;border-bottom:2px dotted #888;height:10px"></div></div></div></div>'
            if idx == 1:
                c += tip('a pausa de <b>semibreve</b> fica <b>pendurada</b> na linha; a de <b>mínima</b> fica <b>sentada</b> em cima dela.')
            else:
                c += tip('quanto mais <b>“bolinhas”</b> a pausa tem, mais curto é o silêncio.', 'repare')
            return c + corner_('sono', 56)
        L.add(pid, 'aula 4 · traçar pausas', f)
    trp(['semibreve', 'minima', 'seminima', 'colcheia'], 'a4-tr1', 1)
    trp(['semicolcheia', 'fusa', 'semifusa'], 'a4-tr2', 2)

    def liguep(L):
        c = titulo('Ligue a figura à sua pausa', 'cada figura tem uma pausa do mesmo tamanho', 540)
        dire = ['semibreve', 'semifusa', 'seminima', 'fusa', 'colcheia', 'minima', 'semicolcheia']
        random.Random(7).shuffle(dire)
        for i, n in enumerate(FIG7):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:9px"><div class="box" style="flex:0 0 38%;height:82px;display:flex;align-items:center;gap:14px;padding:4px 18px;border-radius:16px"><div style="width:50px">{figura(n, 70)}</div></div>'
                  f'<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div><div style="width:15px;height:15px;border-radius:50%;background:#111;margin-right:10px"></div>'
                  f'<div class="box" style="flex:0 0 38%;height:82px;display:flex;align-items:center;justify-content:center;border-radius:16px">{figura(dire[i], 70, rest=True)}</div></div>')
        c += corner_('feliz')
        pos = {n: i + 1 for i, n in enumerate(dire)}
        L.gab('a4-lig', 'ligue a figura à sua pausa (pág. {pg})', ' · '.join(f'{NOMES[n]} → {pos[n]}ª pausa (de cima para baixo)' for n in FIG7))
        return c
    L.add('a4-lig', 'aula 4 · ligue', liguep)

    QS = [['mip', 'mip'], ['smp', 'smp', 'smp'], ['mip'], ['mip', 'smp', 'smp'], ['smp', 'cop', 'cop', 'mip'], ['cop', 'cop', 'cop', 'cop', 'sbp'], ['smp', 'mip', 'smp'], ['cop', 'cop', 'smp', 'scp', 'scp', 'cop']]
    VP = {'sb': 4, 'mi': 2, 'sm': 1, 'co': .5, 'sc': .25}
    NM = {'sb': 'semibreve', 'mi': 'minima', 'sm': 'seminima', 'co': 'colcheia', 'sc': 'semicolcheia'}
    def quanto(L):
        c = titulo('Quanto silêncio?', 'some o silêncio de cada linha', 440)
        c += '<p>Some o silêncio de cada linha e escreva o total de <b>tempos</b>. (Lembre: semibreve 4 · mínima 2 · semínima 1 · colcheia ½ · semicolcheia ¼)</p>'
        res = []
        for i, q in enumerate(QS):
            tot = sum(VP[t[:2]] for t in q)
            res.append(tempos_txt(tot))
            c += f'<div class="box row" style="gap:10px;padding:6px 16px;margin-bottom:8px;border-radius:14px"><span class="num" style="width:22px">{i+1}.</span><div class="row" style="gap:12px;flex:1">' + ''.join(figura(NM[t[:2]], 58, rest=True) for t in q) + '</div><div style="white-space:nowrap;font-weight:800;font-size:13px">total: <span style="display:inline-block;width:56px;border-bottom:2px solid #111">&nbsp;</span> t.</div></div>'
        c += corner_('musica')
        L.gab('a4-quanto', 'quanto silêncio? (pág. {pg})', ' · '.join(f'{i+1}: {t}' for i, t in enumerate(res)) + ' tempos.')
        return c
    L.add('a4-quanto', 'aula 4 · quanto silêncio', quanto)

    def pcomp(L):
        c = titulo('Figura ou pausa?', 'quem toca e quem descansa', 420)
        c += lab('1. circule F (figura: toca!) ou P (pausa: silêncio!)', True)
        seq = [('seminima', False), ('minima', True), ('colcheia', False), ('semibreve', True), ('seminima', True), ('semicolcheia', True), ('colcheia', True), ('semicolcheia', False), ('minima', False), ('fusa', True)]
        c += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px">'
        resp = []
        for i, (n, r) in enumerate(seq):
            c += f'<div class="box center" style="padding:6px 4px;border-radius:12px"><div class="row" style="justify-content:center;height:60px">{figura(n, 56, rest=r)}</div><div style="margin-top:4px"><span class="pill">F</span> <span class="pill">P</span></div></div>'
            resp.append('P' if r else 'F')
        c += '</div>'
        c += lab('2. complete o compasso com uma PAUSA: desenhe a pausa que falta')
        PR = [(['sm', 'sm', 'sm'], 'pausa de semínima'), (['mi'], 'pausa de mínima (ou 2 de semínima)'), (['sm', 'sm', 'mi'], 'nada! já está completo... ou não? (falta 0)'), (['[', 'co', 'co', ']', 'sm', 'sm'], 'pausa de semínima'), (['sm', 'mi'], 'pausa de semínima'), (['sm', '[', 'co', 'co', ']', 'sm'], 'pausa de semínima')]
        PR = [PR[0], PR[1], PR[3], PR[4], PR[5]]
        for i, (sp, ans) in enumerate(PR):
            svg, tot = comp_c(sp, width=380)
            c += f'<div class="box row" style="gap:12px;padding:3px 14px;margin-bottom:6px;border-radius:14px"><span class="num" style="width:20px">{i+1}</span><div style="width:340px;flex:none">{svg}</div><div class="box dash" style="flex:1;height:50px;border-radius:10px"></div></div>'
        c += lab('3. desafio do silêncio')
        c += box('Toque só nos tempos <b>1 e 3</b> e faça <b>pausa no 2 e no 4</b>. Desenhe o compasso:', style='font-size:13px') + '<div class="box dash" style="height:56px;margin-top:6px"></div>'
        c += corner_('feliz')
        L.gab('a4-comp', 'figura ou pausa? (pág. {pg})', ' · '.join(f'{i+1}: {r}' for i, r in enumerate(resp)) + '. completar compassos: ' + ' · '.join(f'{i+1}: {a}' for i, (_, a) in enumerate(PR)) + '. desafio: semínima, pausa de semínima, semínima, pausa de semínima.')
        return c
    L.add('a4-comp', 'aula 4 · desafios', pcomp)

    # =============== AULA 5: O PONTINHO ===============
    def ponto(L):
        c = titulo('Aula 5: o pontinho', 'um bônus que a figura ganha', 400)
        c += fala('esse pontinho ao lado da nota é o <b>ponto de aumento</b>. ele é um bônus: faz a figura valer <b>metade a mais</b> do que ela já vale!', 'amor')
        c += box('<div class="center m" style="font-size:19px">VALOR + METADE DO VALOR</div>', style='margin-bottom:10px;background:#fff')
        linhas = [('minima', 'mínima pontuada', '2 + 1 = 3 tempos', '1 · 2 · 3', 3), ('seminima', 'semínima pontuada', '1 + ½ = 1 tempo e meio', 'dura 3 colcheias: 1 &amp; 2', 1.5), ('colcheia', 'colcheia pontuada', '½ + ¼ = ¾ de tempo', '1 (e) (&amp;) a', .75), ('semibreve', 'semibreve pontuada', '4 + 2 = 6 tempos', '(ocupa mais de um compasso de 4/4)', 6)]
        for n, nm, soma, cont, v in linhas:
            c += (f'<div class="box row" style="gap:16px;padding:8px 16px;margin-bottom:8px;border-radius:16px"><div style="width:90px;flex:none;display:flex;gap:2px;align-items:flex-end">{figura(n, 70, dot=True)}</div>'
                  f'<div style="flex:1"><div class="m" style="font-size:15.5px;text-transform:uppercase">{nm}</div><b style="font-size:14px">{soma}</b><div style="font-size:12px;color:#444">{cont}</div></div>'
                  f'<div style="width:190px"><div style="height:18px;border:2px solid #111;background:linear-gradient(90deg,#111 {min(v/6,1)*100:.1f}%,#fff {min(v/6,1)*100:.1f}%)"></div><div class="cap">comparado com 6 tempos</div></div></div>')
        c += lab('o pontinho na prática')
        svg, _ = comp_c(['mi.', 'sm'], width=520)
        c += f'<div class="box" style="padding:8px 14px">{svg}<div style="font-size:12.5px;margin-top:2px">mínima pontuada (3 tempos) + semínima (1 tempo) = <b>4 tempos</b>: um compasso completo!</div></div>'
        c += tip('o pontinho vem <b>sempre do lado direito</b> da cabeça da nota. se a figura vale 2, o ponto vale 1. se vale 1, o ponto vale ½.')
        c += corner_('amor')
        return c
    L.add('a5-ponto', 'aula 5 · o pontinho', ponto)

    PT = [(['mi.', 'sm'], 4), (['sm.', 'co', 'mi'], 4), (['mi.', 'co', 'co'], 4), (['sm.', 'co', 'sm', 'sm'], 4), (['[', 'co.', 'sc', ']', 'sm', 'mi'], 4), (['mi.', 'sm.'], 4.5), (['sm.', 'sm.', 'sm'], 4), (['mi.', 'mi.'], 6)]
    def prat(L):
        c = titulo('Pratique o pontinho', 'some, leia e toque', 400)
        c += lab('1. este compasso 4/4 está certo? conte e marque', True)
        res = []
        for i, (sp, tot) in enumerate(PT):
            svg, pos = comp_c(sp, width=330)
            tv = pos / 16
            assert abs(tv - tot) < 1e-9, (sp, tv)
            ok = abs(tv - 4) < 1e-9
            res.append((i + 1, tempos_txt(tv), 'certo' if ok else ('passou' if tv > 4 else 'faltou')))
        # separa: linhas 1-8 conferência; mostra em grade de 2 colunas
        c += '<div class="col2" style="gap:8px 12px">'
        for i, (sp, tot) in enumerate(PT):
            svg, pos = comp_c(sp, width=330)
            c += f'<div class="box" style="padding:6px 10px;border-radius:14px"><div class="row" style="gap:6px"><span class="num">{i+1}</span><div style="flex:1;font-size:11.5px;text-align:right"><span class="ck"></span> certo &nbsp;<span class="ck"></span> errado &nbsp; total: <span style="display:inline-block;width:34px;border-bottom:2px dotted #888">&nbsp;</span></div></div>{svg}</div>'
        c += '</div>'
        c += lab('2. bata palmas lendo (conte 1 e & a)')
        for sp in [['mi.', 'sm'], ['sm.', 'co', 'sm', 'sm'], ['[', 'co.', 'sc', ']', 'sm', 'mi']]:
            svg, pos = comp_c(sp, width=520, sub=True)
            c += f'<div class="row" style="gap:10px"><div style="flex:1">{svg}</div><div style="font-size:11px;width:92px;text-align:right">palmas<br>{ck(4)}</div></div>'
        c += corner_('musica')
        L.gab('a5-prat', 'pratique o pontinho (pág. {pg})', ' · '.join(f'{n}: {t} tempos ({s})' for n, t, s in res) + '.')
        return c
    L.add('a5-prat', 'aula 5 · pratique', prat)
