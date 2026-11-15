#!/usr/bin/env python3
"""Remove o fundo de uma foto (rembg, modelo isnet-general-use) e põe contorno branco de figurinha.
Uso: python3 scripts/foto-recorta.py entrada.jpg saida.png [contorno_px=14]   (pip install rembg onnxruntime)"""
import sys
import numpy as np
from scipy import ndimage
from PIL import Image, ImageFilter
from rembg import remove, new_session
_s = None
def recorta(im, borda=14):
    global _s; _s = _s or new_session('isnet-general-use')
    im = im.convert('RGB'); im.thumbnail((1400, 1800)); o = remove(im, session=_s); a = o.getchannel('A').point(lambda v: 255 if v > 128 else 0)
    lab, n = ndimage.label(np.asarray(a) > 0)  # tira as sobrinhas soltas: fica só o que tem pelo menos 8% do pedaço maior
    if n > 1:
        tam = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); ok = [i + 1 for i, v in enumerate(tam) if v >= .08 * tam.max()]
        a = Image.fromarray((np.isin(lab, ok) * 255).astype('uint8')); o.putalpha(a)
    bb = a.getbbox(); o = o.crop(bb); a = a.crop(bb); m = borda * 2
    tela = Image.new('RGBA', (o.width + 2 * m, o.height + 2 * m), (0, 0, 0, 0)); al = Image.new('L', tela.size, 0); al.paste(a, (m, m))
    cont = al.filter(ImageFilter.MaxFilter(borda * 2 + 1)).filter(ImageFilter.GaussianBlur(1.2))
    tela.paste(Image.new('RGBA', tela.size, (255, 255, 255, 255)), (0, 0), cont); o.putalpha(a.filter(ImageFilter.GaussianBlur(.8))); tela.alpha_composite(o, (m, m)); return tela
if __name__ == '__main__':
    recorta(Image.open(sys.argv[1]), int(sys.argv[3]) if len(sys.argv) > 3 else 14).save(sys.argv[2])
