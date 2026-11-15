#!/usr/bin/env python3
"""Tira a fita "SEMANA NN" dos 12 stories do Robôterista Paul SEM mudar o desenho (a Bea gosta do design original; só não quer o semanal).
Acha a fita kraft, apaga com a cor do papel em volta (borda suavizada).
Uso: python3 marketing/ferramentas/tira_semana.py   -> marketing/prontos/stories-temas-original/"""
import glob, os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
R = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))); P = R + '/marketing/prontos'
NOMES = ['apresentacao', 'rotina-e-treino', 'figuras-e-tempo', 'cantar-e-ouvir', 'tocar-em-banda', 'estudo-em-casa', 'resultados', 'diversao', 'natal', 'ferias', 'volta-as-aulas', 'sonhos']
os.makedirs(P + '/stories-temas-original', exist_ok=True)
for i, f in enumerate(sorted(glob.glob(P + '/stories-semanas/semana_*.jpg'))):
    im = Image.open(f).convert('RGB'); a = np.asarray(im).astype(int); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    fita = (r > 195) & (r < 248) & (g > 150) & (g < 212) & (b > 100) & (b < 178) & (r - b > 48)
    fita[:330] = False; fita[600:] = False
    lab, n = ndimage.label(ndimage.binary_closing(fita, iterations=6)); tam = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1)); k = int(np.argmax(tam)) + 1
    ys, xs = np.where(lab == k); y0, y1, x0, x1 = ys.min() - 12, ys.max() + 5, xs.min() - 22, xs.max() + 22  # folga pequena embaixo: o título fica logo depois da fita
    # cor do papel: mediana de uma moldura em volta da fita, só pixels claros (pula o traço dos desenhos vizinhos)
    borda = np.concatenate([a[y0 - 14:y0 - 4, x0:x1].reshape(-1, 3), a[y1 + 4:y1 + 14, x0:x1].reshape(-1, 3)]); borda = borda[borda.sum(1) > 640]
    papel = tuple(int(v) for v in np.median(borda, 0))
    m = Image.new('L', im.size, 0); m.paste(255, (x0, y0, x1, y1)); m = m.filter(ImageFilter.GaussianBlur(3))
    im.paste(Image.new('RGB', im.size, papel), (0, 0), m)
    im.save(f'{P}/stories-temas-original/tema-{i + 1:02d}-{NOMES[i]}.jpg', quality=93); print(NOMES[i], (x0, y0, x1, y1), papel)
