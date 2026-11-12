# -*- coding: utf-8 -*-
from mcommon import *
import random

ORDEM_CORDA = ['6ª', '5ª', '4ª', '3ª', '2ª', '1ª']

def card_acorde(nome, w=150, grande=False, mostrar_receita=True):
    t, fr, fi, br = ACORDES[nome]
    partes, soltas, mut = acorde_receita(nome)
    rec = ''
    if mostrar_receita:
        rec = '<ul style="padding-left:14px;font-size:11.2px;line-height:1.35;margin-top:4px">' + ''.join(f'<li>{p}</li>' for p in partes)
        if soltas: rec += f'<li>soltas: {", ".join(soltas)}</li>'
        if mut: rec += f'<li>não toque: {", ".join(mut)}</li>'
        rec += '</ul>'
    return (f'<div class="box" style="padding:8px 10px;border-radius:16px;text-align:center"><div class="cf" style="font-size:{34 if grande else 24}px;line-height:1">{nome}</div>'
            f'<div style="font-size:11.5px;font-weight:700;margin-bottom:2px">{t}</div>{acorde(nome, w)}{rec}</div>')

def build(L):
    # ============== AULA 6 ==============
    def diag(L):
        c = titulo('Aula 6: acordes de violão', 'como ler o diagrama de um acorde', 560)
        c += fala('um <b>acorde</b> é um grupo de notas tocadas juntas. no violão a gente usa um <b>diagrama</b>: um desenho do braço visto de frente, com as casas e as cordas!', 'oculos', 'r')
        c += '<div class="row" style="gap:20px;align-items:flex-start"><div style="width:230px;flex:none" class="box center">' + f'<div class="cf" style="font-size:34px">Em</div><div style="font-size:12px;font-weight:700">Mi menor</div>{acorde("Em", 190, labels_below=True)}' + '</div><div style="flex:1;font-size:13px">'
        itens = [('●', 'bolinha preta', 'coloque um dedo aqui, na casa e na corda indicadas.'), ('2', 'número na bolinha', 'diz qual dedo usar (1 indicador, 2 médio, 3 anelar, 4 mindinho).'), ('○', 'bolinha vazia', 'corda <b>solta</b>: toque sem apertar nada.'), ('✕', 'xis', 'não toque essa corda (abafe ou evite).'), ('│', 'linhas verticais', 'as 6 cordas: a da esquerda é a <b>6ª (grossa)</b>, a da direita a <b>1ª (fina)</b>.'), ('─', 'linhas horizontais', 'os trastes: o espaço entre elas é uma <b>casa</b>. a de cima, mais grossa, é a pestana do início do braço.')]
        for s, t, d in itens:
            c += f'<div class="row" style="gap:8px;margin-bottom:7px;align-items:flex-start"><span style="flex:none;width:28px;height:28px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:23px;font-weight:900;font-size:14px">{s}</span><div><b>{t}</b><div style="font-size:11.8px;line-height:1.3">{d}</div></div></div>'
        c += '</div></div>'
        c += lab('o que o Em pede? (confira no desenho)')
        c += '<div class="col2" style="gap:6px 16px;font-size:13px"><div>• dedo 2 na <b>5ª</b> corda, casa <b>2</b></div><div>• dedo 3 na <b>4ª</b> corda, casa <b>2</b></div><div>• as outras 4 cordas ficam <b>soltas</b></div><div>• toque as <b>6 cordas</b>, da grossa para a fina</div></div>'
        c += lab('1. ligue o símbolo ao que ele quer dizer')
        pares = [('●', 'aperte aqui com um dedo'), ('○', 'toque a corda solta'), ('✕', 'não toque essa corda'), ('3', 'use o dedo anelar')]
        dd = ['toque a corda solta', 'use o dedo anelar', 'aperte aqui com um dedo', 'não toque essa corda']
        for i, (s, t) in enumerate(pares):
            c += f'<div style="display:flex;align-items:center;margin-bottom:5px"><div class="box center" style="flex:0 0 12%;padding:2px;border-radius:30px;font-weight:900">{s}</div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-left:8px"></div><div style="flex:1"></div><div style="width:12px;height:12px;border-radius:50%;background:#111;margin-right:8px"></div><div class="box" style="flex:0 0 50%;padding:2px 14px;border-radius:30px;font-weight:700;font-size:13px">{dd[i]}</div></div>'
        c += lab('2. pergunte ao diagrama do Em')
        c += '<div class="col2" style="gap:6px 16px;font-size:13px"><div>quantas cordas são apertadas? <span class="dots" style="display:inline-block;width:40px"></span></div><div>quantas cordas soltas tem? <span class="dots" style="display:inline-block;width:40px"></span></div></div>'
        L.gab('m6-diagrama', 'como ler o diagrama (pág. {pg})', 'ligue: ● aperte aqui · ○ corda solta · ✕ não toque · 3 dedo anelar. Em: 2 cordas apertadas · 4 cordas soltas.')
        return c + corner('oculos', 56)
    L.add('m6-diagrama', 'aula 6 · como ler o diagrama', diag)

    def par(nomes, pid, tt, sub, fala_txt, desafio, ordem_txt):
        def f(L):
            c = titulo(tt, sub, 560)
            c += fala(fala_txt, 'vibra')
            if len(nomes) == 3:
                c += '<div class="col3" style="gap:10px">' + ''.join(card_acorde(n, 128, True) for n in nomes) + '</div>'
            else:
                c += '<div class="col2" style="gap:14px">' + ''.join(card_acorde(n, 170, True) for n in nomes) + '</div>'
            c += lab('toque e marque')
            for n in nomes:
                c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13px"><b class="cf" style="font-size:16px;width:34px">{n}</b><span>todas as cordas soaram limpinhas?</span>{ck(5, "big")}</div>'
            c += box(desafio, style='margin-top:10px;font-size:13px')
            L.gab(pid, tt + ' (pág. {pg})', ordem_txt)
            return c + corner('vibra', 56)
        return f
    L.add('m6-emam', 'aula 6 · Em e Am', par(['Em', 'Am'], 'm6-emam', 'Seus primeiros acordes: Em e Am', 'dois acordes “amigos” que dão para tocar já!', 'o <b>Em</b> (mi menor) usa só 2 dedos e é o mais fácil de todos. o <b>Am</b> (lá menor) tem a mesma “forma”, só que mais abaixo. dá para trocar entre os dois quase sem mexer a mão!', '<b>Desafio de troca:</b> toque Em 4 vezes, troque para Am e toque 4 vezes. Repita 5 vezes sem parar. <span class="gray">Dica: os dedos 2 e 3 do Em quase só descem uma corda para virar Am (o 1 vem para a 2ª corda).</span>', 'não há resposta fixa: confira se as 6 cordas do Em (e as 5 do Am, sem a 6ª) soam limpas.'))
    L.add('m6-cg', 'aula 6 · C e G', par(['C', 'G'], 'm6-cg', 'Dó e Sol: C e G', 'os dois acordes que mais aparecem nas músicas', 'o <b>C</b> (dó maior) e o <b>G</b> (sol maior) são os melhores amigos do violão! o <b>C</b> não usa a 6ª corda. o <b>G</b> usa as 6 cordas.', '<b>Desafio de troca:</b> C ↔ G, 4 batidas em cada. Respire e mantenha o pulso. <span class="gray">Dica: no C, o dedo 3 está na 5ª corda; no G, o dedo 2 vai para a 6ª corda.</span>', 'confira: C não toca a 6ª corda (✕). G toca todas as 6 cordas.'))
    L.add('m6-dae', 'aula 6 · D, A e E', par(['D', 'A', 'E'], 'm6-dae', 'Ré, Lá e Mi: D, A e E', 'três acordes maiores bem brilhantes', 'os três têm formas parecidas: <b>3 dedos juntinhos</b>. o <b>D</b> (ré maior) usa só 4 cordas; o <b>A</b> (lá maior) usa 5; o <b>E</b> (mi maior) usa as 6.', '<b>Desafio:</b> toque D, A, E, A, D em sequência, 4 batidas em cada acorde.', 'confira: D toca da 4ª à 1ª (✕ na 6ª e na 5ª). A toca da 5ª à 1ª (✕ na 6ª). E toca as 6 cordas.'))

    def dmf(L):
        c = titulo('Dm e F: acordes um pouco maiores', 'o ré menor e a pestana', 560)
        c += fala('o <b>Dm</b> (ré menor) usa 4 cordas. o <b>F</b> (fá maior) é famoso por ser desafiador: precisa da <b>pestana</b>, um dedo deitado apertando várias cordas ao mesmo tempo. começamos com a versão <b>fácil</b>!', 'timido')
        c += '<div class="col3" style="gap:10px">'
        c += card_acorde('Dm', 130, True)
        facil = f'<div class="box" style="padding:8px 10px;border-radius:16px;text-align:center"><div class="cf" style="font-size:24px">F fácil</div><div style="font-size:11.5px;font-weight:700;margin-bottom:2px">Fá maior (4 cordas)</div>{chord_svg([-1,-1,3,2,1,1],[0,0,3,2,1,1],w=130,barre=(1,4,5))}<ul style="padding-left:14px;font-size:11.2px;line-height:1.35;margin-top:4px"><li>dedo 1 deitado na casa 1 (1ª e 2ª cordas)</li><li>dedo 2 na 3ª corda, casa 2</li><li>dedo 3 na 4ª corda, casa 3</li><li>não toque: 6ª e 5ª</li></ul></div>'
        c += facil
        c += card_acorde('F', 130, True)
        c += '</div>'
        c += box('<b>O que é a pestana?</b> é o dedo 1 deitado sobre as cordas, como uma ponte, apertando várias ao mesmo tempo. no <b>F completo</b>, ele cobre as <b>6 cordas</b> na casa 1. no <b>F fácil</b>, só as <b>2 mais finas</b>. com treino a mão fica forte!', style='margin-top:10px;font-size:12.8px')
        c += lab('toque e marque')
        for n, t in [('Dm', 'Dm soou limpinho'), ('F fácil', 'F fácil sem as cordas “chiando”'), ('F', 'F completo (desafio!)')]:
            c += f'<div class="row" style="gap:10px;margin-bottom:5px;font-size:13px"><b style="width:90px" class="cf">{n}</b><span>{t}</span>{ck(5, "big")}</div>'
        c += box('<b>Desafio de troca:</b> Dm ↔ F fácil, 4 batidas em cada. Se a mão cansar, descanse e continue depois: é normal!', style='margin-top:10px;font-size:13px')
        L.gab('m6-dmf', 'Dm e F (pág. {pg})', 'Dm toca da 4ª à 1ª corda. F fácil: pestana nas 2 cordas mais finas. F completo: pestana nas 6 cordas na casa 1.')
        return c + corner('timido', 56)
    L.add('m6-dmf', 'aula 6 · Dm e F', dmf)

    def setimas(L):
        c = titulo('Acordes com sétima', 'um tempero a mais: A7, D7, E7, G7 e C7', 560)
        c += fala('o acorde com <b>7</b> tem uma notinha extra e soa mais “curioso”, como se pedisse para ir para outro acorde. é muito usado no samba, no blues e no rock!', 'duvida')
        c += '<div class="col3" style="gap:10px">' + ''.join(card_acorde(n, 115, False, True) for n in ['A7', 'D7', 'E7']) + '</div>'
        c += '<div class="col2" style="gap:10px;margin-top:10px">' + ''.join(card_acorde(n, 130, False, True) for n in ['G7', 'C7']) + '</div>'
        c += box('<b>Dica:</b> o G7 vai muito bem com o C (G7 → C parece “chegar em casa”). o A7 resolve no D, o D7 resolve no G e o E7 no A.', style='margin-top:10px;font-size:12.8px')
        L.gab('m6-setimas', 'acordes com sétima (pág. {pg})', 'sem exercício de resposta: confira os diagramas ao tocar.')
        return c + corner('duvida', 56)
    L.add('m6-setimas', 'aula 6 · acordes com 7', setimas)

    def todos(L):
        c = titulo('Meu álbum de acordes', 'os 14 acordes do livro: pinte o “já sei!”', 520)
        ordem = ['C', 'D', 'E', 'F', 'G', 'A', 'Am', 'Dm', 'Em', 'A7', 'D7', 'E7', 'G7', 'C7']
        c += '<div style="display:grid;grid-template-columns:repeat(5,1fr);gap:7px">'
        for n in ordem:
            c += f'<div class="box center" style="padding:5px 2px;border-radius:12px"><div class="cf" style="font-size:19px;line-height:1">{n}</div>{acorde(n, 96)}<div style="font-size:11px"><span class="ck"></span> já sei!</div></div>'
        c += '<div class="box center" style="padding:5px 2px;border-radius:12px;display:flex;flex-direction:column;justify-content:center;align-items:center">' + paul('vibra', 70) + '<div class="g" style="font-size:15px">parabéns!</div></div>'
        c += '</div>'
        c += lab('maiores · menores · com sétima')
        c += '<div class="col3" style="gap:10px;font-size:12.5px">' + box('<b>maiores</b> (soam alegres): C D E F G A') + box('<b>menores</b> (soam tristes): Am Dm Em') + box('<b>com sétima</b>: A7 D7 E7 G7 C7') + '</div>'
        c += box('<b>Quantos acordes eu sei?</b> <span class="dots" style="display:inline-block;width:70px;vertical-align:bottom"></span> de 14. &nbsp; <b>Meu acorde preferido:</b> <span class="dots" style="display:inline-block;width:110px;vertical-align:bottom"></span>', style='margin-top:10px;font-size:13px')
        return c + corner('feliz', 56)
    L.add('m6-todos', 'aula 6 · álbum de acordes', todos)

    def desenhe(L):
        c = titulo('Desenhe o acorde', 'leia a receita e pinte as bolinhas no diagrama', 560)
        c += '<p style="font-size:12.8px">Cada diagrama está vazio. Leia o que o acorde pede e <b>desenhe as bolinhas</b> (com o número do dedo), os ○ e os ✕. Depois confira no álbum!</p>'
        alvo = ['Am', 'C', 'G', 'D', 'E', 'Dm']
        c += '<div class="col3" style="gap:10px">'
        for n in alvo:
            partes, soltas, mut = acorde_receita(n)
            rec = '<ul style="padding-left:14px;font-size:11px;line-height:1.3;text-align:left">' + ''.join(f'<li>{p}</li>' for p in partes) + (f'<li>soltas: {", ".join(soltas)}</li>' if soltas else '') + (f'<li>✕: {", ".join(mut)}</li>' if mut else '') + '</ul>'
            c += f'<div class="box center" style="padding:6px 8px;border-radius:14px"><div class="cf" style="font-size:22px">{n}</div>{chord_svg([None]*6, None, w=110)}{rec}</div>'
        c += '</div>'
        gabh = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px">' + ''.join(f'<div class="center"><span class="cf" style="font-size:13px">{n}</span>{acorde(n, 74)}</div>' for n in alvo) + '</div>'
        c += lab('agora o contrário: leia o diagrama e escreva o nome do acorde')
        qs = ['G', 'Em', 'D7', 'A']
        c += '<div class="col4" style="gap:8px">' + ''.join(f'<div class="box center" style="padding:6px;border-radius:12px">{acorde(n, 80)}<div class="dots" style="width:60px;margin:2px auto"></div></div>' for n in qs) + '</div>'
        L.gab('m6-desenhe', 'desenhe o acorde (pág. {pg})', gabh + '<div style="font-size:11.6px;margin-top:4px">leitura: G · Em · D7 · A.</div>', kind='html')
        return c + corner('oculos', 56)
    L.add('m6-desenhe', 'aula 6 · desenhe o acorde', desenhe)

    TROCAS = [('Em', 'Am'), ('C', 'G'), ('D', 'A'), ('Am', 'C'), ('G', 'D'), ('E', 'A'), ('G', 'Em'), ('C', 'F')]
    def troca(L):
        c = titulo('Desafio das trocas', 'trocar de acorde sem parar o pulso', 520)
        c += fala('o segredo de tocar música é <b>trocar de acorde a tempo</b>. use o metrônomo e troque a cada <b>4 batidas</b>. vamos treinar com cronômetro!', 'vibra', 'r')
        c += '<p style="font-size:12.8px">Ligue o metrônomo a <b>60 BPM</b>. Toque o 1º acorde por 4 tempos, troque, toque o 2º por 4 tempos e volte. Em <b>1 minuto</b>, quantas trocas você consegue <b>sem errar o pulso</b>? Anote.</p>'
        c += '<table class="tbl" style="width:100%;font-size:13px"><tr style="background:#eee"><th>trocar</th><th style="width:60px">meta</th><th style="width:70px">1º dia</th><th style="width:70px">3º dia</th><th style="width:70px">7º dia</th></tr>'
        for a, b in TROCAS:
            c += f'<tr><td><span class="cf" style="font-size:16px">{a} ⇄ {b}</span></td><td style="text-align:center;font-weight:800">10</td><td></td><td></td><td></td></tr>'
        c += '</table>'
        c += lab('pinte uma estrela quando bater a meta!')
        c += '<div class="row" style="justify-content:space-around;font-size:36px">' + ''.join('☆' for _ in TROCAS) + '</div>'
        c += box('<b>Dicas de ouro:</b> 1) olhe para a mão que vai trocar, não para a que já está tocando. 2) antecipe: levante os dedos um pouquinho antes. 3) começo devagar: 50 BPM é ótimo. 4) pare se a mão doer, descanse e volte.', style='margin-top:10px;font-size:12.8px')
        return c + corner('vibra', 56)
    L.add('m6-troca', 'aula 6 · trocas', troca)

    # ============== AULA 7: BATIDAS ==============
    def seta(L):
        c = titulo('Aula 7: as batidas', 'setas ↓ ↑ para a mão direita', 440)
        c += fala('a <b>mão direita</b> toca as cordas para <b>baixo (↓)</b> e para <b>cima (↑)</b>. é como a bateria: o <b>↓</b> cai nos números (1 2 3 4) e o <b>↑</b> cai no <b>“e”</b>. as colcheias do Robôterista aparecem aqui!', 'ouve')
        c += lab('1. a base: só para baixo, no pulso', True)
        c += '<div class="box" style="padding:10px 14px">' + strum_grid(['d', '.', 'd', '.', 'd', '.', 'd', '.']) + '<div style="font-size:12px;margin-top:4px">conte: <b>1</b> · <b>2</b> · <b>3</b> · <b>4</b>. toque só nos números, uma batida para baixo em cada tempo.</div></div>'
        c += lab('2. colcheias: ↓ nos números e ↑ nos “e”')
        c += '<div class="box" style="padding:10px 14px">' + strum_grid(['d', 'u', 'd', 'u', 'd', 'u', 'd', 'u']) + '<div style="font-size:12px;margin-top:4px">conte: <b>1 e 2 e 3 e 4 e</b>. a mão vai e volta sem parar, como um balanço.</div></div>'
        c += lab('3. o balanço da mão direita')
        c += '<div class="col3" style="gap:8px"><div class="box center" style="padding:8px">' + arrow('d', 40) + '<div style="font-size:12px"><b>↓ para baixo</b><br>das cordas graves para as agudas</div></div><div class="box center" style="padding:8px">' + arrow('u', 40) + '<div style="font-size:12px"><b>↑ para cima</b><br>das cordas agudas para as graves</div></div><div class="box center" style="padding:8px"><div style="font-size:30px">⟲</div><div style="font-size:12px"><b>o balanço não para</b><br>mesmo no silêncio a mão passa</div></div></div>'
        c += lab('4. complete com setas (desenhe ↓ ou ↑)')
        c += '<div class="box" style="padding:10px 14px">' + strum_grid(['.'] * 8, show=False) + '<div style="font-size:12px;margin-top:4px">faça ↓ nos números e ↑ nos “e”.</div></div>'
        L.gab('m7-seta', 'as batidas (pág. {pg})', 'completar: ↓ ↑ ↓ ↑ ↓ ↑ ↓ ↑ (↓ em 1 2 3 4 e ↑ em cada “e”).')
        return c + corner('ouve', 56)
    L.add('m7-seta', 'aula 7 · setas', seta)

    PADROES = [('só ↓ no pulso', ['d', '.', 'd', '.', 'd', '.', 'd', '.']), ('colcheias ↓↑', ['d', 'u', 'd', 'u', 'd', 'u', 'd', 'u']), ('pop: ↓ ↓↑ ↑ ↓↑', ['d', '.', 'd', 'u', '.', 'u', 'd', 'u']), ('balada: ↓ ↑ ↓ . ↓ ↑', ['d', '.', 'd', 'u', 'd', '.', 'd', 'u'])]
    def padroes(L):
        c = titulo('4 batidas para tocar', 'do mais fácil para o mais divertido', 480)
        c += '<p style="font-size:12.8px">Escolha um acorde (Em é ótimo!) e toque cada padrão por <b>4 compassos</b>. Comece a <b>60 BPM</b>. O “.” significa que a mão passa <b>sem tocar</b> as cordas.</p>'
        for i, (nm, p) in enumerate(PADROES):
            c += f'<div class="box" style="padding:8px 14px;margin-bottom:10px;border-radius:16px"><div class="row" style="justify-content:space-between"><span class="m" style="font-size:16px">PADRÃO {i+1}: {nm}</span><span style="font-size:12px">toquei: {ck(4)}</span></div>' + strum_grid(p) + '</div>'
        c += lab('ritmo escrito (para quem leu o Robôterista)')
        c += '<div class="box" style="padding:8px 14px"><div style="font-size:12.8px">o padrão 2 em colcheias fica assim na pauta de uma linha:</div>' + rhythm([(i * 8, 8, 'n') for i in range(8)], beams=[[0, 1], [2, 3], [4, 5], [6, 7]], width=560, total=64, counts=[(i * 8, t) for i, t in enumerate(['1', 'e', '2', 'e', '3', 'e', '4', 'e'])]) + '</div>'
        c += tip('o <b>padrão 3</b> é o mais usado em músicas pop. se perder o pulso, volte ao padrão 1 e comece de novo!')
        return c + corner('feliz', 56)
    L.add('m7-pad', 'aula 7 · padrões', padroes)

    def cria(L):
        c = titulo('Crie a sua batida', 'invente um jeito novo de tocar', 460)
        c += fala('agora é a sua vez! escolha onde cai o <b>↓</b>, onde cai o <b>↑</b> e onde a mão só passa (<b>.</b>). depois toque com um acorde!', 'oculos')
        for i in range(4):
            c += f'<div class="box" style="padding:8px 14px;margin-bottom:8px;border-radius:16px"><div class="row" style="justify-content:space-between"><span class="m" style="font-size:15px">MINHA BATIDA {i+1}</span><span style="font-size:12px">nome: <span class="dots" style="display:inline-block;width:110px;vertical-align:bottom"></span></span></div>' + strum_grid(['.'] * 8, show=False) + '</div>'
        c += lab('junte batida + acorde')
        c += '<div class="col3" style="gap:8px;font-size:13px">' + ''.join(f'<div class="box center" style="padding:6px;border-radius:12px"><div class="cf" style="font-size:20px">{n}</div><div style="font-size:11.5px">batida: ___</div></div>' for n in ['Em', 'Am', 'C']) + '</div>'
        c += lab('ensaio com a bateria')
        c += box('Se um amigo toca bateria, vocês podem tocar juntos: ele faz a <b>levada de rock</b> do livro <b>Robôterista Ensina</b> e você faz a batida do violão. Os dois seguem o <b>mesmo pulso</b>!', style='font-size:12.8px')
        c += '<div style="margin-top:6px;font-size:13px"><span class="ck big"></span> toquei com bateria (ou com a música) &nbsp; <span class="ck big"></span> gravei no celular</div>'
        return c + corner('oculos', 56)
    L.add('m7-cria', 'aula 7 · crie a sua batida', cria)
