#!/usr/bin/env python3
"""Transforma um Paul colorido em desenho pra colorir (traço preto, fundo transparente).
Uso: python3 scripts/paul-traco.py [nome ...]   (sem nome = todos de coloridos-hd). Precisa de opencv: pip install opencv-python-headless
Saída em assets/originals/paul-png/pra-colorir/: traco/paul-NOME.png (só contorno) e sombra/paul-NOME.png (contorno + sombra cinza clarinha)."""
import glob, os, sys
import cv2, numpy as np
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(RAIZ, 'assets/originals/paul-png/pra-colorir')
so = set(sys.argv[1:])
for f in sorted(glob.glob(os.path.join(RAIZ, 'assets/originals/paul-png/coloridos-hd/paul-*.png'))):
    nome = os.path.basename(f)[5:-4]
    if so and nome not in so: continue
    im = cv2.imread(f, cv2.IMREAD_UNCHANGED)
    im = cv2.resize(im, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)  # o dobro, pra o traço sair liso na impressão
    a = im[..., 3].astype(np.float32) / 255
    v = cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2HSV)[..., 2]
    v = cv2.GaussianBlur(cv2.medianBlur(v, 13), (0, 0), 2.2).astype(np.float32)
    linha = np.clip((66 - v) / 10, 0, 1) * (a > .5)          # 1 = preto (contorno, visor, olhos da nota)
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    linha = cv2.morphologyEx(linha, cv2.MORPH_OPEN, k)        # tira os pontinhos do giz
    for pasta, cinza in (('traco', None), ('sombra', .22)):
        os.makedirs(os.path.join(OUT, pasta), exist_ok=True)
        if cinza is None:
            rgba = np.dstack([np.zeros_like(linha)] * 3 + [linha]) * 255
        else:
            g = cv2.GaussianBlur(cv2.cvtColor(im[..., :3], cv2.COLOR_BGR2GRAY), (0, 0), 3).astype(np.float32) / 255
            tom = 1 - (1 - g) * cinza                         # sombra bem clarinha, dá pra pintar por cima
            cor = np.minimum(tom, 1 - linha)
            alfa = np.maximum(linha, np.clip(a * 1.2, 0, 1))
            rgba = np.dstack([cor, cor, cor, alfa]) * 255
        cv2.imwrite(os.path.join(OUT, pasta, f'paul-{nome}.png'), rgba.astype(np.uint8))
    print(nome, linha.shape)
