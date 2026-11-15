#!/usr/bin/env python3
"""Monta o KIT do perfil @jogos.beaterista: pastas numeradas por dia (arquivos na ordem + LEGENDA.txt), GUIA.html (vira PDF) e o zip.
Uso: python3 scripts/kit-perfil-jogos.py PASTA_SAIDA   (depois: node scripts/kit-perfil-jogos-pdf.mjs PASTA_SAIDA)"""
import os, shutil, subprocess, sys, html
from PIL import Image
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__))); M = R + '/marketing/prontos'; OUT = sys.argv[1]
TAGS = '#aulademusica #educacaomusical #musicalizacaoinfantil #aprendermusica #jogosmusicais'
HOT = 'https://pay.hotmart.com/H108493301A'
car = lambda n, k: [f'carrosseis/{n}_{i}.jpg' for i in range(1, k + 1)]
# (título do dia, [(tipo, [arquivos], legenda, observação)])
DIAS = [
 ('apresentação: o Paul', [('post', ['apresentacao/apresentacao-1-paul.jpg'], 'oi, eu sou o paul 🥁 o robô baterista da beaterista. aqui a gente joga, aprende música e depois toca de verdade. começa grátis, link na bio.', 'FIXAR no topo do perfil (1º fixado).'),
   ('story', ['stories-semanas/semana_01.jpg'], '', 'figurinha de link pro site: jogos.beaterista.com.br')]),
 ('apresentação: a Beaterista', [('post', ['apresentacao/apresentacao-2-beaterista.jpg'], 'a beaterista é uma escola de música em araçatuba, sp. aqui a música acontece na sala de aula e no palco, e agora também na tela: jogos e materiais pra estudar em casa. link na bio.', 'FIXAR (2º fixado). marcar @beaterista_.')]),
 ('apresentação: a Bea', [('post', ['apresentacao/serie-bea/bea-1-oi-eu-sou-a-bea.jpg'], 'oi, eu sou a bea! professora de bateria e fundadora da beaterista. quando um aluno trava, eu penso: como transformar isso num desafio que ele queira tentar de novo? foi assim que nasceram os jogos 🥁 link na bio.', 'FIXAR (3º fixado). marcar @beaterista_. se quiser, trocar por um vídeo seu falando: rende mais que arte.')]),
 ('o que é o jogo', [('reel', ['reels/17_beat_hero.mp4'], 'parece videogame. é aula de ritmo 🥁 cada cor é uma peça da bateria. jogue grátis, link na bio.', '')]),
 ('pra pais: o que cada jogo treina', [('carrossel', car('jogos_ensinam', 7), 'seu filho joga. olha o que ele treina: coordenação, frações, escuta, atenção e planejamento. arrasta pro lado. link na bio.', '')]),
 ('por que o nome Paul?', [('post', ['@porque'], 'por que robôterista paul? é uma homenagem a paul mccartney 🎸 conta aqui: qual é a sua música favorita dos beatles?', 'pergunta no fim pra puxar comentário.')]),
 ('pra pais: parece só joguinho', [('reel', ['reels/04_pais_parece_so_joguinho.mp4'], 'parece só joguinho. mas ele tá treinando ritmo, coordenação e escuta, e depois vai pra baqueta. começa grátis, link na bio.', ''),
   ('story', ['stories/story_enquete_1.jpg'], '', 'figurinha de enquete: "sim" / "ainda não".')]),
 ('novidade: livro de colorir', [('post', ['colorir/colorir-post-1-novidade.jpg'], 'novidade na lojinha: o robôterista paul para colorir 🖍️ 50 páginas pra imprimir e pintar do seu jeito. link na bio.', ''),
   ('story', ['colorir/colorir-story-1-novidade.jpg'], '', f'figurinha de link: {HOT}')]),
 ('lendo partitura brincando', [('reel', ['reels/12_achar_na_pauta.mp4'], 'seu filho lendo partitura. e achando que é jogo 🎼 começa grátis, link na bio.', '')]),
 ('o que tem no livro de colorir', [('post', ['colorir/colorir-post-2-o-que-tem.jpg'], 'o que tem no livro de colorir do paul? baterista, guitarrista, a banda inteira, percussão corporal e uma página pra você se desenhar na banda. 50 páginas, link na bio.', ''),
   ('story', ['colorir/colorir-story-2-pinte.jpg'], '', f'figurinha de link: {HOT}')]),
 ('apostila pela metade do preço', [('reel', ['reels/21_apostila_bateria_start.mp4'], 'a apostila do meu curso de bateria: 44 páginas pra começar do zero. link na bio.', ''),
   ('story', ['stories/story_apostila_prazo.jpg'], '', 'figurinha de link pra apostila na lojinha.')]),
 ('o que tem no passe', [('carrossel', car('passe_carrossel', 7), 'o que tem dentro do passe beaterista? arrasta pra ver. link na bio.', ''),
   ('story', ['stories/story_passe.jpg'], '', 'figurinha de link pro app.')]),
 ('combo de apostilas', [('reel', ['reels/14_combo_4_apostilas.mp4'], '4 apostilas pra aprender música brincando: ritmo, harmonia, 48 atividades e jogo da memória. tudo num combo só, link na bio.', '')]),
]
# série "a Bea e a escola" (fotos novas) entra intercalada; a apostila sobe na fila por causa do prazo (30/nov)
B = lambda n: [f'apresentacao/serie-bea/bea-{n}.jpg']
DIAS += [
 ('educação musical com propósito', [('post', B('2-educacao-com-proposito'), 'educação musical com propósito: esse é o lema da beaterista 🥁 na sala de aula, no palco e agora também na tela. vem tocar com a gente, link na bio.', 'marcar @beaterista_.')]),
 ('da sala de aula pro palco', [('post', B('3-da-sala-pro-palco'), 'na beaterista a música acontece em sala de aula e no palco. e quem ainda não pode vir até araçatuba começa pelos jogos. link na bio.', 'marcar @beaterista_.')]),
 ('eu ensino o que eu toco', [('post', B('4-eu-ensino-o-que-eu-toco'), 'os exercícios que eu estudo são os mesmos que eu ensino e levo pro palco. do palco pra aula 🥁 link na bio.', '')]),
 ('não é só bateria', [('post', B('5-nao-e-so-bateria'), 'não é só bateria: violão, guitarra, baixo e teclado também têm lugar aqui. qual é o seu instrumento? conta nos comentários 👇', 'pergunta no fim pra puxar comentário.')]),
]
ORDEM = [0, 1, 2, 3, 14, 4, 11, 5, 15, 6, 7, 8, 16, 9, 10, 17, 12, 13]
DIAS = [DIAS[i] for i in ORDEM]
shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT + '/_mini')
# 00: perfil
p0 = OUT + '/00 - perfil (fazer antes de postar)'; os.makedirs(p0 + '/capas dos destaques')
for f in sorted(os.listdir(M + '/destaques')): shutil.copy(f'{M}/destaques/{f}', p0 + '/capas dos destaques/')
open(p0 + '/LEIA.txt', 'w').write("""PERFIL @jogos.beaterista: arrumar antes do primeiro post

1. BIO (a que você já escreveu está ótima):
   🎮 jogos musicais com o Robôterista Paul
   🥁 aprenda na tela. depois, mão na massa.
   👇 jogue grátis e explore os materiais
2. LINK DA BIO: jogos.beaterista.com.br
3. DESTAQUES: criar com as capas da pasta "capas dos destaques" (o Instagram mostra só o círculo do meio).
   ordem: o que é · jogos · pais · profs · álbum · lojinha
4. FIXADOS: os 3 posts de apresentação (dias 01, 02 e 03) ficam fixados no topo, nessa ordem.
5. HORÁRIO: postar na hora em que seus seguidores estão online (Insights do Instagram ou "melhores horários" do Metricool).
""")
linhas = []
def mini(src, nome):
    d = f'{OUT}/_mini/{nome}.jpg'
    if src.endswith('.mp4'): subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-ss', '1.5', '-i', src, '-frames:v', '1', '-vf', 'scale=220:-1', d], check=True)
    else: im = Image.open(src).convert('RGB'); im.thumbnail((220, 400)); im.save(d, quality=80)
    return '_mini/' + nome + '.jpg'
for i, (tit, pecas) in enumerate(DIAS, 1):
    pasta = f'{OUT}/dia {i:02d} - {tit.replace(":", " -").replace("?", "")}'; os.makedirs(pasta); leg = [f'DIA {i:02d} · {tit}', '']; k = 0; cel = []
    for tipo, arqs, texto, obs in pecas:
        nomes = []
        for a in arqs:
            k += 1; ext = '.jpg' if a == '@porque' else os.path.splitext(a)[1]; nome = f'{k:02d} - {tipo}{ext}'; dst = f'{pasta}/{nome}'
            if a == '@porque': Image.open(R + '/assets/originals/artes-beaterista/cartazes-paul/post-por-que-paul.webp').convert('RGB').save(dst, quality=93)
            else: shutil.copy(f'{M}/{a}', dst)
            nomes.append(nome)
        leg += [f'[{tipo.upper()}] ' + (nomes[0] if len(nomes) == 1 else f'{nomes[0]} até {nomes[-1]} (nessa ordem)')]
        if texto: leg += ['legenda:', texto, TAGS]
        if obs: leg += ['obs: ' + obs]
        leg += ['']
        cel.append((tipo, nomes, texto, obs, mini(f'{pasta}/{nomes[0]}', f'd{i:02d}-{k:02d}')))
    open(pasta + '/LEGENDA.txt', 'w').write('\n'.join(leg)); linhas.append((i, tit, cel))
e = html.escape
H = ['''<!doctype html><meta charset="utf-8"><style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font-family:Helvetica,Arial,sans-serif;color:#10234a;font-size:11.5pt;line-height:1.35}
h1{font-size:30pt;margin:0 0 4pt}h2{font-size:15pt;margin:0 0 6pt;color:#a8182e}.capa{height:250mm;display:flex;flex-direction:column;justify-content:center;background:#10234a;color:#f4ead8;padding:20mm;border-radius:6mm}
.capa h1{font-size:40pt;color:#f2b632}.capa p{font-size:14pt}.d{break-inside:avoid;border:1.5pt solid #10234a;border-radius:4mm;padding:5mm;margin:0 0 5mm}.d .n{font-weight:700;font-size:13pt;margin-bottom:3mm}
.pc{display:flex;gap:5mm;margin-top:3mm}.pc img{width:26mm;border-radius:2mm;border:1pt solid #999;align-self:flex-start}.t{display:inline-block;background:#a8182e;color:#fff;border-radius:99px;padding:1pt 8pt;font-size:9.5pt;font-weight:700;text-transform:uppercase}
.l{background:#f4ead8;border-radius:2mm;padding:3mm;margin:2mm 0;font-size:11pt}.o{font-size:10pt;color:#a8182e;font-weight:700}.a{font-size:9.5pt;color:#555}li{margin-bottom:2mm}.q{break-before:page}</style>
<div class="capa"><p>KIT DO PERFIL</p><h1>@jogos.beaterista</h1><p>a ordem dos primeiros 18 dias: o que postar, em que sequência, com a legenda pronta.</p><p style="font-size:11pt;margin-top:20mm">Beaterista escola de música · jogos.beaterista.com.br</p></div>
<div class="q"><h2>antes de postar</h2><ol><li><b>bio:</b> a sua já está boa (jogos musicais com o Robôterista Paul · aprenda na tela, depois mão na massa · jogue grátis e explore os materiais).</li><li><b>link da bio:</b> jogos.beaterista.com.br</li><li><b>destaques:</b> criar com as capas da pasta "00 - perfil". ordem: o que é · jogos · pais · profs · álbum · lojinha.</li><li><b>fixados:</b> os posts dos dias 01, 02 e 03 ficam fixados no topo. quem chega no perfil entende em 3 quadros: quem é o Paul, o que é a Beaterista e quem é você.</li><li><b>horário:</b> use os horários em que os seguidores estão online (Insights do Instagram ou "melhores horários" do Metricool).</li></ol>
<h2>a lógica da ordem</h2><ol><li><b>dias 01 a 03, apresentação:</b> o Paul, a escola e a Bea. nada de venda.</li><li><b>dias 04 a 10, o que é e pra quem é:</b> o jogo funcionando, o lema da escola, o que cada jogo ensina, a história do nome. quase sem vender.</li><li><b>dias 11 em diante, os materiais:</b> livro de colorir, apostila, passe e combo, intercalados com posts seus (eu ensino o que eu toco, não é só bateria).</li></ol>
<h2>como usar o zip</h2><p>cada pasta é um dia. dentro, os arquivos estão numerados na ordem de postar e o <b>LEGENDA.txt</b> traz o texto pronto pra copiar. carrossel: subir as imagens na ordem dos números.</p>
<h2>avisos</h2><ul><li>sem preço e sem data em nenhuma peça (pedido da Bea); o gibi/jornal não entra no kit.</li><li><b>livro de colorir:</b> o link direto é ''' + HOT + '''</li><li>a conta está com restrição temporária pra conectar aplicativos: enquanto isso, postar na mão. os posts em si não são afetados.</li></ul></div><div class="q"></div>''']
for i, tit, cel in linhas:
    H.append(f'<div class="d"><div class="n">dia {i:02d} · {e(tit)}</div>')
    for tipo, nomes, texto, obs, m in cel:
        arq = nomes[0] if len(nomes) == 1 else f'{nomes[0]} até {nomes[-1]}'
        H.append(f'<div class="pc"><img src="{m}"><div><span class="t">{tipo}</span> <span class="a">{e(arq)}</span>' + (f'<div class="l">{e(texto)}<br><span class="a">{TAGS}</span></div>' if texto else '') + (f'<div class="o">{e(obs)}</div>' if obs else '') + '</div></div>')
    H.append('</div>')
open(OUT + '/GUIA.html', 'w').write('\n'.join(H)); print(len(DIAS), 'dias')
