#!/usr/bin/env python3
"""Recorta uma folha de 8 Pauls (4 colunas x 2 linhas, fundo transparente) pelo CONTORNO de cada desenho (nunca por grade fixa).
Uso: python3 scripts/paul-recortar-folha.py FOLHA.png PASTA_SAIDA   (precisa de scipy: pip install scipy)"""
import os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
POSES = ['lendo-partitura', 'ouvindo', 'pad', 'escrevendo', 'colorindo', 'pad-metronomo', 'mostrando-partitura', 'estante']
folha, saida = sys.argv[1], sys.argv[2]
im = Image.open(folha).convert('RGBA'); W, H = im.size
a = np.array(im.getchannel('A')) > 40
def celulas(m):
    lab, k = ndi.label(m); tam = ndi.sum(a, lab, range(1, k + 1)); cel = {}
    for i in range(1, k + 1):
        if tam[i - 1] < 60: continue
        cy, cx = ndi.center_of_mass(a, lab, i)
        cel.setdefault((int(cy >= H / 2), min(3, int(cx / (W / 4)))), []).append(i)
    return lab, cel
lab, cel = celulas(ndi.binary_dilation(a, iterations=3))
largo = max(sl[1].stop - sl[1].start for sl in ndi.find_objects(lab) if sl)
if len(cel) < 8 or largo > 0.36 * W:  # desenhos encostados: separa na coluna mais vazia perto de cada divisa
    b = a.copy()
    for r in (0, 1):
        faixa = a[r * H // 2:(r + 1) * H // 2]
        for c in (1, 2, 3):
            x0 = c * W // 4; col = faixa[:, x0 - 70:x0 + 70].sum(0); b[r * H // 2:(r + 1) * H // 2, x0 - 70 + int(col.argmin())] = False
    b[H // 2 - 60 + int(a[H // 2 - 60:H // 2 + 60].sum(1).argmin())] = False
    lab, cel = celulas(b)
os.makedirs(saida, exist_ok=True)
for (r, c), ids in sorted(cel.items()):
    m = np.isin(lab, ids); ys, xs = np.where(m & a)
    arr = np.array(im); arr[..., 3] = np.where(m, arr[..., 3], 0)
    cut = Image.fromarray(arr).crop((max(0, xs.min() - 4), max(0, ys.min() - 4), min(W, xs.max() + 5), min(H, ys.max() + 5)))
    cut.save(os.path.join(saida, f'paul-{POSES[r * 4 + c]}.png')); print(POSES[r * 4 + c], cut.size)
