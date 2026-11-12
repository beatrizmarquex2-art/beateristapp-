# -*- coding: utf-8 -*-
from base import *
import draw

FIG7 = ['semibreve', 'minima', 'seminima', 'colcheia', 'semicolcheia', 'fusa', 'semifusa']
NOMES = {'semibreve': 'semibreve', 'minima': 'mínima', 'seminima': 'semínima', 'colcheia': 'colcheia',
         'semicolcheia': 'semicolcheia', 'fusa': 'fusa', 'semifusa': 'semifusa'}
VALOR = {'semibreve': '4 tempos', 'minima': '2 tempos', 'seminima': '1 tempo', 'colcheia': 'meio tempo',
         'semicolcheia': '¼ de tempo', 'fusa': '⅛ de tempo', 'semifusa': '1/16 de tempo'}
VALOR_N = {'semibreve': 4, 'minima': 2, 'seminima': 1, 'colcheia': .5, 'semicolcheia': .25, 'fusa': .125, 'semifusa': .0625}

def notas_row(nomes, size=72, gap=18):
    return '<div style="display:flex;justify-content:center;gap:%dpx;align-items:flex-end">' % gap + ''.join(figura(n, size) for n in nomes) + '</div>'


def build(L):
    # ================= CAPA =================
    def capa(L):
        fig = ''.join(f'<div>{figura(n, 78)}</div>' for n in FIG7)
        return f'''<section class="page full" style="padding:0">
<div style="position:absolute;inset:8mm;border:4.5px solid #111"></div><div style="position:absolute;inset:11.5mm;border:1.5px solid #111"></div>
<div style="position:absolute;top:34mm;left:0;right:0;text-align:center;font-family:Gochi;font-size:22px">Beaterista Escola de Música apresenta</div>
<div style="position:absolute;top:47mm;left:0;right:0;text-align:center"><div class="m" style="font-size:84px;line-height:.95">ROBÔTERISTA</div><div class="m" style="font-size:96px;line-height:1">ENSINA</div></div>
<div style="position:absolute;top:104mm;left:50mm;right:50mm;height:3px;background:#111"></div>
<div style="position:absolute;top:110mm;left:0;right:0;text-align:center;font-weight:800;font-size:18px">As figuras rítmicas, as pausas e o tempo</div>
<div style="position:absolute;top:117mm;left:0;right:0;text-align:center;font-size:14.5px">aprendendo, desenhando, recortando e tocando</div>
<div style="position:absolute;top:126mm;left:0;right:0;text-align:center"><span class="pill" style="font-size:13px;padding:3px 16px">EDIÇÃO COMPLETA · {len(L.pages)} PÁGINAS · JOGOS, PARTITURAS E LEVADAS DE ROCK</span></div>
<img src="img/capa.jpg" style="position:absolute;top:138mm;left:18mm;width:174mm;mix-blend-mode:multiply">
<div style="position:absolute;bottom:38mm;left:0;right:0;display:flex;justify-content:center;gap:24px;align-items:flex-end">{fig}</div>
<div style="position:absolute;bottom:23mm;left:0;right:0;text-align:center;font-weight:800;font-size:12.5px">material para imprimir · para crianças e famílias · atividades, jogos e partituras</div>
<div style="position:absolute;bottom:17mm;left:0;right:0;text-align:center;font-size:11.5px">beaterista.com.br &nbsp;·&nbsp; TikTok @beaterista &nbsp;·&nbsp; Instagram @beaterista_ &nbsp;·&nbsp; YouTube @beateristadrummer</div>
</section>'''
    L.add('capa', 'capa', capa, 'raw')

    # ================= OI, EU SOU O PAUL =================
    def oi(L):
        return (titulo('Oi, eu sou o Paul!', 'o robô baterista da Beaterista', 420) +
                fala('bem-vindo(a) ao Robôterista Ensina! eu vou te mostrar, passo a passo, como a música escreve o tempo.', 'feliz') +
                '<p>Toda música é feita de sons que duram mais ou menos tempo. Para <b>escrever</b> isso no papel, os músicos usam desenhinhos chamados <b>figuras rítmicas</b>. Cada figura diz <b>quanto tempo</b> o som dura. E quando o som para, a gente escreve o silêncio: a <b>pausa</b>.</p>'
                '<p>Neste livro você vai: <b>aprender</b> com o Paul, <b>traçar</b> e <b>desenhar</b> cada figura, <b>recortar</b> cartas e montar jogos, <b>bater palmas</b> e <b>tocar</b> partituras, brincar de caça-palavras, cruzadinha, bingo e jogo de tabuleiro, aprender sua <b>primeira levada de rock</b> e ainda ganhar um <b>diploma</b> de Robôterista!</p>'
                + box('<div class="row" style="gap:10px;margin-bottom:12px"><span class="m" style="font-size:15px;width:190px">MEU NOME É:</span><div class="dots" style="flex:1"></div></div>'
                      '<div class="row" style="gap:10px;margin-bottom:12px"><span class="m" style="font-size:15px;width:190px">COMECEI EM:</span><div class="dots" style="flex:1"></div><span class="m" style="font-size:15px;margin-left:12px">MINHA IDADE:</span><div class="dots" style="width:90px"></div></div>'
                      '<div class="row" style="gap:10px"><span class="m" style="font-size:15px;width:190px">MEU PROFESSOR(A):</span><div class="dots" style="flex:1"></div></div>', style='margin:18px 0 20px;padding:18px 20px;border-radius:22px')
                + '<div class="g" style="font-size:20px;line-height:1.35;max-width:430px;margin:26px 0 0">“Música se aprende com calma, repetição e diversão. Errou? Tudo bem! Tente de novo. Eu também errei muito antes de aprender.”</div>'
                + '<div class="m" style="font-size:15px;margin-top:20px">MINHA META COM ESTE LIVRO:</div>' + lines(2, 28)
                + '<div class="m" style="font-size:15px;margin-top:16px">DESENHE VOCÊ TOCANDO COM O PAUL:</div><div class="box dash" style="height:190px;margin-top:6px"></div>'
                + f'<div class="abs" style="right:0;bottom:0">{paul("oculos", 100)}</div>')
    L.add('paul', 'boas-vindas', oi)

    # ================= MAPA =================
    def mapa(L):
        itens = [
            ('★', 'Conheça a bateria e a percussão', 'as peças, os instrumentos e os jeitos de tocar', 'kit', 'jeitos'),
            ('1', 'O tempo, a semínima e o compasso', 'o pulso da música, o metrônomo e a caixinha de 4 tempos', 'a1-tempo', 'a1-jogos'),
            ('2', 'A escadinha das 7 figuras', 'semibreve, mínima, semínima, colcheia, semicolcheia, fusa e semifusa', 'a2-esc', 'a2-comp'),
            ('3', 'Como montar o desenho', 'cabeça, haste e bandeirinhas: as 3 peças de toda figura', 'a3-peca', 'a3-pauta'),
            ('4', 'As pausas', 'o silêncio também tem desenho e tem valor', 'a4-pausas', 'a4-comp'),
            ('5', 'O pontinho', 'o ponto de aumento: quando a figura vale metade a mais', 'a5-ponto', 'a5-prat'),
            ('6', 'As variações da semicolcheia', '9 jeitinhos de dividir um tempo: 1 e & a', 'a6-sem', 'a6-monte'),
            ('7', 'Tercina e sextina', 'quando o tempo é dividido em 3 ou em 6 partes', 'a7-terc', 'a7-leia'),
            ('8', 'Bônus: as mãos e as levadas do baterista', 'rudimentos, pauta da bateria e sua primeira levada de rock', 'a8-maos', 'a8-lev2'),
            ('✦', 'Jogos e desafios', 'caça-palavras, cruzadinhas, código secreto, contas e a prova do Paul', 'j-caca1', 'j-prova2'),
            ('♪', 'Partituras e pôsteres', 'iniciante, intermediário, avançado, mestre e os pôsteres do rock', 'p-ini', 'p-band2'),
            ('✂', 'Recortes e jogos de mesa', 'cartas, bingo, trilha, dominó, régua do tempo e dado', 'r-cartas1', 'r-regua'),
            ('♥', 'Meu plano, conquistas e diploma', 'app, plano de 12 dias, desafio de 30 dias, figurinhas, dicionário e diploma', 'f-app', 'f-diploma'),
            ('✓', 'Gabarito', 'confira com carinho: o erro também ensina', 'gab1', 'gab3'),
        ]
        rows = ''
        for n, t, s, a, b in itens:
            pa, pb = L.pg(a), L.pg(b)
            pgs = f'págs. {pa}-{pb}' if pa != pb else f'pág. {pa}'
            rows += (f'<div class="box" style="display:flex;align-items:center;gap:14px;padding:6px 14px;margin-bottom:7px;border-radius:16px">'
                     f'<div style="flex:none;width:36px;height:36px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:30px;font-family:Marker;font-size:19px">{n}</div>'
                     f'<div style="flex:1"><div style="display:flex;justify-content:space-between"><b style="font-size:14.5px">{t}</b><b style="font-size:12px">{pgs}</b></div><div style="font-size:11.5px;color:#222">{s}</div></div></div>')
        return (titulo('O que vamos aprender', 'seu mapa de aventura', 440) + rows +
                '<div class="row" style="justify-content:space-between;margin-top:8px;gap:20px"><p style="font-size:12.5px;max-width:480px">No fim você ainda encontra o <b>diploma</b>, o <b>gabarito</b> e o <b>QR code</b> dos jogos no app.</p>' + paul('pensa', 66) + '</div>')
    L.add('mapa', 'o que vamos aprender', mapa)

    # ================= PAIS E PROFESSORES =================
    def pais(L):
        def q(t, a):
            return f'<div style="margin-bottom:9px"><div class="m" style="font-size:15px;text-transform:uppercase">{t}</div><div style="padding-left:14px;font-size:13px">{a}</div></div>'
        c = titulo('Para pais e professores', 'como aproveitar este material', 500)
        c += q('Quanto tempo?', 'Sessões de <b>10 a 15 minutos</b>, 3 a 4 vezes por semana, rendem mais do que uma sessão longa. Cada “aula” do livro cabe em 1 ou 2 sessões. O livro traz um <b>plano de 12 dias</b> e um <b>desafio de 30 dias</b>.')
        c += q('Qual a idade?', 'Pensado para crianças de <b>6 a 12 anos</b>, mas serve para qualquer iniciante. Os pequenos podem colorir e traçar; os maiores resolvem os desafios e os jogos.')
        c += q('Precisa saber música?', 'Não! Tudo está explicado com palavras simples. Dica: leia a fala do Paul em voz alta e faça as palmas junto com a criança.')
        c += q('A ordem importa?', 'Sim, nas aulas 1 a 7 (cada uma usa a anterior). A aula 8, os jogos, as partituras e os recortes podem ser feitos a qualquer momento depois da aula 2.')
        c += q('O que usar?', 'Lápis, borracha, tesoura sem ponta, cola e <b>um metrônomo</b> (app ou site), ou apenas um relógio que faça “tic-tac”. Para os jogos de mesa: papel mais grosso para imprimir e alguns botões ou tampinhas como peões.')
        c += q('Como saber se aprendeu?', 'A criança consegue (1) dizer quanto vale cada figura, (2) desenhar a figura certa pelo nome e (3) bater um compasso lendo a partitura sem parar. A <b>prova do Paul</b> (págs. ' + f'{L.pg("j-prova1")}-{L.pg("j-prova2")}' + ') e o gabarito estão no fim.')
        c += q('E o app?', 'Os QR codes levam à <b>aulinha do Paul</b> e aos jogos <b>Toca Aqui</b> e <b>Toque as figuras</b>, que escutam o ritmo da criança (na tela ou no microfone) e mostram a precisão.')
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">POR QUE FUNCIONA? (um pouquinho de ciência)</div><div style="font-size:12.3px">Aprender com <b>vários sentidos ao mesmo tempo</b> (ver a figura, ouvir, bater palmas e desenhar) fixa melhor na memória. <b>Pouco tempo e muita repetição espaçada</b> vencem a maratona. Errar e tentar de novo faz parte do processo: o cérebro aprende mais quando corrige o erro. Por isso as sessões são curtas, cheias de movimento e com um robô amigo que comemora cada tentativa.</div>', style='margin-top:10px')
        c += '<div class="tiny" style="position:absolute;bottom:0;left:0;right:150px">Material didático da Beaterista Escola de Música. Uso pessoal e familiar; não revender nem redistribuir. Você pode imprimir quantas cópias precisar para o seu aluno/filho.</div>'
        return c + f'<div class="abs" style="right:0;bottom:-6px">{paul("musica", 70)}</div>'
    L.add('pais', 'para pais e professores', pais)

    def pais2(L):
        c = titulo('Guia rápido do professor', 'um roteiro de 10 minutos para cada aula', 520)
        rows = [('1', 'o tempo, a semínima e o compasso', 'sentir o pulso e contar até 4', '2 min andando no pulso · 3 min palmas no 1, 1-3 e 2-4 · 3 min com metrônomo a 60 BPM · 2 min na página', 'acelerar sem perceber; bater o ritmo em vez do pulso'),
                ('2', 'a escadinha das 7 figuras', 'saber o valor de cada figura', '3 min árvore e pizza (com as cartas) · 4 min traçar · 3 min “qual vale mais?”', 'achar que mais bandeirinhas dura mais'),
                ('3', 'montar o desenho', 'ler a “receita” de cada figura', '2 min receitas · 4 min “monte você” · 4 min “o Paul errou!”', 'confundir cabeça vazia e cabeça cheia'),
                ('4', 'as pausas', 'contar o silêncio', '3 min tabela das pausas · 4 min jogo do silêncio · 3 min “quanto silêncio?”', 'parar de contar durante a pausa'),
                ('5', 'o pontinho', 'somar metade do valor', '3 min explicação com a barra · 4 min contas · 3 min palmas com notas pontuadas', 'dobrar o valor em vez de somar a metade'),
                ('6', 'semicolcheia e variações', 'dividir o tempo em 4 (1 e &amp; a)', '2 min contar “1 e &amp; a” · 4 min variações · 4 min bata palmas e leia', 'apressar as semicolcheias; não contar os parênteses'),
                ('7', 'tercina e sextina', 'sentir 3 e 6 notas num tempo', '3 min “tri-pla-ça” · 3 min comparar 2, 3, 4 e 6 · 4 min leia e toque', 'tocar a tercina com notas desiguais'),
                ('8', 'rudimentos e levadas', 'coordenar mãos e pés', '3 min toque simples e duplo · 3 min paradiddle · 4 min levada de rock', 'tensão nos ombros; pressa; volumes diferentes')]
        c += '<table class="tbl" style="width:100%;font-size:11.2px;line-height:1.3"><tr style="background:#eee"><th style="width:26px">aula</th><th>objetivo</th><th>roteiro de 10 minutos</th><th>cuidado</th></tr>'
        for n, t, o, r, e in rows:
            c += f'<tr><td class="m" style="font-size:15px;text-align:center">{n}</td><td><b>{t}</b><br>{o}</td><td>{r}</td><td>{e}</td></tr>'
        c += '</table>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">COMO AVALIAR EM 3 PASSOS</div><div style="font-size:12.3px"><b>1.</b> A criança diz o nome e o valor de qualquer figura ou pausa sem consultar. <b>2.</b> Bate um compasso lendo, sem parar, a 60 BPM. <b>3.</b> Faz a <b>prova do Paul</b> com 15 ou mais acertos. Aí é hora do diploma!</div>', style='margin-top:10px')
        c += box('<div class="m" style="font-size:14px;margin-bottom:4px">DICAS PARA TURMAS</div><div style="font-size:12.3px">Use as <b>cartas</b> e o <b>bingo</b> como aquecimento · divida a turma em duplas para o <b>dominó</b> · faça a <b>trilha</b> em grupos de 4 · peça que cada aluno invente uma levada na página “crie a sua” e toque para a turma.</div>', style='margin-top:8px')
        c += corner('oculos', 56)
        return c
    L.add('pais2', 'para pais e professores', pais2)

    # ================= COMO USAR =================
    def como(L):
        selos = [('DESENHE', 'pegue o lápis e faça os desenhos nos espaços e nas pautas.'), ('TRACE', 'passe o lápis por cima do cinza claro e depois desenhe sozinho(a).'),
                 ('CIRCULE', 'faça um círculo na resposta certa.'), ('LIGUE', 'una com uma linha o que combina.'),
                 ('RECORTE', 'use tesoura sem ponta (peça ajuda a um adulto) e cole se precisar.'), ('PALMAS', 'bata palmas contando em voz alta: 1 e & a.'),
                 ('QR CODE', 'aponte a câmera do celular para jogar e ouvir no app.')]
        c = titulo('Como usar este livro', 'o que cada selinho quer dizer', 440)
        for a, b in selos:
            c += f'<div class="row" style="gap:18px;margin-bottom:9px"><span class="chip" style="flex:none;width:150px">{a}</span><span style="font-size:13.5px">{b}</span></div>'
        c += '<span class="lab">Contando o tempo</span><p>Um tempo é dividido em 4 casinhas: <b>1 e &amp; a</b>. A <b>semínima</b> ocupa o tempo todo: “1”. As <b>colcheias</b>: “1 &amp;”. As <b>semicolcheias</b>: “1 e &amp; a”.</p>'
        c += '<div class="row" style="gap:26px;margin-top:10px;justify-content:space-between">'
        cnt = [(0, '1'), (4, 'e'), (8, '&amp;'), (12, 'a')]
        for ev, bm, nm in [([(0, 16, 'n')], [], 'semínima'), ([(0, 8, 'n'), (8, 8, 'n')], [[0, 1]], '2 colcheias'), ([(i * 4, 4, 'n') for i in range(4)], [[0, 1, 2, 3]], '4 semicolcheias')]:
            c += f'<div style="flex:1">{rhythm(ev, beams=bm, width=215, total=16, counts=cnt)}<b style="font-size:12px;margin-left:6px">{nm}</b></div>'
        c += '</div>'
        c += box('<div class="m" style="font-size:14px;margin-bottom:5px">LEGENDA RÁPIDA</div><div class="col2" style="font-size:12.5px"><div>●&nbsp; nota = bata palma ou toque</div><div>( ) &nbsp;= silêncio: não bata, mas conte!</div><div>1 · 2 · 3 · 4 &nbsp;= os tempos do compasso</div><div>| &nbsp;= barra de compasso</div></div>', style='margin-top:14px')
        regras = ['<b>comece devagar.</b> velocidade é consequência, não ponto de partida.', '<b>conte em voz alta.</b> “1 e & a” faz o cérebro sentir o tempo.', '<b>10 minutinhos por dia</b> valem mais que 1 hora no domingo.', '<b>errou? volta e repete</b> mais devagar. é assim que se aprende.', '<b>comemore</b> cada página: pinte uma estrela ao terminar!']
        c += '<span class="lab">As 5 regras de ouro do Paul</span>' + ''.join(f'<div class="row" style="gap:12px;margin-bottom:7px"><span class="num" style="flex:none;width:30px;height:30px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:25px">{i+1}</span><span style="font-size:13px">{t}</span></div>' for i, t in enumerate(regras))
        c += corner('vibra', 100)
        return c
    L.add('como', 'como usar', como)

    # ================= PEÇAS DA BATERIA =================
    def kit(L):
        c = titulo('Peças da bateria', 'observe o desenho e descubra onde cada peça mora!', 420)
        c += '<div style="margin:4px 0 6px">' + draw.kit(True, 640) + '</div>'
        leg = [(1, 'bumbo'), (2, 'caixa'), (3, 'chimbal'), (4, 'tom 1'), (5, 'tom 2'), (6, 'surdo'), (7, 'crash'), (8, 'ride')]
        cells = ''.join(f'<div class="row" style="gap:10px"><span style="flex:none;width:30px;height:30px;border:2.5px solid #111;border-radius:50%;text-align:center;line-height:25px;font-weight:800">{n}</span><b>{t}</b></div>' for n, t in leg)
        c += box('<div class="m" style="font-size:14px;margin-bottom:8px">LEGENDA: CONHEÇA OS NOMES</div><div class="col4" style="grid-template-columns:repeat(4,1fr);row-gap:8px">' + cells + '</div>', style='margin-top:6px')
        c += '<div class="col2" style="margin-top:12px;gap:14px">' + box('<b>desafio 1:</b> circule na figura os <b>DOIS pratos de cima</b>.', style='font-size:13px') + box('<b>desafio 2:</b> pinte o <b>bumbo</b> de vermelho e a <b>caixa</b> de azul.', style='font-size:13px') + '</div>'
        c += box('<b>Qual é qual?</b> <span class="gray">Os <b>pratos</b> (crash, ride e chimbal) fazem som de metal. Os <b>tambores</b> (caixa, toms, surdo e bumbo) fazem som de pele. O <b>bumbo</b> é tocado com o pé!</span>', style='margin-top:12px;font-size:13px')
        return c
    L.add('kit', 'conheça a bateria', kit)

    def perc(L):
        return f'<section class="page full"><img src="img/percussao.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg("perc")}</span></div></section>'
    L.add('perc', 'percussão', perc, 'raw')

    def ligue_inst(L):
        nomes = ['agogo', 'congas', 'pandeiro', 'recoreco', 'triangulo', 'bongos']
        rot = {'agogo': 'agogô', 'congas': 'congas', 'pandeiro': 'pandeiro', 'recoreco': 'reco-reco', 'triangulo': 'triângulo', 'bongos': 'bongôs'}
        # esquerda (desenhos) em ordem embaralhada e direita (nomes) em outra ordem
        esq = ['triangulo', 'pandeiro', 'bongos', 'agogo', 'congas', 'recoreco']
        dire = ['agogo', 'congas', 'pandeiro', 'recoreco', 'triangulo', 'bongos']
        c = titulo('Ligue os instrumentos', 'ligue cada desenho ao nome certo. depois, pinte!', 480)
        c += '<div style="margin-top:8px">'
        for i in range(6):
            c += ('<div style="display:flex;align-items:center;margin-bottom:11px">'
                  f'<div class="box" style="width:190px;height:122px;display:flex;align-items:center;justify-content:center;padding:4px"><img src="img/inst_{esq[i]}.png" style="max-height:110px;max-width:170px"></div>'
                  '<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-left:10px"></div><div style="flex:1"></div>'
                  '<div style="width:15px;height:15px;border-radius:50%;background:#111;margin-right:10px"></div>'
                  f'<div class="box" style="width:190px;height:122px;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:20px;border-radius:40px">{rot[dire[i]]}</div></div>')
        c += '</div>'
        c += '<div class="box" style="position:absolute;bottom:0;left:0;right:0;font-weight:700">bônus: qual desses instrumentos você já tocou? <span class="gray" style="font-weight:400">escreva ou desenhe:</span></div>'
        gab = '<br>'.join(f'{rot[e]} → {rot[e]}' for e in esq)
        L.gab('ligue-inst', 'ligue os instrumentos (pág. {pg})', 'Cada desenho se liga ao nome dele: ' + ', '.join(rot[e] for e in esq) + ' (de cima para baixo na coluna da esquerda).')
        return c
    L.add('ligue-inst', 'conheça a percussão', ligue_inst)

    def jeitos(L):
        cards = [('CAJÓN', draw.icon_cajon(170), 'um “caixote” que a gente senta em cima e toca com as mãos'),
                 ('BATERIA ELETRÔNICA', draw.icon_edrum(170), 'toca baixinho com fones de ouvido: ótima para estudar!'),
                 ('PAD DE ESTUDO', draw.icon_pad(170), 'uma superfície macia para treinar as baquetas em silêncio'),
                 ('METRÔNOMO', draw.icon_metro(170), 'o aparelho que marca o pulso e mantém a velocidade constante')]
        c = titulo('Mais jeitos de tocar', 'nem toda bateria tem o mesmo formato!', 440)
        c += '<div class="col2" style="gap:14px">'
        for n, ic, d in cards:
            c += f'<div class="box" style="padding:12px;text-align:center;border-radius:20px;height:262px">{ic}<div class="m" style="font-size:15px;margin:4px 0 5px">{n}</div><div style="font-size:12.5px;color:#333;line-height:1.3">{d}</div></div>'
        c += '</div>'
        c += box('<div class="m" style="font-size:14.5px;margin-bottom:6px">RESPONDA:</div><b style="font-size:13px">onde praticamos baquetas sem bateria?</b>' + lines(1) + '<b style="font-size:13px">qual aparelho marca o pulso da música?</b>' + lines(1) + '<b style="font-size:13px">qual instrumento você escolheria para estudar sem fazer barulho?</b>' + lines(1), style='margin-top:14px;padding:14px 18px')
        c += box('<b>Fato curioso:</b> o baterista é o “relógio” da banda. Ele ajuda todo mundo a manter o mesmo pulso. É por isso que a primeira coisa que aprendemos aqui é o <b>tempo</b>!', style='margin-top:12px;font-size:13px')
        L.gab('jeitos', 'mais jeitos de tocar (pág. {pg})', 'baquetas sem bateria: no pad de estudo · pulso: o metrônomo.')
        return c
    L.add('jeitos', 'conheça a bateria', jeitos)

    # arte para colorir
    def arte(n, pid):
        def f(L):
            return f'<section class="page full"><img src="img/color{n}.jpg" style="position:absolute;inset:0;width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply"><div class="ft"><span>BEATERISTA | ROBOTERISTA ENSINA</span><span>{L.pg(pid)}</span></div></section>'
        return f
    L.add('color1', 'para colorir', arte(1, 'color1'), 'raw')
