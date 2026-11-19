#!/usr/bin/env python3
"""Prévias da Lojinha: pega as 3 primeiras imagens de cada material (as que a Lojinha mostra), reduz e marca.
- marca visível: "jogos.beaterista.com.br" na diagonal, repetida, em toda a imagem
- marca quase invisível: o aviso de direitos repetido em contraste mínimo (sobrevive a recorte e a captura de tela)
- metadados: direitos autorais no EXIF
Uso: python3 scripts/marca-previas.py   (lê js/loja-config.js e grava em assets/loja/previa/). Os originais em alta NÃO ficam mais no site: estão no git (commit 5fd358c, assets/loja/d-*.webp). Pra refazer, ponha-os em assets/loja/ de novo."""
import re, io
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
SRC = (ROOT / 'js/loja-config.js').read_text(encoding='utf-8')
OUT = ROOT / 'assets/loja/previa'; OUT.mkdir(parents=True, exist_ok=True)
MAXIMOS = 3
import sys
ORIG = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'assets/loja'  # pasta com os originais em alta (d-*.webp)
LADO = 760  # maior lado em px: dá pra ver o que tem, não dá pra imprimir
TEXTO = 'jogos.beaterista.com.br'
AVISO = '© Beaterista - Beatriz Marques - conteúdo protegido - jogos.beaterista.com.br - proibido remover esta marca, recortar ou reproduzir - prévia, não é o material completo'
FONT = next((p for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf'] if Path(p).exists()), None)

def camada_diagonal(w, h, texto, tam, cor, graus=-30, passo_x=1.35, passo_y=2.6):
    # desenha numa tela maior e gira, pra cobrir os cantos
    d = int((w * w + h * h) ** 0.5) + 40
    t = Image.new('RGBA', (d, d), (0, 0, 0, 0)); dr = ImageDraw.Draw(t)
    f = ImageFont.truetype(FONT, tam) if FONT else ImageFont.load_default()
    tw = dr.textlength(texto, font=f); y = 0; linha = 0
    while y < d:
        x = -int(tw) + (int(tw * passo_x / 2) if linha % 2 else 0)
        while x < d:
            dr.text((x, y), texto, font=f, fill=cor); x += int(tw * passo_x)
        y += int(tam * passo_y); linha += 1
    t = t.rotate(-graus, resample=Image.BICUBIC)
    return t.crop(((d - w) // 2, (d - h) // 2, (d - w) // 2 + w, (d - h) // 2 + h))

def marca(im, capa=False):
    im = im.convert('RGB'); im.thumbnail((LADO, LADO), Image.LANCZOS); w, h = im.size
    base = im.convert('RGBA')
    tam = max(16, w // 15)
    if not capa:  # a CAPA (1ª imagem de cada material) aparece normal, sem marca visível; da 2ª em diante entra o jogos.beaterista.com.br na diagonal
        base = Image.alpha_composite(base, camada_diagonal(w, h, TEXTO, tam, (0, 0, 0, 70), passo_y=3.0))      # sombra
        base = Image.alpha_composite(base, camada_diagonal(w - 0, h - 0, TEXTO, tam, (255, 255, 255, 110), passo_y=3.0))  # claro por cima
    # quase invisível: aviso em contraste mínimo, em outro ângulo e em letra miúda
    base = Image.alpha_composite(base, camada_diagonal(w, h, AVISO, max(9, w // 55), (128, 128, 128, 7), graus=14, passo_x=1.05, passo_y=2.2))
    return base.convert('RGB')

usados = []; capas = set(); segundas = set()
for m in re.finditer(r"fotos: \[([^\]]*)\]", SRC):
    lista = re.findall(r"'([^']+)'", m.group(1))[:MAXIMOS]
    usados += lista; capas.add(lista[0]); segundas.update(lista[1:])
exif = Image.Exif(); exif[0x8298] = '© Beaterista - Beatriz Marques - jogos.beaterista.com.br'; exif[0x010E] = 'Prévia protegida. Não remover a marca nem reproduzir.'
for rel in dict.fromkeys(usados):
    src = ORIG / Path(rel).name; dst = OUT / src.name
    marca(Image.open(src), capa=rel in capas and rel not in segundas).save(dst, 'WEBP', quality=70, method=6, exif=exif.tobytes())
    print(src.name, dst.stat().st_size // 1024, 'KB')
