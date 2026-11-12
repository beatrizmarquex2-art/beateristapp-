# -*- coding: utf-8 -*-
from mcommon import *
from m_d import card_acorde
import random

TRIADES = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'Cm', 'Dm', 'Em', 'Fm', 'Gm', 'Am', 'Bm']

def notas_acorde(n):
    return ' · '.join(x for x in CHORD_KB[n][1].split(' · '))

def acorde_svg_small(n):
    return mel.acorde(n, 80)

def card_kb(n, W=18, H=70, lo='C4', hi='G5', nomes=True):
    notas, txt = CHORD_KB[n]
    return (f'<div class="box center" style="padding:5px 6px;border-radius:14px"><div class="cf" style="font-size:19px;line-height:1">{n}</div>'
            f'{chord_kb(n, W=W, H=H, lo=lo, hi=hi)}<div style="font-size:10.5px;font-weight:700">{txt}</div></div>')

def build(L):
    # ============== AULA 8: ACORDES DE TECLADO ==============
    def acorde(L):
        c = titulo('Aula 8: acordes de teclado', 'três teclas juntas: 1 · 3 · 5', 480)
        c += fala('um <b>acorde</b> de teclado tem <b>3 notas</b>: a <b>1ª</b> (a que dá o nome), a <b>3ª</b> e a <b>5ª</b>. a receita é: <b>toca uma, pula uma, toca uma, pula uma, toca uma</b>!', 'oculos', 'r')
        c += '<div class="center">' + chord_kb('C', W=60, H=124, lo='C4', hi='G4', names='syl') + '</div>'
        c += '<div class="row" style="justify-content:center;gap:22px;margin:6px 0 4px;font-size:15px;font-weight:800"><span><span class="num">1</span> dó</span><span><span class="num">3</span> mi</span><span><span class="num">5</span> sol</span></div>'
        c += box('<b>Receita do acorde (tríade):</b> tecla 1 → pule uma tecla branca → tecla 3 → pule uma tecla branca → tecla 5.<br><b>C = dó · mi · sol</b>. a cifra <b class="cf">C</b> é o nome do acorde, e a nota que o dá nome é a mais grave.', style='margin:8px 0;font-size:13px')
        c += lab('1. pinte o acorde de dó maior (C) no teclado: dó · mi · sol')
        c += '<div class="center">' + blank_kb(W=44, H=100, lo='C4', hi='C5') + '</div>'
        c += lab('2. pule uma tecla branca: complete as notas')
        qs = [('Dm', 'ré', 'fá', 'lá'), ('Em', 'mi', 'sol', 'si'), ('F', 'fá', 'lá', 'dó'), ('G', 'sol', 'si', 'ré'), ('Am', 'lá', 'dó', 'mi')]
        c += '<div class="col2" style="gap:6px 16px">' + ''.join(f'<div class="row" style="gap:8px;font-size:13.5px"><b class="cf" style="width:34px;font-size:17px">{n}</b><span>{a} ·</span><span class="dots" style="width:50px"></span><span>·</span><span class="dots" style="width:50px"></span></div>' for n, a, _, _ in qs) + '</div>'
        c += tip('usando só as <b>teclas brancas</b> e a receita, saem acordes <b>maiores</b> (C, F, G) e <b>menores</b> (Dm, Em, Am). nas próximas páginas você descobre a diferença!')
        L.gab('m8-acorde', 'acordes de teclado (pág. {pg})', 'C = dó mi sol (pintado: dó, mi, sol) · Dm = ré fá lá · Em = mi sol si · F = fá lá dó · G = sol si ré · Am = lá dó mi. (só teclas brancas: saem maiores ou menores sozinhos.)')
        return c + corner('oculos', 56)
    L.add('m8-acorde', 'aula 8 · acordes de teclado', acorde)

    def maior(L):
        c = titulo('Acordes maiores no teclado', 'a receita: 4 semitons + 3 semitons', 560)
        c += fala('o acorde <b>maior</b> soa <b>alegre</b>! a receita certa é: da 1ª para a 3ª são <b>4 semitons</b> (2 tons), e da 3ª para a 5ª são <b>3 semitons</b>.', 'vibra')
        c += '<div class="col2" style="gap:10px">' + ''.join(card_kb(n, 21, 82, 'C4', 'C5') for n in ['C', 'F', 'G']) + '<div class="box center" style="padding:8px;border-radius:14px;display:flex;flex-direction:column;justify-content:center"><div class="m" style="font-size:14px">RECEITA MAIOR</div><div style="font-size:30px;font-weight:900;line-height:1.1">4 + 3</div><div style="font-size:11.5px">semitons</div></div></div>'
        c += '<div class="col2" style="gap:10px;margin-top:10px">' + ''.join(card_kb(n, 21, 82, 'C4', 'C5' if n not in ('D', 'E', 'A', 'B') else 'G5') for n in ['D', 'E']) + '</div>'
        c += '<div class="col2" style="gap:10px;margin-top:10px">' + ''.join(card_kb(n, 21, 82, 'C4', 'G5') for n in ['A', 'B']) + '</div>'
        c += lab('toque e marque cada acorde maior')
        c += '<div class="row" style="flex-wrap:wrap;gap:8px 18px">' + ''.join(f'<span class="cf" style="font-size:15px">{n} {ck(2,"big")}</span>' for n in ['C', 'D', 'E', 'F', 'G', 'A', 'B']) + '</div>'
        c += lab('pense')
        c += '<div class="row" style="gap:10px;font-size:13px"><span>o acorde de <b>sol maior (G)</b> tem as notas:</span><div class="dots" style="flex:1"></div></div>'
        L.gab('m8-maior', 'acordes maiores no teclado (pág. {pg})', 'G = sol · si · ré.')
        return c + corner('vibra', 56)
    L.add('m8-maior', 'aula 8 · maiores', maior)

    def menor(L):
        c = titulo('Acordes menores no teclado', 'a receita: 3 semitons + 4 semitons', 560)
        c += fala('o acorde <b>menor</b> soa <b>mais triste</b> ou misterioso. a diferença é só <b>uma tecla</b>: a do meio desce um semitom!', 'timido')
        c += '<div class="col2" style="gap:10px">' + card_kb('C', 24, 90, 'C4', 'G4') + card_kb('Cm', 24, 90, 'C4', 'G4') + '</div>'
        c += '<div class="row" style="justify-content:space-around;margin:4px 0;font-size:13px"><b>C (maior): dó mi sol</b><span style="font-size:22px">→</span><b>Cm (menor): dó <u>mi♭</u> sol</b></div>'
        c += '<div class="col3" style="gap:10px;margin-top:10px">' + ''.join(card_kb(n, 17, 72, 'C4', 'G5') for n in ['Dm', 'Em', 'Am']) + '</div>'
        c += box('<b>Receita do menor:</b> da 1ª para a 3ª são <b>3 semitons</b>, e da 3ª para a 5ª são <b>4 semitons</b>. (o contrário do maior!)', style='margin-top:10px;font-size:13px')
        c += lab('maior ou menor? ouça no app e marque')
        for n in ['C', 'Am', 'G', 'Em', 'F', 'Dm']:
            c += f'<div class="row" style="gap:10px;margin-bottom:3px;font-size:13px"><b class="cf" style="width:34px">{n}</b><span class="ck big r"></span> maior &nbsp; <span class="ck big r"></span> menor</div>'
        L.gab('m8-menor', 'acordes menores no teclado (pág. {pg})', 'C maior · Am menor · G maior · Em menor · F maior · Dm menor (o “m” depois da letra indica menor).')
        return c + corner('timido', 56)
    L.add('m8-menor', 'aula 8 · menores', menor)

    def pinte(L):
        c = titulo('Pinte o acorde', 'leia o nome e pinte as 3 teclas', 400)
        alvo = ['C', 'G', 'F', 'Am', 'Em', 'D', 'Dm', 'A']
        c += '<div class="col2" style="gap:9px">'
        for i, n in enumerate(alvo):
            c += f'<div class="box center" style="padding:6px 8px;border-radius:14px"><span class="num" style="float:left">{i+1}</span><div class="cf" style="font-size:22px;line-height:1">{n}</div><div style="font-size:11.5px;font-weight:700">{FULL[n]}</div>{blank_kb(W=22, H=72, lo="C4", hi="G5")}</div>'
        c += '</div>'
        c += tip('lembre da receita: tecla 1 (o nome do acorde), pule uma tecla, tecla 3, pule uma tecla, tecla 5. se for menor, a do meio desce!')
        L.gab('m8-pinte', 'pinte o acorde (pág. {pg})', ' · '.join(f'{i+1}: {n} = {CHORD_KB[n][1]}' for i, n in enumerate(alvo)) + '.')
        return c + corner('feliz', 56)
    L.add('m8-pinte', 'aula 8 · pinte o acorde', pinte)

    def leia(L):
        c = titulo('Qual acorde é este?', 'leia as teclas pintadas e escreva o acorde', 520)
        rnd = random.Random(31)
        alvo = ['C', 'F', 'G', 'Am', 'Dm', 'Em', 'D', 'A', 'E', 'Gm']
        rnd.shuffle(alvo); alvo = alvo[:8]
        c += '<div class="col2" style="gap:9px">'
        for i, n in enumerate(alvo):
            c += f'<div class="box center" style="padding:6px 8px;border-radius:14px"><span class="num" style="float:left">{i+1}</span>{chord_kb(n, W=22, H=72, lo="C4", hi="G5", labels=True)}<div class="row" style="gap:8px;justify-content:center;margin-top:3px"><b style="font-size:12.5px">acorde:</b><div class="dots" style="width:60px"></div></div></div>'
        c += '</div>'
        c += tip('descubra o nome da <b>tecla 1</b> (o número 1). depois veja se a tecla do meio (3) é maior ou menor: se tiver uma preta no meio, pode ser menor!', 'como achar')
        L.gab('m8-leia', 'qual acorde é este? (pág. {pg})', ' · '.join(f'{i+1}: {n}' for i, n in enumerate(alvo)) + '.')
        return c + corner('ouve', 56)
    L.add('m8-leia', 'aula 8 · leia o acorde', leia)

    def mao(L):
        c = titulo('A mão no acorde', 'dedos 1 · 3 · 5 e as inversões simples', 520)
        c += fala('para tocar o acorde, use os dedos <b>1 (polegar)</b>, <b>3 (médio)</b> e <b>5 (mindinho)</b>. e sempre toque as 3 teclas <b>juntas</b>!', 'feliz')
        c += '<div class="col2" style="gap:12px"><div class="box center" style="padding:8px"><div class="cf" style="font-size:22px">C</div>' + chord_kb('C', 28, 86, 'C4', 'G4', names=None) + '<div class="row" style="justify-content:center;gap:16px;font-weight:900;margin-top:3px"><span>1</span><span>3</span><span>5</span></div></div><div class="box center" style="padding:8px"><div class="cf" style="font-size:22px">G</div>' + chord_kb('G', 28, 86, 'G4', 'D5', names=None) + '<div class="row" style="justify-content:center;gap:16px;font-weight:900;margin-top:3px"><span>1</span><span>3</span><span>5</span></div></div></div>'
        c += lab('mão esquerda toca os acordes, mão direita toca a melodia')
        c += '<div class="box" style="padding:6px 10px">' + staff([('E4', 'sm'), ('E4', 'sm'), ('F4', 'sm'), ('G4', 'sm')], width=600, gap=11, cifra_above={0: 'C', 2: 'G'}, tsig=True, labels='syl', show_final=False) + '<div style="font-size:12px;margin-top:2px">no <b>1</b> toque o acorde C com a esquerda, no <b>3</b> troque para o G.</div></div>'
        c += lab('treino 1: toque o acorde, solte, e toque de novo')
        c += '<div class="row" style="justify-content:space-around">' + ''.join(f'<div class="center"><div style="width:62px;height:62px;border:3px solid #111;border-radius:12px;font-family:Marker;font-size:30px;line-height:56px">{i}</div></div>' for i in range(1, 5)) + '</div>'
        c += lab('treino 2: C · G · Am · F, um acorde por compasso')
        c += '<div class="row" style="gap:8px;justify-content:space-around">' + ''.join(f'<div class="box center" style="flex:1;padding:6px;border-radius:14px"><div class="cf" style="font-size:24px">{n}</div>{chord_kb(n, W=14, H=50, lo="C4", hi="C5" if n in ("C","F") else "G5")}</div>' for n in ['C', 'G', 'Am', 'F']) + '</div>'
        c += '<div class="row" style="gap:12px;margin-top:8px;font-size:13px"><b>toquei:</b> ' + ck(6, 'big') + '</div>'
        return c + corner('feliz', 56)
    L.add('m8-mao', 'aula 8 · a mão no acorde', mao)

    def jogos8(L):
        c = titulo('Jogos de acordes', 'teclado e violão: a mesma harmonia', 560)
        c += lab('1. o mesmo acorde nos dois instrumentos: ligue', True)
        pares = ['C', 'G', 'Am', 'Em']
        for i, n in enumerate(pares):
            c += (f'<div style="display:flex;align-items:center;margin-bottom:6px"><div class="box center" style="flex:0 0 40%;padding:4px 6px;border-radius:14px">{chord_kb(n, W=18, H=52, lo="C4", hi="G5")}</div>'
                  f'<div style="width:13px;height:13px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:13px;height:13px;border-radius:50%;background:#111;margin-right:8px"></div>'
                  f'<div class="box center" style="flex:0 0 22%;padding:2px;border-radius:14px">{acorde_svg_small(["Em","Am","G","C"][i])}</div></div>')
        c += lab('2. harmonia no teclado: complete o quadro')
        c += '<table class="tbl" style="width:100%;font-size:13px"><tr style="background:#eee"><th>acorde</th><th>1ª nota</th><th>3ª nota</th><th>5ª nota</th><th>maior ou menor?</th></tr>'
        lin = [('C', 'dó', 'mi', 'sol', 'maior'), ('Am', 'lá', 'dó', 'mi', 'menor'), ('G', 'sol', 'si', 'ré', 'maior'), ('Dm', 'ré', 'fá', 'lá', 'menor'), ('F', 'fá', 'lá', 'dó', 'maior'), ('Em', 'mi', 'sol', 'si', 'menor')]
        for n, a, b, c_, t in lin:
            c += f'<tr><td class="cf" style="font-size:17px;text-align:center">{n}</td><td></td><td></td><td></td><td></td></tr>'
        c += '</table>'
        c += lab('3. violão ou teclado? onde o acorde é pintado com teclas, onde com bolinhas?')
        c += '<div class="row" style="gap:20px;justify-content:space-around;font-size:12.5px"><div class="center">' + chord_kb('G', W=14, H=50, lo="C4", hi="G5") + '<div class="row" style="justify-content:center;gap:8px"><span class="ck"></span> violão <span class="ck"></span> teclado</div></div><div class="center">' + acorde_svg_small('G') + '<div class="row" style="justify-content:center;gap:8px"><span class="ck"></span> violão <span class="ck"></span> teclado</div></div></div>'
        L.gab('m8-jogos', 'jogos de acordes (pág. {pg})', 'ligue: C → diagrama do C · G → G · Am → Am · Em → Em (confira as notas). quadro: ' + ' · '.join(f'{n}: {a}, {b}, {c_} ({t})' for n, a, b, c_, t in lin) + '. violão ou teclado: teclado · violão.')
        return c + corner('feliz', 56)
    L.add('m8-jogos', 'aula 8 · jogos', jogos8)

    # ============== AULA 9: HARMONIA ==============
    def campo(L):
        c = titulo('Aula 9: a família de acordes', 'acordes que se dão bem', 560)
        c += fala('os acordes têm <b>famílias</b>! numa canção, os acordes de uma família combinam entre si. a família de <b>dó maior</b> é a mais fácil: <b>C · Dm · Em · F · G · Am</b>.', 'amor', 'r')
        c += '<div class="row" style="justify-content:space-around;gap:8px">' + ''.join(f'<div class="box center" style="flex:1;padding:6px 3px;border-radius:12px"><div class="num" style="font-size:12px">{["I","II","III","IV","V","VI"][i]}</div><div class="cf" style="font-size:22px">{n}</div><div style="font-size:10px;font-weight:700">{FULL[n]}</div></div>' for i, n in enumerate(['C', 'Dm', 'Em', 'F', 'G', 'Am'])) + '</div>'
        c += box('<b>Os 3 acordes principais</b> (os mais usados em canções): <b class="cf">C</b> (I, “casa”), <b class="cf">F</b> (IV, “passeio”) e <b class="cf">G</b> (V, “tensão”: pede para voltar ao C). com eles dá para tocar centenas de músicas!', style='margin:10px 0;font-size:13px')
        c += lab('1. complete a família de dó maior')
        c += '<div class="row" style="justify-content:space-around;gap:6px">' + ''.join(f'<div class="box center" style="flex:1;height:50px;line-height:44px;font-family:Marker;font-size:18px;border-radius:10px">{t}</div>' for t in ['C', '', 'Em', '', 'G', '']) + '</div>'
        c += lab('2. família de sol maior (G · Am · Bm · C · D · Em)')
        c += '<div class="row" style="justify-content:space-around;gap:6px">' + ''.join(f'<div class="box center" style="flex:1;height:50px;line-height:44px;font-family:Marker;font-size:18px;border-radius:10px">{t}</div>' for t in ['G', '', 'Bm', '', 'D', '']) + '</div>'
        c += lab('3. os 3 principais da família de sol maior são: G · ___ · ___')
        c += '<div class="dots"></div>'
        c += lab('4. por que o G (V) “pede” o C?') + '<div class="dots"></div><div class="dots"></div>'
        L.gab('m9-campo', 'a família de acordes (pág. {pg})', 'dó maior: C Dm Em F G Am. sol maior: G Am Bm C D Em. principais de sol maior: G · C · D. o V cria tensão e a gente sente vontade de voltar ao I.')
        return c + corner('amor', 56)
    L.add('m9-campo', 'aula 9 · a família de acordes', campo)

    SEQ = [('C', 'Am', 'F', 'G'), ('C', 'G', 'Am', 'F'), ('Am', 'F', 'C', 'G'), ('Em', 'Am', 'D', 'G'), ('G', 'D', 'Em', 'C'), ('C', 'F', 'G', 'C')]
    def seqs(L):
        c = titulo('Sequências de acordes', 'quatro acordes, mil músicas', 520)
        c += fala('uma <b>sequência de acordes</b> (progressão) é uma receita de música. repetindo 4 acordes, dá para acompanhar qualquer melodia. escolha uma e toque em loop!', 'musica')
        for i, s in enumerate(SEQ):
            c += f'<div class="box" style="padding:4px 12px;margin-bottom:5px;border-radius:14px"><div class="row" style="justify-content:space-between"><span class="m" style="font-size:14px">SEQUÊNCIA {i+1}</span><span style="font-size:11.5px">toquei: {ck(4)}</span></div><div class="row" style="gap:6px">' + ''.join(f'<div class="box center" style="flex:1;padding:3px;border-radius:12px"><div class="cf" style="font-size:20px">{n}</div></div>' for n in s) + '</div><div style="font-size:11px;color:#555;margin-top:2px">4 batidas em cada acorde (ou use o padrão 2 da aula 7)</div></div>'
        c += lab('crie a sua sequência')
        c += '<div class="row" style="gap:6px">' + ''.join('<div class="box center" style="flex:1;height:52px;border-radius:12px"></div>' for _ in range(4)) + '</div>'
        c += '<div class="row" style="gap:10px;margin-top:6px"><b style="font-family:Gochi;font-size:17px">nome:</b><div class="dots" style="flex:1"></div></div>'
        c += tip('a sequência <b>C · Am · F · G</b> aparece em centenas de músicas dos anos 50 até hoje. é a favorita dos músicos!', 'curiosidade')
        return c + corner('musica', 56)
    L.add('m9-seq', 'aula 9 · sequências', seqs)

    def cifra(L):
        c = titulo('Ler a cifra de uma música', 'o acorde em cima da letra', 480)
        c += fala('a <b>cifra</b> de uma música mostra os acordes em cima da letra. quando a letra chega onde o acorde está escrito, é a hora de trocar!', 'oculos', 'r')
        c += '<div class="box" style="padding:12px 18px">' + cifra_line('[C]Dó, ré, mi, [F]fá, [G]sol, lá, [C]si', 18) + cifra_line('[C]Cante bem, [G]cante em [Am]paz, [F]vem [C]cantar', 18) + '</div>'
        c += lab('1. como ler')
        c += '<div class="col3" style="gap:8px;font-size:12.5px">' + box('<b>letra de cima</b> = o acorde que você toca.') + box('<b>letra de baixo</b> = o que se canta.') + box('o acorde <b>vale</b> até aparecer o próximo.') + '</div>'
        c += lab('2. coloque os acordes na letra (use C, F e G)')
        c += '<div class="box" style="padding:10px 16px"><div style="font-size:16px;line-height:2.2">estrelinha lá no céu <span class="dots" style="display:inline-block;width:80px"></span> vem brilhar<br>para mim e para você <span class="dots" style="display:inline-block;width:80px"></span></div></div>'
        c += lab('3. quantas trocas de acorde tem a cifra acima da 2ª linha? ') + '<div class="dots" style="width:80px"></div>'
        c += lab('4. cifra criativa: invente 2 frases e escolha os acordes')
        c += '<div class="box dash" style="height:100px"></div>'
        L.gab('m9-cifra', 'ler a cifra (pág. {pg})', 'a 2ª linha tem 5 acordes (C, G, Am, F, C), isto é, 4 trocas. colocar acordes: resposta livre (por exemplo C · F · G · C).')
        return c + corner('oculos', 56)
    L.add('m9-cifra', 'aula 9 · cifra', cifra)

    def cancao1(L):
        c = titulo('Canção 1: Meu primeiro violão', 'canção do Paul com 2 acordes: Em e Am', 560)
        c += fala('uma música de verdade com <b>só 2 acordes</b>! a letra e a melodia são originais do Paul. quem sabe você cria a sua versão?', 'vibra')
        c += '<div class="box" style="padding:12px 18px">'
        for l in ['[Em]Eu peguei o violão, [Am]vou afinar com atenção', '[Em]Seis cordas pra cantar, [Am]minha mão vai estudar', '[Em]Dó, ré, mi, no braço eu vou, [Am]toco um acorde, vou mais além', '[Em]Mi, lá, ré, sol, si, mi, [Am]toda música está aqui']:
            c += cifra_line(l, 15)
        c += '</div>'
        c += '<div class="col2" style="gap:12px;margin-top:10px">' + card_acorde('Em', 110, False, False) + card_acorde('Am', 110, False, False) + '</div>'
        c += box('<b>Batida sugerida:</b> padrão 2 (colcheias ↓↑), 1 compasso para cada acorde, a <b>70 BPM</b>. Repita a música inteira 2 vezes.', style='margin-top:10px;font-size:13px')
        c += '<div class="row" style="gap:12px;margin-top:8px;font-size:13px"><b>cantei e toquei:</b> ' + ck(5, 'big') + '</div>'
        return c + corner('vibra', 56)
    L.add('m9-c1', 'aula 9 · canção 1', cancao1)

    def cancao2(L):
        c = titulo('Canção 2: Dó-Sol-Lá menor', 'uma canção em ritmo de pop com 4 acordes', 560)
        c += fala('agora com <b>4 acordes</b>: C · G · Am · F (a sequência favorita dos músicos!). a letra e a melodia são originais do Paul.', 'amor')
        c += '<div class="box" style="padding:12px 18px">'
        for l in ['[C]Hoje o sol bateu na janela, [G]meu violão me chamou', '[Am]Cada acorde é uma tela, [F]que a minha mão desenhou', '[C]Eu toco, eu canto, eu sonho, [G]vou fazer minha canção', '[Am]Nota por nota, eu componho, [F]meu amor, minha emoção']:
            c += cifra_line(l, 15)
        c += '</div>'
        c += '<div class="col4" style="gap:8px;margin-top:10px">' + ''.join(card_acorde(n, 84, False, False) for n in ['C', 'G', 'Am', 'F']) + '</div>'
        c += box('<b>Batida sugerida:</b> padrão 3 (pop: ↓ ↓↑ ↑ ↓↑) a <b>80 BPM</b>. Quando o F for difícil, use o <b>F fácil</b> da página 50!', style='margin-top:10px;font-size:13px')
        c += lab('desafio do refrão')
        c += '<div class="row" style="gap:10px;font-size:13px"><span>troque o refrão e escreva uma frase sua:</span><div class="dots" style="flex:1"></div></div><div class="dots"></div>'
        c += '<div class="row" style="gap:12px;margin-top:8px;font-size:13px"><b>cantei e toquei:</b> ' + ck(5, 'big') + '</div>'
        return c + corner('amor', 56)
    L.add('m9-c2', 'aula 9 · canção 2', cancao2)

    def cancao3(L):
        c = titulo('Canção 3: Rock do Robô', 'com E, A e D: os acordes do rock!', 560)
        c += fala('o rock usa muito os acordes <b>E, A e D</b> (os de 3 dedos juntinhos!). pode tocar com palheta, forte e no pulso, e o amigo da bateria entra com a <b>levada de rock</b> do outro livro.', 'oculos', 'r')
        c += '<div class="box" style="padding:12px 18px">'
        for l in ['[E]Eu sou um robô de rock, [A]meu coração é um tambor', '[E]Tenho três acordes no bolso, [D]e um riff pra tocar com amor', '[E]E-A-D, vai de novo, [A]E-A-D, vai de novo', '[D]Quem toca junto não erra, [E]quem sorri, rock faz o povo']:
            c += cifra_line(l, 15)
        c += '</div>'
        c += '<div class="col3" style="gap:10px;margin-top:10px">' + ''.join(card_acorde(n, 96, False, False) for n in ['E', 'A', 'D']) + '</div>'
        c += box('<b>Batida sugerida:</b> padrão 2 (colcheias ↓↑) rápido, a <b>100 BPM</b>. Se tiver um amigo na bateria: <b>levada de rock da pág. 61 do Robôterista Ensina</b>. Os dois no mesmo pulso!', style='margin-top:10px;font-size:13px')
        c += lab('ensaio da banda')
        c += '<div class="col2" style="gap:10px;font-size:12.5px">' + box('<b>violão:</b> acordes e batida') + box('<b>bateria:</b> levada de rock') + '</div>'
        c += '<div class="row" style="gap:12px;margin-top:8px;font-size:13px"><b>toquei com banda:</b> ' + ck(5, 'big') + '</div>'
        return c + corner('oculos', 56)
    L.add('m9-c3', 'aula 9 · canção 3', cancao3)

    def juntos(L):
        c = titulo('Ritmo + melodia + harmonia', 'agora você sabe as 3 pernas da música!', 560)
        c += fala('chegou a hora de juntar tudo! uma <b>mão</b> toca a <b>melodia</b>, a outra o <b>acorde</b>, e a <b>bateria</b> marca o <b>ritmo</b>. é uma banda inteira!', 'vibra')
        c += lab('o mapa da banda')
        c += '<div class="col3" style="gap:10px">' + ''.join(f'<div class="box center" style="padding:10px;border-radius:18px"><div class="m" style="font-size:16px">{t}</div><div style="font-size:12px;margin:3px 0">{d}</div><div style="font-size:30px">{ic}</div></div>' for t, d, ic in [('RITMO', 'bateria e palmas', '🥁'), ('MELODIA', 'teclado, voz e flauta', '🎹'), ('HARMONIA', 'violão, guitarra e teclado', '🎸')]) + '</div>'
        c += lab('monte a sua banda: quem toca o quê?')
        c += '<table class="tbl" style="width:100%;font-size:13px"><tr style="background:#eee"><th>quem</th><th>instrumento</th><th>papel</th></tr>' + ''.join(f'<tr><td style="height:36px">{n}</td><td></td><td></td></tr>' for n in ['1', '2', '3', '4']) + '</table>'
        c += lab('qual música a banda vai tocar? escreva o plano')
        c += '<div class="row" style="gap:10px;font-size:13px"><b>música:</b><div class="dots" style="flex:1"></div></div><div class="row" style="gap:10px;font-size:13px"><b>acordes:</b><div class="dots" style="flex:1"></div><b>andamento:</b><div class="dots" style="width:70px"></div></div>'
        c += lab('checklist final')
        for t in ['sei o nome das 7 notas e as cifras', 'leio notas na pauta (clave de sol)', 'toco C, G, Am e F no violão ou no teclado', 'toco uma canção do Paul inteira', 'toquei com um amigo ou com a bateria']:
            c += f'<div style="margin-bottom:5px;font-size:13.2px"><span class="ck big"></span> {t}</div>'
        return c + corner('vibra', 56)
    L.add('m9-juntos', 'aula 9 · juntos', juntos)

    def arte4(L):
        return f'<section class="page full"><img src="img/color4.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>{FOOT}</span><span>{L.pg("color4")}</span></div></section>'
    L.add('color4', 'para colorir', arte4, 'raw')
