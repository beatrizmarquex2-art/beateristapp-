# -*- coding: utf-8 -*-
from base import *
from pages_a import FIG7, NOMES, VALOR, VALOR_N
from pages_b import tempos_txt
from jogos import make_search, make_cross
import random

def search_html(g, cell=36, sol=None, small=False):
    fs = 22 if not small else 11
    h = '<table style="border-collapse:collapse;margin:0 auto">'
    for r, row in enumerate(g):
        h += '<tr>'
        for c, ch in enumerate(row):
            on = sol and (r, c) in sol
            bg = 'background:#ddd;' if on else ''
            fw = 900 if on else (700 if not small else 400)
            col = '#111' if (on or not small) else '#aaa'
            bd = '1.6px solid #111' if not small else '1px solid #ccc'
            h += f'<td style="width:{cell}px;height:{cell}px;text-align:center;font-weight:{fw};font-size:{fs}px;border:{bd};{bg}color:{col}">{ch}</td>'
        h += '</tr>'
    return h + '</table>'

def build(L):
    # ===================== CAÇA-PALAVRAS =====================
    def caca(pid, titulo_, sub_, words, seed, extra='', corner_nome='pensa', nota=''):
        def f(L):
            g, sol = make_search(words, 14, seed)
            c = titulo(titulo_, sub_, 460)
            c += '<div class="center" style="margin:6px 0 10px">' + search_html(g, 38) + '</div>'
            c += lab('palavras para achar:')
            c += '<div class="col4" style="gap:8px 12px;font-weight:700;font-size:13px">' + ''.join(f'<div><span class="ck"></span> {w}</div>' for w in sorted(words)) + '</div>'
            c += f'<p class="cap" style="margin-top:10px">{nota or "as palavras podem estar na horizontal, na vertical, na diagonal ou de trás para frente."}</p>'
            c += extra
            c += corner(corner_nome, 60)
            allsol = set()
            for w, cells in sol.items(): allsol |= set(cells)
            L.gab(pid, titulo_ + ' (pág. {pg})', 'GRID::' + pid, kind='grid')
            L.gridsol = getattr(L, 'gridsol', {})
            L.gridsol[pid] = (g, allsol)
            return c
        L.add(pid, 'jogos · caça-palavras', f)
    caca('j-caca1', 'Caça-palavras: o ritmo', 'ache as 12 palavras das aulas', ['COLCHEIA', 'FUSA', 'MINIMA', 'PAUSA', 'PULSO', 'SEMIBREVE', 'SEMICOLCHEIA', 'SEMIFUSA', 'SEMINIMA', 'SEXTINA', 'TEMPO', 'TERCINA'], 3)
    caca('j-caca2', 'Caça-palavras: a bateria', 'encontre os nomes das peças e dos acessórios', ['BUMBO', 'CAIXA', 'CHIMBAL', 'SURDO', 'PRATO', 'BAQUETA', 'CAJON', 'METRONOMO', 'PAD', 'TOM', 'RIDE', 'CRASH'], 5, corner_nome='feliz')
    caca('j-caca3', 'Caça-palavras: tocando de verdade', 'palavras de teoria e de bateria', ['COMPASSO', 'PONTO', 'ACENTO', 'LEVADA', 'ROCK', 'RUDIMENTO', 'PARADIDDLE', 'ANDAMENTO', 'PALMAS', 'BPM'], 9, corner_nome='oculos')

    # ===================== CRUZADINHAS =====================
    def cruz(pid, titulo_, sub_, entries, seed):
        def f(L):
            norm, pl, starts, H, W = make_cross(entries, seed=seed)
            cell = 36 if W <= 12 else 32
            c = titulo(titulo_, sub_, 460)
            c += '<div class="row" style="gap:18px;align-items:flex-start">'
            t = '<table style="border-collapse:collapse;flex:none">'
            for r in range(H):
                t += '<tr>'
                for cc in range(W):
                    if (r, cc) in norm:
                        n = starts.get((r, cc))
                        t += f'<td style="width:{cell}px;height:{cell}px;border:2px solid #111;background:#fff;position:relative;vertical-align:top;font-size:9.5px;font-weight:700;padding:1px 2px">{n if n else ""}</td>'
                    else:
                        t += f'<td style="width:{cell}px;height:{cell}px;border:none"></td>'
                t += '</tr>'
            t += '</table>'
            # dicas
            hor = sorted([(starts[(p[2], p[3])], p[1], len(p[0])) for p in pl if p[4] == 'h'])
            ver = sorted([(starts[(p[2], p[3])], p[1], len(p[0])) for p in pl if p[4] == 'v'])
            dc = '<div style="flex:1;min-width:0">'
            dc += '<div class="m" style="font-size:14px;margin-bottom:3px">HORIZONTAIS</div>' + ''.join(f'<div style="font-size:11.5px;margin-bottom:3px"><b>{n}.</b> {cl} <span class="gray">({l})</span></div>' for n, cl, l in hor)
            dc += '<div class="m" style="font-size:14px;margin:10px 0 3px">VERTICAIS</div>' + ''.join(f'<div style="font-size:11.5px;margin-bottom:3px"><b>{n}.</b> {cl} <span class="gray">({l})</span></div>' for n, cl, l in ver)
            dc += '</div>'
            c += t + dc + '</div>'
            c += f'<p class="cap" style="margin-top:12px">o número entre parênteses é a quantidade de letras (sem acentos). preencha um quadradinho por letra.</p>'
            c += corner('pensa', 60)
            # gabarito: grade preenchida
            gh = '<table style="border-collapse:collapse">'
            for r in range(H):
                gh += '<tr>'
                for cc in range(W):
                    if (r, cc) in norm:
                        gh += f'<td style="width:17px;height:17px;border:1.2px solid #111;text-align:center;font-size:10.5px;font-weight:800">{norm[(r,cc)]}</td>'
                    else:
                        gh += '<td style="width:17px;height:17px"></td>'
                gh += '</tr>'
            gh += '</table>'
            L.gab(pid, titulo_ + ' (pág. {pg})', gh, kind='html')
            return c
        L.add(pid, 'jogos · cruzadinha', f)
    cruz('j-cruz1', 'Cruzadinha musical', 'use as dicas e preencha os quadradinhos', [
        ('TERCINA', '3 notas no tempo de 2'), ('PULSO', 'o batimento constante da música'), ('SEMIBREVE', 'a figura que vale 4 tempos'), ('PAUSA', 'o desenho do silêncio'),
        ('SEMIFUSA', 'a menor figura: 1/16 de tempo'), ('COLCHEIA', 'vale meio tempo'), ('SEMINIMA', 'vale 1 tempo: a nossa medida'), ('MINIMA', 'vale 2 tempos'),
        ('FUSA', 'vale 1/8 de tempo'), ('SEXTINA', '6 notas dentro de um tempo'), ('COMPASSO', 'grupo de 4 tempos')], 1)
    cruz('j-cruz2', 'Cruzadinha da bateria', 'responda às dicas e escreva as palavras', [
        ('BAQUETA', 'objeto usado para bater nos tambores'), ('BUMBO', 'tambor grave tocado com pedal'), ('CAIXA', 'tambor com esteira, usado no backbeat'), ('CAJON', 'caixa de madeira percussiva'),
        ('BATERIA', 'conjunto com tambores, pratos e pedais'), ('PRATO', 'peça de metal que produz som ao tocar'), ('PAD', 'superfície para praticar as mãos'), ('CHIMBAL', 'dois pratos acionados com o pé'),
        ('SURDO', 'tambor grande de apoio do kit'), ('METRONOMO', 'aparelho que marca o pulso')], 4)
    cruz('j-cruz3', 'Cruzadinha desafio', 'agora com palavras de teoria e de levadas', [
        ('LEVADA', 'o ritmo que o baterista repete sem parar'), ('PONTO', 'faz a figura valer metade a mais'), ('ACENTO', 'toque mais forte que os outros'), ('PARADIDDLE', 'rudimento D E D D'),
        ('ANDAMENTO', 'a velocidade da música'), ('RUDIMENTO', 'exercício de mãos do baterista'), ('PALMAS', 'ritmo feito sem instrumento'), ('ROCK', 'estilo da primeira levada do livro')], 7)

    # ===================== COMPLETE AS CONTAS =====================
    CONV = [('1 semibreve', 'mínimas', 2), ('1 mínima', 'semínimas', 2), ('1 semínima', 'colcheias', 2), ('1 colcheia', 'semicolcheias', 2), ('1 semibreve', 'semínimas', 4), ('1 mínima', 'colcheias', 4),
            ('1 semínima', 'semicolcheias', 4), ('2 mínimas', 'semibreve', 1), ('4 colcheias', 'semínimas', 2), ('8 semicolcheias', 'semínimas', 2), ('1 semicolcheia', 'fusas', 2), ('1 fusa', 'semifusas', 2)]
    SUMS = [(['mi', 'sm', 'sm'], 4), (['sm', 'co', 'co', 'mi'], 4), (['co', 'co', 'co', 'co', 'mi'], 4), (['sb'], 4), (['sm', 'sm', 'co', 'co'], 3), (['mi', 'sm'], 3)]
    def contas(L):
        c = titulo('Complete as contas', 'quanto cabe em quanto?', 400)
        c += '<div class="col2" style="gap:8px 12px">' + ''.join(f'<div class="box row" style="padding:7px 12px;border-radius:12px;font-size:13.2px"><b>{a} =</b><span style="display:inline-block;width:42px;border-bottom:2px solid #111;margin:0 8px">&nbsp;</span>{b}</div>' for a, b, _ in CONV) + '</div>'
        c += lab('compasso certinho: some os tempos (4 por compasso). o compasso está completo?')
        names = {'sb': 'semibreve', 'mi': 'minima', 'sm': 'seminima', 'co': 'colcheia'}
        res = []
        for i, (sp, tot) in enumerate(SUMS):
            c += f'<div class="box row" style="gap:10px;padding:4px 14px;margin-bottom:7px;border-radius:14px"><span class="num" style="width:20px">{i+1}</span><div class="row" style="gap:6px;flex:1">' + ''.join(figura(names[t], 52) for t in sp) + '</div><div style="font-size:12.5px;font-weight:700;white-space:nowrap">total: <span style="display:inline-block;width:46px;border-bottom:2px solid #111">&nbsp;</span> t. &nbsp; <span class="ck"></span> completo <span class="ck"></span> não</div></div>'
            res.append((i + 1, tempos_txt(tot), 'completo' if tot == 4 else 'incompleto'))
        L.gab('j-contas', 'complete as contas (pág. {pg})', ' · '.join(f'{a} = {r}' for a, _, r in CONV) + '. compassos: ' + ' · '.join(f'{n}: {t} ({s})' for n, t, s in res) + '.')
        c += corner('feliz', 56)
        return c
    L.add('j-contas', 'jogos · contas', contas)

    # ===================== CÓDIGO SECRETO =====================
    KEY = [('semibreve', False, 'P'), ('minima', False, 'A'), ('seminima', False, 'U'), ('colcheia', False, 'L'), ('semicolcheia', False, 'T'), ('fusa', False, 'O'), ('semifusa', False, 'C'),
           ('semibreve', True, 'B'), ('minima', True, 'E'), ('seminima', True, 'R'), ('colcheia', True, 'I'), ('semicolcheia', True, 'S'), ('fusa', True, 'D')]
    MAP = {k[2]: (k[0], k[1]) for k in KEY}
    def codigo(L):
        c = titulo('A mensagem secreta do Paul', 'decifre usando a chave', 520)
        c += fala('eu escondi duas mensagens usando figuras e pausas no lugar das letras! use a <b>chave</b> para decifrar e escreva as letras embaixo.', 'oculos', 'r')
        c += lab('a chave do código', True)
        c += '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:6px">' + ''.join(f'<div class="box center" style="padding:3px 2px;border-radius:10px"><div style="display:flex;justify-content:center;height:50px;align-items:center">{figura(n, 46, rest=r)}</div><div class="m" style="font-size:19px">{l}</div></div>' for n, r, l in KEY) + '</div>'
        def msg(txt, title):
            h = lab(title)
            h += '<div style="display:flex;flex-wrap:wrap;gap:14px 26px">'
            for w in txt.split():
                h += '<div style="display:flex;gap:4px">' + ''.join(f'<div class="center"><div style="height:50px;display:flex;align-items:center;justify-content:center;width:34px">{figura(MAP[ch][0], 46, rest=MAP[ch][1])}</div><div style="border-bottom:2px solid #111;height:26px;width:30px;margin:0 auto"></div></div>' for ch in w) + '</div>'
            return h + '</div>'
        c += msg('PAUL TOCA BATERIA', 'mensagem 1')
        c += msg('ESTUDE TODO DIA', 'mensagem 2')
        c += lab('mensagem 3: crie a sua!')
        c += box('Escreva uma palavrinha secreta usando figuras e pausas da chave e peça para um amigo decifrar.', style='font-size:13px') + '<div class="box dash" style="height:70px;margin-top:6px"></div>'
        L.gab('j-codigo', 'a mensagem secreta do Paul (pág. {pg})', 'mensagem 1: PAUL TOCA BATERIA · mensagem 2: ESTUDE TODO DIA.')
        c += corner('oculos', 56)
        return c
    L.add('j-codigo', 'jogos · código secreto', codigo)

    # ===================== PROVA DO PAUL =====================
    Q1 = [('Quanto vale a semínima?', ['1 tempo', '2 tempos', 'meio tempo'], 0), ('Qual figura vale 4 tempos?', ['mínima', 'semibreve', 'colcheia'], 1), ('Quantas colcheias cabem em 1 semínima?', ['2', '4', '8'], 0),
          ('Quantas semicolcheias cabem em 1 tempo?', ['2', '4', '6'], 1), ('O que o 4/4 quer dizer?', ['4 tempos por compasso, e a semínima vale 1', '4 compassos por música', '44 batidas por minuto'], 0),
          ('O ponto de aumento faz a figura valer:', ['o dobro', 'metade a mais', 'nada'], 1), ('Quantos tempos vale uma mínima pontuada?', ['2', '3', '4'], 1), ('A pausa de semínima dura:', ['1 tempo', '2 tempos', 'meio tempo'], 0),
          ('Qual é a pausa mais longa?', ['pausa de semínima', 'pausa de semibreve', 'pausa de colcheia'], 1), ('Qual rudimento é D E D D?', ['paradiddle', 'toque duplo', 'toque simples'], 0)]
    Q2 = [('A tercina coloca:', ['2 notas no tempo de 3', '3 notas no tempo de 2', '4 notas no tempo de 1'], 1), ('Quantas notas tem a sextina?', ['4', '6', '8'], 1), ('BPM significa:', ['batidas por minuto', 'bumbo por metrônomo', 'baquetas por música'], 0),
          ('Qual peça é tocada com o pé?', ['caixa', 'bumbo', 'ride'], 1), ('Na levada de rock do livro, a caixa toca nos tempos:', ['1 e 3', '2 e 4', 'todos'], 1), ('Na contagem 1 e & a, a 2ª casinha se chama:', ['e', '&', 'a'], 0)]
    def provaq(qs, start):
        h = ''
        for i, (q, opts, ok) in enumerate(qs):
            h += f'<div class="box" style="padding:5px 14px;margin-bottom:6px;border-radius:14px"><div style="font-size:13.2px;font-weight:800"><span class="num">{start+i}.</span> {q}</div><div class="row" style="gap:18px;margin-top:4px;flex-wrap:wrap">' + ''.join(f'<span style="font-size:12.8px"><span class="ck r"></span> {"ABC"[j]}) {o}</span>' for j, o in enumerate(opts)) + '</div></div>'
        return h
    def prova1(L):
        c = titulo('A prova do Paul (1)', 'marque a resposta certa: 10 perguntas', 460)
        c += '<p style="font-size:12.8px">Leia com calma e <b>circule</b> a resposta certa. Pode consultar o livro! No final você descobre o seu título.</p>'
        c += provaq(Q1, 1)
        c += box('<div class="row" style="gap:20px"><b>nome:</b><div class="dots" style="flex:1"></div><b>data:</b><div class="dots" style="width:120px"></div></div>', style='margin-top:6px')
        L.gab('j-prova1', 'a prova do Paul (pág. {pg})', ' · '.join(f'{i+1}: {"ABC"[ok]}' for i, (_, _, ok) in enumerate(Q1)) + ' · ' + ' · '.join(f'{10+i+1}: {"ABC"[ok]}' for i, (_, _, ok) in enumerate(Q2)) + ' · 17: B · 18: B · 19: B · 20: B.')
        c += corner('pensa', 56)
        return c
    L.add('j-prova1', 'jogos · a prova do Paul', prova1)
    def prova2(L):
        c = titulo('A prova do Paul (2)', 'agora com figuras e desenhos', 460)
        c += provaq(Q2, 11)
        # visuais
        vis = [(17, 'Que figura é essa?', figura('colcheia', 58), ['semicolcheia', 'colcheia', 'fusa'], ''), (18, 'Que pausa é essa?', figura('minima', 58, rest=True), ['pausa de semibreve', 'pausa de mínima', 'pausa de semínima'], ''),
               (19, 'Quanto vale essa figura?', figura('seminima', 58, dot=True), ['1 tempo', '1 tempo e meio', '2 tempos'], ''),
               (20, 'O que é esse desenho?', rhythm([(0, 8, 'n'), (16 / 3, 8, 'n'), (32 / 3, 8, 'n')], beams=[[0, 1, 2]], width=170, total=16, tuplets=[(0, 2, 3)]), ['sextina', 'tercina', '3 colcheias normais'], '')]
        for n, q, g, opts, _ in vis:
            c += f'<div class="box row" style="padding:2px 14px;margin-bottom:6px;border-radius:14px;gap:14px"><div style="width:90px;flex:none;display:flex;justify-content:center">{g}</div><div style="flex:1"><div style="font-size:13.2px;font-weight:800"><span class="num">{n}.</span> {q}</div><div class="row" style="gap:14px;margin-top:3px;flex-wrap:wrap">' + ''.join(f'<span style="font-size:12.5px"><span class="ck r"></span> {"ABC"[j]}) {o}</span>' for j, o in enumerate(opts)) + '</div></div></div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:6px">QUAL É O SEU TÍTULO? conte seus acertos:</div><div class="col2" style="font-size:13px;gap:3px 16px"><div><b>18 a 20:</b> Robôterista Mestre ★★★</div><div><b>13 a 17:</b> Robôterista de Ouro ★★</div><div><b>8 a 12:</b> Robôterista Aprendiz ★</div><div><b>0 a 7:</b> releia as aulas e tente de novo!</div></div><div class="row" style="gap:10px;margin-top:8px"><b>meus acertos:</b><div class="dots" style="width:70px"></div><b>meu título:</b><div class="dots" style="flex:1"></div></div>', style='margin-top:4px')
        c += corner('vibra', 56)
        return c
    L.add('j-prova2', 'jogos · a prova do Paul', prova2)
